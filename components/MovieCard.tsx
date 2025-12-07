import React from 'react';
import { Movie } from '../types';
import { getImageUrl } from '../services/tmdb';
import { ICONS } from '../constants';

interface Props {
  movie: Movie;
  onClick: (id: number) => void;
  onBookmark?: (movie: Movie) => void;
  isBookmarked?: boolean;
}

const MovieCard: React.FC<Props> = ({ movie, onClick, onBookmark, isBookmarked }) => {
  return (
    <div 
      className="group relative bg-space-dark rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-blue/20 cursor-pointer h-full flex flex-col"
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <img 
          src={getImageUrl(movie.poster_path)} 
          alt={movie.title} 
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <div className="flex gap-2 mb-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onClick(movie.id); }}
              className="flex-1 bg-neon-blue text-space-black font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-white transition-colors"
            >
              <ICONS.Play size={16} /> View
            </button>
            {onBookmark && (
              <button 
                onClick={(e) => { e.stopPropagation(); onBookmark(movie); }}
                className={`p-2 rounded-lg backdrop-blur-md border ${isBookmarked ? 'bg-neon-purple border-neon-purple text-white' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'} transition-all`}
              >
                <ICONS.Heart size={20} fill={isBookmarked ? "currentColor" : "none"} />
              </button>
            )}
          </div>
        </div>
        
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-bold text-yellow-400 flex items-center gap-1">
          <ICONS.Star size={12} fill="currentColor" />
          {movie.vote_average.toFixed(1)}
        </div>
      </div>
      
      <div className="p-3 flex-1 flex flex-col justify-between">
        <h3 className="text-white font-medium text-sm line-clamp-2 leading-tight">{movie.title}</h3>
        <p className="text-slate-400 text-xs mt-1">{movie.release_date?.split('-')[0] || 'N/A'}</p>
      </div>
    </div>
  );
};

export default MovieCard;