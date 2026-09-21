// E2E 테스트 전역 상수 (playwright.config.js / 헬퍼 / 스펙에서 공유)

const EMULATOR_HOST = '127.0.0.1';
const AUTH_EMULATOR_PORT = 9099;
const FIRESTORE_EMULATOR_PORT = 8085;

// "demo-" 접두사를 쓰면 에뮬레이터가 실제 GCP 자격증명 없이 동작합니다.
const FIREBASE_PROJECT_ID = 'demo-yeflix';

const APP_PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://${EMULATOR_HOST}:${APP_PORT}`;

const AUTH_EMULATOR_URL = `http://${EMULATOR_HOST}:${AUTH_EMULATOR_PORT}`;
const FIRESTORE_EMULATOR_URL = `http://${EMULATOR_HOST}:${FIRESTORE_EMULATOR_PORT}`;

// 테스트 계정 (Auth 에뮬레이터에 google.com 제공자로 미리 생성)
const TEST_USER = {
  sub: 'yeflix-e2e-user',
  email: 'yeflix.e2e@example.com',
  displayName: '예플릭스 테스터',
  photoUrl: 'https://image.tmdb.org/t/p/w45/e2e-profile.png',
};

// 일기를 이미 작성해 둔 영화
const DIARY_MOVIE = {
  id: 550,
  title: '파이트 클럽',
  originalTitle: 'Fight Club',
  posterPath: '/fight-club-poster.jpg',
};

// 찜(볼영화) 목록에 들어 있는 영화
const WATCHLIST_MOVIE = {
  id: 27205,
  title: '인셉션',
  originalTitle: 'Inception',
  posterPath: '/inception-poster.jpg',
};

// 미리 작성돼 있어야 하는 일기 내용
const SEEDED_DIARY = {
  rating: 5,
  watchedDate: '2026-09-01',
  content: '첫 관람 때보다 엔딩이 훨씬 무겁게 느껴졌다. 타일러의 대사를 다시 곱씹게 된다.',
  tags: ['명작', '반전', '재관람'],
};

module.exports = {
  EMULATOR_HOST,
  AUTH_EMULATOR_PORT,
  FIRESTORE_EMULATOR_PORT,
  AUTH_EMULATOR_URL,
  FIRESTORE_EMULATOR_URL,
  FIREBASE_PROJECT_ID,
  APP_PORT,
  BASE_URL,
  TEST_USER,
  DIARY_MOVIE,
  WATCHLIST_MOVIE,
  SEEDED_DIARY,
};
