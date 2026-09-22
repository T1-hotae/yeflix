# Yeflix

영화 · 드라마 · 책을 검색하고, 보러갈 곳(OTT/서점)을 확인하며, 별점과 감상 일기를 남길 수 있는 개인 기록 서비스입니다.

영화를 보기 시작한 후 감상문을 직접 기록하고 싶어서 만들게 되었습니다.

---

## 스크린샷

### 홈 화면

![홈 화면](public/assets/home.png)

### 영화 상세 페이지

![영화 상세](public/assets/MovieDetail.png)

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 통합 검색 | 영화 / 드라마 / 책을 필터로 골라 검색 |
| 영화 · 드라마 상세 | 포스터, 장르, 상영시간(시즌·회차), 감독(기획), 출연진, TMDB 평점 |
| 책 상세 | 표지, 저자·역자, 출판사, 출간일, 가격, 책 소개, ISBN |
| OTT 바로가기 | Netflix, TVING, wavve, Watcha 등 국내 스트리밍 플랫폼 링크 (JustWatch 데이터) |
| 서점 바로가기 | 교보문고, 예스24, 알라딘, 국립중앙도서관, 밀리의 서재, 리디 링크 (ISBN 기준) |
| 찜 목록 | 볼영화 / 볼드라마 / 볼책을 각각 북마크로 저장 |
| 감상 일기 | 별점, 관람·시청·독서 날짜, 감상문, 태그를 포함한 일기 작성·수정·삭제 |
| Google 로그인 | Google 계정으로 간편 로그인 |

---

## 사용 기술

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Auth & DB**: Firebase Authentication, Firestore
- **API**: TMDB (영화 · 드라마), 카카오 책 검색 (책)

---

## API 정보

### TMDB API — 영화 · 드라마

- 사이트: [https://www.themoviedb.org](https://www.themoviedb.org)
- API 문서: [https://developer.themoviedb.org/docs](https://developer.themoviedb.org/docs)
- 사용 엔드포인트:

| 엔드포인트 | 설명 |
|-----------|------|
| `GET /search/movie` | 영화 검색 |
| `GET /movie/{id}` | 영화 상세 정보 |
| `GET /movie/{id}/credits` | 감독 및 출연진 |
| `GET /movie/{id}/watch/providers` | 국내 OTT 스트리밍 정보 |
| `GET /search/tv` | 드라마 검색 |
| `GET /tv/{id}` | 드라마 상세 정보 (시즌·회차·기획·채널) |
| `GET /tv/{id}/credits` | 출연진 |
| `GET /tv/{id}/watch/providers` | 국내 OTT 스트리밍 정보 |

### 카카오 책 검색 API — 책

- API 문서: [https://developers.kakao.com/docs/latest/ko/daum-search/dev-guide](https://developers.kakao.com/docs/latest/ko/daum-search/dev-guide)
- 엔드포인트: `GET https://dapi.kakao.com/v3/search/book` (`target=isbn`으로 단권 조회)
- REST 키를 브라우저에 노출하지 않기 위해 **`/api/books` 라우트 핸들러가 서버에서 대신 호출**합니다.

> 국내 도서 API 현황: 네이버 책 검색 API는 2026-07-31에, 알라딘 OpenAPI는 2026-10-30에 종료되었습니다
> (알라딘은 2026-09-04부터 신규 키 발급도 중단). 그래서 카카오 책 검색 API를 사용합니다.

### Firebase

사용자 인증과 일기/찜 데이터 저장에 사용합니다.

- **Authentication**: Google 소셜 로그인
- **Firestore**: 일기(`diaries`), 찜 목록(`watchlist`)
  - 두 컬렉션 모두 `mediaType` 필드(`movie` / `tv` / `book`)로 종류를 구분합니다.
  - 문서 ID는 영화가 `uid_{id}`, 드라마·책은 `uid_{mediaType}_{id}` 형식입니다.
    (`mediaType`이 없는 기존 문서는 영화로 취급합니다)

---

## 환경 변수

`.env.local` 파일을 프로젝트 루트에 생성하고 아래 값을 설정하세요.

```env
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key

# 카카오 개발자센터에서 앱 생성 후 발급받은 REST API 키
# 서버에서만 사용하므로 NEXT_PUBLIC_ 접두어를 붙이지 않습니다.
KAKAO_REST_API_KEY=your_kakao_rest_api_key

NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

## 로컬 실행

```bash
npm install
npm run dev
```

## 테스트

```bash
npm run test:e2e   # Firebase 에뮬레이터 + next dev 를 자동으로 띄우고 Playwright 실행
```

외부 네트워크(TMDB · 카카오 책 · OTT · 서점)는 모두 목킹되므로 API 키 없이도 돌아갑니다.
