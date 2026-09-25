import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  searchMovies,
  searchTv,
  getMovieDetail,
  getMovieCredits,
  getTvDetail,
  getTvCredits,
  getWatchProviders,
  getTvWatchProviders,
} from '../../src/api/tmdb';

let fetchMock;

const ok = (body) => ({ ok: true, status: 200, json: async () => body });
const calledUrl = (i = 0) => new URL(fetchMock.mock.calls[i][0]);

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(ok({}));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('공통 fetcher', () => {
  it('모든 호출에 api_key 와 language=ko-KR 이 붙는다', async () => {
    await getMovieDetail(550);

    const url = calledUrl();
    expect(url.origin + url.pathname).toBe('https://api.themoviedb.org/3/movie/550');
    expect(url.searchParams.get('language')).toBe('ko-KR');
    expect(url.searchParams.get('api_key')).toBeTruthy();
  });

  it('응답이 실패하면 상태 코드를 담아 던진다', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });
    await expect(getMovieDetail(999999)).rejects.toThrow('TMDB Error: 404');
  });

  it('401(잘못된 키)도 같은 방식으로 던진다', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401 });
    await expect(searchMovies('파이트 클럽')).rejects.toThrow('TMDB Error: 401');
  });
});

describe('검색', () => {
  it('영화는 /search/movie 를 친다', async () => {
    await searchMovies('파이트 클럽', 2);

    const url = calledUrl();
    expect(url.pathname).toBe('/3/search/movie');
    expect(url.searchParams.get('query')).toBe('파이트 클럽');
    expect(url.searchParams.get('page')).toBe('2');
  });

  it('드라마는 /search/tv 를 친다', async () => {
    await searchTv('왕좌의 게임');

    expect(calledUrl().pathname).toBe('/3/search/tv');
    expect(calledUrl().searchParams.get('page')).toBe('1');
  });

  // 사용자가 붙여넣은 제목에 공백이 섞여 와도 결과가 흔들리지 않게 한다
  it('검색어의 앞뒤 공백을 떼고 연속 공백을 한 칸으로 줄인다', async () => {
    await searchMovies('  파이트   클럽  ');
    expect(calledUrl().searchParams.get('query')).toBe('파이트 클럽');
  });
});

describe('상세 · 출연진', () => {
  it('영화', async () => {
    await getMovieDetail(550);
    expect(calledUrl().pathname).toBe('/3/movie/550');

    await getMovieCredits(550);
    expect(calledUrl(1).pathname).toBe('/3/movie/550/credits');
  });

  it('드라마', async () => {
    await getTvDetail(1399);
    expect(calledUrl().pathname).toBe('/3/tv/1399');

    await getTvCredits(1399);
    expect(calledUrl(1).pathname).toBe('/3/tv/1399/credits');
  });
});

describe('보러가기 (KR 기준)', () => {
  it('영화 — KR 결과만 꺼낸다', async () => {
    fetchMock.mockResolvedValue(
      ok({ results: { KR: { flatrate: [{ provider_id: 8 }] }, US: { flatrate: [] } } })
    );

    const result = await getWatchProviders(550);

    expect(calledUrl().pathname).toBe('/3/movie/550/watch/providers');
    expect(result).toEqual({ flatrate: [{ provider_id: 8 }] });
  });

  it('드라마 — KR 결과만 꺼낸다', async () => {
    fetchMock.mockResolvedValue(ok({ results: { KR: { flatrate: [] } } }));

    const result = await getTvWatchProviders(1399);

    expect(calledUrl().pathname).toBe('/3/tv/1399/watch/providers');
    expect(result).toEqual({ flatrate: [] });
  });

  it('국내 제공자가 없으면 null (컴포넌트가 안내 문구를 띄운다)', async () => {
    fetchMock.mockResolvedValue(ok({ results: { US: {} } }));
    expect(await getWatchProviders(550)).toBeNull();

    fetchMock.mockResolvedValue(ok({}));
    expect(await getTvWatchProviders(1399)).toBeNull();
  });
});
