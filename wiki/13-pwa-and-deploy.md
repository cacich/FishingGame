# 13 · PWA 與部署

> 涵蓋：`manifest.webmanifest`、`sw.js`、`js/pwa.js`、`tools/make-icons.py`、`icons/`
> 相關：[01 架構](01-architecture.md)、[11 地雷](11-invariants-and-gotchas.md)

遊戲是可安裝的 PWA：手機加到主畫面後全螢幕直式執行，且**完全離線可玩**（本來就沒有任何外部資源，所有資產都被 Service Worker 預先快取）。

## 組成

| 檔案 | 職責 |
|---|---|
| `manifest.webmanifest` | App 名稱、圖示、顯示模式、主題色 |
| `sw.js` | Service Worker：預先快取 + 離線供應 |
| `js/pwa.js` | 註冊 SW、處理安裝流程、更新提示 |
| `icons/*.png` | 五種尺寸／用途的圖示 |
| `tools/make-icons.py` | 圖示產生器（純 Python 標準函式庫） |
| `index.html` | manifest 連結與 iOS 專用 meta |

## manifest 重點

```jsonc
"start_url": "./",      // 相對路徑，才能部署在子路徑（GitHub Pages 的 /FishingGame/）
"scope": "./",
"display": "standalone",
"orientation": "portrait",
"background_color": "#070c12",   // 啟動畫面底色，跟 --bg 一致
"theme_color": "#0b1119"         // 系統列顏色，跟 index.html 的 meta 一致
```

**`start_url` / `scope` 一定要用相對路徑。** 寫成 `/` 的話部署到 GitHub Pages 的子路徑會直接壞掉（scope 對不上，SW 不會生效）。

圖示三筆：192 與 512 是 `purpose: "any"`，另一張 512 是 `purpose: "maskable"`。

## 圖示

由 `tools/make-icons.py` 產生，**不是手繪的**，改配色重跑即可：

```bash
python tools/make-icons.py
```

| 檔案 | 尺寸 | 用途 |
|---|---|---|
| `icon-192.png` | 192 | Android 一般用途 |
| `icon-512.png` | 512 | 高解析、啟動畫面 |
| `icon-maskable-512.png` | 512 | Android 自適應圖示。內容縮進中央安全區（`inset=0.22`），背景滿版 |
| `apple-touch-icon-180.png` | 180 | iOS 主畫面。**不可有透明**，iOS 自己會切圓角 |
| `favicon-32.png` | 32 | 瀏覽器分頁 |

腳本用 **PNG 手工編碼**（`zlib` + `struct` 組 IHDR/IDAT/IEND），不需要 Pillow。魚的輪廓沿用 `pixel.js › buildFish()` 的剖面公式，所以圖示跟遊戲內的魚是同一套美術語言。

> ⚠️ 腳本裡 `put()` 刻意用 `floor(n + 0.5)` 而不是 Python 的 `round()`。`round()` 是**銀行家捨入**（`round(7.5)=8`、`round(8.5)=8`），會讓相鄰兩欄捨到同一個整數而漏掉整欄，描邊再把漏掉的欄位填黑——結果尾鰭出現條紋狀破圖。這個坑實際踩過。

## Service Worker 策略

```
程式碼類（html / js / css / webmanifest、以及導覽請求）
    → network-first，且用 cache:'no-cache' 強制向伺服器驗證
    → 逾時 2.5 秒或離線時回快取
圖片類（png…）
    → cache-first
非 GET / 跨來源
    → 不插手
```

### 為什麼程式碼類一定要 `cache:'no-cache'`

GitHub Pages 回應標頭是 **`Cache-Control: max-age=600`**。也就是瀏覽器自己的 HTTP 快取會把檔案留住 10 分鐘。

如果 SW 裡用一般的 `fetch(req)`，這個請求**仍然會先問瀏覽器的 HTTP 快取**——結果就是「SW 以為自己抓了新版，其實拿到的是 10 分鐘前的舊檔」，再把舊檔寫回 SW 快取。舊版曾用 stale-while-revalidate，疊上這層之後最糟要等 10 分鐘＋重載兩次才會更新。

