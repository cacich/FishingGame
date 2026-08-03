# 00 · 上手

> 涵蓋：專案定位、怎麼跑起來、必備心智模型
> 相關：[01 架構](01-architecture.md)、[09 操作手冊](09-recipes.md)、[11 地雷](11-invariants-and-gotchas.md)

## 這是什麼

手機直式的**像素風釣魚博弈 Demo**。核心是「付籌碼抽獎 → 拿到不同稀有度的魚 → 賣掉或收藏 → 再投資裝備拉高機率」的循環。

技術定位很明確：**純前端、零依賴、零建置**。雙擊 `index.html` 就能玩。這不是偷懶，是刻意的約束——Demo 要能隨手丟給任何人打開就看到東西。任何會破壞這點的改動（引入 npm、ES module、打包器、CDN 資源）都應該先討論。

## 跑起來

```bash
python -m http.server 5177
```

開 `http://localhost:5177`。或直接雙擊 `index.html`（`file://` 也能跑，因為全部是傳統 `<script>`）。

專案內附 `.claude/launch.json`，在 Claude Code 裡可用預覽工具直接啟動。

**改完 JS 畫面沒變 → 強制重新整理（Ctrl+F5）。** 見 [11 地雷 §快取](11-invariants-and-gotchas.md#1-http-server-的-js-快取)。

## 五個必備心智模型

### 1. 只有一個全域：`window.FG`

每個檔案都是 `(function(FG){ ... })(window.FG)`，把自己的東西掛到 `FG` 上。沒有模組系統、沒有 import。載入順序寫死在 `index.html`，順序有意義（後面的依賴前面的）。→ [01](01-architecture.md)

### 2. 狀態集中在 `FG.state.data`

所有玩家資料（籌碼、裝備、圖鑑、魚缸、每日進度、自動設定）都在這一個物件裡，整包序列化進 localStorage。改動狀態一律走 `FG.state` 的方法，方法內部負責 `save()` + `emit()` 通知 UI 重繪。→ [02](02-state-and-save.md)

### 3. 結果在「拋竿當下」就抽好

`rollCatch()` 在按下拋竿的那一刻就決定了釣到什麼、多大、值多少。後面 4 秒的演出純粹是播放，不影響結果。這讓聲納裝備能提前劇透稀有度，也讓自動模式可以任意加速。→ [03](03-economy.md)、[04](04-fishing-loop.md)

### 4. 美術是算出來的，不是畫出來的

沒有任何 png/svg。魚由「體型輪廓＋配色＋花紋＋特殊特徵」用數學生成像素陣列；場景由調色盤參數逐像素畫在 200×340 的 canvas 上，再交給 CSS `image-rendering: pixelated` 放大。加一種新魚＝填一筆資料，不用開繪圖軟體。→ [06](06-pixel-engine.md)

### 5. 分頁是「模組物件」

五個分頁各自是一個物件，實作 `build() / onShow() / frame()` 契約，由 `main.js` 統一註冊、切換、驅動。加分頁＝寫一個符合契約的物件、塞進 `SCREENS` 陣列。→ [01](01-architecture.md#畫面模組契約)

## 第一次改動建議路線

1. 開 [09 操作手冊](09-recipes.md)，照「新增一種魚」做一次——會同時碰到資料表、像素引擎、圖鑑，是最快的全景導覽。
2. 再看 [10 平衡調參](10-balance-tuning.md)，跑一次模擬腳本，理解數值長什麼樣。
3. 動手前掃一遍 [11 地雷](11-invariants-and-gotchas.md)。

## 別忘了

**改完要回寫 wiki。** 規則在 [`CLAUDE.md`](../CLAUDE.md)，對照表在 [`_map.md`](_map.md)。
