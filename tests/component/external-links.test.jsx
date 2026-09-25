/** @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRequire } from 'node:module';
import BookLinks from '../../src/components/BookLinks';
import WatchProviders from '../../src/components/WatchProviders';

// e2e 헬퍼는 CommonJS 라 require 로 읽는다
const require_ = createRequire(import.meta.url);
const { EXTERNAL_HOSTS } = require_('../../e2e/helpers/tmdb-mock.js');

const ISBN = '9788937460449';
const BOOK_TITLE = '데미안';
const DAUM_BOOK_URL = 'https://search.daum.net/search?w=bookpage&bookId=1467038';

const hrefs = (container) =>
  Array.from(container.querySelectorAll('a[href]')).map((a) => a.getAttribute('href'));

/* -------------------------------- 서점 링크 ------------------------------- */

describe('BookLinks', () => {
  it('ISBN 으로 서점 · 도서관 검색 URL 을 만든다', () => {
    const { container } = render(<BookLinks isbn={ISBN} title={BOOK_TITLE} />);
    const urls = hrefs(container);

    expect(urls).toContain(`https://search.kyobobook.co.kr/search?keyword=${ISBN}`);
    expect(urls).toContain(`https://www.yes24.com/product/search?domain=BOOK&query=${ISBN}`);
    expect(urls).toContain(
      `https://www.aladin.co.kr/search/wsearchresult.aspx?SearchWord=${ISBN}`
    );
    expect(urls).toContain(
      `https://www.nl.go.kr/NL/contents/search.do?srchTarget=total&kwd=${ISBN}`
    );
  });

  // 전자책 플랫폼은 ISBN 검색이 잘 먹지 않아 제목으로 보낸다
  it('전자책은 제목으로 보내고 한글을 인코딩한다', () => {
    const { container } = render(<BookLinks isbn={ISBN} title={BOOK_TITLE} />);
    const urls = hrefs(container);
    const encoded = encodeURIComponent(BOOK_TITLE);

    expect(urls).toContain(`https://www.millie.co.kr/v3/search?keyword=${encoded}`);
    expect(urls).toContain(`https://ridibooks.com/search?q=${encoded}`);
    expect(encoded).not.toBe(BOOK_TITLE);
  });

  // 밀리의 서재는 SPA 라 /search 가 404 다
  it('밀리의 서재는 /v3/search 경로를 쓴다', () => {
    const { container } = render(<BookLinks isbn={ISBN} title={BOOK_TITLE} />);
    const millie = hrefs(container).find((u) => u.includes('millie.co.kr'));

    expect(millie).toContain('/v3/search');
    expect(new URL(millie).pathname).toBe('/v3/search');
  });

  it('ISBN 이 없으면 서점 링크 없이 전자책만 남는다', () => {
    const { container } = render(<BookLinks title={BOOK_TITLE} />);
    const urls = hrefs(container);

    expect(urls.some((u) => u.includes('kyobobook'))).toBe(false);
    expect(urls.some((u) => u.includes('millie.co.kr'))).toBe(true);
  });

  it('detailUrl 이 있으면 다음 책 링크를 덧붙인다', () => {
    const { container } = render(
      <BookLinks isbn={ISBN} title={BOOK_TITLE} detailUrl={DAUM_BOOK_URL} />
    );

    expect(hrefs(container)).toContain(DAUM_BOOK_URL);
  });

  it('ISBN 도 제목도 없으면 안내 문구만 보여준다', () => {
    const { container } = render(<BookLinks />);

    expect(hrefs(container)).toHaveLength(0);
    expect(screen.getByText('구매처 정보를 찾을 수 없습니다.')).toBeInTheDocument();
  });

  it('모든 링크가 새 탭 + noopener 로 열린다', () => {
    const { container } = render(
      <BookLinks isbn={ISBN} title={BOOK_TITLE} detailUrl={DAUM_BOOK_URL} />
    );

    for (const a of container.querySelectorAll('a[href]')) {
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toContain('noopener');
    }
  });
});

/* --------------------------------- OTT 링크 -------------------------------- */

const provider = (id, name) => ({ provider_id: id, provider_name: name, logo_path: `/${id}.jpg` });

