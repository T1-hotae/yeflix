// 테스트 실행 전 에뮬레이터를 초기화하고, "이미 사용해 온 사용자" 상태를 만들어 둡니다.
//  - google.com 계정 1개
//  - 작성해 둔 일기 1건 (파이트 클럽) — mediaType 없는 레거시 문서
//  - 찜해 둔 영화 1건 (인셉션) — mediaType 없는 레거시 문서
//  - 찜해 둔 드라마 1건 (이상한 변호사 우영우)
//  - 찜해 둔 책 1권 (데미안)

const {
  resetEmulators,
  createGoogleUser,
  seedDiary,
  seedWatchlistItem,
  seedWatchlistMedia,
} = require('./helpers/emulator');
const { writeSeed } = require('./helpers/seed-state');
const {
  TEST_USER,
  DIARY_MOVIE,
  WATCHLIST_MOVIE,
  WATCHLIST_TV,
  WATCHLIST_BOOK,
  SEEDED_DIARY,
} = require('./helpers/constants');

module.exports = async function globalSetup() {
  await resetEmulators();

  const uid = await createGoogleUser(TEST_USER);

  await seedDiary(uid, DIARY_MOVIE, SEEDED_DIARY);
  await seedWatchlistItem(uid, WATCHLIST_MOVIE);
  await seedWatchlistMedia(uid, 'tv', WATCHLIST_TV);
  await seedWatchlistMedia(uid, 'book', WATCHLIST_BOOK);

  writeSeed({ uid, email: TEST_USER.email });

  console.log(`[e2e] 시드 완료 — uid=${uid}, 일기 1건, 찜 3건(영화/드라마/책)`);
};
