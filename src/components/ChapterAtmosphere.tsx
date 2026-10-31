import React, { useEffect, useRef } from 'react';
import { ChapterId, ScreenType } from '../types';
import chap1Bg from '../assets/images/chap1_ruins_bg_1793444053582.jpg';
import chap2Bg from '../assets/images/chap2_xianxia_bg_1793444115125.jpg';

interface ChapterAtmosphereProps {
  chapter: ChapterId;
  screen: ScreenType;
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

export const ChapterAtmosphere: React.FC<ChapterAtmosphereProps> = ({ chapter, screen }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isTransition = screen === 'transition_to_c2';
  const effectiveChapter = isTransition ? 2 : chapter;

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

    // Initialize particles according to chapter weather
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
        // CHAPTER 2 WEATHER: Celestial falling cherry blossom petals (hoa đào rơi) and spiritual qi orbs
        const isPetal = Math.random() > 0.35;
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
            : Math.random() > 0.5
            ? '#fcd34d' // spiritual golden qi
            : '#c084fc', // spiritual violet qi
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
        // Sway movement
        p.swayPhase += p.swaySpeed;
        const currentVx = p.vx + Math.sin(p.swayPhase) * 0.5;

        p.x += currentVx;
        p.y += p.vy;
        p.rotation += p.vRot;

        // Wrap around boundaries
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
          // Render elegant cherry blossom / celestial petal
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'ember') {
          // Render glowing fiery ancient ember with subtle radial glow
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Render spiritual rune dust / qi orb
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
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
  }, [effectiveChapter]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
      {/* Base deep background */}
      <div className="absolute inset-0 bg-slate-950" />

      {/* ------------------------------------------------------------- */}
      {/* 1. HÌNH NỀN CHÌM TỪNG CHƯƠNG (Submerged Chapter Artwork)       */}
      {/* ------------------------------------------------------------- */}
      {/* Chapter 1: Di tích cổ ngầm */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out scale-105 ${
          effectiveChapter === 1 && !isTransition ? 'opacity-25' : 'opacity-0'
        }`}
        style={{
          backgroundImage: `url(${chap1Bg})`,
          filter: 'contrast(1.15) brightness(0.85)',
        }}
      />

      {/* Chapter 2: Tu tiên giới thiên sơn */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out scale-105 ${
          effectiveChapter === 2 || isTransition ? 'opacity-28' : 'opacity-0'
        }`}
        style={{
          backgroundImage: `url(${chap2Bg})`,
          filter: 'contrast(1.1) brightness(0.9)',
        }}
      />

      {/* Subtle Dark Vignette Mask to ensure 100% text/math legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/70 to-slate-950/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(2,6,23,0.85)_100%)]" />

      {/* ------------------------------------------------------------- */}
      {/* 2. ÁNH SÁNG MÔI TRƯỜNG MỖI CHƯƠNG (Ambient Atmospheric Glows)  */}
      {/* ------------------------------------------------------------- */}
      {effectiveChapter === 1 && !isTransition && (
        <>
          {/* Top-left ancient cyan runic glow */}
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-[100px] animate-pulse" />
          {/* Bottom-right subterranean amber torch glow */}
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-500/15 blur-[120px]" />
          {/* Center mysterious teal mist */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-emerald-500/5 blur-[90px]" />
        </>
      )}

      {(effectiveChapter === 2 || isTransition) && (
        <>
          {/* High heavenly golden divine aura */}
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[450px] rounded-full bg-gradient-to-b from-amber-400/20 via-amber-500/10 to-transparent blur-[110px]" />
          {/* Ethereal purple spiritual mist on the left */}
          <div className="absolute top-1/4 -left-32 w-[450px] h-[450px] rounded-full bg-purple-600/15 blur-[120px] animate-pulse" />
          {/* Ethereal jade starlight glow on the right */}
          <div className="absolute bottom-10 -right-20 w-[420px] h-[420px] rounded-full bg-teal-500/12 blur-[100px]" />
          {/* Transition dimensional warp highlight */}
          {isTransition && (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.18)_0%,rgba(168,85,247,0.15)_45%,transparent_75%)] animate-pulse" />
          )}
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. HIỆU ỨNG THỜI TIẾT ĐẶC TRƯNG MỖI CHƯƠNG (Canvas Particles)   */}
      {/* ------------------------------------------------------------- */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
