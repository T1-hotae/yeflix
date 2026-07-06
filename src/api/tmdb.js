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

// 인기 영화 목록
export const getPopular = (page = 1) =>
  fetcher('/movie/popular', { page });

// 현재 상영 중
export const getNowPlaying = (page = 1) =>
  fetcher('/movie/now_playing', { page });

// 개봉 예정
export const getUpcoming = (page = 1) =>
  fetcher('/movie/upcoming', { page });

// 영화 검색
export const searchMovies = (query, page = 1) =>
  fetcher('/search/movie', { query: query.trim().replace(/\s+/g, ' '), page });

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

// 포스터 이미지 URL 생성
export const getPosterUrl = (path, size = 'w500') => {
  if (!path) return null;
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
