import {
  fetchTmdb,
  clamp,
  tmdbShareImage,
  fallbackMetadata,
} from '../../../lib/detailMetadata';
import { SITE_NAME } from '../../../lib/site';

export async function generateMetadata({ params }) {
  const path = `/movie/${params.id}`;
  const movie = await fetchTmdb(`/movie/${params.id}`);

  if (!movie?.title) return fallbackMetadata('영화', path);

  const year = movie.release_date?.slice(0, 4);
  const title = year ? `${movie.title} (${year})` : movie.title;
  const description =
    clamp(movie.overview) ||
    `${movie.title} — 별점과 감상을 기록하고 어디서 볼 수 있는지 확인해보세요.`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'video.movie',
      siteName: SITE_NAME,
      locale: 'ko_KR',
      url: path,
      title,
      description,
      images: tmdbShareImage(movie, `${movie.title} 스틸컷`),
      releaseDate: movie.release_date || undefined,
      tags: movie.genres?.map((g) => g.name),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function MovieDetailLayout({ children }) {
  return children;
}
