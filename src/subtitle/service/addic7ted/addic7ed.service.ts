import axios from 'axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchResponse } from './model/search-response.interface';
import { SubtitleResponse } from './model/subtitle-response.interface';
import { Subtitle } from '../../model/subtitle.interface';
import { FeatureType, SearchOptions, SubtitleProviders } from '../../model';
import { TvdbService } from '../tvdb/tvdb.service';

@Injectable()
export class Addic7edService {
  private baseUrl: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly tvdbService: TvdbService,
  ) {
    this.baseUrl = this.configService.getOrThrow('ADICC7ED_API_URL');
  }

  private async getShowByTvdbId(id: string) {
    const baseUrl = this.configService.getOrThrow('ADICC7ED_API_URL');
    const response = await axios.get<SearchResponse>(
      `${baseUrl}/shows/external/tvdb/${id}`,
    );
    return response.data.shows[0];
  }

  private mapSubtitleResponseToSubtitle(
    subtitleResponse: SubtitleResponse,
  ): Subtitle[] {
    const { matchingSubtitles, episode } = subtitleResponse;

    const { season, number, title, show } = episode;

    const subtitles: Subtitle[] = matchingSubtitles.map((matchingSubtitle) => {
      const {
        subtitleId,
        version = '',
        //completed = false,
        //hearingImpaired = false,
        //corrected = false,
        //hd = false,
        downloadUri,
        //language = '',
        discovered: subtitleDiscovered,
        //downloadCount = 0,
      } = matchingSubtitle;

      return {
        originId: subtitleId,
        provider: SubtitleProviders.Addic7ted,
        fileId: subtitleId,
        createdOn: subtitleDiscovered,
        url: downloadUri,
        releaseName: version,
        featureDetails: {
          featureType: FeatureType.Episode,
          title,
          featureName: show,
          seasonNumber: season,
          episodeNumber: number,
        },
        comments: '',
      };
    });

    return subtitles;
  }

  async searchSubtitles(searchOptions: SearchOptions) {
    const tvdbShowData = await this.tvdbService.getShowByIMDBId(
      searchOptions.imdbId,
    );

    const addic7edShowData = await this.getShowByTvdbId(
      tvdbShowData.id.toString(),
    );

    if (searchOptions.featureType === FeatureType.Episode) {
      const response = await axios.get<SubtitleResponse>(
        `${this.baseUrl}/subtitles/get/${addic7edShowData.id}/${searchOptions.seasonNumber}/${searchOptions.episodeNumber}/${searchOptions.language}`,
      );
      const mappedSubtitles = this.mapSubtitleResponseToSubtitle(response.data);
      return mappedSubtitles;
    }
  }

  async downloadSubtitle(fileId: string) {
    try {
      const response = await axios.get<string>(
        `${this.baseUrl}/subtitles/download/${fileId}`,
        {
          responseType: 'text',
        },
      );
      if (response.status >= 200 && response.status < 300) {
        return response.data;
      } else {
        throw new Error(`Request failed with status ${response.status}`);
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
