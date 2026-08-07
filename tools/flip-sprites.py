#!/usr/bin/env python3
"""將 stdin 列出的 PNG 精靈做無損水平鏡像。"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageOps


def main() -> None:
    paths = [Path(line.strip()) for line in sys.stdin if line.strip()]
    if not paths:
        raise SystemExit('請從 stdin 傳入至少一個 PNG 路徑。')

    flipped = 0
    for path in paths:
        if path.suffix.lower() != '.png' or not path.is_file():
            raise SystemExit(f'不是可讀取的 PNG：{path}')
        with Image.open(path) as image:
            if image.mode != 'RGBA' or image.size != (96, 56):
                raise SystemExit(f'精靈格式不符（需為 96×56 RGBA）：{path}')
            ImageOps.mirror(image).save(path)
        flipped += 1

    print(f'已水平翻轉 {flipped} 張精靈。')


if __name__ == '__main__':
    main()
