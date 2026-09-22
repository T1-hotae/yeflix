'use client';

export const GRID_CLASS =
  'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4';

export function GridSkeleton({ count = 12 }) {
  return (
    <div className={GRID_CLASS}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-[2/3] rounded-xl bg-cinema-card animate-pulse" />
      ))}
    </div>
  );
}

export default function MediaGrid({ children }) {
  return <div className={GRID_CLASS}>{children}</div>;
}
