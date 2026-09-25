import { describe, it, expect, vi, afterEach } from 'vitest';
import { SITE_URL, absoluteUrl } from '../../src/lib/site';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('absoluteUrl', () => {
  it('상대 경로를 배포 도메인 기준 절대 URL 로 바꾼다', () => {
    expect(absoluteUrl('/movie/550')).toBe(`${SITE_URL}/movie/550`);
  });

  it('인자가 없으면 루트', () => {
    expect(absoluteUrl()).toBe(`${SITE_URL}/`);
  });

  it('쿼리 문자열도 살아 있다', () => {
    expect(absoluteUrl('/?search=데미안&type=book')).toContain('search=');
  });
});

describe('SITE_URL', () => {
  it('기본값은 슬래시로 끝나지 않는다', () => {
    expect(SITE_URL.endsWith('/')).toBe(false);
  });

  // canonical / OG 이미지가 //movie/550 처럼 겹치지 않게 하는 방어 코드
  it('환경변수 끝의 슬래시를 떼어낸다', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://yeflix.example.com///');
    vi.resetModules();

    const site = await import('../../src/lib/site');

    expect(site.SITE_URL).toBe('https://yeflix.example.com');
    expect(site.absoluteUrl('/movie/550')).toBe('https://yeflix.example.com/movie/550');
  });
});
