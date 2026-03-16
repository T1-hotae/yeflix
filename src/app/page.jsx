'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Film, BookOpen, Plus, Bookmark } from 'lucide-react';
import { getNowPlaying, searchMovies } from '../api/tmdb';
import { getMyDiaries, getMyMovieIds } from '../firebase/diary';
import { getWatchlist, removeFromWatchlist, getWatchlistMovieIds } from '../firebase/watchlist';
import { useAuth } from '../context/AuthContext';
import MovieCard from '../components/MovieCard';
import DiaryCard from '../components/DiaryCard';
import WatchlistCard from '../components/WatchlistCard';
import AddMovieModal from '../components/AddMovieModal';

const TABS = [
  { id: 'my_diary', label: '내 일기' },
  { id: 'watchlist', label: '볼영화' },
  { id: 'now_playing', label: '현재 상영 중' },
];

function HomeContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') ?? '';

  const [tab, setTab] = useState('my_diary');
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [myMovieIds, setMyMovieIds] = useState(new Set());
  const [myDiaries, setMyDiaries] = useState([]);
  const [diariesLoading, setDiariesLoading] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [watchlistMovieIds, setWatchlistMovieIds] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);

  const { user, loginWithGoogle } = useAuth();

  // Navbar "내 정보" 클릭 시 탭 전환
  useEffect(() => {
    const handler = (e) => setTab(e.detail);
    window.addEventListener('switch-tab', handler);
    return () => window.removeEventListener('switch-tab', handler);
  }, []);

  // 내가 일기 쓴 영화 ID 목록
  useEffect(() => {
    if (!user) { setMyMovieIds(new Set()); setWatchlistMovieIds(new Set()); return; }
    getMyMovieIds(user.uid).then(setMyMovieIds).catch(console.error);
    getWatchlistMovieIds(user.uid).then(setWatchlistMovieIds).catch(console.error);
  }, [user]);

  // 내 일기 목록
  useEffect(() => {
    if (tab !== 'my_diary' || !user) return;
    setDiariesLoading(true);
    getMyDiaries(user.uid)
      .then(setMyDiaries)
      .catch(console.error)
      .finally(() => setDiariesLoading(false));
  }, [tab, user]);

  // 볼영화 찜 목록
  useEffect(() => {
    if (tab !== 'watchlist' || !user) return;
    setWatchlistLoading(true);
    getWatchlist(user.uid)
      .then(setWatchlist)
      .catch(console.error)
      .finally(() => setWatchlistLoading(false));
  }, [tab, user]);

  const handleRemoveFromWatchlist = async (movieId) => {
    if (!user) return;
    await removeFromWatchlist(user.uid, movieId);
    setWatchlist((prev) => prev.filter((item) => item.movieId !== movieId));
    setWatchlistMovieIds((prev) => { const s = new Set(prev); s.delete(movieId); return s; });
  };

  const fetchMovies = useCallback(async (currentPage, reset = false) => {
    setLoading(true);
    try {
      const data = searchQuery
        ? await searchMovies(searchQuery, currentPage)
        : await getNowPlaying(currentPage);
      setMovies((prev) => reset ? data.results : [...prev, ...data.results]);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (tab !== 'now_playing' && !searchQuery) return;
    setPage(1);
    setMovies([]);
    fetchMovies(1, true);
  }, [tab, searchQuery, fetchMovies]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchMovies(next);
  };

  const isMovieTab = searchQuery || tab === 'now_playing';

  return (
    <div className="min-h-screen bg-cinema-bg">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* 탭 or 검색 헤더 */}
        {searchQuery ? (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">
              "<span className="text-cinema-gold">{searchQuery}</span>" 검색 결과
            </h1>
            <p className="text-cinema-muted text-sm mt-1">{movies.length}개의 영화</p>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-6 border-b border-white/10">
            <div className="flex gap-4">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`pb-3 text-sm font-semibold transition border-b-2 -mb-px ${
                    tab === t.id
                      ? 'border-cinema-gold text-cinema-gold'
                      : 'border-transparent text-cinema-muted hover:text-white'
                  }`}
                >
                  {t.label}
                  {t.id === 'my_diary' && myDiaries.length > 0 && (
                    <span className="ml-1.5 text-xs bg-cinema-gold/20 text-cinema-gold px-1.5 py-0.5 rounded-full">
                      {myDiaries.length}
                    </span>
                  )}
                  {t.id === 'watchlist' && watchlistMovieIds.size > 0 && (
                    <span className="ml-1.5 text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">
                      {watchlistMovieIds.size}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {tab === 'my_diary' && (
              <button
                onClick={() => user ? setShowAddModal(true) : loginWithGoogle()}
                className="flex items-center gap-1.5 bg-cinema-gold text-white text-sm font-bold px-4 py-2 rounded-full hover:opacity-90 transition mb-3"
              >
                <Plus size={15} /> 영화 추가하기
              </button>
            )}
          </div>
        )}

        {/* 현재 상영 중 / 검색 결과 */}
        {isMovieTab && (
          <>
            {movies.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {movies.map((movie) => (
                    <MovieCard
                      key={`${movie.id}-${movie.title}`}
                      movie={movie}
                      hasDiary={myMovieIds.has(movie.id)}
                      hasWatchlist={watchlistMovieIds.has(movie.id)}
                    />
                  ))}
                </div>
                {page < totalPages && (
                  <div className="flex justify-center mt-10">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="px-8 py-3 bg-cinema-card border border-white/10 text-white rounded-full hover:bg-white/10 transition text-sm font-medium disabled:opacity-50"
                    >
                      {loading ? '불러오는 중...' : '더 보기'}
                    </button>
                  </div>
                )}
              </>
            ) : loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div key={i} className="aspect-[2/3] rounded-xl bg-cinema-card animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-cinema-muted">
                {searchQuery ? '검색 결과가 없습니다.' : '영화를 불러오는 중...'}
              </div>
            )}
          </>
        )}

        {/* 볼영화 탭 */}
        {!searchQuery && tab === 'watchlist' && (
          <>
            {!user ? (
              <div className="text-center py-20">
                <Bookmark size={48} className="text-cinema-muted mx-auto mb-4 opacity-40" />
                <p className="text-white font-semibold text-lg mb-2">볼영화 찜 목록</p>
                <p className="text-cinema-muted mb-6">로그인 후 볼영화를 찜할 수 있습니다.</p>
                <button
                  onClick={loginWithGoogle}
                  className="bg-white text-gray-900 font-semibold px-6 py-2.5 rounded-full hover:bg-gray-100 transition text-sm"
                >
                  Google로 로그인
                </button>
              </div>
            ) : watchlistLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[2/3] rounded-xl bg-cinema-card animate-pulse" />
                ))}
              </div>
            ) : watchlist.length === 0 ? (
              <div className="text-center py-20">
                <Bookmark size={48} className="text-cinema-muted mx-auto mb-4 opacity-40" />
                <p className="text-white font-semibold text-lg mb-2">찜한 영화가 없어요</p>
                <p className="text-cinema-muted">영화 상세 페이지에서 북마크 버튼을 눌러 찜해보세요!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {watchlist.map((item) => (
                  <WatchlistCard key={item.id} item={item} onRemove={handleRemoveFromWatchlist} />
                ))}
              </div>
            )}
          </>
        )}

        {/* 내 일기 탭 */}
        {!searchQuery && tab === 'my_diary' && (
          <>
            {!user ? (
              <div className="text-center py-20">
                <BookOpen size={48} className="text-cinema-muted mx-auto mb-4 opacity-40" />
                <p className="text-white font-semibold text-lg mb-2">내 영화 일기장</p>
                <p className="text-cinema-muted mb-6">로그인 후 일기를 확인할 수 있습니다.</p>
                <button
                  onClick={loginWithGoogle}
                  className="bg-white text-gray-900 font-semibold px-6 py-2.5 rounded-full hover:bg-gray-100 transition text-sm"
                >
                  Google로 로그인
                </button>
              </div>
            ) : diariesLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[2/3] rounded-xl bg-cinema-card animate-pulse" />
                ))}
              </div>
            ) : myDiaries.length === 0 ? (
              <div className="text-center py-20">
                <Film size={48} className="text-cinema-muted mx-auto mb-4 opacity-40" />
                <p className="text-white font-semibold text-lg mb-2">아직 일기가 없어요</p>
                <p className="text-cinema-muted mb-6">본 영화를 추가하고 감상을 기록해보세요!</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 bg-cinema-gold text-white font-bold px-6 py-2.5 rounded-full hover:opacity-90 transition text-sm mx-auto"
                >
                  <Plus size={15} /> 첫 번째 영화 추가하기
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {myDiaries.map((diary) => (
                  <DiaryCard key={diary.id} diary={diary} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showAddModal && <AddMovieModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cinema-bg" />}>
      <HomeContent />
    </Suspense>
  );
}
