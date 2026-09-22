'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Film, Tv, BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { getPosterUrl, formatRating } from '../api/tmdb';
import { searchMedia } from '../api/search';
import { MEDIA_TYPES, MEDIA_LABEL, detailHref } from '../lib/media';
import FilterChips from './FilterChips';

const TYPE_FILTERS = MEDIA_TYPES.map((type) => ({ value: type, label: MEDIA_LABEL[type] }));
const FALLBACK_ICON = { movie: Film, tv: Tv, book: BookOpen };
const PLACEHOLDER = {
  movie: '본 영화 제목을 검색하세요...',
  tv: '본 드라마 제목을 검색하세요...',
  book: '읽은 책 제목을 검색하세요...',
};

export default function AddMediaModal({ onClose }) {
  const [mediaType, setMediaType] = useState('movie');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const router = useRouter();

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { items } = await searchMedia(mediaType, query);
        setResults(items.slice(0, 12));
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query, mediaType]);

  const handleSelect = (item) => {
    inputRef.current?.blur();
    router.push(detailHref(item.mediaType, item.id));
    onClose();
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const FallbackIcon = FALLBACK_ICON[mediaType];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-20 px-3 sm:px-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-2xl bg-cinema-card rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        {/* 검색창 */}
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 border-b border-white/20">
          <Search size={18} className="text-cinema-muted flex-shrink-0" />
          <input
            ref={inputRef}
            type="search"
            name="media-title-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={PLACEHOLDER[mediaType]}
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore=""
            className="flex-1 min-w-0 bg-transparent text-white text-base outline-none placeholder-cinema-muted"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="검색어 지우기"
              className="flex-shrink-0 p-1 text-cinema-muted hover:text-white transition"
            >
              <X size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="검색 닫기"
            className="flex-shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-sm text-cinema-muted hover:bg-white/10 hover:text-white transition"
          >
            닫기
          </button>
        </div>

        {/* 타입 필터 */}
        <div className="px-3 sm:px-5 py-3 border-b border-white/15">
          <FilterChips options={TYPE_FILTERS} value={mediaType} onChange={setMediaType} />
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
              <p className="text-sm">{MEDIA_LABEL[mediaType]} 제목을 입력하면 검색 결과가 나타납니다.</p>
            </div>
          )}

          {!loading && results.map((item) => (
            <button
              key={`${item.mediaType}-${item.id}`}
              onClick={() => handleSelect(item)}
              className="w-full flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3 hover:bg-white/5 transition text-left border-b border-white/15 last:border-0"
            >
              <div className="w-10 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-cinema-surface">
                {item.poster ? (
                  <img src={getPosterUrl(item.poster, 'w92')} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-cinema-muted">
                    <FallbackIcon size={18} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm line-clamp-1">{item.title}</p>
                {item.originalTitle && item.originalTitle !== item.title && (
                  <p className="text-cinema-muted text-xs line-clamp-1">{item.originalTitle}</p>
                )}
                <div className="flex items-center gap-2 mt-0.5 min-w-0">
                  {item.subtitle && (
                    <span className="text-cinema-muted text-xs line-clamp-1">{item.subtitle}</span>
                  )}
                  {item.rating > 0 && (
                    <span className="text-yellow-400 text-xs flex-shrink-0">★ {formatRating(item.rating)}</span>
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
