# 구조

Yeflix는 영화 · 드라마 · 책을 한 곳에 기록하는 Next.js 14 App Router 앱이다.
백엔드 서버는 없고, 데이터는 외부 API(TMDB · 카카오)와 Firebase(Auth + Firestore)에서 온다.

## 기술 스택

| 영역 | 선택 |
| --- | --- |
| 프레임워크 | Next.js 14 (App Router), React 18 |
| 언어 | JavaScript (JSX) — TypeScript 없음, 경로 별칭 없음 |
| 스타일 | Tailwind CSS 3 (다크 전용), 아이콘은 `lucide-react` |
| 인증 · DB | Firebase Authentication (Google 팝업), Firestore |
| 외부 데이터 | TMDB(영화 · 드라마), 카카오 책 검색(책) |
| 테스트 | Playwright E2E + Firebase 에뮬레이터 |
| 배포 | Vercel |

상태 관리 라이브러리는 없다. `useState` / `useEffect` 와 `AuthContext` 하나로 처리한다.
데이터 페칭 라이브러리(React Query, SWR)도 없다 — 각 페이지가 `useEffect` 안에서 직접 부른다.

## 폴더 구조

```
src/
├── api/                  외부 데이터 접근 계층 (React 의존 없음)
│   ├── tmdb.js             TMDB 호출 + 정규화 + 포매터
│   ├── books.js            카카오 책 (프록시 경유) + 정규화
│   └── search.js           타입별 검색 디스패처 → { items, hasMore }
│
├── app/                  App Router 라우트
│   ├── layout.jsx          루트 레이아웃 (AuthProvider, Navbar, 전역 metadata)
│   ├── page.jsx            홈 — 탭 4개 + 검색 결과
│   ├── api/books/route.js  카카오 책 검색 서버 프록시 (이 앱의 유일한 서버 라우트)
│   ├── movie/[id]/         영화 상세 (page.jsx = 클라이언트, layout.jsx = metadata)
│   ├── tv/[id]/            드라마 상세
│   ├── book/[isbn]/        책 상세
│   ├── diary/              일기 목록 페이지 (Navbar에서 링크되지 않음)
│   ├── settings/           설정
│   │                       ↑ 모든 라우트의 layout.jsx = 메타데이터 전용 서버 컴포넌트
│   ├── manifest.js         PWA 매니페스트
│   ├── sitemap.js / robots.js
│   └── globals.css         유일한 CSS 파일
│
├── components/           전부 'use client', 기본 내보내기
├── context/AuthContext.jsx
├── firebase/
│   ├── config.js           앱 초기화 + 에뮬레이터 연결
│   ├── diary.js            diaries 컬렉션
│   └── watchlist.js        watchlist 컬렉션
├── hooks/useWatchlist.js
└── lib/
    ├── media.js            미디어 타입 공용 헬퍼 (가장 중요)
    ├── site.js             사이트 전역 메타데이터 상수
    └── detailMetadata.js   상세 페이지 generateMetadata 전용 서버 헬퍼
```

## 핵심 개념: 미디어 타입

`movie` · `tv` · `book` 세 종류를 **같은 흐름**으로 다룬다. 이 통일을 담당하는 게
[`src/lib/media.js`](../src/lib/media.js)다. 새 기능을 붙일 때 여기부터 본다.

```js
MEDIA_TYPES       // ['movie', 'tv', 'book']
MEDIA_LABEL       // { movie: '영화', tv: '드라마', book: '책' }
docKey(uid, type, id)   // Firestore 문서 ID
mediaKey(type, id)      // "tv:1399" — 찜/일기 여부 판별용 합성 키
typeOf(doc)             // mediaType 없으면 'movie' (레거시 문서 호환)
detailHref(type, id)    // '/tv/1399'
coerceId(type, id)      // 책은 문자열 ISBN, 나머지는 숫자
```

### 정규화 shape

목록 UI(`MediaCard`, `AddMediaModal`)는 소스별 원본이 아니라 **한 가지 형태만** 받는다.

```js
{ mediaType, id, title, poster, subtitle, rating }
```

- `poster` — TMDB는 `/abc.jpg` 경로, 책은 절대 URL. `getPosterUrl()`이 둘 다 처리한다.
- `subtitle` — 영화 · 드라마는 연도, 책은 저자
- `rating` — 책은 `null`

