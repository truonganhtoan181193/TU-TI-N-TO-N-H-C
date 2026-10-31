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
// SOUND EFFECTS (SFX) — Rich traditional acoustic timbre & crispness
// ---------------------------------------------------------------------
export function playSound(
  type: 'correct' | 'wrong' | 'levelup' | 'tick' | 'magic' | 'thunder' | 'warp',
  enabled = true,
  chapter: 1 | 2 = 1
) {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dest = masterCompressor || ctx.destination;

    if (type === 'correct') {
      if (chapter === 2) {
        // CHƯƠNG 2: TIẾNG GẢY ĐÀN TRANH (Guzheng Arpeggio Cổ Phong)
        // Chuỗi ngũ cung ngân vang dạt dào thanh thoát: D5, E5, G5, A5, D6
        const guzhengNotes = [587.33, 659.25, 783.99, 880.0, 1174.66];
        guzhengNotes.forEach((freq, idx) => {
          const t = now + idx * 0.055;
          playGuzhengPluck(ctx, dest, freq, t, 0.95, 0.28);
        });
      } else {
        // CHƯƠNG 1: TIẾNG KHÁNH ĐÁ CỔ (Ancient Stone Chime Bells)
        // Chuỗi chuông đá cổ kính trong vắt ngân xa: F5, A5, C6
        const stoneChimes = [698.46, 880.0, 1046.5];
        stoneChimes.forEach((freq, idx) => {
          const t = now + idx * 0.07;
          playPluck(ctx, dest, freq, t, 0.85, 0.30, 'triangle', true);
        });
      }
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
      playLevelUpAudio(chapter, enabled);
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
    } else if (type === 'thunder') {
      playTribulationThunder(enabled);
    } else if (type === 'warp') {
      playWarpSound(enabled);
    }
  } catch {
    // Ignore audio errors
  }
}

/**
 * Hiệu ứng sấm sét độ kiếp (Heavenly Tribulation Thunder)
 * Âm thanh sấm chớp rền vang đa tầng:
 * - Tia sét xé toạc không gian (High crackle impulse)
 * - Sấm dội trầm hùng (Sub-bass thunder rumble 45-85Hz)
 * - Tiếng vọng thiên lôi rền dài (Reverberant rolling decay)
 */
export function playTribulationThunder(enabled = true) {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dest = masterCompressor || ctx.destination;

    // 1. Initial lightning crack (Tia chớp đánh giáng)
    const crackLen = Math.floor(ctx.sampleRate * 0.12);
    const crackBuf = ctx.createBuffer(1, crackLen, ctx.sampleRate);
    const crackData = crackBuf.getChannelData(0);
    for (let i = 0; i < crackLen; i++) {
      crackData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (crackLen * 0.2));
    }
    const crackSrc = ctx.createBufferSource();
    crackSrc.buffer = crackBuf;

    const crackFilter = ctx.createBiquadFilter();
    crackFilter.type = 'highpass';
    crackFilter.frequency.setValueAtTime(800, now);

    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(0.45, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    crackSrc.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(dest);
    crackSrc.start(now);

    // 2. Heavy Sub-bass thunder impact (Sấm giáng trầm bổng)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(95, now + 0.04);
    subOsc.frequency.exponentialRampToValueAtTime(42, now + 0.7);

    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.55, now + 0.08);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    subOsc.connect(subGain);
    subGain.connect(dest);
    subOsc.start(now);
    subOsc.stop(now + 1.2);

    // 3. Deep rolling thunder rumble (Tiếng sấm rền cuồn cuộn 2.4s)
    const rumbleLen = Math.floor(ctx.sampleRate * 2.2);
    const rumbleBuf = ctx.createBuffer(1, rumbleLen, ctx.sampleRate);
    const rumbleData = rumbleBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < rumbleLen; i++) {
      // Brown noise for deep rumbling
      const white = Math.random() * 2 - 1;
      last = (last + 0.03 * white) / 1.03;
      rumbleData[i] = last * 3.5;
    }
    const rumbleSrc = ctx.createBufferSource();
    rumbleSrc.buffer = rumbleBuf;

    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(140, now);
    rumbleFilter.frequency.linearRampToValueAtTime(80, now + 1.8);

    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.01, now);
    rumbleGain.gain.linearRampToValueAtTime(0.48, now + 0.2);
    rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

    rumbleSrc.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(dest);
    if (spaceSendGain) {
      rumbleGain.connect(spaceSendGain);
    }

    rumbleSrc.start(now + 0.05);
  } catch {
    // Ignore audio errors
  }
}

