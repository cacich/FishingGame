# 12 · 名詞表

> 中英對照與 key 值速查。寫程式碼用英文 key，寫 UI 用中文。

## 稀有度

| key | UI 名稱 | order | 色碼 |
|---|---|---|---|
| `junk` | 雜物 | 0 | `#8b8f96` |
| `common` | 普通 | 1 | `#c8d3dd` |
| `good` | 優良 | 2 | `#5fd08a` |
| `rare` | 稀有 | 3 | `#59a6ff` |
| `epic` | 史詩 | 4 | `#b775ff` |
| `legend` | 傳說 | 5 | `#ffc44d` |
| `king` | 魚王 | 6 | `#ff5f6d` |

## 核心概念

| 詞 | 意義 |
|---|---|
| **漁獲實例** catch instance | `rollCatch()` 產出的單條魚，帶體長／重量／價值／閃光等個體資料。存在 `data.tank[]` 裡。跟「魚種定義」（`data.js` 的靜態資料）是兩回事 |
| **魚種定義** fish def | `LOCATIONS[].fish[]` 裡的一筆，描述一個物種 |
| **圖鑑** codex | `data.codex`，fishId → 捕獲次數／最大體長／首次時間 |
| **魚缸** tank | 家園的收藏展示，`data.tank[]`，有容量上限 |
| **魚王** king | 每個釣點一位，最高稀有度，有專屬傳說文字與特殊外型 |
| **閃光** shiny | 3% 機率的個體變異，價值 ×3，名稱前加 `✦` |
| **費率表** rate table | 玩家可見的中獎機率，來自 `rarityTable()` |
| **精靈** sprite | 程序化生成的像素圖，`px.sprite(f)` |
| **字元圖** char map | 用字串陣列描述的固定像素圖案 |
| **場景** scene | 釣點風景，200×340 canvas |
| **房間** room | 家園，200×150 canvas |

## 加成參數

| key | 意義 | 來源 |
|---|---|---|
| `rareMul` | 稀有度權重倍率（rare 以上） | 釣竿／裝備／裝飾／餌料 |
| `kingMul` | 魚王權重倍率（**只影響 king**） | 釣竿／餌料 |
| `junkMul` | 雜物權重倍率 | 餌料 |
| `valueMul` | 售價倍率 | 裝備／裝飾／餌料 |
| `costMul` | 拋竿費用倍率 | 裝備 |
| `sizeBonus` | 體型加成（加法累計） | 釣竿／裝備 |
| `showHint` | 咬鉤前顯示稀有度提示 | 裝備（聲納） |
| `M` | `bonus(loc).rareMul × bait().rareMul`，`rarityTable()` 內的區域變數 | — |
| `K` | `bonus(loc).kingMul × bait().kingMul` | — |
| `effect.loc` | **釣點專屬裝備**：只在該 id 的釣點生效，其他釣點完全不計 | 裝備 |
| `rod.loc` / `bait.loc` | 只是**主題標籤**（商店顯示「○○主題」），竿與餌在哪都能用 | 釣竿／餌料 |

## 魚的美術參數

| 欄位 | 可用值 |
|---|---|
| `shape` | 一般：`normal` `long` `round` `flat` `wide` `ray`／魚王專屬：`catfish` `tuna` `dragon` `pike` `abyss` `paddle` `serpent` `lungfish` `koi` `skipper` `leaper` `coelacanth` `clinger` `wrasse` `olm` `octopus` |
| `pattern` | `none` `stripe` `band` `band2` `spot` `speck` `net` `scale` |
| `special[]` | `glow` `spike` `whisker` `scar` `horn` `jaw` `lantern` `finlet` `mane` `frost` `rostrum` `forkTongue` `filaments` `stalkEye` `kype` `lobeFin` `sucker` `hump` `gills` `limbs` `blind` `arms` `slitEye` |
| `junkArt` | `boot` `can` `weed` `bottle` `ice` `bone` `ema` `porcelain` `shield` `ostracon` `coins` `shell` `flask` `brimstone` `driftwood` `coralfrag` `dripstone` `porthole` |
| `scene.terrain` | `forest` `pond` `cliff` `shrine` `tidal` `ice` `waterfall` `karst` `caldera` `night` `yggdrasil` `desert` `rapids` `reef` `cavern` `wreck` |
| `colors` | `body`(必填) `back` `belly` `fin` `pattern` `glow` `hornColor` `scar` `tooth` `frost` `lantern` `mane` `rostrum` `tongue` `filament` `kype` `lobe` `eyeWhite` `pupil` |

會觸發 `headRoom`（吻端前方預留空間）的 special：`whisker`(12px)、`forkTongue`(12px)、`kype`(10px)、`rostrum`(24px)。**`arms` 不在裡面**——腕往尾側長，那張表只管吻端前方。

## 狀態機階段

| phase | 意義 |
|---|---|
| `idle` | 待機 |
| `cast` | 浮標飛出 |
| `wait` | 等待魚訊 |
| `bite` | 咬鉤 |
| `cutin` | 登場演出（**只有傳說以上才有這一段**） |
| `reel` | 收線（魚躍出水面） |

## cut-in

| key | 值 |
|---|---|
| `kind` | `legend`（1250ms）／`king`（2100ms） |
| `motif` | `legend`／魚王四選一：`emerge` `charge` `spiral` `reveal` |
| `particle` | 粒子動線：`up` 上浮／`burst` 四散／`drift` 橫流 |

十六位魚王的分配表在 [04 §cut-in](04-fishing-loop.md#cut-in--傳說以上的登場演出)（四種 `motif` 目前是 emerge 5／charge 3／spiral 4／reveal 4）。

## 事件名

`chips` `gear` `loc` `codex` `tank` `daily` `all`

## 商店回傳狀態碼

| 值 | 意義 |
|---|---|
| `'ok'` | 成功 |
| `'poor'` | 籌碼不足 |
| `'owned'` | 已擁有 |
| `'max'` | 已達上限（魚缸等級） |
| `'soon'` | 尚未開放（釣點） |

## 自動模式

| key | 值 |
|---|---|
| `sellMode` | **收藏門檻**：`all` 全賣／`keep` 全收／`good` `rare` `epic` `legend` `king` 該階以上收藏 |
| `stopRarity` | `none` `rare` `epic` `legend` `king` |
| `speed` | `1` 正常／`2` 兩倍／`4` 極速 |

## 命名慣例

| 前綴 | 用於 |
|---|---|
| `ml_` | 晨霧湖的魚 |
| `gp_` | 澄澈方池的魚 |
| `fj_` | 落霞峽灣的魚 |
| `sk_` | 宵櫻神域的魚 |
| `tf_` | 潮落礁灘的魚 |
| `fr_` | 幽藍冰湖的魚 |
| `fp_` | 懸瀑深潭的魚 |
| `lr_` | 煙雨蓮江的魚 |
| `cd_` | 硫煙湯湖的魚 |
| `ab_` | 深淵海溝的魚 |
| `wr_` | 世界樹根的魚 |
| `du_` | 黃沙冥河的魚 |
| `rp_` | 亂石急湍的魚 |
| `cr_` | 琉璃珊瑚的魚 |
| `cv_` | 鐘乳暗穴的魚 |
| `dp_` | 曉日沉港的魚 |
| `rod_` `bait_` `eq_` | 釣竿／餌料／裝備 |
| `FG.screenXxx` | 分頁模組 |
| `px.` | `FG.px` 像素引擎命名空間 |
