/* ============================================================
   cutin.js — 傳說／魚王的 cut-in 演出

   三個設計前提，改這個檔案之前先讀懂：

   1. 這是「純演出層」。它不抽獎、不改狀態、不決定任何結果，只負責在
      screen-fishing 的 cutin 階段把畫面演完。結果早在拋竿當下就抽好了
      （見 wiki 04 §扣款與抽獎的順序），所以這裡拿得到魚種是理所當然的。

   2. 沒有任何圖檔。魚用 FG.px.spriteEl() 取快取精靈，主色直接吃 data.js 裡
      魚王自己的 colors.glow / colors.pattern。「每位魚王看起來不一樣」因此
      幾乎是免費的——換了配色就換了整場演出的色調。

   3. 十二位魚王不各自手刻一套動畫，而是「四種演出骨架 × 每王一筆參數」。
      各刻一套要 700~1000 行，而且每新增一個釣點就多一項最花時間的工作
      （加釣點本來就要生一整套周邊，見 wiki 09）。參數化之後，新的魚王
      只要在 KING 表補一筆六行的資料。

   ★ 時間軸與 styles.css 是綁在一起的：這裡的 DUR_LEGEND / DUR_KING 決定
     phase 停留多久，CSS 的 keyframes 決定畫面演多久。改一邊一定要改另一邊，
     不然會看到「動畫還沒演完就跳去收線」或「演完了畫面卡著等」。
   ============================================================ */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  // 演出總長（毫秒）。★ 必須與 styles.css 的 .cutin-legend / .cutin-king 對齊。
  // 刻意不隨自動模式的 speed 縮短：cut-in 是「值得停下來看」的東西，
  // 極速模式下壓成 0.5 秒就失去意義了。
  const DUR_LEGEND = 1250;
  const DUR_KING = 2100;

  /* ------------------------------------------------------------
     演出骨架 · motif

     只有四種，每種決定「魚怎麼進場 + 背景怎麼處理」，實作全在 CSS：

       emerge  浮現型 — 從下方緩緩浮起放大，霧氣散開。給沉在水底的巨物。
       charge  衝擊型 — 從左側高速衝入，帶兩層殘影。給速度感的掠食者。
       spiral  盤旋型 — 縮到極小旋轉著放大，外圈符文環反向旋轉。給神格化的存在。
       reveal  揭幕型 — 上下黑幕合攏後拉開，像布幕。給藏在黑暗／沙塵裡的東西。

     粒子動線只有三種（up 上浮 / burst 四散 / drift 橫流），顏色吃魚的配色，
     所以同一種動線在不同魚王身上看起來也不一樣。
     ------------------------------------------------------------ */

  // 每位魚王一筆。title 是兩字標語（中間加全形空格拉開字距，跟遊戲內其他
  // 演出文字的處理一致）；tone 是音效動機的音階陣列。
  const KING = {
    ml_king_onde:        { motif: 'emerge', particle: 'up',    title: '霧　語', tone: [196, 262, 330, 392] },
    gp_king_hyaku:       { motif: 'emerge', particle: 'up',    title: '百　年', tone: [262, 330, 392, 523] },
    fj_king_helio:       { motif: 'charge', particle: 'drift', title: '逐　日', tone: [392, 523, 659, 784] },
    sk_king_yahiro:      { motif: 'spiral', particle: 'up',    title: '神　降', tone: [330, 440, 494, 659, 880] },
    tf_king_kotaku:      { motif: 'reveal', particle: 'drift', title: '涸　澤', tone: [349, 294, 392, 466] },
    fr_king_kold:        { motif: 'charge', particle: 'burst', title: '碎　冰', tone: [523, 466, 622, 831] },
    fp_king_gyakuryu:    { motif: 'charge', particle: 'burst', title: '逆　流', tone: [392, 494, 587, 784] },
    lr_king_dujiang:     { motif: 'emerge', particle: 'drift', title: '渡　江', tone: [294, 349, 440, 523] },
    cd_king_yobi:        { motif: 'spiral', particle: 'burst', title: '餘　火', tone: [277, 233, 311, 415, 523] },
    ab_king_nyx:         { motif: 'reveal', particle: 'up',    title: '深　淵', tone: [440, 349, 262, 196] },
    wr_king_jormungandr: { motif: 'spiral', particle: 'burst', title: '環　世', tone: [262, 392, 523, 784, 1046] },
    du_king_osiris:      { motif: 'reveal', particle: 'drift', title: '不　死', tone: [220, 277, 330, 440, 554] }
  };

  // 新增的魚王忘了補 KING 表時用這個。刻意不報錯——少一筆資料不該讓玩家
  // 釣到魚王卻看到當機，退化成「通用魚王演出」就好。
  const KING_FALLBACK = { motif: 'emerge', particle: 'up', title: '魚　王', tone: [330, 440, 587, 880] };
  const LEGEND_PLAN = { motif: 'legend', particle: 'up', title: '傳　說', tone: [523, 659, 880] };

  const PARTICLE_N = { up: 16, burst: 18, drift: 14 };

  let timers = [];

  function clearTimers() {
    timers.forEach(function (t) { clearTimeout(t); });
    timers = [];
  }

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  // 粒子：純 DOM span，位置與延遲隨機化後交給 CSS 動線。
  // 用整數 px 尺寸，縮放後才不會出現半透明的邊（像素風最怕這個）。
  function buildParticles(kind, key, accent) {
    const box = FG.el('div', 'ci-particles pm-' + kind);
    const n = PARTICLE_N[kind] || 14;
    for (let i = 0; i < n; i++) {
      const p = FG.el('span', 'ci-p');
      const s = 2 + Math.floor(Math.random() * 3);
      p.style.width = p.style.height = s * 2 + 'px';
      p.style.background = Math.random() < 0.35 ? accent : key;
      p.style.animationDelay = Math.round(Math.random() * 900) + 'ms';
      p.style.animationDuration = Math.round(900 + Math.random() * 800) + 'ms';

      if (kind === 'burst') {
        const a = Math.random() * Math.PI * 2;
        const r = 60 + Math.random() * 120;
        p.style.left = '50%';
        p.style.top = '46%';
        p.style.setProperty('--tx', Math.round(Math.cos(a) * r) + 'px');
        p.style.setProperty('--ty', Math.round(Math.sin(a) * r) + 'px');
      } else if (kind === 'drift') {
        p.style.left = '100%';
        p.style.top = Math.round(Math.random() * 100) + '%';
        p.style.setProperty('--ty', Math.round(Math.random() * 30 - 15) + 'px');
      } else {
        p.style.left = Math.round(Math.random() * 100) + '%';
        p.style.bottom = '-8px';
        p.style.setProperty('--tx', Math.round(Math.random() * 40 - 20) + 'px');
      }
      box.appendChild(p);
    }
    return box;
  }

  function spriteLayer(fish, inst, scale, cls) {
    const layer = FG.el('div', 'ci-layer' + (cls ? ' ' + cls : ''));
    const spr = FG.px.spriteEl(fish, scale);
    // 閃光個體沿用結果卡的處理，讓兩邊看起來是同一條魚
    if (inst && inst.shiny) spr.style.filter = 'saturate(1.6) brightness(1.2) drop-shadow(0 0 6px #fff8c0)';
    layer.appendChild(spr);
    return layer;
  }

  FG.cutin = {

    /* 這條漁獲要不要播 cut-in？回傳 null 表示不播。
       門檻是「傳說以上」＝ FG.RARITY.legend.order，用 order 比較而不是寫死
       字串陣列，將來在傳說與魚王之間插新稀有度也不用改這裡。 */
    plan: function (fish) {
      if (!fish || !FG.RARITY) return null;
      const R = FG.RARITY[fish.rarity];
      if (!R || R.order < FG.RARITY.legend.order) return null;

      if (fish.rarity === 'king') {
        const k = KING[fish.id] || KING_FALLBACK;
        return {
          kind: 'king', dur: DUR_KING, scale: 4,
          motif: k.motif, particle: k.particle, title: k.title, tone: k.tone
        };
      }
      return {
        kind: 'legend', dur: DUR_LEGEND, scale: 3,
        motif: LEGEND_PLAN.motif, particle: LEGEND_PLAN.particle,
        title: LEGEND_PLAN.title, tone: LEGEND_PLAN.tone
      };
    },

    /* 播放。mount 要是一個 position:relative 的容器（釣魚畫面給的是 #stageWrap）。
       疊層做成 DOM 而不是畫進場景 canvas，是因為那張 canvas 用 object-fit:cover，
       畫上去的東西邊緣會被裁掉、位置不可控（wiki 11 §10）。 */
    play: function (mount, fish, inst, plan) {
      if (!mount || !fish || !plan) return;
      this.clear(mount);

      const C = fish.colors || {};
      const R = FG.RARITY[fish.rarity] || {};
      const key = C.glow || C.pattern || R.color || '#ffc44d';
      const accent = C.pattern || C.belly || key;

      const root = FG.el('div', 'cutin cutin-' + plan.kind + ' motif-' + plan.motif);
      root.style.setProperty('--ci-key', key);
      root.style.setProperty('--ci-accent', accent);

      // 疊放順序就是 append 順序，改的時候要一起想：
      // 背景 → 魚 → 粒子（前景）→ 黑幕（要蓋住魚才擋得住）→ 文字（永遠最上）→ 白閃
      root.appendChild(FG.el('div', 'ci-veil'));
      root.appendChild(FG.el('div', 'ci-rays'));
      root.appendChild(FG.el('div', 'ci-ring'));
      root.appendChild(FG.el('div', 'ci-band'));

      const fishBox = FG.el('div', 'ci-fish');
      // 衝擊型的殘影：同一張精靈多疊兩層，靠 CSS 的 animation-delay 拉開成拖影。
      // spriteEl() 每次回傳新的 canvas，精靈本身有快取，多畫兩層幾乎不花成本。
      if (plan.motif === 'charge') {
        fishBox.appendChild(spriteLayer(fish, inst, plan.scale, 'ci-ghost'));
        fishBox.appendChild(spriteLayer(fish, inst, plan.scale, 'ci-ghost'));
      }
      fishBox.appendChild(spriteLayer(fish, inst, plan.scale, 'ci-main'));
      root.appendChild(fishBox);

      root.appendChild(buildParticles(plan.particle, key, accent));
      // 揭幕型的上下黑幕。其他骨架用 CSS display:none 藏掉，不必在這裡分支
      root.appendChild(FG.el('div', 'ci-slit t'));
      root.appendChild(FG.el('div', 'ci-slit b'));

      const txt = FG.el('div', 'ci-text');
      txt.appendChild(FG.el('div', 'ci-kanji', FG.esc(plan.title)));
      txt.appendChild(FG.el('div', 'ci-name', (inst && inst.shiny ? '✦ ' : '') + FG.esc(fish.name)));
      txt.appendChild(FG.el('div', 'ci-rank', FG.esc(R.name || '')));
      root.appendChild(txt);

      root.appendChild(FG.el('div', 'ci-flash'));
      mount.appendChild(root);

      // 音效：魚王先來一記悶響當衝擊，動機晚一點才落在揭曉的瞬間
      if (plan.kind === 'king') {
        FG.sfx.impact();
        later(function () { FG.sfx.seq(plan.tone, 130, 0.18, 'square', 0.065); }, 620);
      } else {
        FG.sfx.seq(plan.tone, 110, 0.14, 'square', 0.055);
      }
    },

    /* 移除疊層並取消還沒響的音效。
       分頁切走時 frame() 不再被呼叫（wiki 01 §主迴圈），疊層會留在 DOM 裡，
       所以 screen-fishing 的 onShow 也會呼叫一次。重複呼叫是安全的。 */
    clear: function (mount) {
      clearTimers();
      if (!mount) return;
      FG.$$('.cutin', mount).forEach(function (n) {
        if (n.parentNode) n.parentNode.removeChild(n);
      });
    }
  };

})(window.FG);
