export interface SearchResponse {
  shows: Show[];
}

export interface Show {
  id: string;
  name: string;
  nbSeasons: number;
  seasons: number[];
  tvDbId: number;
  tmdbId: number;
}
