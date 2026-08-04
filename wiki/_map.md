# 原始碼 ↔ WIKI 對照表

> **改了左欄的檔案，就必須更新右欄的頁面。** 這是 [`CLAUDE.md`](../CLAUDE.md) 強制規則的執行清單。

## 對照表

| 原始碼 | 必須更新 | 視情況更新 |
|---|---|---|
| `index.html` | [01 架構](01-architecture.md) | [README](README.md) 檔案總覽 |
| `styles.css` | [08 介面](08-ui-and-screens.md) | |
| `js/util.js` | [01 架構](01-architecture.md) | [11 地雷](11-invariants-and-gotchas.md) |
| `js/pixel.js` | [06 像素引擎](06-pixel-engine.md) | [07 資料規格](07-data-schema.md)（新增 shape/pattern/special 時）、[11 地雷](11-invariants-and-gotchas.md) |
| `js/data.js` | [07 資料規格](07-data-schema.md) | [03 經濟](03-economy.md)、[10 平衡調參](10-balance-tuning.md)（**任何數值改動都要重跑模擬更新基準表**）、[12 名詞表](12-glossary.md) |
| `js/state.js` | [02 狀態與存檔](02-state-and-save.md) | [03 經濟](03-economy.md)（抽獎相關）、[10 平衡調參](10-balance-tuning.md)、[11 地雷](11-invariants-and-gotchas.md) |
| `js/ui.js` | [08 介面](08-ui-and-screens.md) | [11 地雷](11-invariants-and-gotchas.md)（捲動／版面時序問題） |
| `js/cutin.js` | [04 釣魚循環](04-fishing-loop.md) | [08 介面](08-ui-and-screens.md)（`.cutin` 樣式與 CSS 時間軸）、[09 操作手冊](09-recipes.md)（新增釣點的第七樣）、[11 地雷](11-invariants-and-gotchas.md) |
| `js/screen-fishing.js` | [04 釣魚循環](04-fishing-loop.md)、[05 自動模式](05-auto-mode.md) | [08 介面](08-ui-and-screens.md)、[03 經濟](03-economy.md) |
| `js/screen-daily.js` | [08 介面](08-ui-and-screens.md) | [02 存檔](02-state-and-save.md)（簽到／任務結構） |
| `js/screen-home.js` | [08 介面](08-ui-and-screens.md) | [06 像素引擎](06-pixel-engine.md)（房間繪製、裝飾圖示） |
| `js/screen-shop.js` | [08 介面](08-ui-and-screens.md) | [07 資料規格](07-data-schema.md)（裝備圖示） |
| `js/screen-codex.js` | [08 介面](08-ui-and-screens.md) | |
| `js/main.js` | [01 架構](01-architecture.md) | [08 介面](08-ui-and-screens.md)（儲值／設定彈窗） |
| `js/devtools.js` | [14 開發者面板](14-devtools.md) | [08 介面](08-ui-and-screens.md)（`.devpanel` / `#devFlag` 樣式）、[11 地雷](11-invariants-and-gotchas.md) |
| `js/pwa.js` | [13 PWA 與部署](13-pwa-and-deploy.md) | [08 介面](08-ui-and-screens.md)（安裝提示條樣式） |
| `sw.js` | [13 PWA 與部署](13-pwa-and-deploy.md) | [11 地雷](11-invariants-and-gotchas.md) |
| `manifest.webmanifest` | [13 PWA 與部署](13-pwa-and-deploy.md) | |
| `tools/make-icons.py` · `icons/` | [13 PWA 與部署](13-pwa-and-deploy.md) | |
| **新增任何 js 檔** | [01 架構](01-architecture.md)、[README](README.md)、**本頁補一列**，並更新 `sw.js › ASSETS` | |

## 一定要做的三件事

不管改了什麼，只要行為有變：

1. **更新對照表指到的頁面** — 內容改了就改內文，加功能就加小節，砍功能就刪段落。
2. **寫 [CHANGELOG](CHANGELOG.md)** — 最上方新增一筆。
3. **踩到新坑就補 [11 地雷](11-invariants-and-gotchas.md)** — 這頁的投報率最高。

## 特殊觸發條件

