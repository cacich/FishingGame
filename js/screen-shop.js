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
      p.appendChild(FG.el('div', 'panel-title', '釣竿 <span class="sub">同時只有一支生效</span>'));
      FG.RODS.forEach(function (rod) {
        const owned = st.data.rods.indexOf(rod.id) >= 0;
        const using = st.data.rod === rod.id;
        const row = FG.el('div', 'item');

        const th = FG.el('div', 'thumb');
        th.appendChild(rodIcon(rod));
        row.appendChild(th);

        const info = FG.el('div', 'info');
        // 釣竿的 loc 只是**主題標籤**，竿子在哪都能用（跟裝備的「專屬」不同），
        // 所以標籤文字刻意用「主題」而不是「專屬」
        info.innerHTML =
          '<div class="nm">' + FG.esc(rod.name) +
          (rod.loc ? ' <span class="tag">' + FG.esc(FG.locById(rod.loc).name) + '主題</span>' : '') +
          (using ? ' <span class="tag" style="color:#5fd08a">使用中</span>' : '') + '</div>' +
          '<div class="ds">' + FG.esc(rod.desc) +
          '<br>魚王出現率 ×' + rod.kingMul.toFixed(3) +
          '　體型 +' + Math.round(rod.sizeBonus * 100) + '%</div>';
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
          (b.loc ? ' <span class="tag">' + FG.esc(FG.locById(b.loc).name) + '主題</span>' : '') +
          (using ? ' <span class="tag" style="color:#5fd08a">使用中</span>' : '') + '</div>' +
          '<div class="ds">' + FG.esc(b.desc) +
          '<br>大獎倍率 ×' + b.jackpotMul.toFixed(2) +
          '　雜物 ×' + b.junkMul.toFixed(2) + '</div>';
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
      tip.innerHTML = '<div class="tiny mute" style="line-height:1.8">餌料越貴，傳說與魚王的賠付倍率越高、雜物越少。' +
        '可在釣魚畫面點「餌料」快速切換，或在此查看即時倍率。</div>';
      root.appendChild(tip);
    },

    /* ---------------- 裝備 ---------------- */
    renderEquips: function (root) {
      const st = FG.state;
      const p = FG.el('div', 'panel');
      p.appendChild(FG.el('div', 'panel-title', '裝備 <span class="sub">永久生效，可同時持有</span>'));
      const curLoc = st.data.loc;
      FG.EQUIPS.forEach(function (e) {
        const owned = st.data.equips.indexOf(e.id) >= 0;
        const only = e.effect && e.effect.loc;
        const active = !only || only === curLoc;
        const row = FG.el('div', 'item' + (owned ? ' owned' : ''));

        const th = FG.el('div', 'thumb');
        th.appendChild(equipIcon(e));
        row.appendChild(th);

        const info = FG.el('div', 'info');
        // 專屬裝備要標出釣點，並在「目前不在那個釣點」時明講沒生效，
        // 否則玩家會以為買了沒用（這是買了就永久生效的裝備列裡唯一的例外）
        const locTag = only
          ? ' <span class="tag" style="color:' + (active ? '#5fd08a' : '#94a7bb') + '">' +
            FG.esc(FG.locById(only).name) + '專屬</span>'
          : '';
        info.innerHTML = '<div class="nm">' + FG.esc(e.name) + locTag +
          (owned ? ' <span class="tag" style="color:#5fd08a">已持有</span>' : '') + '</div>' +
          '<div class="ds">' + FG.esc(e.desc) +
          (owned && only && !active ? '<br><span style="color:#ff9a5f">目前不在該釣點，效果未生效。</span>' : '') +
          '</div>';
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
    // ⚠️ 這兩張色表必須跟 FG.RODS 一樣長，而且順序對齊。
    // 原本只有 5 筆、又是用 cols[idx] 直接取（沒有取餘數），加第 6 支竿就會拿到
    // undefined → 圖示整個消失。加竿子時記得同步補一組配色。
    const idx = FG.RODS.indexOf(rod) % 23;
    // ★ 兩張表的長度必須等於 FG.RODS.length（目前 23）。插新竿子時要把配色
    //   插在同一個位置，否則後面所有竿子的圖示顏色會整排位移。
    const cols = ['#8a6a3a', '#9aa86a', '#7f9a5f', '#5f8f5a', '#5fb0a8', '#4a7a86', '#a89478',
                  '#7f6a4a', '#4f7a70', '#3a3a44', '#8f7a90', '#c88fa8',
                  '#9ab6c8', '#9ab6c8', '#6fa87f', '#3f5a6a', '#8a3a4a',
                  '#7f6f4a', '#d8b45a', '#5f5a52', '#a4552e', '#b33b2d', '#d8e8f0'];
    const grip = ['#5a4020', '#5f6a34', '#4a5f30', '#3a5f38', '#2f6a68', '#33505a', '#6a5c44',
                  '#4f4028', '#2f524c', '#22222a', '#5a4a5c', '#8a5a70',
                  '#6a8494', '#6a8494', '#3f6a50', '#243848', '#5a2430',
                  '#4f4428', '#8f7020', '#38342c', '#6a3418', '#68251f', '#8f3540'];
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
      '..caab.bb.baac..', '..caabbbbbbaac..', '..caaaaaaaaaac..', '...cccccccccc...' ] },

    /* --- 釣點專屬裝備 --- */
    eq_mistlens: { pal: { a: '#4a5a68', b: '#9fd8e8', c: '#dff2fa' }, map: [
      '................', '..aaaa....aaaa..', '.abbbba..abbbba.', '.abcbbba abbbcba', '.abbbbba.abbbbba',
      '.abbbba..abbbba.', '..aaaa.aa.aaaa..', '................', '................' ] },
    eq_tidechart: { pal: { a: '#7f6a4a', b: '#e8dcc0', c: '#3f7a9a' }, map: [
      '................', '..aaaaaaaaaaaa..', '..abbbbbbbbbba..', '..abcc.cc.ccba..', '..abc.c.c.c.ba..',
      '..abbcbbbcbbba..', '..abbbbbbbbbba..', '..aaaaaaaaaaaa..', '................' ] },
    eq_charm: { pal: { a: '#c8442f', b: '#f0e2c8', c: '#3a2630' }, map: [
      '................', '......aa........', '.....aaaa.......', '....abbbba......', '....abccba......',
      '....abcbba......', '....abbbba......', '.....aaaa.......', '......cc........' ] },
    eq_auger: { pal: { a: '#8fa2ad', b: '#3a4a58', c: '#dff2fa' }, map: [
      '................', '.....bbbb.......', '.....baab.......', '......aa........', '.....caac.......',
      '......aa........', '.....caac.......', '......aa........', '.......a........' ] },
    eq_feeder: { pal: { a: '#6a6a72', b: '#c8b06a', c: '#3a3a42' }, map: [
      '................', '.....aaaaaa.....', '....abbbbbba....', '....abbbbbba....', '.....acccca.....',
      '......aaaa......', '.......cc.......', '......c..c......', '.....c....c.....' ] },
    eq_creel: { pal: { a: '#3f6a8a', b: '#cfe8f4', c: '#8fb4c8' }, map: [
      '................', '..aaaaaaaaaaaa..', '..abbbbbbbbbba..', '..abcbcbcbcbba..', '..abbcbcbcbcba..',
      '..abcbcbcbcbba..', '..abbbbbbbbbba..', '..aaaaaaaaaaaa..', '....a......a....' ] },
    eq_mask: { pal: { a: '#3a4a52', b: '#a8dcea', c: '#e8f4f8' }, map: [
      '................', '..aaaaaaaaaaaa..', '..abbbbbbbbbba..', '..abcbbbbbbcba..', '..abbbbbbbbbba..',
      '...aaaaaaaaaa...', '.....a....a.....', '......aaaa......', '.......aa.......' ] },
    eq_raft: { pal: { a: '#8a6a44', b: '#c8a46a', c: '#9fd0d8' }, map: [
      '................', '.....a....a.....', '.....a....a.....', '..bbbbbbbbbbbb..', '..baaaaaaaaaab..',
      '..bbbbbbbbbbbb..', '..cccccccccccc..', '...cccccccccc...', '................' ] },
    eq_teapot: { pal: { a: '#6a5f50', b: '#c8b48f', c: '#e8dcc0' }, map: [
      '................', '.......bb.......', '...aaaaaaaaa....', '..abbbbbbbbba.a.', '..abcccccccba.a.',
      '..abbbbbbbbba.a.', '...aaaaaaaaa..a.', '....aaaaaaa..aa.', '................' ] },
    eq_winch: { pal: { a: '#3f5a6a', b: '#8fa2ad', c: '#c8d8e0' }, map: [
      '................', '...bbbbbbbbbb...', '..baaaaaaaaaab..', '..bacccccccab...', '..bacbbbbbcab...',
      '..bacccccccab...', '..baaaaaaaaaab..', '...bbbbbbbbbb...', '.....b....b.....' ] },
    eq_runeplate: { pal: { a: '#6f6a78', b: '#d8c08f', c: '#3a3742' }, map: [
      '................', '..aaaaaaaaaaaa..', '..acbb.b.bbca...', '..ab.b.bb.b.ba..', '..abb.b.b.bbba..',
      '..ab.bb.b.b.ba..', '..acb.b.bb.bca..', '..aaaaaaaaaaaa..', '................' ] },
    eq_ankh: { pal: { a: '#d8b45a', b: '#fbf0c0', c: '#8f6a18' }, map: [
      '................', '.....abba.......', '....ab..ba......', '....ab..ba......', '..aaabbabaaa....',
      '.....abba.......', '......bb........', '......bb........', '......cc........' ] },
    eq_wading: { pal: { a: '#3f4a44', b: '#7f8a80', c: '#c8d0c8' }, map: [
      '................', '....aaaaa.......', '...abbbbba......', '...abbbbba......', '...abbbbbaa.....',
      '..abbbbbbbba....', '..aaaaaaaaaa....', '..cacacacaca....', '..c.c.c.c.c.....' ] },
    eq_viewbox: { pal: { a: '#8a6a44', b: '#a8dce8', c: '#e8f8fa' }, map: [
      '................', '..aaaaaaaaaaaa..', '..abbbbbbbbbba..', '..abcbbbbbbbba..', '..abbbbbbbbbba..',
      '..abbbbbbbbcba..', '..abbbbbbbbbba..', '..aaaaaaaaaaaa..', '...a........a...' ] },
    eq_potline: { pal: { a: '#8a7a5c', b: '#96694a', c: '#c08f66', k: '#241c18' }, map: [
      'aaaaaaaaaaaaaaaa', '...a....a....a..', '..bbb..bbb..bbb.', '..bccb.bccb.bccb', '..bcck.bcck.bcck',
      '..bccb.bccb.bccb', '...bb...bb...bb.', '................', '................' ] },
    eq_headlamp: { pal: { a: '#3a3a42', b: '#e8e0a8', c: '#fbf6d0' }, map: [
      '................', '...aaaaaaaaa....', '..aaaaaaaaaaa...', '..aa.......aa...', '.....aaaaa..cc..',
      '.....abbba.ccc..', '.....abcba.cccc.', '.....abbba.ccc..', '.....aaaaa..cc..' ] },
    eq_maplelantern: { pal: { a: '#a63128', b: '#f0b04f', c: '#4a2b24', d: '#df6a32' }, map: [
      '................', '......cc........', '.....cccc.......', '...aaaaaaaa.....', '...abbbbbba.....',
      '...abdbdbba.....', '...abbbbbba.....', '...aaaaaaaa.....', '.....c..c.......' ] },
    eq_foxmask: { pal: { a: '#eef3f4', b: '#cf4338', c: '#75a9c8', d: '#242a34' }, map: [
      '...aa......aa...', '..aaaa....aaaa..', '.aaaabaaaabaaaa.', '.aaabbbbbbbbaaa.', '..aabcaacbaaa...',
      '..aadaddadaaa...', '...aaabaaaaa....', '....aabbaa......', '.....aaaa.......' ] }
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
