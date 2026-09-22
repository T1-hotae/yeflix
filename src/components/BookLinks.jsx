'use client';

import { ExternalLink } from 'lucide-react';

// ISBN13 기반 서점/도서관 검색 링크
// 책은 제공자 API가 없어서 TMDB watch/providers 대신 결정적인 검색 URL을 만든다.
const BY_ISBN = [
  {
    group: '구매',
    links: [
      { name: '교보문고', ring: 'hover:ring-emerald-400', url: (isbn) => `https://search.kyobobook.co.kr/search?keyword=${isbn}` },
      { name: '예스24', ring: 'hover:ring-blue-400', url: (isbn) => `https://www.yes24.com/product/search?domain=BOOK&query=${isbn}` },
      { name: '알라딘', ring: 'hover:ring-sky-400', url: (isbn) => `https://www.aladin.co.kr/search/wsearchresult.aspx?SearchWord=${isbn}` },
    ],
  },
  {
    group: '도서관',
    links: [
      { name: '국립중앙도서관', ring: 'hover:ring-amber-400', url: (isbn) => `https://www.nl.go.kr/NL/contents/search.do?srchTarget=total&kwd=${isbn}` },
    ],
  },
];

// 전자책 플랫폼은 ISBN 검색이 잘 먹지 않아 제목으로 보낸다
// 밀리의 서재는 SPA라 검색 경로가 /v3/search 다 (/search 는 404).
const BY_TITLE = [
  { name: '밀리의 서재', ring: 'hover:ring-purple-400', url: (t) => `https://www.millie.co.kr/v3/search?keyword=${encodeURIComponent(t)}` },
  { name: '리디', ring: 'hover:ring-cyan-400', url: (t) => `https://ridibooks.com/search?q=${encodeURIComponent(t)}` },
];

function LinkButton({ name, href, ring }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`${name}에서 찾기`}
      className={`group flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cinema-card border border-white/20 ring-2 ring-transparent ${ring} transition-all duration-150 shadow-lg`}
    >
      <span className="text-sm text-white font-medium">{name}</span>
      <ExternalLink size={13} className="text-cinema-muted group-hover:text-white transition" />
    </a>
  );
}

export default function BookLinks({ isbn, title, detailUrl }) {
  if (!isbn && !title) {
    return <p className="text-cinema-muted text-sm py-2">구매처 정보를 찾을 수 없습니다.</p>;
  }

  return (
    <div className="space-y-4">
      {isbn && BY_ISBN.map(({ group, links }) => (
        <div key={group}>
          <p className="text-xs text-cinema-muted mb-3 uppercase tracking-wider font-semibold">{group}</p>
          <div className="flex flex-wrap gap-2.5">
            {links.map((l) => (
              <LinkButton key={l.name} name={l.name} href={l.url(isbn)} ring={l.ring} />
            ))}
          </div>
        </div>
      ))}

      {title && (
        <div>
          <p className="text-xs text-cinema-muted mb-3 uppercase tracking-wider font-semibold">전자책</p>
          <div className="flex flex-wrap gap-2.5">
            {BY_TITLE.map((l) => (
              <LinkButton key={l.name} name={l.name} href={l.url(title)} ring={l.ring} />
            ))}
          </div>
        </div>
      )}

      {detailUrl && (
        <div>
          <p className="text-xs text-cinema-muted mb-3 uppercase tracking-wider font-semibold">책 정보</p>
          <div className="flex flex-wrap gap-2.5">
            <LinkButton name="다음 책" href={detailUrl} ring="hover:ring-yellow-400" />
          </div>
        </div>
      )}
    </div>
  );
}
