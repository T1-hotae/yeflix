// 미디어 타입별 검색 디스패처
// 호출부(홈 검색, 추가 모달)는 소스별 응답 차이를 몰라도 되도록
// 항상 { items, hasMore } 형태로 통일해서 돌려준다.

import { searchMovies, searchTv, normalizeMovie, normalizeTv } from './tmdb';
import { searchBooks, normalizeBook } from './books';

export const searchMedia = async (mediaType, query, page = 1) => {
  if (mediaType === 'tv') {
    const data = await searchTv(query, page);
    return {
      items: (data.results ?? []).map(normalizeTv),
      hasMore: page < (data.total_pages ?? 1),
    };
  }

  if (mediaType === 'book') {
    const data = await searchBooks(query, page);
    return {
      // ISBN이 없는 항목은 상세 페이지로 갈 수 없어 제외한다
      items: (data.documents ?? []).map(normalizeBook).filter((b) => b.id),
      hasMore: !(data.meta?.is_end ?? true),
    };
  }

  const data = await searchMovies(query, page);
  return {
    items: (data.results ?? []).map(normalizeMovie),
    hasMore: page < (data.total_pages ?? 1),
  };
};
