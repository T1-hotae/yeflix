// Firebase 에뮬레이터를 REST API로 제어하는 헬퍼.
// (Auth / Firestore 에뮬레이터는 인증 없이 조작할 수 있는 관리용 엔드포인트를 제공합니다)

import {
  AUTH_EMULATOR_URL,
  FIRESTORE_EMULATOR_URL,
  FIREBASE_PROJECT_ID,
} from './constants.mjs';

const DOCS_BASE = `${FIRESTORE_EMULATOR_URL}/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

async function request(url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      // 에뮬레이터에서 보안 규칙을 우회하는 관리자 토큰
      Authorization: 'Bearer owner',
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${init.method ?? 'GET'} ${url} → ${res.status}\n${text}`);
  }
  return text ? JSON.parse(text) : null;
}

/** Auth / Firestore 에뮬레이터의 모든 데이터를 비웁니다. */
export async function resetEmulators() {
  await request(
    `${AUTH_EMULATOR_URL}/emulator/v1/projects/${FIREBASE_PROJECT_ID}/accounts`,
    { method: 'DELETE' },
  );
  await request(
    `${FIRESTORE_EMULATOR_URL}/emulator/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' },
  );
}

/**
 * google.com 제공자로 로그인한 계정을 미리 만들어 둡니다.
 * 이렇게 만들어 둔 계정은 Auth 에뮬레이터 로그인 팝업의 계정 목록에 노출되므로,
 * 테스트에서 실제 로그인 버튼 → 팝업 → 계정 선택 흐름을 그대로 탈 수 있습니다.
 *
 * @returns {Promise<string>} 생성된 계정의 uid(localId)
 */
export async function createGoogleUser(user) {
  const idToken = JSON.stringify({
    sub: user.sub,
    email: user.email,
    email_verified: true,
    name: user.displayName,
    picture: user.photoUrl,
  });

  const data = await request(
    `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=fake-api-key`,
    {
      method: 'POST',
      body: JSON.stringify({
        postBody: `id_token=${idToken}&providerId=google.com`,
        requestUri: 'http://localhost',
        returnIdpCredential: true,
        returnSecureToken: true,
      }),
    },
  );

  return data.localId;
}

// --- Firestore 값 타입 변환 -------------------------------------------------

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'object') {
    return { mapValue: { fields: toFirestoreFields(value) } };
  }
  return { stringValue: String(value) };
}

function toFirestoreFields(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, toFirestoreValue(v)]),
  );
}

/** 지정한 문서 ID로 Firestore 문서를 씁니다. */
export async function setDocument(collection, docId, data) {
  await request(`${DOCS_BASE}/${collection}/${encodeURIComponent(docId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });
}

/** 앱의 saveDiary()와 동일한 문서 구조로 일기를 심습니다. */
export async function seedDiary(uid, movie, diary) {
  await setDocument('diaries', `${uid}_movie_${movie.id}`, {
    userId: uid,
    mediaType: 'movie',
    itemId: movie.id,
    title: movie.title,
    poster: movie.posterPath,
    rating: diary.rating,
    content: diary.content,
    tags: diary.tags,
    watchedDate: diary.watchedDate,
    createdAt: new Date('2026-09-01T12:00:00Z'),
    updatedAt: new Date('2026-09-01T12:00:00Z'),
  });
}

/** 앱의 addToWatchlist()와 동일한 문서 구조로 영화 찜을 심습니다. */
export async function seedWatchlistItem(uid, movie) {
  await seedWatchlistMedia(uid, 'movie', movie);
}

/** 찜 문서 하나. 문서 ID는 타입에 예외 없이 {uid}_{mediaType}_{itemId} 입니다. */
export async function seedWatchlistMedia(uid, mediaType, item) {
  const itemId = mediaType === 'book' ? item.isbn : item.id;
  await setDocument('watchlist', `${uid}_${mediaType}_${itemId}`, {
    userId: uid,
    mediaType,
    itemId,
    title: item.title,
    poster: mediaType === 'book' ? item.thumbnail : item.posterPath,
    addedAt: new Date('2026-09-11T12:00:00Z'),
  });
}
