import React from 'react';
import { Volume2, VolumeX, Sparkles, Award } from 'lucide-react';
import { REALMS } from '../types';

interface TopBarProps {
  playerName: string;
  realmIndex: number;
  score: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenLeaderboard?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  playerName,
  realmIndex,
  score,
  soundEnabled,
  onToggleSound,
  onOpenLeaderboard,
}) => {
  const currentRealm = REALMS[realmIndex] || 'Luyện Khí';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-amber-500/30 text-white shadow-md">
      <div className="max-w-4xl mx-auto px-3.5 sm:px-6 h-14 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-sm shadow-amber-400/20">
            ☯
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-black tracking-tight text-amber-300 truncate">
              TU TIÊN TOÁN HỌC
            </h1>
            <p className="text-[10px] text-slate-400 truncate hidden xs:block">
              Đại Năng Trương Anh Toàn
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
              <span className="text-amber-400 font-medium">{currentRealm}</span>
            </div>
          )}

          {/* Tu vi score */}
          <div className="flex items-center gap-1 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-full text-amber-300 text-xs font-bold tabular-nums">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{score}</span>
            <span className="text-[10px] font-normal text-amber-400/80">pt</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors active:scale-95"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Leaderboard Trigger if available */}
          {onOpenLeaderboard && (
            <button
              onClick={onOpenLeaderboard}
              aria-label="Bảng phong thần"
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 hover:text-amber-300 flex items-center justify-center transition-colors active:scale-95"
              title="Bảng phong thần"
            >
              <Award className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
