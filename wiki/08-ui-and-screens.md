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

### 釣魚 · screen-fishing.js 的 `#castBar`

底部操作區由上到下四層：

```
#betRow    下注列：「下注」標籤 ＋ .seg.seg-scroll（19 檔）
#gearRow   釣竿 / 餌料 / 中獎機率 三顆 .gear-slot
#autoStats 自動模式進行中才顯示
.cast-row  拋竿鈕 ＋ 自動鈕
```

**下注列一定要用 `.seg-scroll`**：選項最多 19 檔（`FG.BETS`），用等分的 `.seg` 會把「10,000」壓到折行，跟圖鑑的釣點切換列是同一個坑（[11 §21](11-invariants-and-gotchas.md)）。實測 320px 下 19 顆按鈕全部 29px 高、寬度 40～57px、可橫向捲、body 沒有橫向溢出。

三個實作細節：

- **只列出 `≥ loc.minBet` 的檔位**（`state.betOptions(loc)`）。換釣點時列表會重建，選中的檔位由 `state.bet(loc)` 決定（低於門檻會自動抬高）。
- **選中的檔位要捲進可視範圍**，而且 `scrollEdges()` 一定要在動過 `scrollLeft` **之後**才呼叫（[11 §22](11-invariants-and-gotchas.md)）。
- **演出中不能改注**（`renderBets()` 的 onclick 檢查 `phase !== 'idle'` 就 return）。結果在 `cast()` 當下就抽好了，中途改注會讓賠付跟下注額對不上。
- 按鈕文字用 `FG.fmt()` 不用 `fmtShort()`——後者會把 10000 寫成「1萬」，跟前一格的「9,000」混在同一列看起來像兩種單位。

「中獎機率」彈窗（`rateModal()`）除了機率之外還有一欄**平均賠付**（倍率 ＋ 目前下注額的換算）。固定 RTP 之後光有機率看不出釣點差別（所有釣點的 RTP 都是 98%，差的是分布），所以倍率那一欄是必要的。

### 每日 · screen-daily.js

