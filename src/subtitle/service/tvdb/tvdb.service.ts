import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { SearchResult, ShowData } from './model/search-result.interface';

@Injectable()
export class TvdbService {
  private token: string;
  constructor(private readonly configService: ConfigService) {}

  isTokenExpired(): boolean {
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
    try {
      if (this.isTokenExpired()) {
        const baseUrl = this.configService.getOrThrow('TVDB_API_URL');
        const apiKey = this.configService.getOrThrow('TVDB_API_KEY');
        const loginResult = await axios.post<{
          status: string;
          data: { token: string };
        }>(`${baseUrl}/login`, {
          apiKey,
          pin: '1234', // for some reason you need to pass this
        });

        if (
          loginResult.data.status !== 'success' ||
          !loginResult.data.data.token
        ) {
          throw new UnauthorizedException(
            'Authentication failed or token not received.',
          );
        }

        this.token = loginResult.data.data.token;
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getShowByIMDBId(imdbId: string): Promise<ShowData> {
    await this.authenticate();
    const baseUrl = this.configService.getOrThrow('TVDB_API_URL');

    const headers = {
      Authorization: `Bearer ${this.token}`,
    };
    try {
      const result = await axios.get<SearchResult>(
        `${baseUrl}/search/remoteid/${imdbId}`,
        {
          headers,
        },
      );

      return result.data.data[0].series;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Something went wrong: ' + JSON.stringify(error),
      );
    }
  }
}
