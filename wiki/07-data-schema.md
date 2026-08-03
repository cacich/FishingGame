# 07 · 資料規格

> 涵蓋：`js/data.js` 全部資料表的欄位定義
> 相關：[09 操作手冊](09-recipes.md)（照步驟新增內容）、[06 像素引擎](06-pixel-engine.md)（美術欄位怎麼影響外觀）

`data.js` 是**純資料，沒有邏輯**。想加內容原則上只動這個檔（例外：裝備／裝飾的圖示在各自的分頁檔，見下）。

---

## 釣點 · `FG.LOCATIONS`

```js
{
  id:          'mist_lake',        // 唯一。存檔的 unlocked[] / data.loc 都存這個
  name:        '晨霧湖',
  subtitle:    '新手釣場 · 靜水',    // 卡片副標
  desc:        '一段介紹文字',        // 選單、圖鑑、解鎖確認框都會用
  seed:        20250803,           // 場景亂數種子。固定值 = 地形與反光每次長一樣
  castCost:    400,                // 單次拋竿基礎費用（未計 costMul）
  unlock:      { free: true } | { chips: 120000 },   // 目前五個釣點都是 free
  comingSoon:  false,              // true → 選單顯示「即將開放」，不可進入也不可解鎖
  scene:       { terrain: 'forest', ...調色盤... },
  fish:        [ ...魚陣列... ]
}
```

查詢用 `FG.locById(id)`（查不到回第一個地點，不會 throw）。

### 目前的五個釣點

| id | 名稱 | terrain | castCost | unlock | 魚種數（含雜物） | 圖鑑分母 | 前綴 |
|---|---|---|---|---|---|---|---|
| `mist_lake` | 晨霧湖 | `forest` | 400 | `free` | 24 | 21 | `ml_` |
| `sunset_fjord` | 落霞峽灣 | `cliff` | 1,100 | `free` | 24 | 21 | `fj_` |
| `sakura_shrine` | 宵櫻神域 | `shrine` | 1,800 | `free` | 23 | 20 | `sk_` |
| `frost_lake` | 幽藍冰湖 | `ice` | 3,000 | `free` | 23 | 20 | `fr_` |
| `abyss` | 深淵海溝 | `night` | 12,000 | `free` | 23 | 20 | `ab_` |

「圖鑑分母」是 `codexProgress()` 算出來的數字，**雜物不列入**（見 [02 §圖鑑](02-state-and-save.md)）。五個釣點的圖鑑分母都刻意維持在 20 以上，讓每張圖鑑頁的收集進度條長度感覺一致。

