# 미디어 타입 스키마 마이그레이션 (2026-09-24)

영화 전용으로 시작한 앱에 드라마·책을 얹으면서 생긴 구조적 모순을 걷어낸 기록.
**이전 코드와 무엇이 어떻게 달라졌는지**를 남긴다.

| | 이전 | 이후 |
| --- | --- | --- |
| 문서 ID | 영화만 접두어 없음 | 타입 예외 없음 |
| `mediaType` | 문서 28건 중 1건에만 존재 | 전 문서 존재 |
| 필드명 | `movieId` · `movieTitle` · `moviePoster` | `itemId` · `title` · `poster` |
| 레거시 방어 | `typeOf()` 호출 10곳 | 없음 (헬퍼 삭제) |

코드 11개 파일 `+73 / -83`, Firestore 문서 28건(일기 21 · 찜 7) 이전.

---

## 1. 왜 바꿨나

드라마·책을 추가할 때 **기존 데이터를 건드리지 않는 쪽**을 택했다. 당시로선 합리적이었지만
그 결정이 네 겹의 모순으로 쌓였다.

### ① 문서 ID에 예외가 있었다

```
abc123_550                    ← 영화만 타입이 빠짐
abc123_tv_1399
abc123_book_9788937434488
```

ID만 봐서는 타입을 알 수 없다 → 그래서 `mediaType` 필드가 필요하고 → 그 필드가 옛 문서엔
없어서 → `typeOf()` 방어 함수가 필요해진다. **예외 하나가 헬퍼 하나를 먹여 살리는 구조.**

### ② 책 문서에 `movieTitle`이 들어 있었다

『토지』의 제목이 `movieTitle`에, ISBN이 `movieId`에 저장됐다.
`docs/data-model.md`에 "필드명이 `movieId`인 이유"라는 **변명 절**이 따로 있었다 —
문서에 변명이 생겼다는 건 구조가 틀렸다는 신호다.

### ③ `mediaType` 유무가 문서마다 달랐다

같은 컬렉션 안에서 어떤 문서엔 있고 어떤 문서엔 없었다. 읽는 쪽이 전부 `typeOf()`를
기억해야 했고, 한 군데라도 빠뜨리면 이렇게 번진다.

```js
MEDIA_LABEL[undefined]        // undefined → 뱃지 빈칸
detailHref(undefined, 550)    // "/undefined/550" → 404
typeOf(item) === 'movie'      // false → 영화 탭에서 사라짐
```

마지막이 가장 고약하다. 데이터는 멀쩡한데 **어느 탭에도 안 나타난다.** 사용자에겐
"기록이 사라졌어요"로 보이고, DB를 열어보면 데이터가 있으니 재현이 안 된다.

### ④ 테스트가 이 모순을 고정하고 있었다

`e2e/helpers/emulator.js`가 *일부러* `mediaType` 없는 문서를 심어 레거시 호환을 검증했다.
하위 호환이 테스트로 굳어 있으니 구조를 못 고치는 상태였다.

---

## 2. 문서 ID

```diff
- movie : {uid}_{id}                abc123_550
- tv    : {uid}_tv_{id}             abc123_tv_1399
- book  : {uid}_book_{isbn13}       abc123_book_9788937460449
+ 전부  : {uid}_{mediaType}_{id}    abc123_movie_550
+                                   abc123_tv_1399
+                                   abc123_book_9788937460449
```

드라마·책은 ID가 그대로다. **영화 문서만 ID가 바뀌었다** (28건 중 27건).

## 3. 필드

```diff
  userId:      string
- mediaType:   'movie' | 'tv' | 'book'   // 없을 수 있음
+ mediaType:   'movie' | 'tv' | 'book'   // 항상 존재
- movieId:     number | string
- movieTitle:  string
- moviePoster: string | null
+ itemId:      number | string           // 책만 문자열 ISBN13
+ title:       string
+ poster:      string | null
```

새 이름은 **API 정규화 shape와 같다** (`{ mediaType, id, title, poster }`).
저장할 때 이름을 갈아끼우는 단계가 통째로 사라졌다.

