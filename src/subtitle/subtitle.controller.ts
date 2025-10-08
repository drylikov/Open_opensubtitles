import {
  Body,
  Controller,
  Get,
  Query,
  Res,
  StreamableFile,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { SubtitleService } from './service/subtitle.service';
import type { Response } from 'express';
import { SearchOptions, SubtitleProviders } from './model';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Controller('subtitle')
export class SubtitleController {
  constructor(private readonly subtitleService: SubtitleService) {}

  @Get()
  async getSubtitle(
    @Res() res: Response,
    @Query('fileId') fileId: string,
    @Query('provider') provider: SubtitleProviders,
  ) {
    const subtitle = await this.subtitleService.getSubtitle(fileId, provider);

    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename=${fileId}.srt`,
    });

    const enc = new TextEncoder();

    new StreamableFile(enc.encode(subtitle)).getStream().pipe(res);
  }

  //TODO: validation
  @Post('search')
  @UseInterceptors(CacheInterceptor)
  async searchSubtitles(@Body() searchOptions: SearchOptions) {
    return await this.subtitleService.searchSubtitles(searchOptions);
  }
}
