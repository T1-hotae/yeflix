import { describe, it, expect } from 'vitest';
import { getIsbn13, formatAuthors, normalizeBook } from '../../src/api/books';

// 카카오 isbn 필드는 "ISBN10 ISBN13" 공백 구분 문자열이고,
// 둘 중 하나만 오는 경우도 있다. 여기가 틀리면 책 상세 URL 과 문서 ID 가 통째로 어긋난다.
describe('getIsbn13', () => {
  it('둘 다 오면 13자리를 고른다', () => {
    expect(getIsbn13({ isbn: '8937460440 9788937460449' })).toBe('9788937460449');
  });

  it('순서가 바뀌어 와도 13자리를 고른다', () => {
    expect(getIsbn13({ isbn: '9788937460449 8937460440' })).toBe('9788937460449');
  });

  it('13자리만 오면 그대로 쓴다', () => {
    expect(getIsbn13({ isbn: '9788937460449' })).toBe('9788937460449');
  });

  it('10자리만 오면 폴백으로 그거라도 쓴다', () => {
    expect(getIsbn13({ isbn: '8937460440' })).toBe('8937460440');
  });

  it('ISBN 이 없으면 빈 문자열 (검색 결과에서 걸러진다)', () => {
    expect(getIsbn13({ isbn: '' })).toBe('');
    expect(getIsbn13({})).toBe('');
  });

  it('공백이 여러 칸이어도 빈 토큰을 만들지 않는다', () => {
    expect(getIsbn13({ isbn: '  8937460440   9788937460449  ' })).toBe('9788937460449');
  });
});

describe('formatAuthors', () => {
  it('저자를 쉼표로 잇는다', () => {
    expect(formatAuthors({ authors: ['헤르만 헤세'] })).toBe('헤르만 헤세');
    expect(formatAuthors({ authors: ['홍길동', '김철수'] })).toBe('홍길동, 김철수');
  });

  it('역자가 있으면 괄호로 덧붙인다', () => {
    expect(formatAuthors({ authors: ['헤르만 헤세'], translators: ['전영애'] })).toBe(
      '헤르만 헤세 (전영애 옮김)'
    );
  });

  it('역자 배열이 비면 괄호를 붙이지 않는다', () => {
    expect(formatAuthors({ authors: ['헤르만 헤세'], translators: [] })).toBe('헤르만 헤세');
  });

  it('저자 정보가 없어도 터지지 않는다', () => {
    expect(formatAuthors({})).toBe('');
  });
});

// CLAUDE.md 규칙 #3 — 카카오 원본 객체를 카드에 그대로 넘기지 않는다.
describe('normalizeBook', () => {
  const doc = {
    isbn: '8937460440 9788937460449',
    title: '데미안',
    thumbnail: 'https://search1.kakaocdn.net/thumb/demian.jpg',
    authors: ['헤르만 헤세'],
    translators: ['전영애'],
    publisher: '민음사',
    contents: '쓰이지 않는 필드',
  };

  it('정규화 shape 로 바꾼다', () => {
    expect(normalizeBook(doc)).toEqual({
      mediaType: 'book',
      id: '9788937460449',
      title: '데미안',
      poster: 'https://search1.kakaocdn.net/thumb/demian.jpg',
      subtitle: '헤르만 헤세',
      rating: null,
    });
  });

  it('표지가 빈 문자열이면 poster 는 null 이다', () => {
    expect(normalizeBook({ ...doc, thumbnail: '' }).poster).toBeNull();
  });

  it('책에는 평점이 없다', () => {
    expect(normalizeBook(doc).rating).toBeNull();
  });

  it('subtitle 에는 역자를 넣지 않는다 (카드가 좁아서 저자만)', () => {
    expect(normalizeBook(doc).subtitle).toBe('헤르만 헤세');
  });

  it('원본 키를 그대로 흘려보내지 않는다', () => {
    const result = normalizeBook(doc);
    expect(result).not.toHaveProperty('thumbnail');
    expect(result).not.toHaveProperty('isbn');
    expect(result).not.toHaveProperty('contents');
  });
});
