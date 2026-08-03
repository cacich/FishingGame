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

## 2026-08-03 · 四個釣點改成免費自由切換

**改了什麼**：

- `data.js` 的 `sunset_fjord` / `frost_lake` / `abyss` 三筆 `unlock` 從 `{ chips: N }` 改成 `{ free: true }`（`mist_lake` 本來就是）。**四個釣點現在都不用花籌碼解鎖。**
- `state.js › isUnlocked()`：`loc.unlock.free` 為真就直接回 `true`，否則才查 `data.unlocked[]`。
- UI 文案：`main.js › locationPicker()` 的說明改成「四個釣點都可以自由切換，不需要解鎖」；`screen-daily.js` 的釣點區塊副標「點擊前往或解鎖」→「點擊自由切換」。

**為什麼**：

**進程門檻交給 `castCost` 就夠了。** 拋竿費從 400 一路到 12,000（30 倍），開局 20,000 籌碼在深淵只夠拋一竿——玩家會自然待在負擔得起的釣點。上面再疊一層一次性解鎖費只是多一段「存錢等待」的空轉，不會讓決策變有趣，反而把遊戲最主要的賣點（四種完全不同的場景與魚種）鎖在後面。

改成免費之後，「今天想拚魚王就去深淵、想穩穩賺就回晨霧湖」變成**每一竿都能重做的選擇**，而不是一次性的解鎖決定。

**動到的檔案**：`js/data.js › FG.LOCATIONS`、`js/state.js › isUnlocked()`、`js/main.js › locationPicker()`、`js/screen-daily.js`

**已更新的 wiki**：[07 資料規格](07-data-schema.md)（釣點總表的 unlock 欄、新增「為什麼四個釣點都是免費的」）、[02 存檔](02-state-and-save.md)（`isUnlocked()` 的兩條路）、[03 經濟](03-economy.md)（籌碼流向圖拿掉「釣點解鎖」）、[10 平衡調參](10-balance-tuning.md)（旋鈕總覽、加新釣點的抓法）、[09 操作手冊](09-recipes.md)、[08 介面](08-ui-and-screens.md)、[11 地雷](11-invariants-and-gotchas.md)（§15 改寫成完整的「跑不到的路徑」清單）、[README](README.md)、[根 README](../README.md)

**注意事項**：

