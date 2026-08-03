/* ============================================================
   screen-shop.js — 商店（釣竿 / 餌料 / 裝備）
   ============================================================ */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  const S = FG.screenShop = {
    id: 'shop',
    label: '商店',
    icon: 'bag',
    el: null,
    tab: 'rod',

    build: function () {
      const el = FG.el('section', 'screen');
      el.id = 'screen-shop';
      el.innerHTML =
        '<div class="scroll">' +
          '<div class="seg" id="shopSeg">' +
            '<button data-t="rod">釣竿</button>' +
            '<button data-t="bait">餌料</button>' +
            '<button data-t="equip">裝備</button>' +
          '</div>' +
          '<div id="shopList"></div>' +
        '</div>';
      this.el = el;
      const self = this;
      FG.$$('#shopSeg button', el).forEach(function (b) {
        b.onclick = function () { FG.sfx.click(); self.tab = b.dataset.t; self.render(); };
      });
      FG.state.on('gear', function () { if (S.el) S.render(); });
      FG.state.on('chips', function () { if (S.el) S.render(); });
      return el;
    },

    onShow: function (arg) {
      if (arg) this.tab = arg;
      this.render();
    },

    render: function () {
      if (!this.el) return;
      FG.$$('#shopSeg button', this.el).forEach((b) => b.classList.toggle('on', b.dataset.t === this.tab));
      const list = this.el.querySelector('#shopList');
      list.innerHTML = '';
      if (this.tab === 'rod') this.renderRods(list);
      else if (this.tab === 'bait') this.renderBaits(list);
      else this.renderEquips(list);
    },

    /* ---------------- 釣竿 ---------------- */
    renderRods: function (root) {
      const st = FG.state;
      const p = FG.el('div', 'panel');
      p.appendChild(FG.el('div', 'panel-title', '釣竿 <span class="sub">影響稀有度與體型</span>'));
      FG.RODS.forEach(function (rod) {
        const owned = st.data.rods.indexOf(rod.id) >= 0;
        const using = st.data.rod === rod.id;
        const row = FG.el('div', 'item');

        const th = FG.el('div', 'thumb');
        th.appendChild(rodIcon(rod));
        row.appendChild(th);

        const info = FG.el('div', 'info');
        info.innerHTML =
          '<div class="nm">' + FG.esc(rod.name) + (using ? ' <span class="tag" style="color:#5fd08a">使用中</span>' : '') + '</div>' +
          '<div class="ds">' + FG.esc(rod.desc) + '<br>稀有 ×' + rod.rareMul.toFixed(2) +
          '　體型 +' + Math.round(rod.sizeBonus * 100) + '%' +
          (rod.kingMul > 1 ? '　魚王 ×' + rod.kingMul.toFixed(1) : '') + '</div>';
        row.appendChild(info);

        const act = FG.el('div', 'act');
        if (using) {
          act.appendChild(FG.el('div', 'tiny mute center', '已裝備'));
        } else if (owned) {
          const b = FG.el('button', 'btn primary', '裝備');
          b.onclick = function () { FG.sfx.click(); st.equipRod(rod); FG.ui.toast('已換上 ' + rod.name, 'good'); };
          act.appendChild(b);
        } else {
          const b = FG.el('button', 'btn gold', FG.fmtShort(rod.price));
          b.onclick = function () {
            FG.sfx.click();
            FG.ui.confirm('購買 ' + rod.name, '花費 <span class="money">' + FG.fmt(rod.price) + '</span> 籌碼購買並立即裝備？', '購買', function () {
              const r = st.buyRod(rod);
              if (r === 'ok') { FG.sfx.coin(); FG.ui.toast('入手 ' + rod.name + '！', 'gold'); }
              else if (r === 'poor') { FG.sfx.fail(); FG.openTopup('籌碼不足'); }
            }, 'gold');
          };
          act.appendChild(b);
        }
        row.appendChild(act);
        p.appendChild(row);
      });
      root.appendChild(p);
    },

    /* ---------------- 餌料 ---------------- */
    renderBaits: function (root) {
      const st = FG.state;
      const p = FG.el('div', 'panel');
      p.appendChild(FG.el('div', 'panel-title', '餌料 <span class="sub">每次拋竿消耗 1 個</span>'));
      FG.BAITS.forEach(function (b) {
        const have = st.data.baits[b.id] || 0;
        const using = st.data.bait === b.id;
        const row = FG.el('div', 'item');

        const th = FG.el('div', 'thumb');
        th.appendChild(FG.baitIcon(b));
        row.appendChild(th);

        const info = FG.el('div', 'info');
        info.innerHTML =
          '<div class="nm">' + FG.esc(b.name) + ' <span class="tag">庫存 ' + have + '</span>' +
          (using ? ' <span class="tag" style="color:#5fd08a">使用中</span>' : '') + '</div>' +
          '<div class="ds">' + FG.esc(b.desc) + '<br>稀有 ×' + b.rareMul.toFixed(2) +
          '　雜物 ×' + b.junkMul.toFixed(2) +
          (b.kingMul > 1 ? '　魚王 ×' + b.kingMul.toFixed(1) : '') + '</div>';
        row.appendChild(info);

        const act = FG.el('div', 'act');
        const buy = FG.el('button', 'btn gold', '×' + b.pack + '　' + FG.fmtShort(b.price * b.pack));
        buy.onclick = function () {
          FG.sfx.click();
          const r = st.buyBait(b, 1);
          if (r === 'ok') { FG.sfx.coin(); FG.ui.toast('購入 ' + b.name + ' ×' + b.pack, 'gold'); }
          else { FG.sfx.fail(); FG.openTopup('籌碼不足'); }
        };
        act.appendChild(buy);
        if (have > 0 && !using) {
          const use = FG.el('button', 'btn', '選用');
          use.onclick = function () { FG.sfx.click(); st.selectBait(b.id); };
          act.appendChild(use);
        }
        row.appendChild(act);
        p.appendChild(row);
      });
      root.appendChild(p);

      const tip = FG.el('div', 'panel');
      tip.innerHTML = '<div class="tiny mute" style="line-height:1.8">餌料越貴，抽到稀有魚與魚王的權重越高、雜物越少。' +
        '可在釣魚畫面點「餌料」快速切換，或在此查看即時倍率。</div>';
      root.appendChild(tip);
    },

    /* ---------------- 裝備 ---------------- */
    renderEquips: function (root) {
      const st = FG.state;
      const p = FG.el('div', 'panel');
      p.appendChild(FG.el('div', 'panel-title', '裝備 <span class="sub">永久生效，可同時持有</span>'));
      FG.EQUIPS.forEach(function (e) {
        const owned = st.data.equips.indexOf(e.id) >= 0;
        const row = FG.el('div', 'item' + (owned ? ' owned' : ''));

        const th = FG.el('div', 'thumb');
        th.appendChild(equipIcon(e));
        row.appendChild(th);

        const info = FG.el('div', 'info');
        info.innerHTML = '<div class="nm">' + FG.esc(e.name) +
          (owned ? ' <span class="tag" style="color:#5fd08a">已持有</span>' : '') + '</div>' +
          '<div class="ds">' + FG.esc(e.desc) + '</div>';
        row.appendChild(info);

        const act = FG.el('div', 'act');
        if (owned) act.appendChild(FG.el('div', 'tiny mute center', '生效中'));
        else {
          const b = FG.el('button', 'btn gold', FG.fmtShort(e.price));
          b.onclick = function () {
            FG.sfx.click();
            FG.ui.confirm('購買 ' + e.name, FG.esc(e.desc) + '<br><br>花費 <span class="money">' + FG.fmt(e.price) + '</span> 籌碼？', '購買', function () {
              const r = st.buyEquip(e);
              if (r === 'ok') { FG.sfx.coin(); FG.ui.toast('入手 ' + e.name + '！', 'gold'); }
              else { FG.sfx.fail(); FG.openTopup('籌碼不足'); }
            }, 'gold');
          };
          act.appendChild(b);
        }
        row.appendChild(act);
        p.appendChild(row);
      });
      root.appendChild(p);
    }
  };

  /* ---------------- 小圖示 ---------------- */
  function rodIcon(rod) {
    const idx = FG.RODS.indexOf(rod);
    const cols = ['#8a6a3a', '#4a7a86', '#3a3a44', '#9ab6c8', '#8a3a4a'];
    const grip = ['#5a4020', '#33505a', '#22222a', '#6a8494', '#5a2430'];
    const cv = FG.px.make(16, 16);
    const g = cv.getContext('2d');
    for (let i = 0; i < 13; i++) {
      g.fillStyle = i < 4 ? grip[idx] : cols[idx];
      g.fillRect(2 + i, 13 - i, 2, 2);
    }
    g.fillStyle = '#dfe8ef';
    g.fillRect(14, 1, 1, 1);
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(230,245,250,.6)'; g.fillRect(14, 2 + i, 1, 1); }
    const big = FG.px.make(32, 32);
    const bg = big.getContext('2d'); bg.imageSmoothingEnabled = false;
    bg.drawImage(cv, 0, 0, 32, 32);
    return big;
  }

  const EQUIP_ART = {
    eq_hat: { pal: { a: '#5b7a4a', b: '#3f5a34', c: '#c8b06a' }, map: [
      '................', '.....aaaaaa.....', '....aaaaaaaa....', '....abbbbbba....',
      '...aaaaaaaaaa...', '..aaaaaaaaaaaa..', '.acccccccccccca.', '..aaaaaaaaaaaa..', '................' ] },
    eq_vest: { pal: { a: '#c8a23a', b: '#8a6a20', c: '#3a3a44' }, map: [
      '................', '...aa......aa...', '..aaaa....aaaa..', '..aaaaaaaaaaaa..', '..aabbbbbbbbaa..',
      '..aabbccccbbaa..', '..aabbbbbbbbaa..', '..aaaaaaaaaaaa..', '...aaaaaaaaaa...' ] },
    eq_basket: { pal: { a: '#a5814a', b: '#7a5c30', c: '#c8a86a' }, map: [
      '................', '....aaaaaaaa....', '...abababababa..', '...aaaaaaaaaaa..', '...cbcbcbcbcbc..',
      '...aaaaaaaaaaa..', '....bcbcbcbc....', '....aaaaaaaa....', '................' ] },
    eq_clover: { pal: { a: '#4fb45a', b: '#2f7a3a', c: '#7ad884' }, map: [
      '................', '....aa..aa......', '...acca.acca....', '...aaaa.aaaa....', '.....aaaa.......',
      '...aaaa.aaaa....', '...acca.acca....', '....aa..aa......', '......bb........' ] },
    eq_sonar: { pal: { a: '#3a4a58', b: '#59d8ff', c: '#8fa2ad' }, map: [
      '................', '...cccccccccc...', '..caaaaaaaaaac..', '..caabbbbbbaac..', '..caab....baac..',
      '..caab.bb.baac..', '..caabbbbbbaac..', '..caaaaaaaaaac..', '...cccccccccc...' ] }
  };

  function equipIcon(e) {
    const def = EQUIP_ART[e.id];
    const cv = FG.px.make(32, 32);
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    if (def) {
      const small = FG.px.make(16, 16);
      FG.px.drawMap(small.getContext('2d'), def.map, def.pal, 0, 3, 1);
      g.drawImage(small, 0, 0, 32, 32);
    }
    return cv;
  }

})(window.FG);
