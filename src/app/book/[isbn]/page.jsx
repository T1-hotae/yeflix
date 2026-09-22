'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BookOpen, Loader2 } from 'lucide-react';
import { getBookDetail, getIsbn13, formatAuthors } from '../../../api/books';
import { getYear } from '../../../api/tmdb';
import { useAuth } from '../../../context/AuthContext';
import useWatchlist from '../../../hooks/useWatchlist';
import BookLinks from '../../../components/BookLinks';
import WatchlistButton from '../../../components/WatchlistButton';
import MediaDiarySection from '../../../components/MediaDiarySection';

const formatPrice = (price) =>
  price > 0 ? `${price.toLocaleString()}원` : '';

export default function BookDetail() {
  const { isbn } = useParams();
  const { user } = useAuth();

  const [book, setBook] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  const watchlist = useWatchlist(user, 'book', isbn);

  useEffect(() => {
    window.scrollTo(0, 0);
    setPageLoading(true);

    getBookDetail(isbn)
      .then(setBook)
      .catch((err) => { console.error(err); setBook(null); })
      .finally(() => setPageLoading(false));
  }, [isbn]);

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-cinema-bg flex items-center justify-center">
        <Loader2 size={36} className="text-cinema-gold animate-spin" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-cinema-bg flex items-center justify-center text-cinema-muted">
        책 정보를 불러오지 못했습니다.
      </div>
    );
  }

  const cover = book.thumbnail || null;
  const authors = formatAuthors(book);
  const isbn13 = getIsbn13(book);

  return (
    <div className="min-h-screen bg-cinema-bg">
      {/* 책은 백드롭이 없어 표지를 흐리게 깔아 배경으로 쓴다 */}
      {cover && (
        <div className="absolute top-0 left-0 right-0 h-[500px] overflow-hidden -z-10">
          <img src={cover} alt="" className="w-full h-full object-cover opacity-20 blur-2xl scale-110" />
          <div className="absolute inset-0 bg-gradient-to-b from-cinema-bg/30 via-cinema-bg/60 to-cinema-bg" />
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-48 md:w-56 flex-shrink-0 mx-auto md:mx-0">
            {cover ? (
              <img src={cover} alt={book.title} className="w-full rounded-2xl shadow-2xl" />
            ) : (
              <div className="w-full aspect-[2/3] rounded-2xl bg-cinema-card flex items-center justify-center text-cinema-muted">
                <BookOpen size={48} />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-start gap-3">
                <h1 className="text-3xl font-bold text-white leading-tight flex-1">{book.title}</h1>
                {user && (
                  <WatchlistButton
                    mediaType="book"
                    inWatchlist={watchlist.inWatchlist}
                    loading={watchlist.loading}
                    onClick={() => watchlist.toggle({ title: book.title, poster: book.thumbnail || null })}
                  />
                )}
              </div>
              {authors && <p className="text-cinema-muted text-sm mt-1">{authors}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-cinema-muted">
              {book.publisher && <span>{book.publisher}</span>}
              {book.datetime && <><span className="text-white/20">|</span><span>{getYear(book.datetime)}년</span></>}
              {book.status && <><span className="text-white/20">|</span><span>{book.status}</span></>}
            </div>

            {book.sale_price > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-xl">{formatPrice(book.sale_price)}</span>
                {book.price > book.sale_price && (
                  <span className="text-cinema-muted text-sm line-through">{formatPrice(book.price)}</span>
                )}
              </div>
            ) : book.price > 0 ? (
              <div className="text-white font-bold text-xl">{formatPrice(book.price)}</div>
            ) : null}

            {isbn13 && (
              <p className="text-sm text-cinema-muted">
                ISBN: <span className="text-white">{isbn13}</span>
              </p>
            )}

            {book.contents && (
              <p className="text-gray-300 text-sm leading-relaxed line-clamp-6">{book.contents}</p>
            )}

            {/* 보러가기 */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-white font-semibold text-sm">보러가기</span>
                <span className="text-xs text-cinema-muted">카카오 책 제공</span>
              </div>
              <BookLinks isbn={isbn13} title={book.title} detailUrl={book.url} />
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-10 mb-8" />

        <MediaDiarySection
          mediaType="book"
          itemId={isbn}
          item={{ title: book.title, poster: book.thumbnail || null }}
          onSaved={watchlist.removeIfPresent}
        />
      </div>
    </div>
  );
}
