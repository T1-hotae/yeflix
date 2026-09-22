'use client';

import { useEffect, useState } from 'react';
import { PenLine, ArrowLeft } from 'lucide-react';
import { saveDiary, getDiary, deleteDiary } from '../firebase/diary';
import { useAuth } from '../context/AuthContext';
import DiaryForm from './DiaryForm';
import StarRating from './StarRating';

const DATE_SUFFIX = { movie: '관람', tv: '시청', book: '독서' };

// 영화 / 드라마 / 책 상세 페이지가 공유하는 감상 일기 블록
// item: { title, poster }
// onSaved: 저장 성공 후 호출 (찜 목록에서 빼는 용도)
export default function MediaDiarySection({ mediaType, itemId, item, onSaved }) {
  const { user, loginWithGoogle } = useAuth();
  const [diary, setDiary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setDiary(null);
    setEditing(false);
    if (!user || !itemId) return;
    getDiary(user.uid, mediaType, itemId).then(setDiary).catch(console.error);
  }, [user, mediaType, itemId]);

  const handleSave = async (data) => {
    if (!user) return;
    setLoading(true);
    try {
      await saveDiary(user.uid, mediaType, itemId, {
        ...data,
        movieTitle: item.title,
        moviePoster: item.poster ?? null,
        createdAt: diary?.createdAt ?? null,
      });
      setDiary(await getDiary(user.uid, mediaType, itemId));
      setEditing(false);
      await onSaved?.();
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('일기를 삭제하시겠습니까?')) return;
    setLoading(true);
    try {
      await deleteDiary(user.uid, mediaType, itemId);
      setDiary(null);
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <PenLine size={20} /> 내 감상 일기
      </h2>

      {!user ? (
        <div className="bg-cinema-card rounded-2xl p-8 text-center border border-white/20">
          <p className="text-cinema-muted mb-4">로그인 후 감상 일기를 작성할 수 있습니다.</p>
          <button
            onClick={loginWithGoogle}
            className="bg-white text-gray-900 font-semibold px-6 py-2.5 rounded-full hover:bg-gray-100 transition text-sm"
          >
            Google로 로그인
          </button>
        </div>
      ) : diary && !editing ? (
        <div className="bg-cinema-card rounded-2xl p-6 border border-white/20 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <StarRating value={diary.rating} readonly size="md" />
              <p className="text-cinema-muted text-xs mt-1">
                {diary.watchedDate} {DATE_SUFFIX[mediaType] ?? '관람'}
              </p>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-cinema-muted hover:text-white transition px-3 py-1.5 rounded-lg border border-white/20 hover:border-white/30"
            >
              수정
            </button>
          </div>

          {diary.content && (
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{diary.content}</p>
          )}

          {diary.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {diary.tags.map((tag) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-cinema-gold/10 text-cinema-goldText border border-cinema-gold/20">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-cinema-card rounded-2xl p-6 border border-white/20">
          {diary && editing && (
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1 text-cinema-muted text-sm mb-4 hover:text-white transition"
            >
              <ArrowLeft size={14} /> 취소
            </button>
          )}
          <DiaryForm
            initial={diary}
            onSave={handleSave}
            onDelete={diary ? handleDelete : undefined}
            loading={loading}
            mediaType={mediaType}
          />
        </div>
      )}
    </div>
  );
}
