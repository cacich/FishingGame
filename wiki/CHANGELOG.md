# 變更紀錄

> **每次程式碼修改都要在最上方新增一筆。** 規則見 [`CLAUDE.md`](../CLAUDE.md)。

格式：

```markdown
## YYYY-MM-DD · 一句話標題

**改了什麼**：具體的行為／數值／結構變動
**為什麼**：動機或要解決的問題
**動到的檔案**：`a.js › funcName()`、`b.css`
**已更新的 wiki**：[頁面](頁面.md)、[頁面](頁面.md)
**注意事項**：（選填）後續要留意的事、留下的技術債
```

---

## 2026-08-03 · 修正線上版更新不即時（SW 快取策略）

**改了什麼**：
- `sw.js` `VERSION` v1 → v2。
- 取用策略改為：程式碼類（html/js/css/webmanifest 與導覽請求）走 **network-first 且 `cache:'no-cache'`**，逾時 2.5 秒或離線回快取；圖片類維持 cache-first。
- `js/pwa.js`：`controllerchange` 時自動重載一次（用進頁時有無 controller 區分首裝與更新，避免第一次開遊戲白閃）；註冊後與每次回到前景時主動 `reg.update()`。

**為什麼**：GitHub Pages 送 `Cache-Control: max-age=600`。原本程式碼類用 stale-while-revalidate + 一般 `fetch()`，該請求仍會先問瀏覽器的 HTTP 快取，導致 SW「以為抓了新版、實際拿到 10 分鐘前的舊檔」再寫回自己的快取。實際效果是推上去之後最糟要等 10 分鐘＋重載兩次才看得到新版。改完之後推上去、Pages 建置完成、重載一次即為新版。

**動到的檔案**：`sw.js › fetch 處理`、`js/pwa.js`

**已更新的 wiki**：[13 PWA 與部署](13-pwa-and-deploy.md)（改寫策略段、新增日常發佈流程與 VERSION 對照表）、[11 地雷](11-invariants-and-gotchas.md)（§11 改寫成三層快取對照表）

**注意事項**：`VERSION` 現在只有在「新增／刪除／改名資產」「換圖片」「改 sw.js 邏輯」時才需要加一，改一般程式碼內容不用。用 `no-cache` 而非 `no-store`——前者仍走 ETag 協商，沒變就回 304。

---

## 2026-08-03 · 部署到 GitHub Pages

**改了什麼**：新增根目錄空檔 `.nojekyll`。
**為什麼**：GitHub Pages 預設用 Jekyll 處理 repo，Jekyll 會排除所有底線開頭的檔案，`wiki/_map.md` 會發不出去（wiki 首頁有連結指向它）。`.nojekyll` 讓 Pages 原樣供應所有檔案，順便加快建置。
**動到的檔案**：`.nojekyll`（新）
**已更新的 wiki**：[13 PWA 與部署](13-pwa-and-deploy.md)
**注意事項**：這個檔案是空的，整理專案時很容易誤刪，刪掉會讓 wiki 的部分連結 404。

---

## 2026-08-03 · PWA：可安裝、可離線

**改了什麼**：
- 新增 `manifest.webmanifest`（standalone、直式、主題色與遊戲同源）。
- 新增 `sw.js`：預先快取全部 21 個資產；導覽請求 network-first、其他資產 stale-while-revalidate；`activate` 時清掉舊版快取。
- 新增 `js/pwa.js`：註冊 SW（`file://` 下自動略過）、接管 `beforeinstallprompt`、更新提示 toast。
- 新增 `tools/make-icons.py` 與 `icons/` 五張圖示（192／512／maskable 512／apple-touch 180／favicon 32）。圖示是程序化產生的，沿用 `pixel.js › buildFish()` 的輪廓公式。
- 安裝入口兩處：底部提示條（可永久關閉）＋ 設定面板（含 iOS 專用指引）。
- `index.html` 補上 manifest 連結與 iOS meta；`styles.css` 加 `.install-chip`。

**為什麼**：讓手機能加到主畫面全螢幕遊玩。專案本來就零外部依賴，離線化幾乎是免費的。

**動到的檔案**：`manifest.webmanifest`（新）、`sw.js`（新）、`js/pwa.js`（新）、`tools/make-icons.py`（新）、`icons/*.png`（新）、`index.html`、`styles.css`、`js/main.js › openSettings()`

