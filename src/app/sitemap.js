import { SITE_URL } from '../lib/site';

// 상세 페이지(/movie/:id 등)는 TMDB·카카오 전체를 열거할 수 없어 넣지 않는다.
// 공유 링크로 유입되면 각 라우트 layout 의 generateMetadata 가 미리보기를 채운다.
export default function sitemap() {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
