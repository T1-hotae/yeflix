import { describe, it, expect, vi, beforeEach } from 'vitest';

// 네트워크 함수만 가짜로 바꾸고 정규화 함수는 실제 구현을 그대로 쓴다
// (디스패처가 올바른 normalize 를 고르는지까지 함께 검증하기 위해).
vi.mock('../../src/api/tmdb', async (importOriginal) => ({
  ...(await importOriginal()),
  searchMovies: vi.fn(),
  searchTv: vi.fn(),
}));

vi.mock('../../src/api/books', async (importOriginal) => ({
  ...(await importOriginal()),
  searchBooks: vi.fn(),
}));

const { searchMovies, searchTv } = await import('../../src/api/tmdb');
const { searchBooks } = await import('../../src/api/books');
const { searchMedia } = await import('../../src/api/search');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('타입별 디스패치', () => {
  it('movie 는 TMDB 영화 검색을 부른다', async () => {
    searchMovies.mockResolvedValue({
      results: [{ id: 550, title: '파이트 클럽', poster_path: '/f.jpg', release_date: '1999-10-15', vote_average: 8.4 }],
      total_pages: 1,
    });

    const { items } = await searchMedia('movie', '파이트 클럽');

    expect(searchMovies).toHaveBeenCalledWith('파이트 클럽', 1);
    expect(searchTv).not.toHaveBeenCalled();
    expect(items[0]).toMatchObject({ mediaType: 'movie', id: 550, title: '파이트 클럽' });
  });

  it('tv 는 TMDB 드라마 검색을 부르고 name 을 title 로 바꾼다', async () => {
    searchTv.mockResolvedValue({
      results: [{ id: 1399, name: '왕좌의 게임', first_air_date: '2011-04-17' }],
      total_pages: 1,
    });

    const { items } = await searchMedia('tv', '왕좌');

    expect(searchTv).toHaveBeenCalledWith('왕좌', 1);
    expect(items[0]).toMatchObject({ mediaType: 'tv', id: 1399, title: '왕좌의 게임' });
  });

  it('book 은 카카오 프록시를 부른다', async () => {
    searchBooks.mockResolvedValue({
      documents: [{ isbn: '8937460440 9788937460449', title: '데미안', authors: ['헤르만 헤세'] }],
      meta: { is_end: true },
    });

    const { items } = await searchMedia('book', '데미안');

    expect(searchBooks).toHaveBeenCalledWith('데미안', 1);
    expect(items[0]).toMatchObject({ mediaType: 'book', id: '9788937460449', title: '데미안' });
  });

  it('알 수 없는 타입은 영화로 떨어진다', async () => {
    searchMovies.mockResolvedValue({ results: [], total_pages: 1 });

    await searchMedia('anime', '진격의 거인');

    expect(searchMovies).toHaveBeenCalled();
  });
});

// 소스마다 페이지네이션 규약이 다르다 (TMDB: page < total_pages, 카카오: !meta.is_end).
// 디스패처가 그 차이를 흡수하는 지점이라 경계를 모두 확인한다.
describe('hasMore 경계', () => {
  it('TMDB — 마지막 페이지가 아니면 true', async () => {
    searchMovies.mockResolvedValue({ results: [], total_pages: 3 });
    expect((await searchMedia('movie', 'x', 1)).hasMore).toBe(true);
    expect((await searchMedia('movie', 'x', 2)).hasMore).toBe(true);
  });

  it('TMDB — 마지막 페이지면 false', async () => {
    searchMovies.mockResolvedValue({ results: [], total_pages: 3 });
    expect((await searchMedia('movie', 'x', 3)).hasMore).toBe(false);
  });

  it('TMDB — total_pages 가 없으면 false', async () => {
    searchTv.mockResolvedValue({ results: [] });
    expect((await searchMedia('tv', 'x', 1)).hasMore).toBe(false);
  });

  it('카카오 — is_end 가 false 면 true', async () => {
    searchBooks.mockResolvedValue({ documents: [], meta: { is_end: false } });
    expect((await searchMedia('book', 'x', 1)).hasMore).toBe(true);
  });

  it('카카오 — is_end 가 true 면 false', async () => {
    searchBooks.mockResolvedValue({ documents: [], meta: { is_end: true } });
    expect((await searchMedia('book', 'x', 1)).hasMore).toBe(false);
  });

  it('카카오 — meta 가 없으면 끝난 것으로 본다', async () => {
    searchBooks.mockResolvedValue({ documents: [] });
    expect((await searchMedia('book', 'x', 1)).hasMore).toBe(false);
  });
});

describe('빈 응답', () => {
  it('results / documents 가 없어도 빈 목록을 돌려준다', async () => {
    searchMovies.mockResolvedValue({});
    searchTv.mockResolvedValue({});
    searchBooks.mockResolvedValue({});

    expect(await searchMedia('movie', 'x')).toEqual({ items: [], hasMore: false });
    expect(await searchMedia('tv', 'x')).toEqual({ items: [], hasMore: false });
    expect(await searchMedia('book', 'x')).toEqual({ items: [], hasMore: false });
  });
});

describe('ISBN 없는 책', () => {
  it('상세 페이지로 갈 수 없으므로 목록에서 제외한다', async () => {
    searchBooks.mockResolvedValue({
      documents: [
        { isbn: '', title: 'ISBN 없는 책' },
        { isbn: '9788937460449', title: '데미안' },
      ],
      meta: { is_end: true },
    });

    const { items } = await searchMedia('book', 'x');

    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('데미안');
  });
});
