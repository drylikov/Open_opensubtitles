import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import jwt from 'jsonwebtoken';
import {
  AuthResponse,
  DownloadRequestResponse,
  SearchParams,
  SubtitleSearchResponse,
} from './model';
import { ConfigService } from '@nestjs/config';
import { Subtitle } from '../../model/subtitle.interface';
import { FeatureType, SearchOptions, SubtitleProviders } from '../../model';

@Injectable()
export class OpensubtitlesService {
  private baseApiUrl: string;
  private apiKey: string;
  private userAgent: string;
  private token: string;

  constructor(private readonly configService: ConfigService) {
    this.baseApiUrl = this.configService.getOrThrow('OB_API_URL');
    this.apiKey = this.configService.getOrThrow('OB_API_KEY');
    this.userAgent = this.configService.getOrThrow('USER_AGENT');
  }

  private getHeaders(): Record<string, string> {
    return {
      Accept: 'application/json',
      'Api-Key': this.apiKey,
      'Content-Type': 'application/json',
      'User-Agent': this.userAgent,
    };
  }

  private isTokenExpired(): boolean {
    try {
      const decodedToken: any = jwt.decode(this.token);

      if (!decodedToken || typeof decodedToken.exp !== 'number') {
        return true;
      }

      const currentTimestamp: number = Math.floor(Date.now() / 1000);

      return decodedToken.exp < currentTimestamp;
    } catch (error) {
      return true;
    }
  }

  private async authenticate() {
    if (this.isTokenExpired()) {
      const headers = this.getHeaders();

      const loginRequestData = {
        username: this.configService.getOrThrow('OB_USERNAME'),
        password: this.configService.getOrThrow('OB_PASSWORD'),
      };

      try {
        const response = await axios.post<AuthResponse>(
          `${this.baseApiUrl}/login`,
          loginRequestData,
          {
            headers,
          },
        );

        if (!response.data.token) {
          throw new UnauthorizedException('Login error, token not found');
        }
        if (response.status >= 200 && response.status < 300) {
          this.token = response.data.token;
        } else {
          throw new UnauthorizedException(
            `Request failed with status ${response.status}`,
          );
        }
      } catch (error) {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  private mapSearchResponseToSubtitle(
    searchResponse: SubtitleSearchResponse,
  ): Subtitle[] {
    return searchResponse.data.map((datum) => {
      const featureDetails = datum.attributes.feature_details;
      const subtitle: Subtitle = {
        originId: datum.id,
        provider: SubtitleProviders.Opensubtitles,
        fileId: datum.attributes.subtitle_id,
        createdOn: datum.attributes.upload_date,
        url: datum.attributes.url,
        comments: datum.attributes.comments,
        releaseName: datum.attributes.release,
        featureDetails: {
          featureType: datum.attributes.feature_details.feature_type,
          year: featureDetails.year,
          title: featureDetails.title,
          featureName: featureDetails.movie_name,
          imdbId: `tt${featureDetails.imdb_id}`,
          seasonNumber: featureDetails.season_number,
          episodeNumber: featureDetails.episode_number,
        },
      };
      return subtitle;
    });
  }

  async getFeatureByIMDBId(id: string) {
    const headers = this.getHeaders();

    const response = await axios.get(
      `${this.baseApiUrl}/features?imdb_id=${id}`,
      { headers },
    );
    return response.data.data[0];
  }

  async searchSubtitles(searchOptions: SearchOptions): Promise<Subtitle[]> {
    const headers = this.getHeaders();
    const subtitles: Subtitle[] = [];

    try {
      let currentPage = 1;
      let totalPages = 1; // Initialize totalPages to a non-zero value to enter the loop

      while (currentPage <= totalPages) {
        const searchParams: SearchParams = {
          imdb_id: searchOptions.imdbId.split('tt')[1],
          languages: searchOptions.language,
          type: searchOptions.featureType,
          year: searchOptions.year.toString(),
          page: currentPage.toString(),
        };

        if (searchOptions.featureType === FeatureType.Episode) {
          searchParams.season_number = searchOptions.seasonNumber.toString();
          searchParams.episode_number = searchOptions.episodeNumber.toString();
        }

        const urlWithParams = `${
          this.baseApiUrl
        }/subtitles?${new URLSearchParams(searchParams)}`;

        const response: AxiosResponse<SubtitleSearchResponse> = await axios.get(
          urlWithParams,
          { headers },
        );

        if (response.status >= 200 && response.status < 300) {
          // Append the subtitles from the current page to the result array
          subtitles.push(...this.mapSearchResponseToSubtitle(response.data));

          // Update totalPages based on the response
          totalPages = response.data.total_pages;

          // Move to the next page
          currentPage++;
        } else {
          throw new Error(`Request failed with status ${response.status}`);
        }
      }

      return subtitles;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  private async requestDownload(
    fileId: string,
  ): Promise<DownloadRequestResponse> {
    await this.authenticate();
    const headers = {
      ...this.getHeaders(),
      Authorization: `Bearer ${this.token}`,
    };

    const requestData = {
      file_id: fileId,
    };

    try {
      const response: AxiosResponse<DownloadRequestResponse> = await axios.post(
        `${this.baseApiUrl}/download`,
        requestData,
        {
          headers,
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

  async downloadSubtitle(fileId: string): Promise<string> {
    try {
      const { link } = await this.requestDownload(fileId);
      const response = await axios.get<string>(link, {
        responseType: 'text',
      });
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