const ALL_PROVIDERS = {
  flatrate: [
    provider(8, 'Netflix'),
    provider(97, 'Watcha'),
    provider(356, 'wavve'),
    provider(127, 'TVING'),
    provider(1096, 'TVING'),
    provider(464, 'Coupang Play'),
    provider(337, 'Disney Plus'),
    provider(350, 'Apple TV Plus'),
  ],
  rent: [provider(119, 'Amazon Prime Video')],
  buy: [provider(522, 'Seezn')],
  link: 'https://www.themoviedb.org/movie/550/watch',
};

describe('WatchProviders', () => {
  const TITLE = '파이트 클럽';

  it('플랫폼별 검색 URL 로 보낸다', () => {
    const { container } = render(<WatchProviders providers={ALL_PROVIDERS} title={TITLE} />);
    const urls = hrefs(container);
    const encoded = encodeURIComponent(TITLE);

    expect(urls).toContain(`https://www.netflix.com/search?q=${encoded}`);
    expect(urls).toContain(`https://watcha.com/search?query=${encoded}`);
    expect(urls).toContain(`https://www.wavve.com/search?keyword=${encoded}`);
    expect(urls).toContain(`https://www.tving.com/search?keyword=${encoded}`);
    expect(urls).toContain(`https://www.coupangplay.com/search?keyword=${encoded}`);
    expect(urls).toContain(`https://www.disneyplus.com/search?q=${encoded}`);
    expect(urls).toContain(`https://tv.apple.com/search?term=${encoded}`);
    expect(urls).toContain(`https://www.primevideo.com/search?phrase=${encoded}`);
    expect(urls).toContain(`https://www.seezn.com/search?keyword=${encoded}`);
  });

  it('구독 · 렌탈 · 구매 세 묶음을 모두 그린다', () => {
    render(<WatchProviders providers={ALL_PROVIDERS} title={TITLE} />);

    expect(screen.getByText('구독')).toBeInTheDocument();
    expect(screen.getByText('렌탈')).toBeInTheDocument();
    expect(screen.getByText('구매')).toBeInTheDocument();
  });

  it('모르는 플랫폼은 TMDB 보러가기 링크로 폴백한다', () => {
    const { container } = render(
      <WatchProviders
        providers={{ flatrate: [provider(9999, '처음 보는 OTT')], link: ALL_PROVIDERS.link }}
        title={TITLE}
      />
    );

    expect(hrefs(container)).toEqual([ALL_PROVIDERS.link]);
  });

  it('제공자 정보가 없으면 안내 문구만 보여준다', () => {
    render(<WatchProviders providers={null} title={TITLE} />);
    expect(screen.getByText('국내 스트리밍 서비스 정보가 없습니다.')).toBeInTheDocument();
  });

  it('국내 이용 가능한 곳이 없으면 그렇게 알려준다', () => {
    render(<WatchProviders providers={{ flatrate: [], rent: [], buy: [] }} title={TITLE} />);
    expect(
      screen.getByText('현재 국내에서 이용 가능한 스트리밍 서비스가 없습니다.')
    ).toBeInTheDocument();
  });
});

/* ----------------------- E2E 목킹 호스트와 대조 (규칙 #6) ---------------------- */

// 외부 링크를 추가하고 e2e/helpers/tmdb-mock.js 의 EXTERNAL_HOSTS 에 넣지 않으면
// E2E 가 실제 사이트로 네트워크 요청을 보낸다. 그 누락을 여기서 먼저 잡는다.
describe('E2E 목킹 누락 감시', () => {
  const renderedHosts = () => {
    const { container: books } = render(
      <BookLinks isbn={ISBN} title={BOOK_TITLE} detailUrl={DAUM_BOOK_URL} />
    );
    const { container: ott } = render(
      <WatchProviders providers={ALL_PROVIDERS} title="파이트 클럽" />
    );

    return [...new Set([...hrefs(books), ...hrefs(ott)].map((u) => new URL(u).host))];
  };

  it('앱이 만드는 모든 외부 링크 호스트가 EXTERNAL_HOSTS 에 있다', () => {
    const missing = renderedHosts().filter((host) => !EXTERNAL_HOSTS.includes(host));

    expect(
      missing,
      `e2e/helpers/tmdb-mock.js 의 EXTERNAL_HOSTS 에 다음 호스트를 추가하세요: ${missing.join(', ')}`
    ).toEqual([]);
  });

  it('EXTERNAL_HOSTS 에 중복이 없다', () => {
    expect(EXTERNAL_HOSTS).toHaveLength(new Set(EXTERNAL_HOSTS).size);
  });
});
