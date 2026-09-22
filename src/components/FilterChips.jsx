'use client';

// 검색 타입 / 일기 종류 등에서 공통으로 쓰는 알약 필터
// options: [{ value, label, count? }]
export default function FilterChips({ options, value, onChange, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`text-xs px-4 py-1.5 rounded-full border transition ${
              active
                ? 'bg-cinema-gold text-white border-cinema-gold font-bold'
                : 'border-white/10 text-cinema-muted hover:border-white/30'
            }`}
          >
            {option.label}
            {option.count > 0 && (
              <span className={`ml-1.5 ${active ? 'text-white/70' : 'text-cinema-muted/70'}`}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
