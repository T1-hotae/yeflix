// Navbar의 "로그인" 버튼 → Google 팝업(Auth 에뮬레이터) → 계정 선택까지의 실제 흐름.

import { expect } from '@playwright/test';
import { TEST_USER } from './constants.mjs';

/**
 * 헤더의 로그인 버튼을 눌러 Google 계정으로 로그인합니다.
 * Auth 에뮬레이터는 실제 Google 대신 계정 선택 화면을 띄우고,
 * 그 외 앱 쪽 코드(signInWithPopup → onAuthStateChanged)는 운영과 동일하게 동작합니다.
 */
export async function loginWithGoogle(page) {
  const loginButton = page.getByRole('button', { name: '로그인', exact: true });
  await expect(loginButton).toBeVisible();

  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    loginButton.click(),
  ]);

  await popup.waitForLoadState('domcontentloaded');

  // 미리 만들어 둔 계정이 목록에 있으면 그대로 선택
  const existingAccount = popup
    .locator('.js-reuse-account, [data-testid="reuse-account"], li')
    .filter({ hasText: TEST_USER.email })
    .first();

  if (await existingAccount.count()) {
    await existingAccount.click();
  } else {
    // 목록에 없으면 새 계정 화면에서 동일한 정보로 로그인
    await popup.getByRole('button', { name: /add new account/i }).click();
    await popup.locator('#email-input').fill(TEST_USER.email);
    await popup.locator('#display-name-input').fill(TEST_USER.displayName);
    await popup.locator('#photo-url-input').fill(TEST_USER.photoUrl);
    await popup.getByRole('button', { name: /sign in with google\.com/i }).click();
  }

  await popup.waitForEvent('close');

  // 로그인이 반영되면 헤더가 프로필(사용자 메뉴) 버튼으로 바뀝니다.
  await expect(page.getByRole('button', { name: '사용자 메뉴' })).toBeVisible();
}

/** 헤더 프로필 드롭다운을 열고 메뉴 항목을 클릭합니다. */
export async function openUserMenu(page, itemName) {
  await page.getByRole('button', { name: '사용자 메뉴' }).click();

  const menu = page.getByRole('menu', { name: '사용자 메뉴' });
  await expect(menu).toBeVisible();
  await menu.getByRole('menuitem', { name: itemName }).click();
}
