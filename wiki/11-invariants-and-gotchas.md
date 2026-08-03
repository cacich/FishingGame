# 11 · 不變式與地雷

> **這頁的價值最高。動手前掃一遍，遇到怪現象先來這裡查。**
> 每踩到一個新坑，都要回來補一筆。

---

## 已踩過的坑

### 1. `http.server` 的 JS 快取

**症狀**：改了 JS，重新整理畫面沒變，甚至只有部分檔案更新（例如 `pixel.js` 生效但 `screen-home.js` 還是舊的）。
**原因**：`python -m http.server` 會送 `Last-Modified`，瀏覽器用條件請求，某些檔案回 304 就繼續用舊的。
**對策**：**強制重新整理（Ctrl+F5）**。除錯時如果行為完全不合理，第一件事就是懷疑這個。確認方式：

```js
FG.screenHome.frame.toString().includes('你剛加的關鍵字')
```

### 2. `display:none` 的元素用 `''` 還原無效

**症狀**：`#autoStats` 明明設了 `style.display = ''` 卻不顯示。
**原因**：CSS 裡它的預設就是 `display: none`，設成空字串等於「回歸樣式表」，也就是回歸 `none`。
**對策**：明確寫 `element.style.display = 'flex'`。任何 CSS 預設隱藏的元素都有這個問題。

### 3. 精靈快取

**症狀**：改了魚的 `colors` 或 `shape`，畫面沒反應。
**原因**：`pixel.js › fishCache` 以 `f.id` 為 key 永久快取，同一個 session 只生成一次。
**對策**：重新整理頁面。或在 console 手動清（`fishCache` 是模組內部變數，沒有對外 API——需要頻繁調色的話可以臨時加一個 `px.clearCache()`）。

**同類問題**：場景背景的 `bgCache[loc.id]`，改 `loc.scene` 調色盤也要重新整理。

### 4. 存檔淺層合併

**症狀**：新加的欄位在舊存檔上讀出 `undefined`。
**原因**：`init()` 用 `Object.assign(freshSave(), raw)`，只補**頂層**缺少的 key。往既有巢狀物件（`stats` / `daily` / `auto`）裡加欄位不會被補。
**對策**：三選一 ——
- 加在頂層。
- 升 `SAVE_VER`（會清掉所有玩家存檔，Demo 階段可接受）。
- 在 `init()` 寫明確的補值邏輯。

### 5. Canvas 平面索引忘記檢查 x 邊界

**症狀**：魚王的鬍鬚跑到精靈的**另一側**去了。
**原因**：像素陣列是一維的 `i = y * W + x`。當 `x >= W` 時索引會溢出到「下一列的開頭」，而 `i < W*H` 的檢查完全擋不住。
**對策**：所有寫入都要分別檢查 `x` 和 `y`：

```js
if (x < 0 || x >= W || y < 0 || y >= H) continue;
```

`buildFish()` 裡的 `put()` 有做，但**後製階段（whisker / horn / scar / spike）是直接寫 `col[]`**，要自己檢查。這是加新 `special` 時最容易犯的錯。

### 6. 自動模式重複寫入圖鑑

**症狀**：一次釣獲被記錄兩次。
**原因**：`resolveAuto()` 和 `showResult()` 都會呼叫 `recordCatch()`。「魚缸滿轉交手動」那條路徑會同時經過兩者。
**對策**：`resolveAuto()` 在該分支必須 **early return，且 return 前不呼叫 `recordCatch()`**，也不能清 `this.pending`（要留給 `showResult()`）。改動那段時務必保持這個順序。

### 7. `state.rod()` vs `state.data.rod`

前者是**函式**回傳釣竿物件，後者是**字串** id。`bait` 也一樣。名稱相同但型別不同，寫錯不會報錯只會行為怪異。

### 8. 釣點卡有兩份實作

`main.js › locationPicker()` 和 `screen-daily.js` 的釣點區塊是幾乎相同的程式碼。**改一邊要記得改另一邊。** 這是已知的技術債；如果第三個地方也需要，就該抽成共用函式。

### 9. 餌料加成不在 `bonus()` 裡

`bonus()` 只彙總釣竿 + 裝備 + 裝飾。餌料的 `rareMul` / `junkMul` / `valueMul` / `kingMul` 在 `rarityTable()` 與 `rollCatch()` 裡另外乘。**要算實際總加成必須自己乘上 `state.bait()` 的值。**

### 10. 場景 canvas 是 `object-fit: cover`

`#stage` 內部固定 200×340，用 CSS 撐滿容器並裁切。**在不同螢幕比例下邊緣會被切掉**，所以重要元素（船、浮標、訊息）都要留在中央區域。同理 `#homeStage`（200×150，改用 `aspect-ratio` 避免裁切）。

### 11. Service Worker 讓「改了沒更新」變本加厲

**症狀**：改了 JS，Ctrl+F5 也沒用。
**原因**：除了 §1 的 http.server 快取，現在還多一層 Service Worker 快取。SW 的 stale-while-revalidate 會先回舊的、背景才更新，所以**第一次重載一定是舊版**。
**對策**：
- 開發時在 DevTools → Application → Service Workers 勾 **Bypass for network**（或 Update on reload）。
- 發佈前把 `sw.js` 的 `VERSION` 加一。
- 緊急清除：`caches.keys().then(k => k.forEach(n => caches.delete(n)))` 再重載。

