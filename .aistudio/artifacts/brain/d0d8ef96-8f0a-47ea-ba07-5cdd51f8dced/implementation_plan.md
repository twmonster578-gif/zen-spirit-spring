# 靜心靈泉 (Zen Spring) - 日式庭園觀賞與生態模擬

專為手機直式（9:16）設計的日式禪意水墨觀賞庭園。提供全螢幕零按鈕的沉浸式自然觀賞體驗，結合清澈靈泉、悠游錦鯉、浮動荷葉、石岸草叢中的跳躍青蛙與鳴叫蟋蟀，營造舒壓放鬆的大自然療癒氛圍。

---

## User Review & Critical Decisions

> [!IMPORTANT]
> 依據第一階段討論，以下三項核心決策已確認並納入整體架構：

- **確認決策 1：視覺風格**
  採用**極簡禪意水墨風格**（參考圖一淡雅色調與靈泉氛圍）。以米白透光底色、水墨墨韻水波、淡綠開口荷葉與微粉睡蓮為主體，洗鍊空靈、無視覺負擔。
- **確認決策 2：9:16 手機比例與岸邊構圖**
  採用**上方局部點綴日式青苔石岸與草叢，中央至下方展開大面積清澈池水與荷葉**。既滿足 9:16 直式畫面的垂直開闊感，又能為蚱蜢/蟋蟀提供鳴叫棲所，並讓青蛙展現「水中游動 ⇄ 爬上荷葉/石岸 ⇄ 撲通躍入水中」的生動自然生態。
- **確認決策 3：無按鈕沈浸與自由添加機制**
  進入畫面**預設 100% 全螢幕無 UI 按鈕**。在右下角保留一枚極隱蔽、淡雅的半透明「泉」印章符號，輕觸時平滑展開「靈泉生靈（生物召喚）」抽屜選單，可自由增減錦鯉、青蛙與蚱蜢；選單展開 3 秒無操作或再次輕觸畫面即平滑淡出，維持純淨無打擾的觀賞體驗。

---

## 1. Overview & Core Concept

- **What It Does**：
  一個專注於放鬆、冥想、觀賞的個人靈泉世界。使用者可觀賞錦鯉擺尾巡游、青蛙偶爾爬上荷葉歇息再跳入水中激起漣漪、蚱蜢在石岸草叢間微跳，並聆聽結合流水聲、蟲鳴與蛙鳴的自然白噪音。
- **Target Audience / Persona**：
  追求心靈寧靜、放鬆減壓、喜愛日式庭園與修仙水墨禪意的現代手機使用者。
- **Key Value**：
  純淨無干擾的視覺與聽覺療癒體驗，兼具自由調配庭園生態數量的個人專屬感。

---

## 2. User Experience & Visual Design

### Key User Flows

1. **進入靈泉**：
   - 載入後直接呈現 9:16 直式禪意庭園（桌面環境亦以優雅的 9:16 模擬視窗居中呈現，兩側柔和光影襯托）。
   - 水流輕輕微動，錦鯉擺尾巡游，荷葉隨微波起伏，音響緩緩淡入自然流水聲與草叢蟋蟀鳴聲。
2. **水面互動**：
   - 使用者在靈泉任意位置輕點，水面會產生真實物理擴散的水波漣漪。
   - 附近的錦鯉會受驚輕盈加速游開，隨後恢復悠然巡游。
3. **召喚與管理生物**：
   - 點擊右下角半透明水墨印章，底部滑出極簡的竹紙風格抽屜。
   - 可即時增減：
     - **錦鯉（Koi）**：可自選紅白、大正三色、黃金純色，或一鍵隨機添加。
     - **青蛙（Tree Frog）**：在石岸、荷葉與池水中自由穿梭跳水。
     - **蚱蜢／蟋蟀（Cricket & Grasshopper）**：在上方石岸草叢駐足鳴叫。
   - 提供「清空生靈」、「重設預設生態」與「環境音量調整 / 靜音」功能。
   - 設置自動保存至本地儲存（localStorage），下次進入直接恢復個人靈泉狀態。

