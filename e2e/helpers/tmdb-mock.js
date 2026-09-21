// TMDB API / 이미지 / 외부 OTT 사이트를 가로채 테스트를 결정적으로 만듭니다.
// (실제 네트워크를 타지 않으므로 API 키·쿼터·응답 변동에 영향받지 않습니다)

const { DIARY_MOVIE, WATCHLIST_MOVIE } = require('./constants');

// 1x1 투명 PNG
const PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

const NETFLIX = {
  logo_path: '/netflix.jpg',
  provider_id: 8,
  provider_name: 'Netflix',
  display_priority: 1,
};

const WATCHA = {
  logo_path: '/watcha.jpg',
  provider_id: 97,
  provider_name: 'Watcha',
  display_priority: 2,
};

const MOVIE_DETAILS = {
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

const CREDITS = {
  cast: [
    { id: 819, name: '에드워드 노튼', character: '내레이터', profile_path: '/norton.jpg' },
    { id: 287, name: '브래드 피트', character: '타일러 더든', profile_path: '/pitt.jpg' },
  ],
  crew: [{ id: 7467, name: '데이빗 핀처', job: 'Director' }],
};

const listResponse = (results) => ({
  page: 1,
  results,
  total_pages: 1,
  total_results: results.length,
});

const NOW_PLAYING = listResponse([
  MOVIE_DETAILS[DIARY_MOVIE.id],
  MOVIE_DETAILS[WATCHLIST_MOVIE.id],
]);

function watchProvidersFor(movieId) {
  return {
    id: Number(movieId),
    results: {
      KR: {
        link: `https://www.themoviedb.org/movie/${movieId}/watch?locale=KR`,
        flatrate: [NETFLIX, WATCHA],
      },
    },
  };
}

function resolveTmdb(pathname, searchParams) {
  // /3/movie/550/watch/providers
  let match = pathname.match(/^\/3\/movie\/(\d+)\/watch\/providers$/);
  if (match) return watchProvidersFor(match[1]);

  // /3/movie/550/credits
  if (/^\/3\/movie\/\d+\/credits$/.test(pathname)) return CREDITS;

  // /3/movie/now_playing
  if (pathname === '/3/movie/now_playing') return NOW_PLAYING;

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

  // /3/movie/550
  match = pathname.match(/^\/3\/movie\/(\d+)$/);
  if (match) return MOVIE_DETAILS[match[1]] ?? null;

  return null;
}

/**
 * 컨텍스트 단위로 외부 요청을 가로챕니다.
 * 컨텍스트에 걸기 때문에 "보러가기"로 열리는 팝업(새 탭)에도 그대로 적용됩니다.
 */
async function mockExternalRequests(context) {
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

  // 포스터 / 로고 / 프로필 이미지
  await context.route('**://image.tmdb.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL_PNG }),
  );

  // "보러가기"로 이동하는 OTT 사이트 — 실제로 방문하지 않고 스텁 페이지를 돌려줍니다.
  const OTT_HOSTS = [
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
  ];

  for (const host of OTT_HOSTS) {
    await context.route(`**://${host}/**`, async (route) => {
      const url = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: `<!doctype html><html lang="ko"><head><title>OTT 스텁</title></head><body><main id="ott-stub" data-url="${url}">${url}</main></body></html>`,
      });
    });
  }
}

module.exports = {
  mockExternalRequests,
  MOVIE_DETAILS,
  NETFLIX,
  WATCHA,
};
