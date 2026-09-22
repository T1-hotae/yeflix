const { defineConfig, devices } = require('@playwright/test');
const {
  BASE_URL,
  APP_PORT,
  AUTH_EMULATOR_URL,
  EMULATOR_HOST,
  AUTH_EMULATOR_PORT,
  FIRESTORE_EMULATOR_PORT,
  FIREBASE_PROJECT_ID,
} = require('./e2e/helpers/constants');

const CI = !!process.env.CI;

// next dev 에 넘길 환경변수.
// Next.js는 이미 설정된 process.env 값을 .env 파일로 덮어쓰지 않으므로,
// 개발자의 실제 Firebase/TMDB 키 대신 에뮬레이터용 값이 사용됩니다.
const appEnv = {
  ...process.env,
  NEXT_PUBLIC_USE_FIREBASE_EMULATOR: '1',
  NEXT_PUBLIC_FIREBASE_EMULATOR_HOST: EMULATOR_HOST,
  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT: String(AUTH_EMULATOR_PORT),
  NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT: String(FIRESTORE_EMULATOR_PORT),
  NEXT_PUBLIC_FIREBASE_API_KEY: 'fake-api-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: `${FIREBASE_PROJECT_ID}.firebaseapp.com`,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: `${FIREBASE_PROJECT_ID}.appspot.com`,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:e2e',
  NEXT_PUBLIC_TMDB_API_KEY: 'e2e-mocked-key',
  KAKAO_REST_API_KEY: 'e2e-mocked-key',
};

module.exports = defineConfig({
  testDir: './e2e',
  globalSetup: require.resolve('./e2e/global-setup'),

  // 에뮬레이터 데이터를 공유하므로 직렬 실행
  fullyParallel: false,
  workers: 1,

  forbidOnly: CI,
  retries: CI ? 1 : 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },

  reporter: CI ? [['list'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      // Auth + Firestore 에뮬레이터
      command: `npx firebase emulators:start --project ${FIREBASE_PROJECT_ID} --only auth,firestore`,
      url: AUTH_EMULATOR_URL,
      reuseExistingServer: !CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: `npx next dev --hostname ${EMULATOR_HOST} --port ${APP_PORT}`,
      url: BASE_URL,
      env: appEnv,
      reuseExistingServer: false,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
