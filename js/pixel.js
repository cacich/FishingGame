/* ============================================================
   pixel.js — 像素美術引擎
   1) 字元圖（char map）繪製：小圖示、雜物、人物、水豚
   2) 程序化魚類精靈：依 shape / colors / pattern / special 產生像素魚
   3) 場景繪製：釣點風景、家園房間、地點縮圖
   所有繪製都在低解析度 canvas 上完成，再由 CSS 放大（image-rendering: pixelated）
   ============================================================ */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  const px = FG.px = {};

  /* ============================================================
     基礎工具
     ============================================================ */

  px.make = function (w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    return c;
  };

  // 繪製字元圖：map 為字串陣列，pal 為 { 字元: 顏色 }
  px.drawMap = function (ctx, map, pal, ox, oy, scale) {
    scale = scale || 1;
    for (let r = 0; r < map.length; r++) {
      const row = map[r];
      for (let c = 0; c < row.length; c++) {
        const col = pal[row[c]];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(ox + c * scale, oy + r * scale, scale, scale);
      }
    }
  };

  px.mapSize = function (map) {
    let w = 0;
    for (let i = 0; i < map.length; i++) w = Math.max(w, map[i].length);
    return { w: w, h: map.length };
  };

  /* ============================================================
     介面圖示（12x12 字元圖）
     ============================================================ */

  const ICONS = {
    fish: [
      '............',
      '.......XX...',
      '..XXXX.XXX..',
      '.XXXXXXXXXX.',
      'XXXXXXXXXXX.',
      'XXaXXXXXXXX.',
      'XXXXXXXXXXX.',
      '.XXXXXXXXXX.',
      '..XXXX.XXX..',
      '.......XX...',
      '............',
      '............'
    ],
    calendar: [
      '............',
      '..X......X..',
      '.XXXXXXXXXX.',
      '.XXXXXXXXXX.',
      '.X........X.',
      '.X.aa.aa..X.',
      '.X........X.',
      '.X.aa.aa..X.',
      '.X........X.',
      '.XXXXXXXXXX.',
      '............',
      '............'
    ],
    house: [
      '.....XX.....',
      '....XXXX....',
      '...XXXXXX...',
      '..XXXXXXXX..',
      '.XXXXXXXXXX.',
      'XXXXXXXXXXXX',
      '.XX......XX.',
      '.XX.aaaa.XX.',
      '.XX.aaaa.XX.',
      '.XX.aaaa.XX.',
      '.XXXXXXXXXX.',
      '............'
    ],
    bag: [
      '............',
      '...XX..XX...',
      '..X.X..X.X..',
      '..X.X..X.X..',
      '.XXXXXXXXXX.',
      '.XaXXXXXXaX.',
      '.XXXXXXXXXX.',
      '.XXXXXXXXXX.',
      '.XXXXXXXXXX.',
      '.XXXXXXXXXX.',
      '..XXXXXXXX..',
      '............'
    ],
    book: [
      '............',
      '..XXXXXXXX..',
      '.XaaaaaaaaX.',
      '.XaXXXXXXaX.',
      '.XaaaaaaaaX.',
      '.XaXXXXXXaX.',
      '.XaaaaaaaaX.',
      '.XaXXXXXXaX.',
      '.XaaaaaaaaX.',
      '..XXXXXXXX..',
      '............',
      '............'
    ],
    coin: [
      '...XXXX...',
      '..XaaaaX..',
      '.XaaXXaaX.',
      'XaaXaaXaaX',
      'XaXaaaaXaX',
      'XaXaaaaXaX',
      'XaaXaaXaaX',
      '.XaaXXaaX.',
      '..XaaaaX..',
      '...XXXX...'
    ]
  };

  px.icon = function (name, scale, color, accent) {
    const map = ICONS[name] || ICONS.fish;
    const s = px.mapSize(map);
    const cv = px.make(s.w, s.h);
    px.drawMap(cv.getContext('2d'), map, { X: color || '#e8f1f7', a: accent || '#59a6ff' }, 0, 0, 1);
    if (scale && scale !== 1) {
      const big = px.make(s.w * scale, s.h * scale);
      const g = big.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.drawImage(cv, 0, 0, big.width, big.height);
      return big;
    }
    return cv;
  };

  /* ============================================================
     程序化魚類精靈
     ============================================================ */

  // 各體型的輪廓參數（皆為精靈框的比例值；scale=1 時大約佔 2/3 畫面，
  // 讓 scale 大的魚王在同尺寸框裡看起來就是比較大隻）
  const SHAPES = {
    normal: { bodyLen: .50, bodyH: .46, gamma: 1.15, e: .50, tailLen: .18, tailH: .80, fork: .45, dorsal: .36, dorsalAt: [.30, .64], anal: .22, analAt: [.18, .42] },
    long:   { bodyLen: .62, bodyH: .24, gamma: 1.05, e: .58, tailLen: .14, tailH: .52, fork: .30, dorsal: .26, dorsalAt: [.24, .72], anal: .16, analAt: [.22, .55] },
    round:  { bodyLen: .40, bodyH: .62, gamma: 1.20, e: .42, tailLen: .16, tailH: .58, fork: .40, dorsal: .28, dorsalAt: [.28, .60], anal: .22, analAt: [.22, .46] },
    flat:   { bodyLen: .42, bodyH: .70, gamma: 1.24, e: .44, tailLen: .15, tailH: .70, fork: .48, dorsal: .40, dorsalAt: [.22, .62], anal: .32, analAt: [.18, .48] },
    wide:   { bodyLen: .56, bodyH: .52, gamma: 1.10, e: .48, tailLen: .18, tailH: .86, fork: .45, dorsal: .30, dorsalAt: [.28, .58], anal: .20, analAt: [.20, .44] },
    ray:    { bodyLen: .46, bodyH: .80, gamma: 1.00, e: .30, tailLen: .36, tailH: .03, fork: .00, dorsal: .04, dorsalAt: [.34, .50], anal: .04, analAt: [.34, .50] }
  };

  const SPR_W = 96, SPR_H = 56, MARGIN = 4;

  const fishCache = {};

  // 產生一隻魚的像素精靈（面向右）
  function buildFish(f) {
    const W = SPR_W, H = SPR_H;
    const S = SHAPES[f.shape] || SHAPES.normal;
    const rng = FG.seeded(hashStr(f.id));

    const usableW = W - MARGIN * 2;
    // 避免體型倍率把魚撐出畫面
    const sc = Math.min(f.scale || 1, 0.98 / (S.bodyLen + S.tailLen));
    const halfMax = (H / 2 - MARGIN) * S.bodyH * sc;
    const bodyW = Math.max(6, Math.round(usableW * S.bodyLen * sc));
    const tailW = Math.max(3, Math.round(usableW * S.tailLen * sc));
    const total = bodyW + tailW;
    const xStart = Math.round(MARGIN + (usableW - total) / 2);
    const x0 = xStart + tailW;          // 身體起點（尾側）
    const x1 = x0 + bodyW;              // 身體終點（頭部）
    const cy = H / 2 + (f.cyOffset || 0);

    // layer: 0 空 / 1 鰭 / 2 尾 / 3 身體（數字大者覆蓋）
    const layer = new Uint8Array(W * H);
    function put(x, y, v) {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const i = y * W + x;
      if (v > layer[i]) layer[i] = v;
    }

    // 身體縱向半高剖面：t=0 尾根、t=1 吻端
    function profile(t) {
      t = FG.clamp(t, 0, 1);
      const tt = Math.pow(t, S.gamma);
      const s = Math.max(0, 1 - Math.pow(2 * tt - 1, 2));
      const h = halfMax * Math.pow(s, S.e);
      return (t > 0.02 && t < 0.995) ? Math.max(h, 1.2) : h;
    }

    // --- 背鰭 ---
    const dorH = halfMax * S.dorsal;
    for (let x = Math.round(x0 + bodyW * S.dorsalAt[0]); x <= Math.round(x0 + bodyW * S.dorsalAt[1]); x++) {
      const t = (x - x0) / bodyW;
      const s = (t - S.dorsalAt[0]) / (S.dorsalAt[1] - S.dorsalAt[0]);
      const hgt = dorH * Math.pow(Math.sin(Math.PI * FG.clamp(s, 0, 1)), .55);
      const base = cy - profile(t);
      for (let y = base - hgt; y < base; y++) put(x, y, 1);
    }
    // --- 臀鰭 ---
    const anH = halfMax * S.anal;
    for (let x = Math.round(x0 + bodyW * S.analAt[0]); x <= Math.round(x0 + bodyW * S.analAt[1]); x++) {
      const t = (x - x0) / bodyW;
      const s = (t - S.analAt[0]) / (S.analAt[1] - S.analAt[0]);
      const hgt = anH * Math.pow(Math.sin(Math.PI * FG.clamp(s, 0, 1)), .55);
      const base = cy + profile(t);
      for (let y = base; y < base + hgt; y++) put(x, y, 1);
    }
    // --- 胸鰭 ---
    const pecX = x0 + bodyW * 0.62;
    const pecLen = Math.max(3, Math.round(bodyW * 0.16));
    for (let i = 0; i < pecLen; i++) {
      const hgt = (1 - i / pecLen) * halfMax * 0.34 + 1;
      for (let y = 0; y < hgt; y++) put(pecX - i, cy + profile(0.62) * 0.25 + y, 1);
    }

    // --- 尾鰭 ---
    const jointHalf = profile(0);
    const tailHalf = halfMax * S.tailH;
    for (let i = 0; i < tailW; i++) {
      const x = x0 - tailW + i;
      const u = tailW > 1 ? i / (tailW - 1) : 1;
      const half = tailHalf * (1 - u) + jointHalf * u;
      const cut = u < S.fork ? ((S.fork - u) / S.fork) * tailHalf * 0.62 : 0;
      for (let y = Math.round(cy - half); y <= Math.round(cy + half); y++) {
        if (cut > 0 && Math.abs(y - cy) < cut) continue;
        put(x, y, 2);
      }
    }

    // --- 身體 ---
    for (let x = x0; x <= x1; x++) {
      const t = (x - x0) / bodyW;
      const half = profile(t);
      for (let y = Math.round(cy - half); y <= Math.round(cy + half); y++) put(x, y, 3);
    }

    /* ---------- 上色 ---------- */
    const C = f.colors || {};
    const body = C.body || '#7f9bb0';
    const back = C.back || FG.shade(body, -0.32);
    const belly = C.belly || FG.shade(body, 0.42);
    const finC = C.fin || FG.mix(body, back, 0.4);
    const patC = C.pattern || FG.shade(back, -0.2);
    const outline = C.outline || FG.shade(back, -0.55);

    const col = new Array(W * H).fill(null);

    // 斑點座標（僅 pattern = 'spot' 使用）
    const spots = [];
    if (f.pattern === 'spot') {
      const n = Math.round(6 + rng() * 8);
      for (let i = 0; i < n; i++) spots.push([0.12 + rng() * 0.72, 0.15 + rng() * 0.7]);
    }

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const L = layer[i];
        if (!L) continue;
        if (L === 1 || L === 2) {
          // 鰭與尾：邊緣稍暗，做出膜狀質感
          col[i] = ((x + y) % 5 === 0) ? FG.shade(finC, -0.16) : finC;
          continue;
        }
        const t = (x - x0) / bodyW;
        const half = profile(t);
        const v = FG.clamp((y - (cy - half)) / (2 * half), 0, 1);
        let c;
        if (v < 0.24) c = back;
        else if (v > 0.74) c = belly;
        else if (v < 0.40) c = FG.mix(back, body, 0.55);
        else c = body;

        // 花紋
        switch (f.pattern) {
          case 'stripe':
            if ((x - x0) % 8 < 2 && v > 0.08 && v < 0.9) c = FG.mix(c, patC, 0.8);
            break;
          case 'band':
            if (Math.abs(v - 0.46) < 0.09) c = FG.mix(c, patC, 0.85);
            break;
          case 'band2':
            if (Math.abs(v - 0.40) < 0.07 || Math.abs(v - 0.62) < 0.05) c = FG.mix(c, patC, 0.8);
            break;
          case 'spot':
            for (let s = 0; s < spots.length; s++) {
              if (Math.abs(t - spots[s][0]) < 0.035 && Math.abs(v - spots[s][1]) < 0.09) { c = patC; break; }
            }
            break;
          case 'speck':
            if (((x * 7 + y * 13) % 11) === 0 && v > 0.1 && v < 0.8) c = FG.mix(c, patC, 0.7);
            break;
          case 'net':
            if ((x - x0) % 5 === 0 || (y % 5 === 0)) c = FG.mix(c, patC, 0.35);
            break;
          case 'scale':
            if (((x - x0 + (y % 2) * 2) % 4) === 0) c = FG.mix(c, FG.shade(c, -0.18), 0.9);
            break;
        }
        col[i] = c;
      }
    }

    // --- 鰓線 ---
    {
      const gx = Math.round(x0 + bodyW * 0.74);
      const half = profile(0.74);
      for (let y = Math.round(cy - half * 0.85); y <= Math.round(cy + half * 0.7); y++) {
        const off = Math.round(Math.abs(y - cy) / Math.max(1, half) * 2);
        const i = y * W + (gx - off);
        if (col[i]) col[i] = FG.shade(col[i], -0.22);
      }
    }

    // --- 眼睛 ---
    {
      const ex = Math.round(x0 + bodyW * 0.87);
      const ey = Math.round(cy - profile(0.87) * 0.28);
      const eyeW = C.eyeWhite || '#f4f8fb';
      const pupil = C.pupil || '#141a20';
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const i = (ey + dy) * W + (ex + dx);
        if (i >= 0 && i < W * H && col[i]) col[i] = eyeW;
      }
      for (let dy = 0; dy <= 1; dy++) for (let dx = 0; dx <= 1; dx++) {
        const i = (ey + dy) * W + (ex + dx);
        if (i >= 0 && i < W * H && col[i]) col[i] = pupil;
      }
    }

    // --- 嘴 ---
    {
      const my = Math.round(cy + profile(0.96) * 0.45);
      for (let x = x1 - 3; x <= x1; x++) {
        const i = my * W + x;
        if (i >= 0 && i < W * H && col[i]) col[i] = FG.shade(outline, 0.15);
      }
    }

    const sp = f.special || [];

    // --- 傷疤 ---
    if (sp.indexOf('scar') >= 0) {
      const sx = Math.round(x0 + bodyW * 0.52);
      for (let k = 0; k < 9; k++) {
        const i = Math.round(cy - 6 + k) * W + (sx + Math.round(k * 0.5));
        if (col[i]) col[i] = '#efd9c0';
      }
    }
    // --- 背棘 ---
    if (sp.indexOf('spike') >= 0) {
      for (let k = 0; k < 6; k++) {
        const x = Math.round(x0 + bodyW * (0.24 + k * 0.09));
        const base = Math.round(cy - profile((x - x0) / bodyW)) - 1;
        for (let y = base; y > base - 4 + (k % 2); y--) {
          const i = y * W + x;
          if (i > 0 && i < W * H) col[i] = FG.shade(back, -0.1);
        }
      }
    }
    // --- 鬍鬚（鯰魚） ---
    if (sp.indexOf('whisker') >= 0) {
      const mx = x1, my = Math.round(cy + profile(0.96) * 0.4);
      const room = W - 2 - mx;                       // 別讓鬍鬚畫出畫面（會繞到下一列）
      for (let s = 0; s < 2; s++) {
        for (let k = 0; k < 14; k++) {
          const x = Math.round(mx + k * 0.75);
          const y = Math.round(my + (s ? 1 : -3) + k * k * (s ? 0.05 : 0.02));
          if (x < 0 || x >= W || y < 0 || y >= H || k * 0.75 > room) continue;
          const i = y * W + x;
          if (!col[i]) col[i] = FG.shade(back, 0.05);
        }
      }
    }
    // --- 頭角 ---
    if (sp.indexOf('horn') >= 0) {
      const hx = Math.round(x0 + bodyW * 0.82);
      for (let k = 0; k < 5; k++) {
        const x = hx + k, y = Math.round(cy - profile(0.82) - k);
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        col[y * W + x] = C.hornColor || '#f2e2a8';
      }
    }

    // --- 描邊 ---
    const outCol = new Array(W * H).fill(null);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (col[i]) continue;
        if ((x > 0 && col[i - 1]) || (x < W - 1 && col[i + 1]) ||
            (y > 0 && col[i - W]) || (y < H - 1 && col[i + W])) {
          outCol[i] = outline;
        }
      }
    }

    /* ---------- 輸出 ---------- */
    const cv = px.make(W, H);
    const g = cv.getContext('2d');

    // 發光（魚王 / 傳說）
    if (sp.indexOf('glow') >= 0) {
      const glow = C.glow || '#8fe6ff';
      g.globalAlpha = 0.18;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (outCol[i]) {
          g.fillStyle = glow;
          g.fillRect(x - 1, y - 1, 3, 3);
        }
      }
      g.globalAlpha = 1;
    }

    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (outCol[i]) { g.fillStyle = outCol[i]; g.fillRect(x, y, 1, 1); }
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (col[i]) { g.fillStyle = col[i]; g.fillRect(x, y, 1, 1); }
    }
    return cv;
  };

  function hashStr(s) {
    let h = 2166136261;
    s = String(s);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  px.hashStr = hashStr;

  /* ---------- 雜物（非魚類）字元圖 ---------- */

  const JUNK_MAPS = {
    boot: {
      pal: { X: '#2b2018', d: '#5a4030', l: '#7b5a42', s: '#c9b48a' },
      map: [
        '....XXXXX.......',
        '...XdddddX......',
        '...XdlllldX.....',
        '...XdddddX......',
        '...XdlllldX.....',
        '...XdddddX......',
        '...XdddddXXXX...',
        '...XdddddddddX..',
        '..XdlllllllllX..',
        '..XdddddddddddX.',
        '..XsssssssssssX.',
        '..XXXXXXXXXXXXX.'
      ]
    },
    can: {
      pal: { X: '#3a4550', a: '#8d9aa6', b: '#c4ced6', r: '#b4453f' },
      map: [
        '...XXXXXXX...',
        '..XbbbbbbbX..',
        '..XbaaaaabX..',
        '..XbarrrabX..',
        '..XbarrrabX..',
        '..XbaaaaabX..',
        '..XbbbbbbbX..',
        '..XbaaaaabX..',
        '..XbbbbbbbX..',
        '...XXXXXXX...'
      ]
    },
    weed: {
      pal: { X: '#1e3a24', g: '#2f6b3a', l: '#4d9450' },
      map: [
        '......ll......',
        '.....lgl......',
        '..l..lgl..l...',
        '.lgl.Xgl.lgl..',
        '.lgl.XgX.lgX..',
        '..XgXXgXXgX...',
        '...XgXgXgX....',
        '....XgXgX.....',
        '.....XgX......',
        '.....XXX......'
      ]
    },
    bottle: {
      pal: { X: '#1d3b3a', g: '#2f6f6a', l: '#5aa39a', c: '#8a6a3a' },
      map: [
        '.....cc.....',
        '.....cc.....',
        '....XggX....',
        '...XgllgX...',
        '..XgllllgX..',
        '..XgllllgX..',
        '..XgllllgX..',
        '..XgllllgX..',
        '..XgllllgX..',
        '..XXXXXXXX..'
      ]
    }
  };

  function buildJunk(f) {
    const def = JUNK_MAPS[f.junkArt] || JUNK_MAPS.boot;
    const s = px.mapSize(def.map);
    const cv = px.make(SPR_W, SPR_H);
    const g = cv.getContext('2d');
    const scale = Math.max(1, Math.floor(Math.min(SPR_W / s.w, SPR_H / s.h) * 0.85));
    px.drawMap(g, def.map, def.pal,
      Math.round((SPR_W - s.w * scale) / 2),
      Math.round((SPR_H - s.h * scale) / 2), scale);
    return cv;
  }

  // 取得（並快取）魚 / 雜物精靈
  px.sprite = function (f) {
    if (!fishCache[f.id]) fishCache[f.id] = f.junkArt ? buildJunk(f) : buildFish(f);
    return fishCache[f.id];
  };

  // 把精靈畫到任意 ctx（等比縮放置中）
  px.drawSprite = function (ctx, f, x, y, scale, flip) {
    const sp = px.sprite(f);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(sp, -sp.width * scale / 2, -sp.height * scale / 2, sp.width * scale, sp.height * scale);
    ctx.restore();
  };

  // 產生一張「精靈放大版」canvas，直接塞進 DOM 用
  px.spriteEl = function (f, scale) {
    const sp = px.sprite(f);
    const cv = px.make(sp.width * scale, sp.height * scale);
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(sp, 0, 0, cv.width, cv.height);
    return cv;
  };

  /* ============================================================
     人物與配角
     ============================================================ */

  const ANGLER = {
    pal: { h: '#2b1d16', s: '#d8a37a', j: '#3f6b52', k: '#2c4b3a', p: '#3a4657', b: '#241c18', r: '#e4d7bd' },
    map: [
      '....hhhh...',
      '...hhhhhh..',
      '...hsssjh..',
      '...ssssh...',
      '....sss....',
      '...jjjjj...',
      '..jjjjjjj..',
      '..jkjjjjj..',
      '..jjjjjjjs.',
      '..jjjjjj...',
      '...ppppp...',
      '...ppppp...',
      '...pp.pp...',
      '...bb.bb...'
    ]
  };

  const CAPY = {
    pal: { b: '#9a6b45', d: '#6f4a2e', e: '#2a1b12', n: '#c99568', p: '#e8b9a0' },
    map: [
      '..dd....dd......',
      '.dbbd..dbbd.....',
      '.bbbbbbbbbb.....',
      '.beb.bb.beb.....',
      '.bbbbbbbbbb.....',
      '.bbbbnnbbbbbbb..',
      '.bbbbbbbbbbbbbb.',
      '..bbbbbbbbbbbbb.',
      '..bbbbbbbbbbbb..',
      '...dd......dd...'
    ]
  };

  const HEART = {
    pal: { r: '#e2555f', l: '#f18c93' },
    map: [
      '.rr.rr.',
      'rlrrrrr',
      'rrrrrrr',
      '.rrrrr.',
      '..rrr..',
      '...r...'
    ]
  };

  /* ============================================================
     釣點場景
     ============================================================ */

  const SCENE_W = 200, SCENE_H = 340;
  const bgCache = {};

  px.sceneSize = { w: SCENE_W, h: SCENE_H };

  function buildBackground(loc) {
    const P = loc.scene;
    const W = SCENE_W, H = SCENE_H;
    const cv = px.make(W, H);
    const g = cv.getContext('2d');
    const R = FG.seeded(loc.seed || 1234);
    const horizon = Math.round(H * (P.horizon || 0.30));

    function rect(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }

    // --- 天空 / 遠景漸層 ---
    const sky = P.sky;
    for (let y = 0; y < horizon; y++) {
      const t = y / horizon;
      const idx = FG.clamp(Math.floor(t * (sky.length - 1)), 0, sky.length - 2);
      const lt = t * (sky.length - 1) - idx;
      rect(0, y, W, 1, FG.mix(sky[idx], sky[idx + 1], lt));
    }

    // --- 遠山稜線 ---
    if (P.hill) {
      let hy = horizon - 46;
      for (let x = 0; x < W; x++) {
        hy += (R() - 0.5) * 2.4;
        hy = FG.clamp(hy, horizon - 62, horizon - 30);
        rect(x, hy, 1, horizon - hy, P.hill);
      }
    }

    // --- 遠、中、近三層樹林 ---
    function forest(baseY, height, color, density, accent) {
      for (let i = 0; i < density; i++) {
        const x = Math.floor(R() * (W + 12)) - 6;
        const h = height * (0.6 + R() * 0.7);
        const w = Math.max(2, Math.round(h * 0.42));
        for (let k = 0; k < h; k++) {
          const ww = Math.max(1, Math.round(w * (k / h)));
          rect(x - ww / 2, baseY - h + k, ww, 1, color);
        }
        // 秋葉點綴（只染樹冠上緣，避免整片看起來像火焰）
        if (accent && R() < 0.15) {
          const ac = accent[Math.floor(R() * accent.length)];
          for (let k = 0; k < h * 0.34; k++) {
            const ww = Math.max(1, Math.round(w * (k / h) * 0.9));
            rect(x - ww / 2, baseY - h + k, ww, 1, ac);
          }
        }
      }
    }
    forest(horizon - 12, 22, P.farTree, 90, P.accent);
    forest(horizon - 4, 26, P.midTree, 80, P.accent);
    forest(horizon + 1, 20, P.nearTree, 60, P.accent2 || P.accent);

    // --- 岸線 ---
    rect(0, horizon, W, 2, P.shore || FG.shade(P.nearTree, -0.35));

    // --- 水面底色（由遠而近分帶） ---
    for (let y = horizon + 2; y < H; y++) {
      const t = (y - horizon) / (H - horizon);
      const band = Math.floor(t * 5) / 5;
      rect(0, y, W, 1, FG.mix(P.waterTop, P.waterBot, band));
    }

    // --- 樹林在水面的倒影（帶抖動） ---
    for (let y = 0; y < 48; y++) {
      const srcY = horizon - 1 - y;
      const dstY = horizon + 2 + y;
      if (srcY < 0 || dstY >= H) break;
      const jitter = Math.round(Math.sin(y * 0.9) * 2 + (R() - 0.5) * 2);
      const img = g.getImageData(0, srcY, W, 1);
      const d = img.data;
      for (let x = 0; x < W; x++) {
        const i = x * 4;
        // 只保留較暗的樹影，讓水面保有底色
        const lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
        if (lum > 150) { d[i + 3] = 0; continue; }
        d[i] *= 0.72; d[i + 1] *= 0.78; d[i + 2] *= 0.86;
        d[i + 3] = 150;
      }
      const tmp = px.make(W, 1);
      tmp.getContext('2d').putImageData(img, 0, 0);
      g.globalAlpha = 0.85 * (1 - y / 56);
      g.drawImage(tmp, jitter, dstY);
      g.globalAlpha = 1;
    }

    // --- 深水區塊（畫面中央一片較深的水域） ---
    g.globalAlpha = 0.35;
    rect(0, horizon + 26, W, H - horizon - 26, P.waterDeep);
    g.globalAlpha = 1;

    return { canvas: cv, horizon: horizon };
  }

  function getBg(loc) {
    if (!bgCache[loc.id]) bgCache[loc.id] = buildBackground(loc);
    return bgCache[loc.id];
  }

  /* 水面反光橫線：位置固定（種子），隨時間左右緩慢漂移 */
  function drawSparkle(g, loc, horizon, time) {
    const P = loc.scene;
    const R = FG.seeded((loc.seed || 1234) + 77);
    const W = SCENE_W, H = SCENE_H;
    const n = 190;
    for (let i = 0; i < n; i++) {
      const yy = horizon + 3 + Math.pow(R(), 0.75) * (H - horizon - 6);
      const baseX = R() * W;
      const len = 2 + Math.floor(R() * 7 * (0.4 + (yy - horizon) / (H - horizon)));
      const spd = 1.5 + R() * 3;
      const x = (baseX + Math.sin(time * 0.00035 * spd + i) * 4) % W;
      const near = (yy - horizon) / (H - horizon);
      g.globalAlpha = 0.45 + near * 0.5;
      g.fillStyle = R() < 0.25 ? P.highlight2 || P.highlight : P.highlight;
      g.fillRect(Math.round(x), Math.round(yy), len, 1);
    }
    g.globalAlpha = 1;
  }

  /* 小船 + 釣手 + 水豚 */
  function drawBoat(g, loc, bx, by, time) {
    const P = loc.scene;
    function rect(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }

    const bw = 92, bh = 17;

    // 船身倒影
    g.globalAlpha = 0.3;
    for (let i = 0; i < 12; i++) {
      const l = Math.round(i * 1.4);
      rect(bx + 8 + l, by + bh + i, bw - 20 - l * 2, 1, '#0d2233');
    }
    g.globalAlpha = 1;

    // 人物與水豚（畫在船艙內，先畫免得被船緣蓋住頭）
    const bob = Math.sin(time * 0.0016) * 1;
    px.drawMap(g, CAPY.map, CAPY.pal, bx + 12, by - 12 + bob, 1);
    px.drawMap(g, ANGLER.map, ANGLER.pal, bx + 50, by - 15 + bob, 1);

    // 愛心（水豚偶爾冒出）
    const hp = (time % 6000) / 6000;
    if (hp < 0.35) {
      g.globalAlpha = hp < 0.28 ? 1 : (0.35 - hp) / 0.07;
      px.drawMap(g, HEART.map, HEART.pal, bx + 18, by - 24 - hp * 22 + bob, 1);
      g.globalAlpha = 1;
    }

    // 船身
    for (let i = 0; i < bh; i++) {
      const l = Math.round(i * 1.5), r = Math.round(i * 0.6);
      const c = i < 2 ? P.boatRim || '#7a5340' : (i < 5 ? P.boat || '#5b3b2e' : P.boatDark || '#3d281f');
      rect(bx + l, by + i + bob, bw - l - r, 1, c);
    }
    rect(bx + 2, by + bob, bw - 4, 1, FG.shade(P.boatRim || '#7a5340', 0.2));
    // 船外機
    rect(bx + bw - 6, by - 8 + bob, 8, 10, '#33404d');
    rect(bx + bw - 4, by - 10 + bob, 5, 3, '#5c6b78');
    rect(bx + bw - 3, by + 2 + bob, 3, 12, '#2a3540');
    rect(bx + bw - 5, by + 12 + bob, 6, 3, '#222c36');

    return bob;
  }

  /* 釣竿、釣線、浮標 */
  function drawRodAndLine(g, hx, hy, fx, fy) {
    // 釣竿（往右上延伸）
    let rx = hx, ry = hy;
    for (let i = 0; i < 30; i++) {
      rx = hx + i * 1.15;
      ry = hy - i * 0.95 + i * i * 0.006;
      g.fillStyle = i > 26 ? '#d8dde2' : '#2a2119';
      g.fillRect(Math.round(rx), Math.round(ry), 1, 1);
    }
    // 釣線（從竿尖垂到浮標）
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = FG.lerp(rx, fx, t);
      const y = FG.lerp(ry, fy, t) + Math.sin(t * Math.PI) * 6;
      g.fillStyle = 'rgba(235,245,250,.5)';
      g.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  }

  function drawFloat(g, fx, fy, sink) {
    // 浮標：上紅下白
    const h = 6 - sink * 4;
    for (let i = 0; i < h; i++) {
      g.fillStyle = i < h * 0.5 ? '#e04a4a' : '#f2f4f6';
      g.fillRect(fx, fy - h + i, 3, 1);
    }
    g.fillStyle = '#2b3540';
    g.fillRect(fx, fy, 3, 1);
    // 水波
    g.fillStyle = 'rgba(255,255,255,.45)';
    g.fillRect(fx - 4, fy + 1, 11, 1);
    g.fillStyle = 'rgba(255,255,255,.22)';
    g.fillRect(fx - 8, fy + 3, 19, 1);
  }

  /* 對外：繪製釣點場景
     st = { time, floatSink, ripple, jump:{fish, t}, hideLine } */
  px.drawScene = function (g, loc, st) {
    const bg = getBg(loc);
    const time = st.time || 0;
    g.imageSmoothingEnabled = false;
    g.drawImage(bg.canvas, 0, 0);
    drawSparkle(g, loc, bg.horizon, time);

    const bx = 52, by = 236;
    const bob = drawBoat(g, loc, bx, by, time);

    const hx = bx + 60, hy = by - 8 + bob;
    const fx = st.floatX !== undefined ? st.floatX : 150;
    const fy = (st.floatY !== undefined ? st.floatY : 206) + Math.sin(time * 0.003) * 1.2;

    if (!st.hideLine) {
      drawRodAndLine(g, hx, hy, fx, fy);
      drawFloat(g, fx, fy, st.floatSink || 0);
    }

    // 咬鉤時的漣漪
    if (st.ripple) {
      for (let r = 0; r < 3; r++) {
        const rr = ((time * 0.03 + r * 8) % 24);
        g.globalAlpha = FG.clamp(1 - rr / 24, 0, 1) * 0.5;
        g.strokeStyle = '#eaf4f8';
        g.lineWidth = 1;
        g.beginPath();
        g.ellipse(fx + 1, fy + 1, rr, rr * 0.35, 0, 0, Math.PI * 2);
        g.stroke();
      }
      g.globalAlpha = 1;
    }

    // 魚躍出水面
    if (st.jump && st.jump.fish) {
      const t = FG.clamp(st.jump.t, 0, 1);
      const jx = FG.lerp(fx + 6, fx - 26, t);
      const jy = fy - Math.sin(t * Math.PI) * 54 + 8;
      const rot = -0.9 + t * 1.9;
      g.save();
      g.translate(jx, jy);
      g.rotate(rot);
      px.drawSprite(g, st.jump.fish, 0, 0, 0.62, true);
      g.restore();
      // 水花
      if (t < 0.16 || t > 0.86) {
        for (let i = 0; i < 9; i++) {
          g.fillStyle = 'rgba(240,250,255,.75)';
          g.fillRect(fx - 8 + i * 2, fy - Math.abs(Math.sin(i + time * 0.02)) * 6, 1, 2);
        }
      }
    }
  };

  /* ---------- 地點縮圖 ---------- */
  px.locThumb = function (loc, w, h) {
    const cv = px.make(w || 76, h || 50);
    const g = cv.getContext('2d');
    const P = loc.scene;
    const W = cv.width, H = cv.height;
    const R = FG.seeded((loc.seed || 1) + 9);
    const hz = Math.round(H * 0.42);
    for (let y = 0; y < hz; y++) {
      const t = y / hz;
      const idx = FG.clamp(Math.floor(t * (P.sky.length - 1)), 0, P.sky.length - 2);
      g.fillStyle = FG.mix(P.sky[idx], P.sky[idx + 1], t * (P.sky.length - 1) - idx);
      g.fillRect(0, y, W, 1);
    }
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(R() * W), hgt = 4 + R() * 8;
      g.fillStyle = R() < 0.2 ? (P.accent ? P.accent[0] : P.midTree) : P.midTree;
      for (let k = 0; k < hgt; k++) {
        const ww = Math.max(1, Math.round(hgt * 0.4 * (k / hgt)));
        g.fillRect(x - Math.floor(ww / 2), hz - hgt + k, ww, 1);
      }
    }
    for (let y = hz; y < H; y++) {
      g.fillStyle = FG.mix(P.waterTop, P.waterBot, (y - hz) / (H - hz));
      g.fillRect(0, y, W, 1);
    }
    for (let i = 0; i < 40; i++) {
      const y = hz + 2 + R() * (H - hz - 3);
      g.fillStyle = P.highlight;
      g.globalAlpha = 0.7;
      g.fillRect(Math.floor(R() * W), Math.floor(y), 1 + Math.floor(R() * 4), 1);
    }
    g.globalAlpha = 1;
    return cv;
  };

  /* ============================================================
     家園房間
     ============================================================ */

  const ROOM_W = 200, ROOM_H = 150;
  px.roomSize = { w: ROOM_W, h: ROOM_H };

  px.drawRoom = function (g, st) {
    const W = ROOM_W, H = ROOM_H;
    const time = st.time || 0;
    const level = st.tankLevel || 1;
    const deco = st.deco || {};
    g.imageSmoothingEnabled = false;

    function rect(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }

    const floorY = H - 38;

    // 牆
    rect(0, 0, W, floorY, '#3a3242');
    for (let x = 0; x < W; x += 8) rect(x, 0, 3, floorY, '#413848');
    rect(0, floorY - 5, W, 5, '#2b2530');
    // 地板
    rect(0, floorY, W, H - floorY, '#6b4a30');
    for (let y = floorY; y < H; y += 6) rect(0, y, W, 1, '#5a3d27');
    for (let x = 0; x < W; x += 14) rect(x, floorY, 1, H - floorY, '#5a3d27');

    // 窗戶（看得到湖景）
    rect(146, 14, 44, 34, '#241f2b');
    rect(148, 16, 40, 30, '#7fb2cf');
    rect(148, 30, 40, 16, '#5a86a8');
    for (let i = 0; i < 10; i++) rect(150 + (i * 7) % 34, 33 + (i * 3) % 12, 3, 1, '#dceef7');
    rect(167, 16, 2, 30, '#241f2b');
    rect(148, 30, 40, 2, '#241f2b');

    // 牆上掛畫（目前釣點的風景）
    if (st.poster) {
      const pw = st.poster.width, ph = st.poster.height;
      const pxx = 112, pyy = 54;
      rect(pxx - 3, pyy - 3, pw + 6, ph + 6, '#6b4a2c');
      rect(pxx - 2, pyy - 2, pw + 4, ph + 4, '#8a6238');
      rect(pxx - 1, pyy - 1, pw + 2, ph + 2, '#2a1e14');
      g.drawImage(st.poster, pxx, pyy);
      g.globalAlpha = 0.1;
      rect(pxx, pyy, pw, Math.round(ph / 2), '#ffffff');
      g.globalAlpha = 1;
    }

    // 壁掛（獎盃架）
    if (deco.trophy) {
      rect(96, 16, 40, 4, '#7a5a38');
      for (let i = 0; i < 3; i++) {
        rect(102 + i * 12, 8, 6, 8, '#e0b64a');
        rect(103 + i * 12, 6, 4, 2, '#f5db8a');
      }
    }

    // 魚缸（等級決定尺寸）
    const tw = 76 + (level - 1) * 12;
    const th = 52 + (level - 1) * 5;
    const tx = 12, ty = floorY - th - 12;
    rect(tx + 4, ty + th + 2, tw - 8, 10, '#4a3320');           // 缸架
    rect(tx + 2, ty + th + 10, 6, 6, '#3a2718');
    rect(tx + tw - 8, ty + th + 10, 6, 6, '#3a2718');
    rect(tx, ty, tw, th, '#123244');                             // 水
    for (let y = 0; y < th; y++) rect(tx, ty + y, tw, 1, FG.mix('#1b4f68', '#0e2a3a', y / th));
    // 缸內光紋
    for (let i = 0; i < 16; i++) {
      const yy = ty + 3 + ((i * 5 + Math.floor(time * 0.01)) % (th - 6));
      g.globalAlpha = 0.16;
      rect(tx + 2 + (i * 7) % (tw - 8), yy, 4, 1, '#bfeaff');
      g.globalAlpha = 1;
    }
    // 底砂與水草
    rect(tx, ty + th - 6, tw, 6, '#3d3a2c');
    for (let i = 0; i < Math.round(tw / 10); i++) {
      const gx = tx + 5 + i * 10;
      const gh = 8 + ((i * 37) % 9);
      for (let k = 0; k < gh; k++) {
        rect(gx + Math.round(Math.sin(k * 0.5 + time * 0.002 + i) * 1.5), ty + th - 6 - k, 1, 1, '#3f8a4d');
      }
    }
    // 玻璃外框
    rect(tx - 2, ty - 2, tw + 4, 2, '#c8d6de');
    rect(tx - 2, ty + th, tw + 4, 2, '#8fa2ad');
    rect(tx - 2, ty - 2, 2, th + 4, '#c8d6de');
    rect(tx + tw, ty - 2, 2, th + 4, '#8fa2ad');
    g.globalAlpha = 0.12;
    rect(tx, ty, tw, 6, '#ffffff');
    g.globalAlpha = 1;

    // 裝飾品
    if (deco.rug) {
      rect(104, floorY + 8, 60, 16, '#8c4a4a');
      rect(108, floorY + 11, 52, 10, '#a95c58');
      rect(116, floorY + 13, 36, 6, '#c9807a');
    }
    if (deco.plant) {
      rect(178, floorY - 14, 12, 16, '#8a5a3a');
      rect(180, floorY - 16, 8, 3, '#a5714a');
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2;
        rect(184 + Math.cos(a) * 8, floorY - 22 + Math.sin(a) * 7, 3, 3, i % 3 ? '#3f8a4d' : '#57a95c');
      }
      rect(183, floorY - 26, 3, 10, '#2f6b3a');
    }
    if (deco.lamp) {
      rect(92, 0, 3, 24, '#3a3038');
      rect(84, 24, 19, 3, '#c9a24a');
      rect(86, 27, 15, 4, '#f2d98a');
      g.globalAlpha = 0.13;
      for (let i = 0; i < 26; i++) rect(93 - i * 0.8, 31 + i, 4 + i * 1.6, 1, '#ffe9a8');
      g.globalAlpha = 1;
    }
    if (deco.neon) {
      const on = Math.sin(time * 0.004) > -0.6;
      const c = on ? '#59d8ff' : '#2a5566';
      rect(104, 54, 30, 2, c);
      rect(104, 54, 2, 12, c);
      rect(132, 54, 2, 12, c);
      rect(104, 64, 30, 2, c);
      if (on) { g.globalAlpha = 0.12; rect(98, 48, 42, 24, '#59d8ff'); g.globalAlpha = 1; }
    }
    if (deco.cat) {
      const wave = Math.sin(time * 0.005) > 0 ? 0 : 1;
      const cx = 168, cy = floorY - 20;
      rect(cx, cy + 6, 14, 14, '#f2ece2');
      rect(cx + 2, cy, 10, 8, '#f2ece2');
      rect(cx + 1, cy - 2, 3, 3, '#f2ece2');
      rect(cx + 10, cy - 2, 3, 3, '#f2ece2');
      rect(cx + 4, cy + 3, 2, 2, '#2a2a2a');
      rect(cx + 8, cy + 3, 2, 2, '#2a2a2a');
      rect(cx + 13, cy + 2 + wave * 4, 3, 5, '#f2ece2');
      rect(cx + 3, cy + 12, 8, 5, '#d8a53a');
    }

    // 睡覺的水豚
    px.drawMap(g, CAPY.map, CAPY.pal, 126, floorY - 2, 1);
    if (Math.sin(time * 0.0012) > 0) {
      g.fillStyle = '#cfe0ea';
      g.fillRect(142, floorY - 8, 2, 2);
      g.fillRect(145, floorY - 12, 3, 3);
    }

    return { tank: { x: tx, y: ty, w: tw, h: th } };
  };

})(window.FG);
