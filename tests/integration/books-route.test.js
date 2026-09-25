import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../../src/app/api/books/route';

// 라우트 핸들러를 직접 부른다 (next dev 기동 불필요).
// 카카오만 가짜로 막고 프록시의 계약을 그대로 검증한다.

const call = (search) => GET(new Request(`http://localhost:3000/api/books${search}`));

let fetchMock;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('검색어가 없을 때', () => {
  it('빈 결과를 돌려주고 카카오를 부르지 않는다', async () => {
    const res = await call('');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ documents: [], meta: { is_end: true } });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('공백만 있어도 마찬가지다 (쿼터를 태우지 않는다)', async () => {
    const res = await call('?query=%20%20%20');

    expect(await res.json()).toEqual({ documents: [], meta: { is_end: true } });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('정상 요청', () => {
  beforeEach(() => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ documents: [{ title: '데미안' }], meta: { is_end: false } }),
    });
  });

  it('카카오 응답을 그대로 전달한다', async () => {
    const res = await call('?query=데미안');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      documents: [{ title: '데미안' }],
      meta: { is_end: false },
    });
  });

  it('검색어와 size=20 을 붙인다', async () => {
    await call('?query=데미안');

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe('https://dapi.kakao.com/v3/search/book');
    expect(url.searchParams.get('query')).toBe('데미안');
    expect(url.searchParams.get('size')).toBe('20');
  });

  it('page 를 넘기면 그대로, 없으면 1 페이지', async () => {
    await call('?query=데미안&page=3');
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get('page')).toBe('3');

    await call('?query=데미안');
    expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get('page')).toBe('1');
  });

  it('target=isbn 은 있을 때만 붙는다 (상세 조회용)', async () => {
    await call('?query=9788937460449&target=isbn');
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get('target')).toBe('isbn');

    await call('?query=데미안');
    expect(new URL(fetchMock.mock.calls[1][0]).searchParams.has('target')).toBe(false);
  });

  it('검색어 앞뒤 공백을 떼고 보낸다', async () => {
    await call('?query=%20%20데미안%20%20');
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get('query')).toBe('데미안');
  });
});

// CLAUDE.md 규칙 #5 — 카카오 REST 키는 서버 밖으로 나가면 안 된다.
describe('REST 키 취급', () => {
  it('Authorization 헤더로만 보낸다 (쿼리 파라미터 아님)', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });

    await call('?query=데미안');

    const [url, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toBe(`KakaoAK ${process.env.KAKAO_REST_API_KEY}`);
    expect(String(url)).not.toContain(process.env.KAKAO_REST_API_KEY);
  });

  it('응답 본문에 키가 새지 않는다', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ documents: [] }),
    });

    const res = await call('?query=데미안');
    const body = JSON.stringify(await res.json());

    expect(body).not.toContain(process.env.KAKAO_REST_API_KEY);
    expect(body).not.toContain('KakaoAK');
  });

  it('키가 설정되지 않으면 500 으로 막는다', async () => {
    vi.stubEnv('KAKAO_REST_API_KEY', '');

    const res = await call('?query=데미안');

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'missing_api_key' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('카카오가 실패할 때', () => {
  it('상태 코드를 그대로 전달한다', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401 });

    const res = await call('?query=데미안');

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'kakao_error' });
  });

  it('쿼터 초과(429)도 그대로 전달한다', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429 });
    expect((await call('?query=데미안')).status).toBe(429);
  });

  it('네트워크가 터지면 502 로 바꾼다', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNRESET'));

    const res = await call('?query=데미안');

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'fetch_failed' });
  });
});
