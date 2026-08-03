# 10 · 平衡調參

> 涵蓋：所有數值旋鈕在哪、怎麼驗證改動、目前的基準數據
> 相關：[03 經濟與抽獎](03-economy.md)（先讀懂公式再來調）

## 旋鈕總覽 · 「我想改 X 要動哪裡」

| 想達成的效果 | 動這裡 | 副作用 |
|---|---|---|
| 整體賺錢速度變快／慢 | `data.js` 各魚的 `value` | 等比縮放，最單純 |
| 拋竿門檻變高／低 | `LOCATIONS[].castCost` | 直接改變倍率分母 |
| 某階級更常出現 | `FG.RARITY[x].weight` | **會稀釋其他所有階級** |
| 裝備加成的天花板 | `RODS[].rareMul`、`EQUIPS[].effect` | 影響後期倍率 |
| 魚王稀有度 | `RODS[].kingMul`、`BAITS[].kingMul`、`RARITY.king.weight` | 只影響魚王 |
| 高階裝備的邊際效益 | `state.js › rarityTable()` 的指數 `0.85` / `0.70` | 影響 epic/legend 對裝備的敏感度 |
| 大魚出現頻率 | `rollCatch()` 的 `FG.skewed(2.4)` | 數字越大越偏小魚 |
| 大魚的價值溢價 | `rollCatch()` 的 `Math.pow(len/avg, 2.0)` | 指數越大，大物越值錢 |
| 閃光機率／倍率 | `rollCatch()` 的 `0.03` 與 `*= 3` | 純變異度，不影響期望值太多 |
| 魚缸／裝飾／解鎖價格 | `TANK_LEVELS[].price`、`DECOS[].price`、`LOCATIONS[].unlock.chips` | 籌碼的消耗池 |
| 每日收入 | `FG.SIGNIN`、`FG.MISSIONS[].reward` | 保底收入，影響新手體驗 |

## 設計目標

| 指標 | 目標值 | 理由 |
|---|---|---|
| 新手產出/成本 | **×1.2 左右** | 穩定前進但感覺得到成本壓力，才有博弈的緊張感 |
| 後期產出/成本 | **×2.0 上下** | 升級要有回報，但不能變成印鈔機 |
| 魚王機率成長 | **0.2% → 0.9%（約 4～5 倍）** | 感覺得到裝備差異，又維持稀有感 |
| 單場自動 50 局 | 淨損益應該**大多為正、偶爾為負** | 有變異才有賭性 |

**倍率不是重點，魚王與圖鑑才是。** 如果調到後期倍率很高，玩家就沒有理由繼續追魚王了。魚王秘餌刻意設計成「貴到把倍率吃掉」，用它是為了機率翻倍，不是為了賺錢。

## 模擬腳本

改完數值**一定要跑這個驗證**。在遊戲頁面的 console 貼上執行（會暫時改動存檔中的裝備，最後會還原）：

```js
(function(){
  function sim(label, rod, baitId, equips, locId){
    const bak = { rod: FG.state.data.rod, bait: FG.state.data.bait, eq: FG.state.data.equips };
    FG.state.data.rod = rod; FG.state.data.bait = baitId; FG.state.data.equips = equips;
    const loc = FG.locById(locId || 'mist_lake');
    const n = 30000; let sum = 0; const cnt = {};
    for (let i = 0; i < n; i++) { const c = FG.state.rollCatch(loc); sum += c.value; cnt[c.rarity] = (cnt[c.rarity]||0)+1; }
    const bait = FG.findById(FG.BAITS, baitId);
    const cost = FG.state.castCost(loc) + bait.price;
    const d = {}; for (const k in cnt) d[k] = (cnt[k]/n*100).toFixed(2);
    Object.assign(FG.state.data, { rod: bak.rod, bait: bak.bait, equips: bak.eq });
    return label + ' | EV=' + Math.round(sum/n) + ' 成本=' + cost +
      ' 倍率=' + (sum/n/cost).toFixed(2) +
      ' | king=' + (d.king||0) + '% legend=' + (d.legend||0) +
      '% epic=' + (d.epic||0) + '% rare=' + (d.rare||0) + '%';
  }
  const r = [];
  r.push(sim('新手  ', 'rod_bamboo',  'bait_bread',  []));
  r.push(sim('中期  ', 'rod_carbon',  'bait_shrimp', ['eq_hat','eq_basket']));
  r.push(sim('後期  ', 'rod_mithril', 'bait_lure',   ['eq_hat','eq_vest','eq_basket','eq_clover']));
  r.push(sim('滿裝  ', 'rod_dragon',  'bait_king',   ['eq_hat','eq_vest','eq_basket','eq_clover','eq_sonar']));
  r.push(sim('峽灣滿', 'rod_dragon',  'bait_king',   ['eq_hat','eq_vest','eq_basket','eq_clover','eq_sonar'], 'sunset_fjord'));
  FG.state.save();
  console.log(r.join('\n'));
})()
```

