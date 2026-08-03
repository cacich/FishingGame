# 08 · 介面與畫面

> 涵蓋：`styles.css`、`js/ui.js`、`js/screen-daily.js`、`js/screen-home.js`、`js/screen-shop.js`、`js/screen-codex.js`
> 相關：[01 架構 §畫面模組契約](01-architecture.md#畫面模組契約)

## 版面骨架

```
#app  (max-width 480px，置中，height 100dvh，flex column)
 ├ #topbar    46px  地點按鈕 · 籌碼餘額 · ＋（儲值）
 ├ #screens   flex:1  五個 .screen 疊在一起，只有 .active 顯示
 └ #tabbar    58px + safe-area  五個分頁按鈕
#modalRoot   fixed 全螢幕遮罩
#toastRoot   fixed 頂部置中
```

桌機上會被夾成 480px 寬的手機比例。`100dvh` 處理行動瀏覽器網址列伸縮。

## 五個分頁

| 順序 | id | 檔案 | 有 frame() | 重點 |
|---|---|---|---|---|
| 1 | `fishing` | screen-fishing.js | ✔ | 主玩法，見 [04](04-fishing-loop.md) [05](05-auto-mode.md) |
| 2 | `daily` | screen-daily.js | | 簽到＋任務＋釣點切換 |
| 3 | `home` | screen-home.js | ✔ | 房間動畫＋魚缸＋裝飾＋統計＋設定入口 |
| 4 | `shop` | screen-shop.js | | 釣竿／餌料／裝備三個分頁 |
| 5 | `codex` | screen-codex.js | | 依釣點與稀有度分組的圖鑑 |

順序由 `main.js › SCREENS` 陣列決定。

### 每日 · screen-daily.js

- **簽到**：七格網格。已領 `.got`（打勾＋降透明度）、今天可領 `.today`（金色框）。索引邏輯是 `streak % 7`。
- **任務**：進度條 `.bar > i`，完成未領顯示金色領取鍵。
- **釣點卡**：`px.locThumb()` 縮圖＋前往／解鎖按鈕。跟 `main.js › locationPicker()` 是**兩份幾乎相同的程式碼**——改一邊記得改另一邊（已知的技術債，見 [11](11-invariants-and-gotchas.md#8-釣點卡有兩份實作)）。

### 家園 · screen-home.js

上半固定 `aspect-ratio: 200/150` 的房間 canvas，下半可捲動的四個面板：魚缸擴建、展示中的漁獲、家園裝飾、生涯紀錄（底部有設定入口）。

`frame()` 做兩件事：呼叫 `px.drawRoom()`、然後在回傳的魚缸矩形內畫游動的魚。游動狀態 `S.swimmers[uid]` 每幀跟 `data.tank` 對帳（新增的魚給隨機初始位置，移除的魚刪掉狀態）。

魚的縮放依實際體長佔該魚種上限的比例：`scale = 0.2 + rel * 0.14`，所以大物在缸裡看得出來。

### 商店 · screen-shop.js

`onShow(arg)` 接受 `'rod' | 'bait' | 'equip'` 直接跳到指定分頁——釣魚畫面的「餌料不足」就是用 `FG.go('shop', 'bait')` 導過來的。

### 圖鑑 · screen-codex.js

依稀有度**由高到低**分組（`FG.RARITY_ORDER.reverse()`）。未捕獲的格子用 CSS `filter: brightness(0) opacity(.35)` 變成純黑剪影——**同一張精靈圖，不需要另外準備剪影素材**。點格子開詳細彈窗（傳說文字只有捕獲後才看得到）。

---

## UI 元件 · `js/ui.js`

### Toast

```js
FG.ui.toast(msg, kind, ms)   // kind: 'good' | 'bad' | 'gold' | 省略
```

自動堆疊、1.6 秒後淡出。**不會阻擋操作**，用於「已購買」「賣出獲得 N」這類回饋。

### 彈窗

```js
FG.ui.modal({
  title:       '標題' | false,        // false = 不要標題列（結果卡用）
  body:        HTMLElement | HTML字串,
  buttons:     [{ label, cls, close, onClick(handle) }],
  dismissable: true,                  // false = 點外面不關（結果卡用）
  cardClass:   '',
  onClose:     fn
});
// 回傳 { el, body, close() }
```

- `cls` 用 `.btn` 的變體：`primary`（綠）／`gold`（金）／`danger`（紅）／`ghost`（灰）。
- `close: false` → 按了不自動關閉，讓 `onClick` 自己決定（收藏失敗時要留在原地跳 toast）。

```js
FG.ui.confirm(title, msg, okLabel, onOk, okCls)   // 兩顆按鈕的簡化版
FG.ui.closeAll()                                   // 清空堆疊，強制關閉
```

### 彈窗堆疊

`modalStack` 記錄開啟過的 opts。關閉最上層時會**自動重新開啟上一層**：

```
開 A → stack [A]
開 B → stack [A, B]   （DOM 被 B 取代，但 A 的 body 元素物件還在）
關 B → pop B、pop A、重新 modal(A) → stack [A]
```

自動模式「魚缸滿 → 結算彈窗 → 結果卡 → 關掉結果卡 → 露出結算彈窗」就是靠這個。

> 注意：重新開啟時是拿原本的 `opts.body` 元素重新 append，所以**A 的內容不會重新計算**。如果 A 顯示的數字在 B 開著的期間變了，回到 A 會看到舊值。目前沒有這種情境，但加功能時要留意。

### 其他

```js
FG.ui.rarityTag(rarityKey)   // 帶顏色的稀有度標籤
FG.ui.fishThumb(fish, scale) // = FG.px.spriteEl 的包裝
```

---

## CSS 慣例

全部集中在 `styles.css`，**沒有 CSS 變數以外的抽象層**，直接改就好。

### 設計語彙

| 類別 | 用途 |
|---|---|
| `.panel` `.panel-title` | 內容區塊。標題左邊有金色小方塊，右邊 `.sub` 是灰色附註 |
| `.btn` ＋ `.primary` `.gold` `.danger` `.ghost` `.block` | 按鈕。按下去有 `translateY(2px)` 的下壓感 |
| `.item` | 商品／漁獲列（縮圖 + 資訊 + 動作按鈕） |
| `.seg` / `.seg-sm` | 分段選擇器 |
| `.tag` `.money` `.tiny` `.dim` `.mute` `.center` | 行內修飾 |
| `.bar > i` | 進度條 |
| `.empty` | 空狀態文案 |
| `.codex-grid` `.codex-cell` | 圖鑑格 |
| `.loc-card` | 釣點卡 |
| `.catch-card` | 釣獲結果卡 |

### 像素風的做法

不用圓角，靠**多層 box-shadow 疊出 3D 斜角**：

```css
box-shadow:
  inset -3px -3px 0 rgba(0,0,0,.35),      /* 右下暗面 */
  inset  3px  3px 0 rgba(255,255,255,.06),/* 左上亮面 */
  0 0 0 2px var(--line);                  /* 外框 */
```

**字型刻意用系統 sans-serif，沒有套點陣字型。** 中文點陣字型在小字級下辨識度很差，寧可讓 UI 文字清楚可讀，像素感由 canvas 內容和 UI 邊框提供。

### 所有 canvas 都要

```css
canvas { image-rendering: pixelated; image-rendering: crisp-edges; }
```

已經寫在全域選擇器，新增 canvas 不用重複寫。

### 主要 CSS 變數

```
--bg #070c12 | --panel #16212f | --panel-2 #1e2c3d | --panel-3 #263749
--ink #e8f1f7 | --ink-dim #94a7bb | --ink-mute #5f7385 | --line #0a1018
--gold #ffc44d | --green #5fd08a | --red #ff6b6b | --blue #59a6ff | --purple #b775ff
```

稀有度顏色**不在 CSS 變數裡**，在 `data.js › FG.RARITY[x].color`，由 JS 動態套用。改稀有度配色要改那裡。
