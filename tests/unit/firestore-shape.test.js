import { describe, it, expect, vi, beforeEach } from 'vitest';

// Firestore SDK 를 통째로 가짜로 바꾸고 "어떤 모양으로 불렀는지"만 본다.
//
// 에뮬레이터 테스트로는 CLAUDE.md 규칙 #4(복합 인덱스 금지)를 잡을 수 없다.
// 에뮬레이터는 인덱스 없이도 orderBy 를 그냥 통과시키기 때문에
// test:emulator 도 test:e2e 도 초록불인 채로 운영에서만 터진다.
// 그래서 호출 형태 자체를 여기서 고정한다.

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((db, name) => ({ __collection: name })),
  doc: vi.fn((db, name, id) => ({ __doc: `${name}/${id}` })),
  query: vi.fn((ref, ...constraints) => ({ ref, constraints })),
  where: vi.fn((field, op, value) => ({ __where: [field, op, value] })),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(() => '__SERVER_TS__'),
}));

vi.mock('../../src/firebase/config', () => ({ db: { __db: true } }));

const { doc, query, where, orderBy, getDoc, getDocs, setDoc, deleteDoc } =
  await import('firebase/firestore');

const { saveDiary, getDiary, getMyDiaries, deleteDiary, getMyMediaKeys } =
  await import('../../src/firebase/diary');

const {
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
  getWatchlist,
  getWatchlistKeys,
} = await import('../../src/firebase/watchlist');

// getDocs 가 돌려줄 스냅샷을 만든다
const snapshot = (docs) => ({
  docs: docs.map(({ id, ...data }) => ({ id, data: () => data })),
});

beforeEach(() => {
  vi.clearAllMocks();
});

// 이 목록에 새 조회 함수를 추가할 때 여기도 같이 추가할 것.
const LIST_QUERIES = [
  ['getMyDiaries', () => getMyDiaries('u1'), 'diaries'],
  ['getMyMediaKeys', () => getMyMediaKeys('u1'), 'diaries'],
  ['getWatchlist', () => getWatchlist('u1'), 'watchlist'],
  ['getWatchlistKeys', () => getWatchlistKeys('u1'), 'watchlist'],
];

describe('쿼리 형태 — 복합 인덱스를 만들지 않는다', () => {
  for (const [name, call, collectionName] of LIST_QUERIES) {
    describe(name, () => {
      beforeEach(async () => {
        getDocs.mockResolvedValue(snapshot([]));
        await call();
      });

      it('where 는 userId 하나뿐이다', () => {
        expect(where).toHaveBeenCalledTimes(1);
        expect(where).toHaveBeenCalledWith('userId', '==', 'u1');
      });

      it('orderBy 를 쓰지 않는다 (정렬은 클라이언트에서)', () => {
        expect(orderBy).not.toHaveBeenCalled();
      });

      it('query 제약은 정확히 하나다', () => {
        expect(query.mock.calls[0][0]).toEqual({ __collection: collectionName });
        expect(query.mock.calls[0]).toHaveLength(2);
      });
    });
  }
});

describe('문서 ID — docKey 규칙을 그대로 쓴다', () => {
  it('일기: {uid}_{type}_{id}', async () => {
    getDoc.mockResolvedValue({ exists: () => false });

    await getDiary('u1', 'movie', 550);
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'diaries', 'u1_movie_550');

    await deleteDiary('u1', 'book', '9788937460449');
    expect(doc).toHaveBeenLastCalledWith(
      expect.anything(),
      'diaries',
      'u1_book_9788937460449'
    );
    expect(deleteDoc).toHaveBeenCalled();
  });

  it('찜: 같은 규칙, 컬렉션만 다르다', async () => {
    getDoc.mockResolvedValue({ exists: () => true });

    expect(await isInWatchlist('u1', 'tv', 1399)).toBe(true);
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'watchlist', 'u1_tv_1399');

    await removeFromWatchlist('u1', 'tv', 1399);
    expect(deleteDoc).toHaveBeenCalled();
  });
});