**注意**：`sim()` 的成本只算「拋竿費 + 一份餌料」，沒有計入家園裝飾的 `valueMul`（因為模擬時讀的是玩家當下的存檔）。要比較純裝備效果，先確保存檔沒買裝飾，或把 `deco` 暫時清空。

## 目前基準（2026-08-03）

| 配置 | EV | 成本 | 倍率 | king | legend | epic | rare |
|---|---|---|---|---|---|---|---|
| 竹竿＋麵包屑 | 510 | 425 | **×1.20** | 0.20% | 0.85% | 2.91% | 8.67% |
| 碳纖竿＋活蝦＋帽/簍 | 1,084 | 600 | **×1.81** | 0.27% | 1.33% | 4.93% | 16.57% |
| 秘銀竿＋假餌＋4 裝備 | 1,441 | 720 | **×2.00** | 0.35% | 1.54% | 6.74% | 24.10% |
| 龍骨竿＋魚王秘餌＋全裝備 | 2,385 | 1,240 | **×1.92** | 0.93% | 1.82% | 8.18% | 31.32% |
| 同上 · 落霞峽灣 | 4,088 | 1,835 | **×2.23** | 0.83% | 1.76% | 8.46% | 31.38% |

> **改了任何數值，重跑模擬並更新這張表。** 這是這頁存在的意義——沒有更新的基準表比沒有表更糟。

## 調參歷史與教訓

### 稀有度倍率的疊乘失控（已修正）

初版：`rare` 以上全部乘 `M`，`king` 再額外乘 `K`。
問題：滿裝時 `M ≈ 4.7`、`K ≈ 6`，`king` 權重被放大 **70 倍**，機率飆到 6.8%。魚王變成常態，追逐感消失。
修正：改成 epic `M^0.85`、legend `M^0.70`、**king 只吃 K 完全不吃 M**，同時把 `rod_dragon` 的 rareMul 2.2→1.8、kingMul 2.5→2.0，`bait_king` 的 rareMul 2.3→1.9、kingMul 4→3。
教訓：**多個 1.2～2.5 的倍率連乘會爆炸**。任何新增的加成來源都要重跑模擬。

### 初版產出過高（已修正）

初版魚的 `value` 偏高、`castCost` 偏低，新手倍率高達 ×6。修正方式是同時降 `value`、升 `castCost` 到 400。
教訓：**先定 `castCost`，再回推 `value`**，比反過來好調。

### 魚王秘餌定價（已修正）

初版 1,800/份，導致滿裝倍率只有 ×1.03，玩家用它純虧。降到 900 後倍率回到 ×1.92，同時保留「比後期配置更貴、換取魚王機率翻倍」的取捨。

## 加新釣點的抓法

1. 先定 `castCost`。
2. 各階級的 `value` 抓：common ≈ castCost × 0.25、good ≈ ×0.5、rare ≈ ×2、epic ≈ ×8、legend ≈ ×22、king ≈ ×85。
3. `unlock.chips` ≈ `castCost × 100`（大約 100 竿的產出）。
4. 跑模擬，微調到倍率落在 1.2～2.3。
