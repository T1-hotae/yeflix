// 사이트 전역 메타데이터 상수
// 레이아웃 metadata / manifest / sitemap / robots 가 공유한다.

export const SITE_NAME = 'Yeflix';

// 배포 도메인. Vercel 프로젝트 환경변수 NEXT_PUBLIC_SITE_URL 로 주입한다.
// (OG 이미지·canonical 은 절대 URL 이어야 해서 이 값이 틀리면 공유 미리보기가 깨진다)
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yeflix-diary.vercel.app'
).replace(/\/+$/, '');

export const SITE_TAGLINE = '내가 본 모든 것의 기록';

export const SITE_DESCRIPTION =
  '영화 · 드라마 · 책을 검색해 별점과 감상을 기록하고, 보고 싶은 작품은 찜해두는 나만의 감상 일기장. 국내 OTT와 서점 바로가기까지 한 번에.';

// 기본 공유 이미지 (1200x630). 상세 페이지는 각자 포스터/배경을 쓴다.
export const OG_IMAGE = {
  url: '/og.png',
  width: 1200,
  height: 630,
  alt: 'Yeflix — 영화 · 드라마 · 책 감상 일기장',
};

export const absoluteUrl = (path = '/') => new URL(path, SITE_URL).toString();
