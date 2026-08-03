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
導覽請求（開啟頁面）  → network-first，離線才回快取
其他同源 GET         → stale-while-revalidate
非 GET / 跨來源       → 不插手
```

**為什麼分開處理**：導覽走 network-first，新版本部署後一開頁就會拿到新的 `index.html`；其他資產走 SWR，開得快又能在背景自我更新，下一次載入就是新版。兩者都能離線。

生命週期：
- `install` → 逐一 `cache.add()`（**不用 `addAll`**，單一檔案失敗不會讓整包掛掉）→ `skipWaiting()`
- `activate` → 刪掉所有 `fishing-` 開頭但版本不符的快取 → `clients.claim()`
- `message: 'skipWaiting'` → 讓頁面能主動要求立刻套用新版

### ★ 發佈新版本要把 `VERSION` 加一

`sw.js` 開頭：

```js
const VERSION = 'v1';
```

改動遊戲檔案後**必須**把它加一。理由：瀏覽器是用「`sw.js` 的位元組有沒有變」來判斷有沒有新版本的。只改 `js/*.js` 而不動 `sw.js`，瀏覽器不會重新安裝 SW，舊快取會一直留著。

（SWR 策略下多數資產其實會自我更新，但預先快取清單與快取清理只在 install/activate 跑，所以還是要靠 VERSION 才乾淨。）

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

### 根目錄的 `.nojekyll` 不能刪

GitHub Pages 預設會用 Jekyll 處理整個 repo，而 Jekyll **會排除所有底線開頭的檔案與資料夾**——`wiki/_map.md` 就會發不出去，wiki 首頁指過去的連結全部 404。

根目錄放一個空的 `.nojekyll` 就會完全跳過 Jekyll、原樣供應所有檔案，順便讓建置變快。這個檔案沒有內容，很容易在整理時被誤刪。

**PWA 安裝需要 HTTPS**（`localhost` 例外）。GitHub Pages 自帶 HTTPS，所以手機開那個網址就能直接安裝。

### 手機測試

- Android Chrome：開網址 → 底部會冒出安裝提示條，或選單「安裝應用程式」
- iOS Safari：開網址 → 分享 → 加入主畫面
- 裝完後**開飛航模式**再開 App，應該完全正常（存檔在 localStorage，也是本地的）
