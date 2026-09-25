/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchBooks, getBookDetail } from '../../src/api/books';

// books.js 는 window.location.origin 을 읽어 프록시 URL 을 만들기 때문에 jsdom 이 필요하다.

let fetchMock;

const ok = (body) => ({ ok: true, status: 200, json: async () => body });
const calledUrl = (i = 0) => new URL(fetchMock.mock.calls[i][0]);

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(ok({ documents: [], meta: { is_end: true } }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// CLAUDE.md 규칙 #5 — 브라우저는 카카오를 직접 부르지 않는다.
describe('프록시 경유', () => {
  it('항상 /api/books 로만 나간다', async () => {
    await searchBooks('데미안');
    expect(calledUrl().pathname).toBe('/api/books');

    await getBookDetail('9788937460449');
    expect(calledUrl(1).pathname).toBe('/api/books');
  });

  it('카카오 도메인을 직접 부르지 않는다', async () => {
    await searchBooks('데미안');
    await getBookDetail('9788937460449');

    for (const [url] of fetchMock.mock.calls) {
      expect(String(url)).not.toContain('dapi.kakao.com');
    }
  });

  it('요청에 REST 키를 싣지 않는다', async () => {
    await searchBooks('데미안');

    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).not.toContain('KakaoAK');
    expect(options).toBeUndefined();
  });
});

describe('searchBooks', () => {
  it('검색어와 페이지를 쿼리로 넘긴다', async () => {
    await searchBooks('데미안', 3);

    const params = calledUrl().searchParams;
    expect(params.get('query')).toBe('데미안');
    expect(params.get('page')).toBe('3');
  });

  it('페이지를 생략하면 1페이지', async () => {
    await searchBooks('데미안');
    expect(calledUrl().searchParams.get('page')).toBe('1');
  });

  it('검색어 앞뒤 공백을 떼고 보낸다', async () => {
    await searchBooks('  데미안  ');
    expect(calledUrl().searchParams.get('query')).toBe('데미안');
  });

  it('target 은 붙이지 않는다 (제목 검색)', async () => {
    await searchBooks('데미안');
    expect(calledUrl().searchParams.has('target')).toBe(false);
  });

  it('프록시가 실패하면 상태 코드를 담아 던진다', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    await expect(searchBooks('데미안')).rejects.toThrow('Book API Error: 500');
  });
});

// 카카오에는 상세 전용 엔드포인트가 없어서 ISBN 으로 다시 검색한다
describe('getBookDetail', () => {
  it('target=isbn 으로 한 권만 찾는다', async () => {
    await getBookDetail('9788937460449');

    const params = calledUrl().searchParams;
    expect(params.get('query')).toBe('9788937460449');
    expect(params.get('target')).toBe('isbn');
  });

  it('첫 번째 문서를 돌려준다', async () => {
    fetchMock.mockResolvedValue(ok({ documents: [{ title: '데미안' }, { title: '다른 판본' }] }));
    expect(await getBookDetail('9788937460449')).toEqual({ title: '데미안' });
  });

  it('결과가 없으면 null (상세 페이지가 없음 처리를 한다)', async () => {
    fetchMock.mockResolvedValue(ok({ documents: [] }));
    expect(await getBookDetail('9788937460449')).toBeNull();

    fetchMock.mockResolvedValue(ok({}));
    expect(await getBookDetail('9788937460449')).toBeNull();
  });
});
