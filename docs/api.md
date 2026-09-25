# API

외부 데이터는 두 곳에서 온다. 영화 · 드라마는 TMDB, 책은 카카오 책 검색이다.
앱 코드는 이 둘을 직접 부르지 않고 항상 `src/api/` 계층을 거친다.

```
컴포넌트
   ↓
src/api/search.js        타입별 디스패처 (목록 화면 전용)
   ↓
src/api/tmdb.js          브라우저 → TMDB 직접 호출
src/api/books.js         브라우저 → /api/books → 카카오
```

## 환경변수

| 이름 | 어디서 쓰나 | 비고 |
| --- | --- | --- |
| `NEXT_PUBLIC_TMDB_API_KEY` | 브라우저 + 서버 | 쿼리 파라미터로 붙어서 **브라우저에 노출된다** |
| `KAKAO_REST_API_KEY` | 서버 전용 | `NEXT_PUBLIC_` 접두어를 붙이면 안 된다 |
| `NEXT_PUBLIC_SITE_URL` | 메타데이터 | OG 이미지·canonical의 절대 URL 기준 |
| `NEXT_PUBLIC_FIREBASE_*` | 브라우저 | 6개 |

## TMDB — 영화 · 드라마

[`src/api/tmdb.js`](../src/api/tmdb.js). 모든 호출이 모듈 내부 `fetcher`를 지나고,
`language=ko-KR`이 고정으로 붙는다. 실패하면 `TMDB Error: {status}`를 던진다.

| 함수 | 엔드포인트 |
| --- | --- |
| `searchMovies(query, page)` | `GET /search/movie` |
| `getMovieDetail(id)` | `GET /movie/{id}` |
| `getMovieCredits(id)` | `GET /movie/{id}/credits` |
| `getWatchProviders(id)` | `GET /movie/{id}/watch/providers` → `results.KR` |
| `searchTv(query, page)` | `GET /search/tv` |
| `getTvDetail(id)` | `GET /tv/{id}` |
| `getTvCredits(id)` | `GET /tv/{id}/credits` |
| `getTvWatchProviders(id)` | `GET /tv/{id}/watch/providers` → `results.KR` |

보러가기 데이터는 KR 블록만 언랩해서 돌려준다. 국내에서 이용 가능한 서비스가 없으면 `null`이다.

### 영화 ↔ 드라마 필드 차이

| 영화 | 드라마 |
| --- | --- |
| `title` | `name` |
| `original_title` | `original_name` |
| `release_date` | `first_air_date` |
| `runtime` | `number_of_seasons` / `number_of_episodes` |
| `credits.crew`에서 `job === 'Director'` | 상세 응답의 `created_by[]` |

`normalizeMovie` / `normalizeTv`가 이 차이를 흡수하므로 **목록 UI에는 분기가 없다.**
상세 페이지에서만 원본 필드를 직접 읽는다.

### 포매터

`getPosterUrl(path, size)` · `formatRating` · `getYear` · `formatGenres` · `formatRuntime` · `formatSeasons`

`getPosterUrl`은 `http`로 시작하면 그대로 돌려준다. 책 표지(절대 URL)를 같은 함수로 처리하기 위한 것이다.

## 카카오 책 검색 — 책

### 왜 카카오인가

국내 도서 API가 연달아 종료됐다.

- **네이버 책 검색 API** — 2026-07-31 종료. NAVER API Hub 이관 대상에서 제외됐다.
- **알라딘 OpenAPI** — 2026-10-30 종료. 신규 키 발급은 2026-09-04에 이미 마감됐다.
- **카카오(Daum) 책 검색 API** — 운영 중. 현재 사실상 유일한 선택지다.

### 서버 프록시

[`src/app/api/books/route.js`](../src/app/api/books/route.js)가 이 앱의 **유일한 서버 라우트**다.
REST 키를 브라우저에 노출하지 않으려고 둔 것이고, 응답을 1시간 캐시한다.

```
GET /api/books?query=<검색어>&page=<쪽>&target=<isbn|생략>
   ↓  Authorization: KakaoAK {KAKAO_REST_API_KEY}
GET https://dapi.kakao.com/v3/search/book
```

카카오에는 **상세 조회 전용 엔드포인트가 없다.** 그래서 책 상세 페이지는 `target=isbn`으로
재검색해서 한 권을 가져온다.