詳見 [13 PWA 與部署](13-pwa-and-deploy.md#-發佈新版本要把-version-加一)。

### 12. 多帳號 SSH：別用 `github.com` 推個人 repo

**症狀**：`git push` 到個人 repo 出現權限錯誤，或 commit 掛到錯的帳號。
**原因**：這台機器同時有公司與個人 GitHub 帳號。`~/.ssh/config` 裡 `Host github.com` 綁的是**公司**金鑰，`Host github-personal` 才是個人金鑰。GitHub 是用 SSH key 判斷身分，不是看 email。
**對策**：個人 repo 的 remote 一律寫成 `git@github-personal:cacich/FishingGame.git`。
另外 `~/.gitconfig` 有 `url.<...>.insteadOf` 規則會把 `https://github.com/` 改寫掉，所以**也不能用 HTTPS 網址推**。

本 repo 的 `user.name` / `user.email` 已設在**專案層級**（`.git/config`），不受全域公司設定影響。

### 13. Python `round()` 是銀行家捨入

`tools/make-icons.py` 踩過：`round(7.5)=8` 但 `round(8.5)=8`，導致相鄰兩欄捨到同一個整數、漏掉整欄，描邊再把空欄填黑 → 尾鰭變條紋。
**對策**：像素座標取整一律用 `int(math.floor(n + 0.5))`。（JS 的 `Math.round()` 沒這個問題，是 half-up。）

---

## 必須維持的不變式

### 資料

- **`fish.id` 上線後不可更改。** 它是圖鑑 key，改了等於玩家紀錄消失。同理 `rod` / `bait` / `equip` / `deco` / `location` 的 id。
- **`RARITY_ORDER` 的順序不可打亂。** `order` 欄位被用來做 `>=` 比較（自動模式門檻、稀有以上收藏）。
- **`FG.RODS` / `FG.BAITS` 的陣列順序 = 圖示配色。** 插隊會讓圖示錯位。
- **可進入的釣點，`fish[]` 不可為空。** 空陣列會讓 `rarityTable()` 回傳空表，`weightedPick([])` 回 `undefined`，接著 `FG.pick(row.fish)` 直接 TypeError。目前兩個 `comingSoon: true` 的釣點就是 `fish: []`，靠「不可進入」保護；**加新釣點時如果忘了 `comingSoon` 又還沒填魚，一進去就會爆**。

### 架構

- **不引入 ES module / bundler / npm / CDN。** 破壞「雙擊 index.html 就能跑」這個核心約束。
- **新增／刪除任何前端資產（js / css / 圖片），必須同步更新 `sw.js › ASSETS` 清單並把 `VERSION` 加一。** 漏掉的檔案在離線時會抓不到，整個 App 開不起來。
- **`manifest.webmanifest` 的 `start_url` / `scope` 與 SW 註冊路徑一律用相對路徑。** 寫死 `/` 會讓 GitHub Pages 子路徑部署失效。
- **狀態只能透過 `FG.state` 的方法修改**，方法內部負責 `save()` + `emit()`。直接改 `FG.state.data` 不會存檔也不會刷新 UI。
- **只有 active 分頁的 `frame()` 會被呼叫。** 不要在 `frame()` 裡放「必須持續執行」的邏輯（自動模式刻意利用了這點來實現切頁暫停）。
- **`build()` 只跑一次。** 每次切頁執行的邏輯要放 `onShow()`。

### 遊戲邏輯

- **釣獲結果在 `cast()` 當下抽定**，演出不影響結果。聲納提示與自動加速都依賴這點。
- **圖鑑只增不減。** 賣出／放生不影響圖鑑紀錄。
- **`rateModal()` 顯示的機率與實際抽獎共用 `rarityTable()`。** 不要為了顯示另外寫一份計算，兩份一定會不同步。
- **`collect()` 可能失敗**（魚缸滿），呼叫端必須處理回傳的 `false`。

---

## 效能注意

- 場景背景（`bgCache`）與魚精靈（`fishCache`）**必須維持快取**。背景每幀重畫要跑 230 棵樹 + `getImageData`，會明顯掉幀。
- `drawSparkle()` 每幀畫 190 條線，這是刻意接受的成本（水面反光是視覺重點）。要再加逐幀效果前先量測。
- 家園分頁每幀會為魚缸裡每條魚做一次 `save/clip/restore`，魚缸上限 24 條在手機上實測沒問題，再往上加要留意。

---

## 瀏覽器相容

- `file://` 下 localStorage 可能拋錯 → `FG.store` 全部包了 try/catch，會靜默降級成「不存檔但能玩」。
- WebAudio 需要使用者互動才能啟動 → `main.js › boot()` 綁了一次性 `pointerdown` 呼叫 `FG.sfx.init()`。
- `100dvh` 在舊瀏覽器不支援 → CSS 有 `100vh` 的 fallback 寫在前一行。
