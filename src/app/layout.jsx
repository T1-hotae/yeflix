import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import {
  SITE_NAME,
  SITE_URL,
  SITE_TAGLINE,
  SITE_DESCRIPTION,
  OG_IMAGE,
} from '../lib/site';

export const metadata = {
  // 상대 경로 OG 이미지·canonical 을 절대 URL 로 바꿔주는 기준점
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'Yeflix',
    '영화 일기',
    '드라마 기록',
    '독서 기록',
    '감상 기록',
    '별점 기록',
    '왓챠 대신',
    'OTT 어디서 볼까',
    '볼 영화 목록',
  ],
  authors: [{ name: 'HwangHotae', url: 'https://github.com/T1-hotae' }],
  creator: 'HwangHotae',
  category: 'entertainment',
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'ko_KR',
    url: '/',
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  // 모바일 사파리가 숫자를 전화번호로 오인해 링크 거는 것 방지 (별점·연도·ISBN)
  formatDetection: { telephone: false, email: false, address: false },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: 'black-translucent',
  },
};

export const viewport = {
  themeColor: '#0d0d0d',
  colorScheme: 'dark',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-cinema-gold focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
          >
            본문 바로가기
          </a>
          <div className="min-h-screen bg-cinema-bg">
            <Navbar />
            <main id="main-content">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
