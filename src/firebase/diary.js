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

const COLLECTION = 'diaries';

// 일기 저장 (신규 or 수정)
export const saveDiary = async (userId, mediaType, itemId, data) => {
  const id = docKey(userId, mediaType, itemId);
  const ref = doc(db, COLLECTION, id);
  await setDoc(ref, {
    ...data,
    userId,
    mediaType,
    itemId: coerceId(mediaType, itemId),
    updatedAt: serverTimestamp(),
    createdAt: data.createdAt ?? serverTimestamp(),
  });
  return id;
};

// 특정 작품의 내 일기 가져오기
export const getDiary = async (userId, mediaType, itemId) => {
  const ref = doc(db, COLLECTION, docKey(userId, mediaType, itemId));
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// 내 모든 일기 가져오기 (최신순 - 클라이언트 정렬로 복합 인덱스 불필요)
export const getMyDiaries = async (userId) => {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return docs.sort((a, b) => (b.updatedAt?.seconds ?? 0) - (a.updatedAt?.seconds ?? 0));
};

// 일기 삭제
export const deleteDiary = async (userId, mediaType, itemId) => {
  await deleteDoc(doc(db, COLLECTION, docKey(userId, mediaType, itemId)));
};

// 내가 일기 쓴 작품 키 목록 ("movie:550" 형태)
export const getMyMediaKeys = async (userId) => {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  return new Set(snap.docs.map((d) => {
    const data = d.data();
    return mediaKey(data.mediaType, data.itemId);
  }));
};
