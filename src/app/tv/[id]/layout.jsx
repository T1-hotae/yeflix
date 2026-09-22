import {
  fetchTmdb,
  clamp,
  tmdbShareImage,
  fallbackMetadata,
} from '../../../lib/detailMetadata';
import { SITE_NAME } from '../../../lib/site';

export async function generateMetadata({ params }) {
  const path = `/tv/${params.id}`;
  const tv = await fetchTmdb(`/tv/${params.id}`);

  if (!tv?.name) return fallbackMetadata('드라마', path);

  const year = tv.first_air_date?.slice(0, 4);
  const title = year ? `${tv.name} (${year})` : tv.name;
  const description =
    clamp(tv.overview) ||
    `${tv.name} — 별점과 감상을 기록하고 어디서 볼 수 있는지 확인해보세요.`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'video.tv_show',
      siteName: SITE_NAME,
      locale: 'ko_KR',
      url: path,
      title,
      description,
      images: tmdbShareImage(tv, `${tv.name} 스틸컷`),
      releaseDate: tv.first_air_date || undefined,
      tags: tv.genres?.map((g) => g.name),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function TvDetailLayout({ children }) {
  return children;
}
