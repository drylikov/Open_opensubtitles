import { FeatureType } from '../../../model/';

export interface SubtitleSearchResponse {
  total_pages: number;
  total_count: number;
  per_page: number;
  page: number;
  data: Datum[];
}

export interface Datum {
  id: string;
  type: 'subtitle';
  attributes: Attributes;
}

export interface Attributes {
  subtitle_id: string;
  language: string;
  download_count: number;
  new_download_count: number;
  hearing_impaired: boolean;
  hd: boolean;
  fps: number;
  votes: number;
  ratings: number;
  from_trusted: boolean;
  foreign_parts_only: boolean;
  upload_date: Date;
  ai_translated: boolean;
  machine_translated: boolean;
  release: string;
  comments: string;
  legacy_subtitle_id: number;
  legacy_uploader_id: number;
  uploader: Uploader;
  feature_details: FeatureDetails;
  url: string;
  related_links: RelatedLink[];
  files: File[];
}

export interface FeatureDetails {
  feature_id: number;
  feature_type: FeatureType;
  year: number;
  title: string;
  movie_name: string;
  imdb_id: number;
  tmdb_id: number;
  season_number: number;
  episode_number: number;
  parent_imdb_id?: number;
  parent_title?: string;
  parent_tmdb_id?: number;
  parent_feature_id?: number;
}

export interface File {
  file_id: number;
  cd_number: number;
  file_name: string;
}

export interface RelatedLink {
  label: string;
  url: string;
  img_url: string;
}

export interface Uploader {
  uploader_id: number | null;
  name: string;
  rank: string;
}
