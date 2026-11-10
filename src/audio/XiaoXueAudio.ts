/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { zenAudio } from './ZenAudio';

export interface VoiceLine {
  id: string;
  src: string;
  text: string;
  tags: ('entry' | 'feed' | 'general' | 'night' | 'exit')[];
}

// 乾淨規範的 10 首專屬 44.1kHz MP3 音檔路徑（經由原生播放器實證可 100% 順暢發聲）
export const XIAOXUE_VOICE_TRACKS: VoiceLine[] = [
  {
    id: 'voice-01',
    src: '/assets/audio/xiaoxue_01.mp3',
    text: '你來啦，把外頭那些繁雜的瑣事，先留在泉水之外吧……',
    tags: ['entry', 'general'],
  },
  {
    id: 'voice-02',
    src: '/assets/audio/xiaoxue_02.mp3',
    text: '閉上眼，深吸一口靈泉邊的清氣……慢下來，才算是真正的修行呢。',
    tags: ['entry', 'general'],
  },
  {
    id: 'voice-03',
    src: '/assets/audio/xiaoxue_03.mp3',
    text: '人間紛紛擾擾，辛苦你了。這裡是我為你留的一方淨土……',
    tags: ['entry', 'general'],
  },
  {
    id: 'voice-04',
    src: '/assets/audio/xiaoxue_04.mp3',
    text: '你看那幾尾錦鯉，游得那樣從容……我們今日也學學牠們吧？',
    tags: ['general'],
  },
  {
    id: 'voice-05',
    src: '/assets/audio/xiaoxue_05.mp3',
    text: '岸邊石縫裡的小傢伙又在唱歌了……能安靜聽完一曲蟲鳴，便已是仙境了。',
    tags: ['general'],
  },
  {
    id: 'voice-06',
    src: '/assets/audio/xiaoxue_06.mp3',
    text: '不用急著做什麼，也不用急著去哪裡。在這靈泉畔，光陰本該用在美好事物上。',
    tags: ['general'],
  },
  {
    id: 'voice-07',
    src: '/assets/audio/xiaoxue_07.mp3',
    text: '瞧，一把靈米灑下去，牠們全都歡喜地圍上來了……',
    tags: ['feed'],
  },
  {
    id: 'voice-08',
    src: '/assets/audio/xiaoxue_08.mp3',
    text: '一指微瀾，水波就這樣一圈圈漾開了，所有焦慮與煩心都隨之散去吧……',
    tags: ['general', 'feed'],
  },
  {
    id: 'voice-09',
    src: '/assets/audio/xiaoxue_09.mp3',
    text: '夜深了，靈泉的風也柔了許多……小雪會一直守在這兒，祝你好夢。',
    tags: ['night'],
  },
  {
    id: 'voice-10',
    src: '/assets/audio/xiaoxue_10.mp3',
    text: '要回凡塵去闖蕩了嗎？記得把靈泉的這份安寧帶在身上……累了隨時回來。',
    tags: ['exit'],
  },
];

class XiaoXueVoiceManager {
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private currentSource: AudioBufferSourceNode | null = null;
  private audioPlayer: HTMLAudioElement | null = null;
  private voiceGain: GainNode | null = null;

  private lastPlayedId: string | null = null;
  private lastPlayTimestamp = 0;
  private volume = 1.0;
  private isMuted = false;
  private isCurrentlyPlaying = false;

  private onSubtitleChangeCallback: ((text: string | null) => void) | null = null;
  private onPlayingStateCallback: ((playing: boolean) => void) | null = null;
  private diagnosticLogs: string[] = [];
  private onDiagnosticCallback: ((logs: string[]) => void) | null = null;

  private getAudioPlayer(): HTMLAudioElement {
    if (!this.audioPlayer && typeof window !== 'undefined') {
      this.audioPlayer = new Audio();
    }
    return this.audioPlayer!;
  }

