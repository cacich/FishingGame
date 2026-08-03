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
    ray:    { bodyLen: .46, bodyH: .80, gamma: 1.00, e: .30, tailLen: .36, tailH: .03, fork: .00, dorsal: .04, dorsalAt: [.34, .50], anal: .04, analAt: [.34, .50] },

    // ── 以下五種是為魚王設計的專屬輪廓 ──
    // 五位魚王原本全是 shape:'wide' + glow + scar，只有配色不同，並排時完全認不出是不同的魚。
    // 體型是這個解析度下最強的辨識線索（比花紋、比配色都強），所以一王一型，不共用。
    // gamma < 1 把最寬處推向尾部、> 1 推向頭部，是拉開輪廓差異最有效的旋鈕。
    catfish: { bodyLen: .62, bodyH: .44, gamma: 1.42, e: .34, tailLen: .18, tailH: .50, fork: .02, dorsal: .18, dorsalAt: [.50, .68], anal: .32, analAt: [.06, .42] },
    tuna:    { bodyLen: .52, bodyH: .50, gamma: 1.08, e: .52, tailLen: .22, tailH: 1.05, fork: .72, dorsal: .54, dorsalAt: [.36, .52], anal: .30, analAt: [.20, .34] },
    dragon:  { bodyLen: .66, bodyH: .32, gamma: 1.18, e: .56, tailLen: .18, tailH: .95, fork: .22, dorsal: .52, dorsalAt: [.16, .82], anal: .30, analAt: [.12, .50] },
    pike:    { bodyLen: .66, bodyH: .34, gamma: 0.78, e: .60, tailLen: .16, tailH: .72, fork: .34, dorsal: .38, dorsalAt: [.08, .26], anal: .28, analAt: [.06, .22] },
    abyss:   { bodyLen: .60, bodyH: .52, gamma: 1.70, e: .40, tailLen: .22, tailH: .48, fork: .12, dorsal: .24, dorsalAt: [.16, .50], anal: .22, analAt: [.10, .36] },
    // 鱘／鱘形目：背鰭與臀鰭都極靠尾、深叉尾。身體刻意畫短，長度靠 rostrum 補回來
    paddle:  { bodyLen: .54, bodyH: .38, gamma: 1.25, e: .46, tailLen: .18, tailH: .88, fork: .55, dorsal: .32, dorsalAt: [.08, .28], anal: .24, analAt: [.05, .20] },
    // 真蛇：**幾乎沒有鰭**，尾巴收成一點（不是尾鰭）。
    // e = .30 讓剖面接近矩形＝粗細均勻的管子，這是「蛇」跟 dragon 那種帶狀魚身最大的差別；
    // dragon 有 tailH .95 的大尾扇與高聳的鬃，serpent 兩者都沒有
    serpent: { bodyLen: .78, bodyH: .21, gamma: 1.30, e: .30, tailLen: .07, tailH: .14, fork: .00, dorsal: .05, dorsalAt: [.10, .80], anal: .04, analAt: [.10, .60] }
  };

  const SPR_W = 96, SPR_H = 56, MARGIN = 4;

  const fishCache = {};

  // 產生一隻魚的像素精靈（面向右）
  function buildFish(f) {
    const W = SPR_W, H = SPR_H;
    const S = SHAPES[f.shape] || SHAPES.normal;
    const rng = FG.seeded(hashStr(f.id));

    const usableW = W - MARGIN * 2;
    const sp = f.special || [];

    // 會往吻端前方延伸的 special 要先預留空間。不預留的話，魚王級的 scale 會把吻端推到 x≈91，
    // 那些特徵只剩 3px 可畫＝等於完全看不見（原本有鬍鬚的魚王全中這個坑）。
    // 新增這類 special 時記得在這裡登記需要的 px 數，取最大值。
    const HEAD_ROOM = { whisker: 12, rostrum: 24, forkTongue: 12 };
    let headRoom = 0;
    for (const k in HEAD_ROOM) if (sp.indexOf(k) >= 0) headRoom = Math.max(headRoom, HEAD_ROOM[k]);
    // 避免體型倍率把魚撐出畫面；有鬍鬚時連同前方留白一起算進去
    const sc = Math.min(f.scale || 1, (0.98 - headRoom / usableW) / (S.bodyLen + S.tailLen));
    const halfMax = (H / 2 - MARGIN) * S.bodyH * sc;
    const bodyW = Math.max(6, Math.round(usableW * S.bodyLen * sc));
    const tailW = Math.max(3, Math.round(usableW * S.tailLen * sc));
    const total = bodyW + tailW;
    // 有多餘空間時置中；空間不夠時優先把留白讓給吻端前方（否則鬍鬚會被切掉）
    const slack = usableW - total;
    const xStart = Math.round(MARGIN + Math.max(0, Math.min(slack / 2, slack - headRoom)));
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

    // --- 傷疤 ---
    // 只有霧語巨鯰「翁德」用這個：牠的傳說明寫「背上那道疤」，是角色設定的一部分。
    // 別因為「魚王看起來比較猛」就到處加，五王同疤就會變成看不出差別的貼圖。
    if (sp.indexOf('scar') >= 0) {
      const scarC = C.scar || '#efd9c0';
      const sx = Math.round(x0 + bodyW * 0.52);
      const half = profile(0.52);
      const top = Math.round(cy - half * 0.9);
      // 長度夾在 6～9：疤要在「背上」，拉太長會貫穿整條魚，看起來像被切成兩半
      const len = FG.clamp(Math.round(half * 0.8), 6, 9);
      for (let k = 0; k < len; k++) {
        const x = sx + Math.round(k * 0.6), y = top + k;
        const i = y * W + x;
        if (col[i]) col[i] = scarC;
        // 每三格往兩側岔出一格，讀起來才是「癒合的舊傷」而不是一道亮線
        if (k % 3 === 1) {
          const a = y * W + (x - 2), b = y * W + (x + 2);
          if (col[a]) col[a] = FG.mix(col[a], scarC, 0.7);
          if (col[b]) col[b] = FG.mix(col[b], scarC, 0.7);
        }
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
    // 基部兩格寬、尖端一格寬。原本整根都是 1px，跟 mane 的細絲擺在一起會分不出哪根是角。
    if (sp.indexOf('horn') >= 0) {
      const hc = C.hornColor || '#f2e2a8';
      const hx = Math.round(x0 + bodyW * 0.84);
      for (let k = 0; k < 6; k++) {
        const x = hx + Math.round(k * 0.8), y = Math.round(cy - profile(0.84) - k);
        for (let d = 0; d < (k < 3 ? 2 : 1); d++) {
          const xx = x - d;
          if (xx < 0 || xx >= W || y < 0 || y >= H) continue;
          col[y * W + xx] = hc;
        }
      }
    }
    // --- 劍狀長吻（鱘、白鱘、匙吻鱘）---
    // 一片扁平的槳狀吻板，長度接近體長的一半。這是全檔唯一「往身體外長出主要體積」的
    // 特徵，所以它必須登記在 HEAD_ROOM 裡，否則會被畫布右緣切掉。
    if (sp.indexOf('rostrum') >= 0) {
      const rc = C.rostrum || FG.mix(body, back, 0.35);
      const len = Math.max(10, Math.round(bodyW * 0.46));
      const my = Math.round(cy - profile(0.995) * 0.15);
      for (let k = 1; k <= len; k++) {
        const u = k / len;
        // 板狀：從吻基往前先變厚（u≈0.3 最厚）再收成圓鈍的尖端。
        // 純三角形會變成一根「針」，讀不出是槳狀吻板。
        const half = Math.max(0.6, Math.sin(Math.pow(u, 0.55) * Math.PI) * halfMax * 0.30 + 1.1 - u * 0.9);
        const y0 = Math.round(my - half), y1 = Math.round(my + half);
        const x = x1 + k;
        if (x < 0 || x >= W) break;
        for (let y = y0; y <= y1; y++) {
          if (y < 0 || y >= H) continue;
          // 上緣用背色、下緣提亮，讓這片薄板在沒有光照系統的情況下有厚度
          col[y * W + x] = y === y0 ? back : (y === y1 ? FG.shade(rc, 0.22) : rc);
        }
      }
    }
    // --- 分叉的蛇舌 ---
    // 在 serpent 這種沒有鰭、沒有尾扇的輪廓上，舌頭是唯一能把「蛇」跟「鰻」分開的訊號。
    // 分叉一定要張得夠開（末端上下各 3px）；只岔 1px 在 4 倍放大後看起來只是一條粗線。
    if (sp.indexOf('forkTongue') >= 0) {
      const tc = C.tongue || '#e0566a';
      const my = Math.round(cy + profile(0.96) * 0.45);
      const stem = 7;
      for (let k = 1; k <= stem; k++) {
        const x = x1 + k;
        if (x < 0 || x >= W) break;
        if (my >= 0 && my < H && !col[my * W + x]) col[my * W + x] = tc;
      }
      for (let j = 1; j <= 3; j++) {
        for (let s = -1; s <= 1; s += 2) {
          const x = x1 + stem + j, y = my + s * j;
          if (x < 0 || x >= W || y < 0 || y >= H) continue;
          if (!col[y * W + x]) col[y * W + x] = tc;
        }
      }
    }
    // --- 巨顎與外露獠牙 ---
    // 原本的「嘴」只有吻端 4px 的一道暗痕，在掠食型魚王身上完全撐不起「顎」的印象。
    // 這裡把咬合線拉長到體長的兩成，再交錯插上亮色牙齒——牙齒畫在身體像素上（不外凸），
    // 因為 1px 的外凸尖刺在 4 倍放大後會被讀成雜點。
    if (sp.indexOf('jaw') >= 0) {
      const tooth = C.tooth || '#f8f4e6';
      const jawLen = Math.max(8, Math.round(bodyW * 0.20));
      const my = Math.round(cy + profile(0.92) * 0.34);
      for (let k = 0; k <= jawLen; k++) {
        const i = my * W + (x1 - k);
        if (col[i]) col[i] = FG.shade(outline, 0.12);
      }
      for (let k = 2; k < jawLen; k += 3) {
        const x = x1 - k;
        for (let d = 1; d <= 2; d++) {
          const up = (my - d) * W + x, dn = (my + d) * W + x;
          if (col[up]) col[up] = tooth;                       // 上排牙往下咬
          if (k % 6 === 2 && col[dn]) col[dn] = tooth;        // 下排牙較稀疏，避免糊成一條白帶
        }
      }
    }
    // --- 頭頂發光燈籠（鮟鱇式誘餌）---
    // 從頭頂往前上方畫一段弧，末端才是燈籠。弧線一定要「往上」長：
    // 從高處往下垂的細線在這個尺寸會被讀成雨絲（同地形系統踩過的坑）。
    if (sp.indexOf('lantern') >= 0) {
      const bulb = C.lantern || C.glow || '#9f6fff';
      const stalk = FG.shade(back, 0.08);
      const sx = Math.round(x0 + bodyW * 0.80);
      const sy = Math.round(cy - profile(0.80)) - 1;
      let bx = sx, by = sy;
      // 取樣要夠密（24 段）：步距超過 1px 會讓竿子斷成虛線，看起來像三顆浮在頭上的點
      for (let k = 0; k <= 24; k++) {
        const u = k / 24;
        bx = Math.round(sx + u * bodyW * 0.16);
        by = Math.round(sy - Math.sin(u * 1.9) * halfMax * 0.52);
        if (bx < 0 || bx >= W || by < 0 || by >= H) continue;
        const i = by * W + bx;
        if (!col[i]) col[i] = stalk;
      }
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (Math.abs(dx) + Math.abs(dy) > 1) continue;       // 菱形，方形會像顆螺絲
        const x = bx + dx, y = by + dy;
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        col[y * W + x] = bulb;
      }
    }
    // --- 尾柄離鰭（鮪魚科的識別特徵）---
    if (sp.indexOf('finlet') >= 0) {
      const fc = FG.shade(patC, 0.15);
      for (let k = 0; k < 4; k++) {
        const t = 0.04 + k * 0.04;
        const x = Math.round(x0 + bodyW * t);
        const half = profile(t);
        for (let d = 1; d <= 2; d++) {
          const up = (Math.round(cy - half) - d) * W + x;
          const dn = (Math.round(cy + half) + d) * W + x;
          if (up >= 0 && !col[up]) col[up] = fc;
          if (dn < W * H && !col[dn]) col[dn] = fc;
        }
      }
    }
    // --- 鬃（龍型的飄動纖毛）---
    // 長在背鰭上緣，短且往頭部方向斜，才有「在水裡飄」的動感。
    if (sp.indexOf('mane') >= 0) {
      const mc = C.mane || FG.shade(finC, 0.3);
      const dor = halfMax * S.dorsal;
      for (let k = 0; k < 8; k++) {
        const t = 0.20 + k * 0.075;
        const x = Math.round(x0 + bodyW * t);
        const base = Math.round(cy - profile(t) - dor * Math.pow(Math.sin(Math.PI * FG.clamp((t - S.dorsalAt[0]) / (S.dorsalAt[1] - S.dorsalAt[0]), 0, 1)), .55));
        const len = 3 + (k % 3);
        for (let j = 0; j < len; j++) {
          // 往尾部（左）斜：魚是朝右游的，纖毛要往後飄才有動感，往前斜會變成一排天線
          const xx = x - Math.round(j * 0.7), yy = base - 1 - j;
          if (xx < 0 || xx >= W || yy < 0) continue;
          const i = yy * W + xx;
          if (!col[i]) col[i] = mc;
        }
      }
    }
    // --- 霜晶（結冰體表）---
    // 十字形而不是單點：單點會跟 pattern:'speck' 的細碎雜訊混在一起看不出來。
    if (sp.indexOf('frost') >= 0) {
      const fr = C.frost || '#eaf7ff';
      // 只放 6 顆：跟 pattern 的斑點疊在一起時，再多就變成一團看不出結構的雜訊
      for (let k = 0; k < 6; k++) {
        const t = 0.14 + ((k * 7) % 9) * 0.075;
        const half = profile(t);
        const x = Math.round(x0 + bodyW * t);
        const y = Math.round(cy - half * (0.2 + ((k * 3) % 5) * 0.13));
        for (let d = -1; d <= 1; d++) {
          const a = (y + d) * W + x, b = y * W + (x + d);
          if (a >= 0 && a < W * H && col[a]) col[a] = fr;
          if (b >= 0 && b < W * H && col[b]) col[b] = FG.mix(col[b], fr, 0.75);
        }
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
    },
    // 冰湖用：稜角分明的浮冰，光從左上進來所以左上最亮
    ice: {
      pal: { X: '#3f6d86', a: '#7fb4cc', b: '#b6dcec', c: '#e8f8ff' },
      map: [
        '....XXXX....',
        '...XccccX...',
        '..XcccbbbX..',
        '.XccbbbbbaX.',
        'XcbbbbbaaaX.',
        'XbbbbbaaaaX.',
        'XbbbaaaaaaX.',
        '.XbaaaaaaX..',
        '..XaaaaaX...',
        '...XXXXX....'
      ]
    },
    // 神域用：繪馬（五角形的木製祈願牌，上緣的尖頂是它的識別特徵）
    ema: {
      pal: { X: '#4a2e1c', w: '#a87c4e', l: '#d0a871', k: '#2b1a10' },
      map: [
        '.....XX.....',
        '....XwwX....',
        '...XwllwX...',
        '..XwllllwX..',
        '.XwlkkkklwX.',
        'XwllkllklwwX',
        'XwlkkkllklwX',
        'XwllkllkklwX',
        'XwwlllllllwX',
        '.XwwwwwwwwX.',
        '..XXXXXXXX..'
      ]
    },
    // 蓮江用：青花碎碗。缺口刻意開在右上（不是正中），對稱的破損看起來像設計而不是破掉；
    // 碗內的藍色紋樣要「斷開」跨過缺口，才讀得出是碎片而不是一只完整的小碗
    porcelain: {
      pal: { X: '#2b3a4e', w: '#eef3f8', s: '#c3d2de', b: '#2f5fa8', l: '#6f9bd6' },
      map: [
        'Xww.......',
        'XwwbX.....',
        'Xwlbbw.X..',
        'XwbllbwXwX',
        'Xwwbllbwww',
        'XswwbllbwX',
        'XsswwbbwwX',
        '.XsswwwwsX',
        '..XssssssX',
        '...XXXXXX.'
      ]
    },
    // 世界樹根用：裂開的維京圓盾。同心圓（鐵緣 → 彩繪環 → 中央凸飾）是圓盾的識別結構，
    // 少了中央那顆凸飾就只是一個圓圈。裂縫從右緣往內咬進去、右下角整塊缺掉——
    // 破損刻意做成**不對稱**，對稱的缺口會被讀成「設計」而不是「壞了」
    shield: {
      pal: { X: '#2a2118', w: '#c8b491', r: '#8e3a30', b: '#8a8f98', B: '#d4dae2' },
      map: [
        '...XXXXXX...',
        '..XwwwwwwX..',
        '.XwrrrrrrwX.',
        'XwrrwwwwrrwX',
        'XwrwwbbwXrwX',
        'XwrwbBBbwrwX',
        'XwrwwbbwwrwX',
        'XwrrwwwXrrwX',
        '.XwrrrrX.wX.',
        '..XwwwX.....',
        '...XXX......'
      ]
    },
    // 深淵用：辨識不出物種的魚骨。頭在左、脊椎往右、肋骨是垂直短線
    bone: {
      pal: { b: '#e6e0cc', o: '#2a2822' },
      map: [
        '...bbbb.........',
        '..b....b........',
        '.b..o...b.b.b...',
        'b........b.b.b.b',
        'b.......bbbbbbbb',
        'b........b.b.b.b',
        '.b......b.b.b...',
        '..b....b........',
        '...bbbb.........'
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

  /* ------------------------------------------------------------
     地形產生器 · TERRAIN

     每個釣點用 scene.terrain 指定一種。**只負責畫地平線以上的剪影**
     （天空漸層、水面、倒影、深水都是共用的，不必也不該各寫一份）。
     這樣設計的好處：倒影是把地平線上方逐列取出來疊回水面的，
     所以換地形，倒影會自動跟著換，不需要為每種地形另寫倒影碼。

     簽名：above(ctx, ctx物件) — 見 buildBackground 裡組出來的 T 物件。
     另有選用的 below(...)，畫「站在水面上」的物件（例如鳥居），
     會在水面、倒影、深水全部畫完之後才執行。
     ------------------------------------------------------------ */
  const TERRAIN = {};

  // 一 · 森林：起伏山稜 + 遠中近三層針葉林（晨霧湖）
  TERRAIN.forest = {
    above: function (T) {
      const { P, R, W, horizon, rect } = T;
      if (P.hill) {
        let hy = horizon - 46;
        for (let x = 0; x < W; x++) {
          hy += (R() - 0.5) * 2.4;
          hy = FG.clamp(hy, horizon - 62, horizon - 30);
          rect(x, hy, 1, horizon - hy, P.hill);
        }
      }
      T.forest(horizon - 12, 22, P.farTree, 90, P.accent);
      T.forest(horizon - 4, 26, P.midTree, 80, P.accent);
      T.forest(horizon + 1, 20, P.nearTree, 60, P.accent2 || P.accent);
    }
  };

  // 二 · 峽灣：兩側崖壁夾出中央水道 + 幾根海蝕柱（落霞峽灣）
  //   崖高用 pow 曲線從邊緣往中央衰減，中間留白才有「峽」的感覺
  TERRAIN.cliff = {
    above: function (T) {
      const { P, R, W, horizon, rect } = T;

      function wall(color, peak, reach, side, jag) {
        let noise = 0;
        for (let x = 0; x < W; x++) {
          const d = side < 0 ? x / reach : (W - 1 - x) / reach;    // 0 = 貼著畫面邊緣
          if (d > 1) continue;
          noise += (R() - 0.5) * jag;
          noise = FG.clamp(noise, -6, 6);
          const h = peak * Math.pow(1 - d, 1.7) + noise * (1 - d);
          if (h < 2) continue;
          rect(x, horizon - h, 1, h, color);
          // 崖面的垂直節理：每 7px 一道暗紋，讓平塗的剪影有岩壁質感
          if (x % 7 === 0) rect(x, horizon - h * 0.8, 1, h * 0.8, FG.shade(color, -0.22));
        }
      }
      // 遠側崖（淺）先畫，近側崖（深）後畫蓋上去，做出空氣透視
      wall(P.farTree, 74, 120, -1, 2.2);
      wall(P.farTree, 62, 96, 1, 2.2);
      wall(P.midTree, 92, 74, -1, 3.0);
      wall(P.nearTree, 104, 58, 1, 3.4);

      // 中央水道上的海蝕柱
      for (let i = 0; i < 3; i++) {
        const sx = 78 + Math.floor(R() * 46);
        const sh = 12 + R() * 22, sw = 3 + Math.floor(R() * 3);
        rect(sx, horizon - sh, sw, sh, P.midTree);
        rect(sx, horizon - sh, 1, sh, FG.shade(P.midTree, 0.18));
      }
    }
  };

  // 三 · 冰原：遠方冰川牆 + 擠壓冰脊（三角冰刺）+ 水面浮冰（幽藍冰湖）
  TERRAIN.ice = {
    above: function (T) {
      const { P, R, W, horizon, rect } = T;

      // 遠方冰川牆：一整條平頂的塊體，用垂直裂隙線做出厚度
      const wallTop = horizon - 34;
      rect(0, wallTop, W, horizon - wallTop, P.farTree);
      // 裂隙：只從冰川「底部」往上長，長度短。從頂端往下垂會被看成雨絲
      for (let x = 0; x < W; x += 3) {
        if (R() < 0.55) continue;
        const d = 3 + R() * 9;
        rect(x, horizon - d, 1, d, FG.shade(P.farTree, R() < 0.5 ? 0.16 : -0.24));
      }
      rect(0, wallTop, W, 2, FG.shade(P.farTree, 0.3));   // 冰川頂緣的受光面

      // 擠壓冰脊：**刻意畫成又寬又扁的斜面板塊**，而不是三角錐——
      // 尖三角在這個尺寸下會被誤讀成針葉樹，那就跟晨霧湖沒有分別了
      function ridge(baseY, maxH, color, n, lean) {
        for (let i = 0; i < n; i++) {
          const x = Math.floor(R() * (W + 30)) - 15;
          const h = maxH * (0.4 + R() * 0.7);
          const w = Math.max(10, Math.round(h * (1.8 + R() * 1.6)));   // 寬遠大於高
          const topW = w * (0.25 + R() * 0.3);                          // 頂面是平的，不收到一點
          for (let k = 0; k < h; k++) {
            const t = k / h;
            const ww = Math.max(2, Math.round(w + (topW - w) * t));
            const off = Math.round(k * lean);
            rect(x - ww / 2 + off, baseY - k - 1, ww, 1, color);
          }
          // 左上受光面 + 頂緣高光，是「冰」而不是「岩」的關鍵
          for (let k = 0; k < h; k++) {
            const t = k / h;
            const ww = Math.max(2, Math.round(w + (topW - w) * t));
            rect(x - ww / 2 + Math.round(k * lean), baseY - k - 1, Math.max(1, Math.round(ww * 0.28)), 1, FG.shade(color, 0.3));
          }
          rect(x - topW / 2 + Math.round(h * lean), baseY - h - 1, topW, 1, FG.shade(color, 0.42));
        }
      }
      ridge(horizon - 2, 13, P.midTree, 14, 0.5);
      ridge(horizon + 2, 18, P.nearTree, 11, -0.42);
    },
    below: function (T) {
      const { P, R, W, H, horizon, rect } = T;
      // 水面浮冰：越靠近畫面下緣越大，做出景深。避開船身區域（x 40~150、y 225~260）
      for (let i = 0; i < 14; i++) {
        const y = horizon + 8 + R() * (H - horizon - 30);
        const near = (y - horizon) / (H - horizon);
        const w = Math.round(6 + near * 22 + R() * 8);
        const x = Math.round(R() * (W + 20)) - 10;
        if (x + w > 34 && x < 158 && y > 216 && y < 268) continue;
        const h = Math.max(2, Math.round(w * 0.28));
        rect(x, y, w, h, P.floe || '#cfe8f4');
        rect(x + 1, y, w - 2, 1, FG.shade(P.floe || '#cfe8f4', 0.25));
        rect(x, y + h, w, 1, FG.shade(P.floe || '#cfe8f4', -0.45));   // 貼水面的暗邊
      }
    }
  };

  // 四 · 夜海：星空 + 低矮海蝕柱 + 水面生物發光（深淵海溝）
  //   這裡沒有陸地可畫，改用「幾乎空無一物」來表達開闊與不安
  TERRAIN.night = {
    above: function (T) {
      const { P, R, W, horizon, rect } = T;
      // 星星：越靠近地平線越稀疏（大氣消光）
      for (let i = 0; i < 150; i++) {
        const y = Math.floor(Math.pow(R(), 0.7) * (horizon - 6));
        const x = Math.floor(R() * W);
        const bright = R();
        if (bright < 0.12) rect(x, y, 2, 1, P.star || '#dff2ff');
        else rect(x, y, 1, 1, bright < 0.5 ? FG.shade(P.star || '#dff2ff', -0.45) : (P.star || '#dff2ff'));
      }
      // 遠方海蝕柱：少而粗，成一小群。太多太細會變成一排欄杆
      const cluster = 20 + R() * 90;
      for (let i = 0; i < 4; i++) {
        const x = Math.floor(cluster + R() * 70);
        const h = 9 + R() * 22;
        const w = 5 + Math.floor(R() * 7);
        rect(x, horizon - h, w, h, P.nearTree);
        rect(x, horizon - h, 1, h, FG.shade(P.nearTree, 0.35));   // 迎光的那一側
      }
      // 貼著地平線的一層薄霧，把星空與海面分開
      for (let k = 0; k < 5; k++) {
        T.g.globalAlpha = 0.1 * (5 - k) / 5;
        rect(0, horizon - 6 + k, W, 1, P.hill || '#0a1622');
      }
      T.g.globalAlpha = 1;
    },
    below: function (T) {
      const { P, R, W, H, horizon, rect } = T;
      // 生物發光：成團的靜態光點，密度往下增加
      for (let i = 0; i < 90; i++) {
        const y = horizon + 4 + Math.pow(R(), 0.6) * (H - horizon - 6);
        const x = Math.floor(R() * W);
        T.g.globalAlpha = 0.25 + R() * 0.5;
        rect(x, y, 1, 1, P.plankton || '#5fe0d8');
      }
      T.g.globalAlpha = 1;
    }
  };

  // 五 · 神域：錐形雪山 + 五重塔 + 櫻花林，鳥居立在水上（宵櫻神域）
  TERRAIN.shrine = {
    above: function (T) {
      const { P, R, W, horizon, rect } = T;

      // --- 錐形雪山：直線斜邊，跟 forest 的隨機遊走山稜是完全不同的輪廓 ---
      const peakX = 128, peakY = horizon - 86, slope = 1.45;
      for (let y = peakY; y < horizon; y++) {
        const half = (y - peakY) * slope;
        const snow = (y - peakY) < 22;
        // 山頂積雪的下緣做成不規則，避免一條死板的水平線
        const jag = snow && (y - peakY) > 15 ? Math.sin(y * 2.7) * 3 : 0;
        rect(peakX - half, y, half * 2, 1, snow ? (P.snow || '#eef4f8') : P.hill);
        if (snow && (y - peakY) > 14) {
          rect(peakX - half, y + jag, half * 0.5, 1, P.hill);        // 左側的雪線缺口
          rect(peakX + half * 0.6, y - jag, half * 0.4, 1, P.hill);  // 右側
        }
      }
      // 山體左側的陰影面
      for (let y = peakY; y < horizon; y++) {
        const half = (y - peakY) * slope;
        rect(peakX - half, y, Math.max(1, half * 0.22), 1, FG.shade(P.hill, -0.22));
      }

      // --- 五重塔剪影（左側）：五層屋簷，每層往上收窄 ---
      const tx = 34, tBase = horizon - 2;
      let ty = tBase;
      for (let lv = 0; lv < 5; lv++) {
        const w = 26 - lv * 3.4;              // 塔身寬度往上收
        const eaves = w + 9;                  // 屋簷比塔身寬，這是日式塔最明顯的特徵
        rect(tx - w / 2, ty - 11, w, 11, P.pagoda || '#3a2630');
        rect(tx - eaves / 2, ty - 14, eaves, 3, P.pagodaRoof || '#241a22');
        rect(tx - eaves / 2 + 1, ty - 15, eaves - 2, 1, FG.shade(P.pagodaRoof || '#241a22', 0.25));
        ty -= 14;
      }
      rect(tx - 1, ty - 9, 2, 9, P.pagodaRoof || '#241a22');   // 頂上的相輪

      // --- 櫻花林：圓形樹冠（不是針葉的三角形），花色為主、樹幹細 ---
      function sakura(baseY, n, size, canopy, trunk) {
        for (let i = 0; i < n; i++) {
          const x = Math.floor(R() * (W + 16)) - 8;
          const r = size * (0.6 + R() * 0.7);
          const cy = baseY - r - 3;
          rect(x - 1, cy, 2, r + 4, trunk);                       // 樹幹
          for (let dy = -r; dy <= r; dy++) {                      // 圓形樹冠
            const half = Math.sqrt(Math.max(0, r * r - dy * dy));
            rect(x - half, cy + dy, half * 2, 1, canopy);
          }
          for (let k = 0; k < 4; k++) {                           // 樹冠上緣的亮色花簇
            const a = R() * Math.PI;
            rect(x + Math.cos(a) * r * 0.6, cy - Math.sin(a) * r * 0.55, 2, 2, FG.shade(canopy, 0.28));
          }
        }
      }
      sakura(horizon - 6, 16, 7, P.farTree, FG.shade(P.farTree, -0.5));
      sakura(horizon + 1, 13, 10, P.midTree, P.trunk || '#4a3038');

      // --- 岸邊的石燈籠 ---
      for (let i = 0; i < 3; i++) {
        const lx = 8 + Math.floor(R() * (W - 16));
        if (lx > 100 && lx < 160) continue;
        rect(lx - 1, horizon - 9, 3, 9, P.stone || '#8a8378');
        rect(lx - 3, horizon - 14, 7, 4, P.stone || '#8a8378');
        rect(lx - 4, horizon - 16, 9, 2, FG.shade(P.stone || '#8a8378', -0.3));
      }
    },
    below: function (T) {
      const { P, W, horizon, rect } = T;
      // --- 立在水上的大鳥居 ---
      // 位置刻意偏右上（水平線後方一點），才不會跟船與浮標打架
      const cx = 156, baseY = horizon + 46, hgt = 54;
      const red = P.torii || '#c8442f';
      const dark = FG.shade(red, -0.34);
      const top = baseY - hgt;

      function post(x) {
        rect(x - 2, top + 6, 5, hgt - 6, red);
        rect(x - 2, top + 6, 1, hgt - 6, FG.shade(red, 0.22));   // 柱子的受光邊
        rect(x + 2, top + 6, 1, hgt - 6, dark);
      }
      post(cx - 17); post(cx + 17);

      // 笠木（最上面那根，兩端上翹是鳥居的識別特徵）＋島木
      rect(cx - 30, top, 60, 4, dark);
      rect(cx - 32, top + 1, 3, 2, dark);
      rect(cx + 29, top + 1, 3, 2, dark);
      rect(cx - 27, top + 4, 54, 3, red);
      // 貫（中間那根橫木）與額束
      rect(cx - 22, top + 17, 44, 3, red);
      rect(cx - 2, top + 6, 4, 12, red);

      // 倒影：往下鏡射、越遠越淡，讓鳥居真的「站在水裡」
      const g = T.g;
      for (let y = 0; y < hgt; y++) {
        const src = baseY - 1 - y, dst = baseY + 1 + y;
        if (dst >= T.H) break;
        const img = g.getImageData(cx - 34, src, 68, 1);
        const d = img.data;
        let any = false;
        for (let i = 0; i < d.length; i += 4) {
          // 只留下鳥居的朱色（R 明顯大於 B），水面本身不重複疊
          if (d[i] > d[i + 2] + 24 && d[i] > 90) { d[i + 3] = 120; any = true; }
          else d[i + 3] = 0;
        }
        if (!any) continue;
        const tmp = px.make(68, 1);
        tmp.getContext('2d').putImageData(img, 0, 0);
        g.globalAlpha = 0.75 * (1 - y / hgt);
        g.drawImage(tmp, cx - 34 + Math.round(Math.sin(y * 0.8) * 1.5), dst);
        g.globalAlpha = 1;
      }
    }
  };

  // 六 · 峰林水鄉：桂林式圓頂石灰岩塔峰 + 山腰霧帶 + 白牆黑瓦，月拱橋跨在水上（煙雨蓮江）
  //   輪廓要跟既有五種都不撞：塔峰是「垂直側壁 + 圓頂」，跟 cliff 貼邊的崖壁、
  //   shrine 的直線斜邊錐山、ice 的寬扁板塊、night 的矮胖海蝕柱都不一樣。
  //   真正把它變成「中國山水」的不是塔峰，是**橫向的霧帶**——把峰群切成上下兩截，
  //   遠近立刻分開，而且沒有別的地形用橫條。
  TERRAIN.karst = {
    above: function (T) {
      const { P, R, W, horizon, rect } = T;
      const g = T.g;

      // --- 塔峰產生器 ---
      // 側壁近乎垂直（往上只微微內收），頂部用半圓收頭。石灰岩溶蝕出來的就是這個形狀，
      // 也剛好是這個尺寸下唯一不會被誤讀成樹或雪山的山形。
      function tower(cx, h, w, color, streak) {
        const top = horizon - h;
        const capR = Math.max(2, Math.round(w * 0.5));    // 圓頂半徑 = 半個柱寬
        for (let y = top + capR; y < horizon; y++) {
          const t = (y - top) / h;
          const half = w * 0.5 * (0.82 + t * 0.18);       // 越往下越寬，但幅度很小
          rect(cx - half, y, half * 2, 1, color);
        }
        for (let dy = 0; dy < capR; dy++) {               // 半圓頂
          const half = Math.sqrt(Math.max(0, capR * capR - (capR - dy) * (capR - dy))) * (w * 0.5 / capR);
          rect(cx - half, top + dy, half * 2, 1, color);
        }
        // 迎光的左側亮邊 + 垂直溶蝕溝。溝要「從底部往上長」且長度不到全高，
        // 從頂端往下垂的細線在這個尺寸會被讀成雨絲（冰川裂隙踩過的坑）
        rect(cx - w * 0.5 * 0.98, top + capR, Math.max(1, w * 0.16), h - capR, FG.shade(color, 0.2));
        if (streak) {
          for (let i = 0; i < 3; i++) {
            const ox = (R() - 0.5) * w * 0.7;
            const sh = h * (0.25 + R() * 0.3);
            rect(cx + ox, horizon - sh, 1, sh, FG.shade(color, -0.26));
          }
        }
      }

      // 三層峰群，由遠而近。近層刻意留出中央的水道，不然船會被峰壁擋住
      const far = [22, 52, 86, 120, 152, 182];
      far.forEach(function (x) { tower(x + (R() - 0.5) * 10, 54 + R() * 30, 16 + R() * 12, P.farTree, false); });
      [8, 62, 138, 192].forEach(function (x) { tower(x + (R() - 0.5) * 12, 42 + R() * 26, 20 + R() * 14, P.midTree, true); });
      [-6, 206].forEach(function (x) { tower(x, 34 + R() * 20, 26 + R() * 14, P.nearTree, true); });

      // --- 山腰霧帶 ---
      // 三條半透明橫帶，越靠近峰腳越厚越白（霧會積在谷底）。
      // 這是整個地形的靈魂：山水畫的留白就是這樣做的，而且沒有別的地形用橫條。
      // 參數是 [峰高比例, 厚度px, 最大不透明度]
      const mist = P.mist || '#dfe8ee';
      [[0.30, 7, 0.34], [0.52, 6, 0.24], [0.74, 4, 0.15]].forEach(function (b) {
        const y = horizon - (horizon * b[0]);
        for (let k = 0; k < b[1]; k++) {
          g.globalAlpha = b[2] * Math.sin(Math.PI * (k + 0.5) / b[1]);
          rect(0, y + k, W, 1, mist);
        }
      });
      g.globalAlpha = 1;

      // --- 岸邊水鄉：白牆黑瓦。屋頂兩端往上翹是中式屋面的識別特徵 ---
      function house(hx, hw, hh) {
        const wall = P.wall || '#e4e8e6', tile = P.tile || '#2b3038';
        rect(hx, horizon - hh, hw, hh, wall);
        rect(hx, horizon - hh, 1, hh, FG.shade(wall, -0.16));            // 牆面的暗側
        rect(hx - 2, horizon - hh - 3, hw + 4, 3, tile);                 // 屋面
        rect(hx - 3, horizon - hh - 4, 2, 1, tile);                      // 左翹角
        rect(hx + hw + 1, horizon - hh - 4, 2, 1, tile);                 // 右翹角
        rect(hx - 2, horizon - hh - 3, hw + 4, 1, FG.shade(tile, 0.26)); // 屋脊受光
        if (hw >= 9) rect(hx + Math.round(hw / 2) - 1, horizon - hh + 2, 3, 4, FG.shade(tile, 0.1)); // 窗洞
      }
      // 左岸一叢、右岸一叢，中央（船的位置）留空
      house(14, 15, 13); house(30, 10, 9); house(4, 9, 8);
      house(160, 13, 11); house(174, 17, 14);

      // --- 竹叢：細直桿 + 頂端一小撮葉。刻意不用 T.forest()，針葉三角會撞到晨霧湖 ---
      for (let i = 0; i < 22; i++) {
        const x = Math.floor(R() * W);
        if (x > 78 && x < 150) continue;                  // 中央留給水道
        const h = 10 + R() * 12;
        rect(x, horizon - h, 1, h, P.trunk || '#4a5c3a');
        for (let k = 0; k < 3; k++) {
          rect(x - 2 + Math.floor(R() * 5), horizon - h - 1 + k, 2, 1, P.accent ? P.accent[0] : '#6f8a4a');
        }
      }
    },
    below: function (T) {
      const { P, R, W, H, horizon, rect } = T;
      const g = T.g;

      // --- 水面荷葉 ---
      // 扁橢圓（不是圓），越靠畫面下緣越大。少數幾片配一朵粉花就夠了——
      // 花太多會變成花田，這裡要的是水鄉而不是花園。
      // 先畫荷葉再畫橋，橋才會像個實體壓在葉子上面
      const pad = P.lotus || '#3f7a52';
      for (let i = 0; i < 26; i++) {
        const y = horizon + 10 + R() * (H - horizon - 26);
        const near = (y - horizon) / (H - horizon);
        const rw = Math.round(3 + near * 9 + R() * 3);
        const rh = Math.max(1, Math.round(rw * 0.42));
        const x = Math.round(R() * (W + 16)) - 8;
        if (x + rw > 34 && x - rw < 158 && y > 212 && y < 270) continue;   // 避開船
        for (let dy = -rh; dy <= rh; dy++) {
          const half = Math.sqrt(Math.max(0, 1 - (dy / rh) * (dy / rh))) * rw;
          rect(x - half, y + dy, half * 2, 1, dy < 0 ? FG.shade(pad, 0.16) : pad);
        }
        rect(x - 1, y - rh - 1, 2, 1, FG.shade(pad, -0.35));               // 葉柄接點
        if (R() < 0.22) {                                                   // 蓮花
          const bl = P.bloom || '#f0a8c4';
          rect(x - 1, y - rh - 4, 3, 3, bl);
          rect(x, y - rh - 5, 1, 1, FG.shade(bl, 0.3));
        }
      }

      // --- 月拱橋 ---
      // 半圓的橋拱是這個場景最強的識別物：全遊戲沒有別的東西是圓弧。
      // 位置偏右後方，避開船（x 40~150、y 216~268）與浮標（112,232 / 152,208）
      const bcx = 158, bTop = horizon + 16, span = 46, rise = 17;
      const bc = P.bridge || '#b8b0a4';
      for (let x = -span / 2; x <= span / 2; x++) {
        const t = x / (span / 2);
        const y = bTop + Math.round((1 - Math.sqrt(Math.max(0, 1 - t * t))) * rise);
        rect(bcx + x, y, 1, 3, bc);                       // 橋面
        rect(bcx + x, y, 1, 1, FG.shade(bc, 0.24));       // 橋面受光
        // 橋墩：只在兩端往下延伸到水面
        if (Math.abs(t) > 0.78) rect(bcx + x, y + 3, 1, bTop + rise + 6 - y - 3, FG.shade(bc, -0.3));
      }
      // 橋下的拱洞邊緣，讓「拱」不只是一條線
      for (let x = -span * 0.38; x <= span * 0.38; x++) {
        const t = x / (span * 0.38);
        const y = bTop + rise - Math.round(Math.sqrt(Math.max(0, 1 - t * t)) * (rise - 3));
        rect(bcx + x, y, 1, 1, FG.shade(bc, -0.42));
      }

      // --- 貼水面的一層薄霧，把水鄉與水面接起來 ---
      for (let k = 0; k < 6; k++) {
        g.globalAlpha = 0.09 * (6 - k) / 6;
        rect(0, horizon + 2 + k, W, 1, P.mist || '#dfe8ee');
      }
      g.globalAlpha = 1;
    }
  };

  // 七 · 世界樹：極光帷幕 + 一根貫穿畫面的巨大樹幹 + 岸邊符文石，樹根拱出水面（世界樹根）
  //   構圖上跟前六種都不同：前六種都是「很多個小東西排開」，這一種是**單一巨物**。
  //   在 200×340 的畫布上，一個佔掉三分之一寬度的物件是最強的辨識手段。
  TERRAIN.yggdrasil = {
    above: function (T) {
      const { P, R, W, horizon, rect } = T;
      const g = T.g;

      // --- 星空：刻意稀疏，極光才是主角 ---
      for (let i = 0; i < 70; i++) {
        const y = Math.floor(Math.pow(R(), 0.8) * (horizon - 24));
        const s = P.star || '#dfeaff';
        rect(Math.floor(R() * W), y, 1, 1, R() < 0.3 ? s : FG.shade(s, -0.45));
      }

      // --- 極光帷幕 ---
      // 真實極光是**垂直的簾子**，不是橫向的帶。做法：先算一條 sin 疊 sin 的下緣，
      // 再從下緣往上畫垂直筆畫、alpha 隨高度衰減。每 3px 一道較亮的筆畫，
      // 筆畫之間的明暗差就是簾子的褶皺。
      // **刻意不用橫帶**——那會撞到 karst 的山腰霧帶。
      // 兩道簾子的 base 要拉開 40px 以上，否則會在中間疊成一團、分不出青綠與紫兩層。
      // 初版只差 30px、高度又設 34/46，結果整片糊在一起
      const cols = P.aurora || ['#5fe0a8', '#8f7fe0'];
      for (let b = 0; b < cols.length; b++) {
        const base = horizon - 22 - b * 40;
        const amp = 12 + b * 6, ph = b * 2.1, hgt = 30 + b * 4;
        for (let x = 0; x < W; x++) {
          const by = base + Math.sin(x * 0.035 + ph) * amp + Math.sin(x * 0.11 + ph * 2) * 4;
          const stroke = (x % 3) === 0 ? 1 : 0.5;
          for (let k = 0; k < hgt; k += 2) {
            const y = by - k;
            if (y < -1) break;
            g.globalAlpha = 0.27 * stroke * Math.pow(1 - k / hgt, 1.4);
            rect(x, y, 1, 2, cols[b]);
          }
        }
      }
      g.globalAlpha = 1;

      // --- 世界樹 ---
      // 樹幹貫穿整個畫面、樹冠畫到畫面外，用「裝不下」來表達尺度。
      // 位置偏左（tx=38），中央水道留給船與浮標
      const bark = P.bark || '#3a2a1e';
      const tx = 38;
      for (let y = 0; y < horizon; y++) {
        const t = y / horizon;
        const half = 9 + t * t * 14;                 // 往下逐漸變粗，接近根部才明顯張開
        rect(tx - half, y, half * 2, 1, bark);
        rect(tx - half, y, Math.max(1, half * 0.26), 1, FG.shade(bark, 0.24));   // 受光側
        if (y % 5 === 0) rect(tx + half * 0.1, y, Math.max(1, half * 0.45), 1, FG.shade(bark, -0.3));
      }
      // 往右上斜出的粗枝：只畫根部，末端出畫面（同樣是「裝不下」）
      [[0.10, 1.7, 7], [0.30, 1.15, 5], [0.52, 0.7, 4]].forEach(function (b) {
        const y0 = horizon * b[0];
        for (let k = 0; k < 60; k++) {
          const x = tx + 11 + k, y = y0 - k * b[1];
          if (x >= W || y < 0) break;
          rect(x, y, 1, Math.max(2, b[2] - k * 0.09), bark);
        }
      });

      // --- 岸邊符文石 ---
      // 石板要**微微傾斜**：立正的石板看起來像柱子，歪的才像「被人立起來很久了」
      const stn = P.stone || '#6f6a78';
      const rn = P.rune || '#d8c08f';
      [[92, 23, 0.14], [126, 17, -0.11], [178, 27, 0.08], [152, 13, 0.2]].forEach(function (s) {
        const sx = s[0], h = s[1], lean = s[2];
        for (let k = 0; k < h; k++) {
          const w = 6 - k * 0.06;
          rect(sx + k * lean - w / 2, horizon - 1 - k, w, 1, stn);
        }
        rect(sx + h * lean - 2, horizon - h - 1, 4, 1, FG.shade(stn, 0.26));
        // 刻痕：橫向短線加偶爾一道豎筆，構成「讀不懂但有規律」的字樣
        for (let k = 3; k < h - 3; k += 4) {
          rect(sx + k * lean - 2, horizon - 1 - k, 4, 1, rn);
          if (k % 8 === 3) rect(sx + k * lean, horizon - 2 - k, 1, 2, rn);
        }
      });
    },
    below: function (T) {
      const { P, R, W, H, horizon, rect } = T;
      const g = T.g;
      const bark = P.bark || '#3a2a1e';

      // --- 樹根拱出水面 ---
      // 樹在左，所以只畫左側；全部避開船（x 34~158、y 212~270）
      [[16, 36, 17], [32, 26, 12], [52, 20, 9]].forEach(function (r) {
        const cx = r[0], span = r[1], rise = r[2];
        const baseY = horizon + 16 + (rise - 9);
        for (let x = -span / 2; x <= span / 2; x++) {
          const t = x / (span / 2);
          const y = baseY - Math.round(Math.sqrt(Math.max(0, 1 - t * t)) * rise);
          const th = Math.max(2, Math.round(3 + (1 - Math.abs(t)) * 2));
          rect(cx + x, y, 1, th, bark);
          rect(cx + x, y, 1, 1, FG.shade(bark, 0.22));
        }
      });

      // --- 水面上的符文光 ---
      // 幾組 3×3 的發光刻痕，暗示「這口泉水自己記著什麼」。
      // 數量刻意少（5 組），多了會變成裝飾圖案而不是遺跡
      const rn = P.rune || '#d8c08f';
      for (let i = 0; i < 5; i++) {
        const x = Math.round(20 + R() * (W - 50));
        const y = Math.round(horizon + 22 + R() * (H - horizon - 60));
        if (x > 24 && x < 168 && y > 206 && y < 276) continue;   // 避開船
        g.globalAlpha = 0.42 + R() * 0.3;
        rect(x, y + 1, 5, 1, rn);
        rect(x + 2, y, 1, 3, rn);
        rect(x + (R() < 0.5 ? 0 : 4), y + (R() < 0.5 ? 0 : 2), 1, 1, rn);
      }
      g.globalAlpha = 1;
    }
  };

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

    // 傳給地形產生器的上下文
    const T = { g: g, P: P, R: R, W: W, H: H, horizon: horizon, rect: rect };
    // 針葉林產生器（forest 地形用，也開放給其他地形沿用）
    T.forest = function (baseY, height, color, density, accent) {
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
    };

    const terrain = TERRAIN[P.terrain] || TERRAIN.forest;
    terrain.above(T);

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

    // --- 地形的水面物件（浮冰、鳥居、發光浮游生物…） ---
    // 放在最後才畫，這樣它們不會被倒影與深水的半透明疊層洗掉
    if (terrain.below) terrain.below(T);

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
    // 地平線以上的剪影：每種地形一份簡化版，讓釣點選單的縮圖一眼可辨
    // （不共用 TERRAIN，因為縮圖尺寸差 3 倍以上，等比縮放的細節會糊掉）
    function fill(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
    const S = Math.max(1, H / 50);        // 相對於 76×50 基準的尺寸係數

    switch (P.terrain) {
      case 'cliff':
        // 兩側崖壁夾出中央水道
        for (let x = 0; x < W; x++) {
          const d = Math.min(x / (W * 0.42), (W - 1 - x) / (W * 0.36));
          if (d > 1) continue;
          const h = (x < W / 2 ? 15 : 19) * S * Math.pow(1 - d, 1.6);
          if (h < 1) continue;
          fill(x, hz - h, 1, h, x < W / 2 ? P.midTree : P.nearTree);
        }
        break;

      case 'ice':
        // 冰川牆 + 三角冰刺
        fill(0, hz - 9 * S, W, 9 * S, P.farTree);
        fill(0, hz - 9 * S, W, 1, FG.shade(P.farTree, 0.3));
        for (let i = 0; i < 7; i++) {
          const x = Math.floor(R() * W), hgt = (2 + R() * 4) * S, w = hgt * 2.4;
          for (let k = 0; k < hgt; k++) {
            const ww = Math.max(2, w * (1 - 0.55 * k / hgt));
            fill(x - ww / 2 + k * 0.5, hz - k - 1, ww, 1, P.nearTree);
          }
          fill(x - w * 0.22 + hgt * 0.5, hz - hgt - 1, w * 0.45, 1, FG.shade(P.nearTree, 0.4));
        }
        break;

      case 'night':
        // 星空 + 幾根海蝕柱
        for (let i = 0; i < 40; i++) fill(Math.floor(R() * W), Math.floor(Math.pow(R(), 0.7) * hz), 1, 1, P.star || '#dff2ff');
        for (let i = 0; i < 5; i++) fill(Math.floor(R() * W), hz - (2 + R() * 5) * S, 1 + R() * 2 * S, 6 * S, P.nearTree);
        break;

      case 'shrine': {
        // 錐形雪山 + 五重塔 + 櫻花樹
        const px0 = W * 0.62, pkY = hz - 20 * S;
        for (let y = pkY; y < hz; y++) {
          const half = (y - pkY) * 1.45;
          fill(px0 - half, y, half * 2, 1, (y - pkY) < 6 * S ? (P.snow || '#eef4f8') : P.hill);
        }
        let ty = hz - 1, tw = 9 * S;
        for (let lv = 0; lv < 4; lv++) {
          fill(W * 0.16 - tw / 2, ty - 3.4 * S, tw, 3.4 * S, P.pagoda || '#3a2630');
          fill(W * 0.16 - (tw + 3 * S) / 2, ty - 4.4 * S, tw + 3 * S, S, P.pagodaRoof || '#241a22');
          ty -= 4.4 * S; tw -= 1.6 * S;
        }
        for (let i = 0; i < 9; i++) {
          const x = Math.floor(R() * W), r = (2 + R() * 2.6) * S;
          for (let dy = -r; dy <= r; dy++) {
            const half = Math.sqrt(Math.max(0, r * r - dy * dy));
            fill(x - half, hz - r - S + dy, half * 2, 1, P.midTree);
          }
        }
        break;
      }

      case 'karst': {
        // 圓頂塔峰 + 一條霧帶。縮圖尺寸放不下水鄉與拱橋，留下這兩樣就夠認
        [0.16, 0.38, 0.58, 0.80].forEach(function (fx, i) {
          const cx = W * fx, hgt = (11 + R() * 8) * S, w = (4 + R() * 3) * S;
          const col = i % 2 ? P.midTree : P.farTree;
          const capR = Math.max(1, w * 0.5);
          for (let y = hz - hgt + capR; y < hz; y++) fill(cx - w / 2, y, w, 1, col);
          for (let dy = 0; dy < capR; dy++) {
            const half = Math.sqrt(Math.max(0, capR * capR - (capR - dy) * (capR - dy)));
            fill(cx - half, hz - hgt + dy, half * 2, 1, col);
          }
        });
        g.globalAlpha = 0.34;
        for (let k = 0; k < Math.max(2, 3 * S); k++) fill(0, hz - 7 * S + k, W, 1, P.mist || '#dfe8ee');
        g.globalAlpha = 1;
        break;
      }

      case 'yggdrasil': {
        // 極光 + 一根巨大樹幹。縮圖放不下符文石與樹根，留這兩樣就夠認
        const auc = (P.aurora && P.aurora[0]) || '#5fe0a8';
        const ah = hz * 0.5;
        for (let x = 0; x < W; x++) {
          const by = hz * 0.62 + Math.sin(x * 0.17) * hz * 0.16;
          for (let k = 0; k < ah; k++) {
            g.globalAlpha = 0.34 * (1 - k / ah) * ((x % 3) === 0 ? 1 : 0.55);
            fill(x, by - k, 1, 1, auc);
          }
        }
        g.globalAlpha = 1;
        for (let y = 0; y < hz; y++) {
          const half = (2.2 + (y / hz) * (y / hz) * 2.6) * S;
          fill(W * 0.24 - half, y, half * 2, 1, P.bark || '#3a2a1e');
        }
        break;
      }

      default:
        for (let i = 0; i < 40; i++) {
          const x = Math.floor(R() * W), hgt = 4 + R() * 8;
          g.fillStyle = R() < 0.2 ? (P.accent ? P.accent[0] : P.midTree) : P.midTree;
          for (let k = 0; k < hgt; k++) {
            const ww = Math.max(1, Math.round(hgt * 0.4 * (k / hgt)));
            g.fillRect(x - Math.floor(ww / 2), hz - hgt + k, ww, 1);
          }
        }
    }

    for (let y = hz; y < H; y++) {
      g.fillStyle = FG.mix(P.waterTop, P.waterBot, (y - hz) / (H - hz));
      g.fillRect(0, y, W, 1);
    }

    // 神域的縮圖補一座鳥居——它是這個釣點最好認的招牌
    if (P.terrain === 'shrine') {
      const cx = W * 0.5, ty2 = hz + 2 * S, hh = 9 * S, red = P.torii || '#c8442f';
      fill(cx - 6 * S, ty2, 12 * S, S, FG.shade(red, -0.3));
      fill(cx - 5 * S, ty2 + S, 10 * S, S, red);
      fill(cx - 4 * S, ty2 + 3.5 * S, 8 * S, S, red);
      fill(cx - 3.4 * S, ty2 + S, 1.4 * S, hh, red);
      fill(cx + 2 * S, ty2 + S, 1.4 * S, hh, red);
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
