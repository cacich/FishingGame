# 06 · 像素引擎

> 涵蓋：`js/pixel.js`（1050 行，全專案最大的檔案）
> 相關：[07 資料規格](07-data-schema.md)（魚的欄位）、[09 操作手冊](09-recipes.md)

**專案裡沒有任何圖片檔。** 所有美術都是 canvas 在低解析度上逐像素畫出來，再交給 CSS `image-rendering: pixelated` 整數放大。這是整個專案最核心的技術決策——加內容的成本因此接近零。

## 三種產圖方式

| 方式 | 用途 | 入口 |
|---|---|---|
| **字元圖**（char map） | 固定造型的小物：介面圖示、雜物、人物、水豚、裝備／裝飾圖示 | `px.drawMap()` |
| **程序化生成** | 魚：由參數算出輪廓與上色 | `px.sprite()` → `buildFish()` |
| **參數化繪製** | 場景：釣點風景、家園房間、地點縮圖 | `px.drawScene()` / `drawRoom()` / `locThumb()` |

## 基礎工具

```js
px.make(w, h)                          // 建立 canvas，關掉 smoothing
px.drawMap(ctx, map, pal, ox, oy, s)   // 畫字元圖
px.mapSize(map)                        // 回 { w, h }
px.hashStr(s)                          // FNV-1a，把 id 轉成穩定的數字種子
```

---

## 一 · 字元圖

用字串陣列描述圖案，一個字元一像素，配一張 `{ 字元: 色碼 }` 調色盤。**點（`.`）或不在調色盤裡的字元 = 透明**。

```js
const HEART = {
  pal: { r: '#e2555f', l: '#f18c93' },
  map: [
    '.rr.rr.',
    'rlrrrrr',
    'rrrrrrr',
    '.rrrrr.',
    '..rrr..',
    '...r...'
  ]
};
px.drawMap(ctx, HEART.map, HEART.pal, x, y, 1);
```

### 字元圖清單與所在檔案

| 常數 | 檔案 | 尺寸 | 用途 |
|---|---|---|---|
| `ICONS` | pixel.js | 12×12 / 10×10 | `fish` `calendar` `house` `bag` `book` `coin` — 底部導覽與頂部籌碼圖示 |
| `JUNK_MAPS` | pixel.js | ~12×16 | `boot` `can` `weed` `bottle` — 雜物 |
| `ANGLER` | pixel.js | 11×14 | 船上的釣手 |
| `CAPY` | pixel.js | 16×10 | 水豚（船上＋家園各一份） |
| `HEART` | pixel.js | 7×6 | 水豚頭上的愛心 |
| `EQUIP_ART` | **screen-shop.js** | 16×9 | 五件裝備的圖示 |
| `DECO_ART` | **screen-home.js** | 16×8 | 六種裝飾的圖示 |

> 裝備／裝飾圖示放在各自的分頁檔而不是 pixel.js，因為它們純粹是那個分頁的 UI 素材。加新裝備要記得**同時**加資料（data.js）和圖示（screen-shop.js）。

`px.icon(name, scale, color, accent)` 會回傳放大好的 canvas，`X` 是主色、`a` 是輔色。

---

## 二 · 程序化魚類生成

`buildFish(f)` 是全檔最複雜的函式。輸入一筆魚的資料定義，輸出一張面向右的像素精靈。

### 畫布規格

```js
SPR_W = 96, SPR_H = 56, MARGIN = 4     // 所有魚共用同一張畫布尺寸
usableW = 96 - 8 = 88
```

**所有魚都畫在同尺寸畫布上**，體型差異靠 `scale` 參數控制佔比。這樣圖鑑格子、結果卡、魚缸裡並排時，大魚看起來就是比較大隻，不需要額外處理縮放。

```js
sc = min(f.scale, 0.98 / (S.bodyLen + S.tailLen))   // 夾住，避免撐出畫面
```

### 體型輪廓表 · `SHAPES`

