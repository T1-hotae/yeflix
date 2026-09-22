import { readFileSync } from 'node:fs';

// 앱 버전은 package.json 하나만 고치면 설정 화면까지 반영됩니다.
const { version } = JSON.parse(readFileSync('./package.json', 'utf8'));

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
