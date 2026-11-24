class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicEnabled = true;
    this.musicTimer = null;
    this.musicStep = 0;
    this.musicBus = null;
    this.noiseBuffer = null;
    this.trackId = "cosmic";
    this.feverActive = false;
  }

  ensureCtx() {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.musicBus = this.ctx.createGain();
        this.musicBus.gain.value = 0.55;
        this.musicBus.connect(this.ctx.destination);
        this.noiseBuffer = this.createNoiseBuffer(this.ctx);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    if (this.ctx && this.musicEnabled && !this.musicTimer) {
      this.startAmbientMusic();
    }
    return this.ctx;
  }

  createNoiseBuffer(ctx) {
    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  setTrack(themeId) {
    this.trackId = themeId || "cosmic";
  }

  setFeverMode(active) {
    this.feverActive = Boolean(active);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopAmbientMusic();
    else if (this.musicEnabled) this.startAmbientMusic();
    return this.muted;
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = enabled;
    if (!enabled || this.muted) {
      this.stopAmbientMusic();
    } else {
      this.ensureCtx();
      this.startAmbientMusic();
    }
    return this.musicEnabled;
  }

  playMusicNote(freq, dur, type, vol, cutoff = 1800, whenOffset = 0) {
    if (!this.ctx || !this.musicBus || !freq) return;
    const now = this.ctx.currentTime + whenOffset;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(this.feverActive ? cutoff * 1.45 : cutoff, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(filter).connect(gain).connect(this.musicBus);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  playKick(vol = 0.24) {
    if (!this.ctx || !this.musicBus) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(135, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.14);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain).connect(this.musicBus);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  playHat(vol = 0.045, open = false) {
    if (!this.ctx || !this.musicBus || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(open ? 5000 : 7500, now);

    const gain = this.ctx.createGain();
    const dur = open ? 0.11 : 0.04;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src.connect(filter).connect(gain).connect(this.musicBus);
    src.start(now);
    src.stop(now + dur + 0.01);
  }

  startAmbientMusic() {
    if (this.musicTimer || this.muted || !this.musicEnabled) return;

    // 32 adımlık (4 ölçülük) akor, bas ve melodi kalıpları
    const tracks = {
      cosmic: {
        chords: [
          [220.0, 261.63, 329.63], // Am
          [174.61, 220.0, 261.63], // F
          [261.63, 329.63, 392.0], // C
          [196.0, 246.94, 293.66], // G
        ],
        bass: [110.0, 87.31, 130.81, 98.0],
        melody: [
          440, 0, 523.25, 659.25, 587.33, 0, 523.25, 392,
          349.23, 0, 440, 523.25, 440, 0, 392, 329.63,
          523.25, 0, 659.25, 783.99, 659.25, 0, 523.25, 440,
          392, 493.88, 587.33, 0, 659.25, 587.33, 493.88, 0,
        ],
        leadType: "triangle",
      },
      cyber: {
        chords: [
          [164.81, 196.0, 246.94], // Em
          [130.81, 164.81, 196.0], // C
          [146.83, 174.61, 220.0], // Dm
          [123.47, 146.83, 185.0], // Bm
        ],
        bass: [82.41, 65.41, 73.42, 61.74],
        melody: [
          329.63, 392, 493.88, 392, 659.25, 0, 587.33, 493.88,
          261.63, 329.63, 392, 523.25, 493.88, 0, 392, 329.63,
          293.66, 349.23, 440, 587.33, 523.25, 0, 440, 349.23,
          246.94, 369.99, 493.88, 0, 587.33, 493.88, 392, 0,
        ],
        leadType: "sawtooth",
      },
      kawaii: {
        chords: [
          [261.63, 329.63, 392.0], // C
          [196.0, 246.94, 293.66], // G
          [220.0, 261.63, 329.63], // Am
          [174.61, 220.0, 261.63], // F
        ],
        bass: [130.81, 98.0, 110.0, 87.31],
        melody: [
          523.25, 659.25, 783.99, 0, 659.25, 783.99, 880, 0,
          783.99, 659.25, 587.33, 0, 493.88, 587.33, 659.25, 0,
          440, 523.25, 659.25, 0, 523.25, 659.25, 783.99, 0,
          698.46, 659.25, 587.33, 523.25, 587.33, 0, 523.25, 0,
        ],
        leadType: "sine",
      },
    };

    this.musicTimer = setInterval(() => {
      if (this.muted || !this.musicEnabled || !this.ctx || this.ctx.state !== "running") {
        return;
      }

      const track = tracks[this.trackId] || tracks.cosmic;
      const step = this.musicStep % 32;
      const bar = Math.floor(step / 8);
      const stepInBar = step % 8;
      this.musicStep += 1;

      // 1. Yumuşak Pad Akorları (her ölçü başında)
      if (stepInBar === 0) {
        const chord = track.chords[bar];
        chord.forEach((f) => this.playMusicNote(f, 1.9, "sine", 0.032, 950));
      }

      // 2. Nabız Bas (1, 3, 5, 7. adımlarda)
      const bassFreq = track.bass[bar];
      if (stepInBar % 2 === 0) {
        const oct = stepInBar === 6 ? bassFreq * 2 : bassFreq;
        this.playMusicNote(oct, 0.24, "triangle", 0.11, 480);
      }

      // 3. Melodi Lead
      const melFreq = track.melody[step];
      if (melFreq > 0) {
        this.playMusicNote(melFreq, 0.28, track.leadType, 0.065, 1900);
      }

      // 4. Lo-Fi / Synthwave Ritim (Kick & Hi-Hat)
      if (stepInBar === 0 || stepInBar === 4) {
        this.playKick(0.22);
      }
      if (stepInBar % 2 === 1) {
        this.playHat(0.038, stepInBar === 7);
      }
    }, 250);
  }

  stopAmbientMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  playDrop() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.09);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  playMerge(tier, combo = 1) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const baseFreq = 240 + tier * 38 + Math.min(combo, 6) * 40;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.45, now + 0.14);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  playLaser() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.22);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  playQuake() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(85, now);
    osc.frequency.linearRampToValueAtTime(52, now + 0.28);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  playZeroG() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.3);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  playSwap() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.08);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  playQuantum() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [380, 570, 760].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      gain.gain.setValueAtTime(0.14, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.16);
    });
  }

  playLevelUp() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [330, 440, 554.37, 659.25].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.16, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.22);
    });
  }

  playIceBreak() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.12);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playMagnet() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.25);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playGameOver() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.45);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  }
}

export const sound = new SoundEngine();
