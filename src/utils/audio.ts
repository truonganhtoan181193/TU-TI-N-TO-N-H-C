// =====================================================================
// AUDIO & BGM SYNTHESIZER ENGINE (Web Audio API)
// High fidelity, crystal clear loudness, zero external dependencies
// - Master Compressor & Limiter for robust, audible volume on all devices
// - Chapter 1: Ancient Ruins Exploration (Thám hiểm di tích cổ)
// - Chapter 2: Immortal Cultivation Realm (Tiến vào Tu Tiên Giới - Guzheng & Flute)
// - Transition: Dimensional Portal Warp (Cổng Dị Giới)
// - Outro / Climax: Celestial Ascension & Fanfare (Độ Kiếp Phi Thăng)
// =====================================================================

let audioCtx: AudioContext | null = null;
let bgmMasterGain: GainNode | null = null;
let masterCompressor: DynamicsCompressorNode | null = null;
let bgmFilter: BiquadFilterNode | null = null;
let spaceSendGain: GainNode | null = null;

let currentBgmTheme: 'chap1' | 'chap2' | 'transition' | 'outro' | 'none' = 'none';
let bgmLoopTimer: number | null = null;
let isAudioUnlocked = false;

// Target Master BGM Volume (Clear, audible, comfortably loud without clipping)
const MASTER_BGM_VOLUME = 0.45;

// ---------------------------------------------------------------------
// AUDIO CONTEXT & MASTER CHAIN INITIALIZATION
// ---------------------------------------------------------------------
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();

      // Master Dynamics Compressor: brings up soft passages & prevents distortion
      masterCompressor = audioCtx.createDynamicsCompressor();
      masterCompressor.threshold.setValueAtTime(-20, audioCtx.currentTime);
      masterCompressor.knee.setValueAtTime(24, audioCtx.currentTime);
      masterCompressor.ratio.setValueAtTime(4, audioCtx.currentTime);
      masterCompressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
      masterCompressor.release.setValueAtTime(0.25, audioCtx.currentTime);
      masterCompressor.connect(audioCtx.destination);

      // Master BGM Gain
      bgmMasterGain = audioCtx.createGain();
      bgmMasterGain.gain.setValueAtTime(MASTER_BGM_VOLUME, audioCtx.currentTime);

      // Warm master filter with open cutoff for sparkling clarity
      bgmFilter = audioCtx.createBiquadFilter();
      bgmFilter.type = 'lowpass';
      bgmFilter.frequency.setValueAtTime(6000, audioCtx.currentTime);
      bgmFilter.Q.setValueAtTime(0.7, audioCtx.currentTime);

      // Ambient Space (Gentle feedback delay for natural acoustic room / temple depth)
      try {
        const delay = audioCtx.createDelay(1.0);
        delay.delayTime.setValueAtTime(0.28, audioCtx.currentTime);

        const delayFeedback = audioCtx.createGain();
        delayFeedback.gain.setValueAtTime(0.28, audioCtx.currentTime);

        const delayFilter = audioCtx.createBiquadFilter();
        delayFilter.type = 'lowpass';
        delayFilter.frequency.setValueAtTime(2400, audioCtx.currentTime);

        spaceSendGain = audioCtx.createGain();
        spaceSendGain.gain.setValueAtTime(0.35, audioCtx.currentTime);

        spaceSendGain.connect(delay);
        delay.connect(delayFilter);
        delayFilter.connect(delayFeedback);
        delayFeedback.connect(delay);
        delayFilter.connect(bgmFilter);
      } catch {
        spaceSendGain = null;
      }

      bgmMasterGain.connect(bgmFilter);
      bgmFilter.connect(masterCompressor);
    }
  }

  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function unlockAudio() {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      isAudioUnlocked = true;
      if (currentBgmTheme !== 'none') {
        const targetTheme = currentBgmTheme;
        currentBgmTheme = 'none';
        setBgmTheme(targetTheme, true);
      }
    }).catch(() => {});
  } else {
    isAudioUnlocked = true;
    if (currentBgmTheme !== 'none' && bgmLoopTimer === null) {
      const targetTheme = currentBgmTheme;
      currentBgmTheme = 'none';
      setBgmTheme(targetTheme, true);
    }
  }
}

