// 상세 페이지(영화/드라마/책) 메타데이터용 서버 전용 헬퍼.
//
// 상세 페이지 본문은 전부 클라이언트 컴포넌트라 generateMetadata 를 둘 수 없다.
// 그래서 각 라우트에 얇은 서버 layout 을 두고 여기서 제목·설명·공유 이미지를 만든다.
// 화면에 쓰는 데이터는 여전히 클라이언트가 받아오고, 여기 호출은 크롤러 응답용이다.

const TMDB_BASE = 'https://api.themoviedb.org/3';
const KAKAO_BOOK_URL = 'https://dapi.kakao.com/v3/search/book';

// 작품 정보는 거의 안 바뀐다 → 하루 캐시해서 크롤러 트래픽에도 API 호출이 안 늘게 한다.
const REVALIDATE = 60 * 60 * 24;

// 메타데이터 때문에 페이지가 통째로 죽으면 안 되므로 실패는 전부 null 로 흘린다.
const safeJson = async (url, options) => {
  try {
    const res = await fetch(url, { ...options, next: { revalidate: REVALIDATE } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

export const fetchTmdb = (path) => {
  const key = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!key) return Promise.resolve(null);

  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', key);
  url.searchParams.set('language', 'ko-KR');
  return safeJson(url);
};

export const fetchBookByIsbn = async (isbn) => {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return null;

  const url = new URL(KAKAO_BOOK_URL);
  url.searchParams.set('query', isbn);
  url.searchParams.set('target', 'isbn');
  url.searchParams.set('size', '1');

  const data = await safeJson(url, { headers: { Authorization: `KakaoAK ${key}` } });
  return data?.documents?.[0] ?? null;
};

/* --------------------------------- 포매터 -------------------------------- */

// 공유 카드에서 잘리지 않게 설명을 자른다 (카카오톡/트위터가 대략 이 근처에서 자름)
export const clamp = (text, max = 150) => {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};

// TMDB 는 16:9 배경(1280x720)이 공유 카드에 가장 잘 맞는다. 없으면 포스터로 폴백.
export const tmdbShareImage = (item, alt) => {
  if (item?.backdrop_path) {
    return [{
      url: `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`,
      width: 1280,
      height: 720,
      alt,
    }];
  }
  if (item?.poster_path) {
    return [{
      url: `https://image.tmdb.org/t/p/w780${item.poster_path}`,
      width: 780,
      height: 1170,
      alt,
    }];
  }
  // 둘 다 없으면 루트 레이아웃의 기본 OG 이미지를 그대로 상속한다
  return undefined;
};

// 카카오가 주는 thumbnail 은 120x174 라 공유 카드에 쓰기엔 너무 작다
// (트위터 summary 최소 200x200 미달). 썸네일 URL 의 fname 파라미터에 원본 표지
// 주소가 들어있어 그걸 꺼내 쓴다. R480x696 같은 리사이즈 요청은 403 이라 불가능.
export const bookCoverUrl = (thumbnail) => {
  if (!thumbnail) return null;
  try {
    const fname = new URL(thumbnail).searchParams.get('fname');
    return fname ? fname.replace(/^http:\/\//, 'https://') : thumbnail;
  } catch {
    return thumbnail;
  }
};

// 데이터를 못 받았을 때 쓰는 최소 메타데이터 (제목만 바꾸고 나머지는 상속)
export const fallbackMetadata = (label, path) => ({
  title: label,
  alternates: { canonical: path },
});
