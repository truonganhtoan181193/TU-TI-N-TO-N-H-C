let audioCtx: AudioContext | null = null;
let bgmMasterGain: GainNode | null = null;
let currentBgmTheme: 'chap1' | 'chap2' | 'transition' | 'outro' | 'none' = 'none';
let bgmLoopTimer: number | null = null;
let isAudioUnlocked = false;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      bgmMasterGain = audioCtx.createGain();
      bgmMasterGain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      bgmMasterGain.connect(audioCtx.destination);
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function unlockAudio() {
  if (isAudioUnlocked) return;
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().then(() => {
      isAudioUnlocked = true;
    });
  } else if (ctx) {
    isAudioUnlocked = true;
  }
}

// ---------------------------------------------------------------------
// SOUND EFFECTS (SFX)
// ---------------------------------------------------------------------
export function playSound(
  type: 'correct' | 'wrong' | 'levelup' | 'tick' | 'magic',
  enabled = true
) {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'correct') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      osc2.frequency.setValueAtTime(1174.66, now + 0.1); // D6

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.08);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } else if (type === 'wrong') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.25);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'levelup') {
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } else if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'magic') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.35);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch {
    // Gracefully ignore audio errors
  }
}

// ---------------------------------------------------------------------
// BGM SYNTHESIZER ENGINE
// ---------------------------------------------------------------------

// Helper: play a soft plucked note with envelope
function playPluck(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  time: number,
  duration = 0.5,
  volume = 0.08,
  type: OscillatorType = 'sine'
) {
  if (freq <= 0) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);

  // Soft attack and natural decay
  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(volume, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  osc.connect(gain);
  gain.connect(dest);

  osc.start(time);
  osc.stop(time + duration);
}

// Helper: play a flute / breath note with gentle vibrato
function playFluteNote(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  time: number,
  duration = 0.8,
  volume = 0.05
) {
  if (freq <= 0) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Vibrato LFO
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 5.2; // 5Hz vibrato
  lfoGain.gain.value = freq * 0.015; // subtle pitch modulation
  lfo.connect(osc.frequency);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, time);

  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(volume, time + 0.12);
  gain.gain.setValueAtTime(volume * 0.85, time + duration - 0.15);
  gain.gain.linearRampToValueAtTime(0.0001, time + duration);

  osc.connect(gain);
  gain.connect(dest);

  lfo.start(time);
  osc.start(time);
  lfo.stop(time + duration);
  osc.stop(time + duration);
}

// Helper: soft ambient noise burst for subtle ancient temple rhythm
function playSoftShaker(ctx: AudioContext, dest: AudioNode, time: number, volume = 0.015) {
  try {
    const bufferSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3500;
    filter.Q.value = 2.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(time);
    noise.stop(time + 0.05);
  } catch {
    // Ignore buffer creation errors
  }
}

// ---------------------------------------------------------------------
// THEME 1: CHAP 1 — THÁM HIỂM DI TÍCH CỔ
// Mystical, exploratory ancient minor/dorian temple melody with drone
// ---------------------------------------------------------------------
function scheduleChap1Cycle(ctx: AudioContext, dest: AudioNode, startTime: number): number {
  const step = 0.32; // ~94 BPM
  // D Minor ancient exploration scale: D3, F3, G3, A3, C4, D4, E4, F4, G4, A4
  const D2 = 73.42;
  const A2 = 110.0;
  const D4 = 293.66;
  const F4 = 349.23;
  const G4 = 392.0;
  const A4 = 440.0;
  const C5 = 523.25;
  const E4 = 329.63;

  // Deep stone temple bass drone (D2 & A2)
  playPluck(ctx, dest, D2, startTime, step * 8, 0.04, 'triangle');
  playPluck(ctx, dest, A2, startTime + step * 8, step * 8, 0.035, 'triangle');

  // Kalimba / Ancient temple bell melody pattern (16 steps)
  const melody = [
    { f: D4, dur: step * 1.5, t: 0 },
    { f: F4, dur: step * 0.9, t: 2 },
    { f: G4, dur: step * 1.2, t: 3 },
    { f: A4, dur: step * 1.8, t: 4 },
    { f: D4, dur: step * 0.9, t: 7 },
    { f: F4, dur: step * 1.2, t: 8 },
    { f: G4, dur: step * 0.9, t: 9 },
    { f: A4, dur: step * 1.2, t: 10 },
    { f: C5, dur: step * 1.5, t: 11 },
    { f: A4, dur: step * 1.2, t: 13 },
    { f: F4, dur: step * 0.9, t: 14 },
    { f: E4, dur: step * 1.2, t: 15 },
  ];

  melody.forEach((note) => {
    playPluck(ctx, dest, note.f, startTime + note.t * step, note.dur, 0.065, 'sine');
  });

  // Gentle shaker pulse every 2 steps
  for (let s = 1; s < 16; s += 2) {
    playSoftShaker(ctx, dest, startTime + s * step, 0.012);
  }

  return 16 * step;
}

