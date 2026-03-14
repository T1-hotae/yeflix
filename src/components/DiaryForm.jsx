import { useState } from 'react';
import { Tag, X, Plus } from 'lucide-react';
import StarRating from './StarRating';

const PRESET_TAGS = ['감동적', '재미있음', '무서움', '지루함', '명작', 'OST최고', '반전있음', '또보고싶어', '눈물남', '생각할거리'];

export default function DiaryForm({ initial = null, onSave, onDelete, loading }) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [content, setContent] = useState(initial?.content ?? '');
  const [tags, setTags] = useState(initial?.tags ?? []);
  const [watchedDate, setWatchedDate] = useState(
    initial?.watchedDate ?? new Date().toISOString().slice(0, 10)
  );
  const [tagInput, setTagInput] = useState('');

  const toggleTag = (tag) =>
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  const addCustomTag = (e) => {
    e?.preventDefault();
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !tags.includes(t) && tags.length < 10) setTags((prev) => [...prev, t]);
    setTagInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) { alert('별점을 선택해주세요.'); return; }
    onSave({ rating, content, tags, watchedDate });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 관람일 */}
      <div>
        <label className="block text-sm text-cinema-muted mb-1.5 font-medium">관람일</label>
        <input
          type="date"
          value={watchedDate}
          onChange={(e) => setWatchedDate(e.target.value)}
          className="bg-cinema-surface text-white text-sm px-3 py-2 rounded-lg border border-white/10 focus:border-cinema-gold/50 outline-none transition"
        />
      </div>

      {/* 별점 */}
      <div>
        <label className="block text-sm text-cinema-muted mb-2 font-medium">내 별점</label>
        <StarRating value={rating} onChange={setRating} size="lg" />
        {rating > 0 && (
          <p className="text-cinema-gold text-sm mt-1">
            {['', '별로예요', '그저 그래요', '괜찮아요', '좋았어요', '최고예요!'][rating]}
          </p>
        )}
      </div>

      {/* 감상평 */}
      <div>
        <label className="block text-sm text-cinema-muted mb-1.5 font-medium">감상평</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="이 영화에 대한 솔직한 감상을 적어보세요..."
          rows={5}
          className="w-full bg-cinema-surface text-white text-sm px-4 py-3 rounded-xl border border-white/10 focus:border-cinema-gold/50 outline-none transition resize-none placeholder-cinema-muted"
        />
        <p className="text-xs text-cinema-muted text-right mt-1">{content.length}자</p>
      </div>

      {/* 태그 */}
      <div>
        <label className="flex items-center gap-1.5 text-sm text-cinema-muted mb-2 font-medium">
          <Tag size={13} /> 태그
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {PRESET_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`text-xs px-3 py-1 rounded-full border transition ${
                tags.includes(tag)
                  ? 'bg-cinema-gold/20 border-cinema-gold text-cinema-gold'
                  : 'bg-white/5 border-white/10 text-cinema-muted hover:border-white/30'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>

        {tags.filter((t) => !PRESET_TAGS.includes(t)).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-cinema-accent/20 border border-cinema-accent/40 text-cinema-accent mr-2 mb-2"
          >
            #{tag}
            <button type="button" onClick={() => toggleTag(tag)}>
              <X size={12} />
            </button>
          </span>
        ))}

        <div className="flex gap-2 mt-1">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomTag(e)}
            placeholder="#직접입력"
            className="flex-1 bg-cinema-surface text-white text-sm px-3 py-2 rounded-lg border border-white/10 focus:border-cinema-gold/50 outline-none transition placeholder-cinema-muted"
          />
          <button
            type="button"
            onClick={addCustomTag}
            className="flex items-center gap-1 text-sm px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
          >
            <Plus size={14} /> 추가
          </button>
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-cinema-gold text-white font-bold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? '저장 중...' : initial ? '수정하기' : '일기 저장'}
        </button>
        {initial && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={loading}
            className="px-5 py-3 rounded-xl border border-cinema-accent/40 text-cinema-accent hover:bg-cinema-accent/10 transition text-sm font-medium"
          >
            삭제
          </button>
        )}
      </div>
    </form>
  );
}
