"use client";

import Link from "next/link";
import { Film, Tv, BookOpen, PenLine, Bookmark } from "lucide-react";
import { getPosterUrl, formatRating } from "../api/tmdb";
import { detailHref } from "../lib/media";

const FALLBACK_ICON = { movie: Film, tv: Tv, book: BookOpen };

// item: { mediaType, id, title, poster, subtitle, rating }
export default function MediaCard({ item, hasDiary = false, hasWatchlist = false }) {
  const poster = getPosterUrl(item.poster);
  const FallbackIcon = FALLBACK_ICON[item.mediaType] ?? Film;

  const meta = (
    <>
      {item.rating > 0 && (
        <span className="text-yellow-400 text-xs">★ {formatRating(item.rating)}</span>
      )}
      {item.subtitle && (
        <span className="text-cinema-muted text-xs line-clamp-1">{item.subtitle}</span>
      )}
    </>
  );

  return (
    <Link
      href={detailHref(item.mediaType, item.id)}
      className="group relative block rounded-xl overflow-hidden bg-cinema-card hover:scale-[1.03] transition-transform duration-200 shadow-lg"
    >
      <div className="aspect-[2/3] overflow-hidden bg-cinema-surface">
        {poster ? (
          <img
            src={poster}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-cinema-muted">
            <FallbackIcon size={40} />
          </div>
        )}
      </div>

      {hasDiary && (
        <span className="absolute top-2 right-2 bg-cinema-gold/90 text-white p-1 rounded-full shadow">
          <PenLine size={11} />
        </span>
      )}
      {!hasDiary && hasWatchlist && (
        <span className="absolute top-2 right-2 bg-blue-500/90 text-white p-1 rounded-full shadow">
          <Bookmark size={11} fill="white" />
        </span>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm leading-tight line-clamp-2">
            {item.title}
          </p>
          <div className="flex items-center gap-2 mt-1 min-w-0">{meta}</div>
        </div>
      </div>

      <div className="p-2">
        <p className="text-white text-xs font-medium line-clamp-1">{item.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5 min-w-0">{meta}</div>
      </div>
    </Link>
  );
}