`cache: 'no-cache'` 的語意是**跳過 HTTP 快取直接問伺服器，但仍走 ETag 協商**。檔案沒變就回 304（幾乎不耗流量），變了就給新的。這是「一定拿到最新」與「不浪費頻寬」的平衡點。

（不要用 `no-store`，那會連 ETag 協商都跳過，每次都下載完整內容。）

圖片維持 cache-first 是因為圖示、釣點點陣背景、魚類精靈與角色序列圖幾乎不變，又是位元組大宗。真的換圖時把 `VERSION` 加一，`install` 階段會強制重抓。為避免舊 SW 尚未接管完成時仍回傳同網址舊圖，`pixel.js › loadImage()` 另會在 `assets/` 圖片網址附加 `IMAGE_REVISION`；舊 SW 因 query 不同而直接抓網路新版，新 SW 則用 `caches.match(req, { ignoreSearch: true })` 命中無 query 的預快取檔。替換圖片時這兩個版本必須一起加一。`assets/scenes/` 的背景／縮圖、`assets/sprites/` 的魚類精靈與 `assets/characters/` 的角色動畫都屬於這一類，而且必須逐張列進 `ASSETS`，才能保證安裝後離線可用。

### 生命週期

- `install` → 逐一 `cache.add(..., {cache:'reload'})`（**不用 `addAll`**，單一檔案失敗不會讓整包掛掉）→ `skipWaiting()`
- `activate` → 刪掉所有 `fishing-` 開頭但版本不符的快取 → `clients.claim()`
- `message: 'skipWaiting'` → 讓頁面能主動要求立刻套用新版

### 頁面端的配合（`js/pwa.js`）

- **`controllerchange` 自動重載一次**。`sw.js` 換版時新 SW 會 `skipWaiting` + `claim` 接管，但**頁面上跑的還是舊 JS**，不重載看不到變化。用進頁時的 `navigator.serviceWorker.controller` 是否存在來區分「首裝」與「更新」——首裝時的 `controllerchange` 不該觸發重載，否則第一次開遊戲會白閃一次。
- **主動 `reg.update()`**：註冊後呼叫一次，並在 `visibilitychange` 回到前景時再呼叫。瀏覽器預設檢查更新的間隔最長可到 24 小時，已安裝的 App 尤其容易卡在舊版。

### `VERSION` 什麼時候要加一

`sw.js` 開頭目前是 `const VERSION = 'v24';`。`v11` 在十六個釣點背景與縮圖之外，加入當時 370 張 AI 產圖精靈的預快取；`v12`～`v17` 依序處理索引、朝向、canvas 重繪與船上角色序列；`v18` 新增朱楓天守、雪見狐湯的 4 張場景圖與 47 張精靈；`v19` 加入劍影寒潭、敦煌月泉的 4 張場景圖；`v20` 再補齊這兩站的 46 張 96×56 RGBA 精靈；`v21` 以連通元件分格重切兩張和風地圖的 47 張精靈；`v22` 去除中國風精靈的洋紅鍵色混邊與高亮紫／桃紅 glow；`v23` 再從完整母版依連通元件重切中國風兩站全 46 張，修復固定格線截斷，並把青、藍、粉、紫等任何色相的外光統一為暗描邊；`v24` 為所有 `assets/` 圖片請求加入同步資產版本，並讓新版 SW 忽略 query 命中預快取，解決線上檔案已更新但舊 SW 仍顯示截斷魚圖的過渡期。現在二十站的 463 個可釣項目都有正式外部 PNG，且全部逐張列在 `ASSETS`；程序化精靈仍保留為載入失敗備援。這類圖片與腳本都是 cache-first，改動後一定要再升版。

