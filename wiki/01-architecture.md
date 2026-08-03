# 01 · 架構

> 涵蓋：`index.html`、`js/util.js`、`js/main.js`，以及跨檔案的共用契約
> 相關：[02 狀態](02-state-and-save.md)、[08 介面](08-ui-and-screens.md)

## 全域命名空間

整個專案只污染一個全域：`window.FG`。每個檔案的形狀都是：

```js
window.FG = window.FG || {};
(function (FG) {
  'use strict';
  // ... 掛東西到 FG
})(window.FG);
```

沒有模組系統、沒有 bundler。**這是刻意的**——為了讓 `file://` 直接雙擊能跑（ES module 在 `file://` 下會被 CORS 擋死）。

## 載入順序（`index.html`）

順序有依賴意義，不能隨意調換：

```
util.js          無依賴。亂數／色彩／格式化／DOM／localStorage／音效
  ↓
pixel.js         依賴 util（FG.seeded / FG.shade / FG.mix / FG.clamp / FG.lerp）
  ↓
data.js          依賴 util（無強依賴，但慣例放這）。定義 FG.RARITY / FG.LOCATIONS / 各商店表
  ↓
state.js         依賴 data（FG.RODS/BAITS/EQUIPS/LOCATIONS…）＋ util（FG.store）
  ↓
ui.js            依賴 util（FG.el/FG.esc）＋ data（FG.RARITY）＋ pixel（FG.px.spriteEl）
  ↓
screen-*.js ×5   依賴以上全部。只註冊物件，不執行任何啟動邏輯
  ↓
pwa.js           依賴 util（FG.store）＋ ui（FG.ui.toast）。註冊 Service Worker、
                 處理安裝流程。→ 詳見 13-pwa-and-deploy
  ↓
main.js          最後執行，boot() 把所有東西串起來
```

新增檔案時：**工具類放 util 之後、data 之前；畫面類放 screen-\* 群組裡；main.js 永遠最後。**

> ⚠️ 新增任何 js 檔，**同時要把它加進 `sw.js` 的 `ASSETS` 清單並把 `VERSION` 加一**，否則離線時抓不到那個檔案，整個 App 開不起來。

## `util.js` 提供什麼

| 分類 | API |
|---|---|
| 亂數 | `FG.seeded(seed)`（mulberry32，回傳 rng 函式）、`FG.rand(a,b)`、`FG.randInt`、`FG.pick`、`FG.weightedPick(items, weightOf)`、`FG.skewed(power)` |
| 數學 | `FG.clamp(v,a,b)`、`FG.lerp(a,b,t)` |
| 色彩 | `FG.shade(hex, amt)`（amt>0 變亮、<0 變暗）、`FG.mix(h1,h2,t)`、`FG.hex2rgb` |
| 格式 | `FG.fmt(n)`（千分位）、`FG.fmtShort(n)`（萬／億縮寫）、`FG.todayKey()`（`YYYY-M-D`，本地時區） |
| DOM | `FG.$`、`FG.$$`、`FG.el(tag, cls, html)`、`FG.esc(str)` |
| 儲存 | `FG.store.load/save/clear`，全部 try/catch 包住（`file://` 或隱私模式下 localStorage 可能拋錯） |
| 音效 | `FG.sfx.click/cast/splash/bite/coin/win/fail`，WebAudio 即時合成，無音檔 |

**`FG.seeded` 的用途**：讓場景細節（樹林分佈、水面反光位置）每次重繪都長一樣。傳同一個 seed 就得到同一串亂數。地點資料裡的 `seed` 欄位就是餵這個用的。

**音效解鎖**：瀏覽器要求使用者互動後才能啟動 AudioContext。`main.js › boot()` 綁了一次性的 `pointerdown` 呼叫 `FG.sfx.init()`。

## 畫面模組契約

五個分頁（`FG.screenFishing / screenDaily / screenHome / screenShop / screenCodex`）都是普通物件，必須實作：

```js
FG.screenXxx = {
  id:    'xxx',          // 唯一字串，FG.go(id) 用它切換
  label: '分頁名',        // 底部導覽顯示文字
  icon:  'fish',         // FG.px.icon() 的圖示名，見 06-pixel-engine
  build: function () {   // 【必要】回傳一個 <section class="screen"> 元素
    // 只在啟動時呼叫一次。建 DOM、綁事件、訂閱 state 事件
    return el;
  },
  onShow: function (arg) {  // 【選用】每次切到這頁時呼叫，arg 來自 FG.go(id, arg)
  },
  frame: function (now) {   // 【選用】只有需要動畫的分頁要實作，rAF 每幀呼叫
  }
};
```

