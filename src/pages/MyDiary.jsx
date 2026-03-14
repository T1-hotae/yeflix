import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Film, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyDiaries } from '../firebase/diary';
import { getPosterUrl } from '../api/tmdb';
import StarRating from '../components/StarRating';

export default function MyDiary() {
  const { user, loginWithGoogle } = useAuth();
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    getMyDiaries(user.uid)
      .then(setDiaries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = filter === 'all' ? diaries : diaries.filter((d) => d.rating === Number(filter));

  if (!user) {
    return (
      <div className="min-h-screen bg-cinema-bg flex items-center justify-center">
        <div className="text-center">
          <BookOpen size={48} className="text-cinema-muted mx-auto mb-4 opacity-40" />
          <p className="text-white font-semibold text-lg mb-2">내 영화 일기장</p>
          <p className="text-cinema-muted mb-6">로그인 후 일기를 확인할 수 있습니다.</p>
          <button onClick={loginWithGoogle} className="bg-white text-gray-900 font-semibold px-6 py-2.5 rounded-full hover:bg-gray-100 transition text-sm">
            Google로 로그인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cinema-bg">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen size={22} /> 내 영화 일기
            </h1>
            <p className="text-cinema-muted text-sm mt-1">총 {diaries.length}편의 영화를 기록했습니다.</p>
          </div>
          <div className="flex gap-1.5">
            {['all', '5', '4', '3', '2', '1'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  filter === f
                    ? 'bg-cinema-gold text-white border-cinema-gold font-bold'
                    : 'border-white/10 text-cinema-muted hover:border-white/30'
                }`}
              >
                {f === 'all' ? '전체' : `★${f}`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="text-cinema-gold animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Film size={48} className="text-cinema-muted mx-auto mb-4 opacity-40" />
            <p className="text-cinema-muted">
              {filter === 'all' ? '아직 작성된 일기가 없습니다.' : '해당 별점의 일기가 없습니다.'}
            </p>
            {filter === 'all' && (
              <Link to="/" className="inline-block mt-4 bg-cinema-gold text-white font-semibold px-6 py-2.5 rounded-full hover:opacity-90 transition text-sm">
                영화 둘러보기
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((diary) => (
              <div
                key={diary.id}
                onClick={() => navigate(`/movie/${diary.movieId}`)}
                className="flex gap-4 bg-cinema-card rounded-2xl p-4 border border-white/5 hover:border-white/10 cursor-pointer transition group"
              >
                <div className="w-16 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-cinema-surface">
                  {diary.moviePoster ? (
                    <img src={getPosterUrl(diary.moviePoster, 'w92')} alt={diary.movieTitle} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-cinema-muted">
                      <Film size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-white font-semibold group-hover:text-cinema-gold transition line-clamp-1">{diary.movieTitle}</h3>
                    <StarRating value={diary.rating} readonly size="sm" />
                  </div>
                  <p className="text-cinema-muted text-xs mt-1">{diary.watchedDate} 관람</p>
                  {diary.content && (
                    <p className="text-gray-400 text-sm mt-2 line-clamp-2 leading-relaxed">{diary.content}</p>
                  )}
                  {diary.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {diary.tags.slice(0, 5).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-cinema-gold/10 text-cinema-gold/80">#{tag}</span>
                      ))}
                      {diary.tags.length > 5 && <span className="text-xs text-cinema-muted">+{diary.tags.length - 5}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
