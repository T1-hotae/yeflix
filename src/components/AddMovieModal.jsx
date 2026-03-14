import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Film, ChevronRight, Loader2 } from 'lucide-react';
import { searchMovies, getPosterUrl, getYear, formatRating } from '../api/tmdb';

export default function AddMovieModal({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchMovies(query);
        setResults(data.results.slice(0, 12));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (movie) => {
    navigate(`/movie/${movie.id}`);
    onClose();
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-2xl bg-cinema-card rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        {/* 검색창 */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <Search size={18} className="text-cinema-muted flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="본 영화 제목을 검색하세요..."
            className="flex-1 bg-transparent text-white text-base outline-none placeholder-cinema-muted"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-cinema-muted hover:text-white transition">
              <X size={18} />
            </button>
          )}
          <button onClick={onClose} className="text-cinema-muted hover:text-white transition text-sm ml-1">
            닫기
          </button>
        </div>

        {/* 결과 */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="text-cinema-gold animate-spin" />
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="text-center py-10 text-cinema-muted text-sm">검색 결과가 없습니다.</div>
          )}

          {!loading && !query && (
            <div className="flex flex-col items-center py-10 gap-2 text-cinema-muted">
              <Search size={32} className="opacity-30" />
              <p className="text-sm">영화 제목을 입력하면 검색 결과가 나타납니다.</p>
            </div>
          )}

          {results.map((movie) => (
            <button
              key={movie.id}
              onClick={() => handleSelect(movie)}
              className="w-full flex items-center gap-4 px-5 py-3 hover:bg-white/5 transition text-left border-b border-white/5 last:border-0"
            >
              <div className="w-10 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-cinema-surface">
                {movie.poster_path ? (
                  <img src={getPosterUrl(movie.poster_path, 'w92')} alt={movie.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-cinema-muted">
                    <Film size={18} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm line-clamp-1">{movie.title}</p>
                {movie.original_title !== movie.title && (
                  <p className="text-cinema-muted text-xs line-clamp-1">{movie.original_title}</p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-cinema-muted text-xs">{getYear(movie.release_date)}</span>
                  {movie.vote_average > 0 && (
                    <span className="text-yellow-400 text-xs">★ {formatRating(movie.vote_average)}</span>
                  )}
                </div>
              </div>

              <ChevronRight size={16} className="text-cinema-muted flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
