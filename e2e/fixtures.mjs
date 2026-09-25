// 모든 스펙이 공유하는 Playwright 픽스처.
//  - 외부 네트워크(TMDB/이미지/OTT) 목킹을 컨텍스트에 자동 적용
//  - global-setup이 심어 둔 시드 정보(uid)를 주입

import { test as base, expect } from '@playwright/test';
import { mockExternalRequests } from './helpers/tmdb-mock.mjs';
import { readSeed } from './helpers/seed-state.mjs';

export const test = base.extend({
  context: async ({ context }, use) => {
    await mockExternalRequests(context);
    await use(context);
  },

  seed: async ({}, use) => {
    await use(readSeed());
  },
});

export { expect };
