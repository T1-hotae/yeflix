'use client';

import { useEffect, useState } from 'react';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '../firebase/watchlist';

// 상세 페이지 공용 찜 상태 (영화 / 드라마 / 책)
export default function useWatchlist(user, mediaType, itemId) {
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !itemId) { setInWatchlist(false); return; }
    isInWatchlist(user.uid, mediaType, itemId).then(setInWatchlist).catch(console.error);
  }, [user, mediaType, itemId]);

  // itemData: { title, poster }
  const toggle = async (itemData) => {
    if (!user || loading) return;
    setLoading(true);
    try {
      if (inWatchlist) {
        await removeFromWatchlist(user.uid, mediaType, itemId);
        setInWatchlist(false);
      } else {
        await addToWatchlist(user.uid, mediaType, itemId, itemData);
        setInWatchlist(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 일기를 저장하면 "볼 예정" 목록에서 자동으로 빼준다
  const removeIfPresent = async () => {
    if (!user || !inWatchlist) return;
    try {
      await removeFromWatchlist(user.uid, mediaType, itemId);
      setInWatchlist(false);
    } catch (err) {
      console.error(err);
    }
  };

  return { inWatchlist, loading, toggle, removeIfPresent };
}
