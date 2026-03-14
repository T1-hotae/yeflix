import { ExternalLink } from 'lucide-react';
import { LOGO_BASE } from '../api/tmdb';

// provider_id → 플랫폼 직접 검색 URL
// TMDB 공식 provider_id 기준 (KR 기준 주요 서비스)
const DIRECT_URL = {
  8:   (t) => `https://www.netflix.com/search?q=${encodeURIComponent(t)}`,
  97:  (t) => `https://watcha.com/search?query=${encodeURIComponent(t)}`,
  356: (t) => `https://www.wavve.com/search?keyword=${encodeURIComponent(t)}`,
  127: (t) => `https://www.tving.com/search?keyword=${encodeURIComponent(t)}`,
  464: (t) => `https://www.coupangplay.com/search?keyword=${encodeURIComponent(t)}`,
  337: (t) => `https://www.disneyplus.com/search?q=${encodeURIComponent(t)}`,
  350: (t) => `https://tv.apple.com/search?term=${encodeURIComponent(t)}`,
  119: (t) => `https://www.primevideo.com/search?phrase=${encodeURIComponent(t)}`,
  522: (t) => `https://www.seezn.com/search?keyword=${encodeURIComponent(t)}`,
};

// 플랫폼별 hover 링 색상
const RING_COLOR = {
  Netflix:             'hover:ring-red-500',
  Watcha:              'hover:ring-rose-400',
  wavve:               'hover:ring-blue-400',
  TVING:               'hover:ring-red-600',
  'Coupang Play':      'hover:ring-yellow-400',
  'Disney Plus':       'hover:ring-blue-600',
  'Apple TV Plus':     'hover:ring-gray-300',
  'Amazon Prime Video':'hover:ring-cyan-400',
};

function ProviderButton({ provider, movieTitle, fallbackLink }) {
  const getUrl = DIRECT_URL[provider.provider_id];
  const href = getUrl ? getUrl(movieTitle) : fallbackLink;
  const ringClass = RING_COLOR[provider.provider_name] ?? 'hover:ring-white/40';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`${provider.provider_name}에서 보기`}
      className="flex flex-col items-center gap-1.5 group"
    >
      <div className={`relative w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-transparent ${ringClass} transition-all duration-150 shadow-lg`}>
        <img
          src={`${LOGO_BASE}${provider.logo_path}`}
          alt={provider.provider_name}
          className="w-full h-full object-cover"
        />
        {/* hover 시 외부링크 오버레이 */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
          <ExternalLink size={16} className="text-white" />
        </div>
      </div>
      <span className="text-xs text-cinema-muted group-hover:text-white transition text-center leading-tight">
        {provider.provider_name.replace(' Plus', '+').replace('Amazon Prime Video', 'Prime')}
      </span>
    </a>
  );
}

export default function WatchProviders({ providers, movieTitle }) {
  if (!providers) {
    return <p className="text-cinema-muted text-sm py-2">국내 스트리밍 서비스 정보가 없습니다.</p>;
  }

  const { flatrate, rent, buy, link } = providers;
  const hasAny = flatrate?.length || rent?.length || buy?.length;

  if (!hasAny) {
    return <p className="text-cinema-muted text-sm py-2">현재 국내에서 이용 가능한 스트리밍 서비스가 없습니다.</p>;
  }

  const title = movieTitle ?? '';

  return (
    <div className="space-y-4">
      {flatrate?.length > 0 && (
        <div>
          <p className="text-xs text-cinema-muted mb-3 uppercase tracking-wider font-semibold">구독</p>
          <div className="flex flex-wrap gap-3">
            {flatrate.map((p) => (
              <ProviderButton key={p.provider_id} provider={p} movieTitle={title} fallbackLink={link} />
            ))}
          </div>
        </div>
      )}

      {rent?.length > 0 && (
        <div>
          <p className="text-xs text-cinema-muted mb-3 uppercase tracking-wider font-semibold">렌탈</p>
          <div className="flex flex-wrap gap-3">
            {rent.map((p) => (
              <ProviderButton key={p.provider_id} provider={p} movieTitle={title} fallbackLink={link} />
            ))}
          </div>
        </div>
      )}

      {buy?.length > 0 && (
        <div>
          <p className="text-xs text-cinema-muted mb-3 uppercase tracking-wider font-semibold">구매</p>
          <div className="flex flex-wrap gap-3">
            {buy.map((p) => (
              <ProviderButton key={p.provider_id} provider={p} movieTitle={title} fallbackLink={link} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
