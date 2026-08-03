# 05 · 自動模式

> 涵蓋：`js/screen-fishing.js › autoModal() / startAuto() / resolveAuto() / stopAuto() / autoRestockBait() / autoSummary() / renderAutoLog() / renderAutoStats()`
> 相關：[04 釣魚循環](04-fishing-loop.md)、[02 存檔](02-state-and-save.md)

連續拋竿並自動處理漁獲。設定會存進 `state.data.auto` 沿用。

## 執行中的狀態物件 · `S.auto`

`null` 代表手動模式。啟動時由 `startAuto(cfg)` 建立：

```js
{
  // ── 來自設定 ──
  total:       50,        // 目標局數，0 = 無限
  speed:       2,         // 演出速度倍率 1 / 2 / 4
  sellMode:    'rare',    // 收藏門檻，見下
  stopChips:   0,         // 籌碼低於此值停止，0 = 不限
  stopRarity:  'legend',  // 'none' | 'rare' | 'epic' | 'legend' | 'king'
  autoBuyBait: true,      // 餌料用完自動補貨

  // ── 執行中累計 ──
  done: 0, cost: 0, gain: 0,
  kept: 0, sold: 0, newCodex: 0, baitBought: 0,
  best: { fishId, name, rarity, value, len } | null,
  log:  [ { name, color, value, action, shiny } ]   // 最近 5 筆，unshift 進去
}
```

**`S.auto` 是否為 null 是模式的唯一判準**，散布在多個地方：`spd()`、`refresh()`（切換 UI）、`skip()`（自動時停用）、`frame()`（排下一竿）、`cast()`（失敗處理方式）。

## 排程機制

沒有 `setInterval`，完全掛在主迴圈上：

```js
// frame() 尾端
if (this.auto && this.phase === 'idle' && now >= this.nextCastAt) this.cast(true);
```

`resolveAuto()` 結算完設定 `this.nextCastAt = now + 320 / a.speed`。

