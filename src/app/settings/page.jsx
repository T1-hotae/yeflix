"use client";

import { useRouter } from "next/navigation";
import { LogOut, ChevronLeft, Globe, Moon, Info } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Settings() {
  const { user, loginWithGoogle, logout } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <div className="min-h-screen bg-cinema-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-cinema-muted mb-4">로그인이 필요합니다.</p>
          <button
            onClick={loginWithGoogle}
            className="bg-white text-gray-900 font-semibold px-6 py-2.5 rounded-full text-sm"
          >
            Google로 로그인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cinema-bg">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="text-cinema-muted hover:text-white transition"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-2xl font-bold text-white">설정</h1>
        </div>

        {/* 프로필 */}
        <div className="bg-cinema-card rounded-2xl p-6 border border-white/5 mb-4">
          <p className="text-xs text-cinema-muted uppercase tracking-wider font-semibold mb-4">
            내 계정
          </p>
          <div className="flex items-center gap-4">
            <img
              src={user.photoURL}
              alt="프로필"
              className="w-16 h-16 rounded-full border-2 border-cinema-gold/30"
            />
            <div>
              <p className="text-white font-semibold text-lg">
                {user.displayName}
              </p>
              <p className="text-cinema-muted text-sm">{user.email}</p>
            </div>
          </div>
        </div>

        {/* 앱 설정 */}
        <div className="bg-cinema-card rounded-2xl border border-white/5 mb-4 overflow-hidden">
          <p className="text-xs text-cinema-muted uppercase tracking-wider font-semibold px-6 pt-5 pb-3">
            앱 설정
          </p>
          <SettingRow icon={<Globe size={16} />} label="언어" value="한국어" />
          <SettingRow
            icon={<Moon size={16} />}
            label="테마"
            value="다크 모드"
          />
        </div>

        {/* 정보 */}
        <div className="bg-cinema-card rounded-2xl border border-white/5 mb-6 overflow-hidden">
          <p className="text-xs text-cinema-muted uppercase tracking-wider font-semibold px-6 pt-5 pb-3">
            정보
          </p>
          <SettingRow icon={<Info size={16} />} label="버전" value="1.0.0" />
          <SettingRow
            icon={<Info size={16} />}
            label="영화 데이터"
            value="TMDB 제공"
          />
          <SettingRow
            icon={<Info size={16} />}
            label="스트리밍 정보"
            value="JustWatch 제공"
          />
        </div>

        {/* 로그아웃 */}
        <button
          onClick={async () => {
            await logout();
            router.push("/");
          }}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-cinema-gold/30 text-cinema-gold hover:bg-cinema-gold/10 transition font-semibold text-sm"
        >
          <LogOut size={16} /> 로그아웃
        </button>
      </div>
    </div>
  );
}

function SettingRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between px-6 py-3.5 border-t border-white/5 first:border-0 opacity-60">
      <div className="flex items-center gap-2.5 text-white text-sm">
        <span className="text-cinema-muted">{icon}</span>
        {label}
      </div>
      <span className="text-cinema-muted text-sm">{value}</span>
    </div>
  );
}
