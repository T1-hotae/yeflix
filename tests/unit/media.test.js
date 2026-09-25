import { describe, it, expect } from 'vitest';
import {
  MEDIA_TYPES,
  MEDIA_LABEL,
  MEDIA_FILTERS,
  WATCHLIST_LABEL,
  isMediaType,
  parseMediaType,
  docKey,
  mediaKey,
  detailHref,
  coerceId,
} from '../../src/lib/media';

// CLAUDE.md 규칙 #1 — 미디어 타입 규칙은 전부 여기를 거친다.
// 이 파일이 깨지면 Firestore 문서 ID 가 갈라지므로 가장 먼저 지켜야 한다.

describe('docKey', () => {
  it('타입에 예외를 두지 않고 {uid}_{type}_{id} 를 만든다', () => {
    expect(docKey('u1', 'movie', 550)).toBe('u1_movie_550');
    expect(docKey('u1', 'tv', 1399)).toBe('u1_tv_1399');
    expect(docKey('u1', 'book', '9788937460449')).toBe('u1_book_9788937460449');
  });

  it('같은 작품이면 id 가 문자열이든 숫자든 같은 키가 나온다', () => {
    expect(docKey('u1', 'movie', '550')).toBe(docKey('u1', 'movie', 550));
  });
});

describe('coerceId', () => {
  it('책 ID 는 문자열(ISBN13)로 맞춘다', () => {
    expect(coerceId('book', 9788937460449)).toBe('9788937460449');
    expect(coerceId('book', '9788937460449')).toBe('9788937460449');
  });

  it('영화 · 드라마 ID 는 숫자로 맞춘다', () => {
    expect(coerceId('movie', '550')).toBe(550);
    expect(coerceId('tv', '1399')).toBe(1399);
  });

  it('앞자리 0 이 있는 ISBN 도 잘리지 않는다', () => {
    expect(coerceId('book', '0987654321098')).toBe('0987654321098');
  });
});

describe('mediaKey', () => {
  it('뱃지 판별용 합성 키를 만든다', () => {
    expect(mediaKey('tv', 1399)).toBe('tv:1399');
    expect(mediaKey('book', '9788937460449')).toBe('book:9788937460449');
  });
});

describe('detailHref', () => {
  it('타입이 그대로 경로 세그먼트가 된다', () => {
    expect(detailHref('movie', 550)).toBe('/movie/550');
    expect(detailHref('tv', 1399)).toBe('/tv/1399');
    expect(detailHref('book', '9788937460449')).toBe('/book/9788937460449');
  });
});

describe('isMediaType / parseMediaType', () => {
  it('아는 타입만 통과시킨다', () => {
    expect(isMediaType('movie')).toBe(true);
    expect(isMediaType('book')).toBe(true);
    expect(isMediaType('anime')).toBe(false);
    expect(isMediaType(undefined)).toBe(false);
  });

  it('URL ?type= 가 없거나 이상하면 영화로 떨어진다', () => {
    expect(parseMediaType(null)).toBe('movie');
    expect(parseMediaType('')).toBe('movie');
    expect(parseMediaType('anime')).toBe('movie');
    expect(parseMediaType('tv')).toBe('tv');
  });
});

describe('상수', () => {
  it('MEDIA_TYPES 는 movie · tv · book 세 개다', () => {
    expect(MEDIA_TYPES).toEqual(['movie', 'tv', 'book']);
  });

  it('MEDIA_FILTERS 는 MEDIA_TYPES 순서와 라벨을 그대로 따른다', () => {
    expect(MEDIA_FILTERS).toEqual([
      { value: 'movie', label: '영화' },
      { value: 'tv', label: '드라마' },
      { value: 'book', label: '책' },
    ]);
  });

  it('모든 타입에 라벨이 있다', () => {
    for (const type of MEDIA_TYPES) {
      expect(MEDIA_LABEL[type]).toBeTruthy();
      expect(WATCHLIST_LABEL[type]).toBeTruthy();
    }
  });
});
