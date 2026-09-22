'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Tv, User, Loader2 } from 'lucide-react';
import {
  getTvDetail,
  getTvWatchProviders,
  getTvCredits,
  getPosterUrl,
  formatRating,
  getYear,
  formatGenres,
  formatSeasons,
  IMG_BASE_W780,
} from '../../../api/tmdb';
import { useAuth } from '../../../context/AuthContext';
import useWatchlist from '../../../hooks/useWatchlist';
import WatchProviders from '../../../components/WatchProviders';
import WatchlistButton from '../../../components/WatchlistButton';
import MediaDiarySection from '../../../components/MediaDiarySection';

export default function TvDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [show, setShow] = useState(null);
  const [providers, setProviders] = useState(undefined);
  const [credits, setCredits] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  const watchlist = useWatchlist(user, 'tv', id);

  useEffect(() => {
    window.scrollTo(0, 0);
    setPageLoading(true);

    Promise.all([
      getTvDetail(id),
      getTvWatchProviders(id),
      getTvCredits(id),
    ]).then(([t, p, c]) => {
      setShow(t);
      setProviders(p);
      setCredits(c);
      setPageLoading(false);
    }).catch((err) => {
      console.error(err);
      setPageLoading(false);
    });
  }, [id]);

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-cinema-bg flex items-center justify-center">
        <Loader2 size={36} className="text-cinema-gold animate-spin" />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-cinema-bg flex items-center justify-center text-cinema-muted">
        드라마 정보를 불러오지 못했습니다.
      </div>
    );
  }

  const backdropUrl = show.backdrop_path ? `${IMG_BASE_W780}${show.backdrop_path}` : null;
  const posterUrl = getPosterUrl(show.poster_path, 'w342');
  const creators = show.created_by?.map((c) => c.name).join(', ');
  const seasonInfo = formatSeasons(show.number_of_seasons, show.number_of_episodes);
  const cast = credits?.cast?.slice(0, 8) ?? [];

  return (
    <div className="min-h-screen bg-cinema-bg">
      {backdropUrl && (
        <div className="absolute top-0 left-0 right-0 h-[500px] overflow-hidden -z-10">
          <img src={backdropUrl} alt="" className="w-full h-full object-cover opacity-20 blur-sm" />
          <div className="absolute inset-0 bg-gradient-to-b from-cinema-bg/30 via-cinema-bg/60 to-cinema-bg" />
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* 포스터 + 정보 */}
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-48 md:w-56 flex-shrink-0 mx-auto md:mx-0">
            {posterUrl ? (
              <img src={posterUrl} alt={show.name} className="w-full rounded-2xl shadow-2xl" />
            ) : (
              <div className="w-full aspect-[2/3] rounded-2xl bg-cinema-card flex items-center justify-center text-cinema-muted">
                <Tv size={48} />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-start gap-3">
                <h1 className="text-3xl font-bold text-white leading-tight flex-1">{show.name}</h1>
                {user && (
                  <WatchlistButton
                    mediaType="tv"
                    inWatchlist={watchlist.inWatchlist}
                    loading={watchlist.loading}
                    onClick={() => watchlist.toggle({ title: show.name, poster: show.poster_path })}
                  />
                )}
              </div>
              {show.original_name !== show.name && (
                <p className="text-cinema-muted text-sm mt-1">{show.original_name}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-cinema-muted">
              {show.first_air_date && <span>{getYear(show.first_air_date)}</span>}
              {seasonInfo && <><span className="text-white/20">|</span><span>{seasonInfo}</span></>}
              {show.genres?.length > 0 && <><span className="text-white/20">|</span><span>{formatGenres(show.genres)}</span></>}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-yellow-400 text-xl font-bold">★</span>
              <span className="text-white font-bold text-xl">{formatRating(show.vote_average)}</span>
              <span className="text-cinema-muted text-sm">/ 10</span>
              <span className="text-cinema-muted text-xs ml-1">({show.vote_count?.toLocaleString()}명)</span>
            </div>

            {creators && (
              <p className="text-sm text-cinema-muted">
                기획: <span className="text-white">{creators}</span>
              </p>
            )}

            {show.networks?.length > 0 && (
              <p className="text-sm text-cinema-muted">
                채널: <span className="text-white">{show.networks.map((n) => n.name).join(', ')}</span>
              </p>
            )}

            {show.overview && (
              <p className="text-gray-300 text-sm leading-relaxed line-clamp-4">{show.overview}</p>
            )}

            {/* 보러가기 */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-white font-semibold text-sm">보러가기</span>
                <span className="text-xs text-cinema-muted">JustWatch 제공</span>
              </div>
              {providers === undefined ? (
                <div className="flex gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-12 h-12 rounded-xl bg-cinema-card animate-pulse" />
                  ))}
                </div>
              ) : (
                <WatchProviders providers={providers} title={show.name} />
              )}
            </div>
          </div>
        </div>

        {/* 출연진 */}
        {cast.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-white mb-4">출연진</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {cast.map((actor) => (
                <div key={actor.id} className="flex-shrink-0 w-20 text-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-cinema-card mx-auto mb-1.5">
                    {actor.profile_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                        alt={actor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-cinema-muted">
                        <User size={28} />
                      </div>
                    )}
                  </div>
                  <p className="text-white text-xs font-medium leading-tight line-clamp-1">{actor.name}</p>
                  <p className="text-cinema-muted text-xs line-clamp-1">{actor.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-white/20 mt-10 mb-8" />

        <MediaDiarySection
          mediaType="tv"
          itemId={id}
          item={{ title: show.name, poster: show.poster_path }}
          onSaved={watchlist.removeIfPresent}
        />
      </div>
    </div>
  );
}
