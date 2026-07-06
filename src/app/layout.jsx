import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Yeflix',
  description: '나만의 영화 일기장',
  icons: { icon: '/assets/yeflix.png' },
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