  public log(msg: string) {
    const time = new Date().toTimeString().split(' ')[0];
    const line = `[${time}] ${msg}`;
    this.diagnosticLogs.unshift(line);
    if (this.diagnosticLogs.length > 20) {
      this.diagnosticLogs.pop();
    }
    if (this.onDiagnosticCallback) {
      this.onDiagnosticCallback([...this.diagnosticLogs]);
    }
    console.log('[XiaoXueAudio]', msg);
  }

  public setDiagnosticCallback(cb: (logs: string[]) => void) {
    this.onDiagnosticCallback = cb;
    cb([...this.diagnosticLogs]);
  }

  public getDiagnosticLogs(): string[] {
    return [...this.diagnosticLogs];
  }

  public setSubtitleCallback(cb: (text: string | null) => void) {
    this.onSubtitleChangeCallback = cb;
  }

  public setPlayingStateCallback(cb: (playing: boolean) => void) {
    this.onPlayingStateCallback = cb;
  }

  public getIsPlaying(): boolean {
    return this.isCurrentlyPlaying;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audioPlayer) {
      this.audioPlayer.volume = this.isMuted ? 0 : this.volume;
    }
    if (this.voiceGain && zenAudio.getContext()) {
      const ctx = zenAudio.getContext()!;
      this.voiceGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume * 1.5, ctx.currentTime, 0.05);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.audioPlayer) {
      this.audioPlayer.volume = muted ? 0 : this.volume;
    }
    if (this.voiceGain && zenAudio.getContext()) {
      const ctx = zenAudio.getContext()!;
      this.voiceGain.gain.setTargetAtTime(muted ? 0 : this.volume * 1.5, ctx.currentTime, 0.08);
    }
  }

  public isNightTime(manualMood?: string): boolean {
    if (manualMood === 'night') return true;
    const hour = new Date().getHours();
    return hour >= 21 || hour < 5;
  }

  // 測試純音
  public async playTestBeep(): Promise<boolean> {
    this.log('發送晶瑩測試純音 (587Hz -> 880Hz)...');
    zenAudio.ensureRunning();
    const ctx = zenAudio.getContext();
    if (!ctx) {
      this.log('錯誤: 無法取得 AudioContext');
      return false;
    }

    try {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      this.log(`AudioContext 狀態: ${ctx.state}`);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.32);
      this.log('測試純音已送達揚聲器！');
      return true;
    } catch (err) {
      this.log(`測試純音失敗: ${String(err)}`);
      return false;
    }
  }

  // 播放指定標籤或隨機對話
  public playVoice(
    tag: 'entry' | 'feed' | 'general' | 'night' | 'exit',
    currentMood?: string
  ): VoiceLine | null {
    if (this.isMuted) {
      this.log('目前處於靜音模式，不播放');
      return null;
    }

    const now = Date.now();
    if (now - this.lastPlayTimestamp < 350) {
      return null;
    }

    let candidates = XIAOXUE_VOICE_TRACKS.filter((track) => track.tags.includes(tag));
    const isNight = this.isNightTime(currentMood);
    if (isNight && tag !== 'exit') {
      const nightTracks = XIAOXUE_VOICE_TRACKS.filter((t) => t.tags.includes('night'));
      candidates = [...candidates, ...nightTracks, ...nightTracks];
    } else {
      candidates = candidates.filter((t) => !t.tags.includes('night') || t.tags.includes(tag));
    }

    if (candidates.length === 0) return null;

    let pool = candidates;
    if (candidates.length > 1 && this.lastPlayedId) {
      pool = candidates.filter((t) => t.id !== this.lastPlayedId);
    }

    const selected = pool[Math.floor(Math.random() * pool.length)];
    this.executePlay(selected);
    return selected;
  }

  public playById(id: string): VoiceLine | null {
    const target = XIAOXUE_VOICE_TRACKS.find((t) => t.id === id);
    if (!target) return null;
    this.executePlay(target);
    return target;
  }

  public playRandom(): VoiceLine | null {
    const candidates = XIAOXUE_VOICE_TRACKS.filter((t) => t.id !== this.lastPlayedId);
    const selected = candidates[Math.floor(Math.random() * candidates.length)] || XIAOXUE_VOICE_TRACKS[0];
    this.executePlay(selected);
    return selected;
  }

  // 核心執行播放：使用實測成功的標準 HTML5 音訊元件播放新 MP3
  private async executePlay(track: VoiceLine) {
    this.lastPlayTimestamp = Date.now();
    this.lastPlayedId = track.id;
    this.log(`開始播放 [${track.id}]: "${track.text.substring(0, 15)}..."`);

    // 停止前一段
    this.stopCurrentAudioOnly();

    // 啟動環境音
    zenAudio.ensureRunning();

    // 顯示字幕
    this.isCurrentlyPlaying = true;
    if (this.onPlayingStateCallback) {
      this.onPlayingStateCallback(true);
    }
    if (this.onSubtitleChangeCallback) {
      this.onSubtitleChangeCallback(track.text);
    }

    // 壓低背景水流
    zenAudio.duckAmbientWater(true);

    const onPlayFinished = () => {
      this.isCurrentlyPlaying = false;
      zenAudio.duckAmbientWater(false);
      if (this.onPlayingStateCallback) {
        this.onPlayingStateCallback(false);
      }
      if (this.onSubtitleChangeCallback) {
        this.onSubtitleChangeCallback(null);
      }
      this.log(`語音 [${track.id}] 播放完畢，恢復背景流水音量`);
    };

    // 優先使用實證 100% 能響的原生 HTML5 音訊播放器
    try {
      const audio = this.getAudioPlayer();
      audio.src = track.src;
      audio.currentTime = 0;
      audio.volume = this.isMuted ? 0 : Math.max(0.2, this.volume);

      audio.onended = () => {
        onPlayFinished();
      };

      audio.onerror = (e) => {
        this.log(`HTML Audio 發生錯誤，改走 WebAudio 管道: ${String(e)}`);
        this.playViaWebAudio(track, onPlayFinished);
      };

      await audio.play();
      this.log(`[成功] 語音 [${track.id}] 正在播放中！`);
      return;
    } catch (err) {
      this.log(`HTML Audio 播放受阻: ${String(err)}，改走 Web Audio 解碼...`);
      await this.playViaWebAudio(track, onPlayFinished);
    }
  }

  private async playViaWebAudio(track: VoiceLine, onFinish: () => void): Promise<boolean> {
    const ctx = zenAudio.getContext();
    if (!ctx) {
      onFinish();
      return false;
    }

    try {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      let buffer = this.bufferCache.get(track.id);
      if (!buffer) {
        const res = await fetch(track.src);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuf = await res.arrayBuffer();
        buffer = await ctx.decodeAudioData(arrayBuf);
        this.bufferCache.set(track.id, buffer);
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      if (!this.voiceGain) {
        this.voiceGain = ctx.createGain();
      }
      this.voiceGain.gain.setValueAtTime(this.isMuted ? 0 : Math.max(0.2, this.volume * 1.5), ctx.currentTime);

      source.connect(this.voiceGain);
      this.voiceGain.connect(ctx.destination);

      source.onended = () => {
        if (this.currentSource === source) {
          this.currentSource = null;
        }
        onFinish();
      };

      this.currentSource = source;
      source.start(0);
      this.log(`Web Audio 節點已啟動，長度 ${buffer.duration.toFixed(2)} 秒`);
      return true;
    } catch (e) {
      this.log(`Web Audio 解碼失敗: ${String(e)}`);
      onFinish();
      return false;
    }
  }

  private stopCurrentAudioOnly() {
    if (this.audioPlayer) {
      try {
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
      } catch {
        // ignore
      }
    }

    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {
        // ignore
      }
      this.currentSource = null;
    }
  }

  public stop() {
    this.stopCurrentAudioOnly();
    this.isCurrentlyPlaying = false;
    zenAudio.duckAmbientWater(false);
    if (this.onPlayingStateCallback) {
      this.onPlayingStateCallback(false);
    }
    if (this.onSubtitleChangeCallback) {
      this.onSubtitleChangeCallback(null);
    }
  }
}

export const xiaoXueVoice = new XiaoXueVoiceManager();