// ---------------------------------------------------------------------
// SOUND EFFECTS (SFX) — Clearly audible & crisp
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
    const dest = masterCompressor || ctx.destination;

    if (type === 'correct') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      osc2.frequency.setValueAtTime(1174.66, now + 0.08); // D6

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(dest);

      osc1.start(now);
      osc2.start(now + 0.06);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } else if (type === 'wrong') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.28);

      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.32);
    } else if (type === 'levelup') {
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.32, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.45);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.45);
      });
    } else if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'magic') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.35);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch {
    // Ignore audio errors
  }
}

// ---------------------------------------------------------------------
// SYNTHESIS NOTE HELPERS (High output gain & rich presence)
// ---------------------------------------------------------------------

function playPluck(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  time: number,
  duration = 0.55,
  volume = 0.25,
  type: OscillatorType = 'sine',
  sendToSpace = true
) {
  if (freq <= 0) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(dest);
    if (sendToSpace && spaceSendGain) {
      gain.connect(spaceSendGain);
    }

    osc.start(time);
    osc.stop(time + duration);
  } catch {
    // Ignore
  }
}

function playGuzhengPluck(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  time: number,
  duration = 0.9,
  volume = 0.26
) {
  if (freq <= 0) return;
  try {
    // Fundamental plucked string
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, time);

    gain1.gain.setValueAtTime(0.0001, time);
    gain1.gain.linearRampToValueAtTime(volume, time + 0.008);
    gain1.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    // Overtone sparkle (crisp silk string overtone)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, time);

    gain2.gain.setValueAtTime(0.0001, time);
    gain2.gain.linearRampToValueAtTime(volume * 0.45, time + 0.006);
    gain2.gain.exponentialRampToValueAtTime(0.0001, time + duration * 0.45);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(dest);
    gain2.connect(dest);

    if (spaceSendGain) {
      gain1.connect(spaceSendGain);
    }

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration);
    osc2.stop(time + duration * 0.45);
  } catch {
    // Ignore
  }
}

function playFluteNote(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  time: number,
  duration = 1.0,
  volume = 0.20
) {
  if (freq <= 0) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 5.0;
    lfoGain.gain.value = freq * 0.018;
    lfo.connect(osc.frequency);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.12);
    gain.gain.setValueAtTime(volume * 0.85, time + duration - 0.2);
    gain.gain.linearRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(dest);
    if (spaceSendGain) {
      gain.connect(spaceSendGain);
    }

    lfo.start(time);
    osc.start(time);
    lfo.stop(time + duration);
    osc.stop(time + duration);
  } catch {
    // Ignore
  }
}

function playWarmDrone(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  time: number,
  duration: number,
  volume = 0.16
) {
  if (freq <= 0) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.35);
    gain.gain.setValueAtTime(volume * 0.9, time + duration - 0.35);
    gain.gain.linearRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + duration);
  } catch {
    // Ignore
  }
}

function playSoftShaker(ctx: AudioContext, dest: AudioNode, time: number, volume = 0.04) {
  try {
    const bufferSize = Math.floor(ctx.sampleRate * 0.04);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3200;
    filter.Q.value = 2.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(time);
    noise.stop(time + 0.04);
  } catch {
    // Ignore
  }
}

