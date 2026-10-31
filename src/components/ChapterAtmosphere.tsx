import React, { useEffect, useRef } from 'react';
import { ChapterId, ScreenType, REALM_THEMES } from '../types';
import chap1Bg from '../assets/images/chap1_ruins_bg_1793444053582.jpg';
import chap2Bg from '../assets/images/chap2_xianxia_bg_1793444115125.jpg';

interface ChapterAtmosphereProps {
  chapter: ChapterId;
  screen: ScreenType;
  realmIndex?: number;
  isTribulationStage?: boolean;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  alpha: number;
  baseAlpha: number;
  color: string;
  rotation: number;
  vRot: number;
  swayPhase: number;
  swaySpeed: number;
  type: 'rune_dust' | 'ember' | 'petal' | 'qi_orb';
}

export const ChapterAtmosphere: React.FC<ChapterAtmosphereProps> = ({
  chapter,
  screen,
  realmIndex = 0,
  isTribulationStage = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isTransition = screen === 'transition_to_c2';
  const effectiveChapter = isTransition ? 2 : chapter;
  const currentRealmTheme = REALM_THEMES[realmIndex] || REALM_THEMES[0];

  // Particle System Weather Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const maxParticles = width < 640 ? 35 : 55;
    const particles: Particle[] = [];

    const createParticle = (spawnRandomY = true): Particle => {
      const isChap1 = effectiveChapter === 1;
      const x = Math.random() * width;
      const y = spawnRandomY ? Math.random() * height : isChap1 ? height + 10 : -15;

      if (isChap1) {
        // CHAPTER 1 WEATHER: Ancient Ruin dust motes, glowing embers, and floating rune fragments
        const isEmber = Math.random() > 0.45;
        return {
          x,
          y,
          size: isEmber ? 1.5 + Math.random() * 2.5 : 1 + Math.random() * 2,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -(0.3 + Math.random() * 0.7), // floats upward like temple embers
          alpha: 0.15 + Math.random() * 0.65,
          baseAlpha: 0.15 + Math.random() * 0.65,
          color: isEmber
            ? Math.random() > 0.5
              ? '#fbbf24' // golden amber
              : '#f59e0b'
            : Math.random() > 0.4
            ? '#38bdf8' // mystic cyan
            : '#34d399', // jade emerald
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.02,
          swayPhase: Math.random() * Math.PI * 2,
          swaySpeed: 0.015 + Math.random() * 0.025,
          type: isEmber ? 'ember' : 'rune_dust',
        };
      } else {
        // CHAPTER 2 WEATHER: Falling cherry blossom petals + Realm-colored spiritual qi orbs
        const isPetal = Math.random() > 0.40;
        const realmColors = currentRealmTheme.particleColors;
        const qiColor = realmColors[Math.floor(Math.random() * realmColors.length)] || '#fcd34d';

        return {
          x,
          y,
          size: isPetal ? 4 + Math.random() * 6 : 2 + Math.random() * 3.5,
          vx: 0.5 + Math.random() * 1.0, // gentle wind drifting to the right
          vy: isPetal ? 0.6 + Math.random() * 1.1 : -(0.2 + Math.random() * 0.5),
          alpha: 0.2 + Math.random() * 0.65,
          baseAlpha: 0.2 + Math.random() * 0.65,
          color: isPetal
            ? Math.random() > 0.4
              ? '#fbcfe8' // soft pink petal
              : '#f472b6' // rose petal
            : qiColor,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.04,
          swayPhase: Math.random() * Math.PI * 2,
          swaySpeed: 0.02 + Math.random() * 0.03,
          type: isPetal ? 'petal' : 'qi_orb',
        };
      }
    };

    for (let i = 0; i < maxParticles; i++) {
      particles.push(createParticle(true));
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, idx) => {
        p.swayPhase += p.swaySpeed;
        const currentVx = p.vx + Math.sin(p.swayPhase) * 0.5;

        p.x += currentVx;
        p.y += p.vy;
        p.rotation += p.vRot;

        if (effectiveChapter === 1) {
          if (p.y < -20) {
            particles[idx] = createParticle(false);
          }
          if (p.x < -20) p.x = width + 10;
          if (p.x > width + 20) p.x = -10;
        } else {
          if (p.y > height + 25 || p.x > width + 30) {
            particles[idx] = createParticle(false);
          }
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;

        if (p.type === 'petal') {
          // Render cherry blossom petal
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'ember') {
          // Render glowing fiery ancient ember
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Render spiritual qi orb matching current realm
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 7;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [effectiveChapter, realmIndex, currentRealmTheme]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
      {/* Base deep background */}
      <div className="absolute inset-0 bg-slate-950" />

      {/* ------------------------------------------------------------- */}
      {/* 1. HÌNH NỀN CHÌM TỪNG CHƯƠNG (Submerged Chapter Artwork)       */}
      {/* ------------------------------------------------------------- */}
      {/* Chapter 1: Di tích cổ ngầm (Cyan & Amber torchlit ruins) */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out scale-105 ${
          effectiveChapter === 1 && !isTransition ? 'opacity-40' : 'opacity-0'
        }`}
        style={{
          backgroundImage: `url(${chap1Bg})`,
          filter: 'contrast(1.15) brightness(0.9)',
        }}
      />

      {/* Chapter 2: Tu tiên giới thiên sơn (Golden peaks, clouds, sakura) */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out scale-105 ${
          effectiveChapter === 2 || isTransition ? 'opacity-45' : 'opacity-0'
        }`}
        style={{
          backgroundImage: `url(${chap2Bg})`,
          filter: 'contrast(1.1) brightness(0.95)',
        }}
      />

      {/* Atmospheric Vignette Mask - balanced for rich artwork visibility + high text legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/35 to-slate-950/65" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(2,6,23,0.7)_100%)]" />

      {/* ------------------------------------------------------------- */}
      {/* 2. ÁNH SÁNG MÔI TRƯỜNG & MÀU SẮC THEO CẢNH GIỚI (Ambient Glows) */}
      {/* ------------------------------------------------------------- */}
      {/* Chapter 1 Palette: Xanh Băng Cổ (Cyan) + Vàng Đồng Đuốc (Amber) */}
      {effectiveChapter === 1 && !isTransition && (
        <>
          {/* Top-left ancient cyan runic glow */}
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/15 blur-[100px] animate-pulse" />
          {/* Bottom-right subterranean amber torch glow */}
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-500/20 blur-[120px]" />
          {/* Center mysterious teal mist */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-teal-500/10 blur-[90px]" />
        </>
      )}

      {/* Chapter 2 Palette: Dynamic shift according to current Realm + Gold & Purple */}
      {(effectiveChapter === 2 || isTransition) && (
        <>
          {/* Realm Dominant Aura Glow (Top Center) */}
          <div
            className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[450px] rounded-full blur-[110px] transition-colors duration-1000"
            style={{
              background: `radial-gradient(circle, ${currentRealmTheme.glowRgba} 0%, rgba(168, 85, 247, 0.12) 60%, transparent 100%)`,
            }}
          />

          {/* Left Spiritual Mist (Tuned to realm primary) */}
          <div
            className="absolute top-1/4 -left-32 w-[450px] h-[450px] rounded-full blur-[120px] transition-colors duration-1000"
            style={{
              backgroundColor: currentRealmTheme.primaryHex,
              opacity: 0.12,
            }}
          />

          {/* Right Celestial Mist (Purple & Peach blossom harmony) */}
          <div className="absolute bottom-10 -right-20 w-[420px] h-[420px] rounded-full bg-purple-600/15 blur-[100px]" />

          {/* Soft Peach Blossom ambient hue on bottom-left */}
          <div className="absolute -bottom-20 left-10 w-[350px] h-[350px] rounded-full bg-pink-500/10 blur-[90px]" />
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. HIỆU ỨNG CHUYỂN CẢNH DỊCH CHUYỂN (Warp / Portal Vortex)     */}
      {/* ------------------------------------------------------------- */}
      {isTransition && (
        <div className="absolute inset-0 flex items-center justify-center animate-warp-shake overflow-hidden">
          {/* Cosmic Dimensional Portal Rays (Rotating Vortex) */}
          <div
            className="w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] rounded-full opacity-35 animate-portal-spin"
            style={{
              background:
                'conic-gradient(from 0deg, rgba(251, 191, 36, 0.5), rgba(168, 85, 247, 0.4), rgba(56, 189, 248, 0.5), rgba(244, 63, 94, 0.4), rgba(251, 191, 36, 0.5))',
              filter: 'blur(45px)',
            }}
          />

          {/* Portal Ripple Rings */}
          <div className="absolute w-[320px] h-[320px] sm:w-[450px] sm:h-[450px] rounded-full border border-amber-400/40 animate-ping opacity-25" />
          <div className="absolute w-[240px] h-[240px] sm:w-[320px] sm:h-[320px] rounded-full border-2 border-purple-400/50 animate-pulse" />

          {/* Center Dimensional Core */}
          <div className="absolute w-40 h-40 rounded-full bg-gradient-to-tr from-amber-400/30 via-purple-500/30 to-cyan-400/30 blur-2xl animate-pulse" />
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. HIỆU ỨNG SẤM SÉT ĐỘ KIẾP (Tribulation Lightning Flash)      */}
      {/* ------------------------------------------------------------- */}
      {isTribulationStage && (
        <div className="absolute inset-0 pointer-events-none z-10 animate-tribulation-lightning bg-gradient-to-b from-purple-500/25 via-cyan-400/15 to-transparent" />
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. HIỆU ỨNG THỜI TIẾT ĐẶC TRƯNG MỖI CHƯƠNG (Canvas Particles)   */}
      {/* ------------------------------------------------------------- */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
