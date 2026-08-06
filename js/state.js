/* ============================================================
   state.js — 遊戲狀態、存檔、抽獎與經濟計算
   ============================================================ */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  // ver 2：改成固定 RTP 的下注制（bet 階梯 + Buffer 池），舊存檔的魚價與拋竿費
  // 全部失去意義，沒有合理的遷移路徑，所以直接跳版讓舊檔重置。
  const SAVE_KEY = 'fg_save_v1';
  const SAVE_VER = 2;

  // 閃光的期望倍率：0.97×1 + 0.03×3。雜物不吃閃光，所以套用時要排除。
  const SHINY_EV = 1.06;

  // Buffer 池的排空參數。
  // BOOST_MAX 是單竿目標 RTP 的上限增量（98% → 最高 108%），避免池很大時
  // 一竿就把賠付撐到誇張的倍數；DRAIN 決定排空節奏——池每竿排掉 1/DRAIN，
  // 是指數衰減，半衰期約 139 竿。兩個都調大會讓回吐更慢、更不容易被察覺。
  const BUFFER_BOOST_MAX = 0.10;
  const BUFFER_DRAIN = 200;

  const momCache = {};

  // 這條魚的 E[(len/avg)^2]。m 是 sizeMoments() 給的 { t, t2 }。
  function esize(f, m) {
    const min = f.minLen, range = f.maxLen - f.minLen, avg = (f.minLen + f.maxLen) / 2;
    return (min * min + 2 * min * range * m.t + range * range * m.t2) / (avg * avg);
  }

  function freshSave() {
    return {
      ver: SAVE_VER,
      chips: 20000,
      loc: 'mist_lake',
      bet: FG.BETS[0],    // 玩家選的下注額，會被釣點的 minBet 抬高（見 S.bet()）
      buffer: 0,          // Buffer 池餘額（籌碼）。商店消費 ×RTP 進池，再由 bufferBoost() 排空
      unlocked: ['mist_lake'],
      rods: ['rod_bamboo'],
      rod: 'rod_bamboo',
      baits: { bait_bread: 20, bait_worm: 5 },
      bait: 'bait_bread',
      equips: [],
      codex: {},          // fishId -> { n, maxLen, first }
      tank: [],           // 收藏中的魚（家園展示）
      tankLevel: 1,
      deco: {},           // decoId -> true
      packsBought: {},
      signin: { date: '', streak: 0 },
      daily: { date: '', prog: {}, claimed: {} },
      // wagered / payout / shopSpent 是 RTP 的分子分母，用來事後驗證實際 RTP
      // （wiki 03 §兩種 RTP 口徑）。簽到／任務／儲值的贈送刻意**不列入**，那是行銷成本。
      stats: { casts: 0, caught: 0, sold: 0, earned: 0, spent: 0, kings: 0,
               wagered: 0, payout: 0, shopSpent: 0 },
      // 自動釣魚設定（會記住上次的選擇）
      auto: {
        rounds: 50,          // 局數，0 = 無限
        // 收藏門檻：all=全賣 / keep=全收 / 其餘是稀有度 key（good|rare|epic|legend|king）＝該階以上收藏
        sellMode: 'rare',
        stopChips: 0,        // 籌碼低於此值就停，0 = 不限
        stopRarity: 'legend',// none / rare / epic / legend / king
        speed: 2,            // 1 正常 / 2 兩倍 / 4 極速
        autoBuyBait: true    // 餌料用完自動補貨
      },
      sfx: true
    };
  }

  const S = FG.state = {
    data: null,
    listeners: {},

    /* ---------- 生命週期 ---------- */
    init: function () {
      const raw = FG.store.load(SAVE_KEY, null);
      this.data = (raw && raw.ver === SAVE_VER) ? Object.assign(freshSave(), raw) : freshSave();
      FG.sfx.on = this.data.sfx !== false;
      this.rollDaily();
      this.save();
    },
    save: function () { FG.store.save(SAVE_KEY, this.data); },
    reset: function () { FG.store.clear(SAVE_KEY); this.data = freshSave(); this.save(); this.emit('all'); },

    /* ---------- 事件 ---------- */
    on: function (evt, fn) { (this.listeners[evt] = this.listeners[evt] || []).push(fn); },
    emit: function (evt, payload) {
      const a = this.listeners[evt] || [];
      for (let i = 0; i < a.length; i++) a[i](payload);
      if (evt !== 'all') { const b = this.listeners.all || []; for (let i = 0; i < b.length; i++) b[i](payload); }
    },

    /* ---------- 籌碼 ---------- */
    addChips: function (n) {
      this.data.chips += n;
      if (n > 0) this.data.stats.earned += n;
      this.save(); this.emit('chips');
    },
    canPay: function (n) { return this.data.chips >= n; },
    pay: function (n) {
      if (this.data.chips < n) return false;
      this.data.chips -= n;
      this.data.stats.spent += n;
      this.save(); this.emit('chips');
      return true;
    },

    /* ---------- 目前裝備 ---------- */
    rod: function () { return findById(FG.RODS, this.data.rod) || FG.RODS[0]; },
    bait: function () { return findById(FG.BAITS, this.data.bait) || FG.BAITS[0]; },
    baitCount: function (id) { return this.data.baits[id || this.data.bait] || 0; },
    loc: function () { return FG.locById(this.data.loc); },

    // 彙總所有裝備 / 裝飾加成。
    //
    // ★ 有 loc 參數：裝備可以是「釣點專屬」（effect.loc），只在該釣點生效。
    //   locId 省略時退回目前所在釣點，這樣既有呼叫端不用全部改。
    //
    // ★ 固定 RTP 之後只剩四個 effect key。`rareMul` / `valueMul` 會被 rtpNorm()
    //   完全抵銷（等於沒效果），`costMul` 會讓「賠付按 bet 算、成本按 bet×costMul 算」
    //   而把 RTP 推到 98% 以上——三個都已從資料表移除，這裡也不再彙總。
    //   詳見 wiki 03 §為什麼裝備不能加 EV。
    bonus: function (loc) {
      const locId = (loc && loc.id) || (typeof loc === 'string' ? loc : this.data.loc);
      const b = { jackpotMul: 1, kingMul: 1, sizeBonus: 0, showHint: false };
      const rod = this.rod();
      b.sizeBonus += rod.sizeBonus; b.kingMul *= rod.kingMul || 1;

      const bait = this.bait();
      b.jackpotMul *= bait.jackpotMul || 1;

      const d = this.data;
      for (let i = 0; i < d.equips.length; i++) {
        const e = findById(FG.EQUIPS, d.equips[i]);
        if (!e) continue;
        const f = e.effect || {};
        if (f.loc && f.loc !== locId) continue;      // 專屬裝備：不在它的釣點就完全不計
        if (f.jackpotMul) b.jackpotMul *= f.jackpotMul;
        if (f.kingMul) b.kingMul *= f.kingMul;
        if (f.sizeBonus) b.sizeBonus += f.sizeBonus;
        if (f.showHint) b.showHint = true;
      }
      // 裝飾目前一律純裝飾（effect 空）。迴圈留著是為了保住擴充點——
      // 真要給裝飾效果時，它會跟裝備一樣被 rtpNorm 吸收成純波動度旋鈕。
      for (const id in d.deco) {
        if (!d.deco[id]) continue;
        const dec = findById(FG.DECOS, id);
        if (!dec || !dec.effect) continue;
        if (dec.effect.jackpotMul) b.jackpotMul *= dec.effect.jackpotMul;
        if (dec.effect.kingMul) b.kingMul *= dec.effect.kingMul;
      }
      return b;
    },

    /* ---------- 下注額（Bet） ----------
       玩家從 FG.BETS 選一格，但**不能低於該釣點的 minBet**。
       minBet 就是舊版 castCost 的角色：它是進程門檻，只是現在門檻之上還能自己加注。 */
    betOptions: function (loc) {
      loc = loc || this.loc();
      return FG.BETS.filter(function (v) { return v >= loc.minBet; });
    },
    bet: function (loc) {
      loc = loc || this.loc();
      return Math.max(this.data.bet || FG.BETS[0], loc.minBet);
    },
    setBet: function (v) {
      if (FG.BETS.indexOf(v) < 0) return false;
      this.data.bet = v;
      this.save(); this.emit('gear');
      return true;
    },
    // 拋竿費 = 下注額。名字保留給既有呼叫端，語意已經變成「這一竿押多少」。
    castCost: function (loc) { return this.bet(loc); },

    /* ---------- 稀有度權重（同時給抽獎與費率表使用） ---------- */
    rarityTable: function (loc) {
      loc = loc || this.loc();
      const b = this.bonus(loc);
      const bait = this.bait();
      const pool = {};
      loc.fish.forEach(function (f) { (pool[f.rarity] = pool[f.rarity] || []).push(f); });

      // 只有兩個階級的權重會被裝備動到：
      //   junk — 餌的 junkMul（純體感，少釣到垃圾）
      //   king — 竿與裝備的 kingMul（圖鑑的長線目標，也是 jackpot 的來源）
      // 中間五階固定不動。理由：在固定 RTP 下拉高稀有／史詩權重只會讓
      // 「中獎更頻繁、單筆更小」，那不是玩家想買的東西。
      const K = b.kingMul;

      const rows = [];
      let total = 0;
      FG.RARITY_ORDER.forEach(function (key) {
        if (!pool[key] || !pool[key].length) return;
        const R = FG.RARITY[key];
        let w = R.weight;
        if (key === 'junk') w *= bait.junkMul;
        else if (key === 'king') w *= K;
        w = Math.max(0, w);
        total += w;
        rows.push({ key: key, rarity: R, weight: w, fish: pool[key] });
      });
      rows.forEach(function (r) { r.pct = total > 0 ? r.weight / total : 0; });
      return rows;
    },

    /* ============================================================
       固定 RTP 的核心：rtpNorm()
       ============================================================
       每條魚的 mult 是「相對 bet 的賠付倍率」，但實際賠付還會被三件事放大／縮小：
         1. 體長係數 (len/avg)^2 —— 期望值隨 sizeBonus 變動
         2. 閃光 3% ×3        —— 期望倍率固定 1.06（雜物不吃）
         3. jackpotMul        —— 只作用在傳說／魚王
       再加上階級機率本身會被 junkMul / kingMul 改動。

       所以每次抽獎前用**當下的**分布把原始期望倍率算出來，再讓
           norm = 目標RTP / 原始期望倍率
       乘回賠付。分子分母同源，於是 EV 恆等於 bet × 目標RTP——
       不管玩家帶什麼、在哪、下多少注。這是恆等式，不需要事後校正或跑模擬。

       代價（也是設計本身）：任何裝備都不可能提高 EV，只能改變分布形狀。 */

    // E[(len/avg)^2]。t' = clamp(U^2.4 × (1+sb) + sb×0.25, 0, 1)，
    // clamp 讓它變成分段積分，所以直接數值積分。sizeBonus 很少變，結果快取起來。
    sizeMoments: function (sb) {
      const key = sb.toFixed(5);
      if (momCache[key]) return momCache[key];
      const N = 4096;
      let s1 = 0, s2 = 0;
      for (let i = 0; i < N; i++) {
        const u = (i + 0.5) / N;
        const t = FG.clamp(Math.pow(u, 2.4) * (1 + sb) + sb * 0.25, 0, 1);
        s1 += t; s2 += t * t;
      }
      return (momCache[key] = { t: s1 / N, t2: s2 / N });
    },

    // 這條魚的標稱賠付倍率（吃 jackpotMul，但只有傳說／魚王吃得到）
    payoutMult: function (fish, b) {
      const j = (fish.rarity === 'legend' || fish.rarity === 'king') ? b.jackpotMul : 1;
      return fish.mult * j;
    },

    // boost 省略 = 只算基礎 RTP（給費率表之類的顯示用，不會動到 Buffer 池）
    rtpNorm: function (loc, rows, boost) {
      loc = loc || this.loc();
      rows = rows || this.rarityTable(loc);
      const b = this.bonus(loc);
      const m = this.sizeMoments(b.sizeBonus);
      const self = this;

      let total = 0;
      rows.forEach(function (r) { total += r.weight; });
      if (total <= 0) return 0;

      let ev = 0;
      rows.forEach(function (r) {
        let s = 0;
        r.fish.forEach(function (f) {
          s += self.payoutMult(f, b) * esize(f, m) * (f.junkArt ? 1 : SHINY_EV);
        });
        ev += (r.weight / total) * (s / r.fish.length);
      });
      return ev > 0 ? (FG.RTP_TARGET + (boost || 0)) / ev : 0;
    },

    /* ---------- Buffer 池 ----------
       商店消費（竿／餌／裝備／裝飾／魚缸）扣掉 2% 之後全額進池，再由每一竿慢慢排回去。
       排法是**墊高該竿的目標 RTP**，玩家端完全沒有提示——這是刻意的設計選擇。

       扣池用的是**期望值**（bet × boost）而不是實際多付出去的賠付：
       兩者長期相等（E[多付的賠付] = bet × boost），但用期望值扣，
       單次中大獎就不會把池一次打穿，池餘額也才會是平滑的指數衰減。 */
    bufferBoost: function (bet) {
      bet = bet || this.bet();
      const buf = this.data.buffer || 0;
      if (buf <= 0 || bet <= 0) return 0;
      return Math.min(BUFFER_BOOST_MAX, buf / (bet * BUFFER_DRAIN));
    },
    toBuffer: function (spent) {
      if (!(spent > 0)) return;
      const d = this.data;
      d.buffer = (d.buffer || 0) + spent * FG.RTP_TARGET;
      d.stats.shopSpent = (d.stats.shopSpent || 0) + spent;
    },
    // 下注：付錢並記進 RTP 的分母
    wager: function (bet) {
      if (!this.pay(bet)) return false;
      this.data.stats.wagered = (this.data.stats.wagered || 0) + bet;
      return true;
    },

    /* ---------- 抽一次漁獲 ---------- */
    rollCatch: function (loc) {
      loc = loc || this.loc();
      const b = this.bonus(loc);
      const rows = this.rarityTable(loc);
      const bet = this.bet(loc);

      // Buffer 的墊高在這裡定案並立刻扣池，之後的賠付才吃得到它
      const boost = this.bufferBoost(bet);
      const norm = this.rtpNorm(loc, rows, boost);
      if (boost > 0) this.data.buffer = Math.max(0, this.data.buffer - bet * boost);

      const row = FG.weightedPick(rows, function (r) { return r.weight; });
      const fish = FG.pick(row.fish);

      // 體型：偏小分佈，裝備加成往上推
      let t = FG.skewed(2.4);
      t = FG.clamp(t * (1 + b.sizeBonus) + b.sizeBonus * 0.25, 0, 1);
      const len = fish.minLen + (fish.maxLen - fish.minLen) * t;
      const avg = (fish.minLen + fish.maxLen) / 2;

      const shape = fish.shape || 'normal';
      // 魚王的專屬體型一律吃 fallback 2.0e-5，唯一的例外是 octopus：章魚的「體長」
      // 算的是腕展，而牠幾乎整隻是水，用魚的密度會跑出一噸多，是唯一一個看得出荒謬的
      const density = { normal: 2.0e-5, long: 6.0e-6, round: 2.8e-5, flat: 2.4e-5, wide: 2.2e-5, ray: 2.0e-5, octopus: 1.0e-6 }[shape] || 2.0e-5;
      const weight = Math.pow(len, 3) * density;

      const shiny = !fish.junkArt && Math.random() < 0.03;
      let value = bet * this.payoutMult(fish, b) * Math.pow(len / avg, 2.0) * norm;
      if (shiny) value *= 3;
      value = Math.max(1, Math.round(value));

      const rec = this.data.codex[fish.id];
      const isNew = !rec;
      const isRecord = !!rec && len > rec.maxLen;

      return {
        uid: 'c' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
        fishId: fish.id,
        locId: loc.id,
        len: Math.round(len * 10) / 10,
        weight: Math.round(weight * 100) / 100,
        value: value,
        shiny: shiny,
        isNew: isNew,
        isRecord: isRecord,
        rarity: fish.rarity,
        t: Date.now()
      };
    },

    // 記錄一次釣獲（圖鑑、統計、任務）
    recordCatch: function (inst) {
      const d = this.data;
      const f = FG.fishById(inst.fishId);
      const rec = d.codex[inst.fishId];
      if (!rec) d.codex[inst.fishId] = { n: 1, maxLen: inst.len, first: inst.t };
      else { rec.n++; if (inst.len > rec.maxLen) rec.maxLen = inst.len; }

      d.stats.caught++;
      // RTP 的分子：玩家實際拿到的價值。收藏起來不賣也算——那是玩家選擇持有資產，
      // 不是遊戲少付了。用 recordCatch 而不是 rollCatch 記，是因為模擬與開發者面板
      // 會直接呼叫 rollCatch，那些不該污染真實統計。
      d.stats.payout = (d.stats.payout || 0) + inst.value;
      if (f && f.rarity === 'king') d.stats.kings++;

      this.bumpMission('casts', 1);
      if (f && ['rare', 'epic', 'legend', 'king'].indexOf(f.rarity) >= 0) this.bumpMission('rares', 1);
      if (inst.isNew) this.bumpMission('newCodex', 1);

      this.save();
      this.emit('codex');
    },

    /* ---------- 收藏 / 賣出 ---------- */
    tankCap: function () {
      const lv = FG.TANK_LEVELS[Math.min(this.data.tankLevel, FG.TANK_LEVELS.length) - 1];
      return lv ? lv.cap : 3;
    },
    tankFull: function () { return this.data.tank.length >= this.tankCap(); },
    collect: function (inst) {
      if (this.tankFull()) return false;
      this.data.tank.push(inst);
      this.save(); this.emit('tank');
      return true;
    },
    sell: function (inst, fromTank) {
      if (fromTank) {
        const i = this.data.tank.findIndex(function (x) { return x.uid === inst.uid; });
        if (i >= 0) this.data.tank.splice(i, 1);
      }
      this.data.stats.sold++;
      this.bumpMission('sells', 1);
      this.addChips(inst.value);
      this.emit('tank');
      return inst.value;
    },
    release: function (inst) {
      const i = this.data.tank.findIndex(function (x) { return x.uid === inst.uid; });
      if (i >= 0) this.data.tank.splice(i, 1);
      this.save(); this.emit('tank');
    },

    /* ---------- 商店 ---------- */
    // ★ 商店的每一筆消費都要呼叫 toBuffer()。漏掉的話那筆錢就真的消失了，
    //   總體 RTP 會掉到 98% 以下——而且不會有任何報錯，只有長期統計看得出來。
    buyRod: function (rod) {
      if (this.data.rods.indexOf(rod.id) >= 0) return 'owned';
      if (!this.pay(rod.price)) return 'poor';
      this.toBuffer(rod.price);
      this.data.rods.push(rod.id);
      this.data.rod = rod.id;
      this.save(); this.emit('gear');
      return 'ok';
    },
    equipRod: function (rod) { this.data.rod = rod.id; this.save(); this.emit('gear'); },
    buyBait: function (bait, packs) {
      packs = packs || 1;
      const cost = bait.price * bait.pack * packs;
      if (!this.pay(cost)) return 'poor';
      this.toBuffer(cost);
      this.data.baits[bait.id] = (this.data.baits[bait.id] || 0) + bait.pack * packs;
      this.data.bait = bait.id;
      this.save(); this.emit('gear');
      return 'ok';
    },
    useBait: function () {
      const id = this.data.bait;
      if ((this.data.baits[id] || 0) <= 0) return false;
      this.data.baits[id]--;
      if (this.data.baits[id] <= 0) {
        // 用完自動換一個還有存貨的餌
        const have = FG.BAITS.filter((b) => (this.data.baits[b.id] || 0) > 0);
        if (have.length) this.data.bait = have[0].id;
      }
      this.save(); this.emit('gear');
      return true;
    },
    selectBait: function (id) {
      if ((this.data.baits[id] || 0) > 0) { this.data.bait = id; this.save(); this.emit('gear'); }
    },
    buyEquip: function (eq) {
      if (this.data.equips.indexOf(eq.id) >= 0) return 'owned';
      if (!this.pay(eq.price)) return 'poor';
      this.toBuffer(eq.price);
      this.data.equips.push(eq.id);
      this.save(); this.emit('gear');
      return 'ok';
    },

    /* ---------- 家園 ---------- */
    upgradeTank: function () {
      const next = FG.TANK_LEVELS[this.data.tankLevel];
      if (!next) return 'max';
      if (!this.pay(next.price)) return 'poor';
      this.toBuffer(next.price);
      this.data.tankLevel = next.level;
      this.save(); this.emit('tank');
      return 'ok';
    },
    buyDeco: function (d) {
      if (this.data.deco[d.id]) return 'owned';
      if (!this.pay(d.price)) return 'poor';
      this.toBuffer(d.price);
      this.data.deco[d.id] = true;
      this.save(); this.emit('tank');
      return 'ok';
    },

    /* ---------- 地點 ---------- */
    // unlock.free 的釣點一律視為已解鎖，不寫進 data.unlocked——
    // 這樣把某個釣點改成免費／改回收費都只要動 data.js，舊存檔也不用遷移
    isUnlocked: function (loc) {
      if (loc.unlock && loc.unlock.free) return true;
      return this.data.unlocked.indexOf(loc.id) >= 0;
    },
    unlockLoc: function (loc) {
      if (this.isUnlocked(loc)) return 'owned';
      if (loc.comingSoon) return 'soon';
      if (!this.pay(loc.unlock.chips)) return 'poor';
      this.data.unlocked.push(loc.id);
      this.save(); this.emit('loc');
      return 'ok';
    },
    setLoc: function (loc) { this.data.loc = loc.id; this.save(); this.emit('loc'); },

    /* ---------- 每日 ---------- */
    rollDaily: function () {
      const today = FG.todayKey();
      const d = this.data;
      if (d.daily.date !== today) {
        d.daily = { date: today, prog: {}, claimed: {} };
      }
    },
    bumpMission: function (track, n) {
      this.rollDaily();
      const p = this.data.daily.prog;
      p[track] = (p[track] || 0) + n;
      this.save(); this.emit('daily');
    },
    missionState: function (m) {
      const p = this.data.daily.prog[m.track] || 0;
      return { cur: Math.min(p, m.target), done: p >= m.target, claimed: !!this.data.daily.claimed[m.id] };
    },
    claimMission: function (m) {
      const st = this.missionState(m);
      if (!st.done || st.claimed) return false;
      this.data.daily.claimed[m.id] = true;
      this.addChips(m.reward);
      this.emit('daily');
      return true;
    },
    signinState: function () {
      const today = FG.todayKey();
      const s = this.data.signin;
      return { canClaim: s.date !== today, streak: s.streak, todayIndex: (s.date === today ? s.streak - 1 : s.streak) % 7 };
    },
    claimSignin: function () {
      const st = this.signinState();
      if (!st.canClaim) return null;
      const idx = st.streak % 7;
      const r = FG.SIGNIN[idx];
      this.data.signin.date = FG.todayKey();
      this.data.signin.streak = st.streak + 1;
      this.addChips(r.chips);
      if (r.bait) this.data.baits[r.bait.id] = (this.data.baits[r.bait.id] || 0) + r.bait.n;
      this.save(); this.emit('daily'); this.emit('gear');
      return r;
    },
    dailyBadge: function () {
      const st = this.signinState();
      if (st.canClaim) return true;
      for (let i = 0; i < FG.MISSIONS.length; i++) {
        const m = FG.MISSIONS[i], ms = this.missionState(m);
        if (ms.done && !ms.claimed) return true;
      }
      return false;
    },

    /* ---------- 儲值（測試版直接發放） ---------- */
    buyPack: function (p) {
      if (p.once && this.data.packsBought[p.id]) return 'owned';
      this.data.packsBought[p.id] = (this.data.packsBought[p.id] || 0) + 1;
      this.addChips(p.chips + (p.bonus || 0));
      if (p.extra) {
        if (p.extra.rod && this.data.rods.indexOf(p.extra.rod) < 0) {
          this.data.rods.push(p.extra.rod);
          this.data.rod = p.extra.rod;
        }
        if (p.extra.baits) for (const bid in p.extra.baits) {
          this.data.baits[bid] = (this.data.baits[bid] || 0) + p.extra.baits[bid];
        }
      }
      this.save(); this.emit('gear');
      return 'ok';
    },

    /* ---------- 圖鑑統計 ---------- */
    codexProgress: function (loc) {
      const list = loc.fish.filter(function (f) { return !f.junkArt; });
      let got = 0;
      for (let i = 0; i < list.length; i++) if (this.data.codex[list[i].id]) got++;
      return { got: got, total: list.length };
    }
  };

  function findById(arr, id) {
    for (let i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
    return null;
  }
  FG.findById = findById;

})(window.FG);
