# 09 · 操作手冊

> 「我想做 X」→ 照著做。每一則最後都有**必須更新的 wiki 頁面**。
> 相關：[07 資料規格](07-data-schema.md)、[11 地雷](11-invariants-and-gotchas.md)

> ⚠️ 每一則的最後一步都是 **更新 wiki + 寫 CHANGELOG**。這不是選配，規則見 [`CLAUDE.md`](../CLAUDE.md)。

---

## 新增一種魚

1. 打開 `js/data.js`，找到目標釣點的魚陣列（`MIST_LAKE_FISH` / `FJORD_FISH` / `SHRINE_FISH` / `FROST_FISH` / `ABYSS_FISH`）。
2. 依稀有度插到對應的 `/* --- 稀有度 --- */` 區塊，欄位規格見 [07 §魚](07-data-schema.md#魚--locationfish)：
   ```js
   { id: 'ml_newfish', name: '新魚', rarity: 'rare', shape: 'flat', scale: 1.0,
     pattern: 'spot', value: 1200, minLen: 30, maxLen: 65,
     colors: { body: '#xxxxxx' }, desc: '一句描述' }
   ```
3. `id` 必須全域唯一，用釣點前綴（對照表見 [07 §釣點](07-data-schema.md#目前的五個釣點)）。
4. **`value` 要貼近該階級現有魚的水準**（差距抓 ±10% 內）。理由見 [11 §14](11-invariants-and-gotchas.md#14-加魚不改機率但會改期望值)：加魚不改變階級機率，但會直接改變該階級的期望價值。想放一條特別值錢的，**升它一階**，不要在階級內做價差。
5. 顏色照該釣點的調色規則走（[07 §各釣點的配色規則](07-data-schema.md#各釣點的配色規則)）。深淵海溝的魚幾乎都要帶 `special: ['glow']`，否則在極暗底色下整格是一團黑。
6. 重新整理頁面，去圖鑑看剪影對不對；想直接看成品，在 console 跑：
   ```js
   document.body.appendChild(FG.px.spriteEl(FG.fishById('ml_newfish'), 4))
   ```
7. 調 `shape` / `scale` / `pattern` / `colors` 到滿意。**每次改完都要重新整理**（精靈有快取）。

**注意**：如果那個階級原本沒有魚，加進去等於憑空多出整個階級的權重（[03 §rarityTable](03-economy.md#稀有度權重表--raritytableloc)）；如果那階原本就有魚，機率完全不變、只有期望值會動。

📝 **要更新**：[07 資料規格](07-data-schema.md)（若引入新的 pattern/special/junkArt，或改變了釣點的魚種數）、若影響期望值則重跑模擬更新 [10 平衡調參](10-balance-tuning.md) 的基準表。

---

## 新增一種魚的造型特徵（`shape` / `special`）

要讓一條魚**看起來**跟別人不一樣，優先順序是固定的：**輪廓 ＞ 特徵物 ＞ 花紋 ＞ 配色**。只換配色是無效的（[11 §18](11-invariants-and-gotchas.md#18-五王同型換配色不等於換造型)）。

### 加一種 `shape`

1. `js/pixel.js › SHAPES` 加一筆，欄位定義見 [06 §體型輪廓表](06-pixel-engine.md#體型輪廓表--shapes)。
2. **先動 `gamma`**（最寬處位置，`t_widest = 0.5^(1/gamma)`）與 `tailH` / `fork`，這三個決定了輪廓能不能跟既有體型區分開。
3. 用 ASCII 遮罩並排比對，比看畫面快也不會被 `fishCache` 騙：
   ```js
   // 只留 alpha >= 200，濾掉 glow 的半透明光暈（否則輪廓會虛胖 2px）
   const cv = FG.px.sprite(FG.fishById('魚id')), d = cv.getContext('2d').getImageData(0,0,96,56).data;
   let s=''; for (let y=0;y<56;y++){ for (let x=0;x<96;x++) s += d[(y*96+x)*4+3]>=200 ? '#' : '.'; s+='\n'; }
   console.log(s);
   ```

### 加一種 `special`

1. `js/pixel.js › buildFish()` 的 special 區塊（`scar` 那一段之後）加一段 `if (sp.indexOf('新key') >= 0) { ... }`。
2. **每一次寫入都要分別檢查 `x` 和 `y` 邊界**——那一段是直接寫 `col[]`，沒有 `put()` 的保護（[11 §5](11-invariants-and-gotchas.md#5-canvas-平面索引忘記檢查-x-邊界)）。
3. 顏色從 `f.colors` 讀，一律給預設值：`const c = C.新色 || '#xxxxxx';`
4. 三條經驗：細節**畫在身體像素上不要外凸**、弧線**取樣要密到步距 < 1px**、點狀特徵**要有形狀且數量要少**。理由見 [06 §特殊特徵](06-pixel-engine.md#特殊特徵--special)。
5. 若特徵會往**身體輪廓外**延伸（鬍鬚、燈籠竿），確認畫布邊緣夠不夠；不夠就要納入 `headRoom`（[11 §19](11-invariants-and-gotchas.md#19-吻端沒留空間鬍鬚會被切光)）。

📝 **要更新**：[06 像素引擎](06-pixel-engine.md)（輪廓表／special 表加一列）、[07 資料規格](07-data-schema.md)（`shape` / `special` 的可用值與 `colors` 欄位）、[12 名詞表](12-glossary.md)（可用值清單）。

---

## 新增一個釣點

1. `js/data.js` 的 `FG.LOCATIONS` 加一筆，欄位見 [07 §釣點](07-data-schema.md#釣點--fglocations)。
2. 先把 `fish: []` 留空、`comingSoon: true`，確認選單、圖鑑、縮圖都正常。
3. 選 `scene.terrain`。**不要沿用既有釣點的地形**——每個釣點一種是這個專案的原則，理由見 [06 §地形系統](06-pixel-engine.md#三之二--地形系統--terrain)。要新增地形照那一節的四個步驟做（記得補 `locThumb()` 的 `switch` case）。
4. 調 `scene` 調色盤。快速預覽：
   ```js
   document.body.appendChild(FG.px.locThumb(FG.locById('new_spot'), 200, 130))
   ```
   **改完 scene 或 terrain 一定要重新整理**（背景有 `bgCache`）。
5. 填魚。**七個階級都要有**（junk 3 / common 6 / good 5 / rare 4 / epic 2～3 / legend 2 / king 1），配額理由見 [07 §一個釣點該放幾條魚](07-data-schema.md#一個釣點該放幾條魚)。缺席的階級權重會消失，費率表會跟其他釣點不一致。
   - 扣掉雜物之後至少要有 **20 種**，圖鑑的收集進度條長度才跟其他釣點一致。
   - 每個釣點至少配一件**專屬的雜物美術**（`pixel.js › JUNK_MAPS` 加一筆），其餘可以沿用既有的圖只換名字。
6. 設 `castCost`，`unlock` 填 `{ free: true }`（現行釣點都免費，門檻靠拋竿費）。**在 `FG.LOCATIONS` 裡的位置要跟 `castCost` 遞增一致**——那個順序同時是各處 UI 的顯示順序與玩家讀到的進程順序。插隊是安全的（所有參照都用 `loc.id`）。
   各階級 `value` 用 [10 §加新釣點的抓法](10-balance-tuning.md#加新釣點的抓法) 的係數表——**係數會隨 `castCost` 遞減，不要套用固定倍數，也不要在欄位之間內插**。
7. 拿掉 `comingSoon`，用 [10 §模擬腳本](10-balance-tuning.md#模擬腳本) 驗證：
   - 滿裝倍率落在 1.9～2.5 之間，**而且要維持整條進程的單調遞增**（不能比後面的釣點高）。
   - 跑 **100 萬竿以上、跑兩次**。30 萬竿的噪音有 ±2%，會讓你追著雜訊調數值。
   - 回頭更新基準表。
8. **檢查窄螢幕的介面**。把視窗縮到 320px，看圖鑑的釣點切換列與釣點選單彈窗（[08 §會隨釣點數量成長的介面](08-ui-and-screens.md#會隨釣點數量成長的介面)）。`name` 建議 4 個字以內、`subtitle` 8 個字以內。

📝 **要更新**：[07 資料規格](07-data-schema.md) 的釣點表與配色規則表、[06 像素引擎](06-pixel-engine.md) 的地形表（若加了新地形）、[10 平衡調參](10-balance-tuning.md) 的基準表與模擬腳本、[12 名詞表](12-glossary.md) 的 id 前綴與 terrain 清單、[README](README.md) 的三十秒版本。

---

## 新增一件裝備

1. `js/data.js › FG.EQUIPS` 加一筆，`effect` 只能用既有的 key（`rareMul` `valueMul` `costMul` `sizeBonus` `showHint`）。
2. **要用新的 effect key**：得同時改 `state.js › bonus()` 讓它被彙總，再改實際消費那個值的地方。
3. `js/screen-shop.js › EQUIP_ART` 加一張 16×9 字元圖，key 用裝備 id。**忘了加圖示不會報錯，只會是空白格**。

📝 **要更新**：[07 資料規格](07-data-schema.md) 的裝備表、[03 經濟](03-economy.md)（若新增 effect key）、[10 平衡調參](10-balance-tuning.md)。

---

## 新增一種餌料 / 釣竿

1. `FG.BAITS` / `FG.RODS` 加一筆。
2. **插入位置會影響圖示配色**（`baitIcon()` / `rodIcon()` 用陣列 index 取色）。要嘛加在最後，要嘛同步調整那兩個函式的色表。

📝 **要更新**：[07 資料規格](07-data-schema.md)、[10 平衡調參](10-balance-tuning.md)。

---

## 新增一種家園裝飾

要動**三個地方**：

1. `js/data.js › FG.DECOS` — 資料。
2. `js/pixel.js › drawRoom()` — 房間裡的繪製碼，照現有的 `if (deco.xxx) { ... }` 格式加。
3. `js/screen-home.js › DECO_ART` — 商品列的 16×8 字元圖。

📝 **要更新**：[06 像素引擎 §家園房間](06-pixel-engine.md#四--家園房間)、[07 資料規格](07-data-schema.md)。

---

## 加一條「選項數量會成長」的橫向列

例如新的分段選擇器、新的分頁標籤。**不要用預設的 `.seg`**——它的 button 是 `flex: 1`，選項一多就會把中文壓到折行（[11 §21](11-invariants-and-gotchas.md#21-flex-1-的橫向列會壓縮中文到折行)）。

1. class 用 `seg seg-scroll`。
2. 內容建好之後呼叫 `FG.ui.scrollEdges(el)` 掛邊緣漸層提示。
3. **如果會程式化改 `scrollLeft`（例如把選中項捲進可視範圍），一定要先捲再呼叫 `scrollEdges()`**（[11 §22](11-invariants-and-gotchas.md#22-scrolledges-必須在動過-scrollleft-之後才呼叫)）。
4. 驗證：把視窗縮到 320px，確認所有 button 的 `offsetHeight` 一致且 ≤ 34。

📝 **要更新**：[08 介面](08-ui-and-screens.md) 的設計語彙表。

---

## 新增一個分頁

1. 建 `js/screen-xxx.js`，實作 [01 §畫面模組契約](01-architecture.md#畫面模組契約)。
2. `index.html` 在 `main.js` **之前**加 `<script>`。
3. `main.js › SCREENS` 陣列加進去（順序 = 底部導覽順序）。
4. `icon` 要是 `pixel.js › ICONS` 裡存在的 key，不然就先加一張 12×12 字元圖。
5. 需要動畫才實作 `frame(now)`；不需要就別加，省效能。

📝 **要更新**：[01 架構](01-architecture.md)、[08 介面](08-ui-and-screens.md)、[README](README.md) 的檔案總覽、[`_map.md`](_map.md)。

---

## 新增一個自動模式的停止條件

1. `screen-fishing.js › autoModal()` 加一個 `seg(...)` 或輸入欄，寫進區域變數 `cfg`。
2. `startAuto(cfg)` 把它寫進 `state.data.auto` 與 `this.auto`。
3. `state.js › freshSave()` 的 `auto` 物件補預設值。
4. `autoModal()` 開頭 `Object.assign` 的 fallback 也要補（舊存檔沒這欄位）。
5. `resolveAuto()` 的「停止條件」段落插入判斷 + `this.stopAuto('原因')` + `return`。

📝 **要更新**：[05 自動模式](05-auto-mode.md) 的停止條件表與狀態物件、[02 存檔](02-state-and-save.md) 的 schema。

---

## 調整某條魚的售價 / 稀有度

售價：改 `value`。實際售價 = `value × (體長/平均體長)² × valueMul`，所以改 `value` 是等比縮放整個範圍。
稀有度：改 `rarity`。**會連動改變整個釣點的機率分布**，一定要重跑模擬。

📝 **要更新**：[10 平衡調參](10-balance-tuning.md) 的平衡表（重跑模擬後貼新數字）。

---

## 接上真實金流

目前 `main.js › openTopup()` 的按鈕 onClick 是：

```js
const r = st.buyPack(p);   // 直接發貨
```

把它換成付款流程的 callback，**付款成功後再呼叫 `st.buyPack(p)`**。`buyPack()` 本身就是純粹的發貨函式（加籌碼、發附贈品、記錄限購），可以原樣沿用。同時記得拿掉彈窗頂部的測試版警語。

📝 **要更新**：[07 資料規格 §籌碼包](07-data-schema.md#籌碼包--fgpacks)、[README](../README.md) 的「尚未實作」清單。

---

## 加上「上鉤後的拉扯小遊戲」

目前 `reel` 階段是純演出（[04 §時間軸](04-fishing-loop.md#時間軸)）。要改成互動：

1. `frame()` 的 `case 'reel'` 換成小遊戲的狀態更新與繪製。
2. 小遊戲的成敗要能影響結果——但**結果在 `cast()` 就抽好了**。兩個選擇：
   - **保守**：失敗就整條魚跑掉（`pending` 丟棄不記錄），成功照舊。改動最小。
   - **激進**：把 `rollCatch()` 延後到小遊戲結束再抽。但這樣聲納提示（`showHint`）就沒東西可劇透，要一併改掉。
3. 自動模式必須能跳過小遊戲（自動判定成功，或用固定成功率）。

📝 **要更新**：[04 釣魚循環](04-fishing-loop.md) 整段狀態機、[05 自動模式](05-auto-mode.md)、[03 經濟](03-economy.md)（若改了抽獎時機）。

---

## 除錯常用 snippet

```js
// 給錢
FG.state.addChips(1000000)

// 直接看某條魚的精靈（4 倍）
document.body.appendChild(FG.px.spriteEl(FG.fishById('ml_king_onde'), 4))

// 一次看完所有魚
FG.LOCATIONS.flatMap(l => l.fish).forEach(f => {
  const c = FG.px.spriteEl(f, 2); c.title = f.name; document.body.appendChild(c);
})

// 強制下一竿釣到指定的魚（測試演出與結果卡）
const _orig = FG.state.rollCatch.bind(FG.state);
FG.state.rollCatch = loc => Object.assign(_orig(loc), { fishId: 'ml_king_onde', rarity: 'king', isNew: true });

// 看目前的實際機率
console.table(FG.state.rarityTable().map(r => ({ 稀有度: r.rarity.name, 機率: (r.pct*100).toFixed(2)+'%' })))

// 重置存檔
FG.state.reset(); localStorage.removeItem('fg_seen_intro'); location.reload();
```