| 情況 | 要不要加一 |
|---|---|
| 只改 js / css / html 內容 | **不用**。network-first 會直接拿到新版 |
| 新增／刪除／改名前端資產 | **要**（同時更新 `ASSETS` 清單），否則離線時缺檔 |
| 換圖示或其他圖片 | **要**，圖片是 cache-first 不會自動更新 |
| 改 `sw.js` 本身的邏輯 | **要**（其實只要內容變了瀏覽器就會偵測到，但加一才會清掉舊快取） |

## 安裝流程 · `js/pwa.js`

| API | 說明 |
|---|---|
| `FG.pwa.isStandalone()` | 是否以 App 形式開啟（`display-mode: standalone` 或 iOS 的 `navigator.standalone`） |
| `FG.pwa.isIOS()` | iOS 判斷 |
| `FG.pwa.canInstall()` | 是否接到過 `beforeinstallprompt` |
| `FG.pwa.promptInstall(cb)` | 觸發原生安裝對話框，`cb('accepted'\|'dismissed'\|'unsupported')` |
| `FG.pwa.iosHint` | iOS 的文字指引 |

兩個入口：
1. **底部安裝提示條**（`.install-chip`）— 接到 `beforeinstallprompt` 後延遲 4 秒才冒出來（避開開場說明），可用 ✕ 永久關掉（記在 localStorage 的 `fg_install_dismissed`）。
2. **設定面板**（家園底部 → 設定）— 永遠有「安裝」區塊，依環境顯示按鈕／iOS 指引／瀏覽器選單提示。

**iOS Safari 不支援 `beforeinstallprompt`**，只能給文字指引（分享 → 加入主畫面）。這是 Safari 的限制，不是 bug。

更新提示：`registration.updatefound` 且 `navigator.serviceWorker.controller` 存在（代表是更新而非首裝）時，跳 toast「有新版本，重新整理即可更新」。

## `file://` 相容

`js/pwa.js` 的註冊有守衛：

```js
if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0)
```

`file://` 下沒有 Service Worker，直接雙擊 `index.html` 仍然能玩（只是不能安裝、沒有離線快取）。**這個守衛不能拿掉**，否則會拋錯。

## 部署到 GitHub Pages

repo：`git@github-personal:cacich/FishingGame.git`（→ [11 §多帳號 SSH](11-invariants-and-gotchas.md#12-多帳號-ssh別用-githubcom-推個人-repo)）

1. GitHub repo → Settings → Pages
2. Source 選 **Deploy from a branch**，branch 選 `main`、資料夾 `/ (root)`
3. 等一兩分鐘，網址是 `https://cacich.github.io/FishingGame/`

因為 `start_url` / `scope` / SW 註冊路徑全部用相對路徑，子路徑部署不需要任何調整。

### 日常發佈流程

```bash
git add -A && git commit -m "..." && git push
```

推上去後 GitHub 會跑 `pages build and deployment`（約 1 分鐘），完成後**重新載入一次**就是新版。多數情況不需要動 `VERSION`（見下方對照表）。

想確認建置狀態：

```bash
curl -s "https://api.github.com/repos/cacich/FishingGame/actions/runs?per_page=1" | grep -E '"(status|conclusion)"'
```

### 根目錄的 `.nojekyll` 不能刪

GitHub Pages 預設會用 Jekyll 處理整個 repo，而 Jekyll **會排除所有底線開頭的檔案與資料夾**——`wiki/_map.md` 就會發不出去，wiki 首頁指過去的連結全部 404。

根目錄放一個空的 `.nojekyll` 就會完全跳過 Jekyll、原樣供應所有檔案，順便讓建置變快。這個檔案沒有內容，很容易在整理時被誤刪。

**PWA 安裝需要 HTTPS**（`localhost` 例外）。GitHub Pages 自帶 HTTPS，所以手機開那個網址就能直接安裝。

### 手機測試

- Android Chrome：開網址 → 底部會冒出安裝提示條，或選單「安裝應用程式」
- iOS Safari：開網址 → 分享 → 加入主畫面
- 裝完後**開飛航模式**再開 App，應該完全正常（存檔在 localStorage，也是本地的）
