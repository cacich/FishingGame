/* ============================================================
   screen-fishing.js — 釣魚主畫面
   演出流程：拋竿 → 等待 → 咬鉤 → 收線（魚躍出水面）→ 結果卡
   釣獲結果在「拋竿當下」就抽好，聲納裝備才能提前給魚影提示

   自動模式：連續拋竿並自動處理漁獲，可設定局數、籌碼下限、
   稀有度停止門檻、漁獲處理方式與播放速度
   ============================================================ */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  const FLOAT_HOME = { x: 112, y: 232 };   // 竿尖附近（收線後浮標位置）
  const FLOAT_CAST = { x: 152, y: 208 };   // 落點

  const STOP_RARITY_OPTS = [
    { v: 'none',   t: '不停止' },
    { v: 'rare',   t: '稀有' },
    { v: 'epic',   t: '史詩' },
    { v: 'legend', t: '傳說' },
    { v: 'king',   t: '魚王' }
  ];

  // 漁獲處理：'all' 全賣、'keep' 全收，其餘是「該稀有度以上收藏」的門檻。
  // 值刻意沿用稀有度 key，這樣舊存檔的 'all' / 'rare' / 'keep' 全都還是合法值，不用遷移。
  const KEEP_OPTS = [
    { v: 'all',    t: '全賣' },
    { v: 'good',   t: '優良' },
    { v: 'rare',   t: '稀有' },
    { v: 'epic',   t: '史詩' },
    { v: 'legend', t: '傳說' },
    { v: 'king',   t: '魚王' },
    { v: 'keep',   t: '全收' }
  ];
  const KEEP_DESC = {
    all:    '全部賣出，什麼都不留。',
    good:   '<b>優良</b>以上收藏，普通與雜物賣出。魚缸消耗最快。',
    rare:   '<b>稀有</b>以上收藏，其餘賣出。',
    epic:   '<b>史詩</b>以上收藏，其餘賣出。',
    legend: '<b>傳說</b>以上收藏，其餘賣出。跑長局建議用這個。',
    king:   '<b>只收魚王</b>，其餘全部賣出。魚缸幾乎不會滿。',
    keep:   '全部收藏（雜物除外）。魚缸很快就會滿。'
  };

  // 這條漁獲該不該收藏？雜物永遠賣出，由呼叫端另外擋
  function keepsThis(sellMode, R) {
    if (sellMode === 'keep') return true;
    if (sellMode === 'all') return false;
    const min = FG.RARITY[sellMode];
    return !!min && R.order >= min.order;
  }

  const S = FG.screenFishing = {
    id: 'fishing',
    label: '釣魚',
    icon: 'fish',

    el: null, ctx: null,
    phase: 'idle',
    t0: 0,
    pending: null,      // 本次抽到的漁獲
    dur: null,          // 本次演出各階段長度（拋竿當下依速度算好）
    hinted: false,
    auto: null,         // 自動模式執行中的狀態，null = 手動
    nextCastAt: 0,

    build: function () {
      const el = FG.el('section', 'screen');
      el.id = 'screen-fishing';
      el.innerHTML =
        '<div id="stageWrap">' +
          '<canvas id="stage"></canvas>' +
          '<div id="stageHud">' +
            '<div class="stage-banner" id="stageBanner"></div>' +
            '<div id="castMsg"></div>' +
            '<div id="autoLog"></div>' +
          '</div>' +
        '</div>' +
        '<div id="castBar">' +
          '<div class="gear-row" id="gearRow">' +
            '<button class="gear-slot" id="rodSlot"><span class="k">釣竿</span><span class="v"></span></button>' +
            '<button class="gear-slot" id="baitSlot"><span class="k">餌料</span><span class="v"></span></button>' +
            '<button class="gear-slot" id="rateSlot"><span class="k">中獎機率</span><span class="v">查看費率 ▸</span></button>' +
          '</div>' +
          '<div class="auto-stats" id="autoStats"></div>' +
          '<div class="cast-row">' +
            '<button class="btn" id="castBtn"></button>' +
            '<button class="btn" id="autoBtn"></button>' +
          '</div>' +
        '</div>';

      this.el = el;
      const cv = el.querySelector('#stage');
      cv.width = FG.px.sceneSize.w;
      cv.height = FG.px.sceneSize.h;
      this.ctx = cv.getContext('2d');

      const self = this;
      el.querySelector('#castBtn').onclick = function () { self.cast(); };
      el.querySelector('#autoBtn').onclick = function () {
        FG.sfx.click();
        if (self.auto) self.stopAuto('手動停止');
        else self.autoModal();
      };
      el.querySelector('#rodSlot').onclick = function () { if (self.auto) return; FG.sfx.click(); FG.go('shop', 'rod'); };
      el.querySelector('#baitSlot').onclick = function () { if (self.auto) return; FG.sfx.click(); self.baitPicker(); };
      el.querySelector('#rateSlot').onclick = function () { FG.sfx.click(); self.rateModal(); };
      el.querySelector('#stageWrap').onclick = function () { self.skip(); };

      FG.state.on('gear', function () { self.refresh(); });
      FG.state.on('loc', function () { if (self.auto) self.stopAuto('切換釣點'); self.refresh(); });
      FG.state.on('codex', function () { self.refresh(); });
      return el;
    },

    onShow: function () { this.refresh(); },

    // 目前演出速度倍率
    spd: function () { return this.auto ? this.auto.speed : 1; },

    refresh: function () {
      if (!this.el) return;
      const st = FG.state, loc = st.loc();
      const rod = st.rod(), bait = st.bait();
      const n = st.baitCount();
      const cost = st.castCost(loc);
      const prog = st.codexProgress(loc);

      this.el.querySelector('#stageBanner').innerHTML =
        '<b>' + FG.esc(loc.name) + '</b> · 圖鑑 ' + prog.got + '/' + prog.total;

      this.el.querySelector('#rodSlot .v').textContent = rod.name;
      const bv = this.el.querySelector('#baitSlot .v');
      bv.textContent = bait.name + ' ×' + n;
      bv.className = 'v' + (n <= 0 ? ' warn' : '');

      const btn = this.el.querySelector('#castBtn');
      const ab = this.el.querySelector('#autoBtn');
      const busy = this.phase !== 'idle';

      if (this.auto) {
        const a = this.auto;
        btn.classList.add('busy');
        btn.disabled = true;
        btn.innerHTML = '自動進行中　' + a.done + (a.total ? '/' + a.total : '') + ' 局';
        ab.className = 'btn danger auto-btn';
        ab.innerHTML = '停止';
      } else {
        ab.className = 'btn auto-btn';
        ab.innerHTML = '自動 ▸';
        if (busy) {
          btn.innerHTML = '收 線 中…';
          btn.classList.add('busy');
          btn.disabled = true;
        } else {
          btn.classList.remove('busy');
          btn.disabled = false;
          btn.innerHTML = '拋　竿<span class="cost">−' + FG.fmt(cost) + '</span>';
        }
      }
      this.el.querySelector('#gearRow').style.display = this.auto ? 'none' : '';
      this.renderAutoStats();
    },

    /* ---------------- 拋竿 ---------------- */

    // 檢查是否可以拋竿；auto 為 true 時不跳彈窗，只回傳原因
    canCast: function () {
      const st = FG.state;
      if (st.baitCount() <= 0) return { ok: false, why: 'bait', msg: '餌料用完' };
      if (!st.canPay(st.castCost())) return { ok: false, why: 'chips', msg: '籌碼不足' };
      return { ok: true };
    },

    cast: function (fromAuto) {
      if (this.phase !== 'idle') return;
      const st = FG.state, loc = st.loc();
      const chk = this.canCast();

      if (!chk.ok) {
        // 自動模式沒餌時先試著補貨，補到了就照原本流程拋下去。
        // 少了這一步，「按開始自動的瞬間剛好沒餌」會直接停止，自動補貨設定形同無效。
        if (fromAuto && chk.why === 'bait' && this.autoRestockBait()) { this.cast(true); return; }
        if (fromAuto) { this.stopAuto(chk.msg); return; }
        FG.sfx.fail();
        if (chk.why === 'bait') {
          FG.ui.confirm('餌料用完了', '沒有餌就釣不到魚。要去商店補貨嗎？', '前往商店', function () { FG.go('shop', 'bait'); });
        } else {
          FG.ui.confirm('籌碼不足', '拋竿需要 <span class="money">' + FG.fmt(st.castCost()) + '</span> 籌碼。<br>目前只有 <span class="money">' + FG.fmt(st.data.chips) + '</span>。',
            '取得籌碼', function () { FG.openTopup(); }, 'gold');
        }
        return;
      }

      const cost = st.castCost(loc);
      st.pay(cost);
      st.useBait();
      st.data.stats.casts++;
      if (this.auto) this.auto.cost += cost;

      this.pending = st.rollCatch(loc);
      this.phase = 'cast';
      this.t0 = performance.now();
      this.hinted = false;

      const spd = this.spd();
      this.dur = {
        cast: 700 / spd,
        wait: (this.auto ? 500 + Math.random() * 800 : 1200 + Math.random() * 2200) / spd,
        bite: 850 / spd,
        reel: 1100 / spd
      };

      FG.sfx.cast();
      this.msg('拋　竿');
      this.refresh();
    },

    // 點畫面加速演出
    skip: function () {
      if (this.auto) return;
      if (this.phase === 'wait') this.t0 = performance.now() - this.dur.wait;
      else if (this.phase === 'cast') this.t0 = performance.now() - this.dur.cast;
    },

    msg: function (text) {
      const m = this.el.querySelector('#castMsg');
      if (!text) { m.classList.remove('show'); return; }
      m.textContent = text;
      m.classList.add('show');
    },

    /* ---------------- 每幀更新 ---------------- */
    frame: function (now) {
      if (!this.ctx) return;
      const loc = FG.state.loc();
      const e = now - this.t0;
      const D = this.dur || { cast: 700, wait: 2000, bite: 850, reel: 1100 };
      const sceneSt = { time: now, floatX: FLOAT_CAST.x, floatY: FLOAT_CAST.y, floatSink: 0 };

      switch (this.phase) {
        case 'idle':
          break;

        case 'cast': {
          const t = FG.clamp(e / D.cast, 0, 1);
          sceneSt.floatX = FG.lerp(FLOAT_HOME.x, FLOAT_CAST.x, t);
          sceneSt.floatY = FG.lerp(FLOAT_HOME.y, FLOAT_CAST.y, t) - Math.sin(t * Math.PI) * 34;
          if (t >= 1) { this.phase = 'wait'; this.t0 = now; FG.sfx.splash(); this.msg('等待魚訊…'); }
          break;
        }

        case 'wait': {
          sceneSt.floatSink = Math.abs(Math.sin(now * 0.004)) * 0.12;
          if (!this.hinted && FG.state.bonus().showHint && e > D.wait * 0.55) {
            this.hinted = true;
            const R = FG.RARITY[this.pending.rarity];
            this.msg('聲納：偵測到「' + R.name + '」等級魚影');
          }
          if (e >= D.wait) { this.phase = 'bite'; this.t0 = now; FG.sfx.bite(); this.msg('上　鉤　了！'); }
          break;
        }

        case 'bite': {
          const t = FG.clamp(e / D.bite, 0, 1);
          sceneSt.floatSink = t;
          sceneSt.ripple = true;
          sceneSt.floatY = FLOAT_CAST.y + t * 3;
          if (t >= 1) { this.phase = 'reel'; this.t0 = now; FG.sfx.splash(); this.msg('收　線！'); }
          break;
        }

        case 'reel': {
          const t = FG.clamp(e / D.reel, 0, 1);
          sceneSt.floatSink = 1;
          sceneSt.ripple = true;
          sceneSt.jump = { fish: FG.fishById(this.pending.fishId), t: t };
          if (t >= 1) {
            this.phase = 'idle';
            this.msg('');
            if (this.auto) this.resolveAuto(now);
            else this.showResult();
            this.refresh();
          }
          break;
        }
      }

      FG.px.drawScene(this.ctx, loc, sceneSt);

      // 自動模式：到時間就下一竿
      if (this.auto && this.phase === 'idle' && now >= this.nextCastAt) this.cast(true);
    },

    /* ---------------- 手動結果卡 ---------------- */
    showResult: function () {
      const st = FG.state;
      const inst = this.pending;
      const fish = FG.fishById(inst.fishId);
      const R = FG.RARITY[fish.rarity];
      st.recordCatch(inst);

      if (fish.rarity === 'king' || fish.rarity === 'legend') FG.sfx.win();
      else if (fish.rarity === 'junk') FG.sfx.fail();
      else FG.sfx.coin();

      const card = FG.el('div', 'catch-card');

      const bar = FG.el('div', 'rarity-bar', (inst.shiny ? '✦ 閃光 ✦ ' : '') + R.name);
      bar.style.background = R.color + '22';
      bar.style.color = R.color;
      bar.style.boxShadow = 'inset 0 -2px 0 ' + R.color + '66';
      card.appendChild(bar);

      const view = FG.el('div', 'fishview');
      const sprite = FG.px.spriteEl(fish, 3);
      if (inst.shiny) sprite.style.filter = 'saturate(1.6) brightness(1.2) drop-shadow(0 0 6px #fff8c0)';
      view.appendChild(sprite);
      card.appendChild(view);

      const h = FG.el('h3', '', FG.esc(fish.name));
      if (inst.isNew) h.appendChild(FG.el('span', 'newbadge', 'NEW'));
      card.appendChild(h);

      const stats = FG.el('div', 'stats');
      stats.innerHTML =
        '<span>體長 <b>' + inst.len.toFixed(1) + ' cm</b></span>' +
        (fish.junkArt ? '' : '<span>重量 <b>' + inst.weight.toFixed(2) + ' kg</b></span>');
      card.appendChild(stats);

      if (inst.isRecord && !inst.isNew) {
        const rec = FG.el('div', 'tiny', '★ 個人新紀錄！');
        rec.style.color = '#ffc44d';
        rec.style.marginBottom = '6px';
        card.appendChild(rec);
      }

      if (fish.legend) card.appendChild(FG.el('div', 'legend', FG.esc(fish.legend)));
      else card.appendChild(FG.el('div', 'tiny dim', FG.esc(fish.desc || '')));

      const worth = FG.el('div', 'worth', '估價 <span class="money">' + FG.fmt(inst.value) + '</span> 籌碼');
      worth.style.marginTop = '8px';
      card.appendChild(worth);
      card.appendChild(FG.el('div', 'tiny mute', '魚缸 ' + st.data.tank.length + '/' + st.tankCap()));

      FG.ui.modal({
        title: false,
        dismissable: false,
        body: card,
        buttons: [
          {
            label: '收藏展示', cls: 'ghost', close: false,
            onClick: function (h2) {
              if (fish.junkArt) { FG.ui.toast('雜物沒辦法展示啦', 'bad'); return; }
              if (st.collect(inst)) { FG.ui.toast('已放入家園魚缸', 'good'); h2.close(); }
              else FG.ui.toast('魚缸滿了，先去家園升級', 'bad', 2200);
            }
          },
          {
            label: '賣出 +' + FG.fmtShort(inst.value), cls: 'gold',
            onClick: function () {
              st.sell(inst, false);
              FG.sfx.coin();
              FG.ui.toast('賣出獲得 ' + FG.fmt(inst.value) + ' 籌碼', 'gold');
            }
          }
        ]
      });
      this.pending = null;
    },

    /* ============================================================
       自動模式
       ============================================================ */

    autoModal: function () {
      const st = FG.state;
      const cfg = Object.assign({
        rounds: 50, sellMode: 'rare', stopChips: 0, stopRarity: 'legend', speed: 2, autoBuyBait: true
      }, st.data.auto || {});
      const self = this;
      const box = FG.el('div');

      box.appendChild(seg('局數', [
        { v: 10, t: '10' }, { v: 50, t: '50' }, { v: 100, t: '100' }, { v: 500, t: '500' }, { v: 0, t: '無限' }
      ], cfg.rounds, function (v) { cfg.rounds = v; }));

      // 漁獲處理：選項是「收藏門檻」，說明文字跟著選擇即時更新
      const keepNote = note('');
      function refreshKeepNote() {
        keepNote.innerHTML = (KEEP_DESC[cfg.sellMode] || KEEP_DESC.all) +
          '<br>收藏會放進家園魚缸（目前 <b>' + st.data.tank.length + '/' + st.tankCap() +
          '</b>）。魚缸滿了會停止自動並讓你手動決定，不會擅自賣掉。';
      }
      box.appendChild(seg('漁獲處理（收藏門檻）', KEEP_OPTS, cfg.sellMode, function (v) {
        cfg.sellMode = v; refreshKeepNote();
      }));
      refreshKeepNote();
      box.appendChild(keepNote);

      box.appendChild(seg('釣到以下稀有度就停止', STOP_RARITY_OPTS, cfg.stopRarity, function (v) { cfg.stopRarity = v; }));

      /* --- 籌碼下限 --- */
      const wrap = FG.el('div', 'set-row');
      wrap.appendChild(FG.el('div', 'set-label', '籌碼低於此值就停止'));
      const inRow = FG.el('div', 'row');
      const input = FG.el('input', 'num-input');
      input.type = 'number';
      input.min = '0';
      input.step = '1000';
      input.value = cfg.stopChips || 0;
      input.oninput = function () { cfg.stopChips = Math.max(0, parseInt(input.value, 10) || 0); };
      inRow.appendChild(input);
      [0, 10000, 50000, 200000].forEach(function (v) {
        const b = FG.el('button', 'btn tiny-btn', v === 0 ? '不限' : FG.fmtShort(v));
        b.onclick = function () { FG.sfx.click(); cfg.stopChips = v; input.value = v; };
        inRow.appendChild(b);
      });
      wrap.appendChild(inRow);
      box.appendChild(wrap);
      box.appendChild(note('目前持有 <span class="money">' + FG.fmt(st.data.chips) + '</span> 籌碼，單次拋竿 ' +
        FG.fmt(st.castCost()) + ' 籌碼。'));

      box.appendChild(seg('播放速度', [
        { v: 1, t: '正常' }, { v: 2, t: '2 倍' }, { v: 4, t: '極速' }
      ], cfg.speed, function (v) { cfg.speed = v; }));

      // 餌料：說明文字要即時反映庫存，否則「沒餌就按開始」的玩家不知道自己會被立刻停下來
      const baitNote = note('');
      function refreshBaitNote() {
        const b = st.bait(), n = st.baitCount();
        baitNote.innerHTML = '目前 <b>' + FG.esc(b.name) + ' ×' + n + '</b>。' +
          (cfg.autoBuyBait
            ? '用完（或現在就沒有）會自動買一包 ' + FG.fmt(b.price * b.pack) +
              ' 籌碼；買不起這款時會改用買得起的較便宜餌料，加成會跟著下降。'
            : (n <= 0 ? '<span style="color:#ff9a5f">現在沒有餌，會立刻停止。</span>' : '用完就停止自動。'));
      }
      box.appendChild(seg('餌料用完時', [
        { v: true, t: '自動補貨' }, { v: false, t: '停止自動' }
      ], cfg.autoBuyBait, function (v) { cfg.autoBuyBait = v; refreshBaitNote(); }));
      refreshBaitNote();
      box.appendChild(baitNote);

      FG.ui.modal({
        title: '自動釣魚設定',
        body: box,
        buttons: [
          { label: '取消', cls: 'ghost' },
          { label: '開始自動', cls: 'primary', onClick: function () { self.startAuto(cfg); } }
        ]
      });

      // --- 小工具：分段選擇器 ---
      function seg(label, opts, cur, onPick) {
        const w = FG.el('div', 'set-row');
        w.appendChild(FG.el('div', 'set-label', label));
        const s = FG.el('div', 'seg seg-sm');
        opts.forEach(function (o) {
          const b = FG.el('button', o.v === cur ? 'on' : '', o.t);
          b.onclick = function () {
            FG.sfx.click();
            FG.$$('button', s).forEach(function (x) { x.classList.remove('on'); });
            b.classList.add('on');
            onPick(o.v);
          };
          s.appendChild(b);
        });
        w.appendChild(s);
        return w;
      }
      function note(html) {
        const n = FG.el('div', 'tiny mute', html);
        n.style.cssText = 'margin:-4px 0 12px;line-height:1.7';
        return n;
      }
    },

    startAuto: function (cfg) {
      const st = FG.state;
      st.data.auto = {
        rounds: cfg.rounds, sellMode: cfg.sellMode, stopChips: cfg.stopChips,
        stopRarity: cfg.stopRarity, speed: cfg.speed, autoBuyBait: cfg.autoBuyBait
      };
      st.save();

      this.auto = {
        total: cfg.rounds,          // 0 = 無限
        done: 0,
        speed: cfg.speed,
        sellMode: cfg.sellMode,
        stopChips: cfg.stopChips,
        stopRarity: cfg.stopRarity,
        autoBuyBait: cfg.autoBuyBait,
        cost: 0, gain: 0,
        kept: 0, sold: 0, newCodex: 0,
        best: null,
        baitBought: 0,
        log: []
      };
      this.nextCastAt = 0;
      FG.ui.toast('自動釣魚開始', 'good');
      this.refresh();
      if (this.phase === 'idle') this.cast(true);
    },

    // 自動模式的餌料補貨。回傳 true 表示「現在有餌，可以拋竿」。
    // 由 cast()（開場那一竿）與 resolveAuto()（每局結算）共用，兩邊都走同一套判斷。
    //
    // 兩個刻意的設計：
    // 1. 多留一筆 castCost() 的餘裕——只夠買餌卻拋不了竿的話，買了也沒意義。
    // 2. 目前這款餌買不起時，退而求其次挑「買得起的最貴一款」。否則玩家一換到高級餌
    //    （魚王秘餌一包 4,500）手頭又不寬裕，自動模式就會開場即停，根本用不了。
    //    降級會改變加成，所以一定要用 toast 講清楚換成哪一款。
    autoRestockBait: function () {
      const st = FG.state, a = this.auto;
      if (st.baitCount() > 0) return true;
      if (!a || !a.autoBuyBait) return false;

      const cur = st.bait(), cast = st.castCost();
      const afford = function (b) { return st.canPay(b.price * b.pack + cast); };
      let pick = afford(cur) ? cur : null;
      if (!pick) {
        const cands = FG.BAITS.filter(afford).sort(function (x, y) { return y.price - x.price; });
        pick = cands.length ? cands[0] : null;
      }
      if (!pick || st.buyBait(pick, 1) !== 'ok') return false;

      a.cost += pick.price * pick.pack;      // 補貨費用要計入本次結算的支出
      a.baitBought++;
      FG.ui.toast('自動補貨：' + pick.name + ' ×' + pick.pack +
        (pick.id === cur.id ? '' : '（' + cur.name + '買不起，改用這款）'), 'good', 1500);
      return true;
    },

    stopAuto: function (reason) {
      const a = this.auto;
      if (!a) return;
      this.auto = null;
      this.el.querySelector('#autoLog').innerHTML = '';
      this.refresh();
      if (a.done > 0 || reason) this.autoSummary(a, reason);
    },

    // 自動模式下處理一次漁獲
    resolveAuto: function (now) {
      const st = FG.state, a = this.auto;
      const inst = this.pending;
      if (!a || !inst) return;

      const fish = FG.fishById(inst.fishId);
      const R = FG.RARITY[fish.rarity];
      a.done++;
      if (inst.isNew) a.newCodex++;
      if (!a.best || inst.value > a.best.value) {
        a.best = { fishId: fish.id, name: fish.name, rarity: fish.rarity, value: inst.value, len: inst.len };
      }

      const wantKeep = !fish.junkArt && keepsThis(a.sellMode, R);

      // 該收藏卻沒位子 → 停下來交給玩家決定，不擅自賣掉
      if (wantKeep && st.tankFull()) {
        this.stopAuto('魚缸已滿，這條「' + fish.name + '」請手動處理');
        this.showResult();          // showResult 會自行寫入圖鑑
        return;
      }

      this.pending = null;
      st.recordCatch(inst);

      // --- 決定收藏或賣出 ---
      let action = 'sell';
      if (wantKeep && st.collect(inst)) { action = 'keep'; a.kept++; }
      else { st.sell(inst, false); a.gain += inst.value; a.sold++; }

      if (fish.rarity === 'king' || fish.rarity === 'legend') FG.sfx.win();
      else if (action === 'sell' && fish.rarity !== 'junk') FG.sfx.coin();

      // --- 記錄畫面上的滾動紀錄 ---
      a.log.unshift({ name: fish.name, color: R.color, value: inst.value, action: action, shiny: inst.shiny });
      if (a.log.length > 5) a.log.pop();
      this.renderAutoLog();
      this.renderAutoStats();

      /* --- 停止條件 --- */
      if (a.stopRarity !== 'none' && R.order >= FG.RARITY[a.stopRarity].order) {
        this.stopAuto('釣到「' + fish.name + '」（' + R.name + '）');
        return;
      }
      if (a.total && a.done >= a.total) { this.stopAuto('完成 ' + a.total + ' 局'); return; }
      if (a.stopChips > 0 && st.data.chips < a.stopChips) {
        this.stopAuto('籌碼低於設定的 ' + FG.fmt(a.stopChips));
        return;
      }
      // 餌料用完 → 自動補貨或停止
      if (!this.autoRestockBait()) { this.stopAuto('餌料用完'); return; }
      if (!st.canPay(st.castCost())) { this.stopAuto('籌碼不足'); return; }

      this.nextCastAt = now + 320 / a.speed;
    },

    renderAutoLog: function () {
      const box = this.el.querySelector('#autoLog');
      if (!this.auto) { box.innerHTML = ''; return; }
      box.innerHTML = this.auto.log.map(function (l, i) {
        return '<div class="alog" style="opacity:' + (1 - i * 0.17) + '">' +
          '<span style="color:' + l.color + '">' + (l.shiny ? '✦' : '') + FG.esc(l.name) + '</span> ' +
          (l.action === 'keep' ? '<span class="dim">收藏</span>' : '<span class="money">+' + FG.fmtShort(l.value) + '</span>') +
          '</div>';
      }).join('');
    },

    renderAutoStats: function () {
      const box = this.el.querySelector('#autoStats');
      if (!box) return;
      if (!this.auto) { box.style.display = 'none'; return; }
      const a = this.auto;
      const net = a.gain - a.cost;
      box.style.display = 'flex';
      box.innerHTML =
        '<span>局數 <b>' + a.done + (a.total ? '/' + a.total : '') + '</b></span>' +
        '<span>支出 <b class="money">' + FG.fmtShort(a.cost) + '</b></span>' +
        '<span>收入 <b class="money">' + FG.fmtShort(a.gain) + '</b></span>' +
        '<span>淨損益 <b style="color:' + (net >= 0 ? '#5fd08a' : '#ff6b6b') + '">' +
        (net >= 0 ? '+' : '−') + FG.fmtShort(Math.abs(net)) + '</b></span>';
    },

    autoSummary: function (a, reason) {
      const net = a.gain - a.cost;
      const box = FG.el('div');
      box.innerHTML =
        '<div class="tiny" style="color:#ffc44d;margin-bottom:10px">停止原因：' + FG.esc(reason || '結束') + '</div>' +
        '<table class="rate-tbl">' +
        '<tr><td>執行局數</td><td>' + a.done + '</td></tr>' +
        '<tr><td>總支出</td><td class="money">' + FG.fmt(a.cost) + '</td></tr>' +
        '<tr><td>賣魚收入</td><td class="money">' + FG.fmt(a.gain) + '</td></tr>' +
        '<tr><td>淨損益</td><td style="color:' + (net >= 0 ? '#5fd08a' : '#ff6b6b') + '">' +
          (net >= 0 ? '+' : '−') + FG.fmt(Math.abs(net)) + '</td></tr>' +
        '<tr><td>收藏 / 賣出</td><td>' + a.kept + ' / ' + a.sold + '</td></tr>' +
        '<tr><td>新增圖鑑</td><td>' + a.newCodex + '</td></tr>' +
        (a.baitBought ? '<tr><td>自動補貨</td><td>' + a.baitBought + ' 包</td></tr>' : '') +
        '</table>';

      if (a.best) {
        const R = FG.RARITY[a.best.rarity];
        const f = FG.fishById(a.best.fishId);
        const bw = FG.el('div', 'best-catch');
        if (f) bw.appendChild(FG.px.spriteEl(f, 1));
        const info = FG.el('div');
        info.innerHTML = '<div class="tiny mute">本次最佳漁獲</div>' +
          '<div style="color:' + R.color + '">' + FG.esc(a.best.name) + '</div>' +
          '<div class="tiny dim">' + a.best.len.toFixed(1) + ' cm · <span class="money">' + FG.fmt(a.best.value) + '</span></div>';
        bw.appendChild(info);
        box.appendChild(bw);
      }

      const self = this;
      FG.ui.modal({
        title: '自動釣魚結束',
        body: box,
        buttons: [
          { label: '關閉', cls: 'ghost' },
          { label: '再跑一次', cls: 'primary', onClick: function () { self.autoModal(); } }
        ]
      });
    },

    /* ---------------- 餌料快速切換 ---------------- */
    baitPicker: function () {
      const st = FG.state;
      const box = FG.el('div');
      FG.BAITS.forEach(function (b) {
        const n = st.data.baits[b.id] || 0;
        const row = FG.el('div', 'item');
        const th = FG.el('div', 'thumb');
        th.appendChild(baitIcon(b));
        row.appendChild(th);
        const info = FG.el('div', 'info');
        info.innerHTML = '<div class="nm">' + FG.esc(b.name) + ' <span class="tag">×' + n + '</span></div>' +
          '<div class="ds">稀有 ×' + b.rareMul.toFixed(2) + '　雜物 ×' + b.junkMul.toFixed(2) +
          (b.kingMul > 1 ? '　魚王 ×' + b.kingMul.toFixed(1) : '') + '</div>';
        row.appendChild(info);
        const act = FG.el('div', 'act');
        if (n > 0) {
          const on = st.data.bait === b.id;
          const btn = FG.el('button', 'btn ' + (on ? 'primary' : ''), on ? '使用中' : '選用');
          btn.onclick = function () { FG.sfx.click(); st.selectBait(b.id); FG.ui.closeAll(); };
          act.appendChild(btn);
        } else {
          const btn = FG.el('button', 'btn gold', '購買');
          btn.onclick = function () { FG.sfx.click(); FG.ui.closeAll(); FG.go('shop', 'bait'); };
          act.appendChild(btn);
        }
        row.appendChild(act);
        box.appendChild(row);
      });
      FG.ui.modal({ title: '選擇餌料', body: box });
    },

    /* ---------------- 費率表 ---------------- */
    rateModal: function () {
      const st = FG.state, loc = st.loc();
      const rows = st.rarityTable(loc);
      const box = FG.el('div');
      const tbl = FG.el('table', 'rate-tbl');
      rows.slice().reverse().forEach(function (r) {
        const tr = FG.el('tr');
        tr.appendChild(FG.el('td', '', '<span style="color:' + r.rarity.color + '">■</span> ' + r.rarity.name +
          ' <span class="mute tiny">(' + r.fish.length + ' 種)</span>'));
        tr.appendChild(FG.el('td', '', (r.pct * 100).toFixed(2) + ' %'));
        tbl.appendChild(tr);
      });
      box.appendChild(tbl);

      const b = st.bonus();
      const note = FG.el('div', 'tiny mute');
      note.style.cssText = 'margin-top:10px;line-height:1.8';
      note.innerHTML =
        '目前加成：稀有度 ×' + (b.rareMul * st.bait().rareMul).toFixed(2) +
        '　價值 ×' + (b.valueMul * st.bait().valueMul).toFixed(2) +
        '　體型 +' + Math.round(b.sizeBonus * 100) + '%<br>' +
        '機率會隨著釣竿、餌料、裝備與家園裝飾即時變動。<br>' +
        '另有 3% 機率釣起「閃光」個體，價值 ×3。';
      box.appendChild(note);

      FG.ui.modal({ title: loc.name + '｜中獎機率', body: box, buttons: [{ label: '知道了', cls: 'ghost' }] });
    }
  };

  // 餌料小圖示（用色塊組出來，省得再畫一張圖）
  function baitIcon(b) {
    const cv = FG.px.make(16, 16);
    const g = cv.getContext('2d');
    const R = FG.seeded(FG.px.hashStr(b.id));
    const cols = ['#c8a86a', '#b4544a', '#e2a0a0', '#6fd8c8', '#ffd24a'];
    const c = cols[FG.BAITS.indexOf(b) % cols.length];
    for (let i = 0; i < 26; i++) {
      const x = 2 + Math.floor(R() * 12), y = 2 + Math.floor(R() * 12);
      g.fillStyle = i % 4 === 0 ? FG.shade(c, -0.3) : c;
      g.fillRect(x, y, 2, 2);
    }
    const big = FG.px.make(32, 32);
    const bg = big.getContext('2d');
    bg.imageSmoothingEnabled = false;
    bg.drawImage(cv, 0, 0, 32, 32);
    return big;
  }
  FG.baitIcon = baitIcon;

})(window.FG);
