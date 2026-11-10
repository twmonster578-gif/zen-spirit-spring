/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// 靈泉自然聲音合成引擎 (Web Audio API)
class ZenAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private waterGain: GainNode | null = null;
  private waterSource: AudioNode | null = null;
  private isInitialized = false;
  private isMuted = false;
  private targetVolume = 0.6;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.targetVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.startAmbientWater();
      this.isInitialized = true;
    } catch {
      // AudioContext unavailable or restricted
    }
  }

  // 使用者初次點擊時啟動音訊環境
  public ensureRunning() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(volume: number) {
    this.targetVolume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.masterGain && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.targetVolume, this.ctx.currentTime, 0.05);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.masterGain) {
      const val = muted ? 0 : this.targetVolume;
      this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.08);
    }
  }

  public getContext(): AudioContext | null {
    this.ensureRunning();
    return this.ctx;
  }

  public getMasterGain(): GainNode | null {
    return this.masterGain;
  }

  // 說話時微幅壓低流水白噪音 (Ducking)，說完自然回升，避免互相干擾
  public duckAmbientWater(duck: boolean) {
    if (this.ctx && this.waterGain) {
      const target = duck ? 0.06 : 0.28;
      this.waterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.12);
    }
  }

  // 1. 程序化微風流水環境音
  private startAmbientWater() {
    if (!this.ctx || !this.masterGain) return;

    // 建立 4 秒粉紅/白噪音循環緩衝區
    const bufferSize = this.ctx.sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // 低通與帶通濾波器模擬潺潺水流
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    // 水流起伏 LFO
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.25, this.ctx.currentTime); // 每 4 秒一個微風波浪

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(120, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    this.waterGain = this.ctx.createGain();
    this.waterGain.gain.setValueAtTime(0.28, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.waterGain);
    this.waterGain.connect(this.masterGain);

    whiteNoise.start();
    lfo.start();
    this.waterSource = whiteNoise;
  }

  // 2. 蟋蟀／蚱蜢鳴叫聲
  public playCricketChirp(panX = 0) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.ensureRunning();

    try {
      const now = this.ctx.currentTime;
      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      if (panner) {
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, panX)), now);
      }

      // 產生 3~4 次連綴高頻振翅音 (4800Hz)
      const chirpCount = Math.floor(Math.random() * 2) + 3;
      const baseFreq = 4600 + Math.random() * 500;

      for (let i = 0; i < chirpCount; i++) {
        const startTime = now + i * 0.045;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq + Math.sin(i) * 120, startTime);

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.06, startTime + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.038);

        osc.connect(gain);
        if (panner) {
          gain.connect(panner);
          panner.connect(this.masterGain);
        } else {
          gain.connect(this.masterGain);
        }

        osc.start(startTime);
        osc.stop(startTime + 0.04);
      }
    } catch {
      // Audio error fallback
    }
  }

  // 3. 青蛙鳴叫聲 (呱／嘓)
  public playFrogCroak(panX = 0) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.ensureRunning();

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      const baseFreq = 210 + Math.random() * 40;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.85, now + 0.22);

      // 共鳴濾波器
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(620, now);
      filter.Q.setValueAtTime(4.5, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.09, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // Audio error fallback
    }
  }

  // 4. 青蛙落水撲通水花聲
  public playWaterSplash(panX = 0) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.ensureRunning();

    try {
      const now = this.ctx.currentTime;

      // 快速音調下降模擬落水「咚～」
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.16);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.23);

      // 水花衝擊短雜訊
      const noiseDuration = 0.08;
      const noiseBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * noiseDuration), this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < output.length; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.02));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(800, now);
      noiseFilter.Q.setValueAtTime(2.0, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.07, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + noiseDuration);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      noise.start(now);
    } catch {
      // Audio error fallback
    }
  }

  // 5. 輕觸水面水滴漣漪鐘音
  public playDropChime() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.ensureRunning();

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // 五度音程的清澈水滴音 (587Hz ~ 880Hz)
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      const freq = freqs[Math.floor(Math.random() * freqs.length)];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 1.2, now);
      osc.frequency.exponentialRampToValueAtTime(freq, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch {
      // Audio error fallback
    }
  }

  public dispose() {
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {
        // cleanup
      }
      this.ctx = null;
    }
  }
}

export const zenAudio = new ZenAudioEngine();
