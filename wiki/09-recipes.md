# 09 · 操作手冊

> 「我想做 X」→ 照著做。每一則最後都有**必須更新的 wiki 頁面**。
> 相關：[07 資料規格](07-data-schema.md)、[11 地雷](11-invariants-and-gotchas.md)

> ⚠️ 每一則的最後一步都是 **更新 wiki + 寫 CHANGELOG**。這不是選配，規則見 [`CLAUDE.md`](../CLAUDE.md)。

---

## 新增一種魚

1. 打開 `js/data.js`，找到目標釣點的魚陣列（`MIST_LAKE_FISH` / `POND_FISH` / `RAPIDS_FISH` / `FJORD_FISH` / `CORAL_FISH` / `SHRINE_FISH` / `TIDAL_FISH` / `FROST_FISH` / `FALL_FISH` / `LOTUS_FISH` / `CALDERA_FISH` / `ABYSS_FISH` / `WORLD_ROOT_FISH` / `DUAT_FISH` / `CAVERN_FISH` / `DAWN_PORT_FISH`）。
2. 依稀有度插到對應的 `/* --- 稀有度 --- */` 區塊，欄位規格見 [07 §魚](07-data-schema.md#魚--locationfish)：
   ```js
   { id: 'ml_newfish', name: '新魚', rarity: 'rare', shape: 'flat', scale: 1.0,
     pattern: 'spot', mult: 2.13, minLen: 30, maxLen: 65,
     colors: { body: '#xxxxxx' }, desc: '一句描述' }
   ```
3. `id` 必須全域唯一，用釣點前綴（對照表見 [07 §釣點](07-data-schema.md#目前的二十個釣點)）。
4. **`mult` 要貼近該階級現有魚的水準**（差距抓 ±10% 內）。`mult` 是**相對下注額的賠付倍率**，不是絕對籌碼。理由見 [11 §14](11-invariants-and-gotchas.md)：加魚不改變階級機率、也不改變總 RTP（`rtpNorm` 會拉回 98%），但會**稀釋同階其他魚的賠付**。想放一條特別值錢的，**升它一階**，不要在階級內做價差。
5. 顏色照該釣點的調色規則走（[07 §各釣點的配色規則](07-data-schema.md#各釣點的配色規則)）。深淵海溝的魚幾乎都要帶 `special: ['glow']`，否則在極暗底色下整格是一團黑。
6. 重新整理頁面，去圖鑑看剪影對不對；想直接看成品，在 console 跑：
   ```js
   document.body.appendChild(FG.px.spriteEl(FG.fishById('ml_newfish'), 4))
   ```
7. 調 `shape` / `scale` / `pattern` / `colors` 到滿意。**每次改完都要重新整理**（精靈有快取）。

**注意**：如果那個階級原本沒有魚，加進去等於憑空多出整個階級的權重（[03 §六](03-economy.md#六--稀有度權重表--raritytableloc)）；如果那階原本就有魚，機率完全不變、總 RTP 也不變，只有同階的賠付分配會動。

**驗證方式**：不要跑模擬看 RTP（恆為 0.98，看不出東西）。看兩個地方——費率表的「平均賠付」那一欄有沒有被拉走，以及 `FG.state.rtpNorm(loc)` 是不是還貼近 1.000（偏離越多代表資料離設計曲線越遠）。

📝 **要更新**：[07 資料規格](07-data-schema.md)（若引入新的 pattern/special/junkArt，或改變了釣點的魚種數）、若動到該階的賠付水準則更新 [10 平衡調參](10-balance-tuning.md) 的分布表。

---

## 新增一種魚的造型特徵（`shape` / `special`）

要讓一條魚**看起來**跟別人不一樣，優先順序是固定的：**輪廓 ＞ 特徵物 ＞ 花紋 ＞ 配色**。只換配色是無效的（[11 §18](11-invariants-and-gotchas.md#18-五王同型換配色不等於換造型)）。

### 加一種 `shape`

1. `js/pixel.js › SHAPES` 加一筆，欄位定義見 [06 §體型輪廓表](06-pixel-engine.md#體型輪廓表--shapes)。
2. **先動 `gamma`**（最寬處位置，`t_widest = 0.5^(1/gamma)`）與 `tailH` / `fork`，這三個決定了輪廓能不能跟既有體型區分開。
3. 用 ASCII 遮罩並排比對，比看畫面快也不會被 `fishCache` 騙：
   ```js
   // 只留 alpha >= 200，濾掉 glow 的半透明光暈（否則輪廓會虛胖 2px）
   const cv = FG.px.sprite(FG.fishById('魚id')), d = cv.getContext('2d').getImageData(0,0,96,56).data;
   let s=''; for (let y=0;y<56;y++){ for (let x=0;x<96;x++) s += d[(y*96+x)*4+3]>=200 ? '#' : '.'; s+='\n'; }
   console.log(s);
   ```

### 加一種 `pattern`

1. `js/pixel.js › buildFish()` 上色迴圈裡的 `switch (f.pattern)`（`scale` case 之後）加一個 `case`。
2. 迴圈當下已經算好兩個座標可以直接用：`t`（沿身體長度，0=尾根／1=吻端）與 `v`（沿身體高度，0=背／1=腹，已經做完反蔭蔽）。花紋邏輯就是拿 `t`／`v` 判斷要不要把當下像素 `c` 混進 `patC`（`FG.mix(c, patC, 強度)`）。
3. **先想清楚新花紋要佔哪一種幾何邏輯，不要跟既有的撞**：現有八種是「週期性重複」（`stripe`/`spot`/`speck`/`net`/`scale`）或「固定橫帶」（`band`/`band2`）；2026-08-06 補的四種各自佔一個新邏輯（連續漸變／只在背部的分段色塊／單一固定標記／斜向鋸齒），見 [06 §花紋](06-pixel-engine.md#花紋--pattern)。
4. `case` 需要局部變數（`const`）時記得包一層 `{ }`——`switch` 底下所有 `case` 共用同一個區塊作用域，兩個 `case` 都宣告 `const d` 會直接噴 `SyntaxError`。
5. 花紋不影響輪廓（`layer` 陣列），所以不會被 `headRoom` 或畫布邊界卡到，也不用改 `HEAD_ROOM`。

📝 **要更新**：[06 像素引擎](06-pixel-engine.md)（花紋表加一列）、[07 資料規格](07-data-schema.md)（`pattern` 的可用值）、[12 名詞表](12-glossary.md)（可用值清單）。

---

### 加一種 `special`

1. `js/pixel.js › buildFish()` 的 special 區塊（`scar` 那一段之後）加一段 `if (sp.indexOf('新key') >= 0) { ... }`。
2. **每一次寫入都要分別檢查 `x` 和 `y` 邊界**——那一段是直接寫 `col[]`，沒有 `put()` 的保護（[11 §5](11-invariants-and-gotchas.md#5-canvas-平面索引忘記檢查-x-邊界)）。
3. 顏色從 `f.colors` 讀，一律給預設值：`const c = C.新色 || '#xxxxxx';`
4. 三條經驗：細節**畫在身體像素上不要外凸**、弧線**取樣要密到步距 < 1px**、點狀特徵**要有形狀且數量要少**。理由見 [06 §特殊特徵](06-pixel-engine.md#特殊特徵--special)。
5. 若特徵會往**身體輪廓外**延伸（鬍鬚、燈籠竿、鉤吻），確認畫布邊緣夠不夠；不夠就要納入 `headRoom`（[11 §19](11-invariants-and-gotchas.md#19-吻端沒留空間鬍鬚會被切光)）。
   > ⚠️ **納入 `headRoom` 的 special 不能用「像素數有沒有變多」來驗。** 它會讓整條魚縮小，實測 `kype` 加上去之後總像素**少了 382 個**，但鉤吻確實有畫出來。要看吻端前方那一段的遮罩，不要看總數。

📝 **要更新**：[06 像素引擎](06-pixel-engine.md)（輪廓表／special 表加一列）、[07 資料規格](07-data-schema.md)（`shape` / `special` 的可用值與 `colors` 欄位）、[12 名詞表](12-glossary.md)（可用值清單）。

---

## 新增一個釣點 ★ 一次要生出一整套

> **這是硬性規定。** 一個釣點不是只有地圖——**釣點、釣竿、餌料、魚種、裝備、家園裝飾、魚王 cut-in、完整正式美術，八樣要一起加。**
> 少了任何一樣，那個釣點就會變成「沒有專屬東西可買」的空殼，玩家到了那裡沒有新目標。

| 要加的東西 | 加在哪 | 規則 |
|---|---|---|
| **釣點** | `data.js › FG.LOCATIONS` | 專屬 `scene.terrain`（不共用），`minBet` 必須是 `FG.BETS` 裡的一格，順序跟 `minBet` 遞增一致 |
| **魚種** | 同一個檔案的 `XXX_FISH` 陣列 | 23～24 種，七個階級都要有，圖鑑分母 ≥ 20。`mult` 由換算腳本生成 |
| **釣竿** | `data.js › FG.RODS` | 一支主題竿，`loc: '釣點id'`。**通用**（哪裡都能用），價格插進**等差**曲線 |
| **餌料** | `data.js › FG.BAITS` | 一種主題餌，`loc: '釣點id'`。**通用**，價格插進**等差**曲線 |
| **裝備** | `data.js › FG.EQUIPS` | 一件專屬裝備，`effect.loc: '釣點id'`，價格 = `minBet × 40`，效果 **+2%～+5%**，**只給一個** |
| **家園裝飾** | `data.js › FG.DECOS` | 一件主題裝飾，`effect: {}`（**純裝飾**） |
| **魚王 cut-in** | `cutin.js › KING` | 一筆，key 是魚王的 `fish.id`。六行，見下方步驟 14 |
| **完整正式美術** | `assets/scenes/`、`assets/sprites/`、裝備／裝飾繪圖表 | 主背景 200×340、縮圖 76×50、`fish[]` 每一項（含 3 件雜物）各一張 96×56 RGBA 精靈，以及釣竿配色、裝備圖示、裝飾圖示／房間實體；**程序化版本只算載入失敗備援，不算交付完成** |

### 為什麼四者的規則不一樣（重要）

> 🔴 **2026-08-06：規則沒變，但理由整個換了。** 舊理由是「倍率會不會疊乘失控」——
> 固定 RTP 之後那個風險已經**結構性消除**（`rtpNorm()` 會把 EV 釘回 98%，疊再多也只是把 EV 搬來搬去）。
> 現在的理由是**幅度該給多大**，以及**內容規則**。

| | 同時生效幾件 | 幅度可以多大 | 所以 |
|---|---|---|---|
| 釣竿 | **1 支** | 大（`kingMul` 跨到 ×2.5） | 可以通用，放心加 |
| 餌料 | **1 種** | 大（`jackpotMul` 跨到 ×1.6） | 可以通用，放心加 |
| 裝備 | **全部相乘** | **小（+2%～+5%）** | 六件同時生效約 ×1.20，玩家看得懂每一件的貢獻 |
| 家園裝飾 | **全部相乘** | — | **純裝飾**：能給的效果只剩 `jackpotMul`／`kingMul`，掛在家具上講不通 |

`effect.loc` **現在不是安全機制了**，它純粹是內容規則：一釣點一整套周邊，讓每個釣點保有自己的一件東西。

> ⚠️ **專屬裝備只給一個效果。** 舊理由是兩個乘數會把倍率曲線推高兩成（初版黃沙冥河跑出 ×3.13）。現在的理由是**玩家看得懂**——一件裝備一句話講得完。
>
> ⚠️ **絕對不要加會改變「玩家付出多少」的效果**（折扣、返還、免費次數）。那是唯一真的會打破 98% 的東西，見 [11 §41](11-invariants-and-gotchas.md)。可用的 effect key 只有 `jackpotMul` / `kingMul` / `sizeBonus` / `showHint`。

### 步驟

1. `js/data.js` 的 `FG.LOCATIONS` 加一筆，欄位見 [07 §釣點](07-data-schema.md#釣點--fglocations)。
2. 先把 `fish: []` 留空、`comingSoon: true`，確認選單、圖鑑、縮圖都正常。
3. 選 `scene.terrain`。**不要沿用既有釣點的地形**——每個釣點一種是這個專案的原則，理由見 [06 §地形系統](06-pixel-engine.md#三之二--地形系統--terrain)。要新增地形照那一節的四個步驟做（記得補 `locThumb()` 的 `switch` case）。
   > 到第二十種為止，好用的辨識手段已經很密。**動手畫之前先看 [06 §二十種地形各自佔了哪一條辨識軸](06-pixel-engine.md#二十種地形各自佔了哪一條辨識軸)，挑一條還空著的。** 撞到既有的那一條，做出來就等於白做。
   >
   > **軸不一定要在天際線上。** 2026-08-05 的三種地形示範了另外三個方向：把識別放在**水面**（`rapids` 的斜向流線與尾流）、放在**水下**（`reef` 的側視礁體）、或者**把天空整片拿掉**（`cavern`）。天際線的形狀已經被佔了九種，往這三個方向找比較容易找到空位。
   >
   > **2026-08-06 又多了兩個方向**：在天空放一個**天體**（`wreck` 的日盤——前十五種的天空只有漸層），以及讓**同一個物件跨過水線**（`wreck` 的船身，上部構造在 `above()`、水下船身在 `below()`）。後者附帶一個地雷：水下那一塊的明度必須跨過水色，否則等於沒畫，見 [11 §36](11-invariants-and-gotchas.md)。
   >
   > ⚠️ **只要新地形要在水面上放東西，先想「它站在什麼上面」。** 這一版的水面是一整片平塗漸層，沒有任何東西可以讓物件站上去，所以物件必須自己帶著水下的體積（`rapids` 的石頭帶一塊深色橢圓、`reef` 的珊瑚長在礁丘上）。這一條連續兩個地形都踩到，見 [11 §31](11-invariants-and-gotchas.md)。
4. 調 `scene` 調色盤。快速預覽：
   ```js
   document.body.appendChild(FG.px.locThumb(FG.locById('new_spot'), 200, 130))
   ```
   **改完 scene 或 terrain 一定要重新整理**（背景有 `bgCache`）。
5. 填魚。**七個階級都要有**（junk 3 / common 6 / good 5 / rare 4 / epic 2～3 / legend 2 / king 1），配額理由見 [07 §一個釣點該放幾條魚](07-data-schema.md#一個釣點該放幾條魚)。缺席的階級權重會消失，費率表會跟其他釣點不一致。
   - 扣掉雜物之後至少要有 **20 種**，圖鑑的收集進度條長度才跟其他釣點一致。
   - 三件雜物都要配**專屬且不跨釣點複用**的雜物美術（`pixel.js › JUNK_MAPS` 各加一筆）。三件分別涵蓋自然物、當地活動痕跡、帶故事感的人造物；規則與現有對照表見 [06 §雜物字元圖清單](06-pixel-engine.md#雜物字元圖清單--junk_maps)。
   - **`mult` 先隨便填**（同階級填一樣的數字就好），步驟 8 的換算腳本會全部覆蓋掉。
6. **產生並接上完整正式美術。** 新釣點不能只靠 `scene.terrain`／`buildFish()`／`JUNK_MAPS` 看起來能玩就算完成；這三者必須保留做失敗備援，但正式交付還要同時具備：
   - `scene.art.background`：`assets/scenes/<location-id-kebab>-background.png`，固定 **200×340**；`scene.art.thumbnail`：同名 `-thumbnail.png`，固定 **76×50**。背景不得含船、人物、魚、釣具、文字或 UI，規格見下方「替換一個釣點的點陣背景」。
   - `fish[]` 的**每一筆**（魚與三件雜物都算）各有 `assets/sprites/<location-id-kebab>/<fish-id>.png`，固定 **96×56 RGBA**、透明背景、單一主體；魚類原始朝向一律**魚頭朝右**。
   - 批量產圖先跑 `node tools/generate-image-prompts.js` 取得逐項描述；可將 12 項依 row-major 排成 3×4 規格表，背景用精確純色 `#FF00FF`，每格一個置中主體，**禁止輪廓外光暈、半透明 bloom、文字與格線**。發光只能用主體輪廓內或緊貼輪廓的實色像素，否則去背會留下洋紅矩形或彩色光暈。
   - 用 `tools/split-sprite-sheet.py` 依 id 名單切格、去鍵色、保留最大 8 鄰接主體並縮進 96×56；必要時用 `tools/flip-sprites.py` 修正魚頭方向。切圖工具能清掉跨格零星像素，**不能救格序錯誤或被光暈污染的鍵色背景**。
   - 驗收必須同時通過：檔案數 = `loc.fish.length`、每張為 96×56 RGBA、同時有透明與不透明像素、只剩一個 8 鄰接連通主體、魚頭朝右；最後把兩張場景圖與全部精靈逐張列進 `sw.js › ASSETS` 並提升 `VERSION`。少任何一張，都不能把新釣點標成完成。
7. 設 `minBet`（**必須是 `FG.BETS` 裡真實存在的一格**），`unlock` 填 `{ free: true }`（現行釣點都免費，門檻靠 `minBet`）。**在 `FG.LOCATIONS` 裡的位置要跟 `minBet` 遞增一致**——那個順序同時是各處 UI 的顯示順序與玩家讀到的進程順序。插隊是安全的（所有參照都用 `loc.id`）。
   - 目前前十個釣點各佔 100 那一段的一格，後十個佔 1000 那一段，終點站停在 11,000（**刻意不用滿階梯頂**，讓最深釣點仍保留 12,000 一格加注空間）。
8. **跑換算腳本生 `mult`。** 這一步取代了舊版整套「填 `value` → 跑模擬 → 算校正係數」的流程。
   - 腳本讀 [10 §波動度曲線](10-balance-tuning.md#波動度曲線唯一真正要調的東西) 的表，用 `v = 釣點索引 / (釣點數-1)` 內插出七個階級的目標倍率，階級內按現有數值的相對比例分配，最後對每個釣點整批縮放讓基礎 EV = `FG.RTP_TARGET`。
   - ⚠️ **插隊會讓後面所有釣點的 `v` 位移**，所以插隊之後要**整批重跑**，不能只算新的那一個。
   - 腳本會斷言替換筆數（目前 463），對不上就中止不寫檔；縮放 EV 要包含 `E[(len/avg)²]` 與非雜物閃光期望 1.06。
9. 拿掉 `comingSoon`，驗證：
   - **RTP 不用驗**——它是 `rtpNorm()` 的恆等式保證的 98%，加釣點不可能改變它。要確認沒寫壞就跑全組合掃描（[10 §驗證](10-balance-tuning.md#驗證驗恆等式不要驗統計量)），誤差應該在 1e-15 量級。
   - **要驗的是波動度單調遞增**：新釣點的普通倍率要比前一站低、魚王倍率要比前一站高。
   - **不要跑蒙地卡羅看 RTP**，那個量的噪音被魚王主宰，會讓你追著雜訊改數值（[11 §43](11-invariants-and-gotchas.md)）。
   - 回頭更新 [10](10-balance-tuning.md) 與 [03](03-economy.md) 的分布表。
10. **如果新釣點接在最後面**：檢查原本最後一名的 `desc` 有沒有寫死「最深」「最後」這類字眼。
11. **加那一整套周邊**（釣竿／餌料／裝備／家園裝飾），照上面的規則表。三件事別漏：
   - `FG.RODS` 與 `FG.BAITS` 必須維持 **price 遞增**（那個順序就是圖示配色順序），而且價格是**等差**的（竿 +15,000／餌 +5），插隊要把整條重新排一次而不是塞一個中間值。竿的 `kingMul` / `sizeBonus`、餌的 `jackpotMul` / `junkMul` 也要順著插進前後鄰居之間，不要跳號。
   - 專屬裝備價格用 `minBet × 40`，效果從 +2%（最淺）到 +5%（最深）線性插值，`jackpotMul` 與 `kingMul` 交錯給。
   - **`screen-shop.js › rodIcon()` 的兩張色表要跟 `FG.RODS` 一樣長**（目前 25 筆），它是 `cols[idx]` 直接取值，漏補就整個圖示消失（[11 §24](11-invariants-and-gotchas.md)）。**取餘數的 `% 25` 也是硬寫的，要一起改。****竿子插在中間的話，配色也要插在同一格**，只往表尾補會讓後面所有竿子的圖示顏色整排位移。
   - 新裝備要在 `screen-shop.js › EQUIP_ART` 補圖、新裝飾要在 `screen-home.js › DECO_ART` 補圖**並且**在 `pixel.js › drawRoom()` 補繪製碼。
   - **裝飾如果是「靠動作定義的物件」**（水景、添水、冒汽的東西），`drawRoom()` 裡一定要讓它動——靜態剪影跟其他家具分不出來，見 [06 §家園房間](06-pixel-engine.md#四--家園房間)。
12. **檢查窄螢幕的介面**。把視窗縮到 320px，看圖鑑的釣點切換列、全螢幕釣點地圖庫（搜尋、四個分組、預覽、兩欄卡片）與**釣魚畫面的下注列**（[08 §會隨釣點數量成長的介面](08-ui-and-screens.md#會隨釣點數量成長的介面)）。`name` 建議 4 個字以內、`subtitle` 8 個字以內；地圖庫卡片會截斷過長副標，但大型預覽仍應能讀完整名稱。現行 20 個釣點與 21 檔下注都靠既有的橫向捲動／地圖庫網格承載；要特別確認後段釣點與 10,000／11,000／12,000 投注鈕可操作。
13. **檢查商店三個分頁每一列都有圖示**（一行 console 就能掃）：
    ```js
    ['rod','bait','equip'].forEach(t => { FG.screenShop.tab = t; FG.screenShop.render();
      const blank = [...document.querySelectorAll('#shopList .item canvas')].filter(c => {
        const d = c.getContext('2d').getImageData(0,0,c.width,c.height).data;
        for (let i = 3; i < d.length; i += 4) if (d[i] > 0) return false; return true; });
      console.log(t, '空白圖示', blank.length); });
    ```
14. **給新魚王一筆 cut-in 資料**。`js/cutin.js › KING` 加一列，key 是魚王的 `fish.id`：
    ```js
    xx_king_name: { motif: 'spiral', particle: 'burst', title: '環　世', tone: [262, 392, 523, 784, 1046] },
    ```
    - `motif` 四選一（`emerge` / `charge` / `spiral` / `reveal`），挑跟這位魚王的傳說最貼的那個。**同一個 motif 給兩位魚王是可以的**——主色調來自魚自己的 `colors.glow`，粒子動線與音階也不同，看起來仍然是兩場演出。
    - `title` 是兩個字，中間放**全形空格**拉開字距（跟 `castMsg` 的「收　線！」同一套處理）。
    - `tone` 是登場音階，3～5 個音。上行明亮、下行沉重，照這位魚王的氣質挑。
    - **不用設顏色**，`cutin.js` 直接吃 `fish.colors.glow` 與 `colors.pattern`。
    - 驗證（會直接播一次，不用真的釣到）：
      ```js
      FG.go('fishing');
      const f = FG.fishById('xx_king_name');
      FG.cutin.play(FG.screenFishing.el.querySelector('#stageWrap'), f, { fishId: f.id }, FG.cutin.plan(f));
      ```
    - **漏了不會報錯**，會退回 `KING_FALLBACK`（通用的 emerge ＋「魚　王」），症狀是「新魚王的登場演出跟別人一樣」。所以它列在這張清單裡。

📝 **要更新**：[07 資料規格](07-data-schema.md) 的釣點表（含 minBet、可選檔數與精靈路徑契約）、配色規則表與**釣竿／餌料／裝備／裝飾四張表**、[06 像素引擎](06-pixel-engine.md) 的地形／正式精靈流程、[13 PWA](13-pwa-and-deploy.md) 的快取版本與資產清單、[10 平衡調參](10-balance-tuning.md) 的波動度曲線與分布表、[03 經濟](03-economy.md) 的分布表、[12 名詞表](12-glossary.md) 的 id 前綴與 terrain 清單、[04 釣魚循環](04-fishing-loop.md) 的魚王 cut-in 分配表、[README](README.md) 的三十秒版本、[_map](_map.md) 與 [CHANGELOG](CHANGELOG.md)。

---

## 替換一個釣點的點陣背景

1. 準備兩張像素 PNG：主圖固定 `200×340`，縮圖固定 `76×50`。主圖只畫靜態環境，**不要畫船、人物、水豚、釣竿、釣線、浮標、魚、文字或 UI**。
2. 主圖中央與下半部要留給船（約 x 52～146、y 221～268）、浮標（約 x 152、y 208）與躍魚弧線；這段必須是連續、不透明且可航行的水面，不能畫海床、沙洲、礁石、碼頭或水下地形。`#stage` 使用 `object-fit: cover`，重要地標不要貼畫面外緣。
3. 放進 `assets/scenes/`，命名用 location id 可辨識的 kebab-case。
4. 在 `data.js › FG.LOCATIONS[].scene` 加：
   ```js
   art: {
     background: 'assets/scenes/xx-background.png',
     thumbnail: 'assets/scenes/xx-thumbnail.png',
     horizon: 0.32
   }
   ```
   `art.horizon` 要對準圖片的實際水線；`scene.horizon` 保留給程序化備援。
5. 把兩張圖加入 `sw.js › ASSETS` 並把 `VERSION` 加一。圖片走 cache-first，只換檔案但不升版會繼續看到舊圖。
6. 驗證閒置、拋竿、咬鉤、收線與 cut-in；再用 320px 寬確認裁切，並打開釣點選單確認橫式縮圖。

`pixel.js › loadImage()` 會在圖片載入前與失敗時保留程序化地形，所以不要刪掉原本的 `terrain`／調色盤。這個備援是為了維持「雙擊 `index.html` 就能跑」與 PWA 離線可玩，不是暫時過渡碼。

📝 **要更新**：[06 像素引擎](06-pixel-engine.md)（場景來源或規格有變時）、[07 資料規格](07-data-schema.md)（`scene.art`）、[13 PWA 與部署](13-pwa-and-deploy.md)（ASSETS／VERSION），新增資產還要維護 [`_map.md`](_map.md) 與 CHANGELOG。

---

## 新增一件裝備

1. `js/data.js › FG.EQUIPS` 加一筆，`effect` 只能用既有的四個 key（`jackpotMul` `kingMul` `sizeBonus` `showHint`）＋ 選用的 `loc`。**幅度一律 +2%～+5%**（裝備全部相乘）。
2. 價格：通用裝備接在等差曲線後面；釣點專屬裝備用 `minBet × 40`。
3. `js/screen-shop.js › EQUIP_ART` 加一張 16×9 字元圖，key 用裝備 id。**忘了加圖示不會報錯，只會是空白格**。
4. **要用新的 effect key**：先讀 [11 §41 §42](11-invariants-and-gotchas.md)。
   - 會改變「玩家付出多少」的（折扣、返還、免費次數）**一律不行**——那是唯一真的會打破 98% 的東西。
   - 只改變分布的（乘在賠付上、改階級權重）可以，但**必須加進 `state.js › rtpNorm()` 的 rawEV 計算**，否則正規化會算錯。而且文案要誠實地描述分布，不能寫成收益。

📝 **要更新**：[07 資料規格](07-data-schema.md) 的裝備表、[03 §五](03-economy.md#五--加成來源只剩四個-effect-key)（若新增 effect key）、[12 名詞表](12-glossary.md)。

---

## 新增一種餌料 / 釣竿

1. `FG.BAITS` / `FG.RODS` 加一筆。竿只能給 `kingMul` / `sizeBonus`，餌只能給 `jackpotMul` / `junkMul`。
2. **價格要維持等差**（竿 +15,000／餌 +5）。插在中間就要把整條重排，不是塞一個中間值。
3. **插入位置會影響圖示配色**（`baitIcon()` / `rodIcon()` 用陣列 index 取色）。`rodIcon()` 的兩張色表**必須跟 `FG.RODS` 一樣長**，而且硬寫的 `% 21` 也要一起改（[11 §24](11-invariants-and-gotchas.md)）；`baitIcon()` 有取餘數所以不會壞。

📝 **要更新**：[07 資料規格](07-data-schema.md) 的竿／餌表、[10 平衡調參](10-balance-tuning.md) 的商店價格表。

---

## 新增一種家園裝飾

要動**三個地方**：

1. `js/data.js › FG.DECOS` — 資料。**`effect` 一律留空**（純裝飾），價格接在等差曲線後面（+5,000）。
2. `js/pixel.js › drawRoom()` — 房間裡的繪製碼，照現有的 `if (deco.xxx) { ... }` 格式加。
3. `js/screen-home.js › DECO_ART` — 商品列的 16×8 字元圖。

📝 **要更新**：[06 像素引擎 §家園房間](06-pixel-engine.md#四--家園房間)、[07 資料規格](07-data-schema.md)。

---

## 加一條「選項數量會成長」的橫向列

例如新的分段選擇器、新的分頁標籤。**不要用預設的 `.seg`**——它的 button 是 `flex: 1`，選項一多就會把中文壓到折行（[11 §21](11-invariants-and-gotchas.md#21-flex-1-的橫向列會壓縮中文到折行)）。

1. class 用 `seg seg-scroll`。
2. 內容建好之後呼叫 `FG.ui.scrollEdges(el)` 掛邊緣漸層提示。
3. **如果會程式化改 `scrollLeft`（例如把選中項捲進可視範圍），一定要先捲再呼叫 `scrollEdges()`**（[11 §22](11-invariants-and-gotchas.md#22-scrolledges-必須在動過-scrollleft-之後才呼叫)）。
4. 驗證：把視窗縮到 320px，確認所有 button 的 `offsetHeight` 一致且 ≤ 34。

📝 **要更新**：[08 介面](08-ui-and-screens.md) 的設計語彙表。

---

## 新增一個分頁

1. 建 `js/screen-xxx.js`，實作 [01 §畫面模組契約](01-architecture.md#畫面模組契約)。
2. `index.html` 在 `main.js` **之前**加 `<script>`。
3. `main.js › SCREENS` 陣列加進去（順序 = 底部導覽順序）。
4. `icon` 要是 `pixel.js › ICONS` 裡存在的 key，不然就先加一張 12×12 字元圖。
5. 需要動畫才實作 `frame(now)`；不需要就別加，省效能。

📝 **要更新**：[01 架構](01-architecture.md)、[08 介面](08-ui-and-screens.md)、[README](README.md) 的檔案總覽、[`_map.md`](_map.md)。

---

## 新增一個自動模式的停止條件

1. `screen-fishing.js › autoModal()` 加一個 `seg(...)` 或輸入欄，寫進區域變數 `cfg`。
2. `startAuto(cfg)` 把它寫進 `state.data.auto` 與 `this.auto`。
3. `state.js › freshSave()` 的 `auto` 物件補預設值。
4. `autoModal()` 開頭 `Object.assign` 的 fallback 也要補（舊存檔沒這欄位）。
5. `resolveAuto()` 的「停止條件」段落插入判斷 + `this.stopAuto('原因')` + `return`。

📝 **要更新**：[05 自動模式](05-auto-mode.md) 的停止條件表與狀態物件、[02 存檔](02-state-and-save.md) 的 schema。

---

## 調整某條魚的賠付 / 稀有度

**賠付**：改 `mult`。實際賠付 = `bet × mult × (體長/平均體長)² × rtpNorm × (閃光?3:1)`。

⚠️ **改一條魚的 `mult` 不會改變總 RTP，但會稀釋同階其他魚的賠付。** `rtpNorm()` 把總 EV 釘在 98%，所以把某條魚調高 20%，同階其他魚就會被壓低——這是零和的。想讓某條魚特別值錢，正確做法是**升它一階**。

**稀有度**：改 `rarity`。**會連動改變整個釣點的機率分布與該階的賠付平均**。RTP 仍然不動，但費率表兩欄都會變。

**驗證**：看費率表的「平均賠付」欄，以及 `FG.state.rtpNorm(loc)` 有沒有偏離 1.000 太多（基礎配置下應該貼近 1）。**不要跑模擬看 RTP**。

📝 **要更新**：[10 平衡調參](10-balance-tuning.md) 與 [03 §十一](03-economy.md#十一--目前的分布) 的分布表。

---

## 接上真實金流

目前 `main.js › openTopup()` 的按鈕 onClick 是：

```js
const r = st.buyPack(p);   // 直接發貨
```

把它換成付款流程的 callback，**付款成功後再呼叫 `st.buyPack(p)`**。`buyPack()` 本身就是純粹的發貨函式（加籌碼、發附贈品、記錄限購），可以原樣沿用。同時記得拿掉彈窗頂部的測試版警語。

📝 **要更新**：[07 資料規格 §籌碼包](07-data-schema.md#籌碼包--fgpacks)、[README](../README.md) 的「尚未實作」清單。

---

## 加上「上鉤後的拉扯小遊戲」

目前 `reel` 階段是純演出（[04 §時間軸](04-fishing-loop.md#時間軸)）。要改成互動：

1. `frame()` 的 `case 'reel'` 換成小遊戲的狀態更新與繪製。
2. 小遊戲的成敗要能影響結果——但**結果在 `cast()` 就抽好了**。兩個選擇：
   - **保守**：失敗就整條魚跑掉（`pending` 丟棄不記錄），成功照舊。改動最小。
   - **激進**：把 `rollCatch()` 延後到小遊戲結束再抽。但這樣聲納提示（`showHint`）就沒東西可劇透，要一併改掉。
3. 自動模式必須能跳過小遊戲（自動判定成功，或用固定成功率）。

📝 **要更新**：[04 釣魚循環](04-fishing-loop.md) 整段狀態機、[05 自動模式](05-auto-mode.md)、[03 經濟](03-economy.md)（若改了抽獎時機）。

---

## 除錯常用 snippet

> 這裡大半的事情[開發者面板](14-devtools.md)都能點一點做完（**連點家園分頁鈕 10 下**打開）：必出稀有度／必出魚種／必出閃光、直接播 cut-in、給籌碼餌料、圖鑑全開、看 `bonus()` 的實際數值。
> 面板的「必出」是包住 `rarityTable()` 做的，**體長／價值／圖鑑判定全部還是跑真正的公式**，比下面那段直接改 `rollCatch` 回傳值的 snippet 可信。下面留著是給「面板沒涵蓋到」的情況。

```js
// 給錢
FG.state.addChips(1000000)

// 直接看某條魚的精靈（4 倍）
document.body.appendChild(FG.px.spriteEl(FG.fishById('ml_king_onde'), 4))

// 一次看完所有魚
FG.LOCATIONS.flatMap(l => l.fish).forEach(f => {
  const c = FG.px.spriteEl(f, 2); c.title = f.name; document.body.appendChild(c);
})

// 強制下一竿釣到指定的魚（粗暴版；正式測試請用開發者面板，它算出來的數值是真的）
const _orig = FG.state.rollCatch.bind(FG.state);
FG.state.rollCatch = loc => Object.assign(_orig(loc), { fishId: 'ml_king_onde', rarity: 'king', isNew: true });

// 直接播某位魚王的 cut-in（不用真的釣到）
FG.go('fishing');
{ const f = FG.fishById('wr_king_jormungandr');
  FG.cutin.play(FG.screenFishing.el.querySelector('#stageWrap'), f, { fishId: f.id }, FG.cutin.plan(f)); }

// 打開開發者面板（等同連點家園鈕 10 下）
FG.dev.open()

// 看目前的實際機率
console.table(FG.state.rarityTable().map(r => ({ 稀有度: r.rarity.name, 機率: (r.pct*100).toFixed(2)+'%' })))

// 重置存檔
FG.state.reset(); localStorage.removeItem('fg_seen_intro'); location.reload();
```