### Visual Identity & Theme

- **Aesthetic Direction**：日式枯山水 × 東方水墨靈泉（Wabi-sabi & Zen Aesthetic）。
- **Color Palette & Mood**：
  - 底色與水域：柔和的宣紙白灰與淡碧青水色（`#F4F6F0` 至 `#E6EDE8`），池底隱約可見圓滑鵝卵石。
  - 荷葉與植被：淡綠薄荷與青苔墨綠（`#94A89A`, `#5A7365`），帶有水墨宣紙邊緣暈染感。
  - 錦鯉配色：經典丹頂紅白（朱砂紅 `#E04D36`、墨黑 `#22252A`、珍珠白 `#FAF8F5`、錦金 `#E5A83B`）。
  - 石岸：枯山水深灰青石與細緻苔痕（`#4B5550`, `#78867E`）。
- **Typography & Hierarchy**：
  - 標題與印章：傳承東方意境的楷體/明體風格（`Noto Serif TC`, `Songti SC`, 襯線古典體）。
  - 數值與微標籤：乾淨纖細無襯線（`Plus Jakarta Sans`, `system-ui`），保持低調。
- **Component Styling & Layout**：
  - 嚴格遵守 anti-slop 準則：無刺眼霓虹色、無突兀圓角膠囊、無無謂狀態跑馬燈。
  - 抽屜選單採用極致淡雅的磨砂半透明紙質感（`backdrop-blur-md bg-stone-50/90`），襯以超細 1px 宣紙邊框。

### Interactive Feedback & Motion

- **流暢 60 FPS Canvas 生態渲染**：
  - 錦鯉具有真實多關節骨架游動算法（Verlet/IK 脊椎擺動），流暢自然而非死板貼圖旋轉。
  - 青蛙具有狀態機（水中游動 ➔ 瞄準荷葉/岸邊攀爬 ➔ 駐足呼吸 ➔ 屈腿起跳 ➔ 落水激起雙重水紋與水花）。
  - 水面波紋擴散算法（物理半徑擴張與透明度衰減），與生物動作無縫連動。

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Canvas 2D 骨架動畫 vs. 靜態圖片疊加
- **Chosen Approach**：使用 HTML5 Canvas 2D 進行生物骨架計算與即時渲染（錦鯉尾鰭波動、青蛙跳水軌跡、水波擴散）。
- **Why**：參考圖二的錦鯉之所以生動，在於魚身游動時的擺尾弧度與穿梭層次；若只用 CSS 旋轉靜態圖片會極度僵硬出戲。Canvas 2D 既輕量又能在手機與電腦上維持滿幀 60fps。
- **Alternatives Considered**：純 CSS Sprite 或 Three.js 3D。純 CSS 太死板；Three.js 在此水墨平面風格下會增加過重依賴且偏離圖一的淡雅宣紙質感。

### Decision 2: 現代 Web Audio API 原生音訊合成 vs. 外掛 MP3 音檔
- **Chosen Approach**：使用瀏覽器原生 Web Audio API 建立雙重音效架構：
  1. 內建程序化自然音引擎：合成柔和流水白噪音、清脆蟋蟀叫聲、青蛙跳水的「撲通」水花聲與水滴回音。
  2. 備用高品質自然無縫音效迴圈：確保使用者在任何瀏覽器環境下都能立即聽到安詳音效，無需擔心外部音訊資源 404 斷頭。
- **Why**：零外部網路延遲、可隨青蛙跳水即時觸發音效，並精準控制蟋蟀鳴叫頻率與音量。
- **Alternatives Considered**：外部音樂連結（容易跨域失效或載入失敗）。