// ---------------------------------------------------------------------
// THEME 2: CHAP 2 — TIẾN VÀO TU TIÊN GIỚI
// Ethereal Chinese pentatonic (Guzheng & celestial flute) meditation
// ---------------------------------------------------------------------
function scheduleChap2Cycle(ctx: AudioContext, dest: AudioNode, startTime: number): number {
  const step = 0.38; // ~78 BPM meditative
  // Pentatonic notes: D, E, G, A, B, D, E
  const D3 = 146.83;
  const G3 = 196.0;
  const A3 = 220.0;
  const D4 = 293.66;
  const E4 = 329.63;
  const G4 = 392.0;
  const A4 = 440.0;
  const B4 = 493.88;
  const D5 = 587.33;
  const E5 = 659.25;

  // Spiritual pad / warm drone
  playPluck(ctx, dest, D3, startTime, step * 8, 0.035, 'sine');
  playPluck(ctx, dest, G3, startTime + step * 8, step * 8, 0.035, 'sine');

  // Guzheng arpeggios (crisp delicate plucks)
  const guzheng = [
    { f: D4, t: 0 },
    { f: A4, t: 1 },
    { f: D5, t: 2 },
    { f: E5, t: 3 },
    { f: B4, t: 4 },
    { f: A4, t: 5 },
    { f: G4, t: 6 },
    { f: E4, t: 7 },
    { f: G4, t: 8 },
    { f: B4, t: 9 },
    { f: D5, t: 10 },
    { f: A4, t: 11 },
    { f: G4, t: 12 },
    { f: E4, t: 13 },
    { f: D4, t: 14 },
    { f: A3, t: 15 },
  ];

  guzheng.forEach((note) => {
    playPluck(ctx, dest, note.f, startTime + note.t * step, step * 1.8, 0.05, 'triangle');
  });

  // Celestial flute melody singing gently above the Guzheng
  playFluteNote(ctx, dest, A4, startTime + 0.5 * step, step * 3.2, 0.045);
  playFluteNote(ctx, dest, D5, startTime + 4.5 * step, step * 3.0, 0.04);
  playFluteNote(ctx, dest, B4, startTime + 8.5 * step, step * 3.5, 0.042);
  playFluteNote(ctx, dest, G4, startTime + 12.5 * step, step * 3.2, 0.038);

  return 16 * step;
}

// ---------------------------------------------------------------------
// THEME 3: TRANSITION — CÁNH CỔNG DỊ GIỚI (Dimensional Portal)
// Shimmering mystical glissando & cosmic portal harmonics
// ---------------------------------------------------------------------
function scheduleTransitionCycle(ctx: AudioContext, dest: AudioNode, startTime: number): number {
  const step = 0.28;
  const portalNotes = [
    196.0, 246.94, 293.66, 369.99, 440.0, 493.88, 587.33, 739.99, 880.0, 987.77, 1174.66,
  ];

  portalNotes.forEach((freq, idx) => {
    playPluck(ctx, dest, freq, startTime + idx * 0.14, 0.8, 0.06, 'sine');
  });

  // Resonant singing portal drone
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, startTime);
  osc.frequency.exponentialRampToValueAtTime(440, startTime + 2.5);

  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.linearRampToValueAtTime(0.05, startTime + 0.8);
  gain.gain.linearRampToValueAtTime(0.0001, startTime + 3.2);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(startTime);
  osc.stop(startTime + 3.2);

  return 3.5;
}