| 情況 | 額外要做的事 |
|---|---|
| **新增／刪除／改名任何前端資產** | 更新 `sw.js › ASSETS` 清單 ＋ **把 `VERSION` 加一** |
| 動到任何影響機率／價格／成本的數值 | 跑 [10 §模擬腳本](10-balance-tuning.md#模擬腳本)，**更新基準表** |
| 新增 shape / pattern / special / junkArt | [06](06-pixel-engine.md) 加說明 ＋ [07](07-data-schema.md) 加可用值 ＋ [12](12-glossary.md) 加清單 |
| 新增「會往魚身體外延伸」的 special | 上面那一列全做，**再加 `buildFish()` 的 `HEAD_ROOM` 一列**（見 [11 §19](11-invariants-and-gotchas.md)） |
| **新增釣點** | ★ **必須一次生出一整套**：釣點＋魚種＋釣竿＋餌料＋裝備＋家園裝飾＋**魚王 cut-in**，規則與理由見 [09 §新增一個釣點](09-recipes.md#新增一個釣點--一次要生出一整套)。文件要更新 [07](07-data-schema.md) 釣點表＋配色規則表＋四張裝備表、[10](10-balance-tuning.md) 基準表＋模擬腳本、[12](12-glossary.md) id 前綴、[04](04-fishing-loop.md) 魚王 cut-in 分配表、[README](README.md) 三十秒版本，並**在 320px 寬檢查 [08](08-ui-and-screens.md#會隨釣點數量成長的介面) 列的兩處** |
| **新增魚王** | `cutin.js › KING` 補一筆（`motif` / `particle` / `title` / `tone`）＋ [04](04-fishing-loop.md) 的分配表加一列。**漏了不報錯**，只是那位魚王的登場演出跟別人一樣 |
| 改 cut-in 的長度或動畫 | `cutin.js › DUR_*` 與 `styles.css` 的 keyframes **必須一起改**（[11 §26](11-invariants-and-gotchas.md)）＋ [04 §時間軸](04-fishing-loop.md#時間軸) 的表 ＋ [08](08-ui-and-screens.md) |
| 新增釣竿／餌料 | [07](07-data-schema.md) 的表；**維持 price 遞增**；`screen-shop.js › rodIcon()` 的色表要同步加長（[11 §24](11-invariants-and-gotchas.md)） |
| 新增**裝備** | [07](07-data-schema.md) 的表 ＋ `screen-shop.js › EQUIP_ART` 圖示。**釣點專屬的一律綁 `effect.loc` 且只給一個效果**，否則倍率會疊乘失控（[10](10-balance-tuning.md)） |
| 新增**家園裝飾** | [07](07-data-schema.md) 的表 ＋ `screen-home.js › DECO_ART` 圖示 ＋ `pixel.js › drawRoom()` 繪製碼。**釣點主題的一律純裝飾**（`effect: {}`） |
| 新增選項數量會成長的橫向列 | 用 `.seg.seg-scroll`（**不要用 `.seg`**）＋ [08](08-ui-and-screens.md) 設計語彙表加一列。步驟見 [09](09-recipes.md) |
| **新增 `TERRAIN` 地形** | [06 §地形系統](06-pixel-engine.md) 加一列 ＋ [07](07-data-schema.md) 的 scene 表與釣點表 ＋ [12](12-glossary.md) 加清單，**並補 `locThumb()` 的 switch case** |
| 新增裝備／裝飾／餌料／釣竿 | [07](07-data-schema.md) 更新表格；裝備要記得加圖示（[09](09-recipes.md) 有步驟） |
| 新增自動模式設定項 | [05](05-auto-mode.md) 狀態物件與停止條件表 ＋ [02](02-state-and-save.md) schema |
| 改動自動模式的收藏門檻 | [05 §收藏門檻](05-auto-mode.md) 的對照表 ＋ [12](12-glossary.md) 的 `sellMode` |
| 改存檔結構 | [02](02-state-and-save.md)；巢狀欄位要考慮 `SAVE_VER`（見 [11 §4](11-invariants-and-gotchas.md#4-存檔淺層合併)） |
| 新增分頁 | [01](01-architecture.md)、[08](08-ui-and-screens.md)、[README](README.md)、本頁 |
| 發現既有描述跟程式碼不符 | **當場修正 wiki**，並在 CHANGELOG 記一筆「文件修正」 |

## 反向索引：wiki 頁 → 它描述的原始碼

| wiki 頁 | 涵蓋範圍 |
|---|---|
| [00 上手](00-onboarding.md) | 全域概念，無特定檔案 |
| [01 架構](01-architecture.md) | `index.html`、`util.js`、`main.js`、跨檔案契約 |
| [02 狀態與存檔](02-state-and-save.md) | `state.js`（存檔／事件／API） |
| [03 經濟與抽獎](03-economy.md) | `state.js`（`castCost` `bonus` `rarityTable` `rollCatch` `recordCatch`）、`data.js › FG.RARITY` |
| [04 釣魚循環](04-fishing-loop.md) | `screen-fishing.js`（狀態機／演出／結果卡）、`cutin.js` 全部 |
| [05 自動模式](05-auto-mode.md) | `screen-fishing.js`（`auto*` 系列） |
| [06 像素引擎](06-pixel-engine.md) | `pixel.js` 全部 ＋ 各分頁檔的字元圖常數 |
| [07 資料規格](07-data-schema.md) | `data.js` 全部 |
| [08 介面與畫面](08-ui-and-screens.md) | `styles.css`、`ui.js`、四個非釣魚分頁 |
| [09 操作手冊](09-recipes.md) | 跨檔案的操作流程 |
| [10 平衡調參](10-balance-tuning.md) | 數值旋鈕與驗證方法 |
| [11 不變式與地雷](11-invariants-and-gotchas.md) | 跨檔案的約束與已知問題 |
| [12 名詞表](12-glossary.md) | key 值速查 |
| [13 PWA 與部署](13-pwa-and-deploy.md) | `manifest.webmanifest`、`sw.js`、`js/pwa.js`、`tools/make-icons.py`、GitHub Pages |
| [14 開發者面板](14-devtools.md) | `devtools.js` 全部 |