// CLAUDE.md 규칙 #2 — 저장 필드명은 정규화 shape 와 같다.
// 옛 이름(movieId / movieTitle / moviePoster)은 2026-09-24 마이그레이션으로 사라졌다.
describe('saveDiary 쓰기 형태', () => {
  const LEGACY_FIELDS = ['movieId', 'movieTitle', 'moviePoster'];

  it('mediaType · itemId · title · poster 를 그대로 쓴다', async () => {
    await saveDiary('u1', 'movie', 550, {
      rating: 5,
      content: '좋았다',
      tags: ['명작'],
      watchedDate: '2026-09-01',
      title: '파이트 클럽',
      poster: '/f.jpg',
    });

    const payload = setDoc.mock.calls[0][1];
    expect(payload).toMatchObject({
      userId: 'u1',
      mediaType: 'movie',
      itemId: 550,
      title: '파이트 클럽',
      poster: '/f.jpg',
      rating: 5,
      tags: ['명작'],
      watchedDate: '2026-09-01',
    });
  });

  it('옛 필드명을 되살리지 않는다', async () => {
    await saveDiary('u1', 'movie', 550, { title: '파이트 클럽', poster: '/f.jpg' });

    const payload = setDoc.mock.calls[0][1];
    for (const field of LEGACY_FIELDS) {
      expect(payload).not.toHaveProperty(field);
    }
  });

  it('책 itemId 는 문자열, 영화 itemId 는 숫자로 저장된다', async () => {
    await saveDiary('u1', 'book', 9788937460449, { title: '데미안' });
    expect(setDoc.mock.calls[0][1].itemId).toBe('9788937460449');

    await saveDiary('u1', 'movie', '550', { title: '파이트 클럽' });
    expect(setDoc.mock.calls[1][1].itemId).toBe(550);
  });

  it('기존 createdAt 이 있으면 보존한다', async () => {
    await saveDiary('u1', 'movie', 550, { createdAt: 'ORIGINAL' });
    expect(setDoc.mock.calls[0][1].createdAt).toBe('ORIGINAL');
  });

  it('createdAt 이 없으면 서버 타임스탬프를 새로 찍는다', async () => {
    await saveDiary('u1', 'movie', 550, { createdAt: null });
    expect(setDoc.mock.calls[0][1].createdAt).toBe('__SERVER_TS__');
    expect(setDoc.mock.calls[0][1].updatedAt).toBe('__SERVER_TS__');
  });
});

describe('addToWatchlist 쓰기 형태', () => {
  it('제목과 포스터만 함께 저장한다', async () => {
    await addToWatchlist('u1', 'tv', 1399, { title: '왕좌의 게임', poster: '/got.jpg' });

    expect(setDoc.mock.calls[0][1]).toEqual({
      userId: 'u1',
      mediaType: 'tv',
      itemId: 1399,
      title: '왕좌의 게임',
      poster: '/got.jpg',
      addedAt: '__SERVER_TS__',
    });
  });

  it('포스터가 없으면 undefined 가 아니라 null 로 저장한다', async () => {
    await addToWatchlist('u1', 'book', '9788937460449', { title: '데미안' });
    expect(setDoc.mock.calls[0][1].poster).toBeNull();
  });
});

describe('정렬은 클라이언트에서 한다', () => {
  it('일기는 updatedAt 내림차순', async () => {
    getDocs.mockResolvedValue(
      snapshot([
        { id: 'a', title: '오래된 것', updatedAt: { seconds: 100 } },
        { id: 'b', title: '최신', updatedAt: { seconds: 300 } },
        { id: 'c', title: '중간', updatedAt: { seconds: 200 } },
      ])
    );

    const result = await getMyDiaries('u1');
    expect(result.map((d) => d.title)).toEqual(['최신', '중간', '오래된 것']);
  });

  // serverTimestamp() 는 서버 확정 전까지 로컬 스냅샷에서 null 이다.
  // 저장 직후 목록을 다시 불러오면 실제로 이 상태가 나온다.
  it('updatedAt 이 아직 없는 문서가 섞여도 터지지 않는다', async () => {
    getDocs.mockResolvedValue(
      snapshot([
        { id: 'a', title: '확정됨', updatedAt: { seconds: 100 } },
        { id: 'b', title: '대기중', updatedAt: null },
      ])
    );

    const result = await getMyDiaries('u1');
    expect(result.map((d) => d.title)).toEqual(['확정됨', '대기중']);
  });

  it('찜은 addedAt 내림차순', async () => {
    getDocs.mockResolvedValue(
      snapshot([
        { id: 'a', title: '먼저 찜', addedAt: { seconds: 100 } },
        { id: 'b', title: '나중 찜', addedAt: { seconds: 200 } },
      ])
    );

    const result = await getWatchlist('u1');
    expect(result.map((w) => w.title)).toEqual(['나중 찜', '먼저 찜']);
  });
});

describe('뱃지용 키 목록', () => {
  it('일기 키는 "{type}:{id}" Set 이다', async () => {
    getDocs.mockResolvedValue(
      snapshot([
        { id: 'a', mediaType: 'movie', itemId: 550 },
        { id: 'b', mediaType: 'book', itemId: '9788937460449' },
      ])
    );

    expect(await getMyMediaKeys('u1')).toEqual(
      new Set(['movie:550', 'book:9788937460449'])
    );
  });

  it('찜 키도 같은 형식이라 카드에서 교차 비교가 된다', async () => {
    getDocs.mockResolvedValue(snapshot([{ id: 'a', mediaType: 'tv', itemId: 1399 }]));
    expect(await getWatchlistKeys('u1')).toEqual(new Set(['tv:1399']));
  });
});
