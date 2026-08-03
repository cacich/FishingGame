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

**同類問題**：場景背景的 `bgCache[loc.id]`，改 `loc.scene` 調色盤或 `terrain` 也要重新整理。

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

`buildFish()` 裡的 `put()` 有做，但**後製階段的 special（whisker / horn / scar / spike / jaw / lantern / finlet / mane / frost）是直接寫 `col[]`**，要自己檢查。這是加新 `special` 時最容易犯的錯。

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

### 11. 三層快取疊在一起，「改了沒更新」

線上版總共有**三層**快取，任何一層都可能讓你看到舊檔：

| 層 | 誰造成的 | 怎麼處理 |
|---|---|---|
| 瀏覽器 HTTP 快取 | GitHub Pages 送 `Cache-Control: max-age=600` | SW 抓程式碼類資產時用 `cache:'no-cache'` 繞過（已實作） |
| Service Worker 快取 | 我們自己 | 程式碼類走 network-first（已實作）；圖片是 cache-first，換圖要把 `VERSION` 加一 |
| 本機 `python -m http.server` | 開發環境 | Ctrl+F5，見 §1 |

**開發時**建議在 DevTools → Application → Service Workers 勾 **Bypass for network**，直接把 SW 那層拿掉。
**緊急清除**：`caches.keys().then(k => k.forEach(n => caches.delete(n)))` 再重載。

