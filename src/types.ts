export type KoiPattern = 'kohaku' | 'taisho' | 'yamabuki' | 'shiro' | 'tancho';

export interface SpineSegment {
  x: number;
  y: number;
  angle: number;
}

export interface KoiFish {
  id: string;
  x: number;
  y: number;
  speed: number;
  targetSpeed: number;
  angle: number;
  targetAngle: number;
  turnSpeed: number;
  length: number;
  pattern: KoiPattern;
  wigglePhase: number;
  wiggleSpeed: number;
  spine: SpineSegment[];
  finPhase: number;
  // 優化自然悠游導航點與漫游狀態
  waypointX: number;
  waypointY: number;
  waitTimer: number;
  isGliding: boolean;
}

export type FrogState = 'on_pad' | 'on_shore' | 'jumping' | 'swimming';

export interface Frog {
  id: string;
  x: number;
  y: number;
  state: FrogState;
  facingAngle: number;
  size: number;
  // Jump physics
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  jumpProgress: number; // 0 to 1
  jumpDuration: number; // in frames
  jumpHeight: number;
  targetType: 'pad' | 'shore' | 'water';
  targetPadId?: string;
  currentPadId?: string;
  // Swimming & rest state
  swimCycle: number;
  swimSpeed: number;
  restTimer: number;
  restDuration: number;
  breathPhase: number;
}

export interface Grasshopper {
  id: string;
  x: number;
  y: number;
  size: number;
  facingAngle: number;
  state: 'idle' | 'chirping' | 'hopping';
  hopProgress: number;
  hopStartX: number;
  hopStartY: number;
  hopTargetX: number;
  hopTargetY: number;
  chirpTimer: number;
  chirpDuration: number;
  hopCooldown: number;
  antennaPhase: number;
}

export interface Dragonfly {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  facingAngle: number;
  speed: number;
  wingPhase: number;
  state: 'hovering' | 'dashing' | 'dipping';
  hoverTimer: number;
  size: number;
  color: string;
}

export interface Turtle {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  facingAngle: number;
  speed: number;
  size: number;
  state: 'swimming' | 'basking';
  paddlePhase: number;
  baskTimer: number;
}

export interface WaterRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  alpha: number;
  lineWidth: number;
  color?: string;
}

export interface LilyPad {
  id: string;
  x: number;
  y: number;
  radius: number;
  notchAngle: number;
  notchWidth: number;
  driftPhase: number;
  driftSpeed: number;
  tiltAngle: number;
  tiltTarget: number;
  hasFlower: boolean;
  flowerColor: 'pink' | 'white' | 'peach';
  petals: number;
  bobOffset: number;
}

export interface ShoreStone {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  rotation: number;
  color: string;
  hasMoss: boolean;
}

export interface GrassTuft {
  x: number;
  y: number;
  blades: { height: number; lean: number; shade: string }[];
}

export type AmbientMood = 'day' | 'dawn' | 'dusk' | 'night';

export interface GardenConfig {
  koiCount: number;
  frogCount: number;
  grasshopperCount: number;
  dragonflyCount: number;
  turtleCount: number;
  showXiaoXue: boolean;
  soundEnabled: boolean; // 靈泉自然流水環境音開關
  volume: number; // 靈泉自然環境音量
  voiceEnabled: boolean; // 小雪修仙專屬語音開關（獨立控制）
  voiceVolume: number; // 小雪語音音量（獨立控制）
  mood: AmbientMood;
}

