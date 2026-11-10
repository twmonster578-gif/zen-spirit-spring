/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GardenConfig, AmbientMood } from '../types';
import { zenAudio } from '../audio/ZenAudio';
import { xiaoXueVoice } from '../audio/XiaoXueAudio';
import { Volume2, VolumeX, RotateCcw, X, Plus, Minus, Sun, Moon, Sunrise, Sunset, Activity, Play, Volume1 } from 'lucide-react';
import ecosystemConfig from '../ecosystem-config.json';

interface ZenControlsProps {
  config: GardenConfig;
  onChangeConfig: (newConfig: GardenConfig) => void;
  onReset: () => void;
}

export const ZenControls: React.FC<ZenControlsProps> = ({
  config,
  onChangeConfig,
  onReset,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    xiaoXueVoice.setDiagnosticCallback((newLogs) => {
      setLogs([...newLogs]);
    });
  }, []);

  const limits = ecosystemConfig.ecosystemLimits;

  const handleUpdate = (updates: Partial<GardenConfig>) => {
    const updated = { ...config, ...updates };
    onChangeConfig(updated);

    if (updates.volume !== undefined) {
      zenAudio.setVolume(updates.volume);
    }
    if (updates.soundEnabled !== undefined) {
      zenAudio.setMuted(!updates.soundEnabled);
    }
    if (updates.voiceVolume !== undefined) {
      xiaoXueVoice.setVolume(updates.voiceVolume);
    }
    if (updates.voiceEnabled !== undefined) {
      xiaoXueVoice.setMuted(!updates.voiceEnabled);
    }
  };

  const toggleAmbientSound = () => {
    zenAudio.ensureRunning();
    handleUpdate({ soundEnabled: !config.soundEnabled });
  };

  const toggleVoiceSound = () => {
    zenAudio.ensureRunning();
    handleUpdate({ voiceEnabled: !config.voiceEnabled });
  };

  const adjustCount = (
    key: 'koiCount' | 'frogCount' | 'grasshopperCount' | 'dragonflyCount' | 'turtleCount',
    delta: number,
    min: number,
    max: number
  ) => {
    zenAudio.ensureRunning();
    const current = config[key];
    const next = Math.max(min, Math.min(max, current + delta));
    handleUpdate({ [key]: next });
  };

  const creatureItems = [
    {
      key: 'koiCount' as const,
      spec: limits.koi,
      valColor: 'text-amber-200',
    },
    {
      key: 'frogCount' as const,
      spec: limits.frog,
      valColor: 'text-emerald-300',
    },
    {
      key: 'grasshopperCount' as const,
      spec: limits.grasshopper,
      valColor: 'text-lime-300',
    },
    {
      key: 'dragonflyCount' as const,
      spec: limits.dragonfly,
      valColor: 'text-sky-300',
    },
    {
      key: 'turtleCount' as const,
      spec: limits.turtle,
      valColor: 'text-teal-300',
    },
  ];

  return (
    <>
      {/* 放置在左上角「返回」按鈕正下方 */}
      <div className="absolute top-[3.75rem] left-4 z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            zenAudio.ensureRunning();
            setIsOpen(!isOpen);
          }}
          className={`group flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-300 shadow-sm ${
            isOpen
              ? 'bg-stone-800/90 text-amber-200 border-amber-300/40 rotate-45'
              : 'bg-stone-900/40 hover:bg-stone-900/70 text-stone-300/90 hover:text-stone-100 border-stone-700/40 backdrop-blur-xs'
          }`}
          title="調配靈泉生靈數量"
          aria-label="靈泉選單"
        >
          {isOpen ? (
            <X className="w-4 h-4 transition-transform" />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <span className="text-xs font-semibold tracking-widest text-stone-200/90">泉</span>
            </div>
          )}
        </button>
      </div>

      {/* 點擊遮罩（點擊空白處自動淡出抽屜） */}
      {isOpen && (
        <div
          className="absolute inset-0 z-20 bg-black/30 backdrop-blur-[2px] transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        />
      )}

      {/* 置頂滑出式竹紙禪意控制面板（靠上方顯示，附帶頂部返回鍵） */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute top-2 left-2 right-2 z-30 transform transition-all duration-300 ease-out max-h-[95dvh] flex flex-col ${
          isOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-[420px] w-full mx-auto bg-stone-900/95 text-stone-200 rounded-3xl border border-stone-700/60 shadow-2xl p-4 sm:p-5 backdrop-blur-md max-h-[93dvh] flex flex-col overflow-hidden">
          {/* 視窗頂部 */}
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-800 shrink-0">
            <div>
              <h2 className="text-sm sm:text-base font-medium tracking-wider text-stone-100 flex items-center gap-2">
                <span>靈泉生靈管理</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30 font-normal">設定面板</span>
              </h2>
              <p className="text-[11px] text-stone-400 mt-0.5">參數與數量上限由 JSON 配置檔集中管理</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-stone-300 hover:text-stone-100 rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-700 transition-colors"
              title="關閉視窗返回靈泉"
            >
              <X className="w-3.5 h-3.5" />
              <span>返回</span>
            </button>
          </div>

          {/* 可滑動主內容區塊（緊湊排版，避免過度下拉） */}
          <div className="overflow-y-auto no-scrollbar py-2.5 space-y-2 flex-1">
            {creatureItems.map((item) => {
              const currentVal = config[item.key];
              const minVal = item.spec.min;
              const maxVal = item.spec.max;

              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between bg-stone-800/50 px-3 py-1.5 rounded-2xl border border-stone-700/30"
                >
                  <div className="pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-stone-100">{item.spec.label}</span>
                      <span className="text-[11px] text-stone-400">({item.spec.category})</span>
                    </div>
                    <span className="text-xs text-stone-400 block line-clamp-1">{item.spec.description}</span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => adjustCount(item.key, -1, minVal, maxVal)}
                      disabled={currentVal <= minVal}
                      className="w-7 h-7 rounded-full bg-stone-700/70 hover:bg-stone-700 disabled:opacity-30 disabled:hover:bg-stone-700/70 flex items-center justify-center transition-colors text-stone-200"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className={`w-6 text-center font-mono text-sm font-semibold ${item.valColor}`}>
                      {currentVal}
                    </span>
                    <button
                      onClick={() => adjustCount(item.key, 1, minVal, maxVal)}
                      disabled={currentVal >= maxVal}
                      className="w-7 h-7 rounded-full bg-stone-700/70 hover:bg-stone-700 disabled:opacity-30 disabled:hover:bg-stone-700/70 flex items-center justify-center transition-colors text-stone-200"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* 小雪觀魚開關 */}
            <div className="flex items-center justify-between bg-stone-800/60 px-3.5 py-2.5 rounded-2xl border border-amber-300/20">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-amber-200">
                    {ecosystemConfig.character.xiaoXue.label}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">仙俠主題</span>
                </div>
                <span className="text-xs text-stone-400 block line-clamp-1">
                  {ecosystemConfig.character.xiaoXue.description}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    zenAudio.ensureRunning();
                    xiaoXueVoice.playRandom();
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-medium border border-stone-600 bg-stone-800 hover:bg-stone-700 text-amber-200 transition-colors active:scale-95"
                  title="隨機試聽一段小雪的聲音"
                >
                  試聽語音
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDiagnostics(!showDiagnostics);
                  }}
                  className={`p-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    showDiagnostics
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                      : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                  }`}
                  title="展開音訊排查與診斷面板"
                >
                  <Activity className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    zenAudio.ensureRunning();
                    handleUpdate({ showXiaoXue: !config.showXiaoXue });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    config.showXiaoXue
                      ? 'bg-amber-300/20 border-amber-300/50 text-amber-200'
                      : 'bg-stone-800 border-stone-700 text-stone-400'
                  }`}
                >
                  {config.showXiaoXue ? '端坐岸邊' : '隱去身姿'}
                </button>
              </div>
            </div>

            {/* 音訊專屬診斷排查面板 */}
            {showDiagnostics && (
              <div className="bg-stone-900/90 p-3 rounded-2xl border border-amber-400/30 text-xs space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-1.5 border-b border-stone-800">
                  <div className="flex items-center gap-1.5 font-medium text-amber-300">
                    <Activity className="w-3.5 h-3.5" />
                    <span>音訊狀態診斷儀</span>
                  </div>
                  <span className="text-[10px] text-stone-400">
                    {zenAudio.getContext()?.state === 'running' ? '🟢 引擎正常 (Running)' : '🟡 待解鎖 (Suspended)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      xiaoXueVoice.playTestBeep();
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 border border-stone-700 text-[11px] font-medium transition-all active:scale-95"
                  >
                    <Volume1 className="w-3.5 h-3.5" />
                    <span>測試純音 (Beep)</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      xiaoXueVoice.playById('voice-01');
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/40 text-[11px] font-medium transition-all active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>第1句 (WebAudio)</span>
                  </button>
                </div>

                {/* 瀏覽器原生 HTML5 Audio 實體播放列 */}
                <div className="pt-1">
                  <span className="text-[10px] text-stone-400 block mb-1">原生瀏覽器實體播放列（可直接點 ▶️ 播放）：</span>
                  <audio
                    controls
                    preload="auto"
                    src="/assets/audio/xiaoxue_01.mp3"
                    className="w-full h-8 opacity-85 hover:opacity-100 transition-opacity"
                  />
                </div>

                {/* 即時終端機日誌 */}
                <div className="bg-black/60 p-2 rounded-xl border border-stone-800 text-[10px] font-mono text-stone-300 max-h-24 overflow-y-auto space-y-0.5">
                  {logs.length === 0 ? (
                    <span className="text-stone-500">點擊上方按鈕，即時顯示解碼與播放日誌...</span>
                  ) : (
                    logs.map((l, i) => <div key={i} className="leading-tight break-all">{l}</div>)
                  )}
                </div>
              </div>
            )}

            {/* 庭園時序氛圍切換 */}
            <div className="pt-2 pb-2 border-t border-stone-800/80">
            <span className="text-xs text-stone-400 mb-2 block">時序氛圍</span>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-stone-800/60 rounded-xl">
              {(
                [
                  { id: 'dawn', label: '晨曦', icon: Sunrise },
                  { id: 'day', label: '白晝', icon: Sun },
                  { id: 'dusk', label: '夕照', icon: Sunset },
                  { id: 'night', label: '靜夜', icon: Moon },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const active = config.mood === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleUpdate({ mood: item.id as AmbientMood })}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-all ${
                      active
                        ? 'bg-stone-700 text-amber-200 font-medium shadow-xs'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 聲音控制與重設（固定在面板底部，雙靜音 100% 完全分離，隨時可見） */}
        <div className="pt-2.5 border-t border-stone-800 shrink-0 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              {/* 靈泉流水自然音 */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleAmbientSound}
                  className={`px-2.5 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 text-xs ${
                    config.soundEnabled
                      ? 'bg-stone-800 border-amber-400/40 text-amber-200'
                      : 'bg-stone-800/40 border-stone-700 text-stone-400'
                  }`}
                  title={config.soundEnabled ? '靜音流水環境音' : '開啟流水環境音'}
                >
                  {config.soundEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                      <span>流水環境</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-stone-400" />
                      <span>流水靜音</span>
                    </>
                  )}
                </button>

                {config.soundEnabled && (
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={config.volume}
                    onChange={(e) => handleUpdate({ volume: parseFloat(e.target.value) })}
                    className="w-14 h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-300"
                    aria-label="流水音量"
                    title="調整流水環境音量"
                  />
                )}
              </div>

              {/* 小雪修仙語音開關（獨立控制） */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleVoiceSound}
                  className={`px-2.5 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 text-xs ${
                    config.voiceEnabled
                      ? 'bg-amber-400/20 border-amber-400/50 text-amber-200'
                      : 'bg-stone-800/40 border-stone-700 text-stone-400'
                  }`}
                  title={config.voiceEnabled ? '靜音小雪語音' : '開啟小雪語音'}
                >
                  {config.voiceEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                      <span>小雪語音</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-stone-400" />
                      <span>語音靜音</span>
                    </>
                  )}
                </button>

                {config.voiceEnabled && (
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={config.voiceVolume ?? 1.0}
                    onChange={(e) => handleUpdate({ voiceVolume: parseFloat(e.target.value) })}
                    className="w-14 h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-300"
                    aria-label="小雪語音音量"
                    title="調整小雪語音音量"
                  />
                )}
              </div>
            </div>

            {/* 恢復預設生態按鈕 */}
            <div className="flex justify-end pt-1">
              <button
                onClick={() => {
                  onReset();
                  zenAudio.ensureRunning();
                }}
                className="flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-stone-200 px-2.5 py-1 rounded-lg hover:bg-stone-800/60 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>恢復預設設定</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
