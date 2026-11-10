/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ZenCanvas, ZenCanvasHandle } from './components/ZenCanvas';
import { ZenControls } from './components/ZenControls';
import { GardenConfig, AmbientMood } from './types';
import { zenAudio } from './audio/ZenAudio';
import { xiaoXueVoice } from './audio/XiaoXueAudio';
import ecosystemConfig from './ecosystem-config.json';
import { ChevronLeft } from 'lucide-react';

const DEFAULT_CONFIG: GardenConfig = {
  koiCount: ecosystemConfig.ecosystemLimits.koi.default,
  frogCount: ecosystemConfig.ecosystemLimits.frog.default,
  grasshopperCount: ecosystemConfig.ecosystemLimits.grasshopper.default,
  dragonflyCount: ecosystemConfig.ecosystemLimits.dragonfly.default,
  turtleCount: ecosystemConfig.ecosystemLimits.turtle.default,
  showXiaoXue: ecosystemConfig.character.xiaoXue.enabledDefault,
  soundEnabled: true, // 靈泉流水自然環境音開關
  volume: ecosystemConfig.environment.defaultVolume, // 靈泉自然音量
  voiceEnabled: true, // 小雪修仙語音開關（100% 獨立）
  voiceVolume: 1.0, // 小雪語音音量（100% 獨立，清晰透徹）
  mood: ecosystemConfig.environment.defaultMood as AmbientMood,
};

const STORAGE_KEY = 'zen_spring_garden_config_v2';