---

## 4. 코드 비교

### `src/lib/media.js` — 핵심

```diff
- // Firestore 문서 ID
- // 영화는 기존 `uid_550` 형식을 그대로 유지해서 기존 데이터 마이그레이션을 피한다.
+ // Firestore 문서 ID — 타입에 예외를 두지 않는다
  export const docKey = (userId, mediaType, itemId) =>
-   mediaType === 'movie' ? `${userId}_${itemId}` : `${userId}_${mediaType}_${itemId}`;
+   `${userId}_${mediaType}_${itemId}`;

- // 레거시 문서에는 mediaType이 없다 → 영화로 간주
- export const typeOf = (docData) => docData?.mediaType ?? 'movie';
```

3항 연산자 하나가 사라지자 `typeOf()`의 존재 이유도 함께 사라졌다.

덤으로 두 파일에 글자 그대로 중복돼 있던 필터 칩 상수를 끌어올렸다.

```diff
+ // 검색 필터 칩 목록 (홈 검색 · 추가 모달 공용)
+ export const MEDIA_FILTERS = MEDIA_TYPES.map((type) => ({
+   value: type,
+   label: MEDIA_LABEL[type],
+ }));
```

```diff
  // src/app/page.jsx
- const SEARCH_FILTERS = MEDIA_TYPES.map((type) => ({ value: type, label: MEDIA_LABEL[type] }));
  // src/components/AddMediaModal.jsx
- const TYPE_FILTERS   = MEDIA_TYPES.map((type) => ({ value: type, label: MEDIA_LABEL[type] }));
```

### `src/firebase/` — 저장 레이어

```diff
  // diary.js — saveDiary()
    userId,
    mediaType,
-   movieId: coerceId(mediaType, itemId),
+   itemId: coerceId(mediaType, itemId),

  // watchlist.js — addToWatchlist()
-   movieId: coerceId(mediaType, itemId),
-   movieTitle: itemData.title,
-   moviePoster: itemData.poster ?? null,
+   itemId: coerceId(mediaType, itemId),
+   title: itemData.title,
+   poster: itemData.poster ?? null,
```

키 Set을 만드는 부분은 두 파일이 같다.

```diff
- import { docKey, mediaKey, typeOf, coerceId } from '../lib/media';
+ import { docKey, mediaKey, coerceId } from '../lib/media';

  return new Set(snap.docs.map((d) => {
    const data = d.data();
-   return mediaKey(typeOf(data), data.movieId);
+   return mediaKey(data.mediaType, data.itemId);
  }));
```

### `src/components/MediaDiarySection.jsx` — 이름 변환이 사라진 자리

```diff
  await saveDiary(user.uid, mediaType, itemId, {
    ...data,
-   movieTitle: item.title,
-   moviePoster: item.poster ?? null,
+   title: item.title,
+   poster: item.poster ?? null,
    createdAt: diary?.createdAt ?? null,
  });
```

`item`은 API 정규화 객체다. 이전엔 `item.title`을 `movieTitle`로 **개명해서** 넣어야 했다.
이제는 이름이 같아서 그대로 넘어간다.

### 카드 컴포넌트

```diff
  // DiaryCard.jsx
- import { detailHref, typeOf } from '../lib/media';
+ import { detailHref } from '../lib/media';

- const poster = diary.moviePoster ? getPosterUrl(diary.moviePoster, 'w342') : null;
- const mediaType = typeOf(diary);
+ const poster = diary.poster ? getPosterUrl(diary.poster, 'w342') : null;
+ const mediaType = diary.mediaType;

- onClick={() => router.push(detailHref(mediaType, diary.movieId))}
+ onClick={() => router.push(detailHref(mediaType, diary.itemId))}
- <p ...>{diary.movieTitle}</p>
+ <p ...>{diary.title}</p>
```

`WatchlistCard.jsx`도 동일한 패턴 (`item.movieId → item.itemId` 등).

### `src/app/page.jsx`

