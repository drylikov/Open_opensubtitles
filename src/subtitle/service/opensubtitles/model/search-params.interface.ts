export interface SearchParams extends Record<string, string> {
  imdb_id: string;
  languages: string;
  type: string;
  year: string;
  page: string;
  episode_number?: string;
  season_number?: string;
}
