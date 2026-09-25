'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Film, Tv, BookOpen, Plus, Bookmark } from 'lucide-react';
import { searchMedia } from '../api/search';
import { getMyDiaries, getMyMediaKeys } from '../firebase/diary';
import { getWatchlist, removeFromWatchlist, getWatchlistKeys } from '../firebase/watchlist';
import { useAuth } from '../context/AuthContext';
import {
  MEDIA_TYPES,
  MEDIA_LABEL,
  MEDIA_FILTERS,
  WATCHLIST_LABEL,
  mediaKey,
  parseMediaType,
} from '../lib/media';
import MediaCard from '../components/MediaCard';
import DiaryCard from '../components/DiaryCard';
import WatchlistCard from '../components/WatchlistCard';
import AddMediaModal from '../components/AddMediaModal';
import MediaGrid, { GridSkeleton } from '../components/MediaGrid';
import EmptyState from '../components/EmptyState';
import FilterChips from '../components/FilterChips';

const TABS = [
  { id: 'my_diary', label: '내 일기' },
  { id: 'wl_movie', label: WATCHLIST_LABEL.movie, mediaType: 'movie' },
  { id: 'wl_tv', label: WATCHLIST_LABEL.tv, mediaType: 'tv' },
  { id: 'wl_book', label: WATCHLIST_LABEL.book, mediaType: 'book' },
];

const TYPE_ICON = { movie: Film, tv: Tv, book: BookOpen };

const DIARY_EMPTY_TITLE = {
  movie: '영화 일기가 없어요',
  tv: '드라마 일기가 없어요',
  book: '책 일기가 없어요',
};

const WATCHLIST_EMPTY_TITLE = {
  movie: '찜한 영화가 없어요',
  tv: '찜한 드라마가 없어요',
  book: '찜한 책이 없어요',
};

