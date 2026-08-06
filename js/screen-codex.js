/* ============================================================
   screen-codex.js — 圖鑑：依地點列出魚種、紀錄與傳說
   ============================================================ */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  const S = FG.screenCodex = {
    id: 'codex',
    label: '圖鑑',
    icon: 'book',
    el: null,
    locIdx: 0,

    build: function () {
      const el = FG.el('section', 'screen');
      el.id = 'screen-codex';
      // 釣點切換列用 seg-scroll：釣點數量會持續成長，等分擠壓會讓中文折行（見 styles.css）
      el.innerHTML = '<div class="scroll"><div class="seg seg-scroll" id="codexSeg"></div><div id="codexBody"></div></div>';
      this.el = el;
      FG.state.on('codex', function () { if (S.el) S.render(); });
      return el;
    },

    onShow: function () {
      const cur = FG.state.data.loc;
      const i = FG.LOCATIONS.findIndex(function (l) { return l.id === cur; });
      if (i >= 0) this.locIdx = i;
      this.render();
    },

    render: function () {
      if (!this.el) return;
      const st = FG.state;
      const self = this;

      // 地點切換列
      const seg = this.el.querySelector('#codexSeg');
      seg.innerHTML = '';
      let onBtn = null;
      FG.LOCATIONS.forEach(function (loc, i) {
        const b = FG.el('button', i === self.locIdx ? 'on' : '', loc.name);
        if (i === self.locIdx) onBtn = b;
        b.onclick = function () { FG.sfx.click(); self.locIdx = i; self.render(); };
        seg.appendChild(b);
      });
      // 目前選中的釣點若捲出可視範圍就拉回來——從釣魚畫面切進圖鑑時，
      // 當前釣點可能排在最後面，不捲的話玩家會以為圖鑑跳到了別的釣點
      if (onBtn) {
        const l = onBtn.offsetLeft, r = l + onBtn.offsetWidth;
        if (l < seg.scrollLeft || r > seg.scrollLeft + seg.clientWidth) {
          seg.scrollLeft = l - (seg.clientWidth - onBtn.offsetWidth) / 2;
        }
      }
      // 一定要在動過 scrollLeft **之後**才算邊緣提示。
      // 反過來的話會用舊的捲動位置算，漸層遮罩就會蓋在錯的一側
      // （scroll 事件是非同步的，補不回這一幀）
      FG.ui.scrollEdges(seg);

      const loc = FG.LOCATIONS[this.locIdx];
      const body = this.el.querySelector('#codexBody');
      body.innerHTML = '';

      if (!loc.fish.length) {
        const p = FG.el('div', 'panel');
        p.appendChild(FG.el('div', 'empty', FG.esc(loc.name) + ' 尚未開放。<br>' + FG.esc(loc.desc)));
        body.appendChild(p);
        return;
      }

      const prog = st.codexProgress(loc);
      const head = FG.el('div', 'panel');
      head.appendChild(FG.el('div', 'panel-title', FG.esc(loc.name) + ' <span class="sub">收集 ' + prog.got + '/' + prog.total + '</span>'));
      const bar = FG.el('div', 'bar');
      bar.innerHTML = '<i style="width:' + (prog.total ? prog.got / prog.total * 100 : 0) + '%"></i>';
      head.appendChild(bar);
      head.appendChild(FG.el('div', 'tiny mute', '<br>' + FG.esc(loc.desc)));
      body.appendChild(head);

      // 依稀有度分組
      FG.RARITY_ORDER.slice().reverse().forEach(function (rk) {
        const list = loc.fish.filter(function (f) { return f.rarity === rk; });
        if (!list.length) return;
        const R = FG.RARITY[rk];
        const p = FG.el('div', 'panel');
        const t = FG.el('div', 'panel-title', R.name + ' <span class="sub">' + list.length + ' 種</span>');
        t.style.color = R.color;
        p.appendChild(t);
        const grid = FG.el('div', 'codex-grid');
        list.forEach(function (f) {
          const rec = st.data.codex[f.id];
          const cell = FG.el('div', 'codex-cell' + (rec ? '' : ' locked'));
          cell.appendChild(FG.px.spriteEl(f, 1));
          cell.appendChild(FG.el('div', 'cn', rec ? FG.esc(f.name) : '？？？'));
          const cr = FG.el('div', 'cr', rec ? ('最大 ' + rec.maxLen.toFixed(1) + 'cm') : '未捕獲');
          cr.style.color = rec ? R.color : '#4a5a68';
          cell.appendChild(cr);
          cell.onclick = function () { FG.sfx.click(); detail(f, rec); };
          grid.appendChild(cell);
        });
        p.appendChild(grid);
        body.appendChild(p);
      });
    }
  };

  function detail(f, rec) {
    const R = FG.RARITY[f.rarity];
    const box = FG.el('div', 'catch-card');

    const bar = FG.el('div', 'rarity-bar', R.name);
    bar.style.background = R.color + '22';
    bar.style.color = R.color;
    bar.style.boxShadow = 'inset 0 -2px 0 ' + R.color + '66';
    box.appendChild(bar);

    const view = FG.el('div', 'fishview');
    const sp = FG.px.spriteEl(f, 3);
    if (!rec) sp.style.filter = 'brightness(0) opacity(.35)';
    view.appendChild(sp);
    box.appendChild(view);

    box.appendChild(FG.el('h3', '', rec ? FG.esc(f.name) : '？？？'));

    if (rec) {
      const stats = FG.el('div', 'stats');
      stats.innerHTML = '<span>捕獲 <b>' + rec.n + '</b> 次</span><span>最大 <b>' + rec.maxLen.toFixed(1) + ' cm</b></span>' +
        '<span>體型 <b>' + f.minLen + '–' + f.maxLen + ' cm</b></span>';
      box.appendChild(stats);
      if (f.legend) box.appendChild(FG.el('div', 'legend', FG.esc(f.legend)));
      box.appendChild(FG.el('div', 'tiny dim', FG.esc(f.desc || '')));
      // 賠付是「下注額的倍率」，不是絕對籌碼，所以這裡標倍率並附上目前下注額的換算
      box.appendChild(FG.el('div', 'tiny mute', '<br>基礎賠付 ×' +
        (f.mult >= 10 ? Math.round(f.mult) : f.mult.toFixed(2)) + ' 下注額'));
    } else {
      box.appendChild(FG.el('div', 'tiny mute', '尚未捕獲。<br>體型範圍 ' + f.minLen + '–' + f.maxLen + ' cm<br><br>' +
        (f.rarity === 'king' ? '魚王極為罕見，建議備妥高階釣竿與魚王秘餌。' : '繼續在該釣點下竿吧。')));
    }

    FG.ui.modal({ title: false, body: box, buttons: [{ label: '關閉', cls: 'ghost' }] });
  }

})(window.FG);
