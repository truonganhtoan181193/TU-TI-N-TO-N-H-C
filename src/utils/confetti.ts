import confetti from 'canvas-confetti';

export function fireConfetti() {
  fireMultiWaveFireworks('chap1');
}

/**
 * Multi-wave particle fireworks celebration (Pháo hoa hạt nhiều đợt)
 * Emits 4 coordinated waves of particles with customized chapter colors
 */
export function fireMultiWaveFireworks(theme: 'chap1' | 'chap2' = 'chap2') {
  try {
    const isChap1 = theme === 'chap1';
    
    // Chapter-specific palettes:
    // Chap 1: Ancient ruin amber gold, mystic cyan, emerald jade, bronze
    // Chap 2: Celestial Daoist gold, imperial purple, heavenly cyan, radiant starlight
    const colors = isChap1
      ? ['#fbbf24', '#38bdf8', '#34d399', '#f59e0b', '#06b6d4', '#ffffff']
      : ['#f59e0b', '#c084fc', '#5eead4', '#fcd34d', '#a855f7', '#ffffff'];

    // Wave 1: Immediate central burst
    confetti({
      particleCount: 65,
      spread: 75,
      startVelocity: 35,
      origin: { x: 0.5, y: 0.55 },
      colors,
      ticks: 200,
      gravity: 0.9,
      scalar: 1.1,
    });

    // Wave 2: Dual angled side cannons (+180ms)
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 60,
        startVelocity: 45,
        origin: { x: 0.05, y: 0.65 },
        colors,
        ticks: 220,
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 60,
        startVelocity: 45,
        origin: { x: 0.95, y: 0.65 },
        colors,
        ticks: 220,
      });
    }, 180);

    // Wave 3: Cascading sky rain of glittering particles (+380ms)
    setTimeout(() => {
      confetti({
        particleCount: 75,
        spread: 120,
        startVelocity: 25,
        origin: { x: 0.5, y: 0.2 },
        colors,
        ticks: 260,
        gravity: 0.7,
        scalar: 0.95,
      });
    }, 380);

    // Wave 4: Grand finale star blooming (+620ms)
    setTimeout(() => {
      confetti({
        particleCount: 45,
        spread: 90,
        startVelocity: 30,
        origin: { x: 0.5, y: 0.45 },
        colors,
        ticks: 200,
        shapes: ['circle'],
        scalar: 1.25,
      });
    }, 620);
  } catch {
    // Graceful fallback
  }
}
