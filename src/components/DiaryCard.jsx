import { useNavigate } from 'react-router-dom';
import { Film, PenLine } from 'lucide-react';
import { getPosterUrl } from '../api/tmdb';

export default function DiaryCard({ diary }) {
  const navigate = useNavigate();
  const poster = diary.moviePoster ? getPosterUrl(diary.moviePoster, 'w342') : null;

  return (
    <div
      onClick={() => navigate(`/movie/${diary.movieId}`)}
      className="group relative block rounded-xl overflow-hidden bg-cinema-card hover:scale-[1.03] transition-transform duration-200 shadow-lg cursor-pointer"
    >
      <div className="aspect-[2/3] overflow-hidden bg-cinema-surface">
        {poster ? (
          <img
            src={poster}
            alt={diary.movieTitle}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-cinema-muted">
            <Film size={40} />
          </div>
        )}
      </div>

      {/* 내 평점 뱃지 */}
      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
        <span className="text-yellow-400 text-xs leading-none">★</span>
        <span className="text-white text-xs font-bold leading-none">{diary.rating}</span>
      </div>

      {/* 일기 뱃지 */}
      <span className="absolute top-2 right-2 bg-cinema-gold/90 text-white p-1 rounded-full shadow">
        <PenLine size={11} />
      </span>

      {/* hover 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
        <div>
          <p className="text-white font-semibold text-sm leading-tight line-clamp-2">{diary.movieTitle}</p>
          {diary.content && (
            <p className="text-gray-300 text-xs mt-1 line-clamp-2 leading-relaxed">{diary.content}</p>
          )}
        </div>
      </div>

      <div className="p-2">
        <p className="text-white text-xs font-medium line-clamp-1">{diary.movieTitle}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-yellow-400 text-xs">
            {'★'.repeat(diary.rating)}
            <span className="text-gray-600">{'★'.repeat(5 - diary.rating)}</span>
          </span>
        </div>
        <p className="text-cinema-muted text-xs mt-0.5">{diary.watchedDate}</p>
      </div>
    </div>
  );
}