**每個釣點都有專屬的 `terrain`**，不是只換調色盤——地形產生器與各自的設計理由見 [06 §地形系統](06-pixel-engine.md#三之二--地形系統--terrain)。

### 為什麼所有釣點都是免費的

**進程門檻由 `castCost` 承擔，不由解鎖費承擔。** 拋竿費從 400 一路到 12,000（30 倍），開局 20,000 籌碼在深淵只夠拋一竿，光是這點就足以讓玩家自然待在負擔得起的釣點。再疊一層一次性解鎖費只是多一道「存錢等待」的空轉，不會讓決策變有趣。

這樣設計還有兩個好處：新玩家可以馬上進去看看深淵長什麼樣（內容是這個遊戲的賣點，沒理由藏起來）；而且「今天想拚魚王就去深淵、想穩穩賺就回晨霧湖」變成一個**每一竿都能重做的選擇**，而不是一次性的解鎖決定。

`unlock: { chips: N }` 的機制本身**沒有被移除**，`state.js › unlockLoc()`、`data.unlocked[]` 與兩處 UI 的解鎖按鈕都還在，把任何一個釣點改回 `{ chips: N }` 就會立刻恢復收費。

> ⚠️ **`isUnlocked()` 對 `unlock.free` 是直接回 true，不看 `data.unlocked[]`。** 所以改成免費不需要遷移舊存檔（舊存檔的 `unlocked` 仍然只有 `['mist_lake']`，但所有釣點都進得去），改回收費也不會讓已付費的玩家重付。

`comingSoon` 目前**沒有任何釣點在用**（五個都已開放），欄位保留給未來新增的預告釣點。相關的 `unlockLoc()` 回傳值 `'soon'` 與兩處 UI 的「即將開放」分支都還在，加新的預告釣點時可以直接沿用。

### `scene` 調色盤

| 欄位 | 型別 | 說明 |
|---|---|---|
| `horizon` | 0～1 | 地平線在畫布高度的比例。0.30 = 天空佔上方 30% |
| `sky` | 色碼陣列 | 由上而下的漸層停駐點，**至少 2 個**，會逐列內插 |
| `terrain` | key | **地形產生器**：`forest`（預設）`cliff` `shrine` `ice` `night`。見 [06 §地形系統](06-pixel-engine.md#三之二--地形系統--terrain) |
| `hill` | 色碼 | 遠山剪影（`forest` 的山稜、`shrine` 的錐形雪山）。省略則不畫 |
| `farTree` `midTree` `nearTree` | 色碼 | 三層樹林，由遠而近 |
| `accent` | 色碼陣列 | 樹冠上緣的點綴色（秋葉），15% 機率套用 |
| `accent2` | 色碼陣列 | 近景樹林專用點綴，省略則沿用 `accent` |
| `shore` | 色碼 | 岸線。省略則由 `nearTree` 推導 |
| `waterTop` `waterBot` | 色碼 | 水面由遠而近的漸層 |
| `waterDeep` | 色碼 | 中央深水區塊，以 35% 透明度疊上 |
| `highlight` `highlight2` | 色碼 | 水面反光橫線的兩種顏色 |
| `boat` `boatRim` `boatDark` | 色碼 | 船身三段色（主體／上緣／陰影） |

`farTree` / `midTree` / `nearTree` 是**由遠而近的三層剪影色**，名字沿用自最早的樹林實作；在其他地形裡它們分別代表崖壁層、冰川與冰脊、櫻花林等等。改名會動到五個釣點的資料，**目前刻意不改**——知道這件事就好。

地形專用色（只有對應的 terrain 會讀）：

| 欄位 | 用在 | 說明 |
|---|---|---|
| `snow` | `shrine` | 山頂積雪 |
| `pagoda` `pagodaRoof` | `shrine` | 五重塔的塔身與屋簷 |
| `torii` | `shrine` | 鳥居的朱色（倒影靠「R 通道明顯大於 B」把它挑出來，**別把它調成偏藍**） |
| `trunk` `stone` | `shrine` | 櫻花樹幹、石燈籠 |
| `floe` | `ice` | 水面浮冰 |
| `star` `plankton` | `night` | 星星、生物發光 |

配色訣竅：`waterTop` 要比 `waterBot` 暗（遠處水面反射天空較深），否則景深會反過來。

---

## 魚 · `location.fish[]`

### 一般魚

```js
{
  id:      'ml_bass',      // 唯一！同時是圖鑑 key 與精靈快取 key
  name:    '黑鱸',
  rarity:  'good',         // junk|common|good|rare|epic|legend|king
  shape:   'normal',       // normal|long|round|flat|wide|ray|catfish|tuna|dragon|pike|abyss
  scale:   0.9,            // 在精靈框中的佔比，魚王建議 1.25～1.35
  pattern: 'band',         // none|stripe|band|band2|spot|speck|net|scale
  special: ['glow'],       // 選用：glow|spike|whisker|scar|horn|jaw|lantern|finlet|mane|frost
  cyOffset: 1,             // 選用：垂直微調（像素）
  value:   330,            // 基礎估價（實際售價依體長平方縮放）
  minLen:  25, maxLen: 50, // 體長範圍（cm）
  colors:  { body, back, belly, fin, pattern, glow, hornColor,
             scar, tooth, frost, lantern, mane,      // 各 special 的專屬色，省略有預設值
             eyeWhite, pupil },
  desc:    '一句描述',
  legend:  '長篇傳說文字'    // 選用。有的話結果卡與圖鑑會用琥珀色框強調
}
```

**只有 `colors.body` 是必填**，其餘會自動由它推導（見 [06 §上色](06-pixel-engine.md#上色)）。

`id` 命名慣例：釣點前綴 + 底線 + 名稱（前綴對照見上方釣點表）。**id 一旦上線就不要改**，改了等於玩家的圖鑑紀錄消失。

### 一個釣點該放幾條魚

現行五個釣點都採同一套配額，**不是隨便長出來的**：

| 稀有度 | 每個釣點的魚種數 | 理由 |
|---|---|---|
| junk | 3 | 夠讓「又是垃圾」有點變化，又不會洗版 |
| common | 6 | 佔 52% 抽獎權重，是玩家看最多次的一階，種類最多 |
| good | 5 | 26% 權重 |
| rare | 4 | 9% 權重 |
| epic | 2～3 | 3% 權重。再多會讓單一種類的出現間隔長到沒有記憶點 |
| legend | 2 | 0.8% 權重。兩條剛好構成「還差一條」的收集張力 |
| king | 1 | **每個釣點固定一位**，是該釣點的招牌 |

### 五位魚王必須長得不一樣

魚王是招牌，玩家一輩子看不到幾次，所以**每一位都用專屬的 `shape` 與專屬的 `special` 組合**，不共用：

| 魚王 | 釣點 | shape | pattern | special | 一眼認出的特徵 |
|---|---|---|---|---|---|
| 霧語巨鯰「翁德」 | 晨霧湖 | `catfish` | `speck` | `glow` `whisker` `scar` | 寬扁大頭＋鬍鬚＋圓尾，背上一道疤 |
| 落日巨鮪「赫利歐」 | 落霞峽灣 | `tuna` | `band2` | `glow` `finlet` | 鎌狀高背鰭＋深叉月牙尾 |
| 淵之主「八尋」 | 宵櫻神域 | `dragon` | `scale` | `glow` `whisker` `horn` `mane` | 帶狀長身＋頭角＋背上飄動的鬃 |
| 霜牙巨狗魚「寇爾德」 | 幽藍冰湖 | `pike` | `spot` | `glow` `jaw` `frost` | 後半肥、背鰭極後＋獠牙＋體表霜晶 |
| 深淵之顎「尼克斯」 | 深淵海溝 | `abyss` | `net` | `glow` `jaw` `lantern` | 巨頭小尾＋獠牙＋頭頂發光燈籠 |

**`scar` 只給翁德。** 牠的傳說明寫「背上那道疤」，是角色設定；其他四位沒有這段故事，加了只會讓五條魚看起來像同一張貼圖換色。這是實際踩過的坑——初版五王全是 `shape: 'wide'` + `glow` + `scar`，只有配色不同，並排在圖鑑裡完全認不出是不同的魚。詳見 [11 §五王同型](11-invariants-and-gotchas.md)。

`glow` 是**唯一五王共用的 special**，它是「這條是魚王」的統一訊號，刻意保留。

**關鍵：階級內是等機率抽的（[03 §rollCatch](03-economy.md#抽一次漁獲--rollcatchloc)），所以往同一階級加魚不會改變該階級的總機率，只會稀釋單一魚種的出現率。** 高階級放太多種，玩家會覺得「傳說魚都湊不齊」；低階級放太少，又會重複到膩。上面的配額就是照這個取捨定的。

### 雜物

```js
{
  id: 'ml_boot', name: '破舊長靴', rarity: 'junk',
  junkArt: 'boot',      // boot | can | weed | bottle | ice | bone | ema（對應 pixel.js › JUNK_MAPS）
  value: 12, minLen: 20, maxLen: 34,
  unit: 'cm',           // 目前未使用，保留欄位
  desc: '…'
}
```

有 `junkArt` 的項目會走 `buildJunk()`，**不吃 shape/colors/pattern**，也不列入圖鑑分母、不會被閃光、不套 `valueMul`。

雜物美術可以跨釣點重複用（`weed` 同時當晨霧湖的水草、峽灣的廢棄漁網、冰湖的斷繩），**換的是 `name` 和 `desc`，不是圖**。這是刻意的：雜物是負面事件，玩家不會盯著看，投資新美術的邊際效益低——但每個釣點至少要有一件**專屬**的雜物來帶場景感（神域的 `ema`、冰湖的 `ice`、深淵的 `bone`）。

查詢用 `FG.fishById(id)`，會掃過所有地點。

### 各釣點的配色規則

魚的辨識度靠**釣點內的一致性**與**階級之間的對比**，不是靠每條魚各自好看：

| 釣點 | 底色調 | 對比手法 |
|---|---|---|
| 晨霧湖 | 灰藍／土黃的自然色 | 稀有以上開始出現紫、金、純白 |
| 宵櫻神域 | 朱紅 × 櫻粉 × 墨黑的和風三色 | 稀有以上多用金與朱；汽水域所以淡水鹹水魚種混編 |
| 落霞峽灣 | 藍綠海色，點綴橘金 | 傳說用大面積暖色（霞光魟、皇帶魚） |
| 幽藍冰湖 | **全部壓在藍白冷調** | 暖色（橘點、紫鰭）只給優良以上，玩家一眼認得出「這條不一樣」 |
| 深淵海溝 | **底色壓到接近黑** | 辨識度全靠 `special: ['glow']` 與冷光 `pattern`；沒有陽光的地方不會有保護色，所以幾乎每種都帶生物發光 |

深淵的魚幾乎全帶 `glow` 是**設計而非偷懶**：`buildFish()` 的反蔭蔽在極暗底色下幾乎看不出來，沒有光暈的話整格圖鑑會是一團黑。

---

## 釣竿 · `FG.RODS`

```js
{ id, name, price, rareMul, sizeBonus, kingMul, desc }
```

| id | 售價 | rareMul | sizeBonus | kingMul |
|---|---|---|---|---|
| `rod_bamboo` | 0（初始） | 1.00 | 0 | 1 |
| `rod_glass` | 2,400 | 1.15 | 0.05 | 1 |
| `rod_carbon` | 9,800 | 1.35 | 0.12 | 1.2 |
| `rod_mithril` | 42,000 | 1.55 | 0.22 | 1.5 |
| `rod_dragon` | 180,000 | 1.80 | 0.35 | 2.0 |

**陣列順序 = 圖示配色順序**（`screen-shop.js › rodIcon()` 用 index 取色），插隊會讓圖示錯位。

## 餌料 · `FG.BAITS`

```js
{ id, name, price, pack, rareMul, junkMul, valueMul, kingMul, desc }
```

`price` 是**單價**，`pack` 是一次購買的數量，所以商店按鈕顯示的金額是 `price × pack`。

| id | 單價 | 包量 | rareMul | junkMul | valueMul | kingMul |
|---|---|---|---|---|---|---|
| `bait_bread` | 25 | 10 | 1.00 | 1.00 | 1.00 | 1 |
| `bait_worm` | 70 | 10 | 1.18 | 0.70 | 1.00 | 1 |
| `bait_shrimp` | 200 | 10 | 1.45 | 0.40 | 1.10 | 1.2 |
| `bait_lure` | 380 | 10 | 1.70 | 0.15 | 1.10 | 1.4 |
| `bait_king` | 900 | 5 | 1.90 | 0.00 | 1.20 | 3.0 |

同樣**陣列順序 = 圖示配色**（`screen-fishing.js › baitIcon()`）。

## 裝備 · `FG.EQUIPS`

```js
{ id, name, price, effect: { ... }, desc }
```

`effect` 支援的 key：`rareMul` `valueMul` `costMul` `sizeBonus` `showHint`。
**買了就永久生效，沒有裝備欄位／上限概念**，全部效果相乘。

| id | 售價 | 效果 |
|---|---|---|
| `eq_hat` | 4,000 | `valueMul: 1.10` |
| `eq_vest` | 11,000 | `costMul: 0.85` |
| `eq_basket` | 7,000 | `sizeBonus: 0.08` |
| `eq_clover` | 22,000 | `rareMul: 1.20` |
| `eq_sonar` | 60,000 | `rareMul: 1.15` ＋ `showHint: true` |

> 新增裝備要**同時**在 `screen-shop.js › EQUIP_ART` 加一張 16×9 字元圖，否則圖示是空白。

---

## 家園

### 魚缸等級 · `FG.TANK_LEVELS`

```js
{ level, cap, price }   // price 是「升到這一級」要付的錢，level 1 為 0
```

| level | cap | price |
|---|---|---|
| 1 | 3 | 0 |
| 2 | 6 | 6,000 |
| 3 | 10 | 24,000 |
| 4 | 16 | 80,000 |
| 5 | 24 | 260,000 |

`upgradeTank()` 讀 `FG.TANK_LEVELS[data.tankLevel]`（**用等級當索引，不是 -1**，因為要拿的是「下一級」）。

### 裝飾 · `FG.DECOS`

```js
{ id, name, price, effect: { rareMul?, valueMul? }, desc }
```

| id | 售價 | 效果 |
|---|---|---|
| `rug` `plant` `neon` `lamp` | 3,500 / 5,000 / 12,000 / 8,000 | 純裝飾 |
| `trophy` | 18,000 | `rareMul: 1.05` |
| `cat` | 26,000 | `valueMul: 1.06` |

> 新增裝飾要動**三處**：`data.js › FG.DECOS`、`pixel.js › drawRoom()` 的繪製碼、`screen-home.js › DECO_ART` 的圖示。

---

## 籌碼包 · `FG.PACKS`

```js
{ id, name, chips, bonus, price, once?, extra?, note? }
```

- `price` 是**顯示用字串**（`'NT$30'`），沒有實際金流。
- `once: true` → 限購一次，用 `data.packsBought[id]` 判斷。
- `extra: { rod: 'rod_carbon', baits: { bait_shrimp: 20 } }` → 附贈物品。
- 按下去直接發放（`state.buyPack()`），彈窗頂部有明確的測試版警語。

**要接金流時，唯一要改的是 `main.js › openTopup()` 的按鈕 onClick**，把 `st.buyPack(p)` 換成付款流程的 callback。`buyPack()` 本身可以當成「付款成功後的發貨函式」直接沿用。

## 簽到 · `FG.SIGNIN`

七天循環：`{ day, chips, bait?: { id, n } }`。索引由 `signin.streak % 7` 決定。

## 每日任務 · `FG.MISSIONS`

```js
{ id, name, target, reward, track }
```

`track` 是進度計數的 key，必須跟 `state.js` 裡呼叫 `bumpMission()` 的字串對得上：

| track | 累加時機 |
|---|---|
| `casts` | `recordCatch()`（每次釣獲） |
| `sells` | `sell()` |
| `rares` | `recordCatch()`，稀有度 ≥ rare |
| `newCodex` | `recordCatch()`，`inst.isNew` |

新增任務若需要新的 track，要在 `state.js` 對應的地方補 `bumpMission('新track', 1)`。
