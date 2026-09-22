// Yeflix 핵심 사용자 여정 E2E
//  1. 로그인한다
//  2. "내 일기"에 그동안 작성했던 일기가 뜬다
//  3. "볼영화"에 찜해 둔 영화가 뜬다
//  4. 일기를 누르면 내가 기록했던 내용을 볼 수 있다
//  5. "보러가기"를 누르면 해당 플랫폼 검색 페이지로 이동한다
//  6~8. 볼영화 / 볼드라마 / 볼책 탭과 각 상세 페이지
//  9~12. 타입별 검색 필터, 책 구매 링크, 일기 종류 필터, 책 일기 저장

const { test, expect } = require('./fixtures');
const { loginWithGoogle, openUserMenu } = require('./helpers/login');
const { seedWatchlistMedia } = require('./helpers/emulator');
const {
  TEST_USER,
  DIARY_MOVIE,
  WATCHLIST_MOVIE,
  WATCHLIST_TV,
  WATCHLIST_BOOK,
  SEEDED_DIARY,
} = require('./helpers/constants');

const NETFLIX_SEARCH_URL = `https://www.netflix.com/search?q=${encodeURIComponent(
  DIARY_MOVIE.title,
)}`;

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await loginWithGoogle(page);
});

test('1. Google 계정으로 로그인하면 헤더에 내 계정 정보가 표시된다', async ({ page }) => {
  await page.getByRole('button', { name: '사용자 메뉴' }).click();

  const menu = page.getByRole('menu', { name: '사용자 메뉴' });
  await expect(menu.getByText(TEST_USER.displayName)).toBeVisible();
  await expect(menu.getByText(TEST_USER.email)).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: '로그아웃' })).toBeVisible();
});

test('2. "내 일기"에 그동안 작성한 일기가 표시된다', async ({ page }) => {
  await openUserMenu(page, '내 일기');

  const diaryTab = page.getByRole('button', { name: /^내 일기/ });
  await expect(diaryTab).toContainText('1');

  const card = page.locator('div.group', { hasText: DIARY_MOVIE.title }).first();
  await expect(card).toBeVisible();
  await expect(card).toContainText(SEEDED_DIARY.watchedDate);
  // 별점 5점 → ★ 5개
  await expect(card.getByText('★★★★★')).toBeVisible();

  // 빈 상태 문구가 남아 있지 않아야 한다
  await expect(page.getByText('아직 일기가 없어요')).toHaveCount(0);
});

test('2-1. /diary 페이지에서도 작성한 일기를 확인할 수 있다', async ({ page }) => {
  await page.goto('/diary');

  await expect(page.getByRole('heading', { name: /내 기록/ })).toBeVisible();
  await expect(page.getByText('총 1편을 기록했습니다.')).toBeVisible();

  const row = page.locator('div.group', { hasText: DIARY_MOVIE.title }).first();
  await expect(row).toContainText(SEEDED_DIARY.content);
  for (const tag of SEEDED_DIARY.tags) {
    await expect(row.getByText(`#${tag}`)).toBeVisible();
  }
});

test('3. "볼영화"에 찜해 둔 영화가 표시된다', async ({ page }) => {
  await openUserMenu(page, '볼영화');

  const watchlistTab = page.getByRole('button', { name: /^볼영화/ });
  await expect(watchlistTab).toContainText('1');

  const card = page
    .locator('div.group', { hasText: WATCHLIST_MOVIE.title })
    .first();
  await expect(card).toBeVisible();
  await expect(card).toContainText('볼 예정');
  await expect(card.getByRole('button', { name: '찜 취소' })).toBeVisible();

  await expect(page.getByText('찜한 영화가 없어요')).toHaveCount(0);
});

test('4. 일기를 누르면 내가 기록했던 내용을 볼 수 있다', async ({ page }) => {
  await openUserMenu(page, '내 일기');

  await page
    .locator('div.group', { hasText: DIARY_MOVIE.title })
    .first()
    .click();

  await expect(page).toHaveURL(new RegExp(`/movie/${DIARY_MOVIE.id}$`));
  await expect(
    page.getByRole('heading', { name: DIARY_MOVIE.title, level: 1 }),
  ).toBeVisible();

  const diarySection = page.locator('div', { has: page.getByRole('heading', { name: '내 감상 일기' }) }).last();

  await expect(diarySection.getByText(SEEDED_DIARY.content)).toBeVisible();
  await expect(
    diarySection.getByText(`${SEEDED_DIARY.watchedDate} 관람`),
  ).toBeVisible();

  for (const tag of SEEDED_DIARY.tags) {
    await expect(diarySection.getByText(`#${tag}`)).toBeVisible();
  }

  // 별점 5점이 모두 채워져 있어야 한다
  for (let star = 1; star <= SEEDED_DIARY.rating; star += 1) {
    await expect(
      diarySection.getByRole('button', { name: `${star}점` }),
    ).toHaveAttribute('aria-pressed', 'true');
  }

  // 이미 작성한 일기이므로 작성 폼이 아니라 "수정" 버튼이 보인다
  await expect(page.getByRole('button', { name: '수정' })).toBeVisible();
});