```diff
- import { MEDIA_TYPES, MEDIA_LABEL, WATCHLIST_LABEL, mediaKey, typeOf, parseMediaType } from '../lib/media';
+ import { MEDIA_TYPES, MEDIA_LABEL, MEDIA_FILTERS, WATCHLIST_LABEL, mediaKey, parseMediaType } from '../lib/media';

  // 찜 취소 후 목록에서 제거
- prev.filter((item) => !(typeOf(item) === mediaType && item.movieId === itemId))
+ prev.filter((item) => !(item.mediaType === mediaType && item.itemId === itemId))

  // 탭별 찜 필터
- watchlist.filter((item) => typeOf(item) === mediaType)
+ watchlist.filter((item) => item.mediaType === mediaType)

  // 일기 종류 필터 · 개수
- myDiaries.filter((d) => typeOf(d) === diaryFilter)
- count: myDiaries.filter((d) => typeOf(d) === type).length,
+ myDiaries.filter((d) => d.mediaType === diaryFilter)
+ count: myDiaries.filter((d) => d.mediaType === type).length,
```

### `src/app/diary/page.jsx`

```diff
- import { detailHref, typeOf, MEDIA_LABEL } from '../../lib/media';
+ import { detailHref, MEDIA_LABEL } from '../../lib/media';

- onClick={() => router.push(detailHref(typeOf(diary), diary.movieId))}
+ onClick={() => router.push(detailHref(diary.mediaType, diary.itemId))}
- {diary.moviePoster ? <img src={getPosterUrl(diary.moviePoster, 'w92')} alt={diary.movieTitle} .../>
+ {diary.poster ? <img src={getPosterUrl(diary.poster, 'w92')} alt={diary.title} .../>
- {MEDIA_LABEL[typeOf(diary)]}
+ {MEDIA_LABEL[diary.mediaType]}
```

### `src/components/WatchProviders.jsx` — 곁가지 정리

DB와 무관하지만 드라마 상세에서도 쓰이던 같은 성격의 잔재.

```diff
- function ProviderButton({ provider, movieTitle, fallbackLink }) {
-   const href = getUrl ? getUrl(movieTitle) : fallbackLink;
+ function ProviderButton({ provider, title, fallbackLink }) {
+   const href = getUrl ? getUrl(title) : fallbackLink;

- <ProviderButton ... movieTitle={searchTitle} />
+ <ProviderButton ... title={searchTitle} />
```

### `e2e/helpers/emulator.js` — 레거시 검증이 사라진 자리

가장 의미 있는 변화다. **하위 호환을 검증하던 시드가 없어졌다.**

```diff
- /**
-  * 앱의 addToWatchlist()와 동일한 문서 구조로 찜을 심습니다.
-  * 일부러 mediaType 없이 심어서, 드라마/책 추가 이전에 저장된 레거시 문서가
-  * 여전히 "영화"로 인식되는지 함께 검증합니다.
-  */
+ /** 앱의 addToWatchlist()와 동일한 문서 구조로 영화 찜을 심습니다. */
  async function seedWatchlistItem(uid, movie) {
-   await setDocument('watchlist', `${uid}_${movie.id}`, {
-     userId: uid,
-     movieId: movie.id,
-     movieTitle: movie.title,
-     moviePoster: movie.posterPath,
-     addedAt: new Date('2026-09-10T12:00:00Z'),
-   });
+   await seedWatchlistMedia(uid, 'movie', movie);
  }
```

영화 시드가 드라마·책 시드와 **같은 함수로 합쳐졌다.** 이전엔 영화만 문서 ID 형식이
달라서 별도 함수가 필요했다. `seedDiary()`도 `{uid}_{id}` → `{uid}_movie_{id}`로 바뀌고
`mediaType: 'movie'`가 들어갔다.

---

## 5. 실제 데이터

마이그레이션 직전 프로덕션 상태 (uid 1명).

| 컬렉션 | 문서 | `mediaType` 보유 | 비고 |
| --- | --- | --- | --- |
| `diaries` | 21건 | **1건** (책) | 영화 20건 전부 레거시 |
| `watchlist` | 7건 | **0건** | 전부 레거시 영화 |

