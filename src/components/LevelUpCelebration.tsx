import React, { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { ChapterId } from '../types';

export interface LevelUpEvent {
  chapter: ChapterId;
  title: string;
  subtitle: string;
  badge: string;
  auraGained: number;
}

interface LevelUpCelebrationProps {
  event: LevelUpEvent | null;
  onClose: () => void;
}

export const LevelUpCelebration: React.FC<LevelUpCelebrationProps> = ({ event, onClose }) => {
  useEffect(() => {
    if (!event) return;
    const timer = setTimeout(() => {
      onClose();
    }, 2400);
    return () => clearTimeout(timer);
  }, [event, onClose]);

  if (!event) return null;

  const isChap1 = event.chapter === 1;

  return (
    <aside
      role="status"
      aria-live="polite"
      onClick={onClose}
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto cursor-pointer animate-in fade-in zoom-in-95 duration-300 select-none max-w-[90vw]"
    >
      {/* Outer ambient radiant shockwave */}
      <div
        className={`absolute -inset-2 rounded-2xl blur-xl opacity-75 animate-pulse ${
          isChap1
            ? 'bg-gradient-to-r from-cyan-500/40 via-amber-400/40 to-cyan-500/40'
            : 'bg-gradient-to-r from-amber-400/50 via-purple-500/40 to-amber-300/50'
        }`}
      />

      {/* Main Banner Card */}
      <div
        className={`relative flex items-center gap-3.5 px-5 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl ${
          isChap1
            ? 'bg-slate-950/90 border-cyan-400/60 shadow-cyan-500/20 text-slate-100'
            : 'bg-slate-950/90 border-amber-400/70 shadow-amber-500/25 text-slate-100'
        }`}
      >
        {/* Emblem icon with ping ring */}
        <div className="relative shrink-0 flex items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full animate-ping opacity-60 ${
              isChap1 ? 'bg-cyan-400' : 'bg-amber-400'
            }`}
          />
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl font-black shadow-md border ${
              isChap1
                ? 'bg-gradient-to-tr from-cyan-500 to-amber-300 border-cyan-300 text-slate-950'
                : 'bg-gradient-to-tr from-amber-400 to-amber-200 border-amber-300 text-slate-950'
            }`}
          >
            {isChap1 ? '🗿' : '☯'}
          </div>
        </div>

        {/* Text descriptions */}
        <div className="flex flex-col min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-black uppercase tracking-widest ${
                isChap1 ? 'text-cyan-300' : 'text-amber-300'
              }`}
            >
              {event.title}
            </span>
            <Sparkles
              className={`w-3.5 h-3.5 animate-spin ${
                isChap1 ? 'text-cyan-300' : 'text-amber-300'
              }`}
              style={{ animationDuration: '4s' }}
            />
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-base sm:text-lg font-black text-white tracking-wide truncate">
              {event.badge}
            </span>
            <span className="text-xs font-bold text-amber-400 bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-full whitespace-nowrap">
              +{event.auraGained} aura
            </span>
          </div>

          <p className="text-[11px] text-slate-300 truncate max-w-[260px] sm:max-w-xs mt-0.5">
            {event.subtitle}
          </p>
        </div>
      </div>
    </aside>
  );
};
