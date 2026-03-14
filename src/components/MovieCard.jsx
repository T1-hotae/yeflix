import { Link } from 'react-router-dom';
import { Film, PenLine } from 'lucide-react';
import { getPosterUrl, formatRating, getYear } from '../api/tmdb';

export default function MovieCard({ movie, hasDiary = false }) {
  const poster = getPosterUrl(movie.poster_path);

  return (
    <Link
      to={`/movie/${movie.id}`}
      className="group relative block rounded-xl overflow-hidden bg-cinema-card hover:scale-[1.03] transition-transform duration-200 shadow-lg"
    >
      <div className="aspect-[2/3] overflow-hidden bg-cinema-surface">
        {poster ? (
          <img
            src={poster}
            alt={movie.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-cinema-muted">
            <Film size={40} />
          </div>
        )}
      </div>

      {hasDiary && (
        <span className="absolute top-2 right-2 bg-cinema-gold/90 text-white p-1 rounded-full shadow">
          <PenLine size={11} />
        </span>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
        <div>
          <p className="text-white font-semibold text-sm leading-tight line-clamp-2">{movie.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-yellow-400 text-xs">★ {formatRating(movie.vote_average)}</span>
            <span className="text-gray-400 text-xs">{getYear(movie.release_date)}</span>
          </div>
        </div>
      </div>

      <div className="p-2">
        <p className="text-white text-xs font-medium line-clamp-1">{movie.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-yellow-400 text-xs">★ {formatRating(movie.vote_average)}</span>
          <span className="text-cinema-muted text-xs">{getYear(movie.release_date)}</span>
        </div>
      </div>
    </Link>
  );
}