- **`isUnlocked()` 刻意把 `free` 判斷放在查 `data.unlocked[]` 之前**，所以舊存檔不用遷移、也不用升 `SAVE_VER`（舊存檔的 `unlocked` 仍然只有 `['mist_lake']`，但四個釣點都進得去）。把某個釣點改回 `{ chips: N }` 也會立刻恢復收費，而且已經付過錢的玩家不會被要求重付。
- 解鎖機制**整套都還在**（`unlockLoc()`、`data.unlocked[]`、兩處 UI 的金色解鎖按鈕與確認框），只是現在跑不到。**別當死碼刪掉**，清單見 [11 §15](11-invariants-and-gotchas.md#15-comingsoon-與釣點解鎖目前都沒有釣點在用)。
- 籌碼的消耗池少了一項（原本三個釣點合計 2,000,000 的一次性支出）。**沒有為此重新調整數值**：解鎖費是一次性的，不影響 [10](10-balance-tuning.md) 基準表衡量的「每竿產出/成本」，長期經濟仍然由拋竿費主導。

---

## 2026-08-03 · 開放後兩個釣點，四個釣點的圖鑑全部補到 20 種以上

**改了什麼**：

- **幽藍冰湖 / 深淵海溝正式開放**：拿掉 `comingSoon`，各補滿 23 種魚（`FROST_FISH` / `ABYSS_FISH`）。解鎖價從 800,000 / 5,000,000 調降為 380,000 / 1,500,000（**已被上一筆取代：現在四個釣點都免解鎖**）。
- **晨霧湖 14 → 24 種、落霞峽灣 9 → 24 種**：補齊各階級，讓四個釣點的配額一致（junk 3 / common 6 / good 5 / rare 4 / epic 2～3 / legend 2 / king 1）。扣掉雜物後的圖鑑分母為 21 / 21 / 20 / 20，全部達到 20 以上。
- 全專案魚種與雜物從 23 種增加到 **94 種**，新增兩位魚王（冰湖「寇爾德」、深淵「尼克斯」）與四條傳說魚。
- **新增兩張雜物字元圖**：`pixel.js › JUNK_MAPS` 加入 `ice`（浮冰碎塊）與 `bone`（不明骨骸），各給冰湖與深淵當專屬雜物。
- **數值**：冰湖與深淵的全部 `value` 整批乘 0.74 / 0.63（見下）。既有兩個釣點的 `value` 一律沒動。

**為什麼**：

兩個「即將開放」的釣點只有 `fish: []` 的骨架，實際上進不去；同時前兩個釣點的魚種數（14 / 9）讓圖鑑頁看起來很空，收集進度條一下就滿了。這次一併補到每個釣點 20 種以上，讓四張圖鑑頁的份量一致。

魚種配額之所以統一，是因為**階級內是等機率抽的**：往同一階級加魚不改變該階的出現機率，只會稀釋單一魚種。高階級放太多會讓玩家覺得傳說永遠湊不齊，低階級放太少又會重複到膩，所以各階級的種類數要跟它的權重成正比。

冰湖／深淵的 `value` 要往下砍，是因為初次填魚時直接套用了「common ≈ castCost × 0.25、rare ≈ ×2 …」的舊抓法，跑出滿裝倍率 ×3.25 / ×3.97。原因是那組係數是從晨霧湖／峽灣回推的，而那兩個釣點的成本有很大一塊是**固定 900 的魚王秘餌**；castCost 拉到 3,000 / 12,000 之後餌料佔比從七成掉到不到一成，倍率整條往上平移。調整後落回 ×2.40 / ×2.49，形成 1.89 → 2.29 → 2.40 → 2.49 的進程曲線。

**動到的檔案**：`js/data.js`（`MIST_LAKE_FISH` `FJORD_FISH`，新增 `FROST_FISH` `ABYSS_FISH`，`FG.LOCATIONS` 的 `frost_lake` / `abyss` 兩筆）、`js/pixel.js › JUNK_MAPS`

**已更新的 wiki**：[07 資料規格](07-data-schema.md)（新增釣點總表、魚種配額表、各釣點配色規則、junkArt 可用值）、[06 像素引擎](06-pixel-engine.md)（新增雜物字元圖清單）、[10 平衡調參](10-balance-tuning.md)（基準表重跑成 10 組、新增離線模擬做法、改寫「加新釣點的抓法」為隨 castCost 遞減的係數表、新增一則調參教訓）、[03 經濟](03-economy.md)（平衡數據表）、[11 地雷](11-invariants-and-gotchas.md)（+§14 §15，改寫「fish[] 不可為空」的不變式）、[09 操作手冊](09-recipes.md)（加魚／加釣點兩則）、[12 名詞表](12-glossary.md)（junkArt、id 前綴）、[02 存檔](02-state-and-save.md)（`unlockLoc` 的 `'soon'` 現況）、[README](README.md)、[根 README](../README.md)

**注意事項**：

- `sw.js` 的 `VERSION` **沒有加一**——只改了既有 js 的內容，沒有新增／刪除／改名資產，也沒換圖片。程式碼類走 network-first，推上去重載一次就是新版。
- `comingSoon` 現在沒有任何釣點在用，相關的 `'soon'` 回傳值與兩處 UI 分支變成跑不到的路徑。**別當死碼刪掉**，加預告釣點時要用。
- 這次驗證用的是 Node 離線腳本（30 萬竿／組），公式是照 `state.js` 複刻的第二份。**改了 `state.js` 的抽獎公式，記得離線腳本也要跟著改**，否則基準表會騙人。

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