> 曾經的錯誤設計：程式碼類用 stale-while-revalidate + 一般 `fetch()`。SW 以為抓了新版，其實被瀏覽器的 10 分鐘 HTTP 快取攔下回舊檔，再把舊檔寫回 SW 快取——最糟要等 10 分鐘＋重載兩次。詳見 [13 §為什麼程式碼類一定要 no-cache](13-pwa-and-deploy.md#為什麼程式碼類一定要-cacheno-cache)。

### 12. 多帳號 SSH：別用 `github.com` 推個人 repo

**症狀**：`git push` 到個人 repo 出現權限錯誤，或 commit 掛到錯的帳號。
**原因**：這台機器同時有公司與個人 GitHub 帳號。`~/.ssh/config` 裡 `Host github.com` 綁的是**公司**金鑰，`Host github-personal` 才是個人金鑰。GitHub 是用 SSH key 判斷身分，不是看 email。
**對策**：個人 repo 的 remote 一律寫成 `git@github-personal:cacich/FishingGame.git`。
另外 `~/.gitconfig` 有 `url.<...>.insteadOf` 規則會把 `https://github.com/` 改寫掉，所以**也不能用 HTTPS 網址推**。

本 repo 的 `user.name` / `user.email` 已設在**專案層級**（`.git/config`），不受全域公司設定影響。

### 13. Python `round()` 是銀行家捨入

`tools/make-icons.py` 踩過：`round(7.5)=8` 但 `round(8.5)=8`，導致相鄰兩欄捨到同一個整數、漏掉整欄，描邊再把空欄填黑 → 尾鰭變條紋。
**對策**：像素座標取整一律用 `int(math.floor(n + 0.5))`。（JS 的 `Math.round()` 沒這個問題，是 half-up。）

### 14. 加魚不改機率，但會改期望值

**症狀**：往某個釣點加了幾條魚，費率表數字一模一樣，但模擬跑出來的倍率變了。

**原因**：兩件事很容易混在一起——

- `rarityTable()` 的權重**只看「這一階有沒有魚」**，不看有幾條。所以加魚不會改變任何階級的出現機率。
- 但 `rollCatch()` 是**階級內等機率**抽魚種，所以該階級的期望價值 =「該階所有魚的 `value × 體長修正` 的平均」。加一條特別貴或特別便宜的魚，會直接把整階的期望值拉走。

**對策**：往既有階級加魚時，`value` 要**貼近該階現有魚的水準**（現行做法是同階級之間差距控制在 ±10% 內）。想放一條「特別值錢的」就升它一階，不要在階級內做價差——那會讓費率表顯示的機率跟玩家的實際體感對不上。

實測：晨霧湖從 14 種擴到 24 種、峽灣從 9 種擴到 24 種，滿裝倍率只在 ×1.90／×2.24 附近動了不到 0.05，就是靠這條規則守住的。

### 15. `comingSoon` 與釣點解鎖目前都沒有釣點在用

**五個釣點全部是 `unlock: { free: true }`、全部沒有 `comingSoon`**，所以下面這些路徑現在一條都跑不到：

| 跑不到的東西 | 在哪 |
|---|---|
| `'soon'` 回傳值 | `state.js › unlockLoc()` |
| `'poor'` / `'owned'` 回傳值 | 同上 |
| `data.unlocked[]` 的讀取 | `state.js › isUnlocked()` 的第二條路 |
| 「即將開放」分支 | `main.js › locationPicker()`、`screen-daily.js` |
| 金色解鎖按鈕與確認框 | 同上兩處 |

**別當死碼刪掉。** 這些是「把某個釣點改回收費」或「加預告釣點」時唯一要動的地方，改 `data.js` 一行就會全部復活。重構前先確認沒有這類規劃。
### 16. 尖三角剪影一律會被讀成針葉樹

**症狀**：新做的地形（幽藍冰湖的擠壓冰脊）看起來跟晨霧湖的樹林幾乎一樣，換地形等於白做。

**原因**：在 200×340 的畫布上、10～30px 高的剪影，人眼只讀得到「輪廓」。**尖頂 + 底寬 = 樹**，不管你塗什麼顏色。

**對策**：新地形的輪廓要跟既有地形明顯不同。冰脊改成「寬 ≫ 高、頂面是平的」斜面板塊之後才像冰。設計新地形時先問：**這個輪廓會不會撞到既有的？**

**同類問題**：從高處往下垂的細線會被讀成雨絲（冰川裂隙初版就是這樣），改成從底部往上長就正常了。

### 17. 加地形忘了補 `locThumb()` 的 case

**症狀**：場景畫面對了，但釣點選單／每日分頁／家園掛畫的縮圖還是樹林。

**原因**：`px.locThumb()` 有自己的 `switch (P.terrain)`，**沒有共用 `TERRAIN`**（尺寸差 3 倍以上，等比縮放的細節會糊掉，簡化版反而好認）。漏掉的地形會落到 `default` 也就是樹林。

**對策**：加地形的第 3 步就是補那個 `switch`，見 [06 §新增一種地形](06-pixel-engine.md#新增一種地形)。

### 18. 五王同型：換配色不等於換造型

**症狀**：五位魚王擺在一起完全認不出是不同的魚，只覺得「同一條魚換了顏色」。

**原因**：初版五王全都是 `shape: 'wide'` + `special: ['glow', ..., 'scar']`，只有 `colors` 和 `pattern` 不同。**在 96×56 的精靈框裡，輪廓的辨識權重遠高於配色**——身體比例與尾鰭形狀一樣，就是同一條魚。而且第一位魚王的傷疤是寫在傳說裡的角色設定，複製到另外四位身上之後，那道疤從「故事」退化成「魚王的貼圖」。

**對策**：
1. **一王一個 `shape`**（`catfish` / `tuna` / `dragon` / `pike` / `abyss`），不共用。
2. **拉開輪廓的第一順位是 `gamma`**，其次是 `tailH` / `fork`，配色放最後。差異對照見 [06 §拉開輪廓差異最有效的旋鈕是 gamma](06-pixel-engine.md#拉開輪廓差異最有效的旋鈕是-gamma)。
3. **敘事性的 special 不要複製。** `scar` 只給有那段故事的魚。共用的只留 `glow`（＝「這是魚王」的統一訊號）。

**驗證方法**：`px.sprite(f)` 的 `getImageData` 掃出「透明／非透明」的 ASCII 遮罩，把幾條魚並排看輪廓。改魚造型時這比看畫面快得多，也不會被 `fishCache`（§3）騙。注意 `glow` 的半透明光暈會讓遮罩虛胖 2px，判斷輪廓時要用 `alpha >= 200` 過濾掉。

### 19. 吻端沒留空間，鬍鬚會被切光

**症狀**：`special: ['whisker']` 的魚看不到鬍鬚，只有吻端前一小截。

**原因**：`sc` 的夾住規則（`0.98 / (bodyLen + tailLen)`）會讓 `scale ≥ 1.2` 的魚吻端落在 x≈91，而鬍鬚要往前伸約 11px。`whisker` 的繪製碼有 `room = W - 2 - mx` 的保護會自己截斷（這是 §5 那個坑留下的防護），所以**不會畫錯位，只會靜默消失**——比報錯更難發現。

**對策**：`buildFish()` 開頭的 `headRoom` 會在有 `whisker` 時預留 12px，代價是魚整體小約 12%。細節見 [06 §吻端留白](06-pixel-engine.md#吻端留白--headroom)。**新增「會往身體外延伸」的 special（鬍鬚、燈籠竿、長鰭條）時，先確認它要的空間是不是也需要納入 `headRoom`。**

### 20. 自動模式的補貨只寫在結算裡 → 開場即停

**症狀**：餌料歸零時按「開始自動」，明明勾了「自動補貨」，卻立刻彈出「停止原因：餌料用完　執行局數 0」。

**原因**：補貨判斷原本只寫在 `resolveAuto()`，也就是**第一局結算之後**才跑。開場的 `startAuto()` → `cast(true)` 走的是 `canCast()` 失敗分支，那裡只有 `stopAuto(chk.msg)`。

**對策**：把補貨抽成 `autoRestockBait()`，**啟動路徑與結算路徑共用**。細節見 [05 §餌料補貨](05-auto-mode.md#餌料補貨--autorestockbait)。

**一般化的教訓**：自動模式有**兩個**進入拋竿的入口（`startAuto()` 的第一竿、`frame()` 排程的後續竿），前者不經過 `resolveAuto()`。**任何「每局都要檢查」的條件，都要確認開場那一竿也檢查得到。**

---

## 必須維持的不變式

### 資料

- **`fish.id` 上線後不可更改。** 它是圖鑑 key，改了等於玩家紀錄消失。同理 `rod` / `bait` / `equip` / `deco` / `location` 的 id。
- **`RARITY_ORDER` 的順序不可打亂。** `order` 欄位被用來做 `>=` 比較（自動模式門檻、稀有以上收藏）。
- **`FG.RODS` / `FG.BAITS` 的陣列順序 = 圖示配色。** 插隊會讓圖示錯位。
- **每個釣點的 `scene.terrain` 必須是 `pixel.js › TERRAIN` 裡存在的 key**，而且**不要跟其他釣點重複**。拼錯不會報錯，只會靜默退回 `forest`（`TERRAIN[P.terrain] || TERRAIN.forest`）——症狀就是「新釣點看起來跟晨霧湖一樣」。
- **可進入的釣點，`fish[]` 不可為空。** 空陣列會讓 `rarityTable()` 回傳空表，`weightedPick([])` 回 `undefined`，接著 `FG.pick(row.fish)` 直接 TypeError。**目前五個釣點都已填魚、都沒有 `comingSoon`，所以少了「不可進入」這層保護——加新釣點時只要忘了 `comingSoon: true` 又還沒填魚，一進去就會爆。**
- **每個釣點的每一個稀有度階級都要有魚。** 不是硬性規定（缺席只會讓該階權重消失，不會爆），但**費率表會因此跟其他釣點不一致**，玩家換釣點時看到機率跳動會覺得是 bug。現行五個釣點都是 junk 3 / common 6 / good 5 / rare 4 / epic 2～3 / legend 2 / king 1，配額的理由見 [07 §一個釣點該放幾條魚](07-data-schema.md#一個釣點該放幾條魚)。

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

- 場景背景（`bgCache`）與魚精靈（`fishCache`）**必須維持快取**。背景每幀重畫要跑整套地形產生器 + `getImageData` 倒影，會明顯掉幀。新增地形時不用擔心它畫得慢——**它一輩子只跑一次**。
- `drawSparkle()` 每幀畫 190 條線，這是刻意接受的成本（水面反光是視覺重點）。要再加逐幀效果前先量測。
- 家園分頁每幀會為魚缸裡每條魚做一次 `save/clip/restore`，魚缸上限 24 條在手機上實測沒問題，再往上加要留意。

---

## 瀏覽器相容

- `file://` 下 localStorage 可能拋錯 → `FG.store` 全部包了 try/catch，會靜默降級成「不存檔但能玩」。
- WebAudio 需要使用者互動才能啟動 → `main.js › boot()` 綁了一次性 `pointerdown` 呼叫 `FG.sfx.init()`。
- `100dvh` 在舊瀏覽器不支援 → CSS 有 `100vh` 的 fallback 寫在前一行。
