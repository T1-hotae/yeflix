import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // .env 에는 실제 키가 들어 있다. tests/ 에는 .env 파일이 없으므로
  // 이 디렉터리를 envDir 로 지정해 테스트가 실제 키를 읽지 못하게 막는다.
  envDir: './tests',

  test: {
    globals: true,
    // 기본은 node (Response / fetch 등 Node 전역이 필요한 테스트가 많다).
    // DOM 이 필요한 파일은 맨 위에 /** @vitest-environment jsdom */ 을 붙인다.
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/api/**', 'src/firebase/**', 'src/components/**'],
      exclude: ['src/app/**'],
    },
  },
});
