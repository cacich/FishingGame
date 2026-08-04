/* ============================================================
   devtools.js — 隱藏的開發者面板

   打開方式：**快速連點底部「家園」分頁鈕 10 下**（每兩下間隔 < 600ms）。
   刻意不做按鈕、不做網址參數，正常玩家不會誤觸；而連點分頁鈕在手機上
   也按得出來，不需要鍵盤。

   兩個設計原則：

   1. **不污染存檔。** 所有開關只活在記憶體裡，重新整理就全部恢復。
      調試狀態寫進 localStorage 的話，忘了關會變成「我的遊戲壞了」，
      而那種 bug 最難查——玩家不會想到是自己三天前開的。

   2. **不改動遊戲邏輯的原始碼。** 必出稀有度是用「包住 state.rarityTable()」
      做的，不是在 rollCatch() 裡加 if。這樣體長、價值、閃光、圖鑑判定
      全部還是跑真正的那套程式，測出來的東西才有意義。
      掛勾在第一次打開面板時才安裝，沒打開過就完全沒有額外成本。
   ============================================================ */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  const TAP_NEED = 10;    // 需要連點幾下
  const TAP_GAP = 600;    // 兩下之間的最大間隔（毫秒）

  let taps = 0;
  let lastTap = 0;
  let hooked = false;

  const dev = FG.dev = {
    forceRarity: null,    // null = 不干預
    forceFishId: null,    // 優先於 forceRarity
    forceShiny: false,

    anyActive: function () {
      return !!(this.forceRarity || this.forceFishId || this.forceShiny);
    },
    open: function () { openPanel(); }
  };

  /* ------------------------------------------------------------
     掛勾

     rollCatch() 的流程是「rarityTable() 給出加權表 → weightedPick 選階級
     → FG.pick 從該階級的魚裡選一條 → 算體長/重量/價值/閃光」。

     所以只要讓 rarityTable() 回傳「只剩目標那一列」的表，後面整段完全不用動，
     抽出來的魚就是真的按遊戲規則生成的。這比在 rollCatch 裡塞 if 乾淨得多，
     也不會讓調試碼混進正式邏輯。

     副作用（刻意保留）：釣魚畫面的「查看費率」會顯示 100%。那正好是
     「我現在開著必出」的提醒。
     ------------------------------------------------------------ */
  function installHooks() {
    if (hooked) return;
    hooked = true;
    const st = FG.state;
    const realTable = st.rarityTable;
    const realRoll = st.rollCatch;

    st.rarityTable = function (loc) {
      const rows = realTable.call(this, loc);
      const L = loc || this.loc();

      if (dev.forceFishId) {
        const f = (L.fish || []).filter(function (x) { return x.id === dev.forceFishId; })[0];
        if (f) return [{ key: f.rarity, rarity: FG.RARITY[f.rarity], weight: 1, pct: 1, fish: [f] }];
      }
      if (dev.forceRarity) {
        const only = rows.filter(function (r) { return r.key === dev.forceRarity; })[0];
        // 該釣點沒有這個階級的魚就不干預（選單本來就只列得出有的，這是保險）
        if (only) return [{ key: only.key, rarity: only.rarity, weight: 1, pct: 1, fish: only.fish }];
      }
      return rows;
    };

    st.rollCatch = function (loc) {
      const inst = realRoll.call(this, loc);
      if (dev.forceShiny && !inst.shiny) {
        const f = FG.fishById(inst.fishId);
        // 雜物不會閃光，這裡要跟 rollCatch 的原始條件一致
        if (f && !f.junkArt) {
          inst.shiny = true;
          inst.value = Math.max(1, Math.round(inst.value * 3));   // 與原始的 shiny ×3 相同
        }
      }
      return inst;
    };
  }

  /* ------------------------------------------------------------
     角落的 DEBUG 標記

     只要有任何一個開關是開的就掛上。沒有這個東西，玩家（或三天後的自己）
     會忘記自己開著必出魚王，然後開始懷疑機率算錯了。
     ------------------------------------------------------------ */
  function refreshFlag() {
    let el = document.getElementById('devFlag');
    if (!dev.anyActive()) {
      if (el && el.parentNode) el.parentNode.removeChild(el);
      return;
    }
    if (!el) {
      el = FG.el('button', '', 'DEBUG');
      el.id = 'devFlag';
      el.title = '開發者模式進行中，點我打開面板';
      el.onclick = function () { openPanel(); };
      document.body.appendChild(el);
    }
    const bits = [];
    if (dev.forceFishId) {
      const f = FG.fishById(dev.forceFishId);
      bits.push('必出 ' + (f ? f.name : dev.forceFishId));
    } else if (dev.forceRarity) {
      bits.push('必出 ' + FG.RARITY[dev.forceRarity].name);
    }
    if (dev.forceShiny) bits.push('全閃光');
    el.textContent = 'DEBUG · ' + bits.join(' · ');
  }

  /* ------------------------------------------------------------
     面板
     ------------------------------------------------------------ */
  function openPanel() {
    installHooks();
    const st = FG.state;
    const loc = st.loc();
    const box = FG.el('div', 'devpanel');

    box.appendChild(note('這裡的開關<b>只活在這次執行</b>，重新整理就全部恢復，' +
      '也不會寫進存檔。開著的時候左上角會有 DEBUG 標記。'));

    /* ---- 抽獎控制 ---- */
    box.appendChild(head('抽獎控制'));

    // 只列這個釣點真的有的階級——列出沒有的會選了沒反應，比較難查
    const have = {};
    loc.fish.forEach(function (f) { have[f.rarity] = true; });
    const rarityOpts = [{ v: null, t: '不干預' }].concat(
      FG.RARITY_ORDER.filter(function (k) { return have[k]; })
        .map(function (k) { return { v: k, t: FG.RARITY[k].name }; })
    );

    const raritySeg = seg('必出稀有度', rarityOpts, dev.forceRarity, function (v) {
      dev.forceRarity = v;
      if (v) { dev.forceFishId = null; fishSel.value = ''; }   // 兩者互斥，指定魚種優先
      refreshFlag(); refreshWhy();
    });
    box.appendChild(raritySeg);

    const fishSel = FG.el('select', 'dev-select');
    fishSel.appendChild(new Option('（不干預）', ''));
    FG.RARITY_ORDER.slice().reverse().forEach(function (k) {
      const list = loc.fish.filter(function (f) { return f.rarity === k; });
      if (!list.length) return;
      const g = document.createElement('optgroup');
      g.label = FG.RARITY[k].name;
      list.forEach(function (f) { g.appendChild(new Option(f.name, f.id)); });
      fishSel.appendChild(g);
    });
    fishSel.value = dev.forceFishId || '';
    fishSel.onchange = function () {
      dev.forceFishId = fishSel.value || null;
      if (dev.forceFishId) {
        dev.forceRarity = null;
        FG.$$('button', raritySeg).forEach(function (b, i) { b.classList.toggle('on', i === 0); });
      }
      refreshFlag(); refreshWhy();
    };
    box.appendChild(row('必出魚種（' + FG.esc(loc.name) + '）', fishSel));

    box.appendChild(seg('必出閃光', [{ v: false, t: '關' }, { v: true, t: '開' }], dev.forceShiny, function (v) {
      dev.forceShiny = v; refreshFlag(); refreshWhy();
    }));

    const why = note('');
    function refreshWhy() {
      if (!dev.anyActive()) { why.innerHTML = '目前沒有任何干預，抽獎照正常機率跑。'; return; }
      why.innerHTML = '⚠️ 干預中：' +
        (dev.forceFishId ? '固定抽出<b>' + FG.esc((FG.fishById(dev.forceFishId) || {}).name || '') + '</b>'
          : dev.forceRarity ? '固定抽出<b>' + FG.RARITY[dev.forceRarity].name + '</b>階級'
            : '') +
        (dev.forceShiny ? (dev.forceFishId || dev.forceRarity ? '，' : '') + '並且<b>一定閃光</b>' : '') +
        '。<br>體長、重量、價值、圖鑑判定仍然照真正的公式算，所以測出來的數字是可信的。' +
        '「查看費率」會顯示 100%，那是預期的。';
    }
    refreshWhy();
    box.appendChild(why);

    /* ---- 演出 ---- */
    box.appendChild(head('演出'));

    const ciSel = FG.el('select', 'dev-select');
    FG.LOCATIONS.forEach(function (L) {
      const list = L.fish.filter(function (f) {
        return FG.RARITY[f.rarity].order >= FG.RARITY.legend.order;
      });
      if (!list.length) return;
      const g = document.createElement('optgroup');
      g.label = L.name;
      list.forEach(function (f) {
        g.appendChild(new Option((f.rarity === 'king' ? '★ ' : '') + f.name, f.id));
      });
      ciSel.appendChild(g);
    });
    box.appendChild(row('立即播放 cut-in', ciSel));

    const ciRow = FG.el('div', 'row');
    [['播放', false], ['播放（閃光版）', true]].forEach(function (p) {
      const b = FG.el('button', 'btn', p[0]);
      b.onclick = function () {
        const f = FG.fishById(ciSel.value);
        if (!f) return;
        FG.ui.closeAll();
        FG.go('fishing');   // 疊層掛在 #stageWrap 上，不在釣魚頁就看不到
        const mount = FG.screenFishing.el.querySelector('#stageWrap');
        FG.cutin.play(mount, f, { fishId: f.id, shiny: p[1] }, FG.cutin.plan(f));
      };
      ciRow.appendChild(b);
    });
    box.appendChild(ciRow);
    box.appendChild(note('不用真的釣到就能看演出，也不會動到存檔。' +
      '傳說以上才有 cut-in，所以清單只列傳說與魚王。'));

    /* ---- 資源 ---- */
    box.appendChild(head('資源'));

    const chipRow = FG.el('div', 'row');
    [10000, 100000, 1000000, 100000000].forEach(function (n) {
      const b = FG.el('button', 'btn tiny-btn', '+' + FG.fmtShort(n));
      b.onclick = function () { st.addChips(n); FG.ui.toast('籌碼 +' + FG.fmt(n), 'gold'); refreshInfo(); };
      chipRow.appendChild(b);
    });
    const zero = FG.el('button', 'btn tiny-btn danger', '歸零');
    zero.onclick = function () {
      st.addChips(-st.data.chips);
      FG.ui.toast('籌碼歸零', 'bad'); refreshInfo();
    };
    chipRow.appendChild(zero);
    box.appendChild(row('籌碼', chipRow));

    const miscRow = FG.el('div', 'row');
    const baitBtn = FG.el('button', 'btn', '目前餌料 +99');
    baitBtn.onclick = function () {
      const b = st.bait();
      st.data.baits[b.id] = (st.data.baits[b.id] || 0) + 99;
      st.save(); st.emit('gear');
      FG.ui.toast(b.name + ' +99', 'good'); refreshInfo();
    };
    const tankBtn = FG.el('button', 'btn', '魚缸拉到最大');
    tankBtn.onclick = function () {
      st.data.tankLevel = FG.TANK_LEVELS.length;
      st.save(); st.emit('tank'); st.emit('all');
      FG.ui.toast('魚缸 Lv.' + st.data.tankLevel + '（' + st.tankCap() + ' 格）', 'gold');
      refreshInfo();
    };
    miscRow.appendChild(baitBtn);
    miscRow.appendChild(tankBtn);
    box.appendChild(row('其他', miscRow));

    /* ---- 圖鑑 ---- */
    box.appendChild(head('圖鑑'));
    const codexRow = FG.el('div', 'row');
    const fillBtn = FG.el('button', 'btn', '全部解鎖');
    fillBtn.onclick = function () {
      let n = 0;
      FG.LOCATIONS.forEach(function (L) {
        L.fish.forEach(function (f) {
          if (st.data.codex[f.id]) return;
          st.data.codex[f.id] = { n: 1, maxLen: f.maxLen, first: Date.now() };
          n++;
        });
      });
      st.save(); st.emit('codex');
      FG.ui.toast('補上 ' + n + " 種", 'gold'); refreshInfo();
    };
    const wipeBtn = FG.el('button', 'btn danger', '全部清空');
    wipeBtn.onclick = function () {
      FG.ui.confirm('清空圖鑑', '會刪掉<b>所有</b>圖鑑紀錄（籌碼、魚缸、裝備不動）。<br>這個動作沒辦法復原。',
        '清空', function () {
          st.data.codex = {};
          st.save(); st.emit('codex');
          FG.ui.toast('圖鑑已清空', 'bad'); refreshInfo();
        }, 'danger');
    };
    codexRow.appendChild(fillBtn);
    codexRow.appendChild(wipeBtn);
    box.appendChild(codexRow);

    /* ---- 目前數值 ---- */
    box.appendChild(head('目前數值'));
    const info = FG.el('div');
    function refreshInfo() {
      const L = st.loc();
      const b = st.bonus(L);
      const prog = st.codexProgress(L);
      info.innerHTML = '<table class="rate-tbl">' +
        tr('釣點', L.name + '（拋竿 ' + FG.fmt(st.castCost(L)) + '）') +
        tr('籌碼', FG.fmt(st.data.chips)) +
        tr('餌料', st.bait().name + ' ×' + st.baitCount()) +
        tr('魚缸', 'Lv.' + st.data.tankLevel + '　' + st.data.tank.length + '/' + st.tankCap()) +
        tr('圖鑑', prog.got + '/' + prog.total) +
        tr('rareMul', b.rareMul.toFixed(3)) +
        tr('kingMul', b.kingMul.toFixed(3)) +
        tr('valueMul', b.valueMul.toFixed(3)) +
        tr('costMul', b.costMul.toFixed(3)) +
        tr('sizeBonus', b.sizeBonus.toFixed(3)) +
        tr('showHint（聲納）', b.showHint ? '有' : '無') +
        '</table>';
    }
    refreshInfo();
    box.appendChild(info);
    box.appendChild(note('這張表是 <code>state.bonus(loc)</code> 的實際回傳值，' +
      '調完裝備／裝飾可以在這裡直接對答案，不用開 console。'));

    FG.ui.modal({
      title: '開發者面板',
      body: box,
      buttons: [{ label: '關閉', cls: 'ghost' }],
      onClose: refreshFlag
    });
  }

  /* ---------------- 小工具（形狀比照 screen-fishing 的自動模式設定畫面） ---------------- */

  function head(text) {
    return FG.el('div', 'dev-head', FG.esc(text));
  }
  function row(label, child) {
    const w = FG.el('div', 'set-row');
    w.appendChild(FG.el('div', 'set-label', label));
    w.appendChild(child);
    return w;
  }
  function note(html) {
    const n = FG.el('div', 'tiny mute', html);
    n.style.cssText = 'margin:-4px 0 12px;line-height:1.7';
    return n;
  }
  function tr(k, v) {
    return '<tr><td>' + FG.esc(k) + '</td><td>' + FG.esc(v) + '</td></tr>';
  }
  function seg(label, opts, cur, onPick) {
    const w = FG.el('div', 'set-row');
    w.appendChild(FG.el('div', 'set-label', label));
    const s = FG.el('div', 'seg seg-sm seg-scroll');
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
    FG.ui.scrollEdges(s);
    return w;
  }

  /* ------------------------------------------------------------
     連點觸發

     用 capture 階段掛在 document 上，所以完全不用改 main.js 的
     buildTabs()——那裡只多了一個 data-tab 屬性讓這裡認得出是哪一頁。
     不 preventDefault，所以連點的同時分頁照常切到家園。
     ------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    const btn = e.target && e.target.closest && e.target.closest('#tabbar button');
    if (!btn || btn.dataset.tab !== 'home') { taps = 0; return; }

    const now = Date.now();
    taps = (now - lastTap < TAP_GAP) ? taps + 1 : 1;
    lastTap = now;

    // 後半段給一點回饋，否則玩家不知道自己快按到了（也讓誤觸的人有機會停手）
    if (taps >= TAP_NEED) {
      taps = 0;
      FG.sfx.win();
      openPanel();
    } else if (taps >= TAP_NEED - 4) {
      FG.ui.toast('再 ' + (TAP_NEED - taps) + ' 下…', '', 700);
    }
  }, true);

})(window.FG);
