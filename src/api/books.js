// 카카오 책 검색 - 클라이언트 래퍼
// 실제 호출은 /api/books 라우트 핸들러가 서버에서 대신 한다 (REST 키 비노출).

const PROXY_URL = '/api/books';

const fetcher = async (params) => {
  const url = new URL(PROXY_URL, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v != null) url.searchParams.set(k, v);
  });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Book API Error: ${res.status}`);
  return res.json();
};

// 책 검색
export const searchBooks = (query, page = 1) =>
  fetcher({ query: query.trim(), page });

// ISBN으로 한 권 조회 (카카오는 상세 전용 엔드포인트가 없어 재검색한다)
export const getBookDetail = async (isbn) => {
  const data = await fetcher({ query: isbn, target: 'isbn' });
  return data.documents?.[0] ?? null;
};

// 카카오 isbn 필드는 "ISBN10 ISBN13" 형태의 공백 구분 문자열이고
// 둘 중 하나만 오는 경우도 있다.
export const getIsbn13 = (doc) => {
  const parts = (doc.isbn ?? '').split(' ').filter(Boolean);
  return parts.find((v) => v.length === 13) ?? parts[0] ?? '';
};

export const formatAuthors = (doc) => {
  const authors = doc.authors?.join(', ') ?? '';
  const translators = doc.translators?.length ? ` (${doc.translators.join(', ')} 옮김)` : '';
  return authors + translators;
};

export const normalizeBook = (doc) => ({
  mediaType: 'book',
  id: getIsbn13(doc),
  title: doc.title,
  poster: doc.thumbnail || null,
  subtitle: doc.authors?.join(', ') ?? '',
  rating: null,
});