規則：
- `build()` **只跑一次**，在 `main.js › boot()` 裡。回傳的元素會被存到 `s._el` 並 append 進 `#screens`。
- 分頁靠 CSS `.screen` / `.screen.active` 顯示隱藏，元素一直存在 DOM 裡。
- **只有 active 分頁的 `frame()` 會被呼叫**（見下方主迴圈），所以非 active 分頁不消耗效能。
- 目前只有 `screenFishing`（釣魚場景）與 `screenHome`（家園房間）有 `frame()`。
- 資料變動後的重繪，靠在 `build()` 裡訂閱 `FG.state.on(...)` 事件觸發自己的 `render()`。

## `main.js` 做的事

| 函式 | 職責 |
|---|---|
| `boot()` | 初始化 state → 逐一 `build()` 五個分頁 → 建底部導覽 → 綁頂部列 → `FG.go('fishing')` → 開場說明 → 啟動 rAF 迴圈 → 綁音效解鎖 |
| `FG.go(id, arg)` | 切換分頁：toggle `.active`、更新 tab 高亮、呼叫 `onShow(arg)`。**全域可用**，任何地方都能導頁（例：餌料不足時導去商店 `FG.go('shop','bait')`） |
| `buildTabs()` | 依 `SCREENS` 陣列順序生成底部導覽，圖示用 `FG.px.icon()` 畫成 canvas |
| `refreshBadges()` | 每日分頁的紅點，條件來自 `FG.state.dailyBadge()` |
| `refreshTop()` | 更新頂部籌碼數字與地點名稱。綁在 `state.on('all')`，所以任何 emit 都會刷新 |
| `FG.locationPicker()` | 頂部地點按鈕的釣點選單彈窗 |
| `FG.openTopup(title)` | 籌碼包彈窗（測試版直接發放，未串金流） |
| `FG.openSettings()` | 音效開關＋重置存檔，入口在家園分頁底部 |
| `intro()` | 首次開啟的說明彈窗，用獨立的 localStorage key `fg_seen_intro` 記錄（**不在存檔裡**，所以重置存檔不會再跳） |
| `loop(now)` | 主迴圈 |

### 主迴圈

```js
function loop(now) {
  if (active && active.frame) {
    try { active.frame(now); } catch (e) { console.error(e); }
  }
  requestAnimationFrame(loop);
}
```

- 傳給 `frame()` 的 `now` 是 rAF 的高解析時間戳（毫秒，單調遞增）。所有動畫相位都以它為基準。
- **包了 try/catch**：單一幀爆錯不會把整個迴圈打死，錯誤會進 console。除錯時記得看 console。
- 沒有 delta time 概念，動畫都用「絕對時間取 sin」或「起始時間戳相減」算進度，所以掉幀不會讓動畫走位。

## 事件匯流排

`FG.state` 內建極簡發布訂閱（見 [02](02-state-and-save.md#事件)）：

```js
FG.state.on('chips', fn);   // 訂閱
FG.state.emit('chips');     // 發布（由 state 的方法內部呼叫，外部通常不用手動 emit）
```

事件名：`chips` `gear` `loc` `codex` `tank` `daily` `all`。
`emit(x)` 會**額外**觸發 `all` 的訂閱者（`x === 'all'` 時除外）。`main.js` 用這點讓頂部列對任何變動都自動刷新。

## 資料流

```
使用者操作
   ↓
screen-*.js 的事件處理器
   ↓
FG.state.xxx()  ← 唯一允許改狀態的地方，內部負責 save() + emit()
   ↓
emit → 各分頁訂閱的 render() → 重建 DOM
   ↓（動畫部分）
rAF loop → active.frame(now) → FG.px.drawScene / drawRoom → canvas
```

**不要繞過 `FG.state` 直接改 `FG.state.data`**。直接改不會存檔、不會通知 UI。唯一例外是 `screen-fishing.js › cast()` 裡的 `st.data.stats.casts++`（單純計數，後面緊接著有 save 的呼叫）。
