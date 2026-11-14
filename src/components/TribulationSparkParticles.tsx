import React, { useEffect, useRef } from 'react';

interface LightningParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  length: number;
  angle: number;
  segments: number;
  jitter: number;
  color: string;
  lineWidth: number;
  hasFork: boolean;
  isDot: boolean;
}

const LIGHTNING_COLORS = [
  '#fef08a', // bright thunder yellow
  '#fbbf24', // amber gold
  '#e9d5ff', // pale violet
  '#c084fc', // purple tribulation
  '#7dd3fc', // electric cyan
  '#ffffff', // core plasma white
];

export const TribulationSparkParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId = 0;
    let width = 0;
    let height = 0;

    const updateSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateSize();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateSize) : null;
    if (resizeObserver && canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
    window.addEventListener('resize', updateSize);

    const particles: LightningParticle[] = [];
    const maxParticles = 34;

    const spawnParticle = (): LightningParticle => {
      // Cluster more heavily around the center-left and center around "THIÊN MÔN ĐỘ KIẾP"
      const aroundCenter = Math.random() < 0.72;
      const x = aroundCenter
        ? width * (0.12 + Math.random() * 0.76)
        : Math.random() * width;
      const y = aroundCenter
        ? height * (0.15 + Math.random() * 0.7)
        : Math.random() * height;

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.25 + Math.random() * 0.85;
      const isDot = Math.random() < 0.3;

      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.15,
        life: 0,
        maxLife: 14 + Math.floor(Math.random() * 18),
        length: 7 + Math.random() * 11,
        angle,
        segments: 2 + Math.floor(Math.random() * 3),
        jitter: 2.2 + Math.random() * 3.2,
        color: LIGHTNING_COLORS[Math.floor(Math.random() * LIGHTNING_COLORS.length)],
        lineWidth: 0.9 + Math.random() * 1.1,
        hasFork: Math.random() < 0.35,
        isDot,
      };
    };

    for (let i = 0; i < 16; i++) {
      const p = spawnParticle();
      p.life = Math.floor(Math.random() * p.maxLife);
      particles.push(p);
    }

    const drawTinyBolt = (p: LightningParticle, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = p.color;
      ctx.fillStyle = p.color;
      ctx.lineWidth = p.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;

      if (p.isDot) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.lineWidth * 1.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
      }

      const stepLen = p.length / p.segments;
      const cos = Math.cos(p.angle);
      const sin = Math.sin(p.angle);
      // Perpendicular vector for zigzag displacement
      const perpX = -sin;
      const perpY = cos;

      let currX = p.x - cos * (p.length * 0.5);
      let currY = p.y - sin * (p.length * 0.5);

      ctx.beginPath();
      ctx.moveTo(currX, currY);

      let forkOriginX = currX;
      let forkOriginY = currY;

      for (let s = 1; s <= p.segments; s++) {
        const isLast = s === p.segments;
        const offset = isLast ? 0 : (Math.random() - 0.5) * 2 * p.jitter;
        const nextX = p.x - cos * (p.length * 0.5) + cos * (stepLen * s) + perpX * offset;
        const nextY = p.y - sin * (p.length * 0.5) + sin * (stepLen * s) + perpY * offset;
        ctx.lineTo(nextX, nextY);
        if (s === 1) {
          forkOriginX = nextX;
          forkOriginY = nextY;
        }
        currX = nextX;
        currY = nextY;
      }
      ctx.stroke();

      // Occasional miniature secondary lightning fork
      if (p.hasFork) {
        const forkAngle = p.angle + (Math.random() > 0.5 ? 0.65 : -0.65);
        const forkLen = p.length * 0.48;
        ctx.beginPath();
        ctx.lineWidth = p.lineWidth * 0.72;
        ctx.moveTo(forkOriginX, forkOriginY);
        const midX =
          forkOriginX + Math.cos(forkAngle) * (forkLen * 0.5) + (Math.random() - 0.5) * 2.5;
        const midY =
          forkOriginY + Math.sin(forkAngle) * (forkLen * 0.5) + (Math.random() - 0.5) * 2.5;
        ctx.lineTo(midX, midY);
        ctx.lineTo(
          forkOriginX + Math.cos(forkAngle) * forkLen,
          forkOriginY + Math.sin(forkAngle) * forkLen
        );
        ctx.stroke();
      }

      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Continuously replenish crackling tiny lightning sparks
      if (particles.length < maxParticles && Math.random() < 0.72) {
        particles.push(spawnParticle());
      }
      if (particles.length < maxParticles - 4 && Math.random() < 0.35) {
        particles.push(spawnParticle());
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        const progress = p.life / p.maxLife;
        // Sharp electric flash-in, flickering peak, smooth fade-out
        const flicker = Math.random() > 0.2 ? 1 : 0.45;
        const alpha =
          progress < 0.2
            ? (progress / 0.2) * flicker
            : (1 - (progress - 0.2) / 0.8) * flicker;

        drawTinyBolt(p, Math.max(0, Math.min(1, alpha)));
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};