const WATCHLIST_HINT = {
  movie: '영화 상세 페이지에서 북마크 버튼을 눌러 찜해보세요!',
  tv: '드라마 상세 페이지에서 북마크 버튼을 눌러 찜해보세요!',
  book: '책 상세 페이지에서 북마크 버튼을 눌러 찜해보세요!',
};

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') ?? '';
  const searchType = parseMediaType(searchParams.get('type'));

  const [tab, setTab] = useState('my_diary');
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [diaryKeys, setDiaryKeys] = useState(new Set());
  const [watchlistKeys, setWatchlistKeys] = useState(new Set());
  const [myDiaries, setMyDiaries] = useState([]);
  const [diariesLoading, setDiariesLoading] = useState(false);
  const [diaryFilter, setDiaryFilter] = useState('all');
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const { user, loginWithGoogle } = useAuth();

  // Navbar 드롭다운에서 탭 전환
  useEffect(() => {
    const handler = (e) => setTab(e.detail);
    window.addEventListener('switch-tab', handler);
    return () => window.removeEventListener('switch-tab', handler);
  }, []);

  // 카드 뱃지용 키 목록
  useEffect(() => {
    if (!user) { setDiaryKeys(new Set()); setWatchlistKeys(new Set()); return; }
    getMyMediaKeys(user.uid).then(setDiaryKeys).catch(console.error);
    getWatchlistKeys(user.uid).then(setWatchlistKeys).catch(console.error);
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

  // 찜 목록은 타입별로 나누지 않고 한 번만 불러온다 (탭 전환 시 재요청 없음)
  useEffect(() => {
    if (!user) { setWatchlist([]); return; }
    setWatchlistLoading(true);
    getWatchlist(user.uid)
      .then(setWatchlist)
      .catch(console.error)
      .finally(() => setWatchlistLoading(false));
  }, [user]);

  const handleRemoveFromWatchlist = async (mediaType, itemId) => {
    if (!user) return;
    await removeFromWatchlist(user.uid, mediaType, itemId);
    setWatchlist((prev) => prev.filter((item) => !(item.mediaType === mediaType && item.itemId === itemId)));
    setWatchlistKeys((prev) => {
      const next = new Set(prev);
      next.delete(mediaKey(mediaType, itemId));
      return next;
    });
  };

  const fetchResults = useCallback(async (currentPage, reset = false) => {
    setLoading(true);
    try {
      const data = await searchMedia(searchType, searchQuery, currentPage);
      setResults((prev) => (reset ? data.items : [...prev, ...data.items]));
      setHasMore(data.hasMore);
    } catch (err) {
      console.error(err);
      if (reset) setResults([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, searchType]);

  useEffect(() => {
    if (!searchQuery) return;
    setPage(1);
    setResults([]);
    fetchResults(1, true);
  }, [searchQuery, searchType, fetchResults]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchResults(next);
  };

  const changeSearchType = (type) => {
    router.replace(`/?search=${encodeURIComponent(searchQuery)}&type=${type}`);
  };

  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0];
  const watchlistOf = (mediaType) => watchlist.filter((item) => item.mediaType === mediaType);
  const countOf = (mediaType) => watchlistOf(mediaType).length;

  const filteredDiaries = diaryFilter === 'all'
    ? myDiaries
    : myDiaries.filter((d) => d.mediaType === diaryFilter);

  const diaryFilters = [
    { value: 'all', label: '전체', count: myDiaries.length },
    ...MEDIA_TYPES.map((type) => ({
      value: type,
      label: MEDIA_LABEL[type],
      count: myDiaries.filter((d) => d.mediaType === type).length,
    })),
  ];

  return (
    <div className="min-h-screen bg-cinema-bg">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* 탭 or 검색 헤더 */}
        {searchQuery ? (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">
              "<span className="text-cinema-gold">{searchQuery}</span>" 검색 결과
            </h1>
            <p className="text-cinema-muted text-sm mt-1">
              {results.length}개의 {MEDIA_LABEL[searchType]}
            </p>
            <FilterChips
              className="mt-4"
              options={MEDIA_FILTERS}
              value={searchType}
              onChange={changeSearchType}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between mb-6 border-b border-white/20">
            <div className="flex gap-2 sm:gap-4 min-w-0 flex-1 overflow-x-auto scrollbar-hide">
              {TABS.map((t) => {
                const count = t.id === 'my_diary' ? myDiaries.length : countOf(t.mediaType);
                const badgeClass = t.id === 'my_diary'
                  ? 'bg-cinema-gold/20 text-cinema-goldText'
                  : 'bg-blue-500/20 text-blue-400';
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`pb-3 text-xs sm:text-sm font-semibold transition border-b-2 -mb-px whitespace-nowrap shrink-0 ${
                      tab === t.id
                        ? 'border-cinema-gold text-cinema-goldText'
                        : 'border-transparent text-cinema-muted hover:text-white'
                    }`}
                  >
                    {t.label}
                    {count > 0 && (
                      <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${badgeClass}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {tab === 'my_diary' && (
              <button
                onClick={() => user ? setShowAddModal(true) : loginWithGoogle()}
                className="flex items-center gap-1.5 bg-cinema-gold text-white text-sm font-bold px-2.5 sm:px-4 py-2 rounded-full hover:opacity-90 transition mb-3 shrink-0 ml-2"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">기록 추가하기</span>
              </button>
            )}
          </div>
        )}

        {/* 검색 결과 */}
        {searchQuery && (
          <>
            {results.length > 0 ? (
              <>
                <MediaGrid>
                  {results.map((item) => (
                    <MediaCard
                      key={`${item.mediaType}-${item.id}`}
                      item={item}
                      hasDiary={diaryKeys.has(mediaKey(item.mediaType, item.id))}
                      hasWatchlist={watchlistKeys.has(mediaKey(item.mediaType, item.id))}
                    />
                  ))}
                </MediaGrid>
                {hasMore && (
                  <div className="flex justify-center mt-10">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="px-8 py-3 bg-cinema-card border border-white/20 text-white rounded-full hover:bg-white/10 transition text-sm font-medium disabled:opacity-50"
                    >
                      {loading ? '불러오는 중...' : '더 보기'}
                    </button>
                  </div>
                )}
              </>
            ) : loading ? (
              <GridSkeleton count={18} />
            ) : (
              <div className="text-center py-20 text-cinema-muted">검색 결과가 없습니다.</div>
            )}
          </>
        )}

        {/* 찜 목록 탭 (볼영화 / 볼드라마 / 볼책) */}
        {!searchQuery && activeTab.mediaType && (
          <>
            {!user ? (
              <EmptyState
                icon={Bookmark}
                title={`${activeTab.label} 찜 목록`}
                description="로그인 후 찜 목록을 확인할 수 있습니다."
              >
                <button
                  onClick={loginWithGoogle}
                  className="bg-white text-gray-900 font-semibold px-6 py-2.5 rounded-full hover:bg-gray-100 transition text-sm"
                >
                  Google로 로그인
                </button>
              </EmptyState>
            ) : watchlistLoading ? (
              <GridSkeleton count={6} />
            ) : countOf(activeTab.mediaType) === 0 ? (
              <EmptyState
                icon={TYPE_ICON[activeTab.mediaType]}
                title={WATCHLIST_EMPTY_TITLE[activeTab.mediaType]}
                description={WATCHLIST_HINT[activeTab.mediaType]}
              />
            ) : (
              <MediaGrid>
                {watchlistOf(activeTab.mediaType).map((item) => (
                  <WatchlistCard key={item.id} item={item} onRemove={handleRemoveFromWatchlist} />
                ))}
              </MediaGrid>
            )}
          </>
        )}

        {/* 내 일기 탭 */}
        {!searchQuery && tab === 'my_diary' && (
          <>
            {!user ? (
              <EmptyState
                icon={BookOpen}
                title="내 기록장"
                description="로그인 후 일기를 확인할 수 있습니다."
              >
                <button
                  onClick={loginWithGoogle}
                  className="bg-white text-gray-900 font-semibold px-6 py-2.5 rounded-full hover:bg-gray-100 transition text-sm"
                >
                  Google로 로그인
                </button>
              </EmptyState>
            ) : diariesLoading ? (
              <GridSkeleton count={6} />
            ) : myDiaries.length === 0 ? (
              <EmptyState
                icon={Film}
                title="아직 일기가 없어요"
                description="본 영화 · 드라마, 읽은 책을 추가하고 감상을 기록해보세요!"
              >
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 bg-cinema-gold text-white font-bold px-6 py-2.5 rounded-full hover:opacity-90 transition text-sm mx-auto"
                >
                  <Plus size={15} /> 첫 번째 기록 추가하기
                </button>
              </EmptyState>
            ) : (
              <>
                <FilterChips
                  className="mb-5"
                  options={diaryFilters}
                  value={diaryFilter}
                  onChange={setDiaryFilter}
                />

                {filteredDiaries.length === 0 ? (
                  <EmptyState
                    icon={TYPE_ICON[diaryFilter] ?? Film}
                    title={DIARY_EMPTY_TITLE[diaryFilter] ?? '일기가 없어요'}
                    description={`${MEDIA_LABEL[diaryFilter]} 일기를 기록하면 여기에 모아서 볼 수 있어요.`}
                  />
                ) : (
                  <MediaGrid>
                    {filteredDiaries.map((diary) => (
                      <DiaryCard key={diary.id} diary={diary} />
                    ))}
                  </MediaGrid>
                )}
              </>
            )}
          </>
        )}
      </div>

      {showAddModal && <AddMediaModal onClose={() => setShowAddModal(false)} />}
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
