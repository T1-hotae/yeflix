import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Film, User, PenLine, ArrowLeft, Loader2 } from 'lucide-react';
import {
  getMovieDetail,
  getWatchProviders,
  getMovieCredits,
  getPosterUrl,
  formatRating,
  getYear,
  formatGenres,
  formatRuntime,
  IMG_BASE_W780,
} from '../api/tmdb';
import { saveDiary, getDiary, deleteDiary } from '../firebase/diary';
import { useAuth } from '../context/AuthContext';
import WatchProviders from '../components/WatchProviders';
import DiaryForm from '../components/DiaryForm';
import StarRating from '../components/StarRating';

export default function MovieDetail() {
  const { id } = useParams();
  const { user, loginWithGoogle } = useAuth();

  const [movie, setMovie] = useState(null);
  const [providers, setProviders] = useState(undefined);
  const [credits, setCredits] = useState(null);
  const [diary, setDiary] = useState(null);
  const [diaryLoading, setDiaryLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    setPageLoading(true);
    setDiary(null);
    setEditing(false);

    Promise.all([
      getMovieDetail(id),
      getWatchProviders(id),
      getMovieCredits(id),
    ]).then(([m, p, c]) => {
      setMovie(m);
      setProviders(p);
      setCredits(c);
      setPageLoading(false);
    }).catch((err) => {
      console.error(err);
      setPageLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    getDiary(user.uid, id).then(setDiary).catch(console.error);
  }, [user, id]);

  const handleSave = async (data) => {
    if (!user) return;
    setDiaryLoading(true);
    try {
      await saveDiary(user.uid, id, {
        ...data,
        movieId: Number(id),
        movieTitle: movie.title,
        moviePoster: movie.poster_path,
        createdAt: diary?.createdAt ?? null,
      });
      const updated = await getDiary(user.uid, id);
      setDiary(updated);
      setEditing(false);
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setDiaryLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('일기를 삭제하시겠습니까?')) return;
    setDiaryLoading(true);
    try {
      await deleteDiary(user.uid, id);
      setDiary(null);
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setDiaryLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-cinema-bg flex items-center justify-center">
        <Loader2 size={36} className="text-cinema-gold animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-cinema-bg flex items-center justify-center text-cinema-muted">
        영화 정보를 불러오지 못했습니다.
      </div>
    );
  }

  const backdropUrl = movie.backdrop_path ? `${IMG_BASE_W780}${movie.backdrop_path}` : null;
  const posterUrl = getPosterUrl(movie.poster_path, 'w342');
  const director = credits?.crew?.find((c) => c.job === 'Director');
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
              <img src={posterUrl} alt={movie.title} className="w-full rounded-2xl shadow-2xl" />
            ) : (
              <div className="w-full aspect-[2/3] rounded-2xl bg-cinema-card flex items-center justify-center text-cinema-muted">
                <Film size={48} />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-white leading-tight">{movie.title}</h1>
              {movie.original_title !== movie.title && (
                <p className="text-cinema-muted text-sm mt-1">{movie.original_title}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-cinema-muted">
              {movie.release_date && <span>{getYear(movie.release_date)}</span>}
              {movie.runtime > 0 && <><span className="text-white/20">|</span><span>{formatRuntime(movie.runtime)}</span></>}
              {movie.genres?.length > 0 && <><span className="text-white/20">|</span><span>{formatGenres(movie.genres)}</span></>}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-yellow-400 text-xl font-bold">★</span>
              <span className="text-white font-bold text-xl">{formatRating(movie.vote_average)}</span>
              <span className="text-cinema-muted text-sm">/ 10</span>
              <span className="text-cinema-muted text-xs ml-1">({movie.vote_count?.toLocaleString()}명)</span>
            </div>

            {director && (
              <p className="text-sm text-cinema-muted">
                감독: <span className="text-white">{director.name}</span>
              </p>
            )}

            {movie.overview && (
              <p className="text-gray-300 text-sm leading-relaxed line-clamp-4">{movie.overview}</p>
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
                <WatchProviders providers={providers} movieTitle={movie.title} />
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

        <div className="border-t border-white/10 mt-10 mb-8" />

        {/* 내 감상 일기 */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <PenLine size={20} /> 내 감상 일기
          </h2>

          {!user ? (
            <div className="bg-cinema-card rounded-2xl p-8 text-center border border-white/5">
              <p className="text-cinema-muted mb-4">로그인 후 감상 일기를 작성할 수 있습니다.</p>
              <button
                onClick={loginWithGoogle}
                className="bg-white text-gray-900 font-semibold px-6 py-2.5 rounded-full hover:bg-gray-100 transition text-sm"
              >
                Google로 로그인
              </button>
            </div>
          ) : diary && !editing ? (
            <div className="bg-cinema-card rounded-2xl p-6 border border-white/5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <StarRating value={diary.rating} readonly size="md" />
                  <p className="text-cinema-muted text-xs mt-1">{diary.watchedDate} 관람</p>
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-cinema-muted hover:text-white transition px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30"
                >
                  수정
                </button>
              </div>

              {diary.content && (
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{diary.content}</p>
              )}

              {diary.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {diary.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-cinema-gold/10 text-cinema-gold border border-cinema-gold/20">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-cinema-card rounded-2xl p-6 border border-white/5">
              {diary && editing && (
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1 text-cinema-muted text-sm mb-4 hover:text-white transition"
                >
                  <ArrowLeft size={14} /> 취소
                </button>
              )}
              <DiaryForm
                initial={diary}
                onSave={handleSave}
                onDelete={diary ? handleDelete : undefined}
                loading={diaryLoading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