// ---------------------------------------------------------------------
// THEME 4: OUTRO — PHONG THẦN & ĐỘ KIẾP VICTORY
// Majestic ceremonial celebration & joyous bells
// ---------------------------------------------------------------------
function scheduleOutroCycle(ctx: AudioContext, dest: AudioNode, startTime: number): number {
  const step = 0.34;
  // Victorious fanfare arpeggio chords
  const victoryNotes = [
    { f: 523.25, t: 0 },
    { f: 659.25, t: 1 },
    { f: 783.99, t: 2 },
    { f: 1046.5, t: 3 },
    { f: 880.0, t: 5 },
    { f: 1046.5, t: 6 },
    { f: 1174.66, t: 7 },
    { f: 1318.51, t: 8 },
    { f: 1046.5, t: 11 },
    { f: 783.99, t: 13 },
  ];

  victoryNotes.forEach((note) => {
    playPluck(ctx, dest, note.f, startTime + note.t * step, step * 2.2, 0.065, 'triangle');
    playPluck(ctx, dest, note.f * 0.5, startTime + note.t * step, step * 2.5, 0.035, 'sine');
  });

  return 16 * step;
}

// ---------------------------------------------------------------------
// PUBLIC BGM CONTROLLER
// ---------------------------------------------------------------------
export function setBgmTheme(
  theme: 'chap1' | 'chap2' | 'transition' | 'outro' | 'none',
  enabled = true
) {
  if (!enabled || theme === 'none') {
    stopBGM();
    currentBgmTheme = theme;
    return;
  }

  const ctx = getAudioContext();
  if (!ctx || !bgmMasterGain) {
    currentBgmTheme = theme;
    return;
  }

  // If already playing this theme, keep rolling
  if (currentBgmTheme === theme && bgmLoopTimer !== null) {
    return;
  }

  stopBGM();
  currentBgmTheme = theme;

  // Un-mute master BGM gain softly
  bgmMasterGain.gain.setValueAtTime(0.001, ctx.currentTime);
  bgmMasterGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.6);

  let nextScheduleTime = ctx.currentTime + 0.05;

  const loop = () => {
    if (!ctx || !bgmMasterGain || currentBgmTheme !== theme) return;

    let cycleDuration = 4;
    if (theme === 'chap1') {
      cycleDuration = scheduleChap1Cycle(ctx, bgmMasterGain, nextScheduleTime);
    } else if (theme === 'chap2') {
      cycleDuration = scheduleChap2Cycle(ctx, bgmMasterGain, nextScheduleTime);
    } else if (theme === 'transition') {
      cycleDuration = scheduleTransitionCycle(ctx, bgmMasterGain, nextScheduleTime);
    } else if (theme === 'outro') {
      cycleDuration = scheduleOutroCycle(ctx, bgmMasterGain, nextScheduleTime);
    }

    nextScheduleTime += cycleDuration;
    // Schedule next chunk ~0.4s before current ends
    const waitMs = Math.max(200, (cycleDuration - 0.4) * 1000);
    bgmLoopTimer = window.setTimeout(loop, waitMs);
  };

  loop();
}

export function stopBGM() {
  if (bgmLoopTimer !== null) {
    clearTimeout(bgmLoopTimer);
    bgmLoopTimer = null;
  }
  if (bgmMasterGain && audioCtx) {
    try {
      bgmMasterGain.gain.setValueAtTime(bgmMasterGain.gain.value, audioCtx.currentTime);
      bgmMasterGain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
    } catch {
      // Ignore ramp errors
    }
  }
}

export function triggerHaptic() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(15);
    } catch {
      // Ignore
    }
  }
}
