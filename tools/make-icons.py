#!/usr/bin/env python3
"""
產生 PWA 圖示（純標準函式庫，不需要 Pillow）。

設計原則跟遊戲本體一致：在低解析度網格上逐像素畫圖，再用最近鄰放大，
所以放到 512px 仍然是硬邊的像素風，不會糊掉。

用法：
    python tools/make-icons.py

產出：
    icons/icon-192.png            一般用途
    icons/icon-512.png            一般用途（高解析）
    icons/icon-maskable-512.png   maskable：內容縮進安全區，背景滿版
    icons/apple-touch-icon-180.png iOS 主畫面（不可透明，iOS 自己會切圓角）
    icons/favicon-32.png          瀏覽器分頁

改了遊戲配色想讓圖示跟著換，改下面的 PALETTE 再重跑即可。
"""

import os
import zlib
import struct

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'icons')

# 跟 styles.css / data.js 的晨霧湖配色同源
PALETTE = {
    'water_top':  (0x10, 0x28, 0x3c),
    'water_bot':  (0x24, 0x55, 0x74),
    'highlight':  (0xda, 0xee, 0xf7),
    'body':       (0xe0, 0xa8, 0x3a),
    'back':       (0xa3, 0x70, 0x1c),
    'belly':      (0xf6, 0xe0, 0xa2),
    'fin':        (0xc5, 0x8c, 0x26),
    'outline':    (0x14, 0x1a, 0x20),
    'eye_white':  (0xf4, 0xf8, 0xfb),
    'pupil':      (0x14, 0x1a, 0x20),
}

GRID = 64          # 邏輯解析度


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def draw_icon(fish_scale=1.0):
    """回傳 GRID x GRID 的像素陣列（list of list of RGB tuple）。"""
    W = H = GRID
    px = [[None] * W for _ in range(H)]

    # ── 背景：水面漸層 ──
    for y in range(H):
        c = lerp(PALETTE['water_top'], PALETTE['water_bot'], y / (H - 1))
        for x in range(W):
            px[y][x] = c

    # ── 水面反光橫線（固定位置，不用亂數，確保每次產出一致）──
    dashes = [(4, 8, 5), (2, 20, 4), (46, 12, 6), (52, 26, 4), (10, 46, 7),
              (38, 52, 5), (24, 6, 4), (56, 42, 3), (14, 58, 6), (34, 16, 3)]
    for dx, dy, dlen in dashes:
        for i in range(dlen):
            if 0 <= dx + i < W and 0 <= dy < H:
                base = px[dy][dx + i]
                px[dy][dx + i] = lerp(base, PALETTE['highlight'], 0.55)

    # ── 魚（用跟 pixel.js › buildFish() 相同的輪廓公式）──
    cx, cy = W / 2, H / 2 + 1
    body_w = 38 * fish_scale
    tail_w = 11 * fish_scale
    half_max = 11.0 * fish_scale
    gamma, e = 1.15, 0.5
    # 尾鰭在 64px 網格下太細的話，分叉會糊成一團條紋，所以刻意做寬、缺口做淺
    tail_h_ratio, fork_ratio = 0.95, 0.30

    # x0 取整數：留小數的話下面 put() 取整時，連續兩欄可能落到同一個整數而漏掉整欄，
    # 描邊再把漏掉的欄位填黑 → 尾鰭會出現條紋狀破圖
    x0 = int(cx - (body_w + tail_w) / 2 + tail_w)  # 身體起點（尾側）
    x1 = x0 + body_w                               # 吻端

    def profile(t):
        t = max(0.0, min(1.0, t))
        tt = t ** gamma
        s = max(0.0, 1 - (2 * tt - 1) ** 2)
        return max(half_max * (s ** e), 1.2) if 0.02 < t < 0.995 else half_max * (s ** e)

    import math
    layer = [[0] * W for _ in range(H)]           # 1=鰭 2=尾 3=身體

    def put(x, y, v):
        # 用 floor(n+0.5) 而非 round()：Python 的 round() 是銀行家捨入，
        # 會把 x.5 與 (x+1).5 捨到同一個整數，造成漏欄
        x, y = int(math.floor(x + 0.5)), int(math.floor(y + 0.5))
        if 0 <= x < W and 0 <= y < H and v > layer[y][x]:
            layer[y][x] = v

    # 背鰭
    for x in range(int(x0 + body_w * 0.30), int(x0 + body_w * 0.64) + 1):
        t = (x - x0) / body_w
        s = (t - 0.30) / 0.34
        import math
        h = half_max * 0.36 * (math.sin(math.pi * max(0, min(1, s))) ** 0.55)
        base = cy - profile(t)
        yy = base - h
        while yy < base:
            put(x, yy, 1)
            yy += 1

    # 臀鰭
    import math
    for x in range(int(x0 + body_w * 0.18), int(x0 + body_w * 0.42) + 1):
        t = (x - x0) / body_w
        s = (t - 0.18) / 0.24
        h = half_max * 0.22 * (math.sin(math.pi * max(0, min(1, s))) ** 0.55)
        base = cy + profile(t)
        yy = base
        while yy < base + h:
            put(x, yy, 1)
            yy += 1

    # 尾鰭
    joint_half = max(profile(0), 1.5)
    tail_half = half_max * tail_h_ratio
    tw = int(round(tail_w))
    for i in range(tw):
        x = x0 - tw + i
        u = i / (tw - 1) if tw > 1 else 1
        half = tail_half * (1 - u) + joint_half * u
        cut = ((fork_ratio - u) / fork_ratio) * tail_half * 0.55 if u < fork_ratio else 0
        y = int(round(cy - half))
        while y <= cy + half:
            if not (cut > 0 and abs(y - cy) < cut):
                put(x, y, 2)
            y += 1

    # 身體
    x = int(round(x0))
    while x <= x1:
        t = (x - x0) / body_w
        half = profile(t)
        y = int(round(cy - half))
        while y <= cy + half:
            put(x, y, 3)
            y += 1
        x += 1

    # ── 上色 ──
    for y in range(H):
        for x in range(W):
            L = layer[y][x]
            if not L:
                continue
            if L in (1, 2):
                px[y][x] = PALETTE['fin']
                continue
            t = (x - x0) / body_w
            half = max(profile(t), 0.5)      # 頭尾兩端 profile 會回 0，先夾住避免除以零
            v = max(0.0, min(1.0, (y - (cy - half)) / (2 * half)))
            if v < 0.24:
                px[y][x] = PALETTE['back']
            elif v < 0.40:
                px[y][x] = lerp(PALETTE['back'], PALETTE['body'], 0.55)
            elif v < 0.74:
                px[y][x] = PALETTE['body']
            else:
                px[y][x] = PALETTE['belly']

    # 眼睛
    ex = int(round(x0 + body_w * 0.85))
    ey = int(round(cy - profile(0.85) * 0.28))
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if 0 <= ex + dx < W and 0 <= ey + dy < H and layer[ey + dy][ex + dx] == 3:
                px[ey + dy][ex + dx] = PALETTE['eye_white']
    for dy in (0, 1):
        for dx in (0, 1):
            if 0 <= ex + dx < W and 0 <= ey + dy < H and layer[ey + dy][ex + dx] == 3:
                px[ey + dy][ex + dx] = PALETTE['pupil']

    # ── 描邊（四鄰域膨脹）──
    outline = []
    for y in range(H):
        for x in range(W):
            if layer[y][x]:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < W and 0 <= ny < H and layer[ny][nx]:
                    outline.append((x, y))
                    break
    for x, y in outline:
        px[y][x] = PALETTE['outline']

    return px


