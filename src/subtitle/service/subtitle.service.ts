import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import Fuse, { FuseResult } from 'fuse.js';
import { OpensubtitlesService } from './opensubtitles/os.service';
import { S3StorageStrategy } from '../../storage/strategy/s3-storage.strategy';
import { Subtitle, SubtitleProviders } from '../model';
import { SearchOptions } from '../model/search-options.interface';
import { Addic7edService } from './addic7ted/addic7ed.service';

@Injectable()
export class SubtitleService {
  constructor(
    private readonly opensubtitlesClient: OpensubtitlesService,
    private readonly s3StorageStrategy: S3StorageStrategy,
    private readonly addic7edService: Addic7edService,
  ) {}

  async searchSubtitles(
    searchOptions: SearchOptions,
  ): Promise<FuseResult<Subtitle>[]> {
    const opensubtitlesPromise =
      this.opensubtitlesClient.searchSubtitles(searchOptions);

    const addic7edPromise = this.addic7edService.searchSubtitles(searchOptions);

    const results = await Promise.all([opensubtitlesPromise, addic7edPromise]);
    const combinedResults = results.flat();

    const fuse = new Fuse(combinedResults, {
      keys: ['releaseName', 'comments'],
      ignoreLocation: true,
    });

    const fuseResult = fuse.search(searchOptions.query);
    return fuseResult;
  }

  async cacheSubtitle(filename: string, content: string) {
    return await this.s3StorageStrategy.uploadFile(filename, content);
  }

  async getSubtitle(
    fileId: string,
    provider: SubtitleProviders,
  ): Promise<string> {
    if (!fileId || !provider) {
      throw new BadRequestException(
        'Cannot get subtitle: file id or provider is invalid',
      );
    }

    try {
      const subtitle = await this.s3StorageStrategy.getFile(fileId);
      return subtitle;
    } catch (error) {
      let file: string;
      //TODO: add more providers
      switch (provider) {
        case SubtitleProviders.Opensubtitles:
          file = await this.opensubtitlesClient.downloadSubtitle(fileId);
        case SubtitleProviders.Addic7ted:
          file = await this.addic7edService.downloadSubtitle(fileId);
      }

      Logger.debug(fileId);
      this.cacheSubtitle(fileId, file);
      return file;
    }
  }
}
