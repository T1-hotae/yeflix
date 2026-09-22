'use client';

// icon: lucide 컴포넌트 (예: Bookmark)
export default function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className="text-center py-20">
      {Icon && <Icon size={48} className="text-cinema-muted mx-auto mb-4 opacity-40" />}
      {title && <p className="text-white font-semibold text-lg mb-2">{title}</p>}
      {description && <p className="text-cinema-muted mb-6">{description}</p>}
      {children}
    </div>
  );
}
