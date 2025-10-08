import { FeatureType } from './feature-type.enum';

interface BaseSearchOptions {
  imdbId: string;
  language: string;
  year: number;
  query: string;
}

interface AllSearchOptions extends BaseSearchOptions {
  featureType: FeatureType.Movie | FeatureType.All;
}

interface EpisodeSearchOptions extends BaseSearchOptions {
  featureType: FeatureType.Episode;
  episodeNumber: number;
  seasonNumber: number;
}

export type SearchOptions = EpisodeSearchOptions | AllSearchOptions;
