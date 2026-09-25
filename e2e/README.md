# Yeflix E2E 테스트

Playwright + Firebase 에뮬레이터로 핵심 사용자 여정을 검증합니다.

## 실행

```bash
npm run test:e2e          # 전체 실행 (headless)
npm run test:e2e:headed   # 브라우저 띄우고 실행
npm run test:e2e:ui       # Playwright UI 모드 (디버깅용)
npm run test:e2e:report   # 마지막 실행 리포트 열기
```

Firebase 에뮬레이터와 `next dev`는 Playwright가 알아서 띄우고 내립니다.
따로 실행해 둘 필요는 없습니다.

### 사전 조건

| 항목 | 이유 |
| --- | --- |
| Node 18+ | `fetch` 전역 사용 |
| Java 11+ | Firebase 에뮬레이터 구동에 필요 |
| `npx playwright install chromium` | 최초 1회 브라우저 설치 |

`firebase-tools`는 `npx firebase`로 실행되므로 전역 설치가 없으면 자동으로 받아옵니다.

## 검증하는 시나리오

| # | 시나리오 | 파일 |
| --- | --- | --- |
| 1 | Google 계정으로 로그인하면 헤더에 내 계정이 뜬다 | [yeflix.spec.mjs](yeflix.spec.mjs) |
| 2 | "내 일기" 탭에 그동안 작성한 일기가 뜬다 | 〃 |
| 2-1 | `/diary` 페이지에서도 일기 내용·태그가 보인다 | 〃 |
| 3 | "볼영화" 탭에 찜해 둔 영화가 뜬다 | 〃 |
| 4 | 일기를 누르면 상세 페이지에서 기록했던 내용을 볼 수 있다 | 〃 |
| 5 | "보러가기"에서 플랫폼을 누르면 해당 플랫폼 검색 URL로 새 탭이 열린다 | 〃 |

## 어떻게 동작하나

### 로그인

실제 Google OAuth는 자동화가 막혀 있어 **Firebase Auth 에뮬레이터**를 씁니다.
앱 코드(`signInWithPopup` → `onAuthStateChanged`)는 운영과 완전히 동일하게 타고,
팝업만 Google 대신 에뮬레이터의 계정 선택 화면이 뜹니다.
`global-setup.mjs`가 `google.com` 제공자 계정을 미리 만들어 두므로
테스트는 목록에서 그 계정을 고르기만 합니다. → [helpers/login.mjs](helpers/login.mjs)

### 데이터

`global-setup.mjs`가 매 실행마다 에뮬레이터를 비우고,
"이미 써 온 사용자" 상태를 Firestore REST API로 심습니다.

- 일기 1건 — 파이트 클럽 (★5, 감상문, 태그 3개)
- 찜 1건 — 인셉션

생성된 uid는 `e2e/.state/seed.json`에 기록되어 워커로 전달됩니다.
→ [helpers/emulator.mjs](helpers/emulator.mjs), [helpers/constants.mjs](helpers/constants.mjs)

### 외부 의존성

TMDB API·이미지·OTT 사이트는 전부 컨텍스트 라우팅으로 가로챕니다.
실제 네트워크를 타지 않으므로 API 키, 쿼터, 응답 변동에 흔들리지 않습니다.
→ [helpers/tmdb-mock.mjs](helpers/tmdb-mock.mjs)

시나리오 5는 넷플릭스를 실제로 열지 않고 스텁 페이지로 응답한 뒤,
새 탭의 URL이 `https://www.netflix.com/search?q=<영화 제목>`인지 확인합니다.

## 앱 소스에 들어간 변경

- [`src/firebase/config.js`](../src/firebase/config.js) — `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=1`일 때만 에뮬레이터에 연결.
  이 값은 Playwright가 `next dev`에 주입하므로 운영 빌드에서는 블록 전체가 실행되지 않습니다.
- [`src/components/Navbar.jsx`](../src/components/Navbar.jsx) — 프로필 드롭다운에 `role="menu"` / `role="menuitem"` 추가.
  드롭다운의 "내 일기"와 탭의 "내 일기"를 구분하기 위한 것이며, 접근성상으로도 올바른 마크업입니다.

## 데이터/영화를 바꾸고 싶다면

[helpers/constants.mjs](helpers/constants.mjs)의 `DIARY_MOVIE`, `WATCHLIST_MOVIE`,
`SEEDED_DIARY`만 고치면 시드와 단언이 함께 따라갑니다.
새 영화를 쓸 땐 [helpers/tmdb-mock.mjs](helpers/tmdb-mock.mjs)의 `MOVIE_DETAILS`에도 추가하세요.

## 포트

| 용도 | 포트 |
| --- | --- |
| Next.js (테스트 전용) | 3100 (`E2E_PORT`로 변경 가능) |
| Auth 에뮬레이터 | 9099 |
| Firestore 에뮬레이터 | 8085 |

평소 개발 서버(3000)와 겹치지 않게 3100을 씁니다.
