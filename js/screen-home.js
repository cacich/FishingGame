/* ============================================================
   screen-home.js — 家園：魚缸展示、擴建、裝飾
   ============================================================ */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  const S = FG.screenHome = {
    id: 'home',
    label: '家園',
    icon: 'house',
    el: null, ctx: null,
    swimmers: {},   // uid -> { x, y, dir, spd, ph }
    tankRect: null,

    build: function () {
      const el = FG.el('section', 'screen');
      el.id = 'screen-home';
      el.innerHTML =
        '<div id="homeStageWrap">' +
          '<canvas id="homeStage"></canvas>' +
          '<div class="home-tip" id="homeTip"></div>' +
        '</div>' +
        '<div class="scroll" id="homeScroll"></div>';
      this.el = el;
      const cv = el.querySelector('#homeStage');
      cv.width = FG.px.roomSize.w;
      cv.height = FG.px.roomSize.h;
      this.ctx = cv.getContext('2d');

      FG.state.on('tank', function () { if (S.el) S.render(); });
      FG.state.on('chips', function () { if (S.el) S.render(); });
      return el;
    },

    onShow: function () { this.render(); },

    render: function () {
      if (!this.el) return;
      const st = FG.state;
      const root = this.el.querySelector('#homeScroll');
      root.innerHTML = '';

      this.el.querySelector('#homeTip').textContent =
        '魚缸 Lv.' + st.data.tankLevel + '　展示 ' + st.data.tank.length + '/' + st.tankCap();

      /* --- 魚缸擴建 --- */
      const p1 = FG.el('div', 'panel');
      p1.appendChild(FG.el('div', 'panel-title', '魚缸擴建 <span class="sub">Lv.' + st.data.tankLevel + '</span>'));
      const next = FG.TANK_LEVELS[st.data.tankLevel];
      if (next) {
        const row = FG.el('div', 'row');
        row.innerHTML = '<div class="info" style="flex:1"><div class="nm">升級至 Lv.' + next.level + '</div>' +
          '<div class="ds tiny mute">展示上限 ' + st.tankCap() + ' → ' + next.cap + ' 隻，缸體也會變大</div></div>';
        const b = FG.el('button', 'btn gold', FG.fmtShort(next.price));
        b.onclick = function () {
          FG.sfx.click();
          FG.ui.confirm('魚缸擴建', '花費 <span class="money">' + FG.fmt(next.price) + '</span> 籌碼升級到 Lv.' + next.level + '？', '擴建', function () {
            const r = st.upgradeTank();
            if (r === 'ok') { FG.sfx.win(); FG.ui.toast('魚缸擴建完成！', 'gold'); }
            else if (r === 'poor') { FG.sfx.fail(); FG.openTopup('籌碼不足'); }
          }, 'gold');
        };
        row.appendChild(b);
        p1.appendChild(row);
      } else {
        p1.appendChild(FG.el('div', 'tiny mute', '已達最高等級，這缸夠養一輩子了。'));
      }
      root.appendChild(p1);

      /* --- 收藏清單 --- */
      const p2 = FG.el('div', 'panel');
      p2.appendChild(FG.el('div', 'panel-title', '展示中的漁獲 <span class="sub">' + st.data.tank.length + '/' + st.tankCap() + '</span>'));
      if (!st.data.tank.length) {
        p2.appendChild(FG.el('div', 'empty', '魚缸還空著。<br>去釣點釣魚，在結果畫面選「收藏展示」就會放進來。'));
      } else {
        st.data.tank.slice().reverse().forEach(function (inst) {
          const fish = FG.fishById(inst.fishId);
          if (!fish) return;
          const R = FG.RARITY[fish.rarity];
          const row = FG.el('div', 'item');
          const th = FG.el('div', 'thumb');
          th.appendChild(FG.px.spriteEl(fish, 1));
          row.appendChild(th);
          const info = FG.el('div', 'info');
          info.innerHTML = '<div class="nm">' + (inst.shiny ? '✦' : '') + FG.esc(fish.name) +
            ' <span class="tag" style="color:' + R.color + '">' + R.name + '</span></div>' +
            '<div class="ds">' + inst.len.toFixed(1) + ' cm　' + inst.weight.toFixed(2) + ' kg　' +
            '<span class="money">' + FG.fmt(inst.value) + '</span></div>';
          row.appendChild(info);
          const act = FG.el('div', 'act');
          const sell = FG.el('button', 'btn gold', '賣出');
          sell.onclick = function () {
            FG.sfx.click();
            FG.ui.confirm('賣出漁獲', '確定賣掉這隻 ' + FG.esc(fish.name) + '？<br>可獲得 <span class="money">' + FG.fmt(inst.value) + '</span> 籌碼。<br><span class="mute tiny">圖鑑紀錄會保留。</span>', '賣出', function () {
              st.sell(inst, true);
              FG.sfx.coin();
              FG.ui.toast('賣出獲得 ' + FG.fmt(inst.value) + ' 籌碼', 'gold');
            }, 'gold');
          };
          act.appendChild(sell);
          const rel = FG.el('button', 'btn ghost', '放生');
          rel.onclick = function () {
            FG.sfx.click();
            FG.ui.confirm('放生', '把這隻 ' + FG.esc(fish.name) + ' 放回水裡？不會獲得籌碼。', '放生', function () {
              st.release(inst);
              FG.ui.toast('已放生', 'good');
            });
          };
          act.appendChild(rel);
          row.appendChild(act);
          p2.appendChild(row);
        });
      }
      root.appendChild(p2);

      /* --- 裝飾 --- */
      const p3 = FG.el('div', 'panel');
      p3.appendChild(FG.el('div', 'panel-title', '家園裝飾 <span class="sub">部分裝飾有加成</span>'));
      FG.DECOS.forEach(function (d) {
        const owned = !!st.data.deco[d.id];
        const row = FG.el('div', 'item' + (owned ? ' owned' : ''));
        const th = FG.el('div', 'thumb');
        th.appendChild(decoIcon(d));
        row.appendChild(th);
        const info = FG.el('div', 'info');
        info.innerHTML = '<div class="nm">' + FG.esc(d.name) +
          (owned ? ' <span class="tag" style="color:#5fd08a">已擺放</span>' : '') + '</div>' +
          '<div class="ds">' + FG.esc(d.desc) + '</div>';
        row.appendChild(info);
        const act = FG.el('div', 'act');
        if (owned) act.appendChild(FG.el('div', 'tiny mute center', '—'));
        else {
          const b = FG.el('button', 'btn gold', FG.fmtShort(d.price));
          b.onclick = function () {
            FG.sfx.click();
            const r = st.buyDeco(d);
            if (r === 'ok') { FG.sfx.coin(); FG.ui.toast('已擺上 ' + d.name, 'gold'); }
            else { FG.sfx.fail(); FG.openTopup('籌碼不足'); }
          };
          act.appendChild(b);
        }
        row.appendChild(act);
        p3.appendChild(row);
      });
      root.appendChild(p3);

      /* --- 生涯統計 --- */
      const s = st.data.stats;
      const p4 = FG.el('div', 'panel');
      p4.appendChild(FG.el('div', 'panel-title', '生涯紀錄'));
      p4.innerHTML += '<div class="tiny dim" style="line-height:2">' +
        '拋竿次數　' + FG.fmt(s.casts) + '<br>' +
        '總漁獲　　' + FG.fmt(s.caught) + '<br>' +
        '賣出次數　' + FG.fmt(s.sold) + '<br>' +
        '累積收入　<span class="money">' + FG.fmt(s.earned) + '</span><br>' +
        '累積支出　<span class="money">' + FG.fmt(s.spent) + '</span><br>' +
        '釣獲魚王　' + FG.fmt(s.kings) + ' 次</div>';
      const setBtn = FG.el('button', 'btn ghost block', '設定 / 音效 / 重置存檔');
      setBtn.style.marginTop = '10px';
      setBtn.onclick = function () { FG.sfx.click(); FG.openSettings(); };
      p4.appendChild(setBtn);
      root.appendChild(p4);
    },

    /* ---------------- 每幀：房間 + 魚缸裡游動的魚 ---------------- */
    frame: function (now) {
      if (!this.ctx) return;
      const st = FG.state;
      // 牆上掛畫：目前釣點的縮圖（產一次就快取）
      if (this._posterLoc !== st.data.loc) {
        this._posterLoc = st.data.loc;
        this._poster = FG.px.locThumb(st.loc(), 60, 40);
      }
      const info = FG.px.drawRoom(this.ctx, {
        time: now,
        tankLevel: st.data.tankLevel,
        deco: st.data.deco,
        poster: this._poster
      });
      const T = info.tank;
      const g = this.ctx;
      const list = st.data.tank;

      // 保持 swimmer 狀態與收藏同步
      const alive = {};
      for (let i = 0; i < list.length; i++) {
        const inst = list[i];
        alive[inst.uid] = true;
        let sw = this.swimmers[inst.uid];
        if (!sw) {
          sw = this.swimmers[inst.uid] = {
            x: T.x + 6 + Math.random() * (T.w - 12),
            y: T.y + 6 + Math.random() * (T.h - 16),
            dir: Math.random() < 0.5 ? -1 : 1,
            spd: 0.12 + Math.random() * 0.16,
            ph: Math.random() * 100
          };
        }
        sw.x += sw.dir * sw.spd;
        if (sw.x < T.x + 8) { sw.x = T.x + 8; sw.dir = 1; }
        if (sw.x > T.x + T.w - 8) { sw.x = T.x + T.w - 8; sw.dir = -1; }
        const yy = sw.y + Math.sin(now * 0.0016 + sw.ph) * 3;

        const fish = FG.fishById(inst.fishId);
        if (!fish) continue;
        // 依實際體長略微縮放，讓大魚在缸裡看得出來
        const rel = FG.clamp(inst.len / Math.max(1, fish.maxLen), 0.35, 1);
        const scale = 0.2 + rel * 0.14;
        g.save();
        g.beginPath();
        g.rect(T.x, T.y, T.w, T.h);
        g.clip();
        // 精靈本身是朝右畫的（buildFish 的頭在 x 大的那一端），flip 才會變成朝左。
        // 所以往左游（dir < 0）的時候才要 flip，寫成 dir > 0 會整缸魚倒著游。
        FG.px.drawSprite(g, fish, sw.x, yy, scale, sw.dir < 0);
        g.restore();
      }
      for (const uid in this.swimmers) if (!alive[uid]) delete this.swimmers[uid];
    }
  };

  /* ---------------- 裝飾圖示 ---------------- */
  const DECO_ART = {
    rug:    { pal: { a: '#8c4a4a', b: '#a95c58', c: '#c9807a' }, map: ['................','................','..aaaaaaaaaaaa..','..abbbbbbbbbba..','..abccccccccba..','..abbbbbbbbbba..','..aaaaaaaaaaaa..','................'] },
    plant:  { pal: { a: '#3f8a4d', b: '#8a5a3a', c: '#57a95c' }, map: ['......aa........','....aacaa.......','...aacccaa......','....aacaa.......','.....aca........','.....bbb........','....bbbbb.......','....bbbbb.......'] },
    trophy: { pal: { a: '#e0b64a', b: '#f5db8a', c: '#7a5a38' }, map: ['...bbbbbb.......','...aaaaaa.......','...aaaaaa.......','....aaaa........','.....aa.........','....cccc........','...cccccc.......','................'] },
    cat:    { pal: { a: '#f2ece2', b: '#2a2a2a', c: '#d8a53a' }, map: ['..a..........a..','..aa........aa..','..aaaaaaaaaaaa..','..abaaaaaaba....','..aaaaaaaaaa....','..aaacccaaa.....','..aaaaaaaaa.....','..aaaaaaaaa.....'] },
    neon:   { pal: { a: '#59d8ff', b: '#2a5566' }, map: ['................','..aaaaaaaaaa....','..a........a....','..a........a....','..aaaaaaaaaa....','.....b..b.......','................','................'] },
    lamp:   { pal: { a: '#c9a24a', b: '#f2d98a', c: '#3a3038' }, map: ['.......c........','.......c........','.......c........','...aaaaaaaaa....','....bbbbbbb.....','.....bbbbb......','................','................'] },
    sarco:  { pal: { a: '#b8934a', b: '#2f3a58', c: '#f2e8c8', d: '#c8a04a' }, map: ['....aaaaaa......','...abbbbbba.....','...abcbbcba.....','...abbddbba.....','...abbbbbba.....','...abddddba.....','...abbbbbba.....','....aaaaaa......'] },
    shishi:    { pal: { a: '#a8b45f', b: '#6b5a34', c: '#7f7a70', d: '#bfe4f2' }, map: ['................','...aaaa.........','..aaaaaa........','...b...aaa......','...b......aa....','...b........d...','...b.....ccc....','...b....ccccc...'] },
    shellrack: { pal: { a: '#7a5a38', b: '#e8dcc0', c: '#d8b8a0', d: '#c8ccd8' }, map: ['..bb..cc..dd....','.bbbb.cccc.dddd.','aaaaaaaaaaaaaaa.','..cc..dd..bb....','.cccc.dddd.bbbb.','aaaaaaaaaaaaaaa.','..dd..bb..cc....','aaaaaaaaaaaaaaa.'] },
    cascade:   { pal: { a: '#6f6a60', b: '#dff2f8', c: '#9fd8e8' }, map: ['....aaaaaa......','....a....a......','......bb........','......cb........','......bb........','...aaaaaaaa.....','...abbbbbba.....','...aaaaaaaa.....'] },
    onsen:     { pal: { a: '#c8a46a', b: '#7f6438', c: '#9fd0d8', d: '#eef4f6' }, map: ['...d....d.......','....d..d........','..aaaaaaaaaa....','..acccccccca....','..bbbbbbbbbb....','..aaaaaaaaaa....','..bbbbbbbbbb....','..aaaaaaaaaa....'] },
    flybox:    { pal: { a: '#6b4f30', b: '#2f2a24', c: '#c85f4a', d: '#e0c04a', e: '#5f9ad8' }, map: ['aaaaaaaaaaaaaa..','abbbbbbabbbbba..','ab.c.d.ab.e.c.a.','ab.b.b.ab.b.b.a.','ab.e.c.ab.d.e.a.','ab.b.b.ab.b.b.a.','abbbbbbabbbbba..','aaaaaaaaaaaaaa..'] },
    floats:    { pal: { a: '#7fb8bf', b: '#bfe4e8', c: '#8a7a5c' }, map: ['......c.........','...bbb.c..bb....','..babab.cbabab..','..bababc.babab..','...bbb.c..bb....','......c...b.....','.....bab........','......b.........'] },
    driplamp:  { pal: { a: '#7a705c', b: '#57503f', c: '#e0c88f', d: '#cfeef8' }, map: ['...aaaaaa.......','....abba........','....acca........','.....ac.........','.....ac.........','.....cc.........','................','.....d..........'] },
    beacon:    { pal: { a: '#5a5a66', b: '#2a2a34', c: '#dff0f4', d: '#a8c8d0', e: '#ffe9b8' }, map: ['.......bb.......','..aaaaaaaaaaaa..','..bcdcdcdcdcdb..','..bdcdcdcdcdcb..','..bcdcdcdcdcdb..','..aaaaaaaaaaaa..','.....bbbbbb.....','....eeeeeeee....'] }
  };
  function decoIcon(d) {
    const def = DECO_ART[d.id];
    const cv = FG.px.make(32, 32);
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    if (def) {
      const small = FG.px.make(16, 16);
      FG.px.drawMap(small.getContext('2d'), def.map, def.pal, 0, 4, 1);
      g.drawImage(small, 0, 0, 32, 32);
    }
    return cv;
  }

})(window.FG);
