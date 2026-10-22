import React from 'react';
import { Volume2, VolumeX, Sparkles, Award } from 'lucide-react';
import { ChapterId, REALMS } from '../types';

interface TopBarProps {
  chapter: ChapterId;
  playerName: string;
  realmIndex?: number;
  chap1Seals?: number;
  score: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenLeaderboard?: () => void;
  onSwitchChapter?: (target: ChapterId) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  chapter,
  playerName,
  realmIndex = 0,
  chap1Seals = 0,
  score,
  soundEnabled,
  onToggleSound,
  onOpenLeaderboard,
  onSwitchChapter,
}) => {
  const currentRealm = REALMS[realmIndex] || 'Nhập Môn';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-amber-500/30 text-white shadow-md">
      <div className="max-w-4xl mx-auto px-3.5 sm:px-6 h-14 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-sm shadow-amber-400/20">
            {chapter === 1 ? '🗿' : '☯'}
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-black tracking-tight text-amber-300 truncate">
              {chapter === 1
                ? 'CHƯƠNG 1: THÁM HIỂM DI TÍCH CỔ'
                : 'CHƯƠNG 2: TIẾN VÀO TU TIÊN GIỚI'}
            </h1>
            <p className="text-[10px] text-slate-400 truncate hidden xs:block">
              Đại Giáo Chủ Trương Anh Toàn – 0329056500
            </p>
          </div>
        </div>

        {/* Right Info & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {playerName && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 rounded-full text-slate-300">
              <span className="font-semibold text-slate-200 truncate max-w-[100px]">
                {playerName}
              </span>
              <span className="text-slate-500">·</span>
              {chapter === 1 ? (
                <span className="text-amber-400 font-medium">
                  {chap1Seals}/10 Phong ấn
                </span>
              ) : (
                <span className="text-amber-400 font-medium">{currentRealm}</span>
              )}
            </div>
          )}

          {/* Chapter Quick Switch if callback provided */}
          {onSwitchChapter && (
            <div className="flex items-center bg-slate-950/70 p-0.5 rounded-lg border border-slate-800 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => onSwitchChapter(1)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  chapter === 1
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Chuyển sang Chương 1"
              >
                Chương 1
              </button>
              <button
                type="button"
                onClick={() => onSwitchChapter(2)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  chapter === 2
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Chuyển sang Chương 2"
              >
                Chương 2
              </button>
            </div>
          )}

          {/* Score point */}
          <div className="flex items-center gap-1 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-full text-amber-300 text-xs font-bold tabular-nums">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{score}</span>
            <span className="text-[10px] font-normal text-amber-400/80">aura</span>
          </div>

          {/* Sound & Music Toggle */}
          <button
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Tắt nhạc nền & âm thanh' : 'Bật nhạc nền & âm thanh'}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all active:scale-95 ${
              soundEnabled
                ? 'bg-amber-400/15 border-amber-400/50 text-amber-300 shadow-sm shadow-amber-400/20'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400'
            }`}
            title={soundEnabled ? 'Nhạc nền & Âm thanh: Đang bật' : 'Nhạc nền & Âm thanh: Đã tắt'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-300 animate-pulse" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Leaderboard Trigger if available */}
          {onOpenLeaderboard && (
            <button
              onClick={onOpenLeaderboard}
              aria-label="Bảng thành tích / Bảng phong thần"
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 hover:text-amber-300 flex items-center justify-center transition-colors active:scale-95"
              title="Bảng thành tích"
            >
              <Award className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