def scale_nearest(src, size, inset=0.0):
    """最近鄰放大到 size×size。inset > 0 時內容縮小並置中（maskable 安全區用）。"""
    n = len(src)
    out = [[None] * size for _ in range(size)]
    content = size * (1 - inset)
    off = (size - content) / 2
    for y in range(size):
        for x in range(size):
            if inset > 0:
                sx = (x - off) / content * n
                sy = (y - off) / content * n
                if sx < 0 or sy < 0 or sx >= n or sy >= n:
                    # 安全區外：延用邊緣像素當滿版背景
                    sx = min(max(sx, 0), n - 1)
                    sy = min(max(sy, 0), n - 1)
                    out[y][x] = src[int(sy)][0]
                    continue
            else:
                sx = x / size * n
                sy = y / size * n
            out[y][x] = src[int(sy)][int(sx)]
    return out


def write_png(path, pixels):
    h = len(pixels)
    w = len(pixels[0])
    raw = bytearray()
    for row in pixels:
        raw.append(0)                      # filter type 0
        for r, g, b in row:
            raw += bytes((r, g, b))
    comp = zlib.compress(bytes(raw), 9)

    def chunk(tag, data):
        return (struct.pack('>I', len(data)) + tag + data +
                struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff))

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))   # 8-bit RGB
    png += chunk(b'IDAT', comp)
    png += chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)
    print('  %-34s %4d x %-4d %6.1f KB' % (os.path.basename(path), w, h, len(png) / 1024))


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    base = draw_icon()
    # maskable：內容要縮進安全區（規範建議內容位於中央 80% 的圓內）
    base_mask = draw_icon(fish_scale=0.88)

    print('產生 PWA 圖示 →', OUT_DIR)
    write_png(os.path.join(OUT_DIR, 'icon-192.png'), scale_nearest(base, 192))
    write_png(os.path.join(OUT_DIR, 'icon-512.png'), scale_nearest(base, 512))
    write_png(os.path.join(OUT_DIR, 'icon-maskable-512.png'), scale_nearest(base_mask, 512, inset=0.22))
    write_png(os.path.join(OUT_DIR, 'apple-touch-icon-180.png'), scale_nearest(base, 180))
    write_png(os.path.join(OUT_DIR, 'favicon-32.png'), scale_nearest(base, 32))
    print('完成。')


if __name__ == '__main__':
    main()