export default function App() {
  const [config, setConfig] = useState<GardenConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // LocalStorage fallback
    }
    return DEFAULT_CONFIG;
  });

  const [showHint, setShowHint] = useState(true);
  const [subtitle, setSubtitle] = useState<string | null>(null);
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const zenCanvasRef = useRef<ZenCanvasHandle | null>(null);
  const lastTouchTimeRef = useRef(0);

  // 註冊小雪字幕回調與獨立音訊狀態初始化
  useEffect(() => {
    xiaoXueVoice.setSubtitleCallback((text) => {
      setSubtitle(text);
    });

    // 靈泉自然流水音（獨立控制）
    zenAudio.setMuted(!config.soundEnabled);
    zenAudio.setVolume(config.volume);

    // 小雪修仙語音（完全獨立控制，關閉流水聲不會關閉小雪）
    xiaoXueVoice.setMuted(!config.voiceEnabled);
    xiaoXueVoice.setVolume(config.voiceVolume ?? 1.0);
  }, []);

  // 5 秒後自動隱藏引導提示文字
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleConfigChange = (newConfig: GardenConfig) => {
    setConfig(newConfig);

    // 靈泉流水音（獨立）
    zenAudio.setMuted(!newConfig.soundEnabled);
    zenAudio.setVolume(newConfig.volume);

    // 小雪語音（獨立，雙靜音完全分離）
    xiaoXueVoice.setMuted(!newConfig.voiceEnabled);
    xiaoXueVoice.setVolume(newConfig.voiceVolume ?? 1.0);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch {
      // ignore
    }
  };

  const handleReset = () => {
    handleConfigChange(DEFAULT_CONFIG);
  };

  // 全域首次輕觸：解鎖瀏覽器音訊限制，自然啟動流水聲 + 播放小雪隨機迎賓問候 (A方案)
  const handleGlobalTouch = (e: React.SyntheticEvent) => {
    const now = Date.now();
    if (now - lastTouchTimeRef.current < 450) return;
    lastTouchTimeRef.current = now;

    zenAudio.ensureRunning();
    setHasInteracted(true);

    if (showHint) {
      setShowHint(false);
    }

    if (!hasPlayedIntro && config.showXiaoXue) {
      setHasPlayedIntro(true);
      xiaoXueVoice.playVoice('entry', config.mood);
    }
  };

  // 點擊小雪專屬熱區（右上石岸側坐觀魚處）
  const handleXiaoXueClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTouchTimeRef.current < 400) return;
    lastTouchTimeRef.current = now;

    zenAudio.ensureRunning();
    setHasInteracted(true);
    setHasPlayedIntro(true);

    if (showHint) {
      setShowHint(false);
    }

    // 觸發畫布上的灑靈米餌食物理動畫與錦鯉聚攏
    zenCanvasRef.current?.triggerFeed();
  };

  // 點擊返回母專案按鈕：播放第 10 句專屬送別語 (退回修仙世界)
  const handleReturnToMain = (e: React.MouseEvent) => {
    e.stopPropagation();
    zenAudio.ensureRunning();
    if (config.showXiaoXue) {
      xiaoXueVoice.playById('voice-10');
    }
  };

  return (
    <div
      onClick={handleGlobalTouch}
      className="relative w-screen h-[100dvh] bg-stone-950 flex items-center justify-center overflow-hidden"
    >
      {/* 桌面寬螢幕襯底：微光水墨光暈 */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-800 via-stone-900 to-stone-950" />

      {/* 9:16 手機比例核心視窗容器 */}
      <div className="relative w-full h-full max-h-[100dvh] max-w-[calc(100dvh*9/16)] aspect-[9/16] shadow-2xl overflow-hidden bg-stone-900 border-x border-stone-800/40">
        {/* 靈泉畫布 (錦鯉、青蛙、石岸、荷葉、水波物理、小雪觀魚) */}
        <ZenCanvas ref={zenCanvasRef} config={config} />

        {/* 小雪人物專屬點擊熱區（透明點擊層，保證在任何手機或瀏覽器點擊 100% 靈敏觸發） */}
        {config.showXiaoXue && (
          <button
            onClick={handleXiaoXueClick}
            className="absolute top-1 right-1 w-36 h-36 z-20 cursor-pointer rounded-3xl group focus:outline-none focus:ring-0 active:scale-95 transition-transform"
            title="點擊小雪：灑餌觀魚、溫柔陪伴"
            aria-label="與小雪互動"
          >
            {/* 幽微仙氣流動視覺反饋（觸碰時泛起金色微光） */}
            <div className="absolute inset-0 rounded-3xl border border-transparent group-hover:border-amber-400/20 group-active:border-amber-300/40 transition-colors pointer-events-none" />
          </button>
        )}

        {/* 上方頂部預留空間：母專案返回按鈕插槽 */}
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={handleReturnToMain}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900/40 hover:bg-stone-900/70 text-stone-300 hover:text-stone-100 border border-stone-700/40 backdrop-blur-xs text-xs tracking-wider transition-all"
            title="返回母專案"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>返回</span>
          </button>
        </div>

        {/* 首次進入的極簡浮動水墨引導 (4 秒後自動淡出) */}
        <div
          className={`absolute top-16 left-0 right-0 pointer-events-none flex justify-center transition-opacity duration-1000 ${
            showHint && !subtitle ? 'opacity-85' : 'opacity-0'
          }`}
        >
          <div className="px-3.5 py-1.5 rounded-full bg-stone-900/70 backdrop-blur-xs border border-stone-700/40 text-stone-200 text-xs tracking-wider flex items-center gap-2 shadow-lg">
            <span>{!hasInteracted ? '輕點水面或小雪 · 喚醒靈泉之境' : '輕點水面激起微瀾 · 點擊小雪灑餌引鯉 · 左上「泉」字調配生靈'}</span>
          </div>
        </div>

        {/* 小雪開口說話時的靈秀字幕橫幅 */}
        {subtitle && (
          <div className="absolute top-16 left-4 right-4 pointer-events-none flex justify-center z-30 transition-all duration-300 animate-in fade-in slide-in-from-top-2">
            <div className="max-w-[380px] px-4 py-2.5 rounded-2xl bg-stone-900/90 border border-amber-300/40 text-amber-100 text-xs tracking-wider shadow-2xl backdrop-blur-md flex items-start gap-2.5">
              <span className="text-amber-300 font-semibold shrink-0 mt-0.5">「小雪」:</span>
              <span className="leading-relaxed font-serif text-stone-200">{subtitle}</span>
            </div>
          </div>
        )}

        {/* 靈泉生靈抽屜（預設 100% 隱藏，點擊左上角返回按鈕下方的「泉」字按鈕滑出） */}
        <ZenControls
          config={config}
          onChangeConfig={handleConfigChange}
          onReset={handleReset}
        />
      </div>
    </div>
  );
}