**已更新的 wiki**：[13 PWA 與部署](13-pwa-and-deploy.md)（新頁）、[01 架構](01-architecture.md)、[11 地雷](11-invariants-and-gotchas.md)（+3 條）、[README](README.md)、[_map](_map.md)

**注意事項**：**新增／刪除任何前端資產都要同步更新 `sw.js › ASSETS` 並把 `VERSION` 加一**，否則離線時會缺檔。開發期間建議在 DevTools 勾 Bypass for network。

---

## 2026-08-03 · 建立知識庫

**改了什麼**：新增 `wiki/` 知識庫（13 頁）與根目錄 `CLAUDE.md` 專案規約。程式碼零改動。
**為什麼**：專案已成長到 3,700 行 JS、機制與數值耦合度高，需要結構化文件讓後續調整能快速掌握狀況；同時建立「所有修改必須回寫 wiki」的維護規則。
**動到的檔案**：`CLAUDE.md`（新）、`wiki/*.md`（新）
**已更新的 wiki**：全部（初版）
**注意事項**：`README.md` 保留為對外的專案簡介，wiki 才是深入的技術知識庫，兩者定位不同不要混用。

---

## 2026-08-03 · 自動釣魚模式

**改了什麼**：
- 拋竿旁新增「自動」按鈕，可設定局數（10/50/100/500/無限）、漁獲處理（全賣／稀有以上收藏／全部收藏）、稀有度停止門檻、籌碼下限、播放速度（1/2/4 倍）、餌料自動補貨。
- 執行中顯示即時統計列（局數／支出／收入／淨損益）與場景左下角的滾動漁獲紀錄。
- 結束跳結算彈窗（含本次最佳漁獲）。
- 設定持久化到 `state.data.auto`。
- **魚缸滿且該魚符合收藏條件時，停止自動並跳出結果卡交還玩家決定**，不再擅自賣出。

**為什麼**：長時間手動拋竿的操作成本高；博弈類遊戲需要能快速累積樣本觀察數值。魚缸滿的處理是實測時發現系統把剛釣到的魚王直接賣掉，體驗極差。

**動到的檔案**：`screen-fishing.js`（`autoModal` `startAuto` `resolveAuto` `stopAuto` `autoSummary` `renderAutoLog` `renderAutoStats`，以及 `cast` `frame` `refresh` `skip` `canCast` 的自動模式分支）、`state.js › freshSave()`、`styles.css`

**已更新的 wiki**：[05 自動模式](05-auto-mode.md)、[04 釣魚循環](04-fishing-loop.md)、[02 存檔](02-state-and-save.md)

**注意事項**：`#autoStats` 的 CSS 預設是 `display:none`，顯示時必須明確設 `'flex'`（已記錄於 [11 §2](11-invariants-and-gotchas.md)）。

---

## 2026-08-03 · 經濟平衡修正

**改了什麼**：
- `rarityTable()` 的加權方式改為階級遞減：rare `×M`、epic `×M^0.85`、legend `×M^0.70`、**king 只吃 `K` 不吃 `M`**。
- `rod_mithril` rareMul 1.70→1.55、kingMul 1.6→1.5；`rod_dragon` rareMul 2.20→1.80、kingMul 2.5→2.0。
- `bait_lure` 價格 460→380、rareMul 1.85→1.70、kingMul 1.5→1.4；`bait_king` 價格 1800→900、rareMul 2.30→1.90、kingMul 4.0→3.0。

**為什麼**：模擬 3 萬次拋竿發現滿裝配置的魚王機率飆到 6.85%（多個倍率連乘造成），魚王失去稀有感且經濟會失控。修正後為 0.93%。

**動到的檔案**：`state.js › rarityTable()`、`data.js › FG.RODS / FG.BAITS`

**已更新的 wiki**：[03 經濟](03-economy.md)、[10 平衡調參](10-balance-tuning.md)

---

## 2026-08-03 · 初版

**改了什麼**：完整的遊戲 Demo。五個分頁（釣魚／每日／家園／商店／圖鑑）、程序化像素引擎、兩個可玩釣點（晨霧湖 14 種魚、落霞峽灣 9 種魚，各含一位魚王）＋兩個預留釣點、釣竿／餌料／裝備／家園擴建／裝飾的消費系統、每日簽到與任務、籌碼包（測試版直接發放）。

**為什麼**：建立可展示、可遊玩的像素風釣魚博弈原型。

**動到的檔案**：全部（新專案）

**已更新的 wiki**：不適用（wiki 於本日稍後建立）
