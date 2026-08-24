import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Yeflix',
  description: '나만의 영화 일기장',
  applicationName: 'Yeflix',
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
    title: 'Yeflix',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport = {
  themeColor: '#0d0d0d',
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