| shape | bodyLen | bodyH | gamma | e | tailLen | tailH | fork | 典型用途 |
|---|---|---|---|---|---|---|---|---|
| `normal` | .50 | .46 | 1.15 | .50 | .18 | .80 | .45 | 一般魚（鯉、鱸） |
| `long` | .62 | .24 | 1.05 | .58 | .14 | .52 | .30 | 細長（鰻、梭子魚、白鮭） |
| `round` | .40 | .62 | 1.20 | .42 | .16 | .58 | .40 | 圓胖（鯽） |
| `flat` | .42 | .70 | 1.24 | .44 | .15 | .70 | .48 | 側扁高身（鯛、太陽魚） |
| `wide` | .56 | .52 | 1.10 | .48 | .18 | .86 | .45 | 壯碩（鮪、鱘、鯰） |
| `ray` | .46 | .80 | 1.00 | .30 | .36 | .03 | .00 | 魟（圓盤＋細長尾） |

各欄位都是**比例值**：長度類乘 `usableW`，高度類乘 `(SPR_H/2 - MARGIN) = 24`。

### 輪廓數學

身體是一條「半高剖面曲線」沿 x 軸掃出來的：

```js
function profile(t) {          // t: 0 = 尾根, 1 = 吻端
  tt = t ^ gamma                            // gamma 控制最寬處的位置
  s  = 1 - (2·tt - 1)²                      // 標準橢圓
  h  = halfMax · s ^ e                      // e < 0.5 → 比橢圓更飽滿
  return max(h, 1.2)   // 內部保底 1.2px，避免頭尾細到消失
}
```

- **`gamma > 1` 把最寬處往頭部推**。`gamma=1.15` 時最寬處落在 t≈0.55，符合真實魚的比例。
- **`e` 控制飽滿度**。0.5 是正橢圓，越小越接近矩形（圓胖的魚用小 e）。

尾鰭是獨立的一段，從尾根（細）往尾端（寬）張開，並在尖端挖掉一個楔形做出分叉（`fork` 控制深淺）。背鰭／臀鰭／胸鰭都用 `sin` 曲線在身體輪廓外加高度。

### 圖層優先權

用一個 `Uint8Array(W*H)` 記錄每個像素屬於什麼，數字大的覆蓋小的：

```
0 = 空 | 1 = 鰭 | 2 = 尾 | 3 = 身體
```

繪製順序：鰭 → 尾 → 身體（身體優先權最高，自然蓋住鰭根）。

### 上色

對每個身體像素算縱向位置 `v = (y - 上緣) / (2 · 半高)`，做出**反蔭蔽**（背深腹淺，真實魚的保護色）：

```
v < 0.24  → back（背色）
v < 0.40  → mix(back, body, 0.55)
v < 0.74  → body（主色）
其餘       → belly（腹色）
```

`colors` 只有 `body` 是必填，其餘會自動推導（`back = shade(body, -0.32)`、`belly = shade(body, +0.42)` 等）。想要精準控制再明寫。

### 花紋 · `pattern`

| 值 | 效果 |
|---|---|
| `none` / 省略 | 只有反蔭蔽 |
| `stripe` | 垂直條紋（每 8px 畫 2px） |
| `band` | 一條側線橫帶（v≈0.46） |
| `band2` | 兩條橫帶（v≈0.40 與 0.62） |
| `spot` | 隨機斑點，位置由 `FG.seeded(hash(id))` 決定 → **同一條魚每次生成都一樣** |
| `speck` | 細碎點狀，用 `(x·7 + y·13) % 11` 的確定性雜訊 |
| `net` | 網格 |
| `scale` | 鱗片交錯紋 |

### 特殊特徵 · `special[]`

| 值 | 效果 |
|---|---|
| `glow` | 描邊外圍畫一圈半透明光暈（用 `colors.glow`） |
| `spike` | 背部鋸齒狀硬棘 |
| `whisker` | 嘴部往前的兩條鬍鬚（鯰魚、龍魚） |
| `scar` | 身側一道淺色傷疤 |
| `horn` | 頭頂小角（用 `colors.hornColor`） |

### 描邊

全部畫完後掃一次，把「空的、但四鄰有實心像素」的位置塗成 `shade(back, -0.55)`。這是 4 鄰域膨脹，所以精靈實際會比輪廓大 1px——`MARGIN = 4` 就是留給它的。

### 快取

```js
px.sprite(f)   // fishCache[f.id]，第一次生成後永久快取
```