/**
 * Âm thanh cổng xoáy dị giới (Portal Warp sound)
 */
export function playWarpSound(enabled = true) {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dest = masterCompressor || ctx.destination;

    // Resonant vortex sweep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.5);
    osc.frequency.exponentialRampToValueAtTime(220, now + 1.1);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(250, now);
    filter.frequency.exponentialRampToValueAtTime(1600, now + 0.5);
    filter.frequency.exponentialRampToValueAtTime(400, now + 1.1);
    filter.Q.value = 4.0;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    if (spaceSendGain) {
      gain.connect(spaceSendGain);
    }

    osc.start(now);
    osc.stop(now + 1.1);
  } catch {
    // Ignore
  }
}

/**
 * Âm thanh giọt nước thánh thót trong hang ngầm cổ tích (Chương 1 Ambient)
 */
function playCavernWaterDrop(ctx: AudioContext, dest: AudioNode, time: number) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';

    const baseFreq = 1400 + Math.random() * 600;
    osc.frequency.setValueAtTime(baseFreq, time);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, time + 0.02);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, time + 0.12);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.14, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);

    osc.connect(gain);
    gain.connect(dest);
    if (spaceSendGain) {
      gain.connect(spaceSendGain); // Reverb in ancient cave
    }

    osc.start(time);
    osc.stop(time + 0.28);
  } catch {
    // Ignore
  }
}

/**
 * Âm thanh chuông gió thanh tao trên thiên sơn (Chương 2 Ambient)
 */
function playCelestialWindChime(ctx: AudioContext, dest: AudioNode, time: number) {
  try {
    // Delicate ethereal cluster: 3 crystalline tones
    const freqs = [2349.32, 2793.83, 3520.0];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const offset = idx * 0.04;
      osc.frequency.setValueAtTime(freq, time + offset);

      gain.gain.setValueAtTime(0.0001, time + offset);
      gain.gain.linearRampToValueAtTime(0.08 / (idx + 1), time + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + offset + 0.75);

      osc.connect(gain);
      gain.connect(dest);
      if (spaceSendGain) {
        gain.connect(spaceSendGain);
      }

      osc.start(time + offset);
      osc.stop(time + offset + 0.75);
    });
  } catch {
    // Ignore
  }
}

/**
 * Âm thanh thăng cấp cảnh giới / giải khai phong ấn đa tầng (Multi-layered Level-up Audio)
 * - Tầng 1 (Trầm): Cú chạm âm vực thấp (Sub-bass impact 60-120Hz) tạo độ uy lực, rung chuyển
 * - Tầng 2 (Giai điệu): Chuỗi thang ngũ cung cổ xưa (Chương 1: Tiếng chuông đá di tích; Chương 2: Đàn tranh & sáo tiên)
 * - Tầng 3 (Cao độ): Bụi sao tinh tú lấp lánh (Crystal sparkles 2000-4500Hz)
 * - Tầng 4 (Ngân vang): Chuông vàng đại điện / chuông bát tiên ngân vang 2.5s lan tỏa trong không gian
 */
