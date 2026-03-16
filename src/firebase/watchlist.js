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

const COLLECTION = 'watchlist';

export const addToWatchlist = async (userId, movieId, movieData) => {
  const id = `${userId}_${movieId}`;
  await setDoc(doc(db, COLLECTION, id), {
    userId,
    movieId: Number(movieId),
    movieTitle: movieData.title,
    moviePoster: movieData.poster_path,
    addedAt: serverTimestamp(),
  });
};

export const removeFromWatchlist = async (userId, movieId) => {
  await deleteDoc(doc(db, COLLECTION, `${userId}_${movieId}`));
};

export const isInWatchlist = async (userId, movieId) => {
  const snap = await getDoc(doc(db, COLLECTION, `${userId}_${movieId}`));
  return snap.exists();
};

export const getWatchlist = async (userId) => {
  const q = query(collection(db, COLLECTION), where('userId', '==', userId));
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return docs.sort((a, b) => (b.addedAt?.seconds ?? 0) - (a.addedAt?.seconds ?? 0));
};

export const getWatchlistMovieIds = async (userId) => {
  const q = query(collection(db, COLLECTION), where('userId', '==', userId));
  const snap = await getDocs(q);
  return new Set(snap.docs.map((d) => d.data().movieId));
};
