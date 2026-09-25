import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { docKey, mediaKey, coerceId } from '../lib/media';

const COLLECTION = 'watchlist';

// itemData: { title, poster } - poster는 TMDB 경로 또는 책 표지 절대 URL
export const addToWatchlist = async (userId, mediaType, itemId, itemData) => {
  const id = docKey(userId, mediaType, itemId);
  await setDoc(doc(db, COLLECTION, id), {
    userId,
    mediaType,
    itemId: coerceId(mediaType, itemId),
    title: itemData.title,
    poster: itemData.poster ?? null,
    addedAt: serverTimestamp(),
  });
};

export const removeFromWatchlist = async (userId, mediaType, itemId) => {
  await deleteDoc(doc(db, COLLECTION, docKey(userId, mediaType, itemId)));
};

export const isInWatchlist = async (userId, mediaType, itemId) => {
  const snap = await getDoc(doc(db, COLLECTION, docKey(userId, mediaType, itemId)));
  return snap.exists();
};

// 전체 찜 목록 (타입별 필터는 화면에서 - 복합 인덱스 회피)
export const getWatchlist = async (userId) => {
  const q = query(collection(db, COLLECTION), where('userId', '==', userId));
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return docs.sort((a, b) => (b.addedAt?.seconds ?? 0) - (a.addedAt?.seconds ?? 0));
};

// 찜한 작품 키 목록 ("tv:1399" 형태)
export const getWatchlistKeys = async (userId) => {
  const q = query(collection(db, COLLECTION), where('userId', '==', userId));
  const snap = await getDocs(q);
  return new Set(snap.docs.map((d) => {
    const data = d.data();
    return mediaKey(data.mediaType, data.itemId);
  }));
};