export function playLevelUpAudio(chapter: 1 | 2 = 2, enabled = true) {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dest = masterCompressor || ctx.destination;

    // -------------------------------------------------------------
    // TẦNG 1: SUB-BASS RESONANT IMPACT (Uy lực trầm bổng)
    // -------------------------------------------------------------
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    const subStartFreq = chapter === 1 ? 65.41 : 73.42; // C2 / D2
    subOsc.frequency.setValueAtTime(subStartFreq, now);
    subOsc.frequency.exponentialRampToValueAtTime(subStartFreq * 1.5, now + 0.12);
    subOsc.frequency.exponentialRampToValueAtTime(32.7, now + 0.6);

    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.38, now + 0.02);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

    subOsc.connect(subGain);
    subGain.connect(dest);
    subOsc.start(now);
    subOsc.stop(now + 0.7);

    // -------------------------------------------------------------
    // TẦNG 2: ASCENDING MELODIC GLISSANDO / RUN (Giai điệu thăng hoa)
    // -------------------------------------------------------------
    // Chapter 1: Ancient Ruins stone chime run (D4, F4, A4, C5, D5, F5, A5)
    // Chapter 2: Immortal Cultivation Guzheng ascendance (D4, E4, G4, A4, B4, D5, E5, G5, A5, D6)
    const notes =
      chapter === 1
        ? [293.66, 349.23, 440.0, 523.25, 587.33, 698.46, 880.0]
        : [293.66, 329.63, 392.0, 440.0, 493.88, 587.33, 659.25, 783.99, 880.0, 1174.66];

    const noteStep = chapter === 1 ? 0.065 : 0.055;
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = chapter === 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * noteStep);

      const noteDuration = 0.45;
      gain.gain.setValueAtTime(0.001, now + idx * noteStep);
      gain.gain.linearRampToValueAtTime(0.24, now + idx * noteStep + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * noteStep + noteDuration);

      osc.connect(gain);
      gain.connect(dest);
      if (spaceSendGain) {
        gain.connect(spaceSendGain);
      }

      osc.start(now + idx * noteStep);
      osc.stop(now + idx * noteStep + noteDuration);
    });

    // -------------------------------------------------------------
    // TẦNG 3: CELESTIAL CRYSTAL SPARKLES (Bụi sao tinh thể lấp lánh)
    // -------------------------------------------------------------
    const sparkleCount = 6;
    for (let i = 0; i < sparkleCount; i++) {
      const sparkTime = now + 0.15 + i * 0.06;
      const sparkOsc = ctx.createOscillator();
      const sparkGain = ctx.createGain();
      sparkOsc.type = 'sine';
      const sparkFreq = 1800 + Math.random() * 2400; // 1800Hz - 4200Hz
      sparkOsc.frequency.setValueAtTime(sparkFreq, sparkTime);

      sparkGain.gain.setValueAtTime(0.0001, sparkTime);
      sparkGain.gain.linearRampToValueAtTime(0.12, sparkTime + 0.01);
      sparkGain.gain.exponentialRampToValueAtTime(0.0001, sparkTime + 0.25);

      sparkOsc.connect(sparkGain);
      sparkGain.connect(dest);
      if (spaceSendGain) {
        sparkGain.connect(spaceSendGain);
      }

      sparkOsc.start(sparkTime);
      sparkOsc.stop(sparkTime + 0.25);
    }

    // -------------------------------------------------------------
    // TẦNG 4: SACRED TEMPLE GONG / GOLDEN BELL SUSTAIN (Chuông đồng ngân dài)
    // -------------------------------------------------------------
    const bellFund = chapter === 1 ? 440.0 : 587.33; // A4 for Ruin bell / D5 for Xianxia Golden Bell
    const bellHarmonics = [1, 2, 2.76, 4];
    bellHarmonics.forEach((harmonic, idx) => {
      const bellOsc = ctx.createOscillator();
      const bellGain = ctx.createGain();
      bellOsc.type = 'sine';
      bellOsc.frequency.setValueAtTime(bellFund * harmonic, now + 0.1);

      const bellVolume = 0.18 / (idx + 1);
      const bellDuration = 2.2 - idx * 0.3;
      bellGain.gain.setValueAtTime(0.0001, now + 0.1);
      bellGain.gain.linearRampToValueAtTime(bellVolume, now + 0.13);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1 + bellDuration);

      bellOsc.connect(bellGain);
      bellGain.connect(dest);
      if (spaceSendGain) {
        bellGain.connect(spaceSendGain);
      }

      bellOsc.start(now + 0.1);
      bellOsc.stop(now + 0.1 + bellDuration);
    });
  } catch {
    // Ignore audio error
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

  // AMBIENT SOUNDSCAPE: Tiếng giọt nước thánh thót rơi xa xa trong di tích cổ
  playCavernWaterDrop(ctx, dest, startTime + 2.4 * step);
  playCavernWaterDrop(ctx, dest, startTime + 14.8 * step);
  playCavernWaterDrop(ctx, dest, startTime + 25.2 * step);

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

  // AMBIENT SOUNDSCAPE: Tiếng chuông gió thanh tao ngân nga lưng chừng tiên sơn
  playCelestialWindChime(ctx, dest, startTime + 3.2 * step);

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
  playCelestialWindChime(ctx, dest, startTime + 19.5 * step);

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
