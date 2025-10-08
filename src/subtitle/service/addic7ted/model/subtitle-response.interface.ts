export interface SubtitleResponse {
  matchingSubtitles: MatchingSubtitle[];
  episode: Episode;
}

export interface Episode {
  season: number;
  number: number;
  title: string;
  show: string;
  discovered: Date;
}

export interface MatchingSubtitle {
  subtitleId: string;
  version: string;
  completed: boolean;
  hearingImpaired: boolean;
  corrected: boolean;
  hd: boolean;
  downloadUri: string;
  language: string;
  discovered: Date;
  downloadCount: number;
}