### Decision 3: 9:16 岸邊與水面垂直佈局空間規劃
- **Chosen Approach**：
  - 頂部 0% ~ 22%：日式石岸、青苔岩石、稀疏野草（蚱蜢棲息活動區）。
  - 中部 18% ~ 100%：開闊靈泉水域，錯落分佈 5~7 片水墨荷葉與微粉睡蓮（青蛙與錦鯉主要生活區）。
  - 邊緣交界處：淺水灘與沉水卵石，青蛙可自如往返於岸邊與水面。
- **Why**：完美解決了手機直式空間下「想看水景又想容納陸生昆蟲」的構圖挑戰。

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    Zen Spring Root (App.tsx)                 │
│  - 9:16 Responsive Frame Container (max-w-[430px] aspect)    │
│  - Persistent Ecosystem State Store (localStorage)           │
│  - Audio Engine Controller (Web Audio Context & Ambience)    │
└──────────────────────────────┬───────────────────────────────┘
                               │
       ┌───────────────────────┴───────────────────────┐
       ▼                                               ▼
┌─────────────────────────────┐         ┌─────────────────────────────┐
│    ZenCanvas (Canvas 2D)    │         │  ZenControls (Overlay Menu) │
│  - Riverbed & Stones        │         │  - Default: Pure hidden UI  │
│  - Shoreline & Moss Grass   │         │  - Bottom Corner Seal Icon  │
│  - Lily Pads & Lotus Flora  │         │  - Slide-up Creature Tray   │
│  - Koi Swarm (Multi-joint)  │         │    * Koi count & patterns   │
│  - Frogs (Hop/Swim state)   │         │    * Frog count             │
│  - Grasshoppers (Chirp)     │         │    * Cricket count          │
│  - Water Ripple Simulator   │         │    * Sound toggle & volume  │
│  - Touch / Ripple Handler   │         │  - Reset / Clear actions    │
└─────────────────────────────┘         └─────────────────────────────┘
```

### Data Model & State

```typescript
// 生物實體定義
interface KoiFish {
  id: string;
  x: number;
  y: number;
  speed: number;
  angle: number;
  targetAngle: number;
  length: number;
  pattern: 'kohaku' | 'taisho' | 'yamabuki' | 'shiro'; // 紅白, 三色, 黃金, 白水墨
  wigglePhase: number;
}

interface Frog {
  id: string;
  x: number;
  y: number;
  state: 'swimming' | 'on_pad' | 'on_shore' | 'jumping';
  targetX: number;
  targetY: number;
  jumpProgress: number; // 0..1
  facingAngle: number;
  restTimer: number;
}

interface Grasshopper {
  id: string;
  x: number; // 位於上方岸邊範圍
  y: number;
  chirpTimer: number;
  jumpTimer: number;
}

interface WaterRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

// 庭園配置儲存
interface GardenConfig {
  koiCount: number;
  frogCount: number;
  grasshopperCount: number;
  isMuted: boolean;
  volume: number;
}
```

### Interactive Component & State Mapping

| 使用者操作 | 元件 / 模組 | 狀態改變與視覺 / 聽覺回饋 |
| :--- | :--- | :--- |
| **輕觸水面任何位置** | `ZenCanvas` | 在觸控座標生成 `WaterRipple`，觸發微弱水滴音，附近錦鯉轉向加速避讓。 |
| **點擊右下角「泉」字印章** | `ZenControls` | 展開極簡紙質抽屜，印章微微發光旋轉 90 度，顯示生靈調節面板。 |
| **調整錦鯉／青蛙／蚱蜢數量** | `CreatureTray` | 即時增加或移除生物個體，新生物自水底或岸邊草叢生動游出/躍入，自動寫入儲存。 |
| **靜音 / 音量控制** | `SoundToggle` | 平滑淡入淡出自然音景（蟋蟀振翅聲、水聲、蛙鳴）。 |
| **閒置觀賞** | `Auto-Ecosystem Loop` | 生物依據自主 AI 巡游覓食、跳水、鳴叫，每隔 3~8 秒隨機自然互動。 |
