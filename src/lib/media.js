// 영화 / 드라마 / 책 공용 헬퍼
// 컴포넌트와 firebase 레이어가 함께 쓰는 순수 함수만 둔다 (JSX·외부 의존 없음)

export const MEDIA_TYPES = ['movie', 'tv', 'book'];

// 검색 필터 칩 등에서 쓰는 짧은 라벨
export const MEDIA_LABEL = {
  movie: '영화',
  tv: '드라마',
  book: '책',
};

// 홈 탭 / 찜 버튼 라벨
export const WATCHLIST_LABEL = {
  movie: '볼영화',
  tv: '볼드라마',
  book: '볼책',
};

export const isMediaType = (type) => MEDIA_TYPES.includes(type);

// URL ?type= 값 정규화 (없거나 이상하면 영화)
export const parseMediaType = (value) => (isMediaType(value) ? value : 'movie');

// Firestore 문서 ID
// 영화는 기존 `uid_550` 형식을 그대로 유지해서 기존 데이터 마이그레이션을 피한다.
export const docKey = (userId, mediaType, itemId) =>
  mediaType === 'movie' ? `${userId}_${itemId}` : `${userId}_${mediaType}_${itemId}`;

// 카드 뱃지(일기 있음 / 찜 함) 판별용 합성 키
export const mediaKey = (mediaType, itemId) => `${mediaType}:${itemId}`;

// 레거시 문서에는 mediaType이 없다 → 영화로 간주
export const typeOf = (docData) => docData?.mediaType ?? 'movie';

export const detailHref = (mediaType, itemId) => `/${mediaType}/${itemId}`;

// 책 ID는 문자열(ISBN13), TMDB ID는 숫자
export const coerceId = (mediaType, itemId) =>
  mediaType === 'book' ? String(itemId) : Number(itemId);
