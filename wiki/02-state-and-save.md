# 02 · 狀態與存檔

> 涵蓋：`js/state.js`
> 相關：[03 經濟](03-economy.md)（抽獎邏輯也住在 state.js）、[01 架構](01-architecture.md)

## 存檔位置與版本

| 項目 | 值 |
|---|---|
| localStorage key | `fg_save_v1`（常數 `SAVE_KEY`） |
| 版本欄位 | `data.ver`，常數 `SAVE_VER = 1` |
| 另一個獨立 key | `fg_seen_intro`（開場說明看過沒，**不在存檔內**） |

`init()` 的載入邏輯：

```js
const raw = FG.store.load(SAVE_KEY, null);
this.data = (raw && raw.ver === SAVE_VER)
  ? Object.assign(freshSave(), raw)   // 版本相符 → 用預設值補齊缺少的頂層欄位
  : freshSave();                      // 版本不符或沒存檔 → 全新
```

> ⚠️ **`Object.assign` 是淺層合併。** 新增**頂層**欄位（例如 `data.newThing`）舊存檔會自動拿到預設值；但新增**巢狀**欄位（例如往 `data.stats` 裡加一個計數器）舊存檔**不會**補上，讀出來是 `undefined`。
> 對策：巢狀新欄位要嘛升 `SAVE_VER`（會清掉所有舊存檔），要嘛在 `init()` 裡寫明確的補值。詳見 [11 地雷](11-invariants-and-gotchas.md#4-存檔淺層合併)。

## 存檔結構（`freshSave()`）

```js
{
  ver: 1,
  chips: 20000,                    // 籌碼餘額
  loc: 'mist_lake',                // 目前釣點 id
  unlocked: ['mist_lake'],         // 已解鎖釣點 id 陣列
  rods: ['rod_bamboo'],            // 已擁有釣竿 id 陣列
  rod: 'rod_bamboo',               // 目前裝備的釣竿 id
  baits: { bait_bread: 20, bait_worm: 5 },  // 餌料 id → 剩餘數量
  bait: 'bait_bread',              // 目前選用的餌料 id
  equips: [],                      // 已擁有裝備 id 陣列（全部永久生效，無裝備欄位概念）
  codex: {},                       // 圖鑑：fishId → { n 捕獲次數, maxLen 最大體長, first 首次時間戳 }
  tank: [],                        // 家園魚缸內的漁獲實例陣列（見下方「漁獲實例」）
  tankLevel: 1,                    // 魚缸等級，對應 FG.TANK_LEVELS
  deco: {},                        // 已購買裝飾：decoId → true
  packsBought: {},                 // 籌碼包購買次數：packId → n（限購判斷用）
  signin: { date: '', streak: 0 }, // 簽到：最後領取日期字串、連續天數
  daily: { date: '', prog: {}, claimed: {} },  // 每日任務：日期、track→進度、missionId→已領
  stats: { casts, caught, sold, earned, spent, kings },  // 生涯統計
  auto: { rounds, sellMode, stopChips, stopRarity, speed, autoBuyBait },  // 自動模式設定，見 05
  sfx: true                        // 音效開關
}
```

### 漁獲實例（catch instance）

`rollCatch()` 產出、也是 `tank[]` 裡存的東西。這是**遊戲中唯一的「物件實例」概念**——魚的種類定義在 `data.js` 是靜態的，實例則帶有這一條魚的個體資料：

```js
{
  uid:      'c1a2b3...',   // 唯一 id，時間戳 + 亂數
  fishId:   'ml_bass',     // 指向 data.js 的魚種定義
  locId:    'mist_lake',   // 在哪釣到的
  len:      38.4,          // 體長 cm（小數 1 位）
  weight:   1.13,          // 重量 kg（小數 2 位）
  value:    412,           // 估價／售價（籌碼）
  shiny:    false,         // 閃光個體（3%，價值 ×3）
  isNew:    true,          // 是否為圖鑑新紀錄（抽獎當下判定）
  isRecord: false,         // 是否刷新該魚種的最大體長
  rarity:   'good',        // 冗餘欄位，方便不查 data 就能判斷
  t:        1754...        // 時間戳
}
```

> `isNew` / `isRecord` 是**抽獎當下**對照圖鑑算出來的，一旦 `recordCatch()` 寫入圖鑑就不再成立。所以要用這兩個旗標一定要在寫入前後小心順序。

## 事件

```js
FG.state.on(evt, fn);
FG.state.emit(evt, payload);
```

| 事件 | 什麼時候發 | 誰在聽 |
|---|---|---|
| `chips` | 籌碼增減（`addChips` / `pay`） | 商店（重繪買得起與否）、家園 |
| `gear` | 釣竿／餌料／裝備變動 | 釣魚（更新裝備列）、商店 |
| `loc` | 切換或解鎖釣點 | 釣魚（換場景、停自動）、圖鑑 |
| `codex` | `recordCatch()` 寫入圖鑑 | 釣魚（更新圖鑑進度）、圖鑑 |
| `tank` | 收藏／賣出／放生／魚缸升級／買裝飾 | 家園 |
| `daily` | 簽到、任務進度、領獎 | 每日 |
| `all` | `reset()`；**且任何其他事件都會連帶觸發** | `main.js › refreshTop()` |

實作細節：`emit(evt)` 先跑 `listeners[evt]`，接著只要 `evt !== 'all'` 就再跑一次 `listeners.all`。這讓頂部列只訂閱一次就能對所有變動反應。

**沒有 `off()`**。分頁只 `build()` 一次、訂閱一次，所以不需要解除訂閱。如果未來有動態建立／銷毀的元件，要先補這個。

## API 分類

### 籌碼
| 方法 | 說明 |
|---|---|
| `addChips(n)` | 加籌碼，正數會累計進 `stats.earned` |
| `canPay(n)` | 純查詢，不扣款 |
| `pay(n)` | 扣款，成功回 `true` 並累計 `stats.spent`；餘額不足回 `false` **且不扣** |

**慣例：先 `canPay()` 判斷再 `pay()`，或直接用 `pay()` 的回傳值當條件。** 商店類方法統一回傳字串狀態碼：`'ok' | 'poor' | 'owned' | 'max' | 'soon'`，呼叫端據此決定 toast 內容。

### 目前裝備查詢
| 方法 | 回傳 |
|---|---|
| `rod()` | 釣竿**物件**（注意：`data.rod` 是 id 字串，兩者名字一樣容易搞混） |
| `bait()` | 餌料**物件** |
| `baitCount(id?)` | 餌料剩餘數，省略 id 則查目前選用的 |
| `loc()` | 釣點**物件** |

### 加成彙總 · `bonus(loc?)`

把**釣竿 + 裝備 + 家園裝飾**的效果乘算成一包：

```js
{ rareMul, valueMul, costMul, sizeBonus, kingMul, showHint }
```

**`loc` 參數是必要的**：裝備可以是「釣點專屬」（`effect.loc`），只在該釣點生效，所以彙總時必須知道在算哪個釣點。接受釣點物件或 id 字串，**省略時退回 `data.loc`**（目前所在釣點），所以既有呼叫端不用全部改。

呼叫端一律要把 loc 傳進去：`castCost(loc)` / `rarityTable(loc)` / `rollCatch(loc)` 內部都是 `this.bonus(loc)`。漏傳的症狀是「在 A 釣點看到 B 釣點專屬裝備的加成」——不會報錯，只會數字不對。

> ⚠️ **餌料的加成不在 `bonus()` 裡。** 餌料是「每次消耗」的東西，效果在 `rarityTable()` 與 `rollCatch()` 裡另外乘上去。要計算實際總加成，必須自己 `bonus().rareMul * bait().rareMul`。這個不對稱是刻意的（餌料可即時切換、其他是持久狀態），但很容易寫錯。

### 抽獎與經濟
`castCost()` / `rarityTable()` / `rollCatch()` / `recordCatch()` — 全部詳見 [03 經濟與抽獎](03-economy.md)。

### 魚缸
| 方法 | 說明 |
|---|---|
| `tankCap()` | 目前容量，查 `FG.TANK_LEVELS` |
| `tankFull()` | 是否已滿 |
| `collect(inst)` | 放進魚缸，滿了回 `false`（**呼叫端必須處理失敗**） |
| `sell(inst, fromTank)` | 賣出。`fromTank=true` 會先從 `tank[]` 移除；結果卡直接賣則傳 `false` |
| `release(inst)` | 放生，從魚缸移除且不給籌碼 |

> 賣出／放生**不會**動圖鑑。圖鑑是「看過就永久記錄」，這是刻意的設計——否則玩家會不敢賣魚。

### 商店
`buyRod` / `equipRod` / `buyBait` / `useBait` / `selectBait` / `buyEquip`

`useBait()` 的隱藏行為：扣掉最後一份時會**自動切換到還有庫存的餌料**（掃 `FG.BAITS` 找第一個庫存 >0 的）。都沒庫存則維持原樣，由 `canCast()` 擋下。

### 釣點
`isUnlocked(loc)` / `unlockLoc(loc)` / `setLoc(loc)`。

`isUnlocked()` 有兩條路：**`loc.unlock.free` 為真就直接回 `true`**，否則才查 `data.unlocked[]`。這個順序讓「把釣點改成免費／改回收費」變成只要動 `data.js` 的一行，舊存檔不用遷移也不用升 `SAVE_VER`。

**目前十六個釣點全部是 `unlock: { free: true }`**，所以 `unlockLoc()` 與 `data.unlocked[]` 現在都跑不到（新存檔的 `unlocked` 仍然初始化成 `['mist_lake']`，只是沒人讀它）。`unlockLoc` 對 `comingSoon` 的地點回傳 `'soon'` 也一樣跑不到——兩者都保留給未來的收費／預告釣點（見 [11 §15](11-invariants-and-gotchas.md#15-comingsoon-與釣點解鎖目前都沒有釣點在用)）。

### 每日
| 方法 | 說明 |
|---|---|
| `rollDaily()` | 比對 `FG.todayKey()`，跨日就清空當日進度。在 `init()` 與每次進每日分頁時呼叫 |
| `bumpMission(track, n)` | 累加任務進度。track 名稱定義在 `FG.MISSIONS` 的 `track` 欄位 |
| `missionState(m)` | 回 `{ cur, done, claimed }` |
| `claimMission(m)` | 領獎 |
| `signinState()` | 回 `{ canClaim, streak, todayIndex }` |
| `claimSignin()` | 簽到，回傳當天的獎勵定義 |
| `dailyBadge()` | 底部導覽紅點的判斷條件 |

**任務進度的觸發點在 `recordCatch()`**：`casts` / `rares` / `newCodex` 三個 track 在那裡累加；`sells` 在 `sell()` 裡。跨日判定用本地時區的 `YYYY-M-D` 字串，沒有時區處理。

### 圖鑑
`codexProgress(loc)` 回 `{ got, total }`，**只算非雜物**（`f.junkArt` 為真的不列入分母）。

## 重置

`reset()` 清掉 `fg_save_v1`、重建預設存檔、`emit('all')`。**不會**清 `fg_seen_intro`，所以重置後不會再跳開場說明。入口：家園分頁底部「設定 / 音效 / 重置存檔」。