// ---------------------------------------------------------------------
// 1. NHẠC NỀN CHƯƠNG 1: THÁM HIỂM DI TÍCH CỔ
// ---------------------------------------------------------------------
function scheduleChap1Cycle(ctx: AudioContext, dest: AudioNode, startTime: number): number {
  const step = 0.32; // ~94 BPM
  const D2 = 73.42;
  const A2 = 110.0;
  const C3 = 130.81;
  const D3 = 146.83;

  const D4 = 293.66;
  const E4 = 329.63;
  const F4 = 349.23;
  const G4 = 392.0;
  const A4 = 440.0;
  const C5 = 523.25;
  const D5 = 587.33;

  // PHRASE A (Steps 0-15)
  playWarmDrone(ctx, dest, D2, startTime, step * 8, 0.18);
  playWarmDrone(ctx, dest, A2, startTime + step * 8, step * 8, 0.16);

  const phraseAMelody = [
    { f: D4, t: 0, dur: step * 1.6 },
    { f: F4, t: 2, dur: step * 1.0 },
    { f: G4, t: 3, dur: step * 1.2 },
    { f: A4, t: 4, dur: step * 2.0 },
    { f: D4, t: 7, dur: step * 1.0 },
    { f: F4, t: 8, dur: step * 1.2 },
    { f: G4, t: 9, dur: step * 1.0 },
    { f: A4, t: 10, dur: step * 1.4 },
    { f: C5, t: 11, dur: step * 1.8 },
    { f: A4, t: 13, dur: step * 1.2 },
    { f: F4, t: 14, dur: step * 1.0 },
    { f: E4, t: 15, dur: step * 1.2 },
  ];

  phraseAMelody.forEach((note) => {
    playPluck(ctx, dest, note.f, startTime + note.t * step, note.dur, 0.28, 'sine');
  });

  playFluteNote(ctx, dest, A4, startTime + 4 * step, step * 3.5, 0.18);
  playFluteNote(ctx, dest, D5, startTime + 11 * step, step * 3.0, 0.16);

  // PHRASE B (Steps 16-31)
  playWarmDrone(ctx, dest, C3, startTime + step * 16, step * 8, 0.16);
  playWarmDrone(ctx, dest, D3, startTime + step * 24, step * 8, 0.18);

  const phraseBMelody = [
    { f: C5, t: 16, dur: step * 1.6 },
    { f: A4, t: 18, dur: step * 1.0 },
    { f: G4, t: 19, dur: step * 1.2 },
    { f: A4, t: 20, dur: step * 1.8 },
    { f: D5, t: 22, dur: step * 1.5 },
    { f: C5, t: 24, dur: step * 1.2 },
    { f: A4, t: 25, dur: step * 1.0 },
    { f: G4, t: 26, dur: step * 1.4 },
    { f: F4, t: 27, dur: step * 1.2 },
    { f: E4, t: 28, dur: step * 1.0 },
    { f: F4, t: 29, dur: step * 1.2 },
    { f: D4, t: 30, dur: step * 2.2 },
  ];

  phraseBMelody.forEach((note) => {
    playPluck(ctx, dest, note.f, startTime + note.t * step, note.dur, 0.28, 'sine');
  });

  playFluteNote(ctx, dest, F4, startTime + 20 * step, step * 3.5, 0.18);
  playFluteNote(ctx, dest, D4, startTime + 28 * step, step * 4.0, 0.18);

  for (let s = 1; s < 32; s += 2) {
    playSoftShaker(ctx, dest, startTime + s * step, 0.035);
  }

  return 32 * step; // ~10.24 seconds total
}

// ---------------------------------------------------------------------
// 2. NHẠC NỀN CHƯƠNG 2: TIẾN VÀO TU TIÊN GIỚI
// ---------------------------------------------------------------------
function scheduleChap2Cycle(ctx: AudioContext, dest: AudioNode, startTime: number): number {
  const step = 0.385; // ~78 BPM meditative
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
  const G5 = 783.99;
  const A5 = 880.0;

  // PHRASE A (Steps 0-15)
  playWarmDrone(ctx, dest, D3, startTime, step * 8, 0.18);
  playWarmDrone(ctx, dest, A3, startTime + step * 8, step * 8, 0.18);

  const phraseAGuzheng = [
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

  phraseAGuzheng.forEach((note) => {
    playGuzhengPluck(ctx, dest, note.f, startTime + note.t * step, step * 1.8, 0.26);
  });

  playFluteNote(ctx, dest, A4, startTime + 0.5 * step, step * 3.2, 0.20);
  playFluteNote(ctx, dest, D5, startTime + 4.5 * step, step * 3.2, 0.19);
  playFluteNote(ctx, dest, B4, startTime + 8.5 * step, step * 3.5, 0.19);
  playFluteNote(ctx, dest, G4, startTime + 12.5 * step, step * 3.2, 0.18);

  // PHRASE B (Steps 16-31)
  playWarmDrone(ctx, dest, G3, startTime + step * 16, step * 8, 0.18);
  playWarmDrone(ctx, dest, D4, startTime + step * 24, step * 8, 0.18);

  const phraseBGuzheng = [
    { f: E4, t: 16 },
    { f: G4, t: 17 },
    { f: B4, t: 18 },
    { f: D5, t: 19 },
    { f: E5, t: 20 },
    { f: G5, t: 21 },
    { f: E5, t: 22 },
    { f: D5, t: 23 },
    { f: B4, t: 24 },
    { f: A4, t: 25 },
    { f: G4, t: 26 },
    { f: E4, t: 27 },
    { f: D4, t: 28 },
    { f: E4, t: 29 },
    { f: G4, t: 30 },
    { f: A4, t: 31 },
  ];

  phraseBGuzheng.forEach((note) => {
    playGuzhengPluck(ctx, dest, note.f, startTime + note.t * step, step * 1.8, 0.26);
  });

  playFluteNote(ctx, dest, E5, startTime + 16.5 * step, step * 3.5, 0.20);
  playFluteNote(ctx, dest, G5, startTime + 20.5 * step, step * 3.2, 0.19);
  playFluteNote(ctx, dest, D5, startTime + 24.5 * step, step * 3.5, 0.19);
  playFluteNote(ctx, dest, A4, startTime + 28.5 * step, step * 3.5, 0.18);

  playPluck(ctx, dest, A5, startTime + 16 * step, step * 4.0, 0.12, 'sine');

  return 32 * step; // ~12.32 seconds total
}

// ---------------------------------------------------------------------
// 3. ÂM THANH CHUYỂN CẢNH: CỔNG DỊ GIỚI
// ---------------------------------------------------------------------
function scheduleTransitionCycle(ctx: AudioContext, dest: AudioNode, startTime: number): number {
  const portalScale = [
    196.0, 246.94, 293.66, 369.99, 440.0, 493.88, 587.33, 739.99, 880.0, 987.77, 1174.66, 1479.98,
  ];

  portalScale.forEach((freq, idx) => {
    playPluck(ctx, dest, freq, startTime + idx * 0.16, 1.2, 0.26, 'sine');
  });

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, startTime);
    osc.frequency.exponentialRampToValueAtTime(587.33, startTime + 3.0);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(0.24, startTime + 0.8);
    gain.gain.linearRampToValueAtTime(0.0001, startTime + 3.8);

    osc.connect(gain);
    gain.connect(dest);
    if (spaceSendGain) {
      gain.connect(spaceSendGain);
    }

    osc.start(startTime);
    osc.stop(startTime + 3.8);
  } catch {
    // Ignore
  }

  return 4.2;
}

