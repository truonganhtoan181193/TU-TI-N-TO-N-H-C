import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Swords,
  ChevronRight,
  CheckCircle2,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { MathText } from './MathText';
import { ChapterId } from '../types';
import { playCriticalStrikeSound, triggerHaptic } from '../utils/audio';

export type ResultType = 'correct' | 'wrong' | 'timeout';

/**
 * Animated counting component for Aura points
 * Smooth counting animation from 0 to target value with easing
 */
interface AnimatedAuraCounterProps {
  target: number;
  duration?: number;
}

export const AnimatedAuraCounter: React.FC<AnimatedAuraCounterProps> = ({
  target,
  duration = 850,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animFrame: number;

    const animate = (now: number) => {
      if (!startTimestamp) startTimestamp = now;
      const elapsed = now - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo for brisk initial acceleration and gentle, satisfying settling
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const val = Math.round(ease * target);
      setDisplayValue(val);

      if (progress < 1) {
        animFrame = requestAnimationFrame(animate);
      }
    };

    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [target, duration]);

  return (
    <span className="tabular-nums tracking-wide inline-block">
      +{displayValue}
    </span>
  );
};

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

  // Trigger sound effect and vibration on open when correct
  useEffect(() => {
    if (isOpen) {
      setAnimKey((prev) => prev + 1);
      if (result === 'correct') {
        playCriticalStrikeSound(soundEnabled);
        triggerHaptic();
      }
    }
  }, [isOpen, result, soundEnabled]);

  // Keyboard shortcut: Press Enter or Space to advance quickly
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
            ? isChap1
              ? 'animate-crit-impact-shake bg-slate-950/95 border-amber-400/80 shadow-[0_0_50px_rgba(245,158,11,0.35)] ring-2 ring-amber-400/30'
              : 'animate-crit-impact-shake bg-slate-950/95 border-purple-400/80 shadow-[0_0_50px_rgba(192,132,252,0.4)] ring-2 ring-purple-400/30'
            : isTimeout
            ? 'bg-slate-950/95 border-rose-500/70 shadow-[0_0_35px_rgba(244,63,94,0.25)]'
            : 'bg-slate-950/95 border-rose-500/70 shadow-[0_0_35px_rgba(244,63,94,0.25)]'
        }`}
      >
        {/* ============================================================= */}
        {/* ANIMATION OVERLAY FOR CORRECT ANSWER                          */}
        {/* Chap 1: BẠO KÍCH CHÍ MẠNG (Sword slash & kinetic shockwave)   */}
        {/* Chap 2: ĐỐN NGỘ ĐẠI ĐẠO (Spiritual Qi pillar & lotus mandala)  */}
        {/* ============================================================= */}
        {isCorrect && isChap1 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {/* Diagonal Sword Slash Beam */}
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

            {/* Expanding Shockwave Ring */}
            <div
              className="absolute top-1/3 left-1/2 rounded-full border-amber-300 animate-crit-shockwave"
              style={{
                width: '160px',
                height: '160px',
                borderColor: '#fbbf24',
                boxShadow: '0 0 30px #f59e0b, inset 0 0 20px #38bdf8',
              }}
            />

            {/* Critical Sparks Erupting from Slash Impact Point */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className="absolute w-3 h-3 bg-amber-300 rounded-full shadow-[0_0_10px_#fbbf24] animate-crit-spark-1" />
              <span className="absolute w-2.5 h-2.5 bg-cyan-300 rounded-full shadow-[0_0_10px_#22d3ee] animate-crit-spark-2" />
              <span className="absolute w-3 h-3 bg-yellow-200 rounded-full shadow-[0_0_10px_#fef08a] animate-crit-spark-3" />
              <span className="absolute w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b] animate-crit-spark-4" />
            </div>

            {/* Ambient Radiant Bloom */}
            <div className="absolute inset-0 bg-radial from-amber-400/15 via-transparent to-transparent opacity-80" />
          </div>
        )}

        {/* Chapter 2 Cultivation Overlay: ĐỐN NGỘ ĐẠI ĐẠO */}
        {isCorrect && !isChap1 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {/* Vertical Spiritual Qi Pillar (Cột sáng linh khí phi thăng) */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-28 sm:w-36 animate-dao-qi-pillar pointer-events-none flex items-center justify-center">
              <div
                className="w-full h-[150%] rounded-full blur-md opacity-80"
                style={{
                  background:
                    'linear-gradient(180deg, transparent 0%, rgba(251, 191, 36, 0.9) 25%, rgba(192, 132, 252, 0.95) 50%, rgba(244, 114, 182, 0.9) 75%, transparent 100%)',
                  boxShadow: '0 0 45px #c084fc, 0 0 75px #fbbf24',
                }}
              />
            </div>

            {/* Expanding Sacred Lotus Mandala Shockwave */}
            <div
              className="absolute top-1/3 left-1/2 rounded-full border-purple-400 animate-dao-lotus"
              style={{
                width: '180px',
                height: '180px',
                borderColor: '#c084fc',
                boxShadow: '0 0 35px #a855f7, inset 0 0 25px #fbbf24',
              }}
            />

            {/* Flying Spiritual Petals / Starlight particles */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className="absolute text-base animate-dao-petal-1">🪷</span>
              <span className="absolute text-base animate-dao-petal-2">✨</span>
              <span className="absolute text-base animate-dao-petal-3">🌸</span>
              <span className="absolute text-base animate-dao-petal-4">☯</span>
            </div>

            {/* Ambient Purple-Gold Celestial Bloom */}
            <div className="absolute inset-0 bg-radial from-purple-500/20 via-amber-400/10 to-transparent opacity-90" />
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
                  : 'bg-purple-950/70 border-purple-400/50 text-purple-300'
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
        {/* HERO / VISUAL SPOTLIGHT                                      */}
        {/* Chap 1: BẠO KÍCH CHÍ MẠNG                                    */}
        {/* Chap 2: ĐỐN NGỘ ĐẠI ĐẠO                                      */}
        {/* ============================================================= */}
        {isCorrect ? (
          <div className="relative z-10 my-2 flex flex-col items-center text-center">
            {/* Character Spotlight */}
            <div className="relative mb-3 flex items-center justify-center">
              {/* Outer Energy Aura */}
              <div
                className={`absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full blur-xl animate-pulse ${
                  isChap1
                    ? 'bg-gradient-to-tr from-amber-500/30 via-yellow-400/20 to-cyan-400/30'
                    : 'bg-gradient-to-tr from-purple-500/35 via-amber-400/25 to-pink-400/35'
                }`}
              />

              {/* Character Avatar with Animation */}
              <div
                className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 flex items-center justify-center text-4xl sm:text-5xl shadow-2xl ${
                  isChap1
                    ? 'animate-crit-character bg-gradient-to-b from-amber-400/20 via-slate-900/90 to-slate-950 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.6)]'
                    : 'animate-dao-ascend bg-gradient-to-b from-purple-500/25 via-slate-900/90 to-slate-950 border-purple-400 shadow-[0_0_35px_rgba(192,132,252,0.7)]'
                }`}
              >
                {isChap1 ? '🗡️' : '☯'}
                {/* Secondary badge emblem */}
                <div
                  className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border border-slate-950 text-slate-950 font-black flex items-center justify-center text-sm shadow-lg ${
                    isChap1
                      ? 'bg-gradient-to-tr from-amber-500 to-yellow-300'
                      : 'bg-gradient-to-tr from-purple-400 via-amber-300 to-yellow-200'
                  }`}
                >
                  {isChap1 ? '⚡' : '✨'}
                </div>
              </div>
            </div>

            {/* THEMATIC BADGE: Chương 1 = BẠO KÍCH CHÍ MẠNG; Chương 2 = ĐỐN NGỘ ĐẠI ĐẠO */}
            {isChap1 ? (
              <div className="animate-crit-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(251,191,36,0.8)] border border-yellow-200">
                <Flame className="w-4 h-4 fill-slate-950 animate-bounce" />
                <span>⚡ BẠO KÍCH CHÍ MẠNG! ⚡</span>
                <Swords className="w-4 h-4" />
              </div>
            ) : (
              <div className="animate-dao-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500 via-amber-300 to-yellow-300 text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(192,132,252,0.95)] border border-yellow-200 ring-2 ring-purple-400/40">
                <Sparkles className="w-4 h-4 text-slate-950 animate-spin" />
                <span>☯ ĐỐN NGỘ ĐẠI ĐẠO! ☯</span>
                <span className="text-base">🪷</span>
              </div>
            )}

            {/* Smooth Animated Counting Aura Numbers - positioned clearly below the badge */}
            <div className="animate-crit-damage mt-5 sm:mt-6 mb-1.5 flex items-center justify-center gap-2.5">
              <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 drop-shadow-[0_2px_10px_rgba(245,158,11,0.8)]">
                <AnimatedAuraCounter target={auraGained} /> AURA TRI THỨC!
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  isChap1
                    ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                    : 'bg-purple-400/20 border-purple-400/40 text-purple-200'
                }`}
              >
                {isChap1 ? 'CHÍ MẠNG' : 'ĐỐN NGỘ'}
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
                ? isChap1
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 shadow-amber-400/30 hover:brightness-105'
                  : 'bg-gradient-to-r from-purple-500 via-amber-300 to-yellow-300 text-slate-950 shadow-purple-500/30 hover:brightness-105'
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
