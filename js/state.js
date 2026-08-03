/* ============================================================
   state.js — 遊戲狀態、存檔、抽獎與經濟計算
   ============================================================ */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  const SAVE_KEY = 'fg_save_v1';
  const SAVE_VER = 1;

  function freshSave() {
    return {
      ver: SAVE_VER,
      chips: 20000,
      loc: 'mist_lake',
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
      stats: { casts: 0, caught: 0, sold: 0, earned: 0, spent: 0, kings: 0 },
      // 自動釣魚設定（會記住上次的選擇）
      auto: {
        rounds: 50,          // 局數，0 = 無限
        sellMode: 'rare',    // all=全賣 / rare=稀有以上收藏 / keep=全部收藏
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

    // 彙總所有裝備 / 裝飾加成
    bonus: function () {
      const b = { rareMul: 1, valueMul: 1, costMul: 1, sizeBonus: 0, kingMul: 1, showHint: false };
      const rod = this.rod();
      b.rareMul *= rod.rareMul; b.sizeBonus += rod.sizeBonus; b.kingMul *= rod.kingMul || 1;

      const d = this.data;
      for (let i = 0; i < d.equips.length; i++) {
        const e = findById(FG.EQUIPS, d.equips[i]);
        if (!e) continue;
        const f = e.effect || {};
        if (f.rareMul) b.rareMul *= f.rareMul;
        if (f.valueMul) b.valueMul *= f.valueMul;
        if (f.costMul) b.costMul *= f.costMul;
        if (f.sizeBonus) b.sizeBonus += f.sizeBonus;
        if (f.showHint) b.showHint = true;
      }
      for (const id in d.deco) {
        if (!d.deco[id]) continue;
        const dec = findById(FG.DECOS, id);
        if (!dec || !dec.effect) continue;
        if (dec.effect.rareMul) b.rareMul *= dec.effect.rareMul;
        if (dec.effect.valueMul) b.valueMul *= dec.effect.valueMul;
      }
      return b;
    },

    castCost: function (loc) {
      loc = loc || this.loc();
      return Math.round(loc.castCost * this.bonus().costMul);
    },

    /* ---------- 稀有度權重（同時給抽獎與費率表使用） ---------- */
    rarityTable: function (loc) {
      loc = loc || this.loc();
      const b = this.bonus();
      const bait = this.bait();
      const pool = {};
      loc.fish.forEach(function (f) { (pool[f.rarity] = pool[f.rarity] || []).push(f); });

      // M：稀有度加權（釣竿/餌料/裝備/裝飾）；K：魚王專屬加權
      // 越高的階級加成遞減，避免頂級裝備把魚王機率推到失控
      const M = b.rareMul * bait.rareMul;
      const K = b.kingMul * (bait.kingMul || 1);

      const rows = [];
      let total = 0;
      FG.RARITY_ORDER.forEach(function (key) {
        if (!pool[key] || !pool[key].length) return;
        const R = FG.RARITY[key];
        let w = R.weight;
        if (key === 'junk') w *= bait.junkMul;
        else if (key === 'rare') w *= M;
        else if (key === 'epic') w *= Math.pow(M, 0.85);
        else if (key === 'legend') w *= Math.pow(M, 0.70);
        else if (key === 'king') w *= K;      // 魚王只吃魚王加權
        w = Math.max(0, w);
        total += w;
        rows.push({ key: key, rarity: R, weight: w, fish: pool[key] });
      });
      rows.forEach(function (r) { r.pct = total > 0 ? r.weight / total : 0; });
      return rows;
    },

    /* ---------- 抽一次漁獲 ---------- */
    rollCatch: function (loc) {
      loc = loc || this.loc();
      const b = this.bonus();
      const bait = this.bait();
      const rows = this.rarityTable(loc);

      const row = FG.weightedPick(rows, function (r) { return r.weight; });
      const fish = FG.pick(row.fish);

      // 體型：偏小分佈，裝備加成往上推
      let t = FG.skewed(2.4);
      t = FG.clamp(t * (1 + b.sizeBonus) + b.sizeBonus * 0.25, 0, 1);
      const len = fish.minLen + (fish.maxLen - fish.minLen) * t;
      const avg = (fish.minLen + fish.maxLen) / 2;

      const shape = fish.shape || 'normal';
      const density = { normal: 2.0e-5, long: 6.0e-6, round: 2.8e-5, flat: 2.4e-5, wide: 2.2e-5, ray: 2.0e-5 }[shape] || 2.0e-5;
      const weight = Math.pow(len, 3) * density;

      const shiny = !fish.junkArt && Math.random() < 0.03;
      let value = fish.value * Math.pow(len / avg, 2.0);
      if (!fish.junkArt) value *= b.valueMul * bait.valueMul;
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
    buyRod: function (rod) {
      if (this.data.rods.indexOf(rod.id) >= 0) return 'owned';
      if (!this.pay(rod.price)) return 'poor';
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
      this.data.equips.push(eq.id);
      this.save(); this.emit('gear');
      return 'ok';
    },

    /* ---------- 家園 ---------- */
    upgradeTank: function () {
      const next = FG.TANK_LEVELS[this.data.tankLevel];
      if (!next) return 'max';
      if (!this.pay(next.price)) return 'poor';
      this.data.tankLevel = next.level;
      this.save(); this.emit('tank');
      return 'ok';
    },
    buyDeco: function (d) {
      if (this.data.deco[d.id]) return 'owned';
      if (!this.pay(d.price)) return 'poor';
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
