import confetti from 'canvas-confetti';

export function fireConfetti() {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ffd36a', '#57d7d0', '#7654c8', '#38bdf8', '#34d399'],
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ffd36a', '#57d7d0', '#7654c8'],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ffd36a', '#57d7d0', '#7654c8'],
      });
    }, 250);
  } catch {
    // Graceful fallback
  }
}
