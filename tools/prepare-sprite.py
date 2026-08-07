#!/usr/bin/env python3
"""將已去背的產圖裁成遊戲使用的 96×56 透明精靈。"""

import argparse
from pathlib import Path

from PIL import Image


CANVAS_SIZE = (96, 56)
MAX_SUBJECT_SIZE = (88, 48)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path, help="已完成去背的 PNG")
    parser.add_argument("output", type=Path, help="輸出的 96×56 PNG")
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGBA")
    box = source.getchannel("A").getbbox()
    if box is None:
        raise ValueError("輸入圖片沒有可見的主體")

    # 讓角色不會貼邊，並用最近鄰保留像素畫的硬邊。
    pad = max(2, round(min(source.size) * 0.015))
    box = (
        max(0, box[0] - pad), max(0, box[1] - pad),
        min(source.width, box[2] + pad), min(source.height, box[3] + pad),
    )
    sprite = source.crop(box)
    sprite.thumbnail(MAX_SUBJECT_SIZE, Image.Resampling.NEAREST)

    final = Image.new("RGBA", CANVAS_SIZE)
    x = (CANVAS_SIZE[0] - sprite.width) // 2
    y = (CANVAS_SIZE[1] - sprite.height) // 2
    final.alpha_composite(sprite, (x, y))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    final.save(args.output)


if __name__ == "__main__":
    main()