test('5. "보러가기"에서 플랫폼을 누르면 해당 플랫폼 검색 결과로 이동한다', async ({
  page,
  context,
}) => {
  await page.goto(`/movie/${DIARY_MOVIE.id}`);

  await expect(page.getByText('보러가기')).toBeVisible();

  const netflix = page.locator('a[title="Netflix에서 보기"]');
  await expect(netflix).toBeVisible();

  // 링크 자체가 영화 제목으로 검색하는 URL이어야 한다
  await expect(netflix).toHaveAttribute('href', NETFLIX_SEARCH_URL);
  await expect(netflix).toHaveAttribute('target', '_blank');

  // 실제로 눌렀을 때 새 탭이 해당 검색 URL로 열리는지 확인
  const [ottTab] = await Promise.all([
    context.waitForEvent('page'),
    netflix.click(),
  ]);
  await ottTab.waitForLoadState('domcontentloaded');

  expect(ottTab.url()).toBe(NETFLIX_SEARCH_URL);
  expect(decodeURIComponent(ottTab.url())).toContain(DIARY_MOVIE.title);

  await ottTab.close();

  // 왓챠 링크도 동일하게 제목 검색으로 연결된다
  await expect(page.locator('a[title="Watcha에서 보기"]')).toHaveAttribute(
    'href',
    `https://watcha.com/search?query=${encodeURIComponent(DIARY_MOVIE.title)}`,
  );
});

test('6. 홈 탭은 내 일기 / 볼영화 / 볼드라마 / 볼책 네 개다', async ({ page }) => {
  for (const label of ['내 일기', '볼영화', '볼드라마', '볼책']) {
    await expect(
      page.getByRole('button', { name: new RegExp(`^${label}`) }),
    ).toBeVisible();
  }

  // "현재 상영 중" 탭은 제거됐다
  await expect(page.getByRole('button', { name: /현재 상영/ })).toHaveCount(0);
});

test('7. "볼드라마"에 찜해 둔 드라마가 뜨고 드라마 상세로 이동한다', async ({ page }) => {
  await page.getByRole('button', { name: /^볼드라마/ }).click();

  const card = page.locator('div.group', { hasText: WATCHLIST_TV.title }).first();
  await expect(card).toBeVisible();
  await expect(card).toContainText('볼 예정');

  await card.getByRole('link').first().click();

  await expect(page).toHaveURL(new RegExp(`/tv/${WATCHLIST_TV.id}$`));
  await expect(
    page.getByRole('heading', { name: WATCHLIST_TV.title, level: 1 }),
  ).toBeVisible();
  // 드라마는 러닝타임 대신 시즌/회차가 보인다
  await expect(page.getByText('시즌 1 · 16부작')).toBeVisible();
});

test('8. "볼책"에 찜해 둔 책이 뜨고 책 상세로 이동한다', async ({ page }) => {
  await page.getByRole('button', { name: /^볼책/ }).click();

  const card = page.locator('div.group', { hasText: WATCHLIST_BOOK.title }).first();
  await expect(card).toBeVisible();
  await expect(card).toContainText('읽을 예정');

  await card.getByRole('link').first().click();

  await expect(page).toHaveURL(new RegExp(`/book/${WATCHLIST_BOOK.isbn}$`));
  await expect(
    page.getByRole('heading', { name: WATCHLIST_BOOK.title, level: 1 }),
  ).toBeVisible();
  await expect(page.getByText(WATCHLIST_BOOK.publisher)).toBeVisible();
});

