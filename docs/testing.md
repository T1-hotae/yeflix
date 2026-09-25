# 테스트

검증은 세 층으로 나뉜다. 아래로 갈수록 빠르고 실패 지점이 좁다.

```
E2E (Playwright + 에뮬레이터)     느림 · 사용자 여정 전체
   ↑
통합 (Vitest)                     라우트 핸들러 · 컴포넌트↔데이터 계약
   ↑
단위 (Vitest)                     순수 함수 · 호출 형태 — 외부 의존 없음
```

E2E는 "로그인해서 일기를 쓰면 찜이 풀린다"를 보증하고,
단위·통합은 그게 깨졌을 때 **어디가** 깨졌는지 알려준다.

## 실행

```bash
npm test               # 단위 + 통합 + 컴포넌트 — 에뮬레이터 불필요, 2초대
npm run test:watch     # 감시 모드
npm run test:cov       # 커버리지
npm run test:e2e       # Playwright 전체 여정 (에뮬레이터 + next dev 자동 기동)
```

`npm test`는 네트워크도 에뮬레이터도 타지 않는다. 커밋 전 기본 관문으로 쓴다.

## 도구

| 항목 | 선택 | 이유 |
| --- | --- | --- |
| 러너 | Vitest | 프로젝트가 ESM JS라 Jest의 babel/`next/jest` 설정이 불필요하다 |
| JSX | `@vitejs/plugin-react` | Babel 설정 파일 없이 JSX 변환 |
| DOM | jsdom + Testing Library | 컴포넌트 테스트용 |
| 네트워크 | `vi.stubGlobal('fetch')` | fetch 호출 지점이 세 곳뿐이라 MSW는 과하다 |

설정은 [`vitest.config.mjs`](../vitest.config.mjs) 하나, 전역 준비는
[`tests/setup.js`](../tests/setup.js) 하나다.

기본 실행 환경은 **node**다. DOM이 필요한 파일만 맨 위에 docblock을 붙인다.

```js
/** @vitest-environment jsdom */
```

## 폴더

```
tests/
├── setup.js                      jest-dom 확장 + 가짜 환경변수 주입
├── unit/                         외부 의존 0
│   ├── media.test.js               docKey · coerceId · mediaKey · parseMediaType
│   ├── tmdb-format.test.js         포스터 URL · 별점 · 러닝타임 · 정규화
│   ├── tmdb-fetch.test.js          TMDB 요청 URL · KR 제공자 추출 · 에러 전파
│   ├── books-format.test.js        getIsbn13 · formatAuthors · normalizeBook
│   ├── books-fetch.test.js         /api/books 프록시 경유 (jsdom)
│   ├── search.test.js              타입별 디스패치 + hasMore 경계
│   ├── detail-metadata.test.js     clamp · 공유 이미지 · 카카오 표지 원본 추출
│   ├── site.test.js                absoluteUrl · SITE_URL 정규화
│   └── firestore-shape.test.js     Firestore 쿼리·쓰기 호출 형태 가드
├── component/                    RTL + jsdom
│   └── external-links.test.jsx     서점 · OTT 링크 URL ↔ E2E 목킹 호스트 대조
└── integration/
    └── books-route.test.js         /api/books 라우트 핸들러 직접 호출
```

현재 161케이스, 11개 파일. 실행 시간은 2초대다.

## 각 층이 지키는 것

단위·통합 테스트는 대부분 [`CLAUDE.md`](../CLAUDE.md)의 "반드시 지킬 것"과 1:1로 대응한다.
규칙이 말로만 남아 있으면 리팩터링 때 조용히 깨지므로, 테스트로 고정해 둔 것이다.

| 규칙 | 지키는 테스트 |
| --- | --- |
| #1 미디어 타입은 `lib/media.js`를 거친다 | `unit/media.test.js` — 특히 `coerceId`(책=문자열, 나머지=숫자) |
| #2 Firestore 필드명은 정규화 shape와 같다 | `unit/firestore-shape.test.js` — 저장 payload의 키를 직접 단언 |
| #3 목록 UI는 정규화 shape만 받는다 | `unit/tmdb-format.test.js`, `unit/books-format.test.js` |
| #4 Firestore 쿼리는 단순하게 | `unit/firestore-shape.test.js` — `where` 1회, `orderBy` 0회 |
| #5 카카오 키는 서버에만 | `integration/books-route.test.js`, `unit/books-fetch.test.js` |
| #6 외부 링크에는 E2E 목킹도 | `component/external-links.test.jsx` — `EXTERNAL_HOSTS`와 대조 |

### 규칙 #4는 단위 테스트가 아니면 못 잡는다

에뮬레이터는 복합 인덱스 없이도 `orderBy`를 그냥 통과시킨다.
즉 `orderBy('updatedAt', 'desc')`를 하나 추가해도 E2E는 초록불이고 운영에서만 터진다.
그래서 SDK를 통째로 목킹해 **호출 형태 자체**를 단언한다.

확인해 본 결과 실제로 `getMyDiaries`에 `orderBy`를 넣으면
`unit/firestore-shape.test.js`의 두 케이스가 즉시 실패한다.