**這樣做的好處**：分頁切走時 `frame()` 不再被呼叫（[01 主迴圈](01-architecture.md#主迴圈)），自動模式自然暫停，回來又繼續，不需要額外的暫停邏輯。分頁在背景時瀏覽器也會降頻 rAF，不會偷跑。

## 結算流程 · `resolveAuto(now)`

順序很重要：

```
1. a.done++、更新 best、newCodex 計數
2. 判斷 wantKeep（`!fish.junkArt && keepsThis(a.sellMode, R)`）
3. ★ 若 wantKeep 且魚缸已滿：
      stopAuto('魚缸已滿…') → showResult() → return
      （不呼叫 recordCatch，交給 showResult 記錄，避免記兩次）
4. pending = null；recordCatch(inst)
5. 收藏或賣出
6. 音效、滾動紀錄、統計列
7. 依序檢查停止條件
8. 排下一竿
```

### 步驟 3 是刻意加的設計

初版遇到魚缸滿就 fallback 成賣出。實測時它**把剛釣到的魚王（85,365 籌碼）直接賣掉了**——玩家設定的明明是「稀有以上收藏」，結果系統擅自處分了最珍貴的一條魚。

改成：**停止自動 + 跳出正常結果卡，把決定權交回玩家**。處理完關掉結果卡，底下的結算彈窗會露出來（利用 `FG.ui.modal` 的堆疊行為，見 [08 §彈窗堆疊](08-ui-and-screens.md#彈窗堆疊)）。

設定畫面也會即時顯示「目前 3/3」提醒容量。

## 收藏門檻 · `sellMode`

`sellMode` 決定「哪些漁獲要放進魚缸、哪些直接賣掉」。判斷集中在 `screen-fishing.js › keepsThis(sellMode, R)`：

| 值 | 選項標籤 | 會收藏 |
|---|---|---|
| `all` | 全賣 | （無） |
| `good` | 優良 | good / rare / epic / legend / king |
| `rare` | 稀有 | rare / epic / legend / king |
| `epic` | 史詩 | epic / legend / king |
| `legend` | 傳說 | legend / king |
| `king` | 魚王 | 只有 king |
| `keep` | 全收 | 全部（雜物除外） |

**雜物永遠賣出**，由呼叫端的 `!fish.junkArt` 擋掉，不在 `keepsThis()` 裡處理。

### 為什麼值是稀有度 key

初版只有 `all` / `rare` / `keep` 三段。問題是**魚缸初始只有 3 格**，選「稀有以上收藏」跑不到十幾竿就滿了，然後就觸發「魚缸已滿」停止自動——等於自動模式根本跑不長。

細分成七段之後，玩家可以照魚缸容量選門檻：3 格的新手選「傳說」或「魚王」就能跑完整場，24 格的後期玩家才選「稀有」。

值刻意**直接沿用 `FG.RARITY` 的 key**（而不是另外編號），有兩個好處：
- `keepsThis()` 只要一行 `R.order >= FG.RARITY[sellMode].order`，不需要對照表。
- 舊存檔的 `'all'` / `'rare'` / `'keep'` **全都還是合法值**，不用遷移也不用升 `SAVE_VER`。

> ⚠️ `keepsThis()` 對認不得的值回傳 `false`（＝賣掉）。這是安全的方向，但如果未來新增值忘了同步，症狀會是「該收藏的魚被賣掉」而不是報錯。**新增選項時務必同時改 `KEEP_OPTS`、`KEEP_DESC` 與這張表。**

## 停止條件

| 條件 | 檢查位置 | reason 文字 |
|---|---|---|
| 釣到 ≥ `stopRarity` | `resolveAuto()` | `釣到「魚名」（稀有度）` |
| 達到 `total` 局 | `resolveAuto()` | `完成 N 局` |
| 籌碼 < `stopChips` | `resolveAuto()` | `籌碼低於設定的 N` |
| 魚缸滿且該收藏 | `resolveAuto()` | `魚缸已滿，這條「魚名」請手動處理` |
| 餌料用完且補不到（未開自動補貨，或連最便宜的餌都買不起） | `resolveAuto()` / `cast()`，皆經 `autoRestockBait()` | `餌料用完` |
| 籌碼不足以拋竿 | `resolveAuto()` / `cast()` | `籌碼不足` |
| 切換釣點 | `state.on('loc')` | `切換釣點` |
| 手動按停止 | `#autoBtn` | `手動停止` |

**新增停止條件的地方就是 `resolveAuto()` 步驟 7**，照現有格式插一段 `if (...) { this.stopAuto('原因'); return; }` 即可。記得同步更新這張表和設定畫面。

## 餌料補貨 · `autoRestockBait()`

回傳 `true` 表示「現在有餌，可以拋竿」。**由兩個地方共用同一套判斷**：

| 呼叫點 | 時機 |
|---|---|
| `cast(fromAuto)` 的 `!chk.ok` 分支 | 開場那一竿（按下「開始自動」的瞬間） |
| `resolveAuto()` 步驟 7 | 每局結算後 |

```js
autoRestockBait: function () {
  if (st.baitCount() > 0) return true;           // 還有餌，什麼都不用做
  if (!a.autoBuyBait) return false;              // 玩家選「停止自動」
  const afford = b => st.canPay(b.price * b.pack + st.castCost());
  let pick = afford(cur) ? cur : FG.BAITS.filter(afford).sort(貴→便宜)[0];
  if (!pick || st.buyBait(pick, 1) !== 'ok') return false;
  a.cost += pick.price * pick.pack;              // 補貨費用要計入本次結算的支出
  a.baitBought++;
  ...toast...
  return true;
}
```

### 三個刻意的設計

**1. 多留一筆 `castCost()` 的餘裕。** 只夠買餌但買完連一竿都拋不了的話，買了也沒意義。

**2. 開場那一竿也要走補貨。** 這是修過的 bug：原本補貨只寫在 `resolveAuto()` 裡，也就是**第一局結算之後**才會判斷。玩家在餌料歸零的狀態下按「開始自動」，`startAuto()` → `cast(true)` → `canCast()` 回 `why: 'bait'` → 直接 `stopAuto('餌料用完')`，結算彈窗顯示「執行局數 0」。等於「自動補貨」這個設定在最需要它的情況下完全無效，自動模式根本開不起來。

現在 `cast()` 的失敗分支多一層：

```js
if (fromAuto && chk.why === 'bait' && this.autoRestockBait()) { this.cast(true); return; }
```

遞迴只會發生一層——`autoRestockBait()` 回 `true` 就保證 `baitCount() > 0`，重進來不會再撞 `'bait'`。

**3. 買不起目前這款時會降級。** 從「買得起的最貴一款」往下挑。**理由**：`bait_king` 一包 4,500 籌碼，玩家一換到高級餌、手頭又不寬裕，自動模式就會開場即停，體感上就是「這個功能壞了」。降級會讓 `rareMul` / `kingMul` 跟著下降，所以 toast 一定要講清楚換成哪一款（`自動補貨：活蝦 ×10（魚王秘餌買不起，改用這款）`）。

連最便宜的 `bait_bread`（250 + 拋竿費）都買不起才回 `false` → 停止。

> `buyBait()` 會把 `data.bait` 設成買的那一款，所以降級是**會留下來的**（跟 `useBait()` 用完自動換餌的既有行為一致）。玩家在裝備列會看到餌名變了。

### 設定畫面的即時提示

「餌料用完時」下方的說明文字會顯示目前庫存與該款的整包價格，選「停止自動」而庫存為 0 時**用橘字明講「現在沒有餌，會立刻停止」**。沒有這行提示，玩家會以為是程式壞掉而不是自己沒餌。

## UI 三件套

| 元素 | 位置 | 內容 |
|---|---|---|
| `#castBtn` | 底部 | 變成「自動進行中 12/50 局」，disabled |
| `#autoBtn` | 底部右 | 變成紅色「停止」 |
| `#autoStats` | 拋竿鍵上方 | 局數／支出／收入／淨損益（正綠負紅） |
| `#autoLog` | 場景左下角 | 最近 5 筆漁獲，`column-reverse` 排列、逐筆降低 opacity |
| `#gearRow` | — | 自動進行中隱藏（避免誤觸換餌） |

> ⚠️ `#autoStats` 的 CSS 預設是 `display: none`，`renderAutoStats()` 顯示時必須明確設成 **`'flex'`**，寫 `''` 會退回樣式表的 `none`。這個 bug 踩過一次，見 [11 地雷](11-invariants-and-gotchas.md#2-displaynone-的元素用--還原無效)。

## 結算彈窗 · `autoSummary(a, reason)`

停止原因、執行局數、總支出、賣魚收入、淨損益（正綠負紅）、收藏/賣出、新增圖鑑、自動補貨包數，加上「本次最佳漁獲」（含該魚的像素圖，靠 `a.best.fishId` 查回魚種定義）。

按鈕：「關閉」與「再跑一次」（直接開設定畫面）。

## 設定畫面 · `autoModal()`

用區域變數 `cfg` 收集選擇，按「開始自動」才寫回 `state.data.auto`（取消不留痕跡）。

內部有兩個小工具函式：
- `seg(label, opts, cur, onPick)` — 產生分段選擇器（`.seg.seg-sm`），點擊時自己處理 `.on` 的切換。
- `note(html)` — 灰色小字說明。

「漁獲處理」那一列的說明文字（`KEEP_DESC`）會**跟著選擇即時更新**：`seg()` 的 `onPick` callback 裡呼叫 `refreshKeepNote()` 改寫同一個 `note` 元素的 `innerHTML`。因為 `note()` 是函式宣告（會提升），所以可以在定義之前就先呼叫。

新增設定項目就多呼叫一次 `seg(...)`，記得：
1. 加進 `startAuto()` 寫回 `state.data.auto` 的物件。
2. 加進 `freshSave()` 的 `auto` 預設值（[02](02-state-and-save.md)）。
3. 加進 `autoModal()` 開頭 `Object.assign` 的預設值（舊存檔沒有該欄位時的 fallback）。

籌碼下限用的是真的 `<input type="number">`（`.num-input`），旁邊四顆快捷鍵。手機上數字鍵盤會自動跳出。
