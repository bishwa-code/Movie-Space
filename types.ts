export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  original_language: string;
  adult: boolean;
}

export interface MovieDetails extends Movie {
  genres: { id: number; name: string }[];
  runtime: number;
  budget: number;
  revenue: number;
  status: string;
  tagline: string;
  production_companies: { id: number; logo_path: string | null; name: string }[];
  homepage: string | null;
  credits: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  videos: {
    results: VideoResult[];
  };
  similar: {
    results: Movie[];
  };
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
}

export interface VideoResult {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface Genre {
  id: number;
  name: string;
}

export type ViewState = 'home' | 'details' | 'search' | 'bookmarks' | 'history' | 'compare';

export interface FilterState {
  year?: number;
  genreId?: number;
  sortBy: 'popularity.desc' | 'vote_average.desc' | 'revenue.desc' | 'primary_release_date.desc';
  minRating: number;
}