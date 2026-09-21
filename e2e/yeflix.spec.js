// Yeflix 핵심 사용자 여정 E2E
//  1. 로그인한다
//  2. "내 일기"에 그동안 작성했던 일기가 뜬다
//  3. "볼영화"에 찜해 둔 영화가 뜬다
//  4. 일기를 누르면 내가 기록했던 내용을 볼 수 있다
//  5. "보러가기"를 누르면 해당 플랫폼 검색 페이지로 이동한다

const { test, expect } = require('./fixtures');
const { loginWithGoogle, openUserMenu } = require('./helpers/login');
const {
  TEST_USER,
  DIARY_MOVIE,
  WATCHLIST_MOVIE,
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

  await expect(page.getByRole('heading', { name: /내 영화 일기/ })).toBeVisible();
  await expect(page.getByText('총 1편의 영화를 기록했습니다.')).toBeVisible();

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
