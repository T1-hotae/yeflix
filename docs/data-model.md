# 데이터 모델

Firestore 최상위 컬렉션 두 개를 쓴다. 사용자별 하위 컬렉션은 없다.

| 컬렉션 | 내용 |
| --- | --- |
| `diaries` | 감상 일기 (작품당 1건) |
| `watchlist` | 찜 목록 |

## 문서 ID 규칙

영화 · 드라마 · 책의 ID는 서로 다른 네임스페이스라 그냥 두면 충돌한다
(TMDB 영화 1399와 드라마 1399는 다른 작품이다). 그래서 타입을 ID에 넣는다.

```
{uid}_{mediaType}_{itemId}

movie : abc123_movie_550
tv    : abc123_tv_1399
book  : abc123_book_9788937460449
```

**타입에 예외가 없다.** 문서 ID만 봐도 어떤 타입인지 알 수 있다.
이 규칙은 [`lib/media.js`](../src/lib/media.js)의 `docKey()` 한 곳에만 있으므로
직접 문자열을 조립하지 말 것.

## 문서 형태

### `diaries`

```js
{
  userId:      string,           // Firebase uid
  mediaType:   'movie' | 'tv' | 'book',   // 항상 존재
  itemId:      number | string,  // 책만 문자열 ISBN13
  title:       string,
  poster:      string | null,    // TMDB 경로('/abc.jpg') 또는 책 표지 절대 URL
  rating:      number,           // 1~5 정수, 필수
  content:     string,
  tags:        string[],         // 최대 10개
  watchedDate: string,           // 'YYYY-MM-DD'
  createdAt:   Timestamp,
  updatedAt:   Timestamp,
}
```

### `watchlist`

```js
{
  userId:      string,
  mediaType:   'movie' | 'tv' | 'book',
  itemId:      number | string,
  title:       string,
  poster:      string | null,
  addedAt:     Timestamp,
}
```

`title` · `poster` · `mediaType`은 API 정규화 shape(`{ mediaType, id, title, poster }`)와
이름이 같다. 저장할 때 이름을 갈아끼우지 않고 그대로 넘긴다.

`mediaType`은 모든 문서에 있으므로 `doc.mediaType`을 그대로 읽으면 된다.

> **이력.** 영화 전용 앱으로 시작한 탓에 한동안 필드명이 `movieId` · `movieTitle` ·
> `moviePoster`였고, 영화 문서에는 `mediaType`이 없었으며 문서 ID도
> `{uid}_{id}`로 영화만 접두어가 빠져 있었다. 2026-09-24에 전부 위 구조로 옮겼다.
> 그 이후로 레거시 문서는 존재하지 않는다.
> 대조표와 이전 절차는 [migration-media-schema.md](migration-media-schema.md)에 있다.

## 접근 함수

Firestore를 컴포넌트에서 직접 부르지 않는다. 항상 아래 두 모듈을 거친다.

### [`src/firebase/diary.js`](../src/firebase/diary.js)

| 함수 | 비고 |
| --- | --- |
| `saveDiary(uid, mediaType, itemId, data)` | `setDoc` — 전체 덮어쓰기 (merge 아님) |
| `getDiary(uid, mediaType, itemId)` | 없으면 `null` |
| `getMyDiaries(uid)` | 전체 반환, 최신순 |
| `deleteDiary(uid, mediaType, itemId)` | |
| `getMyMediaKeys(uid)` | `Set<"movie:550">` — 카드 뱃지용 |

> 저장 시 `itemId`는 `coerceId()`를 거친다. URL 파라미터는 항상 문자열이라
> 그대로 두면 `item.itemId === itemId` 같은 엄격 비교가 조용히 빗나간다.

### [`src/firebase/watchlist.js`](../src/firebase/watchlist.js)

| 함수 | 비고 |
| --- | --- |
| `addToWatchlist(uid, mediaType, itemId, { title, poster })` | |
| `removeFromWatchlist(uid, mediaType, itemId)` | |
| `isInWatchlist(uid, mediaType, itemId)` | |
| `getWatchlist(uid)` | 전체 반환, 최신순 |
| `getWatchlistKeys(uid)` | `Set<"tv:1399">` |

## 쿼리는 단순하게 유지한다

두 컬렉션 모두 **`where('userId', '==', uid)` 하나만** 쓰고 정렬은 클라이언트에서 한다.
Firestore 복합 인덱스를 만들지 않기 위한 의도적인 선택이다.

타입별 필터(볼드라마 탭, 일기 종류 필터)도 같은 이유로 클라이언트에서 건다.
`getWatchlist(uid)`로 전부 받아 `item.mediaType === 'tv'`로 거르는 식이다.
탭마다 다시 쿼리하지 않는다.

> `where('mediaType', '==', ...)`나 `orderBy`를 추가하면 복합 인덱스가 필요해진다.
> 꼭 필요한 게 아니면 클라이언트 필터를 유지할 것.

## 비즈니스 규칙

- **작품당 일기 1건.** 문서 ID가 `uid + 작품`이라 구조적으로 보장된다.
- **일기를 저장하면 찜이 풀린다.** "볼 것"에서 "본 것"으로 넘어가기 때문이다.
  `MediaDiarySection`의 `onSaved` 콜백 → `useWatchlist.removeIfPresent`.
- **별점은 필수**, 1~5 정수다. 나머지는 비워도 된다.

## 보안 규칙

저장소에 있는 [`firestore.emulator.rules`](../firestore.emulator.rules)는 **에뮬레이터 전용**이고
`allow read, write: if true`다. 절대 배포하면 안 된다.

운영 규칙은 저장소에 없고 Firebase 콘솔에서 관리한다.
모든 읽기·쓰기가 인증된 클라이언트에서 직접 일어나므로, 콘솔 규칙이 실제 방어선이다.

## 관련 문서

- [architecture.md](architecture.md) — 전체 구조
- [api.md](api.md) — 외부 API
- [migration-media-schema.md](migration-media-schema.md) — 2026-09-24 스키마 정리 (이전/이후 대조)