정규화 함수는 각 소스 옆에 있다: `normalizeMovie` / `normalizeTv` (`api/tmdb.js`), `normalizeBook` (`api/books.js`).

> 상세 페이지는 예외다. 타입마다 보여줄 정보가 달라서 각자 원본 응답을 그대로 읽는다.

## 렌더링 전략

페이지 본문은 **전부 클라이언트 컴포넌트**다. 로그인 상태와 Firestore 데이터가 필요해서
서버에서 미리 그릴 게 거의 없다.

단 하나의 예외가 메타데이터다. 상세 페이지는 공유 미리보기(OG 카드)를 위해 서버 응답에
제목 · 설명 · 이미지가 들어 있어야 하는데, 클라이언트 컴포넌트에는 `generateMetadata`를 둘 수 없다.
그래서 각 상세 라우트에 **얇은 서버 `layout.jsx`** 를 두고 거기서만 메타데이터를 만든다.

```
app/movie/[id]/layout.jsx   서버 — generateMetadata (크롤러용), children 그대로 반환
app/movie/[id]/page.jsx     클라이언트 — 실제 화면
```

두 곳이 같은 데이터를 각각 가져온다(서버는 크롤러 응답용, 클라이언트는 화면용).
중복 호출처럼 보이지만 의도된 것이고, 서버 쪽은 `revalidate: 86400`으로 캐시된다.

`diary/`와 `settings/`에도 `layout.jsx`가 있지만 이쪽은 외부 데이터 없이 고정 메타데이터만 준다
(본인만 보는 페이지라 `robots: { index: false }`).

**따라서 `layout.jsx`는 메타데이터 전용이다.** UI를 감싸는 용도로 쓰지 않는다.

## 데이터 흐름

```
검색   Navbar → /?search=..&type=..  → searchMedia(type, q) → 정규화 → MediaCard
탐색   MediaCard → /{type}/{id}      → 상세 페이지가 원본 응답을 직접 조회
기록   상세 페이지 → MediaDiarySection → saveDiary() → Firestore
찜     상세 페이지 → useWatchlist → addToWatchlist() → Firestore
```

일기를 저장하면 같은 작품이 찜 목록에서 자동으로 빠진다
(`MediaDiarySection`의 `onSaved` → `useWatchlist.removeIfPresent`).

## 공용 컴포넌트

| 컴포넌트 | 역할 |
| --- | --- |
| `MediaCard` | 정규화 shape를 받는 포스터 카드. 세 타입 공용 |
| `MediaGrid` / `GridSkeleton` | 반복되던 그리드 · 스켈레톤 마크업 |
| `EmptyState` | 아이콘 + 제목 + 설명 + 액션 |
| `FilterChips` | 알약 필터 (검색 타입, 일기 종류, 추가 모달) |
| `MediaDiarySection` | 상세 페이지 3개가 공유하는 일기 CRUD 블록 |
| `WatchlistButton` + `useWatchlist` | 상세 페이지 찜 토글 |
| `WatchProviders` | OTT 바로가기 (영화 · 드라마) |
| `BookLinks` | 서점 · 도서관 바로가기 (책) |

## 알아둘 제약

- **경로 별칭이 없다.** import는 전부 상대 경로(`../../../api/tmdb`).
- **ESLint가 설정돼 있지 않다.** `npm run lint`를 실행하면 대화형 설정 프롬프트가 떠서 멈춘다.
  검증은 `npm run build`와 `npm run test:e2e`로 한다.
- **운영 Firestore 보안 규칙이 저장소에 없다.** `firestore.emulator.rules`는 에뮬레이터 전용이고
  `allow read, write: if true`다. 절대 배포하면 안 된다.
- **탭 전환에 DOM 커스텀 이벤트를 쓴다.** Navbar가 `switch-tab` 이벤트를 쏘고 홈이 받는다.
  라우팅이 아니라서 URL에 남지 않는다.

## 관련 문서

- [api.md](api.md) — 외부 API와 내부 API 계층
- [data-model.md](data-model.md) — Firestore 스키마
- [../e2e/README.md](../e2e/README.md) — E2E 테스트 구조
