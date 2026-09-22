const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

export const IMG_BASE_W500 = 'https://image.tmdb.org/t/p/w500';
export const IMG_BASE_W780 = 'https://image.tmdb.org/t/p/w780';
export const IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';
export const LOGO_BASE = 'https://image.tmdb.org/t/p/w45';

const fetcher = async (path, params = {}) => {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('language', 'ko-KR');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
  return res.json();
};

const cleanQuery = (query) => query.trim().replace(/\s+/g, ' ');

/* ---------------------------------- 영화 --------------------------------- */

// 영화 검색
export const searchMovies = (query, page = 1) =>
  fetcher('/search/movie', { query: cleanQuery(query), page });

// 영화 상세 정보
export const getMovieDetail = (id) =>
  fetcher(`/movie/${id}`);

// 출연진/제작진
export const getMovieCredits = (id) =>
  fetcher(`/movie/${id}/credits`);

// 보러가기 - 스트리밍 서비스 정보 (KR 기준)
export const getWatchProviders = async (id) => {
  const data = await fetcher(`/movie/${id}/watch/providers`);
  return data.results?.KR ?? null;
};

/* --------------------------------- 드라마 -------------------------------- */

// 드라마 검색 (국가 제한 없음 - 전체 TV 시리즈)
export const searchTv = (query, page = 1) =>
  fetcher('/search/tv', { query: cleanQuery(query), page });

// 드라마 상세 정보
export const getTvDetail = (id) =>
  fetcher(`/tv/${id}`);

// 드라마 출연진
export const getTvCredits = (id) =>
  fetcher(`/tv/${id}/credits`);

// 드라마 보러가기 (KR 기준)
export const getTvWatchProviders = async (id) => {
  const data = await fetcher(`/tv/${id}/watch/providers`);
  return data.results?.KR ?? null;
};

/* --------------------------------- 정규화 -------------------------------- */
// 목록 UI는 전부 { mediaType, id, title, poster, subtitle, rating } 형태만 소비한다.

export const normalizeMovie = (movie) => ({
  mediaType: 'movie',
  id: movie.id,
  title: movie.title,
  poster: movie.poster_path,
  subtitle: getYear(movie.release_date),
  rating: movie.vote_average,
  originalTitle: movie.original_title,
});

export const normalizeTv = (tv) => ({
  mediaType: 'tv',
  id: tv.id,
  title: tv.name,
  poster: tv.poster_path,
  subtitle: getYear(tv.first_air_date),
  rating: tv.vote_average,
  originalTitle: tv.original_name,
  originCountry: tv.origin_country ?? [],
});

/* --------------------------------- 포매터 -------------------------------- */

// 포스터 이미지 URL 생성
// 책 표지(카카오)는 절대 URL로 넘어오므로 그대로 돌려준다.
export const getPosterUrl = (path, size = 'w500') => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

// 별점 소수점 한 자리로 포맷
export const formatRating = (rating) =>
  rating ? rating.toFixed(1) : '0.0';

// 개봉연도 추출
export const getYear = (dateStr) =>
  dateStr ? dateStr.slice(0, 4) : '';

// 장르 문자열로 변환
export const formatGenres = (genres = []) =>
  genres.map((g) => g.name).join(' · ');

// 상영시간 포맷 (분 → 시간 분)
export const formatRuntime = (minutes) => {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
};

// 시즌/회차 포맷 (드라마)
export const formatSeasons = (seasons, episodes) => {
  const parts = [];
  if (seasons > 0) parts.push(`시즌 ${seasons}`);
  if (episodes > 0) parts.push(`${episodes}부작`);
  return parts.join(' · ');
};