- **簽到**：七格網格。已領 `.got`（打勾＋降透明度）、今天可領 `.today`（金色框）。索引邏輯是 `streak % 7`。
- **任務**：進度條 `.bar > i`，完成未領顯示金色領取鍵。
- **目前釣點摘要**：只顯示當前釣點的縮圖、名稱、最低下注與圖鑑進度；點摘要或「開啟釣點地圖庫」都呼叫共用的 `main.js › FG.locationPicker()`。每日頁不再複製整份釣點清單，避免釣點數量增加時把簽到／任務頁拖成長頁，也消除了兩份切換邏輯容易不同步的技術債（[11 §8](11-invariants-and-gotchas.md#8-釣點入口只能共用地圖庫)）。

### 版面骨架的寬度前提

`#app` 是 `max-width: 480px`，所以桌機上最寬就是 480。**但下限沒有保護**——320px 級的螢幕（iPhone SE、小尺寸 Android）是實際會遇到的最窄情況，任何「用 flex 等分擠」的橫向列在那個寬度都要重新量一次。已知會受影響的兩處與解法見下節。

### 家園 · screen-home.js

上半固定 `aspect-ratio: 200/150` 的房間 canvas，下半可捲動的四個面板：魚缸擴建、展示中的漁獲、家園裝飾、生涯紀錄（底部有設定入口）。

`frame()` 做兩件事：呼叫 `px.drawRoom()`、然後在回傳的魚缸矩形內畫游動的魚。游動狀態 `S.swimmers[uid]` 每幀跟 `data.tank` 對帳（新增的魚給隨機初始位置，移除的魚刪掉狀態）。

魚的縮放依實際體長佔該魚種上限的比例：`scale = 0.2 + rel * 0.14`，所以大物在缸裡看得出來。

**朝向要寫 `drawSprite(..., sw.dir < 0)`**：精靈本身是朝右畫的（`buildFish()` 的頭在 x 大的那一端），`flip` 參數是「鏡射成朝左」。所以只有往左游（`dir < 0`）才 flip。寫成 `dir > 0` 會整缸魚倒著游，見 [11 §30](11-invariants-and-gotchas.md#30-精靈是朝右畫的flip--朝左)。

### 商店 · screen-shop.js

`onShow(arg)` 接受 `'rod' | 'bait' | 'equip'` 直接跳到指定分頁——釣魚畫面的「餌料不足」就是用 `FG.go('shop', 'bait')` 導過來的。

三個清單各有一組要維護的圖示：

| 分頁 | 圖示來源 | 加東西時 |
|---|---|---|
| 釣竿 | `rodIcon()` 的 `cols` / `grip` 色表，**用 index 取值** | **色表要跟 `FG.RODS` 一樣長**，否則圖示消失（[11 §24](11-invariants-and-gotchas.md)） |
| 餌料 | `FG.baitIcon()` 的色表，用 `% length` | 加再多都不會壞，只是顏色開始重複 |
| 裝備 | `EQUIP_ART[e.id]` 查表 | 漏補只是空白格，不影響排版 |

**釣點專屬裝備（`effect.loc`）在列表上要標三件事**，因為它是「買了就永久生效」這條規則裡唯一的例外：

1. 名稱後面掛一個「○○專屬」標籤；
2. 標籤顏色隨「目前是否在該釣點」變（綠／灰）；
3. **已持有但不在該釣點時**，描述下面多一行橘字「目前不在該釣點，效果未生效」。

沒有第 3 點的話，玩家會以為自己買了一件沒用的東西。釣竿與餌料的 `loc` 只是主題標籤（哪裡都能用），所以標籤文字刻意寫「**主題**」而不是「專屬」。

### 圖鑑 · screen-codex.js

依稀有度**由高到低**分組（`FG.RARITY_ORDER.reverse()`）。未捕獲的格子用 CSS `filter: brightness(0) opacity(.35)` 變成純黑剪影——**同一張精靈圖，不需要另外準備剪影素材**。點格子開詳細彈窗（傳說文字只有捕獲後才看得到）。

頂部的釣點切換列用 `.seg.seg-scroll`（橫向捲動），見下節。

---

## 會隨釣點數量成長的介面

釣點會持續增加，而畫面寬度不會。**三個地方會因此壞掉，各自用不同的方式解決。**

> **第三個是釣魚畫面的下注列**（`#betRow`，19 檔）。它跟第一個用同一套解法（`.seg-scroll` ＋ `scrollEdges()`），細節寫在上方 [§釣魚 · screen-fishing.js 的 `#castBar`](#釣魚--screen-fishingjs-的-castbar)。它成長的來源不是釣點數而是 `FG.BETS` 的長度，但撞牆的機制一模一樣。

### 一 · 圖鑑的釣點切換列 · `.seg-scroll`

`.seg` 的 button 是 `flex: 1`（＝ `flex-basis: 0`），所以它們**會被壓到比文字還窄**。四個中文字的釣點名在 320px 級的螢幕上就會折行，每顆按鈕高度變得不一致，整條列看起來像壞了。

實測（6 個釣點、320px 寬）：

| | 按鈕寬 | 按鈕高 |
|---|---|---|
| 原本的 `.seg` | 全部 50px | **50px（折成兩行）** |
| `.seg-scroll` | 58／70px（自然寬度） | 33px |

同樣條件下 8 個釣點，原本的 `.seg` 會折成三行（高 67px），`.seg-scroll` 仍然是 33px。

**18 個釣點 @ 320px 實測（2026-08-19）**：圖鑑切換列維持單列橫向捲動；釣魚投注列在雪見狐湯顯示 9,000／10,000，`document.documentElement.scrollWidth === clientWidth === 320`。新增兩站沒有造成折行或 body 橫向溢出。

> **`.seg-scroll` 的按鈕是 `flex: 0 0 auto`，所以寬高完全不隨數量變化。** 也就是說它**沒有數量上限**——加到第二十個釣點，按鈕還是 33px 高。真正的上限是玩家願意橫向捲多遠，那是體驗問題不是版面問題。

`.seg-scroll` 做的事：`overflow-x: auto` ＋ button 改成 `flex: 0 0 auto` ＋ `white-space: nowrap`。**寧可捲動，也不要壓縮文字。**

兩個配套處理：

- **邊緣漸層提示**（`FG.ui.scrollEdges()`）。桌機沒有觸控慣性，一條被截斷的橫向清單看起來只是「被切掉」而不是「可以捲」。用 `mask-image` 在還有內容的那一側畫 10px 漸層，不佔空間。全部放得下時 `at-start` 與 `at-end` 會同時掛上，CSS 就把遮罩關掉。
- **選中的分頁自動捲進可視範圍**。從釣魚畫面切進圖鑑時，當前釣點可能排在最後面；不捲的話玩家會以為圖鑑跳到了別的釣點。

> ⚠️ **`scrollEdges()` 必須在動過 `scrollLeft` 之後才呼叫。** 反過來會用舊的捲動位置算，漸層就蓋在錯的一側——而且 `scroll` 事件是非同步的，補不回這一幀。這個順序踩過一次，見 [11 §22](11-invariants-and-gotchas.md)。

### 二 · 全螢幕釣點地圖庫 · `.loc-atlas`

舊版 `44dvh` 彈窗一次只露出約三張大卡；即使自動捲到目前釣點，玩家要找另一站的距離仍會隨釣點數量線性增加。現在 `main.js › FG.locationPicker()` 改用 `ui.modal({ fullscreen: true })` 開啟 480px 上限的全螢幕地圖庫，頂部與每日頁共用同一入口。

畫面由上到下分成四層：

1. 固定標題與關閉鍵；
2. 搜尋框＋「全部／入門／進階／深釣」篩選；
3. 選中釣點的大型預覽，顯示最低下注、圖鑑進度、可釣項目與描述；
4. 唯一可垂直捲動的 2～3 欄卡片網格。

**分類不是依陣列索引硬切六筆**，而是依 `minBet` 判斷：入門 `≤ 600`、進階 `700～3,000`、深釣 `≥ 4,000`。現行剛好各六站；未來尾端新增更高門檻的釣點會自然落進深釣，不會因為插隊導致分類錯位。搜尋會比對名稱、副標、描述與格式化前後的最低下注額。

卡片在 `< 420px` 為兩欄，`≥ 420px` 為三欄；320px 另縮短邊距與縮圖高度，短於 650px 的螢幕會壓縮標題、預覽高度並隱藏描述，優先保住至少一段可操作的網格。點卡片只更新預覽，**不會立刻切換地點**；玩家必須再按一次「前往 ○○」，避免密集網格誤觸。解鎖與 `comingSoon` 分支雖然現行十八站用不到，仍保留在預覽主按鈕上供未來資料使用。

地圖庫的卡片與預覽都用 `pixel.js › px.locThumb()`。它會把正式的 76×50 PNG 直接 `drawImage()` 到 canvas，因此呼叫端必須維持 **76:50 的內部比例**，再由 CSS `object-fit: cover` 裁切成卡片需要的寬景；直接傳超寬尺寸會把地形水平拉扁（[11 §50](11-invariants-and-gotchas.md#50-locthumb-要保留-7650-內部比例)）。

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
  fullscreen:  false,                 // true = root 去留白，卡片可佔滿 100dvh
  onClose:     fn
});
// 回傳 { el, body, close() }
```

- `cls` 用 `.btn` 的變體：`primary`（綠）／`gold`（金）／`danger`（紅）／`ghost`（灰）。
- `close: false` → 按了不自動關閉，讓 `onClick` 自己決定（收藏失敗時要留在原地跳 toast）。
- `fullscreen: true` 只改 `#modalRoot` 的留白與卡片尺寸，仍走同一個 `modalStack`。全螢幕地圖庫上開解鎖確認窗時，確認窗關閉後會以原本的 body 元素重開地圖庫，所以搜尋、選取與捲動狀態都能保留。

```js
FG.ui.confirm(title, msg, okLabel, onOk, okCls)   // 兩顆按鈕的簡化版
FG.ui.closeAll()                                   // 清空堆疊，強制關閉
```

### 彈窗堆疊

`modalStack` 記錄開啟過的彈窗。每次 `ui.modal()` 都 push 一個獨立的 `entry = { opts }` 物件，`handle.close()` 用 **`modalStack.indexOf(entry)` 找自己的位置**，而不是假設自己在最上層。關閉最上層時會**自動重新開啟上一層**：

```
開 A → stack [A]
開 B → stack [A, B]   （DOM 被 B 取代，但 A 的 body 元素物件還在）
關 B → B 是最上層 → 移除 B、pop A、重新 modal(A) → stack [A]
```

自動模式「魚缸滿 → 結算彈窗 → 結果卡 → 關掉結果卡 → 露出結算彈窗」就是靠這個。

#### 為什麼 close() 不能直接 pop()

**關閉順序不保證後進先出。** `modal-foot` 的按鈕是「先跑 `onClick`、再自動 `close()`」——`onClick` 裡如果開了新彈窗，輪到 `close()` 時自己已經被壓到下面去了。

初版的 `close()` 是無條件 `modalStack.pop()` 兩次，於是這條路徑會**先把剛開的新彈窗從堆疊踢掉，再把自己重新開一次**。症狀是「按鈕好像沒作用，只是把同一個視窗又叫出來」——自動結算的「再跑一次」踩過（見 [11 §29](11-invariants-and-gotchas.md#29-彈窗按鈕先開新視窗再自動關掉自己堆疊會反過來吃掉新視窗)）。

現在的規則是：

| 自己在堆疊的位置 | 行為 |
|---|---|
| 最上層 | 移除自己 → 清 DOM → pop 上一層並重開 |
| **不是最上層** | **只把自己從堆疊移除，完全不碰 DOM**（畫面已經被更上層接管） |
| 已不在堆疊（關過了／被 `closeAll()` 清掉） | no-op |

所以「在按鈕 `onClick` 裡開新彈窗」是安全的寫法，不需要額外寫 `close: false`。

> 注意：重新開啟時是拿原本的 `opts.body` 元素重新 append，所以**A 的內容不會重新計算**。如果 A 顯示的數字在 B 開著的期間變了，回到 A 會看到舊值。目前沒有這種情境，但加功能時要留意。

### 其他

```js
FG.ui.rarityTag(rarityKey)        // 帶顏色的稀有度標籤
FG.ui.fishThumb(fish, scale)      // = FG.px.spriteEl 的包裝
FG.ui.scrollEdges(el, axis)       // 捲動容器的邊緣漸層提示，見 §會隨釣點數量成長的介面
```

`scrollEdges(el, axis)`：依目前捲動位置在 `el` 上掛／拿掉 `at-start` / `at-end` / `scrollable` 三個 class，CSS 用它們決定要不要畫漸層遮罩。`axis` 省略或 `'x'` 為橫向，`'y'` 為縱向。**可重複呼叫**（會先移除舊的 listener），內容重繪之後直接再呼叫一次即可；回傳那個更新函式，需要手動觸發時可以直接呼叫。

---

## CSS 慣例

全部集中在 `styles.css`，**沒有 CSS 變數以外的抽象層**，直接改就好。

### 設計語彙

| 類別 | 用途 |
|---|---|
| `.panel` `.panel-title` | 內容區塊。標題左邊有金色小方塊，右邊 `.sub` 是灰色附註 |
| `.btn` ＋ `.primary` `.gold` `.danger` `.ghost` `.block` | 按鈕。按下去有 `translateY(2px)` 的下壓感 |
| `.item` | 商品／漁獲列（縮圖 + 資訊 + 動作按鈕） |
| `.seg` / `.seg-sm` | 分段選擇器（等分擠壓） |
| `.seg.seg-scroll` | 橫向捲動的分段選擇器，**選項數量會成長的一律用這個** |
| `.bet-row` / `.bet-label` | 釣魚畫面的下注列（標籤 ＋ 內嵌一條 `.seg-scroll`） |
| `.loc-atlas*` | 全螢幕釣點地圖庫：標題、搜尋、分類、預覽與 2～3 欄卡片網格 |
| `.tag` `.money` `.tiny` `.dim` `.mute` `.center` | 行內修飾 |
| `.bar > i` | 進度條 |
| `.empty` | 空狀態文案 |
| `.codex-grid` `.codex-cell` | 圖鑑格 |
| `.daily-loc-summary` | 每日頁的目前釣點摘要；完整清單統一開 `.loc-atlas` |
| `.catch-card` | 釣獲結果卡 |
| `.cutin` ＋ `.cutin-legend` `.cutin-king` `.motif-*` `.pm-*` | 傳說／魚王的登場疊層，見下節 |
| `.devpanel` `.dev-head` `.dev-select` `#devFlag` | 開發者面板（[14](14-devtools.md)）。刻意沿用 `.set-row` / `.seg-sm` / `.rate-tbl`，只補這三個類別。`#devFlag` 是 `#topbar` 的 flex 項目（不是固定定位的浮層），見 [14 §DEBUG 標記](14-devtools.md#devflag--頂部列正中央的-debug-標記) |

### 像素風的做法

不用圓角，靠**多層 box-shadow 疊出 3D 斜角**：

```css
box-shadow:
  inset -3px -3px 0 rgba(0,0,0,.35),      /* 右下暗面 */
  inset  3px  3px 0 rgba(255,255,255,.06),/* 左上亮面 */
  0 0 0 2px var(--line);                  /* 外框 */
```

**字型刻意用系統 sans-serif，沒有套點陣字型。** 中文點陣字型在小字級下辨識度很差，寧可讓 UI 文字清楚可讀，像素感由 canvas 內容和 UI 邊框提供。

### cut-in 疊層 · `.cutin`

傳說／魚王登場演出的樣式，整段在 `styles.css` 的「傳說／魚王 cut-in」區塊。機制、骨架與資料表寫在 [04 §cut-in](04-fishing-loop.md#cut-in--傳說以上的登場演出)，這裡只記 CSS 這一側的約束。

**類名的三層結構**，JS 一次掛上：

```
.cutin  .cutin-king  .motif-spiral      ← 根元素
   └ .ci-particles.pm-burst             ← 粒子容器
```

- `.cutin-legend` / `.cutin-king` 決定**總長與收尾時機**。
- `.motif-emerge|charge|spiral|reveal` 決定魚怎麼進場、要不要黑幕／符文環。
- `.pm-up|burst|drift` 決定粒子動線。

顏色走兩個 CSS 變數 `--ci-key` / `--ci-accent`，由 `cutin.js` 從魚自己的 `colors.glow` / `colors.pattern` 寫進 style。**不要在 CSS 裡寫死稀有度顏色**——那樣十八位魚王會長得一樣。放射線與光帶用 `currentColor` 配 `color: var(--ci-key)`，因為 gradient 裡不能直接吃自訂屬性當色票。

三個硬性約束：

1. **keyframes 只動 `transform` 與 `opacity`。** 這一層蓋滿整個場景，把 `box-shadow`／`filter`／`clip-path` 放進動畫等於每幀重繪整片。揭幕型的黑幕因此做成兩塊會滑開的 `div`（`.ci-slit`）而不是 `clip-path`。
2. **收尾一律淡出到 `opacity: 0`。** 疊層有機會沒被即時移除（分頁切走時 `frame()` 會停），淡到全透明就不會變成卡住的殘影。
3. **時間軸跟 `cutin.js › DUR_LEGEND / DUR_KING` 綁死。** 改一邊要改另一邊，見 [11 §26](11-invariants-and-gotchas.md)。

疊放順序就是 DOM append 順序：`背景 → 魚 → 粒子 → 黑幕 → 文字 → 白閃`。黑幕要蓋得住魚才擋得住，文字要在黑幕之上才不會被最後留下的上下留邊切掉。

`.ci-fish` 的 `inset` 底部讓出 18%：魚是在這個框裡置中的，不讓的話大魚的下緣會壓到標語。320px 寬實測 415px 高的場景裡，魚佔 84～256、標語 273 起，不重疊。

`prefers-reduced-motion` 只拿掉震動與粒子，**不能整組把 `animation-duration` 歸零**——那會讓收尾的 `ciOut` 立刻生效，整段 cut-in 變成兩秒空白畫面。

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
