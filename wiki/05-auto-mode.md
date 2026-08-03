# 05 · 自動模式

> 涵蓋：`js/screen-fishing.js › autoModal() / startAuto() / resolveAuto() / stopAuto() / autoSummary() / renderAutoLog() / renderAutoStats()`
> 相關：[04 釣魚循環](04-fishing-loop.md)、[02 存檔](02-state-and-save.md)

連續拋竿並自動處理漁獲。設定會存進 `state.data.auto` 沿用。

## 執行中的狀態物件 · `S.auto`

`null` 代表手動模式。啟動時由 `startAuto(cfg)` 建立：

```js
{
  // ── 來自設定 ──
  total:       50,        // 目標局數，0 = 無限
  speed:       2,         // 演出速度倍率 1 / 2 / 4
  sellMode:    'rare',    // 'all' 全賣 | 'rare' 稀有以上收藏 | 'keep' 全部收藏
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
2. 判斷 wantKeep（非雜物 且（sellMode==='keep' 或 sellMode==='rare' 且 order>=rare））
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

## 停止條件

| 條件 | 檢查位置 | reason 文字 |
|---|---|---|
| 釣到 ≥ `stopRarity` | `resolveAuto()` | `釣到「魚名」（稀有度）` |
| 達到 `total` 局 | `resolveAuto()` | `完成 N 局` |
| 籌碼 < `stopChips` | `resolveAuto()` | `籌碼低於設定的 N` |
| 魚缸滿且該收藏 | `resolveAuto()` | `魚缸已滿，這條「魚名」請手動處理` |
| 餌料用完且未開自動補貨 | `resolveAuto()` | `餌料用完` |
| 籌碼不足以拋竿 | `resolveAuto()` / `cast()` | `籌碼不足` |
| 切換釣點 | `state.on('loc')` | `切換釣點` |
| 手動按停止 | `#autoBtn` | `手動停止` |

**新增停止條件的地方就是 `resolveAuto()` 步驟 7**，照現有格式插一段 `if (...) { this.stopAuto('原因'); return; }` 即可。記得同步更新這張表和設定畫面。

### 自動補貨的判斷

```js
if (a.autoBuyBait && st.canPay(bait.price * bait.pack + st.castCost())) {
  st.buyBait(bait, 1);
  a.cost += bait.price * bait.pack;   // 補貨費用要計入本次結算的支出
  ...
}
```

刻意多留一筆 `castCost()` 的餘裕——只夠買餌但買完連一竿都拋不了的話，買了也沒意義。

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

新增設定項目就多呼叫一次 `seg(...)`，記得：
1. 加進 `startAuto()` 寫回 `state.data.auto` 的物件。
2. 加進 `freshSave()` 的 `auto` 預設值（[02](02-state-and-save.md)）。
3. 加進 `autoModal()` 開頭 `Object.assign` 的預設值（舊存檔沒有該欄位時的 fallback）。

籌碼下限用的是真的 `<input type="number">`（`.num-input`），旁邊四顆快捷鍵。手機上數字鍵盤會自動跳出。
