import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  clamp,
  tmdbShareImage,
  bookCoverUrl,
  fallbackMetadata,
  fetchTmdb,
  fetchBookByIsbn,
} from '../../src/lib/detailMetadata';

describe('clamp', () => {
  it('짧은 설명은 그대로 둔다', () => {
    expect(clamp('짧은 줄거리')).toBe('짧은 줄거리');
  });

  it('연속 공백과 줄바꿈을 한 칸으로 줄인다', () => {
    expect(clamp('  줄거리\n\n  두 번째 줄  ')).toBe('줄거리 두 번째 줄');
  });

  it('기본 150자를 넘으면 말줄임표로 자른다', () => {
    const result = clamp('가'.repeat(200));
    expect(result).toHaveLength(150);
    expect(result.endsWith('…')).toBe(true);
  });

  it('자를 길이를 지정할 수 있다', () => {
    expect(clamp('가'.repeat(50), 10)).toBe(`${'가'.repeat(9)}…`);
  });

  it('정확히 한계 길이면 자르지 않는다', () => {
    expect(clamp('가'.repeat(150))).toBe('가'.repeat(150));
  });

  it('내용이 없으면 빈 문자열 (루트 레이아웃 설명을 상속하게 둔다)', () => {
    expect(clamp(null)).toBe('');
    expect(clamp(undefined)).toBe('');
    expect(clamp('   ')).toBe('');
  });
});

describe('tmdbShareImage', () => {
  it('16:9 배경이 있으면 그걸 쓴다', () => {
    expect(tmdbShareImage({ backdrop_path: '/b.jpg', poster_path: '/p.jpg' }, '파이트 클럽')).toEqual([
      { url: 'https://image.tmdb.org/t/p/w1280/b.jpg', width: 1280, height: 720, alt: '파이트 클럽' },
    ]);
  });

  it('배경이 없으면 포스터로 폴백한다', () => {
    expect(tmdbShareImage({ poster_path: '/p.jpg' }, '파이트 클럽')).toEqual([
      { url: 'https://image.tmdb.org/t/p/w780/p.jpg', width: 780, height: 1170, alt: '파이트 클럽' },
    ]);
  });

  it('둘 다 없으면 undefined — 루트 OG 이미지를 상속한다', () => {
    expect(tmdbShareImage({}, '제목')).toBeUndefined();
    expect(tmdbShareImage(null, '제목')).toBeUndefined();
  });
});

// 카카오 썸네일은 120x174 라 공유 카드 최소 크기에 못 미친다.
// URL 의 fname 파라미터에 원본 표지 주소가 들어 있어 그걸 꺼내 쓴다.
describe('bookCoverUrl', () => {
  it('fname 에서 원본 표지 주소를 꺼낸다', () => {
    expect(
      bookCoverUrl(
        'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=https%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F123'
      )
    ).toBe('https://t1.daumcdn.net/lbook/image/123');
  });

  it('원본이 http 면 https 로 올린다 (혼합 콘텐츠 방지)', () => {
    expect(
      bookCoverUrl(
        'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F123'
      )
    ).toBe('https://t1.daumcdn.net/lbook/image/123');
  });

  it('fname 이 없으면 썸네일을 그대로 쓴다', () => {
    const url = 'https://search1.kakaocdn.net/thumb/demian.jpg';
    expect(bookCoverUrl(url)).toBe(url);
  });

  it('URL 로 파싱되지 않으면 받은 값을 그대로 돌려준다', () => {
    expect(bookCoverUrl('표지없음')).toBe('표지없음');
  });

  it('표지가 없으면 null', () => {
    expect(bookCoverUrl(null)).toBeNull();
    expect(bookCoverUrl('')).toBeNull();
  });
});

describe('fallbackMetadata', () => {
  it('제목과 canonical 만 남기고 나머지는 상속시킨다', () => {
    expect(fallbackMetadata('영화', '/movie/550')).toEqual({
      title: '영화',
      alternates: { canonical: '/movie/550' },
    });
  });
});

// 메타데이터 때문에 페이지가 통째로 죽으면 안 되므로 실패는 전부 null 로 흘러야 한다.
describe('메타데이터 페칭', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('fetchTmdb 는 ko-KR 과 api_key 를 붙인다', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: 550 }) });

    const result = await fetchTmdb('/movie/550');

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain('https://api.themoviedb.org/3/movie/550');
    expect(url).toContain('language=ko-KR');
    expect(url).toContain('api_key=');
    expect(result).toEqual({ id: 550 });
  });

  it('fetchTmdb 는 키가 없으면 호출하지 않고 null', async () => {
    vi.stubEnv('NEXT_PUBLIC_TMDB_API_KEY', '');

    expect(await fetchTmdb('/movie/550')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('응답이 실패면 null', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });
    expect(await fetchTmdb('/movie/999999')).toBeNull();
  });

  it('네트워크가 터져도 null (페이지는 살아 있어야 한다)', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNRESET'));
    expect(await fetchTmdb('/movie/550')).toBeNull();
  });

  it('fetchBookByIsbn 은 target=isbn 으로 한 권만 찾는다', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ documents: [{ title: '데미안' }] }),
    });

    const result = await fetchBookByIsbn('9788937460449');

    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('target=isbn');
    expect(String(url)).toContain('size=1');
    expect(options.headers.Authorization).toMatch(/^KakaoAK /);
    expect(result).toEqual({ title: '데미안' });
  });

  it('fetchBookByIsbn 은 결과가 없으면 null', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ documents: [] }) });
    expect(await fetchBookByIsbn('9788937460449')).toBeNull();
  });

  it('fetchBookByIsbn 은 키가 없으면 호출하지 않고 null', async () => {
    vi.stubEnv('KAKAO_REST_API_KEY', '');

    expect(await fetchBookByIsbn('9788937460449')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
