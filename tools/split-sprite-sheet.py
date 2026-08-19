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


def keep_largest_component(image: Image.Image) -> Image.Image:
    """移除跨格殘點；每格的單一主體以 8 鄰域最大連通區為準。"""
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    visible = {(x, y) for y in range(alpha.height) for x in range(alpha.width)
               if alpha.getpixel((x, y)) > 0}
    if not visible:
        return rgba

    largest: set[tuple[int, int]] = set()
    while visible:
        seed = visible.pop()
        component = {seed}
        stack = [seed]
        while stack:
            x, y = stack.pop()
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if dx == 0 and dy == 0:
                        continue
                    point = (x + dx, y + dy)
                    if point in visible:
                        visible.remove(point)
                        component.add(point)
                        stack.append(point)
        if len(component) > len(largest):
            largest = component

    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            if (x, y) not in largest:
                pixels[x, y] = (0, 0, 0, 0)
    return rgba


def connected_components(image: Image.Image) -> list[set[tuple[int, int]]]:
    """回傳所有 8 鄰域可見元件，供跨格主體依重心歸屬格位。"""
    alpha = image.convert("RGBA").getchannel("A")
    visible = {(x, y) for y in range(alpha.height) for x in range(alpha.width)
               if alpha.getpixel((x, y)) > 0}
    components: list[set[tuple[int, int]]] = []
    while visible:
        seed = visible.pop()
        component = {seed}
        stack = [seed]
        while stack:
            x, y = stack.pop()
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if dx == 0 and dy == 0:
                        continue
                    point = (x + dx, y + dy)
                    if point in visible:
                        visible.remove(point)
                        component.add(point)
                        stack.append(point)
        components.append(component)
    return components


def split_by_component_centroid(
    sheet: Image.Image,
    cols: int,
    rows: int,
) -> list[Image.Image]:
    """依元件重心分格，保留跨格的完整主體並排除相鄰格滲入。"""
    groups: list[list[set[tuple[int, int]]]] = [[] for _ in range(cols * rows)]
    for component in connected_components(sheet):
        # 太小的游離點通常是生成圖鍵色壓縮殘屑，不應撐大成品外框。
        if len(component) < 4:
            continue
        center_x = sum(point[0] for point in component) / len(component)
        center_y = sum(point[1] for point in component) / len(component)
        col = min(cols - 1, int(center_x * cols / sheet.width))
        row = min(rows - 1, int(center_y * rows / sheet.height))
        groups[row * cols + col].append(component)

    cells: list[Image.Image] = []
    source = sheet.convert("RGBA")
    for group in groups:
        cell = Image.new("RGBA", source.size)
        pixels = cell.load()
        source_pixels = source.load()
        for component in group:
            for x, y in component:
                pixels[x, y] = source_pixels[x, y]
        cells.append(cell)
    return cells


def prepare_sprite(cell: Image.Image, *, largest_only: bool = True) -> Image.Image:
    """裁掉透明邊，保留安全留白後置中到遊戲精靈畫布。"""
    if largest_only:
        cell = keep_largest_component(cell)
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
    # 傳統等分模式要再清一次跨格殘點；元件分格模式則保留同格內的合法分離部件。
    if largest_only:
        sprite = keep_largest_component(sprite)

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
        "--component-cells",
        action="store_true",
        help="依完整素材盤的連通元件重心分格；主體跨格或鄰格容易滲入時使用",
    )
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
    component_cells = (
        split_by_component_centroid(sheet, args.cols, args.rows)
        if args.component_cells else None
    )
    for index, name in enumerate(names):
        if component_cells is not None:
            cell = component_cells[index]
        else:
            col = index % args.cols
            row = index // args.cols
            left = round(sheet.width * col / args.cols)
            right = round(sheet.width * (col + 1) / args.cols)
            top = round(sheet.height * row / args.rows)
            bottom = round(sheet.height * (row + 1) / args.rows)
            cell = sheet.crop((left, top, right, bottom))
        prepare_sprite(cell, largest_only=component_cells is None).save(
            args.output_dir / f"{name}.png"
        )

    print(f"已輸出 {len(names)} 張精靈至 {args.output_dir}")


if __name__ == "__main__":
    main()
