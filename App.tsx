import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getImageUrl, fetchTrending, fetchMoviesByCategory, searchMovies, fetchMovieDetails, getApiKey, setApiKey, discoverMovies } from './services/tmdb';
import { Movie, MovieDetails, ViewState, FilterState } from './types';
import MovieCard from './components/MovieCard';
import Modal from './components/Modal';
import { ICONS, GENRES } from './constants';

const App = () => {
  // --- State ---
  const [view, setView] = useState<ViewState>('home');
  const [apiKey, setApiKeyState] = useState<string | null>(getApiKey());
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Data
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popularHindi, setPopularHindi] = useState<Movie[]>([]);
  const [popularAnime, setPopularAnime] = useState<Movie[]>([]);
  const [popularThriller, setPopularThriller] = useState<Movie[]>([]);
  const [highRated, setHighRated] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection & Details
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // User Data (LocalStorage)
  const [bookmarks, setBookmarks] = useState<Movie[]>(() => {
    const saved = localStorage.getItem('bookmarks');
    return saved ? JSON.parse(saved) : [];
  });
  const [history, setHistory] = useState<Movie[]>(() => {
    const saved = localStorage.getItem('history');
    return saved ? JSON.parse(saved) : [];
  });

  // Filter State
  const [filterState, setFilterState] = useState<FilterState>({
      sortBy: 'popularity.desc',
      minRating: 0
  });

  // Compare Mode
  const [compareList, setCompareList] = useState<Movie[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  // --- Effects ---

  useEffect(() => {
    if (apiKey) {
      loadHomeData();
    } else {
      setShowSettings(true);
    }
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem('history', JSON.stringify(history));
  }, [history]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        handleSearch(searchQuery);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // --- Handlers ---

  const loadHomeData = async () => {
    // Only set loading if we don't have data yet
    if (trending.length === 0) setIsLoading(true);
    
    try {
      const [trend, hindi, anime, top, thrill, high] = await Promise.all([
        fetchTrending('week'),
        fetchMoviesByCategory('hindi'),
        fetchMoviesByCategory('anime'),
        fetchMoviesByCategory('top_rated'),
        fetchMoviesByCategory('thriller'),
        fetchMoviesByCategory('high_rated'),
      ]);
      setTrending(trend);
      setPopularHindi(hindi);
      setPopularAnime(anime);
      setTopRated(top);
      setPopularThriller(thrill);
      setHighRated(high);
      
      if (trend.length > 0) setFeaturedMovie(trend[0]);
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (q: string) => {
    if (!apiKey) return;
    setIsLoading(true);
    const results = await searchMovies(q);
    setSearchResults(results);
    setView('search');
    setIsLoading(false);
  };

  const handleFilter = async () => {
      if(!apiKey) return;
      setIsLoading(true);
      const results = await discoverMovies(filterState);
      setSearchResults(results);
      setView('search');
      setIsLoading(false);
  }

  const openMovieDetails = async (id: number) => {
    if (!apiKey) {
        setShowSettings(true);
        return;
    }
    setSelectedMovieId(id);
    setDetailsLoading(true);
    const details = await fetchMovieDetails(id);
    setMovieDetails(details);
    setDetailsLoading(false);
    setView('details');

    if (details) {
      // Add to history
      setHistory(prev => {
        const filtered = prev.filter(m => m.id !== details.id);
        return [details, ...filtered].slice(0, 20); // Keep last 20
      });
    }
  };

  const toggleBookmark = (movie: Movie) => {
    setBookmarks(prev => {
      const exists = prev.find(m => m.id === movie.id);
      if (exists) return prev.filter(m => m.id !== movie.id);
      return [movie, ...prev];
    });
  };

  const toggleCompare = (movie: Movie) => {
      setCompareList(prev => {
          const exists = prev.find(m => m.id === movie.id);
          if (exists) return prev.filter(m => m.id !== movie.id);
          if (prev.length >= 2) return [prev[1], movie]; // keep max 2, replace oldest
          return [...prev, movie];
      })
  }

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = (document.getElementById('api-key-input') as HTMLInputElement).value;
    setApiKey(input);
    setApiKeyState(input);
    setShowSettings(false);
  };

  const handleRandomDiscovery = () => {
      if(trending.length > 0) {
          const random = trending[Math.floor(Math.random() * trending.length)];
          openMovieDetails(random.id);
      }
  }

  // --- Components Renders ---

  const renderSection = (title: string, movies: Movie[]) => {
    if (!movies || movies.length === 0) return null;
    return (
      <section className="mb-12 animate-slide-up">
        <h2 className="text-2xl font-bold text-white mb-6 px-4 md:px-8 border-l-4 border-neon-blue">{title}</h2>
        <div className="overflow-x-auto hide-scrollbar pb-8 px-4 md:px-8 flex gap-4 snap-x">
          {movies.map(movie => (
            <div key={movie.id} className="min-w-[160px] md:min-w-[200px] snap-start">
              <MovieCard 
                movie={movie} 
                onClick={openMovieDetails} 
                onBookmark={toggleBookmark}
                isBookmarked={bookmarks.some(b => b.id === movie.id)}
              />
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderHero = () => {
    if (!featuredMovie) return (
      <div className="h-[70vh] w-full bg-space-dark animate-pulse mb-12 flex items-center justify-center">
         <div className="w-16 h-16 border-4 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin"></div>
      </div>
    );
    
    return (
      <div className="relative h-[70vh] w-full mb-12 group">
        <div className="absolute inset-0">
          <img 
            src={getImageUrl(featuredMovie.backdrop_path, 'original')} 
            alt={featuredMovie.title}
            className="w-full h-full object-cover transition-transform duration-10000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-space-black via-space-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-space-black via-transparent to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 p-8 md:p-16 max-w-3xl animate-slide-up">
          <span className="bg-neon-blue text-space-black font-bold px-3 py-1 rounded-full text-sm mb-4 inline-block shadow-lg shadow-neon-blue/20">Trending #1</span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-lg">{featuredMovie.title}</h1>
          <p className="text-slate-300 text-lg mb-8 line-clamp-3 md:line-clamp-2 drop-shadow-md">{featuredMovie.overview}</p>
          <div className="flex gap-4">
            <button 
              onClick={() => openMovieDetails(featuredMovie.id)}
              className="bg-neon-blue text-space-black font-bold py-3 px-8 rounded-xl hover:bg-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-neon-blue/20 flex items-center gap-2"
            >
              <ICONS.Play size={20} /> Watch Trailer
            </button>
            <button 
                onClick={() => toggleBookmark(featuredMovie)}
                className="glass-panel text-white font-bold py-3 px-8 rounded-xl hover:bg-white/20 transition-all hover:scale-105 flex items-center gap-2"
            >
                {bookmarks.some(b => b.id === featuredMovie.id) ? 'Bookmarked' : 'Add to List'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDetails = () => {
    if (detailsLoading || !movieDetails) return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="w-16 h-16 border-4 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 animate-pulse">Retrieving Movie Data...</p>
        </div>
    );

    return (
      <div className="animate-fade-in pb-20">
        {/* Banner */}
        <div className="relative h-[50vh] md:h-[60vh]">
          <img 
            src={getImageUrl(movieDetails.backdrop_path, 'original')} 
            className="w-full h-full object-cover"
            alt="backdrop"
          />
          <div className="absolute inset-0 bg-space-black/60 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-space-black to-transparent" />
          
          <button onClick={() => setView('home')} className="absolute top-8 left-8 p-3 glass-panel rounded-full hover:bg-white/20 transition-all z-10 hover:rotate-90">
             <ICONS.X />
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 -mt-32 relative z-10">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Poster */}
            <div className="w-64 md:w-80 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl shadow-neon-blue/20 mx-auto md:mx-0 border border-white/10">
              <img src={getImageUrl(movieDetails.poster_path)} className="w-full h-auto" alt={movieDetails.title} />
            </div>

            {/* Info */}
            <div className="flex-1 pt-4 md:pt-12 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{movieDetails.title}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-400 mb-6 text-sm">
                <span>{movieDetails.release_date.split('-')[0]}</span>
                <span>•</span>
                <span>{movieDetails.runtime} min</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-yellow-400"><ICONS.Star size={14} /> {movieDetails.vote_average.toFixed(1)}</span>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
                {movieDetails.genres.map(g => (
                  <span key={g.id} className="px-3 py-1 rounded-full border border-white/10 text-xs text-slate-300 bg-white/5 hover:bg-neon-blue/10 hover:border-neon-blue transition-colors cursor-default">
                    {g.name}
                  </span>
                ))}
              </div>

              <p className="text-slate-300 text-lg leading-relaxed mb-8">{movieDetails.overview}</p>

              <div className="flex justify-center md:justify-start gap-4 mb-12">
                <button 
                  onClick={() => toggleBookmark(movieDetails)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${bookmarks.some(b => b.id === movieDetails.id) ? 'bg-neon-purple text-white shadow-lg shadow-neon-purple/20' : 'glass-panel text-white hover:bg-white/20'}`}
                >
                  <ICONS.Heart size={20} /> {bookmarks.some(b => b.id === movieDetails.id) ? 'Saved' : 'Bookmark'}
                </button>
                <button 
                    onClick={() => toggleCompare(movieDetails)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold glass-panel text-white hover:bg-white/20 transition-all"
                >
                    <ICONS.Compare size={20} /> Compare
                </button>
              </div>
              
              {/* Cast */}
              <div className="mb-12">
                <h3 className="text-xl font-bold text-white mb-4">Top Cast</h3>
                <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
                  {movieDetails.credits.cast.slice(0, 10).map(actor => (
                    <div key={actor.id} className="min-w-[100px] text-center group">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden mb-2 mx-auto border-2 border-white/10 group-hover:border-neon-blue transition-colors">
                        <img src={getImageUrl(actor.profile_path)} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={actor.name} />
                      </div>
                      <p className="text-xs font-medium text-white truncate group-hover:text-neon-blue transition-colors">{actor.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{actor.character}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                  <div className="p-4 glass-panel rounded-xl">
                      <p className="text-slate-400 text-xs mb-1">Budget</p>
                      <p className="text-white font-mono">${(movieDetails.budget / 1000000).toFixed(1)}M</p>
                  </div>
                  <div className="p-4 glass-panel rounded-xl">
                      <p className="text-slate-400 text-xs mb-1">Revenue</p>
                      <p className="text-white font-mono">${(movieDetails.revenue / 1000000).toFixed(1)}M</p>
                  </div>
                  <div className="p-4 glass-panel rounded-xl">
                      <p className="text-slate-400 text-xs mb-1">Status</p>
                      <p className="text-white">{movieDetails.status}</p>
                  </div>
                   <div className="p-4 glass-panel rounded-xl">
                      <p className="text-slate-400 text-xs mb-1">Original Lang</p>
                      <p className="text-white uppercase">{movieDetails.original_language}</p>
                  </div>
              </div>

              {/* Similar */}
              {movieDetails.similar && movieDetails.similar.results.length > 0 && (
                 renderSection("You might also like", movieDetails.similar.results)
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGrid = (title: string, movies: Movie[]) => (
    <div className="p-8 pt-24 min-h-screen animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white border-l-4 border-neon-blue px-4">{title}</h2>
        {view === 'search' && (
             <div className="flex gap-2">
                 <select 
                    className="bg-space-dark text-white p-2 rounded border border-white/10 text-sm outline-none"
                    value={filterState.sortBy}
                    onChange={(e) => {
                        setFilterState({...filterState, sortBy: e.target.value as any});
                        handleFilter();
                    }}
                 >
                     <option value="popularity.desc">Most Popular</option>
                     <option value="vote_average.desc">Highest Rated</option>
                     <option value="revenue.desc">Highest Grossing</option>
                     <option value="primary_release_date.desc">Newest</option>
                 </select>
             </div>
        )}
      </div>
      
      {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="w-12 h-12 border-4 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin mb-4"></div>
             <p className="text-slate-500">Searching the cosmos...</p>
          </div>
      ) : movies.length === 0 ? (
        <div className="text-center text-slate-500 py-20">No movies found. Try exploring different galaxies.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {movies.map(movie => (
            <div key={movie.id} className="h-full">
                <MovieCard 
                movie={movie} 
                onClick={openMovieDetails}
                onBookmark={toggleBookmark}
                isBookmarked={bookmarks.some(b => b.id === movie.id)}
                />
            </div>
            ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen pb-20 md:pb-0 relative">
      
      {/* Settings Modal (Force API Key) */}
      <Modal isOpen={showSettings} onClose={() => { if(apiKey) setShowSettings(false); }} title="Setup Mission Control">
        <div className="p-6">
          <p className="mb-4 text-slate-300">To explore the Movie Space, you need a TMDB API Key. It's free and frontend-only.</p>
          <form onSubmit={handleApiKeySubmit} className="flex flex-col gap-4">
            <input 
              id="api-key-input"
              type="text" 
              placeholder="Enter TMDB API Key (starts with eyJ...)" 
              className="bg-space-black border border-white/20 rounded-lg p-3 text-white focus:border-neon-blue outline-none"
              defaultValue={apiKey || ''}
            />
            <div className="text-xs text-slate-500">
                Don't have one? <a href="https://www.themoviedb.org/settings/api" target="_blank" className="text-neon-blue underline">Get it here</a>.
            </div>
            <button type="submit" className="bg-neon-blue text-space-black font-bold py-3 rounded-lg hover:opacity-90">
              Launch Sequence
            </button>
          </form>
        </div>
      </Modal>

      {/* Compare Modal */}
      <Modal isOpen={showCompare} onClose={() => setShowCompare(false)} title="Compare Movies" fullScreen>
          <div className="p-8 grid grid-cols-2 gap-8 h-full">
              {compareList.map(m => (
                  <div key={m.id} className="flex flex-col gap-4 text-center animate-slide-up">
                      <img src={getImageUrl(m.poster_path)} className="w-48 mx-auto rounded-lg shadow-xl" />
                      <h3 className="text-2xl font-bold">{m.title}</h3>
                      <div className="space-y-4 text-slate-300">
                          <div className="p-2 bg-white/5 rounded">Rating: <span className="text-yellow-400 font-bold">{m.vote_average.toFixed(1)}</span></div>
                          <div className="p-2 bg-white/5 rounded">Release: {m.release_date}</div>
                          <div className="p-2 bg-white/5 rounded">Popularity: {Math.round(m.popularity)}</div>
                          <div className="p-2 bg-white/5 rounded text-sm">{m.overview}</div>
                      </div>
                      <button onClick={() => toggleCompare(m)} className="mt-auto bg-red-500/20 text-red-500 py-2 rounded hover:bg-red-500 hover:text-white transition-all">Remove</button>
                  </div>
              ))}
              {compareList.length < 2 && (
                  <div className="flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl">
                      <p className="text-slate-500">Select another movie to compare</p>
                  </div>
              )}
          </div>
      </Modal>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-space-black/80 backdrop-blur-lg border-b border-white/5 h-16 flex items-center px-4 md:px-8 justify-between transition-all duration-300">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('home')}>
          <div className="w-8 h-8 bg-gradient-to-tr from-neon-blue to-neon-purple rounded-lg flex items-center justify-center font-bold text-white group-hover:rotate-12 transition-transform">M</div>
          <span className="font-bold text-xl tracking-tight hidden md:block">Movie<span className="text-neon-blue">Space</span></span>
        </div>

        <div className="flex-1 max-w-xl mx-4 relative group">
          <ICONS.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-neon-blue transition-colors" size={18} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
            placeholder="Search for movies, stars, or genres..."
            className="w-full bg-space-dark border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:border-neon-blue outline-none transition-all focus:ring-1 focus:ring-neon-blue/50"
          />
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button 
             onClick={handleRandomDiscovery}
             title="Discover Random"
             className="p-2 hover:text-neon-blue transition-colors hidden md:block hover:rotate-180 duration-500"
          >
              <ICONS.Shuffle size={20} />
          </button>
          
          <button 
            onClick={() => setView('bookmarks')}
            className="p-2 hover:text-neon-purple transition-colors relative"
          >
            <ICONS.Heart size={20} fill={view === 'bookmarks' ? "currentColor" : "none"} />
            {bookmarks.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-neon-purple rounded-full animate-bounce"></span>}
          </button>
          
          <button onClick={() => setView('history')} className="p-2 hover:text-neon-blue transition-colors hidden md:block">
            <ICONS.History size={20} />
          </button>

          {compareList.length > 0 && (
               <button onClick={() => setShowCompare(true)} className="p-2 text-neon-blue relative hover:scale-110 transition-transform">
                   <ICONS.Compare size={20} />
                   <span className="absolute -top-1 -right-1 bg-neon-blue text-space-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{compareList.length}</span>
               </button>
          )}

          <button onClick={() => setShowSettings(true)} className="p-2 hover:text-white text-slate-400 transition-colors">
            <ICONS.Settings size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16 min-h-screen">
        {view === 'home' && (
          <div className="animate-fade-in">
             {!apiKey ? (
                 <div className="h-screen flex flex-col items-center justify-center p-4 text-center">
                     <h2 className="text-2xl font-bold mb-2">Welcome to Movie Space</h2>
                     <p className="text-slate-400 mb-6">Please enter your API Key in settings to initialize the dashboard.</p>
                     <button onClick={() => setShowSettings(true)} className="bg-neon-blue text-space-black font-bold py-2 px-6 rounded-full">Open Settings</button>
                 </div>
             ) : (
                <>
                    {isLoading && !featuredMovie ? (
                       <div className="h-screen flex flex-col items-center justify-center bg-space-black fixed inset-0 z-50">
                           <div className="w-20 h-20 border-4 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin mb-6"></div>
                           <h2 className="text-xl font-bold text-white animate-pulse">Initializing Movie Space...</h2>
                       </div>
                    ) : (
                        <>
                            {renderHero()}
                            {renderSection("Trending This Week", trending)}
                            {renderSection("Top Rated Worldwide", topRated)}
                            {renderSection("Popular Thrillers", popularThriller)}
                            {renderSection("IMDb 8+ Rated", highRated)}
                            {renderSection("Popular Hindi Movies", popularHindi)}
                            {renderSection("Popular Anime", popularAnime)}
                            
                            {/* Categories Chips */}
                            <div className="px-8 mb-12 animate-slide-up">
                                <h2 className="text-2xl font-bold mb-4">Explore Genres</h2>
                                <div className="flex flex-wrap gap-3">
                                    {GENRES.map(genre => (
                                        <button 
                                            key={genre.id}
                                            onClick={() => {
                                                setFilterState({...filterState, genreId: genre.id});
                                                handleFilter();
                                            }}
                                            className="px-4 py-2 rounded-lg border border-white/10 hover:border-neon-blue hover:text-neon-blue hover:bg-neon-blue/10 transition-all text-sm text-slate-300"
                                        >
                                            {genre.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </>
             )}
          </div>
        )}

        {view === 'search' && renderGrid(searchQuery ? `Results for "${searchQuery}"` : "Discover Movies", searchResults)}
        
        {view === 'bookmarks' && renderGrid("Your Bookmarks", bookmarks)}

        {view === 'history' && renderGrid("Recently Viewed", history)}
        
        {view === 'details' && renderDetails()}
      </main>

    </div>
  );
};

export default App;