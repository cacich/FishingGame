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
| **快速測試某個稀有度／看某段演出** | [14 · 開發者面板](14-devtools.md) |
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
測試工具        14-devtools      →  03-economy       →  04-fishing-loop
```

## 三十秒版本

玩家付**籌碼**＋消耗一份**餌料**拋竿 → 系統立刻抽好結果（[03](03-economy.md)）→ 播 4 段演出（[04](04-fishing-loop.md)）→ 玩家選擇**賣掉換籌碼**或**收藏進家園魚缸**。籌碼再拿去買釣竿／餌料／裝備／家園擴建，這些又回頭拉高稀有魚與魚王的機率，形成循環。

**釣到傳說以上會多插一段 cut-in 登場演出**（[04 §cut-in](04-fishing-loop.md#cut-in--傳說以上的登場演出)）。傳說一套通用，**十六位魚王各有自己的骨架、配色、粒子與登場音階**——但不是各刻一套動畫，而是「四種骨架 × 每王一筆參數」，所以加新魚王只要補六行資料。

**十六個釣點全部開放且免費切換**：晨霧湖 → 澄澈方池 → 亂石急湍 → 落霞峽灣 → 琉璃珊瑚 → 宵櫻神域 → 潮落礁灘 → 幽藍冰湖 → 懸瀑深潭 → 煙雨蓮江 → 硫煙湯湖 → 深淵海溝 → 世界樹根 → 黃沙冥河 → 鐘乳暗穴 → 曉日沉港，各 23～24 種魚（圖鑑分母 20～21）、各一位魚王（**一王一種專屬體型**，第十六位是**全遊戲唯一一隻不是魚的魚王**——一隻章魚）、**各一種地形**（森林／人工池塘／溪流湍瀨／崖壁／珊瑚礁／神域／潮間帶／冰原／瀑布潭／峰林水鄉／火山口湖／夜海／世界樹／沙漠／鐘乳洞／棄港沉船）。進程門檻由拋竿費（400 → 192,000）承擔，不收解鎖費。

**每個釣點都配一整套專屬周邊**：主題釣竿、主題餌料、**釣點專屬裝備**、主題家園裝飾。加新釣點時這六樣要一起加——規則與（很重要的）「為什麼竿／餌可以通用但裝備必須綁釣點」見 [09 §新增一個釣點](09-recipes.md#新增一個釣點--一次要生出一整套)。

魚、圖示、房間與地形仍由 canvas 在低解析度上程序化生成；釣點另支援**選用的點陣底圖**，目前晨霧湖已換成 PNG，載入失敗會自動退回原本地形（[06](06-pixel-engine.md)）。
狀態全部集中在 `FG.state.data`，存 localStorage（[02](02-state-and-save.md)）。
全域只有一個命名空間 `window.FG`（[01](01-architecture.md)）。

## 檔案總覽

| 檔案 | 行數量級 | 職責 | 主要 wiki 頁 |
|---|---|---|---|
| `index.html` | 40 | 骨架＋script 載入順序 | [01](01-architecture.md) |
| `styles.css` | 770 | 全部樣式 | [08](08-ui-and-screens.md) |
| `js/util.js` | 140 | 亂數／色彩／格式化／DOM／存取／音效 | [01](01-architecture.md) |
| `js/pixel.js` | 4600 | 像素美術引擎（含地形系統，16 種地形） | [06](06-pixel-engine.md) |
| `assets/scenes/` | — | 選用的釣點主背景與橫式縮圖；目前晨霧湖一組 | [06](06-pixel-engine.md)、[13](13-pwa-and-deploy.md) |
| `js/data.js` | 2200 | 所有資料表（16 個釣點） | [07](07-data-schema.md) |
| `js/state.js` | 370 | 存檔／經濟／抽獎 | [02](02-state-and-save.md)、[03](03-economy.md) |
| `js/ui.js` | 120 | Toast／彈窗／捲動邊緣提示 | [08](08-ui-and-screens.md) |
| `js/cutin.js` | 150 | 傳說／魚王的登場演出（四種骨架＋每王一筆參數） | [04](04-fishing-loop.md) |
| `js/screen-fishing.js` | 675 | 釣魚分頁＋自動模式 | [04](04-fishing-loop.md)、[05](05-auto-mode.md) |
| `js/screen-daily.js` | 120 | 每日分頁 | [08](08-ui-and-screens.md) |
| `js/screen-home.js` | 226 | 家園分頁 | [08](08-ui-and-screens.md) |
| `js/screen-shop.js` | 260 | 商店分頁 | [08](08-ui-and-screens.md) |
| `js/screen-codex.js` | 118 | 圖鑑分頁 | [08](08-ui-and-screens.md) |
| `js/devtools.js` | 325 | 隱藏的開發者面板（連點家園鈕 10 下） | [14](14-devtools.md) |
| `js/pwa.js` | 130 | Service Worker 註冊、安裝流程 | [13](13-pwa-and-deploy.md) |
| `js/main.js` | 275 | 啟動／分頁／頂部列／儲值／主迴圈 | [01](01-architecture.md) |
| `sw.js` | 120 | Service Worker（離線快取） | [13](13-pwa-and-deploy.md) |
| `manifest.webmanifest` | 40 | PWA 資訊清單 | [13](13-pwa-and-deploy.md) |
| `tools/make-icons.py` | 250 | 圖示產生器（純 Python 標準庫） | [13](13-pwa-and-deploy.md) |

完整的「原始碼 ↔ wiki 頁面」對照表在 [`_map.md`](_map.md)。
