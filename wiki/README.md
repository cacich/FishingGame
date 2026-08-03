# 霧湖釣手 · 知識庫

這是本專案的 repo-local wiki：把散在 3,700 行 JS 裡的機制、公式、資料規格與設計取捨，整理成可以快速查閱的結構化文件。

**目標**：任何人（或 agent）要動這個專案，讀完相關頁面就能直接下手，不需要從頭讀原始碼推理。

> **維護規則**：所有程式碼修改都必須回寫到這裡。規則寫在專案根目錄的 [`CLAUDE.md`](../CLAUDE.md)，執行細節見 [`_map.md`](_map.md)。

---

## 依「我現在要做什麼」找

| 我想… | 去讀 |
|---|---|
| 第一次接觸這個專案 | [00 · 上手](00-onboarding.md) |
| 搞懂整體怎麼組起來的 | [01 · 架構](01-architecture.md) |
| 知道存檔裡有什麼、怎麼加欄位 | [02 · 狀態與存檔](02-state-and-save.md) |
| 理解抽獎機率、價值怎麼算 | [03 · 經濟與抽獎](03-economy.md) |
| 改釣魚演出流程 | [04 · 釣魚循環](04-fishing-loop.md) |
| 改自動模式 | [05 · 自動模式](05-auto-mode.md) |
| 改美術／加新的像素圖 | [06 · 像素引擎](06-pixel-engine.md) |
| 加新魚／新釣點／新道具 | [07 · 資料規格](07-data-schema.md) ＋ [09 · 操作手冊](09-recipes.md) |
| 改介面、加分頁 | [08 · 介面與畫面](08-ui-and-screens.md) |
| **照著步驟做某件事** | [09 · 操作手冊](09-recipes.md) |
| 調數值平衡 | [10 · 平衡調參](10-balance-tuning.md) |
| **遇到怪現象／改之前先避雷** | [11 · 不變式與地雷](11-invariants-and-gotchas.md) |
| 查名詞、對照 key | [12 · 名詞表](12-glossary.md) |
| 處理安裝／離線／部署 | [13 · PWA 與部署](13-pwa-and-deploy.md) |
| 看做過什麼變更 | [CHANGELOG](CHANGELOG.md) |

## 依「系統」找

```
遊戲循環        04-fishing-loop  →  03-economy  →  02-state-and-save
自動化          05-auto-mode     →  04-fishing-loop
內容（魚/釣點）  07-data-schema   →  06-pixel-engine  →  09-recipes
呈現            06-pixel-engine  ＋  08-ui-and-screens
數值            03-economy       →  10-balance-tuning
基礎建設        01-architecture  →  02-state-and-save  →  11-invariants
安裝／部署      13-pwa-and-deploy →  01-architecture
```

## 三十秒版本

玩家付**籌碼**＋消耗一份**餌料**拋竿 → 系統立刻抽好結果（[03](03-economy.md)）→ 播 4 段演出（[04](04-fishing-loop.md)）→ 玩家選擇**賣掉換籌碼**或**收藏進家園魚缸**。籌碼再拿去買釣竿／餌料／裝備／家園擴建，這些又回頭拉高稀有魚與魚王的機率，形成循環。

**六個釣點全部開放且免費切換**：晨霧湖 → 落霞峽灣 → 宵櫻神域 → 幽藍冰湖 → 煙雨蓮江 → 深淵海溝，各 23～24 種魚（圖鑑分母 20～21）、各一位魚王（**一王一種專屬體型**）、**各一種地形**（森林／崖壁／神域／冰原／峰林水鄉／夜海）。進程門檻由拋竿費（400 → 12,000）承擔，不收解鎖費。

美術**沒有任何圖檔**，全部由 canvas 在低解析度上程序化生成再放大（[06](06-pixel-engine.md)）。
狀態全部集中在 `FG.state.data`，存 localStorage（[02](02-state-and-save.md)）。
全域只有一個命名空間 `window.FG`（[01](01-architecture.md)）。

## 檔案總覽

| 檔案 | 行數量級 | 職責 | 主要 wiki 頁 |
|---|---|---|---|
| `index.html` | 40 | 骨架＋script 載入順序 | [01](01-architecture.md) |
| `styles.css` | 580 | 全部樣式 | [08](08-ui-and-screens.md) |
| `js/util.js` | 140 | 亂數／色彩／格式化／DOM／存取／音效 | [01](01-architecture.md) |
| `js/pixel.js` | 1560 | 像素美術引擎（含地形系統） | [06](06-pixel-engine.md) |
| `js/data.js` | 790 | 所有資料表 | [07](07-data-schema.md) |
| `js/state.js` | 370 | 存檔／經濟／抽獎 | [02](02-state-and-save.md)、[03](03-economy.md) |
| `js/ui.js` | 120 | Toast／彈窗／捲動邊緣提示 | [08](08-ui-and-screens.md) |
| `js/screen-fishing.js` | 640 | 釣魚分頁＋自動模式 | [04](04-fishing-loop.md)、[05](05-auto-mode.md) |
| `js/screen-daily.js` | 120 | 每日分頁 | [08](08-ui-and-screens.md) |
| `js/screen-home.js` | 226 | 家園分頁 | [08](08-ui-and-screens.md) |
| `js/screen-shop.js` | 216 | 商店分頁 | [08](08-ui-and-screens.md) |
| `js/screen-codex.js` | 118 | 圖鑑分頁 | [08](08-ui-and-screens.md) |
| `js/pwa.js` | 130 | Service Worker 註冊、安裝流程 | [13](13-pwa-and-deploy.md) |
| `js/main.js` | 275 | 啟動／分頁／頂部列／儲值／主迴圈 | [01](01-architecture.md) |
| `sw.js` | 120 | Service Worker（離線快取） | [13](13-pwa-and-deploy.md) |
| `manifest.webmanifest` | 40 | PWA 資訊清單 | [13](13-pwa-and-deploy.md) |
| `tools/make-icons.py` | 250 | 圖示產生器（純 Python 標準庫） | [13](13-pwa-and-deploy.md) |

完整的「原始碼 ↔ wiki 頁面」對照表在 [`_map.md`](_map.md)。
