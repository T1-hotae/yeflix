// 카카오(Daum) 책 검색 API 프록시
// REST 키를 브라우저에 노출하지 않기 위해 서버에서만 호출한다.
// 참고: 네이버 책 검색 API(2026-07-31)와 알라딘 OpenAPI(2026-10-30)는 종료되어
//       현재 사용할 수 있는 국내 도서 검색 API는 카카오뿐이다.

const KAKAO_URL = 'https://dapi.kakao.com/v3/search/book';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.trim();

  if (!query) {
    return Response.json({ documents: [], meta: { is_end: true } });
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    console.error('KAKAO_REST_API_KEY가 설정되지 않았습니다.');
    return Response.json({ error: 'missing_api_key' }, { status: 500 });
  }

  const url = new URL(KAKAO_URL);
  url.searchParams.set('query', query);
  url.searchParams.set('size', '20');
  url.searchParams.set('page', searchParams.get('page') ?? '1');

  // 상세 조회는 target=isbn 으로 정확히 한 권만 찾는다
  const target = searchParams.get('target');
  if (target) url.searchParams.set('target', target);

  try {
    const res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${apiKey}` },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error(`Kakao Book API Error: ${res.status}`);
      return Response.json({ error: 'kakao_error' }, { status: res.status });
    }

    return Response.json(await res.json());
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'fetch_failed' }, { status: 502 });
  }
}
