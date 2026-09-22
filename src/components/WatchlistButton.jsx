'use client';

import { Bookmark } from 'lucide-react';
import { WATCHLIST_LABEL } from '../lib/media';

export default function WatchlistButton({ mediaType, inWatchlist, loading, onClick }) {
  const label = inWatchlist ? '찜 취소' : `${WATCHLIST_LABEL[mediaType] ?? '볼 목록'} 찜하기`;

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex-shrink-0 mt-1 p-2 rounded-full border transition ${
        inWatchlist
          ? 'bg-blue-500/20 border-blue-400 text-blue-400 hover:bg-red-500/20 hover:border-red-400 hover:text-red-400'
          : 'bg-white/5 border-white/20 text-cinema-muted hover:bg-blue-500/20 hover:border-blue-400 hover:text-blue-400'
      } disabled:opacity-50`}
      title={label}
      aria-label={label}
    >
      <Bookmark size={18} fill={inWatchlist ? 'currentColor' : 'none'} />
    </button>
  );
}
