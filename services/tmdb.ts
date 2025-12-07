import { Movie, MovieDetails, Genre } from '../types';

const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = '982cee9628d45457823df6d3f6e65e21';

// Helper to get API key from localStorage or use the hardcoded default
export const getApiKey = (): string | null => {
  return localStorage.getItem('tmdb_api_key') || API_KEY;
};

export const setApiKey = (key: string) => {
  localStorage.setItem('tmdb_api_key', key);
};

const fetchFromApi = async <T>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API_KEY_MISSING');
  }

  const queryParams = new URLSearchParams({
    api_key: apiKey,
    language: 'en-US',
    include_adult: 'false',
    ...params,
  });

  const response = await fetch(`${BASE_URL}${endpoint}?${queryParams}`);
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
};

export const fetchTrending = async (timeWindow: 'day' | 'week' = 'day'): Promise<Movie[]> => {
  try {
    const data = await fetchFromApi<{ results: Movie[] }>(`/trending/movie/${timeWindow}`);
    return data.results;
  } catch (error) {
    return [];
  }
};

export const fetchMoviesByCategory = async (category: string, page = 1): Promise<Movie[]> => {
  try {
    let endpoint = '/movie/popular';
    const params: Record<string, string> = { page: page.toString() };

    switch (category) {
      case 'top_rated':
        endpoint = '/movie/top_rated';
        break;
      case 'upcoming':
        endpoint = '/movie/upcoming';
        break;
      case 'now_playing':
        endpoint = '/movie/now_playing';
        break;
      case 'hindi':
        endpoint = '/discover/movie';
        params.with_original_language = 'hi';
        params.sort_by = 'popularity.desc';
        params.region = 'IN';
        break;
      case 'korean':
        endpoint = '/discover/movie';
        params.with_original_language = 'ko';
        params.sort_by = 'popularity.desc';
        break;
      case 'anime':
        endpoint = '/discover/movie';
        params.with_genres = '16'; // Animation
        params.with_original_language = 'ja';
        break;
      case 'adventure':
         endpoint = '/discover/movie';
         params.with_genres = '12';
         params.sort_by = 'popularity.desc';
         break;
      case 'thriller':
         endpoint = '/discover/movie';
         params.with_genres = '53';
         params.sort_by = 'popularity.desc';
         break;
      case 'high_rated':
         endpoint = '/discover/movie';
         params['vote_average.gte'] = '8';
         params['vote_count.gte'] = '500';
         params.sort_by = 'vote_average.desc';
         break;
    }

    const data = await fetchFromApi<{ results: Movie[] }>(endpoint, params);
    return data.results;
  } catch (error) {
    return [];
  }
};

export const searchMovies = async (query: string): Promise<Movie[]> => {
  if (!query) return [];
  try {
    const data = await fetchFromApi<{ results: Movie[] }>('/search/movie', { query });
    return data.results;
  } catch (error) {
    return [];
  }
};

export const fetchMovieDetails = async (id: number): Promise<MovieDetails | null> => {
  try {
    return await fetchFromApi<MovieDetails>(`/movie/${id}`, {
      append_to_response: 'credits,videos,similar',
    });
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const fetchGenres = async (): Promise<Genre[]> => {
  try {
    const data = await fetchFromApi<{ genres: Genre[] }>('/genre/movie/list');
    return data.genres;
  } catch (error) {
    return [];
  }
};

export const discoverMovies = async (filters: any): Promise<Movie[]> => {
    try {
        const params: Record<string, string> = {
            sort_by: filters.sortBy || 'popularity.desc',
            'vote_average.gte': filters.minRating?.toString() || '0',
            page: '1'
        };
        
        if (filters.year) params.primary_release_year = filters.year.toString();
        if (filters.genreId) params.with_genres = filters.genreId.toString();

        const data = await fetchFromApi<{results: Movie[]}>('/discover/movie', params);
        return data.results;
    } catch (e) {
        return [];
    }
}

export const getImageUrl = (path: string | null, size: 'w500' | 'original' = 'w500') => {
  if (!path) return 'https://picsum.photos/500/750?grayscale'; 
  return `https://image.tmdb.org/t/p/${size}${path}`;
};