### 규칙 #6은 자동으로 대조된다

`component/external-links.test.jsx`가 `BookLinks`·`WatchProviders`를 실제로 렌더해
`<a href>` 호스트를 전부 모은 뒤, [`e2e/helpers/tmdb-mock.js`](../e2e/helpers/tmdb-mock.js)의
`EXTERNAL_HOSTS`와 비교한다. 서점·OTT를 추가하고 목킹 목록에 넣지 않으면
E2E를 돌리기 전에 `npm test`가 빠진 호스트 이름을 찍어 준다.

이 대조를 위해 `EXTERNAL_HOSTS`를 모듈 최상단으로 올려 `module.exports`에 추가했다.

## 목킹 전략

### 외부 HTTP

`fetch`를 `vi.stubGlobal`로 갈아끼운다. 실제 TMDB·카카오는 절대 타지 않는다.

`searchMedia` 테스트는 `importOriginal()`로 정규화 함수는 실제 구현을 남기고
네트워크 함수(`searchMovies`·`searchTv`·`searchBooks`)만 가짜로 바꾼다.
디스패처가 올바른 `normalize*`를 고르는지까지 함께 검증하기 위해서다.

### Firestore

`vi.mock('firebase/firestore')`로 SDK 전체를 스파이로 바꾸고
`src/firebase/config.js`는 `{ db: {} }`로 대체한다.
에뮬레이터 없이도 문서 ID·저장 필드·쿼리 제약을 전부 확인할 수 있다.

### 환경변수

`.env`에는 실제 키가 들어 있다. `vitest.config.mjs`의 `envDir`을 `./tests`로 지정해
(그 디렉터리에 `.env` 파일이 없다) 테스트가 실제 키를 읽지 못하게 막고,
필요한 값은 `tests/setup.js`가 가짜로 주입한다.

## E2E와 겹치지 않게

아래는 [`e2e/yeflix.spec.js`](../e2e/yeflix.spec.js)가 이미 커버하므로 Vitest로 다시 쓰지 않는다.

- 로그인 플로우, 헤더 계정 표시
- 홈 탭 4개 구성, 탭 간 전환
- 검색 → 상세 페이지 이동
- 찜 해제 후 목록 반영
- `/diary` 페이지 렌더
- `src/firebase/config.js`의 에뮬레이터 연결 분기

`src/app/page.jsx`는 라우터 · Auth · Firestore · 검색이 모두 얽혀 있어
RTL로 감싸면 목킹 비용이 소득을 넘는다. E2E에 맡긴다.

## 커버리지

| 대상 | 목표 | 현재 |
| --- | --- | --- |
| `src/lib/**` | 90% 이상 | 100% |
| `src/api/**` | 90% 이상 | 100% |
| `src/firebase/**` | 80% 이상 | 81% (`config.js`는 E2E 담당) |
| `src/components/**` | 수치 목표 없음 | `BookLinks`·`WatchProviders`만 100% |
| `src/app/**` | 집계 제외 | — |

`npm run test:cov`의 텍스트 표에는 **완전히 커버된 파일이 나오지 않는다.**
`src/lib`·`src/api` 파일들이 표에 안 보이면 100%라는 뜻이다.

## 앞으로 추가할 것

아직 비어 있는 자리. 우선순위 순이다.

| 대상 | 내용 | 비고 |
| --- | --- | --- |
| `component/DiaryForm.test.jsx` | 별점 0 제출 차단, 태그 토글·10개 상한·`#` 제거, 타입별 라벨 | jsdom |
| `component/MediaDiarySection.test.jsx` | 비로그인 안내 → 읽기 → 수정 전환, 저장 시 `onSaved` 호출 | firebase 래퍼 목킹 |
| `component/useWatchlist.test.js` | toggle 추가↔제거, `loading` 중 연타 차단 | `renderHook` |
| `emulator/diary.test.js` | 실제 에뮬레이터 왕복 — `serverTimestamp` 확정 후 정렬 | Java 11+ 필요 |
| `emulator/watchlist.test.js` | 〃 | 〃 |

에뮬레이터 테스트를 붙일 때는 E2E(firestore 8085)와 포트가 겹치지 않도록
`firebase.vitest.json`에 **8086**을 따로 두고 `firebase emulators:exec`로 감싼다.
그래야 E2E를 띄워 둔 채로도 돌릴 수 있다.

## 테스트를 추가할 때

- 순수 함수를 새로 만들면 **`tests/unit`에 같이 넣는다.** 외부 의존이 없으므로 비용이 거의 없다.
- 외부 링크(서점 · OTT)를 추가하면 `e2e/helpers/tmdb-mock.js`의 `EXTERNAL_HOSTS`에
  호스트를 넣는다. 빠뜨리면 `component/external-links.test.jsx`가 알려준다.
- Firestore 래퍼에 조회 함수를 추가하면 `unit/firestore-shape.test.js`의
  `LIST_QUERIES` 배열에도 추가한다. 그래야 쿼리 형태 가드가 그 함수에도 적용된다.
