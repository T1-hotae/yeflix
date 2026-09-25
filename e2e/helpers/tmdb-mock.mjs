// TMDB API / 카카오 책 프록시 / 이미지 / 외부 OTT·서점 사이트를 가로채
// 테스트를 결정적으로 만듭니다.
// (실제 네트워크를 타지 않으므로 API 키·쿼터·응답 변동에 영향받지 않습니다)

import {
  DIARY_MOVIE,
  WATCHLIST_MOVIE,
  WATCHLIST_TV,
  WATCHLIST_BOOK,
} from './constants.mjs';

// 1x1 투명 PNG
const PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

export const NETFLIX = {
  logo_path: '/netflix.jpg',
  provider_id: 8,
  provider_name: 'Netflix',
  display_priority: 1,
};

export const WATCHA = {
  logo_path: '/watcha.jpg',
  provider_id: 97,
  provider_name: 'Watcha',
  display_priority: 2,
};

export const MOVIE_DETAILS = {
  [DIARY_MOVIE.id]: {
    id: DIARY_MOVIE.id,
    title: DIARY_MOVIE.title,
    original_title: DIARY_MOVIE.originalTitle,
    poster_path: DIARY_MOVIE.posterPath,
    backdrop_path: '/fight-club-backdrop.jpg',
    overview: '불면증에 시달리던 남자가 비누를 만드는 타일러 더든을 만나면서 벌어지는 이야기.',
    release_date: '1999-10-15',
    runtime: 139,
    vote_average: 8.4,
    vote_count: 28000,
    genres: [{ id: 18, name: '드라마' }],
  },
  [WATCHLIST_MOVIE.id]: {
    id: WATCHLIST_MOVIE.id,
    title: WATCHLIST_MOVIE.title,
    original_title: WATCHLIST_MOVIE.originalTitle,
    poster_path: WATCHLIST_MOVIE.posterPath,
    backdrop_path: '/inception-backdrop.jpg',
    overview: '타인의 꿈에 침투해 생각을 훔치는 특수 보안 요원의 마지막 임무.',
    release_date: '2010-07-16',
    runtime: 148,
    vote_average: 8.3,
    vote_count: 35000,
    genres: [{ id: 28, name: '액션' }],
  },
};

export const TV_DETAILS = {
  [WATCHLIST_TV.id]: {
    id: WATCHLIST_TV.id,
    name: WATCHLIST_TV.title,
    original_name: WATCHLIST_TV.originalName,
    poster_path: WATCHLIST_TV.posterPath,
    backdrop_path: '/woo-backdrop.jpg',
    overview: '자폐 스펙트럼을 가진 천재 변호사 우영우의 성장기.',
    first_air_date: '2022-06-29',
    number_of_seasons: 1,
    number_of_episodes: 16,
    vote_average: 8.6,
    vote_count: 900,
    genres: [{ id: 18, name: '드라마' }],
    origin_country: ['KR'],
    created_by: [{ id: 1, name: '문지원' }],
    networks: [{ id: 96, name: 'ENA' }],
  },
};

const CREDITS = {
  cast: [
    { id: 819, name: '에드워드 노튼', character: '내레이터', profile_path: '/norton.jpg' },
    { id: 287, name: '브래드 피트', character: '타일러 더든', profile_path: '/pitt.jpg' },
  ],
  crew: [{ id: 7467, name: '데이빗 핀처', job: 'Director' }],
};

const TV_CREDITS = {
  cast: [
    { id: 9001, name: '박은빈', character: '우영우', profile_path: '/park.jpg' },
    { id: 9002, name: '강태오', character: '이준호', profile_path: '/kang.jpg' },
  ],
  crew: [],
};

// 카카오 책 검색 API 응답 형식 (documents / meta)
export const BOOK_DOCUMENTS = [
  {
    title: WATCHLIST_BOOK.title,
    contents: '소년 싱클레어가 데미안을 만나 자기 자신에게 이르는 길을 찾아가는 성장소설.',
    url: 'https://search.daum.net/search?w=bookpage&bookId=e2e-demian',
    isbn: `8937460440 ${WATCHLIST_BOOK.isbn}`,
    datetime: '2009-01-20T00:00:00.000+09:00',
    authors: WATCHLIST_BOOK.authors,
    publisher: WATCHLIST_BOOK.publisher,
    translators: ['전영애'],
    price: 10000,
    sale_price: 9000,
    thumbnail: WATCHLIST_BOOK.thumbnail,
    status: '정상판매',
  },
];

const listResponse = (results) => ({
  page: 1,
  results,
  total_pages: 1,
  total_results: results.length,
});

function watchProvidersFor(id, kind = 'movie') {
  return {
    id: Number(id),
    results: {
      KR: {
        link: `https://www.themoviedb.org/${kind}/${id}/watch?locale=KR`,
        flatrate: [NETFLIX, WATCHA],
      },
    },
  };
}

