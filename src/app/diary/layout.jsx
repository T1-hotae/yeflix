// 로그인한 본인의 기록만 보이는 페이지라 색인은 막고 제목만 준다.
export const metadata = {
  title: '내 감상 일기',
  description: '지금까지 남긴 영화 · 드라마 · 책 감상을 한곳에서 모아 봅니다.',
  alternates: { canonical: '/diary' },
  robots: { index: false, follow: true },
};

export default function DiaryLayout({ children }) {
  return children;
}
