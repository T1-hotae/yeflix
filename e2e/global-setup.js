// 테스트 실행 전 에뮬레이터를 초기화하고, "이미 사용해 온 사용자" 상태를 만들어 둡니다.
//  - google.com 계정 1개
//  - 작성해 둔 일기 1건 (파이트 클럽)
//  - 찜해 둔 영화 1건 (인셉션)

const {
  resetEmulators,
  createGoogleUser,
  seedDiary,
  seedWatchlistItem,
} = require('./helpers/emulator');
const { writeSeed } = require('./helpers/seed-state');
const {
  TEST_USER,
  DIARY_MOVIE,
  WATCHLIST_MOVIE,
  SEEDED_DIARY,
} = require('./helpers/constants');

module.exports = async function globalSetup() {
  await resetEmulators();

  const uid = await createGoogleUser(TEST_USER);

  await seedDiary(uid, DIARY_MOVIE, SEEDED_DIARY);
  await seedWatchlistItem(uid, WATCHLIST_MOVIE);

  writeSeed({ uid, email: TEST_USER.email });

  console.log(`[e2e] 시드 완료 — uid=${uid}, 일기 1건, 찜 1건`);
};
