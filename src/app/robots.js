import { SITE_URL } from '../lib/site';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /api 는 JSON 프록시, /settings·/diary 는 로그인해야 내용이 보인다
      disallow: ['/api/', '/settings', '/diary'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
