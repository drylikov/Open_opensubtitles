export interface SearchResult {
  status: string;
  data: Datum[];
}

export interface Datum {
  series: ShowData;
}

export interface ShowData {
  id: number;
  name: string;
  slug: string;
  image: string;
  nameTranslations: string[];
  overviewTranslations: string[];
  aliases: Alias[];
  firstAired: Date;
  lastAired: Date;
  nextAired: string;
  score: number;
  status: Status;
  originalCountry: string;
  originalLanguage: string;
  defaultSeasonType: number;
  isOrderRandomized: boolean;
  lastUpdated: Date;
  averageRuntime: number;
  episodes: null;
  overview: string;
  year: string;
}

export interface Alias {
  language: string;
  name: string;
}

export interface Status {
  id: null;
  name: null;
  recordType: string;
  keepUpdated: boolean;
}