> ⚠️ **快取的 key 只有 `f.id`。** 改了某條魚的顏色／體型後，同一個 session 內不會重繪，必須重新整理頁面。除錯時很容易被騙。見 [11 地雷](11-invariants-and-gotchas.md#3-精靈快取)。

### 對外 API

```js
px.sprite(f)                                  // → 1:1 的 canvas（有快取）
px.spriteEl(f, scale)                         // → 放大好的 canvas，直接塞 DOM
px.drawSprite(ctx, f, x, y, scale, flip)      // 畫到任意 ctx，以 (x,y) 為中心，flip 水平翻轉
```

雜物（有 `junkArt` 欄位）走 `buildJunk()`，把字元圖置中放進同樣 96×56 的畫布，這樣圖鑑和結果卡不用分兩種排版。

---

## 三 · 釣點場景

`px.drawScene(g, loc, st)`，畫布 **200×340**。

### 分層

```
靜態（有快取，buildBackground → bgCache[loc.id]）
  ├ 天空漸層（loc.scene.sky 陣列逐段內插）
  ├ 遠山稜線（隨機遊走的一維雜訊）
  ├ 三層樹林（遠／中／近，各自密度與顏色，秋葉只染樹冠上緣 34%）
  ├ 岸線
  ├ 水面底色（waterTop → waterBot 分 5 段）
  ├ 樹林倒影（把地平線以上 48 列取出、只留較暗的像素、加抖動、疊回水面）
  └ 深水區塊（waterDeep 疊 35% 透明度）

逐幀
  ├ drawSparkle()   水面反光橫線（190 條，位置由 seed 固定，隨時間左右漂移）
  ├ drawBoat()      船身／釣手／水豚／愛心／船外機／倒影（整組隨 sin 上下晃動）
  ├ drawRodAndLine()
  ├ drawFloat()     浮標（依 floatSink 下沉）
  ├ 漣漪（st.ripple）
  └ 躍出水面的魚（st.jump）
```

**背景一定要快取**：樹林要畫 230 棵、倒影要跑 `getImageData`，每幀重算會掉幀。`bgCache` 以 `loc.id` 為 key。改了 `loc.scene` 的顏色後**必須重新整理**才看得到（同 [精靈快取](#快取) 的問題）。

### 為什麼倒影用 getImageData

一開始想直接重畫一次樹林，但要對齊很麻煩。改成把已經畫好的地平線上方逐列取出、判斷亮度（`lum > 150` 就丟棄，只留暗色樹影）、乘上偏藍的係數、加水平抖動後疊回去。這樣**倒影自動跟樹林一致**，改樹的顏色倒影會跟著變。

### 場景調色盤欄位

見 [07 資料規格 §scene](07-data-schema.md#scene-調色盤)。

---

## 四 · 家園房間

`px.drawRoom(g, st)`，畫布 **200×150**，**回傳 `{ tank: {x, y, w, h} }`** 讓呼叫端知道魚缸的範圍。

```js
st = { time, tankLevel, deco, poster }
```

- 牆（直條紋壁紙）、地板（木紋）、窗戶（看得到湖景）
- **掛畫**：`st.poster` 是一張 canvas，由 `screen-home.js` 用 `px.locThumb(loc, 60, 40)` 產生並快取（`_posterLoc` 記錄目前是哪個釣點）
- **魚缸**：尺寸隨 `tankLevel` 成長（`76 + (lv-1)*12` 寬、`52 + (lv-1)*5` 高），內含水色漸層、光紋、底砂、會搖擺的水草、玻璃外框
- 裝飾：`rug` `plant` `trophy` `cat` `neon` `lamp`，各自是一段 `if (deco.xxx)` 的繪製碼
- 睡覺的水豚＋呼吸泡泡

魚缸裡游動的魚**不在 `drawRoom` 裡畫**，是 `screen-home.js › frame()` 拿到回傳的 `tank` 矩形後，自己 clip 並用 `px.drawSprite()` 畫上去。游動狀態存在 `S.swimmers[uid]`，每幀更新 x 位置、碰到邊界轉向，y 加 sin 擺動。

新增裝飾要動兩處：`drawRoom()` 加繪製碼、`screen-home.js › DECO_ART` 加圖示，外加 `data.js › FG.DECOS` 加資料。

---

## 五 · 地點縮圖

`px.locThumb(loc, w, h)` — 簡化版場景（天空漸層＋樹林剪影＋水面反光），任意尺寸。用在釣點選單、每日分頁的釣點卡、家園牆上的掛畫。**沒有快取**，呼叫端要自己存起來（家園就是這樣做的）。
