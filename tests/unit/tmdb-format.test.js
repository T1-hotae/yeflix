import { describe, it, expect } from 'vitest';
import {
  getPosterUrl,
  formatRating,
  getYear,
  formatGenres,
  formatRuntime,
  formatSeasons,
  normalizeMovie,
  normalizeTv,
} from '../../src/api/tmdb';

describe('getPosterUrl', () => {
  it('포스터가 없으면 null 을 준다 (컴포넌트가 폴백 아이콘을 그린다)', () => {
    expect(getPosterUrl(null)).toBeNull();
    expect(getPosterUrl('')).toBeNull();
    expect(getPosterUrl(undefined)).toBeNull();
  });

  it('TMDB 경로 앞에 이미지 호스트와 사이즈를 붙인다', () => {
    expect(getPosterUrl('/abc.jpg')).toBe('https://image.tmdb.org/t/p/w500/abc.jpg');
    expect(getPosterUrl('/abc.jpg', 'w342')).toBe('https://image.tmdb.org/t/p/w342/abc.jpg');
  });

  it('책 표지(카카오)는 절대 URL 이므로 그대로 돌려준다', () => {
    const cover = 'https://search1.kakaocdn.net/thumb/demian.jpg';
    expect(getPosterUrl(cover)).toBe(cover);
    expect(getPosterUrl(cover, 'w92')).toBe(cover);
  });
});

describe('formatRating', () => {
  it('소수점 한 자리로 자른다', () => {
    expect(formatRating(7.456)).toBe('7.5');
    expect(formatRating(10)).toBe('10.0');
  });

  it('평점이 없으면 0.0 으로 본다', () => {
    expect(formatRating(0)).toBe('0.0');
    expect(formatRating(null)).toBe('0.0');
    expect(formatRating(undefined)).toBe('0.0');
  });
});

describe('getYear', () => {
  it('날짜 문자열에서 연도만 뽑는다', () => {
    expect(getYear('1999-10-15')).toBe('1999');
  });

  it('개봉일 미정이면 빈 문자열', () => {
    expect(getYear('')).toBe('');
    expect(getYear(null)).toBe('');
    expect(getYear(undefined)).toBe('');
  });
});

describe('formatGenres', () => {
  it('가운뎃점으로 잇는다', () => {
    expect(formatGenres([{ name: '드라마' }, { name: '스릴러' }])).toBe('드라마 · 스릴러');
  });

  it('장르가 없으면 빈 문자열', () => {
    expect(formatGenres([])).toBe('');
    expect(formatGenres()).toBe('');
  });
});

describe('formatRuntime', () => {
  it('한 시간 미만은 분만 쓴다', () => {
    expect(formatRuntime(45)).toBe('45분');
  });

  it('한 시간 이상은 시간과 분을 함께 쓴다', () => {
    expect(formatRuntime(90)).toBe('1시간 30분');
    expect(formatRuntime(139)).toBe('2시간 19분');
  });

  // 정각일 때 "1시간" 이 아니라 "1시간 0분" 으로 나온다.
  // 의도된 동작인지 여기서 고정해 둔다 — 바꾸려면 이 단언부터 고칠 것.
  it('정각이면 0분까지 표시한다', () => {
    expect(formatRuntime(60)).toBe('1시간 0분');
    expect(formatRuntime(120)).toBe('2시간 0분');
  });

  it('상영시간 정보가 없으면 빈 문자열', () => {
    expect(formatRuntime(0)).toBe('');
    expect(formatRuntime(null)).toBe('');
    expect(formatRuntime(undefined)).toBe('');
  });
});

describe('formatSeasons', () => {
  it('시즌과 회차를 함께 표시한다', () => {
    expect(formatSeasons(1, 16)).toBe('시즌 1 · 16부작');
  });

  it('한쪽만 있으면 그것만 표시한다', () => {
    expect(formatSeasons(0, 12)).toBe('12부작');
    expect(formatSeasons(2, 0)).toBe('시즌 2');
  });

  it('둘 다 없으면 빈 문자열', () => {
    expect(formatSeasons(0, 0)).toBe('');
    expect(formatSeasons(undefined, undefined)).toBe('');
  });
});

// CLAUDE.md 규칙 #3 — 목록 UI 는 아래 shape 만 소비한다.
// TMDB 원본 키(title / name / poster_path)가 카드까지 새지 않는지 확인한다.
describe('normalizeMovie', () => {
  const movie = {
    id: 550,
    title: '파이트 클럽',
    original_title: 'Fight Club',
    poster_path: '/fight-club.jpg',
    release_date: '1999-10-15',
    vote_average: 8.4,
    overview: '쓰이지 않는 필드',
  };

  it('정규화 shape 로 바꾼다', () => {
    expect(normalizeMovie(movie)).toEqual({
      mediaType: 'movie',
      id: 550,
      title: '파이트 클럽',
      poster: '/fight-club.jpg',
      subtitle: '1999',
      rating: 8.4,
      originalTitle: 'Fight Club',
    });
  });

  it('원본 키를 그대로 흘려보내지 않는다', () => {
    const result = normalizeMovie(movie);
    expect(result).not.toHaveProperty('poster_path');
    expect(result).not.toHaveProperty('release_date');
    expect(result).not.toHaveProperty('overview');
  });
});

describe('normalizeTv', () => {
  it('name → title, first_air_date → subtitle 로 옮긴다', () => {
    expect(
      normalizeTv({
        id: 1399,
        name: '왕좌의 게임',
        original_name: 'Game of Thrones',
        poster_path: '/got.jpg',
        first_air_date: '2011-04-17',
        vote_average: 8.4,
        origin_country: ['US'],
      })
    ).toEqual({
      mediaType: 'tv',
      id: 1399,
      title: '왕좌의 게임',
      poster: '/got.jpg',
      subtitle: '2011',
      rating: 8.4,
      originalTitle: 'Game of Thrones',
      originCountry: ['US'],
    });
  });

  it('origin_country 가 없으면 빈 배열로 채운다', () => {
    expect(normalizeTv({ id: 1, name: 'x' }).originCountry).toEqual([]);
  });
});
