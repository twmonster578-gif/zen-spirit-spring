/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import {
  KoiFish,
  KoiPattern,
  Frog,
  Grasshopper,
  Dragonfly,
  Turtle,
  WaterRipple,
  LilyPad,
  ShoreStone,
  GrassTuft,
  GardenConfig,
} from '../types';
import { zenAudio } from '../audio/ZenAudio';
import { xiaoXueVoice } from '../audio/XiaoXueAudio';
import ecosystemConfig from '../ecosystem-config.json';

export interface ZenCanvasHandle {
  triggerFeed: () => void;
}

interface ZenCanvasProps {
  config: GardenConfig;
  onFeedNotice?: (text: string) => void;
}

interface FishFood {
  x: number;
  y: number;
  targetY: number;
  progress: number;
  alpha: number;
}

export const ZenCanvas = forwardRef<ZenCanvasHandle, ZenCanvasProps>(({ config, onFeedNotice }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Entities Ref (kept in refs for uninterrupted 60fps render loop)
  const koiRef = useRef<KoiFish[]>([]);
  const frogsRef = useRef<Frog[]>([]);
  const grasshoppersRef = useRef<Grasshopper[]>([]);
  const dragonfliesRef = useRef<Dragonfly[]>([]);
  const turtlesRef = useRef<Turtle[]>([]);
  const ripplesRef = useRef<WaterRipple[]>([]);
  const lilyPadsRef = useRef<LilyPad[]>([]);
  const stonesRef = useRef<ShoreStone[]>([]);
  const grassTuftsRef = useRef<GrassTuft[]>([]);
  const foodRef = useRef<FishFood[]>([]);

  // 小雪形象圖片
  const xiaoXueImgRef = useRef<HTMLImageElement | null>(null);
  const [isImgLoaded, setIsImgLoaded] = useState(false);

  // Logical coordinate system
  const LOGICAL_WIDTH = 450;
  const LOGICAL_HEIGHT = 800;
  const SHORE_HEIGHT = LOGICAL_HEIGHT * ecosystemConfig.environment.shoreRatio; // 176

  const animationFrameId = useRef<number | null>(null);

  // 載入小雪水墨坐姿形象
  useEffect(() => {
    const img = new Image();
    img.src = ecosystemConfig.character.xiaoXue.imagePath;
    img.onload = () => {
      xiaoXueImgRef.current = img;
      setIsImgLoaded(true);
    };
  }, []);

  // 隨機選取水池開闊地導航點（大範圍漫游不轉圈）
  const pickKoiWaypoint = (currentX: number, currentY: number) => {
    const margin = 55;
    const minX = margin;
    const maxX = LOGICAL_WIDTH - margin;
    const minY = SHORE_HEIGHT + 35;
    const maxY = LOGICAL_HEIGHT - margin;

    let wx = minX + Math.random() * (maxX - minX);
    let wy = minY + Math.random() * (maxY - minY);
    for (let attempts = 0; attempts < 5; attempts++) {
      if (Math.hypot(wx - currentX, wy - currentY) > 130) break;
      wx = minX + Math.random() * (maxX - minX);
      wy = minY + Math.random() * (maxY - minY);
    }
    return { wx, wy };
  };

  // 初始化靜態石岸（改為淺灰白枯山水花崗岩，使蚱蜢無比清晰）、草叢與荷葉
  useEffect(() => {
    // 1. 日式枯山水淺色花崗岩（高對比度底色）
    const stones: ShoreStone[] = [
      { x: 35, y: 55, radiusX: 55, radiusY: 42, rotation: 0.15, color: '#d8e0da', hasMoss: true },
      { x: 110, y: 75, radiusX: 50, radiusY: 38, rotation: -0.2, color: '#ced7d0', hasMoss: true },
      { x: 190, y: 60, radiusX: 62, radiusY: 44, rotation: 0.1, color: '#e0e7e2', hasMoss: false },
      { x: 275, y: 78, radiusX: 54, radiusY: 40, rotation: -0.15, color: '#d3dcd5', hasMoss: true },
      // 右側平坦大岩石（小雪端坐處）
      { x: 360, y: 85, radiusX: 68, radiusY: 52, rotation: 0.08, color: '#e6ede8', hasMoss: false },
      { x: 430, y: 90, radiusX: 45, radiusY: 38, rotation: -0.1, color: '#d5dfd8', hasMoss: true },
      // 前緣淺色親水平石
      { x: 75, y: 125, radiusX: 38, radiusY: 28, rotation: 0.05, color: '#cad3cc', hasMoss: true },
      { x: 155, y: 135, radiusX: 44, radiusY: 30, rotation: -0.12, color: '#d9e2db', hasMoss: true },
      { x: 240, y: 140, radiusX: 42, radiusY: 30, rotation: 0.18, color: '#e2eae4', hasMoss: false },
      { x: 315, y: 135, radiusX: 42, radiusY: 28, rotation: -0.08, color: '#dbe4dd', hasMoss: true },
      { x: 395, y: 128, radiusX: 38, radiusY: 26, rotation: 0.2, color: '#ccd5ce', hasMoss: true },
    ];
    stonesRef.current = stones;

    // 2. 石縫青草叢
    const tufts: GrassTuft[] = [
      {
        x: 45,
        y: 95,
        blades: [
          { height: 26, lean: -0.25, shade: '#355e3e' },
          { height: 32, lean: -0.05, shade: '#28462f' },
          { height: 22, lean: 0.2, shade: '#43704d' },
        ],
      },
      {
        x: 125,
        y: 105,
        blades: [
          { height: 28, lean: -0.15, shade: '#2f5237' },
          { height: 35, lean: 0.1, shade: '#3d6746' },
          { height: 24, lean: 0.3, shade: '#28442d' },
        ],
      },
      {
        x: 210,
        y: 100,
        blades: [
          { height: 24, lean: -0.3, shade: '#396042' },
          { height: 30, lean: 0.0, shade: '#2b4931' },
          { height: 26, lean: 0.25, shade: '#45744f' },
        ],
      },
      {
        x: 275,
        y: 115,
        blades: [
          { height: 30, lean: -0.2, shade: '#2a4730' },
          { height: 36, lean: 0.05, shade: '#3c6645' },
          { height: 25, lean: 0.35, shade: '#467650' },
        ],
      },
      {
        x: 420,
        y: 110,
        blades: [
          { height: 25, lean: -0.1, shade: '#375e40' },
          { height: 33, lean: 0.15, shade: '#2a4730' },
          { height: 22, lean: -0.25, shade: '#43724e' },
        ],
      },
    ];
    grassTuftsRef.current = tufts;

    // 3. 散落池中的水墨荷葉
    const pads: LilyPad[] = [
      {
        id: 'pad-1',
        x: 95,
        y: 280,
        radius: 46,
        notchAngle: Math.PI * 0.35,
        notchWidth: 0.42,
        driftPhase: 0,
        driftSpeed: 0.008,
        tiltAngle: 0,
        tiltTarget: 0,
        hasFlower: true,
        flowerColor: 'pink',
        petals: 10,
        bobOffset: 0,
      },
      {
        id: 'pad-2',
        x: 360,
        y: 250,
        radius: 52,
        notchAngle: Math.PI * 1.1,
        notchWidth: 0.38,
        driftPhase: 1.2,
        driftSpeed: 0.007,
        tiltAngle: 0,
        tiltTarget: 0,
        hasFlower: false,
        flowerColor: 'white',
        petals: 8,
        bobOffset: 0,
      },
      {
        id: 'pad-3',
        x: 215,
        y: 420,
        radius: 58,
        notchAngle: Math.PI * 0.75,
        notchWidth: 0.45,
        driftPhase: 2.5,
        driftSpeed: 0.006,
        tiltAngle: 0,
        tiltTarget: 0,
        hasFlower: true,
        flowerColor: 'peach',
        petals: 12,
        bobOffset: 0,
      },
      {
        id: 'pad-4',
        x: 80,
        y: 570,
        radius: 48,
        notchAngle: Math.PI * 1.6,
        notchWidth: 0.4,
        driftPhase: 3.8,
        driftSpeed: 0.009,
        tiltAngle: 0,
        tiltTarget: 0,
        hasFlower: false,
        flowerColor: 'pink',
        petals: 8,
        bobOffset: 0,
      },
      {
        id: 'pad-5',
        x: 350,
        y: 530,
        radius: 64,
        notchAngle: Math.PI * 0.15,
        notchWidth: 0.44,
        driftPhase: 4.6,
        driftSpeed: 0.005,
        tiltAngle: 0,
        tiltTarget: 0,
        hasFlower: true,
        flowerColor: 'pink',
        petals: 11,
        bobOffset: 0,
      },
      {
        id: 'pad-6',
        x: 200,
        y: 700,
        radius: 50,
        notchAngle: Math.PI * 1.35,
        notchWidth: 0.42,
        driftPhase: 5.4,
        driftSpeed: 0.008,
        tiltAngle: 0,
        tiltTarget: 0,
        hasFlower: false,
        flowerColor: 'white',
        petals: 9,
        bobOffset: 0,
      },
    ];
    lilyPadsRef.current = pads;
  }, []);

  // 同步錦鯉數量
  useEffect(() => {
    const patterns: KoiPattern[] = ['kohaku', 'taisho', 'yamabuki', 'tancho', 'shiro'];
    const current = [...koiRef.current];
    const { minLength, maxLength, cruiseSpeedMin, cruiseSpeedMax, turnSmoothness } =
      ecosystemConfig.physicsAndBehavior.koi;

    if (current.length < config.koiCount) {
      const needed = config.koiCount - current.length;
      for (let i = 0; i < needed; i++) {
        const pattern = patterns[(current.length + i) % patterns.length];
        const length = minLength + Math.random() * (maxLength - minLength);
        const x = 70 + Math.random() * (LOGICAL_WIDTH - 140);
        const y = SHORE_HEIGHT + 60 + Math.random() * (LOGICAL_HEIGHT - SHORE_HEIGHT - 120);
        const { wx, wy } = pickKoiWaypoint(x, y);
        const angle = Math.atan2(wy - y, wx - x);

        const spine = [];
        const segmentCount = 8;
        const segmentLen = length / segmentCount;
        for (let s = 0; s < segmentCount; s++) {
          spine.push({
            x: x - Math.cos(angle) * s * segmentLen,
            y: y - Math.sin(angle) * s * segmentLen,
            angle: angle,
          });
        }

        current.push({
          id: `koi-${Date.now()}-${Math.random()}`,
          x,
          y,
          speed: cruiseSpeedMin + Math.random() * (cruiseSpeedMax - cruiseSpeedMin),
          targetSpeed: cruiseSpeedMin + Math.random() * (cruiseSpeedMax - cruiseSpeedMin),
          angle,
          targetAngle: angle,
          turnSpeed: turnSmoothness,
          length,
          pattern,
          wigglePhase: Math.random() * Math.PI * 2,
          wiggleSpeed: 0.06,
          spine,
          finPhase: 0,
          waypointX: wx,
          waypointY: wy,
          waitTimer: 0,
          isGliding: false,
        });
      }
    } else if (current.length > config.koiCount) {
      current.splice(config.koiCount);
    }
    koiRef.current = current;
  }, [config.koiCount]);

  // 同步青蛙
  useEffect(() => {
    const current = [...frogsRef.current];
    const { jumpHeight, jumpDurationFrames, swimSpeed } = ecosystemConfig.physicsAndBehavior.frog;

    if (current.length < config.frogCount) {
      const needed = config.frogCount - current.length;
      const pads = lilyPadsRef.current;

      for (let i = 0; i < needed; i++) {
        const startOnPad = pads.length > 0 && Math.random() > 0.4;
        let x = 120;
        let y = 140;
        let state: Frog['state'] = 'on_shore';
        let currentPadId: string | undefined = undefined;

        if (startOnPad) {
          const pad = pads[(current.length + i) % pads.length];
          x = pad.x + (Math.random() - 0.5) * 16;
          y = pad.y + (Math.random() - 0.5) * 16;
          state = 'on_pad';
          currentPadId = pad.id;
        } else {
          x = 50 + Math.random() * (LOGICAL_WIDTH - 220); // 避開小雪坐落區
          y = 80 + Math.random() * (SHORE_HEIGHT - 90);
          state = 'on_shore';
        }

        current.push({
          id: `frog-${Date.now()}-${Math.random()}`,
          x,
          y,
          state,
          facingAngle: Math.random() * Math.PI * 2,
          size: 15 + Math.random() * 4,
          startX: x,
          startY: y,
          targetX: x,
          targetY: y,
          jumpProgress: 0,
          jumpDuration: jumpDurationFrames,
          jumpHeight: jumpHeight,
          targetType: 'water',
          currentPadId,
          swimCycle: 0,
          swimSpeed: swimSpeed,
          restTimer: 0,
          restDuration: 90 + Math.floor(Math.random() * 140),
          breathPhase: Math.random() * Math.PI * 2,
        });
      }
    } else if (current.length > config.frogCount) {
      current.splice(config.frogCount);
    }
    frogsRef.current = current;
  }, [config.frogCount]);

  // 同步蚱蜢（左側與中央石岸活動，避開右側小雪）
  useEffect(() => {
    const current = [...grasshoppersRef.current];
    if (current.length < config.grasshopperCount) {
      const needed = config.grasshopperCount - current.length;
      for (let i = 0; i < needed; i++) {
        // 分佈在左側與中央淺色花崗岩上
        const x = 40 + Math.random() * (LOGICAL_WIDTH - 200);
        const y = 60 + Math.random() * (SHORE_HEIGHT - 75);
        current.push({
          id: `hopper-${Date.now()}-${Math.random()}`,
          x,
          y,
          size: 14 + Math.random() * 3,
          facingAngle: (Math.random() - 0.5) * Math.PI * 0.8 + Math.PI * 0.5,
          state: 'idle',
          hopProgress: 0,
          hopStartX: x,
          hopStartY: y,
          hopTargetX: x,
          hopTargetY: y,
          chirpTimer: 80 + Math.floor(Math.random() * 200),
          chirpDuration: 0,
          hopCooldown: 150 + Math.floor(Math.random() * 300),
          antennaPhase: Math.random() * Math.PI * 2,
        });
      }
    } else if (current.length > config.grasshopperCount) {
      current.splice(config.grasshopperCount);
    }
    grasshoppersRef.current = current;
  }, [config.grasshopperCount]);

  // 同步空中蜻蜓
  useEffect(() => {
    const current = [...dragonfliesRef.current];
    const colors = ['#5ca0d3', '#39b54a', '#d97d54', '#7e57c2'];
    const { cruiseSpeed } = ecosystemConfig.physicsAndBehavior.dragonfly;

    if (current.length < config.dragonflyCount) {
      const needed = config.dragonflyCount - current.length;
      for (let i = 0; i < needed; i++) {
        const x = 60 + Math.random() * (LOGICAL_WIDTH - 120);
        const y = 180 + Math.random() * (LOGICAL_HEIGHT - 260);
        current.push({
          id: `df-${Date.now()}-${Math.random()}`,
          x,
          y,
          targetX: x + (Math.random() - 0.5) * 80,
          targetY: y + (Math.random() - 0.5) * 80,
          facingAngle: Math.random() * Math.PI * 2,
          speed: cruiseSpeed,
          wingPhase: Math.random() * Math.PI * 2,
          state: 'hovering',
          hoverTimer: 60 + Math.floor(Math.random() * 120),
          size: 16 + Math.random() * 4,
          color: colors[(current.length + i) % colors.length],
        });
      }
    } else if (current.length > config.dragonflyCount) {
      current.splice(config.dragonflyCount);
    }
    dragonfliesRef.current = current;
  }, [config.dragonflyCount]);

  // 同步水底水龜
  useEffect(() => {
    const current = [...turtlesRef.current];
    const { swimSpeed, size } = ecosystemConfig.physicsAndBehavior.turtle;

    if (current.length < config.turtleCount) {
      const needed = config.turtleCount - current.length;
      for (let i = 0; i < needed; i++) {
        const x = 100 + Math.random() * (LOGICAL_WIDTH - 200);
        const y = SHORE_HEIGHT + 80 + Math.random() * (LOGICAL_HEIGHT - SHORE_HEIGHT - 160);
        current.push({
          id: `turtle-${Date.now()}-${Math.random()}`,
          x,
          y,
          targetX: x + (Math.random() - 0.5) * 120,
          targetY: y + (Math.random() - 0.5) * 120,
          facingAngle: Math.random() * Math.PI * 2,
          speed: swimSpeed,
          size: size + Math.random() * 4,
          state: 'swimming',
          paddlePhase: 0,
          baskTimer: 0,
        });
      }
    } else if (current.length > config.turtleCount) {
      current.splice(config.turtleCount);
    }
    turtlesRef.current = current;
  }, [config.turtleCount]);

  // 主要動畫循環
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;
      updateSimulation();
      drawScene(ctx);
      animationFrameId.current = requestAnimationFrame(render);
    };

    animationFrameId.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [config.mood, isImgLoaded, config.showXiaoXue]);

  // 核心模擬運算
  const updateSimulation = () => {
    const {
      cruiseSpeedMin,
      cruiseSpeedMax,
      turnSmoothness,
      waypointReachDistance,
      waypointMinWaitFrames,
      waypointMaxWaitFrames,
    } = ecosystemConfig.physicsAndBehavior.koi;

    // A. 荷葉微浮
    lilyPadsRef.current.forEach((pad) => {
      pad.driftPhase += pad.driftSpeed;
      pad.bobOffset = Math.sin(pad.driftPhase) * 2;
      pad.tiltAngle += (pad.tiltTarget - pad.tiltAngle) * 0.05;
      pad.tiltTarget *= 0.95;
    });

    // B. 水波漣漪擴散
    const ripples = ripplesRef.current;
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rip = ripples[i];
      rip.radius += rip.speed;
      rip.alpha *= ecosystemConfig.environment.rippleFadeRate;
      if (rip.alpha < 0.02 || rip.radius > rip.maxRadius) {
        ripples.splice(i, 1);
      }
    }

    // C. 魚食漂浮與沉降
    const foods = foodRef.current;
    for (let i = foods.length - 1; i >= 0; i--) {
      const f = foods[i];
      f.progress += 0.02;
      if (f.progress < 1) {
        f.y += (f.targetY - f.y) * 0.08;
      } else {
        f.alpha *= 0.985;
      }
      if (f.alpha < 0.05) {
        foods.splice(i, 1);
      }
    }

    // D. 錦鯉自然悠游與聚攏覓食
    const kois = koiRef.current;
    kois.forEach((koi) => {
      koi.wigglePhase += koi.wiggleSpeed;
      koi.finPhase += 0.04;

      const boundMargin = 45;
      if (
        koi.x < boundMargin ||
        koi.x > LOGICAL_WIDTH - boundMargin ||
        koi.y < SHORE_HEIGHT + 30 ||
        koi.y > LOGICAL_HEIGHT - boundMargin
      ) {
        koi.waypointX = LOGICAL_WIDTH / 2 + (Math.random() - 0.5) * 80;
        koi.waypointY = (LOGICAL_HEIGHT + SHORE_HEIGHT) / 2 + (Math.random() - 0.5) * 120;
      }

      const dx = koi.waypointX - koi.x;
      const dy = koi.waypointY - koi.y;
      const dist = Math.hypot(dx, dy);

      if (dist < waypointReachDistance) {
        koi.waitTimer++;
        koi.targetSpeed = cruiseSpeedMin * 0.6;
        koi.isGliding = true;
        koi.wiggleSpeed = 0.025;

        const waitLimit = waypointMinWaitFrames + Math.random() * (waypointMaxWaitFrames - waypointMinWaitFrames);
        if (koi.waitTimer > waitLimit) {
          const next = pickKoiWaypoint(koi.x, koi.y);
          koi.waypointX = next.wx;
          koi.waypointY = next.wy;
          koi.waitTimer = 0;
          koi.isGliding = false;
          koi.targetSpeed = cruiseSpeedMin + Math.random() * (cruiseSpeedMax - cruiseSpeedMin);
          koi.wiggleSpeed = 0.05 + koi.speed * 0.03;
        }
      } else {
        koi.targetAngle = Math.atan2(dy, dx);
      }

      let angleDiff = koi.targetAngle - koi.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      koi.angle += angleDiff * turnSmoothness;

      koi.speed += (koi.targetSpeed - koi.speed) * 0.025;
      koi.x += Math.cos(koi.angle) * koi.speed;
      koi.y += Math.sin(koi.angle) * koi.speed;

      const segmentLen = koi.length / koi.spine.length;
      koi.spine[0].x = koi.x;
      koi.spine[0].y = koi.y;
      koi.spine[0].angle = koi.angle;

      for (let s = 1; s < koi.spine.length; s++) {
        const prev = koi.spine[s - 1];
        const curr = koi.spine[s];
        const lateralWiggle = Math.sin(koi.wigglePhase - s * 0.45) * (s * 0.75) * (koi.speed / 0.8);
        const normalAngle = koi.angle + Math.PI / 2;

        curr.x = prev.x - Math.cos(koi.angle) * segmentLen + Math.cos(normalAngle) * lateralWiggle;
        curr.y = prev.y - Math.sin(koi.angle) * segmentLen + Math.sin(normalAngle) * lateralWiggle;
        curr.angle = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      }
    });

    // E. 青蛙行為
    const frogs = frogsRef.current;
    frogs.forEach((frog) => {
      frog.breathPhase += 0.04;
      if (frog.state === 'on_pad' || frog.state === 'on_shore') {
        frog.restTimer++;
        if (frog.restTimer >= frog.restDuration) {
          frog.restTimer = 0;
          frog.restDuration = 100 + Math.floor(Math.random() * 180);
          decideFrogNextJump(frog);
        }
      } else if (frog.state === 'jumping') {
        frog.jumpProgress += 1 / frog.jumpDuration;
        const p = Math.min(1, frog.jumpProgress);
        frog.x = frog.startX + (frog.targetX - frog.startX) * p;
        frog.y = frog.startY + (frog.targetY - frog.startY) * p;

        if (p >= 1) {
          frog.x = frog.targetX;
          frog.y = frog.targetY;
          if (frog.targetType === 'water') {
            frog.state = 'swimming';
            frog.swimCycle = 0;
            frog.restTimer = 0;
            frog.restDuration = 180 + Math.floor(Math.random() * 200);

            const pan = (frog.x / LOGICAL_WIDTH) * 2 - 1;
            zenAudio.playWaterSplash(pan);
            createWaterRipple(frog.x, frog.y, 45, 1.8);
            createWaterRipple(frog.x, frog.y, 25, 1.0);
          } else if (frog.targetType === 'pad') {
            frog.state = 'on_pad';
            frog.currentPadId = frog.targetPadId;
            const targetPad = lilyPadsRef.current.find((p) => p.id === frog.targetPadId);
            if (targetPad) targetPad.tiltTarget = 0.08;
            createWaterRipple(frog.x, frog.y, 20, 0.6);
          } else {
            frog.state = 'on_shore';
          }
        }
      } else if (frog.state === 'swimming') {
        frog.swimCycle += 0.06;
        frog.restTimer++;
        const stroke = Math.sin(frog.swimCycle);
        if (stroke > 0.5) {
          frog.x += Math.cos(frog.facingAngle) * frog.swimSpeed * 1.5;
          frog.y += Math.sin(frog.facingAngle) * frog.swimSpeed * 1.5;
          if (Math.random() < 0.1) {
            createWaterRipple(frog.x, frog.y, 12, 0.35);
          }
        }
        if (frog.x < 30 || frog.x > LOGICAL_WIDTH - 30 || frog.y > LOGICAL_HEIGHT - 30) {
          frog.facingAngle += Math.PI * 0.7;
        }
        if (frog.restTimer > frog.restDuration) {
          frog.restTimer = 0;
          frog.restDuration = 80 + Math.floor(Math.random() * 100);
          decideFrogClimbOut(frog);
        }
      }
    });

    // F. 蚱蜢行為
    const hoppers = grasshoppersRef.current;
    hoppers.forEach((hopper) => {
      hopper.antennaPhase += 0.04;
      if (hopper.state === 'idle') {
        hopper.chirpTimer--;
        hopper.hopCooldown--;
        if (hopper.chirpTimer <= 0) {
          hopper.state = 'chirping';
          hopper.chirpDuration = 25;
          hopper.chirpTimer = 180 + Math.floor(Math.random() * 300);
          const pan = (hopper.x / LOGICAL_WIDTH) * 2 - 1;
          zenAudio.playCricketChirp(pan);
        } else if (hopper.hopCooldown <= 0) {
          hopper.hopCooldown = 220 + Math.floor(Math.random() * 300);
          const hopDist = 25 + Math.random() * 35;
          const hopAngle = (Math.random() - 0.5) * Math.PI * 0.9 + Math.PI * 0.5;
          hopper.hopStartX = hopper.x;
          hopper.hopStartY = hopper.y;
          // 限制在左側石岸
          hopper.hopTargetX = Math.max(30, Math.min(LOGICAL_WIDTH - 180, hopper.x + Math.cos(hopAngle) * hopDist));
          hopper.hopTargetY = Math.max(45, Math.min(SHORE_HEIGHT - 35, hopper.y + Math.sin(hopAngle) * hopDist));
          hopper.hopProgress = 0;
          hopper.state = 'hopping';
          hopper.facingAngle = hopAngle;
        }
      } else if (hopper.state === 'chirping') {
        hopper.chirpDuration--;
        if (hopper.chirpDuration <= 0) hopper.state = 'idle';
      } else if (hopper.state === 'hopping') {
        hopper.hopProgress += 0.07;
        const p = Math.min(1, hopper.hopProgress);
        hopper.x = hopper.hopStartX + (hopper.hopTargetX - hopper.hopStartX) * p;
        hopper.y = hopper.hopStartY + (hopper.hopTargetY - hopper.hopStartY) * p;
        if (p >= 1) hopper.state = 'idle';
      }
    });

    // G. 空中蜻蜓
    const dfList = dragonfliesRef.current;
    const { dipWaterChance } = ecosystemConfig.physicsAndBehavior.dragonfly;
    dfList.forEach((df) => {
      df.wingPhase += 0.45;
      if (df.state === 'hovering') {
        df.hoverTimer--;
        df.x += Math.sin(df.wingPhase * 0.2) * 0.4;
        df.y += Math.cos(df.wingPhase * 0.25) * 0.3;

        if (df.hoverTimer <= 0) {
          const pads = lilyPadsRef.current;
          if (Math.random() < dipWaterChance) {
            df.state = 'dipping';
            df.targetX = 60 + Math.random() * (LOGICAL_WIDTH - 120);
            df.targetY = SHORE_HEIGHT + 60 + Math.random() * (LOGICAL_HEIGHT - SHORE_HEIGHT - 120);
          } else if (pads.length > 0 && Math.random() < 0.6) {
            const pad = pads[Math.floor(Math.random() * pads.length)];
            df.state = 'dashing';
            df.targetX = pad.x + (Math.random() - 0.5) * 30;
            df.targetY = pad.y + (Math.random() - 0.5) * 30;
          } else {
            df.state = 'dashing';
            df.targetX = 40 + Math.random() * (LOGICAL_WIDTH - 80);
            df.targetY = 160 + Math.random() * (LOGICAL_HEIGHT - 220);
          }
          df.facingAngle = Math.atan2(df.targetY - df.y, df.targetX - df.x);
        }
      } else if (df.state === 'dashing' || df.state === 'dipping') {
        const dx = df.targetX - df.x;
        const dy = df.targetY - df.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 8) {
          if (df.state === 'dipping') {
            createWaterRipple(df.x, df.y, 16, 0.7);
          }
          df.state = 'hovering';
          df.hoverTimer = 70 + Math.floor(Math.random() * 110);
        } else {
          df.x += (dx / dist) * df.speed;
          df.y += (dy / dist) * df.speed;
          df.facingAngle = Math.atan2(dy, dx);
        }
      }
    });

    // H. 水龜
    const turtles = turtlesRef.current;
    turtles.forEach((turtle) => {
      turtle.paddlePhase += 0.04;
      const dx = turtle.targetX - turtle.x;
      const dy = turtle.targetY - turtle.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 20) {
        turtle.targetX = 60 + Math.random() * (LOGICAL_WIDTH - 120);
        turtle.targetY = SHORE_HEIGHT + 40 + Math.random() * (LOGICAL_HEIGHT - SHORE_HEIGHT - 80);
        turtle.facingAngle = Math.atan2(turtle.targetY - turtle.y, turtle.targetX - turtle.x);
      } else {
        let diff = turtle.facingAngle - Math.atan2(dy, dx);
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        turtle.facingAngle -= diff * 0.02;

        turtle.x += Math.cos(turtle.facingAngle) * turtle.speed;
        turtle.y += Math.sin(turtle.facingAngle) * turtle.speed;
      }
    });
  };

  const decideFrogNextJump = (frog: Frog) => {
    const pads = lilyPadsRef.current;
    const roll = Math.random();
    frog.startX = frog.x;
    frog.startY = frog.y;
    frog.jumpProgress = 0;
    frog.jumpDuration = ecosystemConfig.physicsAndBehavior.frog.jumpDurationFrames;

    if (frog.state === 'on_shore') {
      if (roll < 0.65 || pads.length === 0) {
        frog.targetType = 'water';
        frog.targetX = frog.x + (Math.random() - 0.5) * 50;
        frog.targetY = SHORE_HEIGHT + 35 + Math.random() * 50;
      } else {
        const topPads = pads.filter((p) => p.y < 350);
        const chosen = topPads.length > 0 ? topPads[Math.floor(Math.random() * topPads.length)] : pads[0];
        frog.targetType = 'pad';
        frog.targetPadId = chosen.id;
        frog.targetX = chosen.x + (Math.random() - 0.5) * (chosen.radius * 0.6);
        frog.targetY = chosen.y + (Math.random() - 0.5) * (chosen.radius * 0.6);
      }
    } else if (frog.state === 'on_pad') {
      if (roll < 0.55) {
        frog.targetType = 'water';
        const jumpAngle = Math.random() * Math.PI * 2;
        const jumpDist = 45 + Math.random() * 35;
        frog.targetX = Math.max(30, Math.min(LOGICAL_WIDTH - 30, frog.x + Math.cos(jumpAngle) * jumpDist));
        frog.targetY = Math.max(SHORE_HEIGHT + 20, Math.min(LOGICAL_HEIGHT - 30, frog.y + Math.sin(jumpAngle) * jumpDist));
      } else {
        const otherPads = pads.filter((p) => p.id !== frog.currentPadId);
        if (otherPads.length > 0) {
          const sorted = otherPads.sort((a, b) => {
            const da = Math.hypot(a.x - frog.x, a.y - frog.y);
            const db = Math.hypot(b.x - frog.x, b.y - frog.y);
            return da - db;
          });
          const targetPad = sorted[0];
          const dist = Math.hypot(targetPad.x - frog.x, targetPad.y - frog.y);
          if (dist < 180) {
            frog.targetType = 'pad';
            frog.targetPadId = targetPad.id;
            frog.targetX = targetPad.x + (Math.random() - 0.5) * 16;
            frog.targetY = targetPad.y + (Math.random() - 0.5) * 16;
          } else {
            frog.targetType = 'water';
            frog.targetX = frog.x + (Math.random() - 0.5) * 40;
            frog.targetY = frog.y + 40;
          }
        }
      }
    }

    frog.facingAngle = Math.atan2(frog.targetY - frog.startY, frog.targetX - frog.startX);
    frog.state = 'jumping';
    if (Math.random() < 0.3) {
      zenAudio.playFrogCroak((frog.x / LOGICAL_WIDTH) * 2 - 1);
    }
  };

  const decideFrogClimbOut = (frog: Frog) => {
    const pads = lilyPadsRef.current;
    frog.startX = frog.x;
    frog.startY = frog.y;
    frog.jumpProgress = 0;
    frog.jumpDuration = 32;

    if (frog.y < SHORE_HEIGHT + 60 && Math.random() < 0.6) {
      frog.targetType = 'shore';
      frog.targetX = 60 + Math.random() * (LOGICAL_WIDTH - 200);
      frog.targetY = SHORE_HEIGHT - 35 - Math.random() * 40;
      frog.facingAngle = Math.atan2(frog.targetY - frog.startY, frog.targetX - frog.startX);
      frog.state = 'jumping';
      return;
    }

    if (pads.length > 0) {
      let nearestPad = pads[0];
      let minDist = 9999;
      pads.forEach((p) => {
        const d = Math.hypot(p.x - frog.x, p.y - frog.y);
        if (d < minDist) {
          minDist = d;
          nearestPad = p;
        }
      });
      frog.targetType = 'pad';
      frog.targetPadId = nearestPad.id;
      frog.targetX = nearestPad.x + (Math.random() - 0.5) * (nearestPad.radius * 0.5);
      frog.targetY = nearestPad.y + (Math.random() - 0.5) * (nearestPad.radius * 0.5);
      frog.facingAngle = Math.atan2(frog.targetY - frog.startY, frog.targetX - frog.startX);
      frog.state = 'jumping';
    }
  };

  const createWaterRipple = (x: number, y: number, maxRadius = 45, speed = 1.2) => {
    ripplesRef.current.push({
      x,
      y,
      radius: 3,
      maxRadius,
      speed,
      alpha: 0.65,
      lineWidth: 1.5,
    });
  };

  // 小雪灑魚食互動
  const handleXiaoXueFeed = () => {
    zenAudio.ensureRunning();
    zenAudio.playDropChime();

    // 在小雪跟前水域灑下 4~5 粒靈泉魚餌
    const feedOriginX = 300;
    const feedOriginY = 135;

    for (let i = 0; i < 5; i++) {
      const targetX = feedOriginX + (Math.random() - 0.5) * 60;
      const targetY = feedOriginY + 30 + Math.random() * 45;
      foodRef.current.push({
        x: feedOriginX - 10 + i * 5,
        y: feedOriginY,
        targetY,
        progress: 0,
        alpha: 1.0,
      });

      // 魚食入水微小波紋
      setTimeout(() => {
        createWaterRipple(targetX, targetY, 22, 0.9);
      }, 200 + i * 80);
    }

    // 附近 3~5 條錦鯉興奮游向小雪水域聚攏覓食
    const kois = koiRef.current;
    kois.slice(0, 5).forEach((koi, idx) => {
      setTimeout(() => {
        koi.waypointX = feedOriginX + (Math.random() - 0.5) * 70;
        koi.waypointY = feedOriginY + 25 + Math.random() * 55;
        koi.targetSpeed = 1.35;
        koi.speed = 1.2;
        koi.wiggleSpeed = 0.12;
      }, idx * 120);
    });

    // 播放小雪灑魚食或隨機陪伴語音（自動依時段判斷）
    xiaoXueVoice.playVoice(Math.random() < 0.65 ? 'feed' : 'general', config.mood);

    if (onFeedNotice) {
      onFeedNotice('小雪輕灑靈餌，池中錦鯉歡然聚攏');
    }
  };

  useImperativeHandle(ref, () => ({
    triggerFeed: handleXiaoXueFeed,
  }));

  // 繪製場景
  const drawScene = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    const { bgGrad, ambientTint } = getAtmosphereColors(config.mood);

    // 1. 底色
    const grad = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
    grad.addColorStop(0, bgGrad.top);
    grad.addColorStop(0.22, bgGrad.shore);
    grad.addColorStop(1, bgGrad.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    // 2. 池底卵石
    drawRiverbedPebbles(ctx);

    // 3. 水草
    drawSubmergedFlora(ctx);

    // 4. 水底水龜
    drawTurtles(ctx);

    // 5. 錦鯉群
    drawKoiFlock(ctx);

    // 6. 荷葉與睡蓮
    drawLilyPadsAndFlowers(ctx);

    // 7. 青蛙
    drawFrogs(ctx);

    // 8. 日式淺銀灰石岸與草叢（高對比底色）
    drawJapaneseShoreline(ctx);

    // 9. 小雪端坐觀魚（若開啟）
    if (config.showXiaoXue) {
      drawXiaoXueCharacter(ctx);
    }

    // 10. 蚱蜢／蟋蟀（棲息於淺灰石岸，色澤鮮活醒目）
    drawGrasshoppers(ctx);

    // 11. 魚餌顆粒
    drawFishFood(ctx);

    // 12. 水波漣漪
    drawWaterRipples(ctx);

    // 13. 空中蜻蜓
    drawDragonflies(ctx);

    // 14. 水面光感
    drawWaterSurfaceLight(ctx, ambientTint);

    ctx.restore();
  };

  const getAtmosphereColors = (mood: GardenConfig['mood']) => {
    switch (mood) {
      case 'dawn':
        return {
          bgGrad: { top: '#e6ede8', shore: '#dae6de', bottom: '#cbdad0' },
          ambientTint: 'rgba(215, 235, 225, 0.12)',
        };
      case 'dusk':
        return {
          bgGrad: { top: '#f3ece3', shore: '#eadecf', bottom: '#dfd2c0' },
          ambientTint: 'rgba(245, 185, 120, 0.15)',
        };
      case 'night':
        return {
          bgGrad: { top: '#21292c', shore: '#1d2729', bottom: '#151e20' },
          ambientTint: 'rgba(30, 60, 90, 0.25)',
        };
      case 'day':
      default:
        return {
          bgGrad: { top: '#f4f6f1', shore: '#ebf0e8', bottom: '#e1e8dd' },
          ambientTint: 'rgba(255, 255, 255, 0.08)',
        };
    }
  };

  const drawRiverbedPebbles = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    const pebbles = [
      { x: 120, y: 340, rx: 14, ry: 10, color: 'rgba(125, 140, 130, 0.18)' },
      { x: 280, y: 290, rx: 18, ry: 12, color: 'rgba(110, 125, 115, 0.15)' },
      { x: 190, y: 530, rx: 16, ry: 11, color: 'rgba(115, 130, 120, 0.2)' },
      { x: 320, y: 640, rx: 20, ry: 13, color: 'rgba(120, 135, 125, 0.16)' },
      { x: 70, y: 440, rx: 15, ry: 10, color: 'rgba(130, 145, 135, 0.17)' },
      { x: 260, y: 740, rx: 22, ry: 14, color: 'rgba(118, 132, 122, 0.19)' },
    ];
    pebbles.forEach((peb) => {
      ctx.beginPath();
      ctx.ellipse(peb.x, peb.y, peb.rx, peb.ry, 0.3, 0, Math.PI * 2);
      ctx.fillStyle = peb.color;
      ctx.fill();
    });
    ctx.restore();
  };

  const drawSubmergedFlora = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    const time = Date.now() * 0.0015;
    const weedPositions = [
      { x: 160, y: 350 },
      { x: 290, y: 580 },
    ];
    weedPositions.forEach((pos, idx) => {
      ctx.strokeStyle = 'rgba(100, 135, 110, 0.25)';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      const sway1 = Math.sin(time + idx) * 8;
      const sway2 = Math.cos(time * 0.8 + idx) * 12;
      ctx.quadraticCurveTo(pos.x + sway1, pos.y - 30, pos.x + sway2, pos.y - 65);
      ctx.stroke();
    });
    ctx.restore();
  };

  const drawTurtles = (ctx: CanvasRenderingContext2D) => {
    const turtles = turtlesRef.current;
    turtles.forEach((t) => {
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.facingAngle);

      const s = t.size;
      const paddle = Math.sin(t.paddlePhase) * 0.35;

      ctx.beginPath();
      ctx.ellipse(1, 3, s * 0.8, s * 0.65, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(30, 45, 35, 0.18)';
      ctx.fill();

      ctx.fillStyle = '#405646';
      ctx.beginPath();
      ctx.ellipse(s * 0.6, -s * 0.65 + paddle * 4, s * 0.35, s * 0.18, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(s * 0.6, s * 0.65 - paddle * 4, s * 0.35, s * 0.18, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-s * 0.6, -s * 0.5, s * 0.28, s * 0.15, -0.3, 0, Math.PI * 2);
      ctx.ellipse(-s * 0.6, s * 0.5, s * 0.28, s * 0.15, 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(s * 0.75, 0, s * 0.25, s * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#4d6954';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.75, s * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#324738';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.45, s * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    });
  };

  const drawKoiFlock = (ctx: CanvasRenderingContext2D) => {
    const kois = koiRef.current;
    kois.forEach((koi) => {
      const spine = koi.spine;
      if (spine.length < 2) return;

      ctx.save();
      const shadowOffset = 13;
      ctx.translate(shadowOffset * 0.7, shadowOffset);
      renderKoiBody(ctx, koi, 'rgba(40, 50, 45, 0.12)', true);
      ctx.restore();

      ctx.save();
      renderKoiBody(ctx, koi, null, false);
      ctx.restore();
    });
  };

  const renderKoiBody = (
    ctx: CanvasRenderingContext2D,
    koi: KoiFish,
    overrideColor: string | null,
    isShadow: boolean
  ) => {
    const spine = koi.spine;
    const len = spine.length;
    const head = spine[0];
    const tail = spine[len - 1];

    const baseWidth = koi.length * 0.17;
    const widthMultipliers = [0.85, 1.15, 1.25, 1.18, 0.98, 0.75, 0.52, 0.32];

    const leftPts: { x: number; y: number }[] = [];
    const rightPts: { x: number; y: number }[] = [];

    for (let i = 0; i < len; i++) {
      const seg = spine[i];
      const w = baseWidth * (widthMultipliers[i] || 0.4);
      const normalAngle = seg.angle + Math.PI / 2;
      leftPts.push({
        x: seg.x + Math.cos(normalAngle) * w,
        y: seg.y + Math.sin(normalAngle) * w,
      });
      rightPts.push({
        x: seg.x - Math.cos(normalAngle) * w,
        y: seg.y - Math.sin(normalAngle) * w,
      });
    }

    ctx.beginPath();
    ctx.moveTo(head.x + Math.cos(head.angle) * baseWidth * 0.8, head.y + Math.sin(head.angle) * baseWidth * 0.8);

    for (let i = 0; i < len - 1; i++) {
      const xc = (leftPts[i].x + leftPts[i + 1].x) / 2;
      const yc = (leftPts[i].y + leftPts[i + 1].y) / 2;
      ctx.quadraticCurveTo(leftPts[i].x, leftPts[i].y, xc, yc);
    }
    ctx.lineTo(tail.x, tail.y);

    for (let i = len - 1; i > 0; i--) {
      const xc = (rightPts[i].x + rightPts[i - 1].x) / 2;
      const yc = (rightPts[i].y + rightPts[i - 1].y) / 2;
      ctx.quadraticCurveTo(rightPts[i].x, rightPts[i].y, xc, yc);
    }
    ctx.closePath();

    if (isShadow) {
      ctx.fillStyle = overrideColor!;
      ctx.fill();
      return;
    }

    let baseFill = '#f7f6f2';
    if (koi.pattern === 'yamabuki') baseFill = '#f5b538';
    if (koi.pattern === 'shiro') baseFill = '#e6e8e5';

    ctx.fillStyle = baseFill;
    ctx.fill();

    ctx.save();
    ctx.clip();

    if (koi.pattern === 'kohaku' || koi.pattern === 'taisho') {
      ctx.fillStyle = '#db3e26';
      const headSeg = spine[1] || head;
      ctx.beginPath();
      ctx.ellipse(headSeg.x, headSeg.y, baseWidth * 0.85, baseWidth * 0.7, headSeg.angle, 0, Math.PI * 2);
      ctx.fill();

      const midSeg = spine[3] || head;
      ctx.beginPath();
      ctx.ellipse(midSeg.x, midSeg.y, baseWidth * 1.05, baseWidth * 0.85, midSeg.angle + 0.2, 0, Math.PI * 2);
      ctx.fill();

      const tailSeg = spine[5] || tail;
      ctx.beginPath();
      ctx.ellipse(tailSeg.x, tailSeg.y, baseWidth * 0.7, baseWidth * 0.55, tailSeg.angle - 0.2, 0, Math.PI * 2);
      ctx.fill();

      if (koi.pattern === 'taisho') {
        ctx.fillStyle = '#222629';
        const sumiSeg1 = spine[2];
        ctx.beginPath();
        ctx.ellipse(sumiSeg1.x + 3, sumiSeg1.y + 3, baseWidth * 0.45, baseWidth * 0.35, sumiSeg1.angle + 0.4, 0, Math.PI * 2);
        ctx.fill();
        const sumiSeg2 = spine[4];
        ctx.beginPath();
        ctx.ellipse(sumiSeg2.x - 4, sumiSeg2.y - 2, baseWidth * 0.5, baseWidth * 0.38, sumiSeg2.angle - 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (koi.pattern === 'tancho') {
      ctx.fillStyle = '#d83820';
      const crown = spine[1] || head;
      ctx.beginPath();
      ctx.arc(crown.x, crown.y, baseWidth * 0.65, 0, Math.PI * 2);
      ctx.fill();
    } else if (koi.pattern === 'shiro') {
      ctx.fillStyle = '#1e2226';
      const m1 = spine[2];
      ctx.beginPath();
      ctx.ellipse(m1.x, m1.y, baseWidth * 0.9, baseWidth * 0.6, m1.angle + 0.1, 0, Math.PI * 2);
      ctx.fill();
      const m2 = spine[5];
      ctx.beginPath();
      ctx.ellipse(m2.x, m2.y, baseWidth * 0.7, baseWidth * 0.45, m2.angle - 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    const finSeg = spine[1] || head;
    const finW = baseWidth * 1.1;
    const finLen = koi.length * 0.28;
    const finFlutter = Math.sin(koi.finPhase) * 0.18;

    ctx.save();
    ctx.translate(leftPts[1].x, leftPts[1].y);
    ctx.rotate(finSeg.angle + Math.PI * 0.65 + finFlutter);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.beginPath();
    ctx.ellipse(finLen * 0.45, 0, finLen * 0.55, finW * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(rightPts[1].x, rightPts[1].y);
    ctx.rotate(finSeg.angle - Math.PI * 0.65 - finFlutter);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.beginPath();
    ctx.ellipse(finLen * 0.45, 0, finLen * 0.55, finW * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const tailFinAngle = tail.angle + Math.PI;
    const tailFinLen = koi.length * 0.38;
    const tailFinW = baseWidth * 1.1;
    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(tailFinAngle);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(tailFinLen * 0.5, -tailFinW * 0.9, tailFinLen * 0.9, -tailFinW * 0.7, tailFinLen, -tailFinW * 0.2);
    ctx.quadraticCurveTo(tailFinLen * 0.75, 0, tailFinLen, tailFinW * 0.2);
    ctx.bezierCurveTo(tailFinLen * 0.9, tailFinW * 0.7, tailFinLen * 0.5, tailFinW * 0.9, 0, 0);
    ctx.fill();
    ctx.restore();

    const eyeDist = baseWidth * 0.58;
    const eyeForward = baseWidth * 0.2;
    const eyeLeftX = head.x + Math.cos(head.angle) * eyeForward + Math.cos(head.angle + Math.PI / 2) * eyeDist;
    const eyeLeftY = head.y + Math.sin(head.angle) * eyeForward + Math.sin(head.angle + Math.PI / 2) * eyeDist;
    const eyeRightX = head.x + Math.cos(head.angle) * eyeForward - Math.cos(head.angle + Math.PI / 2) * eyeDist;
    const eyeRightY = head.y + Math.sin(head.angle) * eyeForward - Math.sin(head.angle + Math.PI / 2) * eyeDist;

    ctx.fillStyle = '#111417';
    ctx.beginPath();
    ctx.arc(eyeLeftX, eyeLeftY, 1.8, 0, Math.PI * 2);
    ctx.arc(eyeRightX, eyeRightY, 1.8, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawLilyPadsAndFlowers = (ctx: CanvasRenderingContext2D) => {
    const pads = lilyPadsRef.current;
    pads.forEach((pad) => {
      const renderY = pad.y + pad.bobOffset;
      ctx.save();
      ctx.translate(pad.x, renderY);
      ctx.rotate(pad.tiltAngle);

      ctx.beginPath();
      ctx.ellipse(5, 8, pad.radius * 0.95, pad.radius * 0.92, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(40, 60, 50, 0.1)';
      ctx.fill();

      const startAngle = pad.notchAngle + pad.notchWidth / 2;
      const endAngle = pad.notchAngle + Math.PI * 2 - pad.notchWidth / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, pad.radius, startAngle, endAngle, false);
      ctx.closePath();

      const padGrad = ctx.createRadialGradient(0, 0, pad.radius * 0.1, 0, 0, pad.radius);
      padGrad.addColorStop(0, '#567562');
      padGrad.addColorStop(0.65, '#769481');
      padGrad.addColorStop(0.95, '#8da797');
      padGrad.addColorStop(1, '#9db5a6');
      ctx.fillStyle = padGrad;
      ctx.fill();

      ctx.strokeStyle = 'rgba(75, 105, 85, 0.35)';
      ctx.lineWidth = 1.2;
      const veinCount = 9;
      for (let v = 0; v < veinCount; v++) {
        const veinAngle = startAngle + ((endAngle - startAngle) / (veinCount + 1)) * (v + 1);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const cpX = Math.cos(veinAngle) * pad.radius * 0.6;
        const cpY = Math.sin(veinAngle) * pad.radius * 0.6;
        const endX = Math.cos(veinAngle) * pad.radius * 0.92;
        const endY = Math.sin(veinAngle) * pad.radius * 0.92;
        ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        ctx.stroke();
      }

      ctx.fillStyle = '#3f5949';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

      if (pad.hasFlower) {
        drawLotusFlower(ctx, pad.radius * 0.72, -pad.radius * 0.65, pad.flowerColor, pad.petals);
      }
      ctx.restore();
    });
  };

  const drawLotusFlower = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: LilyPad['flowerColor'],
    petalCount: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.arc(1, 3, 14, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30, 40, 35, 0.12)';
    ctx.fill();

    const petalColor = color === 'peach' ? '#f7a89e' : color === 'white' ? '#fbfaf8' : '#f08fa2';
    for (let layer = 0; layer < 2; layer++) {
      const radius = layer === 0 ? 15 : 10;
      const count = layer === 0 ? petalCount : petalCount - 2;
      ctx.fillStyle = layer === 0 ? petalColor : '#fff6f8';
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + (layer * Math.PI) / count;
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(0, radius * 0.65, radius * 0.35, radius * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.fillStyle = '#f2bd3f';
    ctx.beginPath();
    ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawFrogs = (ctx: CanvasRenderingContext2D) => {
    const frogs = frogsRef.current;
    frogs.forEach((frog) => {
      ctx.save();
      let renderX = frog.x;
      let renderY = frog.y;
      let scale = 1;

      if (frog.state === 'jumping') {
        const p = frog.jumpProgress;
        const arc = Math.sin(p * Math.PI) * frog.jumpHeight;
        renderY -= arc;
        scale = 1 + (arc / frog.jumpHeight) * 0.22;

        ctx.save();
        ctx.translate(renderX, frog.y);
        ctx.beginPath();
        const shadowAlpha = 0.25 * (1 - (arc / frog.jumpHeight) * 0.6);
        ctx.fillStyle = `rgba(30, 45, 35, ${shadowAlpha})`;
        ctx.ellipse(0, 0, frog.size * 0.8, frog.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.translate(renderX, renderY);
      ctx.rotate(frog.facingAngle);
      ctx.scale(scale, scale);
      renderFrogBody(ctx, frog);
      ctx.restore();
    });
  };

  const renderFrogBody = (ctx: CanvasRenderingContext2D, frog: Frog) => {
    const s = frog.size;
    const breath = frog.state !== 'jumping' ? Math.sin(frog.breathPhase) * 0.06 : 0;

    ctx.fillStyle = '#4a7a58';
    if (frog.state === 'jumping' || frog.state === 'swimming') {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(-s * 0.7, -s * 0.75, s * 0.65, s * 0.22, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-s * 0.7, s * 0.75, s * 0.65, s * 0.22, 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(-s * 0.35, -s * 0.58, s * 0.45, s * 0.32, -0.4, 0, Math.PI * 2);
      ctx.ellipse(-s * 0.35, s * 0.58, s * 0.45, s * 0.32, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.beginPath();
    ctx.ellipse(s * 0.25, -s * 0.48, s * 0.28, s * 0.16, 0.3, 0, Math.PI * 2);
    ctx.ellipse(s * 0.25, s * 0.48, s * 0.28, s * 0.16, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#5c946e';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * (0.65 + breath), s * (0.52 + breath), 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e4edd8';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.42, s * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    const eyeForward = s * 0.48;
    const eyeSpacing = s * 0.38;

    ctx.fillStyle = '#659c77';
    ctx.beginPath();
    ctx.arc(eyeForward, -eyeSpacing, s * 0.22, 0, Math.PI * 2);
    ctx.arc(eyeForward, eyeSpacing, s * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1c241e';
    ctx.beginPath();
    ctx.arc(eyeForward + 1, -eyeSpacing, s * 0.12, 0, Math.PI * 2);
    ctx.arc(eyeForward + 1, eyeSpacing, s * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeForward + 1.8, -eyeSpacing - 1, 1, 0, Math.PI * 2);
    ctx.arc(eyeForward + 1.8, eyeSpacing - 1, 1, 0, Math.PI * 2);
    ctx.fill();
  };

  // 繪製日式淺灰白石岸（高對比度，凸顯昆蟲生靈）
  const drawJapaneseShoreline = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    const stones = stonesRef.current;
    stones.forEach((st) => {
      ctx.save();
      ctx.translate(st.x, st.y);
      ctx.rotate(st.rotation);

      // 石頭深層水墨陰影
      ctx.beginPath();
      ctx.ellipse(3, 8, st.radiusX * 0.98, st.radiusY * 0.88, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(20, 30, 25, 0.18)';
      ctx.fill();

      // 淺銀灰白花崗岩漸層
      const stoneGrad = ctx.createRadialGradient(-st.radiusX * 0.3, -st.radiusY * 0.35, 6, 0, 0, st.radiusX);
      stoneGrad.addColorStop(0, '#f2f6f3');
      stoneGrad.addColorStop(0.5, st.color);
      stoneGrad.addColorStop(0.9, '#a2aea6');
      stoneGrad.addColorStop(1, '#78867d');

      ctx.beginPath();
      ctx.ellipse(0, 0, st.radiusX, st.radiusY, 0, 0, Math.PI * 2);
      ctx.fillStyle = stoneGrad;
      ctx.fill();

      // 淺灰細石紋理
      ctx.strokeStyle = 'rgba(120, 135, 125, 0.2)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(-st.radiusX * 0.2, -st.radiusY * 0.1, st.radiusX * 0.35, 0.3, 1.8);
      ctx.stroke();

      // 雅緻青苔
      if (st.hasMoss) {
        ctx.fillStyle = 'rgba(80, 125, 90, 0.45)';
        ctx.beginPath();
        ctx.ellipse(-st.radiusX * 0.25, -st.radiusY * 0.2, st.radiusX * 0.4, st.radiusY * 0.3, 0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    // 石縫深綠青草叢
    const tufts = grassTuftsRef.current;
    const time = Date.now() * 0.002;
    tufts.forEach((tuft) => {
      ctx.save();
      ctx.translate(tuft.x, tuft.y);
      tuft.blades.forEach((b, i) => {
        const windLean = Math.sin(time + tuft.x * 0.05 + i) * 0.12;
        const totalLean = b.lean + windLean;
        ctx.strokeStyle = b.shade;
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const topX = Math.sin(totalLean) * b.height;
        const topY = -Math.cos(totalLean) * b.height;
        ctx.quadraticCurveTo(topX * 0.4, topY * 0.6, topX, topY);
        ctx.stroke();
      });
      ctx.restore();
    });

    // 岸邊浪痕
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, SHORE_HEIGHT);
    for (let x = 0; x <= LOGICAL_WIDTH; x += 30) {
      const wave = Math.sin(x * 0.08 + time) * 2.5;
      ctx.lineTo(x, SHORE_HEIGHT - 10 + wave);
    }
    ctx.stroke();
    ctx.restore();
  };

  // 繪製「小雪」水墨側坐形象（靈泉觀魚冥想）
  const drawXiaoXueCharacter = (ctx: CanvasRenderingContext2D) => {
    const img = xiaoXueImgRef.current;
    if (!img) return;

    ctx.save();
    // 小雪位置：右上石岸觀泉
    const posX = 265;
    const posY = 15;
    const width = 165;
    const height = 165;

    // 仙氣幽微光暈 (隨呼吸微幅縮放)
    const time = Date.now() * 0.0015;
    const auraPulse = Math.sin(time) * 4;
    const aura = ctx.createRadialGradient(
      posX + width * 0.5,
      posY + height * 0.55,
      20,
      posX + width * 0.5,
      posY + height * 0.55,
      width * 0.55 + auraPulse
    );
    aura.addColorStop(0, 'rgba(215, 240, 250, 0.3)');
    aura.addColorStop(0.7, 'rgba(190, 225, 240, 0.1)');
    aura.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(posX + width * 0.5, posY + height * 0.55, width * 0.55 + auraPulse, 0, Math.PI * 2);
    ctx.fill();

    // 採用 multiply 混合模式，讓純白背景完美自然融合進宣紙底色
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(img, posX, posY, width, height);

    ctx.restore();
  };

  // 繪製鮮明醒目的蚱蜢／蟋蟀（在淺灰石面上無比清晰）
  const drawGrasshoppers = (ctx: CanvasRenderingContext2D) => {
    const hoppers = grasshoppersRef.current;
    hoppers.forEach((hopper) => {
      ctx.save();
      ctx.translate(hopper.x, hopper.y);
      ctx.rotate(hopper.facingAngle);

      const s = hopper.size;
      const isChirping = hopper.state === 'chirping';
      const wingVibe = isChirping ? Math.sin(Date.now() * 0.08) * 1.5 : 0;

      // 1. 清晰石面深色微陰影（大幅增加立體感與可見度）
      ctx.beginPath();
      ctx.ellipse(1.5, 3.5, s * 0.65, s * 0.28, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(20, 35, 25, 0.35)';
      ctx.fill();

      // 2. 後腿 (鮮活深翠綠，粗壯大腿折角)
      ctx.strokeStyle = '#1b5e20';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-s * 0.1, -s * 0.2);
      ctx.lineTo(-s * 0.5, -s * 0.7);
      ctx.lineTo(-s * 0.75, -s * 0.1);
      ctx.moveTo(-s * 0.1, s * 0.2);
      ctx.lineTo(-s * 0.5, s * 0.7);
      ctx.lineTo(-s * 0.75, s * 0.1);
      ctx.stroke();

      // 3. 翠綠主軀幹
      ctx.fillStyle = '#2e7d32';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.65, s * 0.26 + (isChirping ? 0.02 : 0), 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. 背部亮綠薄翼
      ctx.fillStyle = '#43a047';
      ctx.beginPath();
      ctx.ellipse(-s * 0.1, wingVibe * 0.3, s * 0.5, s * 0.19, 0, 0, Math.PI * 2);
      ctx.fill();

      // 5. 頭部
      ctx.fillStyle = '#388e3c';
      ctx.beginPath();
      ctx.arc(s * 0.55, 0, s * 0.23, 0, Math.PI * 2);
      ctx.fill();

      // 6. 金黃色長觸角（在淺灰石塊上極度鮮明）
      const antWiggle = Math.sin(hopper.antennaPhase) * 0.18;
      ctx.strokeStyle = '#c68400';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(s * 0.65, -2);
      ctx.quadraticCurveTo(s * 1.05, -s * 0.55 + antWiggle, s * 1.45, -s * 0.75);
      ctx.moveTo(s * 0.65, 2);
      ctx.quadraticCurveTo(s * 1.05, s * 0.55 - antWiggle, s * 1.45, s * 0.75);
      ctx.stroke();

      // 鳴叫聲波光環
      if (isChirping) {
        ctx.strokeStyle = 'rgba(46, 125, 50, 0.6)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, 0, s * 1.3, -0.6, 0.6);
        ctx.stroke();
      }

      ctx.restore();
    });
  };

  // 繪製散落靈泉魚食
  const drawFishFood = (ctx: CanvasRenderingContext2D) => {
    const foods = foodRef.current;
    ctx.save();
    foods.forEach((f) => {
      ctx.fillStyle = `rgba(224, 140, 50, ${f.alpha})`;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  };

  const drawDragonflies = (ctx: CanvasRenderingContext2D) => {
    const dfList = dragonfliesRef.current;
    dfList.forEach((df) => {
      ctx.save();
      ctx.translate(df.x, df.y);
      ctx.rotate(df.facingAngle);

      const s = df.size;
      const wingFlap = Math.sin(df.wingPhase) * 0.38;

      ctx.save();
      ctx.translate(0, 18);
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.6, s * 0.15, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(30, 45, 35, 0.15)';
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = df.color;
      ctx.beginPath();
      ctx.ellipse(-s * 0.4, 0, s * 0.6, s * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#222826';
      ctx.beginPath();
      ctx.ellipse(s * 0.25, 0, s * 0.18, s * 0.14, 0, 0, Math.PI * 2);
      ctx.arc(s * 0.45, 0, s * 0.14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(235, 245, 255, 0.65)';
      ctx.strokeStyle = 'rgba(160, 190, 210, 0.5)';
      ctx.lineWidth = 0.8;

      ctx.save();
      ctx.rotate(wingFlap);
      ctx.beginPath();
      ctx.ellipse(s * 0.15, -s * 0.7, s * 0.18, s * 0.7, -0.2, 0, Math.PI * 2);
      ctx.ellipse(s * 0.15, s * 0.7, s * 0.18, s * 0.7, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.rotate(-wingFlap * 0.9);
      ctx.beginPath();
      ctx.ellipse(-s * 0.05, -s * 0.6, s * 0.15, s * 0.6, -0.3, 0, Math.PI * 2);
      ctx.ellipse(-s * 0.05, s * 0.6, s * 0.15, s * 0.6, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    });
  };

  const drawWaterRipples = (ctx: CanvasRenderingContext2D) => {
    const ripples = ripplesRef.current;
    ctx.save();
    ripples.forEach((rip) => {
      ctx.beginPath();
      ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${rip.alpha * 0.85})`;
      ctx.lineWidth = rip.lineWidth;
      ctx.stroke();

      if (rip.radius > 12) {
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius * 0.65, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(180, 215, 200, ${rip.alpha * 0.4})`;
        ctx.lineWidth = rip.lineWidth * 0.75;
        ctx.stroke();
      }
    });
    ctx.restore();
  };

  const drawWaterSurfaceLight = (ctx: CanvasRenderingContext2D, tint: string) => {
    ctx.save();
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    if (config.mood === 'night') {
      const time = Date.now() * 0.001;
      const fireflies = [
        { x: 100 + Math.sin(time * 0.7) * 40, y: 320 + Math.cos(time * 0.5) * 30 },
        { x: 320 + Math.cos(time * 0.8) * 45, y: 480 + Math.sin(time * 0.6) * 35 },
        { x: 210 + Math.sin(time * 0.9) * 35, y: 640 + Math.cos(time * 0.7) * 40 },
      ];
      fireflies.forEach((ff) => {
        const glow = ctx.createRadialGradient(ff.x, ff.y, 0, ff.x, ff.y, 14);
        glow.addColorStop(0, 'rgba(215, 255, 120, 0.8)');
        glow.addColorStop(0.3, 'rgba(180, 240, 90, 0.35)');
        glow.addColorStop(1, 'rgba(180, 240, 90, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(ff.x, ff.y, 14, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.restore();
  };

  const handleInteraction = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = LOGICAL_WIDTH / rect.width;
    const scaleY = LOGICAL_HEIGHT / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // 檢查是否點擊在小雪區域（右上方石岸觀泉處）
    if (config.showXiaoXue && x >= 240 && x <= 445 && y >= 10 && y <= 185) {
      handleXiaoXueFeed();
      return;
    }

    zenAudio.ensureRunning();
    zenAudio.playDropChime();

    createWaterRipple(x, y, ecosystemConfig.environment.rippleMaxRadius, 1.8);
    createWaterRipple(x, y, ecosystemConfig.environment.rippleMaxRadius * 0.6, 1.2);

    const { fleeSpeed } = ecosystemConfig.physicsAndBehavior.koi;
    koiRef.current.forEach((koi) => {
      const dist = Math.hypot(koi.x - x, koi.y - y);
      if (dist < 110) {
        const fleeAngle = Math.atan2(koi.y - y, koi.x - x);
        koi.targetAngle = fleeAngle + (Math.random() - 0.5) * 0.4;
        koi.targetSpeed = fleeSpeed;
        koi.speed = fleeSpeed * 0.85;
        koi.wiggleSpeed = 0.16;
        koi.waypointX = Math.max(50, Math.min(LOGICAL_WIDTH - 50, koi.x + Math.cos(fleeAngle) * 160));
        koi.waypointY = Math.max(SHORE_HEIGHT + 40, Math.min(LOGICAL_HEIGHT - 50, koi.y + Math.sin(fleeAngle) * 160));
      }
    });

    lilyPadsRef.current.forEach((pad) => {
      const dist = Math.hypot(pad.x - x, pad.y - y);
      if (dist < pad.radius + 15) {
        pad.tiltTarget = 0.12;
      }
    });
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-stone-900">
      <canvas
        ref={canvasRef}
        width={LOGICAL_WIDTH}
        height={LOGICAL_HEIGHT}
        className="w-full h-full object-contain cursor-pointer select-none touch-none"
        style={{ aspectRatio: '9 / 16' }}
        onPointerDown={(e) => {
          handleInteraction(e.clientX, e.clientY);
        }}
      />
    </div>
  );
});

