#!/usr/bin/env python3
"""將已去背的等分素材盤切成遊戲使用的 96×56 透明精靈。"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


CANVAS_SIZE = (96, 56)
MAX_SUBJECT_SIZE = (88, 48)


def remove_key_color(image: Image.Image, hex_color: str, tolerance: int) -> Image.Image:
    """把接近指定鍵色的像素轉透明；保留其餘像素原有 alpha。"""
    value = hex_color.removeprefix("#")
    if len(value) != 6:
        raise ValueError("--key-color 必須是 6 位十六進位色碼")
    key = tuple(int(value[index:index + 2], 16) for index in (0, 2, 4))
    pixels = []
    for red, green, blue, alpha in image.convert("RGBA").getdata():
        if max(abs(red - key[0]), abs(green - key[1]), abs(blue - key[2])) <= tolerance:
            pixels.append((red, green, blue, 0))
        else:
            pixels.append((red, green, blue, alpha))
    result = Image.new("RGBA", image.size)
    result.putdata(pixels)
    return result


def prepare_sprite(cell: Image.Image) -> Image.Image:
    """裁掉透明邊，保留安全留白後置中到遊戲精靈畫布。"""
    box = cell.getchannel("A").getbbox()
    if box is None:
        raise ValueError("素材格沒有可見主體")

    pad = max(2, round(min(cell.size) * 0.015))
    box = (
        max(0, box[0] - pad),
        max(0, box[1] - pad),
        min(cell.width, box[2] + pad),
        min(cell.height, box[3] + pad),
    )
    sprite = cell.crop(box)
    sprite.thumbnail(MAX_SUBJECT_SIZE, Image.Resampling.NEAREST)

    final = Image.new("RGBA", CANVAS_SIZE)
    x = (CANVAS_SIZE[0] - sprite.width) // 2
    y = (CANVAS_SIZE[1] - sprite.height) // 2
    final.alpha_composite(sprite, (x, y))
    return final


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path, help="已去背的 RGBA PNG 素材盤")
    parser.add_argument("output_dir", type=Path, help="輸出精靈資料夾")
    parser.add_argument("--cols", type=int, default=3)
    parser.add_argument("--rows", type=int, default=4)
    parser.add_argument("--key-color", default="ff00ff", help="要移除的背景鍵色，預設 ff00ff")
    parser.add_argument("--key-tolerance", type=int, default=18, help="鍵色每色頻容差，預設 18")
    parser.add_argument(
        "--names",
        required=True,
        help="依左到右、上到下排列的檔名（不含 .png，逗號分隔）",
    )
    args = parser.parse_args()

    names = [name.strip() for name in args.names.split(",") if name.strip()]
    if not names or len(names) > args.cols * args.rows:
        raise ValueError("檔名數量必須在 1 到格數之間")

    sheet = remove_key_color(Image.open(args.input), args.key_color, args.key_tolerance)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    for index, name in enumerate(names):
        col = index % args.cols
        row = index // args.cols
        left = round(sheet.width * col / args.cols)
        right = round(sheet.width * (col + 1) / args.cols)
        top = round(sheet.height * row / args.rows)
        bottom = round(sheet.height * (row + 1) / args.rows)
        cell = sheet.crop((left, top, right, bottom))
        prepare_sprite(cell).save(args.output_dir / f"{name}.png")

    print(f"已輸出 {len(names)} 張精靈至 {args.output_dir}")


if __name__ == "__main__":
    main()