// ---------------------------------------------------------------------
// 4. ÂM THANH KẾT THÚC: ĐỘ KIẾP PHI THĂNG & LỜI KẾT
// ---------------------------------------------------------------------
function scheduleOutroCycle(ctx: AudioContext, dest: AudioNode, startTime: number): number {
  const step = 0.32;
  const victoryNotes = [
    { f: 523.25, t: 0, dur: step * 2.5 },  // C5
    { f: 659.25, t: 1, dur: step * 2.0 },  // E5
    { f: 783.99, t: 2, dur: step * 2.0 },  // G5
    { f: 1046.5, t: 3, dur: step * 3.5 },  // C6
    { f: 880.0, t: 5, dur: step * 2.0 },   // A5
    { f: 1046.5, t: 6, dur: step * 2.0 },  // C6
    { f: 1174.66, t: 7, dur: step * 2.0 }, // D6
    { f: 1318.51, t: 8, dur: step * 3.5 }, // E6
    { f: 1046.5, t: 11, dur: step * 2.5 }, // C6
    { f: 783.99, t: 13, dur: step * 3.0 }, // G5
  ];

  playWarmDrone(ctx, dest, 130.81, startTime, step * 8, 0.20);
  playWarmDrone(ctx, dest, 196.0, startTime + step * 8, step * 8, 0.20);

  victoryNotes.forEach((note) => {
    playPluck(ctx, dest, note.f, startTime + note.t * step, note.dur, 0.30, 'triangle');
    playPluck(ctx, dest, note.f * 0.5, startTime + note.t * step, note.dur * 1.2, 0.16, 'sine');
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

  if (currentBgmTheme === theme && bgmLoopTimer !== null) {
    return;
  }

  stopBGM();
  currentBgmTheme = theme;

  try {
    const now = ctx.currentTime;
    bgmMasterGain.gain.cancelScheduledValues(now);
    bgmMasterGain.gain.setValueAtTime(0.001, now);
    bgmMasterGain.gain.linearRampToValueAtTime(MASTER_BGM_VOLUME, now + 0.4);
  } catch {
    // Ignore ramp errors
  }

  let nextScheduleTime = ctx.currentTime + 0.05;

  const loop = () => {
    if (!ctx || !bgmMasterGain || currentBgmTheme !== theme) return;

    if (nextScheduleTime < ctx.currentTime || nextScheduleTime > ctx.currentTime + 15) {
      nextScheduleTime = ctx.currentTime + 0.05;
    }

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
    const waitMs = Math.max(250, (cycleDuration - 0.45) * 1000);
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
      const now = audioCtx.currentTime;
      bgmMasterGain.gain.cancelScheduledValues(now);
      bgmMasterGain.gain.setValueAtTime(bgmMasterGain.gain.value, now);
      bgmMasterGain.gain.linearRampToValueAtTime(0.0001, now + 0.25);
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
