import {
  fetchBookByIsbn,
  clamp,
  bookCoverUrl,
  fallbackMetadata,
} from '../../../lib/detailMetadata';
import { SITE_NAME } from '../../../lib/site';

export async function generateMetadata({ params }) {
  const path = `/book/${params.isbn}`;
  const book = await fetchBookByIsbn(params.isbn);

  if (!book?.title) return fallbackMetadata('책', path);

  const authors = book.authors?.join(', ');
  const title = authors ? `${book.title} — ${authors}` : book.title;
  const description =
    clamp(book.contents) ||
    `${book.title} — 읽은 기록과 감상을 남기고 어디서 살 수 있는지 확인해보세요.`;

  const cover = bookCoverUrl(book.thumbnail);

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'book',
      siteName: SITE_NAME,
      locale: 'ko_KR',
      url: path,
      title,
      description,
      images: cover ? [{ url: cover, alt: `${book.title} 표지` }] : undefined,
      authors: book.authors,
      isbn: params.isbn,
      releaseDate: book.datetime || undefined,
    },
    twitter: {
      // 표지는 세로로 길어서 large_image 로 띄우면 위아래가 잘린다
      card: cover ? 'summary' : 'summary_large_image',
      title,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

export default function BookDetailLayout({ children }) {
  return children;
}
