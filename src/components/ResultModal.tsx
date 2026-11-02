import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Swords,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Timer,
  Zap,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { MathText } from './MathText';
import { ChapterId } from '../types';
import { playCriticalStrikeSound, triggerHaptic } from '../utils/audio';

export type ResultType = 'correct' | 'wrong' | 'timeout';

export interface ResultModalProps {
  isOpen: boolean;
  result: ResultType;
  chapter: ChapterId;
  stageNumber: number;
  stageTitle?: string;
  feedbackText: string;
  auraGained?: number;
  realmName?: string;
  nextRealmName?: string;
  correctAnswerText?: string;
  soundEnabled?: boolean;
  onNext: () => void;
  onClose: () => void;
  isLastQuestion?: boolean;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  isOpen,
  result,
  chapter,
  stageNumber,
  stageTitle,
  feedbackText,
  auraGained = 10,
  realmName,
  nextRealmName,
  correctAnswerText,
  soundEnabled = true,
  onNext,
  onClose,
  isLastQuestion = false,
}) => {
  const [animKey, setAnimKey] = useState(0);

  // Trigger critical strike SFX and vibration on open when correct
  useEffect(() => {
    if (isOpen) {
      setAnimKey((prev) => prev + 1);
      if (result === 'correct') {
        playCriticalStrikeSound(soundEnabled);
        triggerHaptic();
      }
    }
  }, [isOpen, result, soundEnabled]);

  // Keyboard shortcut: Press Enter or Space to quickly advance
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onNext, onClose]);

  if (!isOpen) return null;

  const isCorrect = result === 'correct';
  const isTimeout = result === 'timeout';
  const isChap1 = chapter === 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200"
    >
      {/* Darkened backdrop with blur */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
      />

      {/* Main Modal Card */}
      <div
        key={animKey}
        className={`relative w-full max-w-lg sm:max-w-xl rounded-3xl p-5 sm:p-7 border shadow-2xl overflow-hidden backdrop-blur-2xl transition-all ${
          isCorrect
            ? 'animate-crit-impact-shake bg-slate-950/95 border-amber-400/80 shadow-[0_0_50px_rgba(245,158,11,0.35)] ring-2 ring-amber-400/30'
            : isTimeout
            ? 'bg-slate-950/95 border-rose-500/70 shadow-[0_0_35px_rgba(244,63,94,0.25)]'
            : 'bg-slate-950/95 border-rose-500/70 shadow-[0_0_35px_rgba(244,63,94,0.25)]'
        }`}
      >
        {/* ============================================================= */}
        {/* CRITICAL STRIKE ANIMATION OVERLAY (CÚ ĐÁNH CHÍ MẠNG)         */}
        {/* Activated when result === 'correct'                           */}
        {/* ============================================================= */}
        {isCorrect && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {/* 1. Diagonal Sword Slash Beam (Vết chém kiếm quang xé toạc) */}
            <div
              className="absolute -inset-10 animate-crit-slash flex items-center justify-center"
              style={{ transformOrigin: 'center center' }}
            >
              <div
                className="w-[140%] h-4 sm:h-6 rounded-full"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.95) 30%, #38bdf8 50%, #fbbf24 75%, transparent 100%)',
                  boxShadow:
                    '0 0 35px #fbbf24, 0 0 65px #38bdf8, 0 0 90px rgba(245, 158, 11, 0.9)',
                }}
              />
            </div>

            {/* 2. Expanding Shockwave Ring (Vòng sóng xung kích bộc phát) */}
            <div
              className="absolute top-1/3 left-1/2 rounded-full border-amber-300 animate-crit-shockwave"
              style={{
                width: '160px',
                height: '160px',
                borderColor: '#fbbf24',
                boxShadow: '0 0 30px #f59e0b, inset 0 0 20px #38bdf8',
              }}
            />

            {/* 3. Critical Sparks Erupting from Slash Impact Point */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className="absolute w-3 h-3 bg-amber-300 rounded-full shadow-[0_0_10px_#fbbf24] animate-crit-spark-1" />
              <span className="absolute w-2.5 h-2.5 bg-cyan-300 rounded-full shadow-[0_0_10px_#22d3ee] animate-crit-spark-2" />
              <span className="absolute w-3 h-3 bg-yellow-200 rounded-full shadow-[0_0_10px_#fef08a] animate-crit-spark-3" />
              <span className="absolute w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b] animate-crit-spark-4" />
            </div>

            {/* 4. Ambient Radiant Bloom */}
            <div className="absolute inset-0 bg-radial from-amber-400/15 via-transparent to-transparent opacity-80" />
          </div>
        )}

        {/* ============================================================= */}
        {/* HEADER / STAGE INFO                                          */}
        {/* ============================================================= */}
        <div className="relative z-10 flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-lg border shadow-sm ${
                isChap1
                  ? 'bg-cyan-950/70 border-cyan-400/50 text-cyan-300'
                  : 'bg-amber-950/70 border-amber-400/50 text-amber-300'
              }`}
            >
              {isChap1 ? '🏛️ DI TÍCH CỔ' : '☯ TU TIÊN GIỚI'} · ẢI {stageNumber < 10 ? `0${stageNumber}` : stageNumber}/10
            </span>
            {stageTitle && (
              <span className="text-xs text-slate-300 font-medium truncate max-w-[150px] sm:max-w-xs">
                {stageTitle}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors text-xs font-semibold"
          >
            Đóng ✕
          </button>
        </div>

        {/* ============================================================= */}
        {/* HERO / CRITICAL STRIKE CHARACTER VISUAL SPOTLIGHT            */}
        {/* ============================================================= */}
        {isCorrect ? (
          <div className="relative z-10 my-2 flex flex-col items-center text-center">
            {/* Animated Character Battling / Lunging (Cú đánh chí mạng của nhân vật) */}
            <div className="relative mb-3 flex items-center justify-center">
              {/* Outer Energy Aura */}
              <div className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-amber-500/30 via-yellow-400/20 to-cyan-400/30 blur-xl animate-pulse" />

              {/* Character Avatar with Attack Lunge Animation */}
              <div className="animate-crit-character relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-b from-amber-400/20 via-slate-900/90 to-slate-950 border-2 border-amber-400 flex items-center justify-center text-4xl sm:text-5xl shadow-[0_0_30px_rgba(245,158,11,0.6)]">
                {isChap1 ? '🗡️' : '⚔️'}
                {/* Martial slash badge icon */}
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border border-slate-950 text-slate-950 font-black flex items-center justify-center text-sm shadow-lg">
                  ⚡
                </div>
              </div>
            </div>

            {/* Explosive Critical Strike Badge */}
            <div className="animate-crit-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(251,191,36,0.8)] border border-yellow-200">
              <Flame className="w-4 h-4 fill-slate-950 animate-bounce" />
              <span>⚡ BẠO KÍCH CHÍ MẠNG! ⚡</span>
              <Swords className="w-4 h-4" />
            </div>

            {/* Floating Damage & Knowledge Numbers - well separated below the badge */}
            <div className="animate-crit-damage mt-5 sm:mt-6 mb-1.5 flex items-center justify-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 drop-shadow-[0_2px_10px_rgba(245,158,11,0.8)]">
                +{auraGained} AURA TRI THỨC!
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300">
                CHÍ MẠNG
              </span>
            </div>

            {/* Feedback message */}
            <p className="mt-2 text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed max-w-md px-2 drop-shadow-sm">
              {feedbackText}
            </p>

            {/* Advancement Realm / Seal info */}
            {chapter === 2 && nextRealmName && (
              <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-950/60 border border-purple-400/50 text-purple-200 text-xs">
                <span>Đột phá cảnh giới:</span>
                <span className="font-black text-amber-300">[{nextRealmName}]</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
              </div>
            )}
            {chapter === 1 && (
              <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-cyan-950/60 border border-cyan-400/50 text-cyan-200 text-xs">
                <span>Giải khai phong ấn:</span>
                <span className="font-black text-amber-300">Ải {stageNumber}/10 Hoàn Tất</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              </div>
            )}
          </div>
        ) : (
          /* Wrong or Timeout Feedback Layout */
          <div className="relative z-10 my-3 flex flex-col items-center text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-rose-950/60 border border-rose-500/60 flex items-center justify-center text-3xl sm:text-4xl shadow-lg mb-3">
              {isTimeout ? '⌛' : '🛡️'}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-black text-xs uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{isTimeout ? 'HẾT THỜI GIAN SUY NGHĨ' : 'CƠ QUAN PHÒNG THỦ'}</span>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-slate-200 max-w-md px-2 leading-relaxed">
              {feedbackText}
            </p>

            {correctAnswerText && (
              <div className="mt-3 w-full bg-slate-900/80 border border-slate-700/80 rounded-xl p-3 text-left">
                <span className="text-[11px] text-slate-400 block mb-1 font-medium">
                  Đáp án giải mã chính xác:
                </span>
                <div className="font-bold text-emerald-400 text-xs sm:text-sm">
                  <MathText text={correctAnswerText} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* ACTION CONTROLS                                               */}
        {/* ============================================================= */}
        <div className="relative z-10 mt-5 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700/70 bg-slate-900/70 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
          >
            Xem lại câu hỏi
          </button>

          <button
            type="button"
            autoFocus
            onClick={onNext}
            className={`w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 ${
              isCorrect
                ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 shadow-amber-400/30 hover:brightness-105'
                : 'bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 shadow-cyan-400/20 hover:brightness-105'
            }`}
          >
            <span>
              {isLastQuestion
                ? isChap1
                  ? 'Mở cánh cổng bí ẩn ➜'
                  : 'Hoàn tất độ kiếp ➜'
                : 'Tiếp tục thử thách tiếp theo ➜'}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