function resolveTmdb(pathname, searchParams) {
  // /3/movie/550/watch/providers
  let match = pathname.match(/^\/3\/movie\/(\d+)\/watch\/providers$/);
  if (match) return watchProvidersFor(match[1], 'movie');

  // /3/tv/135157/watch/providers
  match = pathname.match(/^\/3\/tv\/(\d+)\/watch\/providers$/);
  if (match) return watchProvidersFor(match[1], 'tv');

  // /3/movie/550/credits
  if (/^\/3\/movie\/\d+\/credits$/.test(pathname)) return CREDITS;

  // /3/tv/135157/credits
  if (/^\/3\/tv\/\d+\/credits$/.test(pathname)) return TV_CREDITS;

  // /3/search/movie?query=...
  if (pathname === '/3/search/movie') {
    const query = (searchParams.get('query') ?? '').toLowerCase();
    const results = Object.values(MOVIE_DETAILS).filter(
      (m) =>
        m.title.toLowerCase().includes(query) ||
        m.original_title.toLowerCase().includes(query),
    );
    return listResponse(results);
  }

  // /3/search/tv?query=...
  if (pathname === '/3/search/tv') {
    const query = (searchParams.get('query') ?? '').toLowerCase();
    const results = Object.values(TV_DETAILS).filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.original_name.toLowerCase().includes(query),
    );
    return listResponse(results);
  }

  // /3/movie/550
  match = pathname.match(/^\/3\/movie\/(\d+)$/);
  if (match) return MOVIE_DETAILS[match[1]] ?? null;

  // /3/tv/135157
  match = pathname.match(/^\/3\/tv\/(\d+)$/);
  if (match) return TV_DETAILS[match[1]] ?? null;

  return null;
}

function resolveBooks(searchParams) {
  const query = (searchParams.get('query') ?? '').toLowerCase();
  const documents = BOOK_DOCUMENTS.filter(
    (b) => b.title.toLowerCase().includes(query) || b.isbn.includes(query),
  );
  return { documents, meta: { is_end: true, total_count: documents.length, pageable_count: documents.length } };
}

// 앱이 "보러가기"로 내보내는 외부 호스트 전체 목록.
// 여기 빠진 호스트는 테스트가 실제 사이트로 네트워크 요청을 보낸다.
//
// tests/component/external-links.test.jsx 가 이 목록을 실제 컴포넌트가 만드는
// 링크와 대조하므로, 서점·OTT를 추가하고 여기 안 넣으면 `npm test`가 알려준다.
export const EXTERNAL_HOSTS = [
  // OTT
  'www.netflix.com',
  'watcha.com',
  'www.wavve.com',
  'www.tving.com',
  'www.coupangplay.com',
  'www.disneyplus.com',
  'tv.apple.com',
  'www.primevideo.com',
  'www.seezn.com',
  'www.themoviedb.org',
  // 서점 / 도서관 / 전자책
  'search.kyobobook.co.kr',
  'www.yes24.com',
  'www.aladin.co.kr',
  'www.nl.go.kr',
  'www.millie.co.kr',
  'ridibooks.com',
  'search.daum.net',
];

/**
 * 컨텍스트 단위로 외부 요청을 가로챕니다.
 * 컨텍스트에 걸기 때문에 "보러가기"로 열리는 팝업(새 탭)에도 그대로 적용됩니다.
 */
export async function mockExternalRequests(context) {
  // TMDB REST API
  await context.route('**://api.themoviedb.org/**', async (route) => {
    const url = new URL(route.request().url());
    const body = resolveTmdb(url.pathname, url.searchParams);

    if (body === null) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ status_message: 'mock: not found' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });

  // 책 검색 — 앱 자체 라우트(/api/books)를 가로채 카카오를 호출하지 않게 합니다.
  await context.route('**/api/books*', async (route) => {
    const url = new URL(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(resolveBooks(url.searchParams)),
    });
  });

  // 포스터 / 로고 / 프로필 이미지
  await context.route('**://image.tmdb.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL_PNG }),
  );

  // 책 표지 (카카오 CDN)
  await context.route('**://search1.kakaocdn.net/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL_PNG }),
  );

  // "보러가기"로 이동하는 OTT / 서점 사이트 — 실제로 방문하지 않고 스텁 페이지를 돌려줍니다.
  for (const host of EXTERNAL_HOSTS) {
    await context.route(`**://${host}/**`, async (route) => {
      const url = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: `<!doctype html><html lang="ko"><head><title>외부 사이트 스텁</title></head><body><main id="ott-stub" data-url="${url}">${url}</main></body></html>`,
      });
    });
  }
}