### 클라이언트 래퍼

[`src/api/books.js`](../src/api/books.js)

| 함수 | 설명 |
| --- | --- |
| `searchBooks(query, page)` | 프록시 검색 |
| `getBookDetail(isbn)` | `target=isbn` 재검색 → `documents[0]` |
| `getIsbn13(doc)` | `isbn` 필드에서 13자리를 뽑는다 |
| `formatAuthors(doc)` | 저자 + 역자 |
| `normalizeBook(doc)` | 정규화 shape로 변환 |

### 카카오 응답에서 주의할 점

- `isbn` 필드는 `"8937460440 9788937460449"` 형태의 **공백 구분 문자열**이고, 한쪽만 올 때도 있다.
  반드시 `getIsbn13()`을 거친다.
- `thumbnail`이 **빈 문자열인 책이 있다.** 카드에서 플레이스홀더로 폴백해야 한다.
- 썸네일은 120x174로 작다. 공유 카드용 원본 표지는 썸네일 URL의 `fname` 파라미터에 들어 있고,
  [`lib/detailMetadata.js`](../src/lib/detailMetadata.js)의 `bookCoverUrl()`이 꺼내 쓴다.
- ISBN이 없는 항목은 상세 페이지로 갈 수 없어서 `search.js`에서 걸러낸다.

주요 필드: `title` · `contents`(소개) · `url`(다음 책) · `isbn` · `datetime` · `authors[]` ·
`publisher` · `translators[]` · `price` · `sale_price` · `thumbnail` · `status`

## 통합 검색

[`src/api/search.js`](../src/api/search.js) — 목록 화면이 소스별 응답 차이를 몰라도 되게 통일한다.

```js
searchMedia(mediaType, query, page) → { items, hasMore }
```

`hasMore`는 TMDB의 `page < total_pages`와 카카오의 `!meta.is_end`를 하나로 맞춘 것이다.
`items`는 정규화 shape 배열이다.

## 보러가기 링크

### OTT (영화 · 드라마)

TMDB `watch/providers`(JustWatch 데이터)가 주는 제공자 목록을 받아,
[`WatchProviders.jsx`](../src/components/WatchProviders.jsx)의 `DIRECT_URL` 맵에서
`provider_id` → 해당 플랫폼 검색 URL로 바꾼다. 맵에 없으면 TMDB가 준 `link`로 폴백한다.

넷플릭스(8) · 왓챠(97) · wavve(356) · TVING(127, 1096) · 쿠팡플레이(464) ·
디즈니+(337) · Apple TV(350) · Prime Video(119) · Seezn(522)

### 서점 (책)

제공자 API가 없어서 [`BookLinks.jsx`](../src/components/BookLinks.jsx)가 **ISBN13 기반 검색 URL**을
직접 만든다. 교보문고 · 예스24 · 알라딘 · 국립중앙도서관은 ISBN으로, 전자책(밀리의 서재 · 리디)은
ISBN 검색이 잘 안 먹어서 제목으로 보낸다.

> 서점 검색 URL은 사이트 리뉴얼로 바뀐다. 실제로 밀리의 서재는 `/search`가 404라
> `/v3/search`를 쓰고 있다. **링크를 추가·수정하면 브라우저로 한 번 열어서 확인할 것.**
> 그리고 새 호스트는 [`e2e/helpers/tmdb-mock.mjs`](../e2e/helpers/tmdb-mock.mjs)의
> `EXTERNAL_HOSTS`에 반드시 추가해야 테스트가 실제 사이트로 나가지 않는다.

## 메타데이터용 서버 호출

[`src/lib/detailMetadata.js`](../src/lib/detailMetadata.js)는 상세 페이지의 `generateMetadata`
전용이다. 화면용 `src/api/` 계층과는 별개이며, 크롤러 응답에 제목·설명·이미지를 넣기 위해
서버에서 같은 데이터를 한 번 더 가져온다(`revalidate: 86400`).

실패는 전부 `null`로 흘려서 메타데이터 때문에 페이지가 죽지 않게 한다.

## 관련 문서

- [architecture.md](architecture.md) — 전체 구조
- [data-model.md](data-model.md) — Firestore 스키마
