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
  seed:        20250803,           // 場景亂數種子。固定值 = 樹林與反光每次長一樣
  castCost:    400,                // 單次拋竿基礎費用（未計 costMul）
  unlock:      { free: true } | { chips: 120000 },
  comingSoon:  false,              // true → 選單顯示「即將開放」，不可進入也不可解鎖
  scene:       { ...調色盤... },
  fish:        [ ...魚陣列... ]
}
```

查詢用 `FG.locById(id)`（查不到回第一個地點，不會 throw）。

### `scene` 調色盤

| 欄位 | 型別 | 說明 |
|---|---|---|
| `horizon` | 0～1 | 地平線在畫布高度的比例。0.30 = 天空佔上方 30% |
| `sky` | 色碼陣列 | 由上而下的漸層停駐點，**至少 2 個**，會逐列內插 |
| `hill` | 色碼 | 遠山剪影。省略則不畫 |
| `farTree` `midTree` `nearTree` | 色碼 | 三層樹林，由遠而近 |
| `accent` | 色碼陣列 | 樹冠上緣的點綴色（秋葉），15% 機率套用 |
| `accent2` | 色碼陣列 | 近景樹林專用點綴，省略則沿用 `accent` |
| `shore` | 色碼 | 岸線。省略則由 `nearTree` 推導 |
| `waterTop` `waterBot` | 色碼 | 水面由遠而近的漸層 |
| `waterDeep` | 色碼 | 中央深水區塊，以 35% 透明度疊上 |
| `highlight` `highlight2` | 色碼 | 水面反光橫線的兩種顏色 |
| `boat` `boatRim` `boatDark` | 色碼 | 船身三段色（主體／上緣／陰影） |

配色訣竅：`waterTop` 要比 `waterBot` 暗（遠處水面反射天空較深），否則景深會反過來。

---

## 魚 · `location.fish[]`

### 一般魚

```js
{
  id:      'ml_bass',      // 唯一！同時是圖鑑 key 與精靈快取 key
  name:    '黑鱸',
  rarity:  'good',         // junk|common|good|rare|epic|legend|king
  shape:   'normal',       // normal|long|round|flat|wide|ray
  scale:   0.9,            // 在精靈框中的佔比，魚王建議 1.25～1.35
  pattern: 'band',         // none|stripe|band|band2|spot|speck|net|scale
  special: ['glow'],       // 選用：glow|spike|whisker|scar|horn
  cyOffset: 1,             // 選用：垂直微調（像素）
  value:   330,            // 基礎估價（實際售價依體長平方縮放）
  minLen:  25, maxLen: 50, // 體長範圍（cm）
  colors:  { body, back, belly, fin, pattern, glow, hornColor, eyeWhite, pupil },
  desc:    '一句描述',
  legend:  '長篇傳說文字'    // 選用。有的話結果卡與圖鑑會用琥珀色框強調
}
```

**只有 `colors.body` 是必填**，其餘會自動由它推導（見 [06 §上色](06-pixel-engine.md#上色)）。

`id` 命名慣例：釣點前綴 + 底線 + 名稱（`ml_` = mist_lake、`fj_` = sunset_fjord）。**id 一旦上線就不要改**，改了等於玩家的圖鑑紀錄消失。

### 雜物

```js
{
  id: 'ml_boot', name: '破舊長靴', rarity: 'junk',
  junkArt: 'boot',      // boot | can | weed | bottle（對應 pixel.js › JUNK_MAPS）
  value: 12, minLen: 20, maxLen: 34,
  unit: 'cm',           // 目前未使用，保留欄位
  desc: '…'
}
```

有 `junkArt` 的項目會走 `buildJunk()`，**不吃 shape/colors/pattern**，也不列入圖鑑分母、不會被閃光、不套 `valueMul`。

查詢用 `FG.fishById(id)`，會掃過所有地點。

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