test('9. 검색 필터를 드라마로 바꾸면 드라마가 검색된다', async ({ page }) => {
  await page.goto(`/?search=${encodeURIComponent('우영우')}&type=tv`);

  await expect(page.getByRole('button', { name: '드라마' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  const card = page.getByRole('link', { name: new RegExp(WATCHLIST_TV.title) }).first();
  await expect(card).toBeVisible();
  await card.click();

  await expect(page).toHaveURL(new RegExp(`/tv/${WATCHLIST_TV.id}$`));

  // 드라마도 영화와 동일하게 "보러가기"가 동작한다
  await expect(page.locator('a[title="Netflix에서 보기"]')).toHaveAttribute(
    'href',
    `https://www.netflix.com/search?q=${encodeURIComponent(WATCHLIST_TV.title)}`,
  );
});

test('10. 책을 검색해 상세로 들어가면 ISBN으로 서점에 연결된다', async ({ page }) => {
  await page.goto(`/?search=${encodeURIComponent('데미안')}&type=book`);

  await expect(page.getByRole('button', { name: '책' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  const card = page.getByRole('link', { name: new RegExp(WATCHLIST_BOOK.title) }).first();
  await expect(card).toBeVisible();
  await card.click();

  await expect(page).toHaveURL(new RegExp(`/book/${WATCHLIST_BOOK.isbn}$`));
  await expect(page.getByText('보러가기')).toBeVisible();

  await expect(page.locator('a[title="교보문고에서 찾기"]')).toHaveAttribute(
    'href',
    `https://search.kyobobook.co.kr/search?keyword=${WATCHLIST_BOOK.isbn}`,
  );
  await expect(page.locator('a[title="예스24에서 찾기"]')).toHaveAttribute(
    'href',
    `https://www.yes24.com/product/search?domain=BOOK&query=${WATCHLIST_BOOK.isbn}`,
  );
});

test('11. "내 일기"를 종류별로 필터링할 수 있다', async ({ page }) => {
  await openUserMenu(page, '내 일기');

  const diaryCard = page.locator('div.group', { hasText: DIARY_MOVIE.title }).first();
  await expect(diaryCard).toBeVisible();

  // 전체 / 영화 / 드라마 / 책 칩이 보이고, 기본값은 "전체"
  await expect(page.getByRole('button', { name: /^전체/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // 영화로 좁혀도 일기(파이트 클럽)는 그대로 보인다
  await page.getByRole('button', { name: /^영화/ }).click();
  await expect(diaryCard).toBeVisible();

  // 책 일기는 아직 없으므로 빈 상태가 뜬다
  await page.getByRole('button', { name: /^책/ }).click();
  await expect(page.getByText('책 일기가 없어요')).toBeVisible();
  await expect(page.locator('div.group', { hasText: DIARY_MOVIE.title })).toHaveCount(0);

  // 다시 전체로 돌리면 원래대로
  await page.getByRole('button', { name: /^전체/ }).click();
  await expect(diaryCard).toBeVisible();
});

test('12. 책에 일기를 저장하면 찜이 풀리고 "내 일기"에 나타난다', async ({ page, seed }) => {
  // confirm() 대화상자는 항상 수락 (일기 삭제 정리용)
  page.on('dialog', (dialog) => dialog.accept());

  await page.goto(`/book/${WATCHLIST_BOOK.isbn}`);

  await page.getByRole('button', { name: '5점' }).click();
  await page.locator('textarea').fill('싱클레어의 성장 서사가 오래 남는다.');
  await page.getByRole('button', { name: '일기 저장' }).click();

  // 저장되면 읽기 모드로 바뀌고 "수정" 버튼이 나타난다
  await expect(page.getByRole('button', { name: '수정' })).toBeVisible();
  await expect(page.getByText(/독서$/)).toBeVisible();

  // 일기를 쓰면 찜 목록에서 자동으로 빠진다
  await page.goto('/');
  await page.getByRole('button', { name: /^볼책/ }).click();
  await expect(page.getByText('찜한 책이 없어요')).toBeVisible();

  await page.getByRole('button', { name: /^내 일기/ }).click();
  await expect(
    page.locator('div.group', { hasText: WATCHLIST_BOOK.title }).first(),
  ).toBeVisible();

  // --- 뒷정리: 다른 테스트가 재시도될 때를 대비해 시드 상태로 되돌린다
  await page.goto(`/book/${WATCHLIST_BOOK.isbn}`);
  await page.getByRole('button', { name: '수정' }).click();
  await page.getByRole('button', { name: '삭제' }).click();
  await expect(page.getByRole('button', { name: '일기 저장' })).toBeVisible();
  await seedWatchlistMedia(seed.uid, 'book', WATCHLIST_BOOK);
});
