import '@testing-library/jest-dom/vitest';

// 테스트는 .env 를 읽지 않는다 (vitest.config.mjs 의 envDir 참고).
// 모듈 로드 시점에 키를 읽는 코드가 있어서 가짜 값을 미리 넣어 둔다.
process.env.NEXT_PUBLIC_TMDB_API_KEY ??= 'test-tmdb-key';
process.env.KAKAO_REST_API_KEY ??= 'test-kakao-key';
process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??= 'test-firebase-key';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??= 'demo-yeflix';