28건 중 27건이 `mediaType` 없는 레거시였다. 드라마 데이터는 아직 0건.

변환 결과:

```
{uid}_550      →  {uid}_movie_550     27건 (ID 변경)
{uid}_book_…   →  (동일)               1건 (필드만)

movieId        →  itemId              28건
movieTitle     →  title               28건
moviePoster    →  poster              28건
mediaType      →  추가                 27건
```

검증 후: `diaries` 21건(movie 20 · book 1), `watchlist` 7건(movie 7). **유실 0건.**

---

## 6. 실행 절차

`scripts/`에 백업 → 드라이런 → 적용 → 검증 도구를 두고 다음 순서로 진행했다.

```
backup  →  dry  →  (결과 확인)  →  apply  →  verify  →  배포
```

안전장치:

- 기본이 드라이런. `--apply`를 명시해야 쓴다.
- 백업 파일이 없으면 `apply`를 거부한다.
- 문서 하나라도 변환 실패 시 **아무것도 쓰지 않고** 중단 (부분 적용 방지).
- 배치 쓰기로 원자적 처리. ID가 바뀌는 문서는 생성+삭제가 같은 배치에 들어간다.
- 멱등. 재실행하면 "변경 0건".

검증 항목은 필수 필드 존재, 레거시 필드 부재, `itemId` 타입(책=문자열 / TMDB=정수),
그리고 **문서 ID와 필드의 일치** — 이게 어긋나면 조회가 조용히 빗나가므로 가장 중요하다.

> `apply` 이후 새 코드를 배포하기 전까지 실서비스는 옛 필드명을 읽으므로 화면이 깨진다.
> 적용과 배포는 붙여서 해야 한다.

검증 결과: 빌드 통과, E2E 13/13 통과, 백업 무손실 왕복 확인(28문서 · Timestamp 49개).

---

## 7. 정리

**사라진 것**

- `typeOf()` 헬퍼 — 호출 10곳
- `docKey()`의 타입 분기
- `movieId` · `movieTitle` · `moviePoster` 필드
- 저장 시 `item.title → movieTitle` 개명 단계
- E2E의 레거시 호환 시드와 영화 전용 시드 함수
- `docs/data-model.md`의 "필드명이 `movieId`인 이유" 변명 절

**새로 생긴 것**

- `MEDIA_FILTERS` — 두 곳에 중복이던 필터 칩 상수
- `scripts/` — 백업 · 마이그레이션 · 검증 · 복원 도구

**앞으로**

Firestore 문서의 타입은 `doc.mediaType`을 그대로 읽는다. 더 이상 방어 헬퍼가 없고,
필요하지도 않다. 필드명은 API 정규화 shape와 같으므로 저장·조회 시 개명하지 않는다.

**타이밍에 대해**

| 날짜 | |
| --- | --- |
| 2026-03-14 | 영화 전용 앱으로 시작 |
| 2026-09-22 | 드라마·책 추가 — 기존 데이터를 지키려 영화에 예외를 둠 |
| 2026-09-24 | 예외 제거 (이 문서) |

레거시 호환 상태는 **이틀** 갔다. 대신 그 이틀이 지우려던 문서 20건은 그 앞 6개월 동안
영화 전용으로 쌓인 것들이다.

즉 "기존 데이터를 건드리지 않는다"는 판단 자체는 옳았다 — 드라마·책을 붙이는 작업과
데이터 이전을 한 커밋에 섞지 않았으니까. 잘못될 수 있었던 건 그 다음이다.
**임시 호환은 임시일 때만 임시다.** 데이터가 28건인 지금이 아니라 280건일 때 손댔다면
`typeOf()`는 영구 시설이 됐을 것이다.

새 미디어 타입을 또 추가한다면 같은 순서를 쓴다 — 기능을 먼저 붙여 동작을 확인하고,
곧바로 구조를 정리한다. 예외를 남긴 채 다음 기능으로 넘어가지 않는다.

## 관련 문서

- [data-model.md](data-model.md) — 현재 스키마
- [architecture.md](architecture.md) — 전체 구조와 `lib/media.js` 헬퍼 목록
