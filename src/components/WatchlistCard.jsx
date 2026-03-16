'use client';

import Link from 'next/link';
import { Film, Bookmark } from 'lucide-react';
import { getPosterUrl } from '../api/tmdb';

export default function WatchlistCard({ item, onRemove }) {
  return (
    <div className="group relative rounded-xl overflow-hidden bg-cinema-card shadow-lg">
      <Link href={`/movie/${item.movieId}`} className="block">
        <div className="aspect-[2/3] overflow-hidden bg-cinema-surface">
          {item.moviePoster ? (
            <img
              src={getPosterUrl(item.moviePoster)}
              alt={item.movieTitle}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-cinema-muted">
              <Film size={40} />
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
          <p className="text-white font-semibold text-sm leading-tight line-clamp-2">
            {item.movieTitle}
          </p>
        </div>
      </Link>

      <button
        onClick={() => onRemove(item.movieId)}
        className="absolute top-2 right-2 bg-blue-500/90 text-white p-1 rounded-full shadow hover:bg-red-500/80 transition-colors"
        title="찜 취소"
      >
        <Bookmark size={11} fill="white" />
      </button>

      <div className="p-2">
        <p className="text-white text-xs font-medium line-clamp-1">{item.movieTitle}</p>
        <p className="text-cinema-muted text-xs mt-0.5">볼 예정</p>
      </div>
    </div>
  );
}
