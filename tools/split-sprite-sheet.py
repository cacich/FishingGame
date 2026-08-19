#!/usr/bin/env python3
"""將已去背的等分素材盤切成遊戲使用的 96×56 透明精靈。"""

from __future__ import annotations

import argparse
import colorsys
from collections import deque
from pathlib import Path

from PIL import Image


CANVAS_SIZE = (96, 56)
MAX_SUBJECT_SIZE = (88, 48)


def parse_key_color(hex_color: str) -> tuple[int, int, int]:
    """解析六位十六進位鍵色。"""
    value = hex_color.removeprefix("#")
    if len(value) != 6:
        raise ValueError("--key-color 必須是 6 位十六進位色碼")
    return tuple(int(value[index:index + 2], 16) for index in (0, 2, 4))


def remove_key_color(image: Image.Image, hex_color: str, tolerance: int) -> Image.Image:
    """把接近指定鍵色的像素轉透明；保留其餘像素原有 alpha。"""
    key = parse_key_color(hex_color)
    pixels = []
    for red, green, blue, alpha in image.convert("RGBA").getdata():
        if max(abs(red - key[0]), abs(green - key[1]), abs(blue - key[2])) <= tolerance:
            pixels.append((red, green, blue, 0))
        else:
            pixels.append((red, green, blue, alpha))
    result = Image.new("RGBA", image.size)
    result.putdata(pixels)
    return result


def despill_key_fringe(
    image: Image.Image,
    hex_color: str,
    tolerance: int,
) -> Image.Image:
    """把與透明背景相連的鍵色混色邊緣改成最近的主體顏色。

    只處理能沿著「接近鍵色」像素走到透明區的部分，因此魚身內部刻意使用的
    紫色不會被整片抹掉。污染區由內側非污染像素向外做多源填色，保留原輪廓，
    不用直接刪除一圈像素讓細鰭與鬚變短。
    """
    rgba = image.convert("RGBA")
    key = parse_key_color(hex_color)
    pixels = rgba.load()
    width, height = rgba.size

    def neighbors(x: int, y: int):
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dx == 0 and dy == 0:
                    continue
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    yield nx, ny

    candidates = set()
    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            if alpha and max(
                abs(red - key[0]),
                abs(green - key[1]),
                abs(blue - key[2]),
            ) <= tolerance:
                candidates.add((x, y))
    if not candidates:
        return rgba

    # 只追蹤接觸透明區的候選像素；封閉在主體內的洋紅細節保留原樣。
    fringe = set()
    pending = deque()
    for point in candidates:
        x, y = point
        if any(pixels[nx, ny][3] == 0 for nx, ny in neighbors(x, y)):
            fringe.add(point)
            pending.append(point)
    while pending:
        x, y = pending.popleft()
        for point in neighbors(x, y):
            if point in candidates and point not in fringe:
                fringe.add(point)
                pending.append(point)
    if not fringe:
        return rgba

    # 從污染區內緣的乾淨像素向透明背景方向傳遞顏色，避免直接削薄輪廓。
    replacement: dict[tuple[int, int], tuple[int, int, int]] = {}
    pending.clear()
    for point in fringe:
        x, y = point
        donors = [
            pixels[nx, ny][:3]
            for nx, ny in neighbors(x, y)
            if pixels[nx, ny][3] and (nx, ny) not in fringe
        ]
        if donors:
            replacement[point] = max(
                donors,
                key=lambda color: max(
                    abs(color[0] - key[0]),
                    abs(color[1] - key[1]),
                    abs(color[2] - key[2]),
                ),
                default=donors[0],
            )
            pending.append(point)

    while pending:
        x, y = pending.popleft()
        for point in neighbors(x, y):
            if point in fringe and point not in replacement:
                replacement[point] = replacement[(x, y)]
                pending.append(point)

    for x, y in fringe:
        if (x, y) in replacement:
            red, green, blue = replacement[(x, y)]
            pixels[x, y] = (red, green, blue, pixels[x, y][3])
        else:
            # 整個游離元件都是鍵色混色時沒有可信主體顏色，直接視為背景。
            pixels[x, y] = (0, 0, 0, 0)
    return rgba


def clean_purple_outer_edge(image: Image.Image, min_value: int) -> Image.Image:
    """重著色最外圈的高亮紫／桃紅像素，清掉產圖模型自帶的紫色外光。

    這一層不是鍵色混色，而是模型真的畫進主體的 lavender / fuchsia glow；
    所以只限縮到最外圈一像素，並以最近的非高亮紫主體色取代，不碰魚身內部
    合法的敦煌紫色與花紋。
    """
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size

    def neighbors(x: int, y: int):
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dx == 0 and dy == 0:
                    continue
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    yield nx, ny

    def is_bright_purple(color: tuple[int, int, int, int]) -> bool:
        red, green, blue, alpha = color
        if not alpha or max(red, green, blue) < min_value:
            return False
        hue, saturation, _ = colorsys.rgb_to_hsv(red / 255, green / 255, blue / 255)
        return 235 / 360 <= hue <= 340 / 360 and saturation >= 0.35

    targets = set()
    for y in range(height):
        for x in range(width):
            if not is_bright_purple(pixels[x, y]):
                continue
            if any(pixels[nx, ny][3] == 0 for nx, ny in neighbors(x, y)):
                targets.add((x, y))

    for x, y in targets:
        donor = None
        for radius in range(1, 5):
            options = []
            for ny in range(max(0, y - radius), min(height, y + radius + 1)):
                for nx in range(max(0, x - radius), min(width, x + radius + 1)):
                    if max(abs(nx - x), abs(ny - y)) != radius:
                        continue
                    if pixels[nx, ny][3] and (nx, ny) not in targets \
                            and not is_bright_purple(pixels[nx, ny]):
                        options.append((nx, ny))
            if options:
                donor = min(options, key=lambda point: (point[0] - x) ** 2 + (point[1] - y) ** 2)
                break
        if donor is not None:
            red, green, blue, _ = pixels[donor[0], donor[1]]
            pixels[x, y] = (red, green, blue, pixels[x, y][3])
    return rgba


def clean_colored_outer_glow(image: Image.Image, max_depth: int = 1) -> Image.Image:
    """清除不限定色相的高彩度外光，保留正常暗描邊與主體高光。

    產圖模型可能在青色魚外畫 cyan、在金色魚外畫 pink；這些不是鍵色混邊。
    判斷必須同時滿足「最外圈」、「比最近內核更亮或更飽和」與「色差夠大」，
    才以最近內核色替換。這避免把正常黑描邊、白色腹緣或魚身內花紋抹掉。
    """
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size

    def neighbors(x: int, y: int):
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dx == 0 and dy == 0:
                    continue
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    yield nx, ny

    visible = {
        (x, y)
        for y in range(height)
        for x in range(width)
        if pixels[x, y][3]
    }
    edge = {
        (x, y)
        for x, y in visible
        if any(pixels[nx, ny][3] == 0 for nx, ny in neighbors(x, y))
    }
    band = set(edge)
    frontier = set(edge)
    for _ in range(1, max_depth):
        frontier = {
            point
            for x, y in frontier
            for point in neighbors(x, y)
            if point in visible and point not in band
        }
        band.update(frontier)
    core = {
        point
        for point in visible
        if point not in band
    }

    replacements = {}
    for x, y in band:
        red, green, blue, _ = pixels[x, y]
        _, saturation, value = colorsys.rgb_to_hsv(red / 255, green / 255, blue / 255)
        if saturation < 0.42 or value < 0.45:
            continue

        donor = None
        for radius in range(1, max(8, max_depth * 3 + 1)):
            options = [
                (nx, ny)
                for ny in range(max(0, y - radius), min(height, y + radius + 1))
                for nx in range(max(0, x - radius), min(width, x + radius + 1))
                if max(abs(nx - x), abs(ny - y)) == radius
                and (nx, ny) in core
                and (
                    colorsys.rgb_to_hsv(
                        pixels[nx, ny][0] / 255,
                        pixels[nx, ny][1] / 255,
                        pixels[nx, ny][2] / 255,
                    )[2] <= value - 0.12
                    or colorsys.rgb_to_hsv(
                        pixels[nx, ny][0] / 255,
                        pixels[nx, ny][1] / 255,
                        pixels[nx, ny][2] / 255,
                    )[1] <= saturation - 0.25
                )
            ]
            if options:
                donor = min(options, key=lambda point: (point[0] - x) ** 2 + (point[1] - y) ** 2)
                break
        if donor is None:
            continue

        donor_red, donor_green, donor_blue, _ = pixels[donor[0], donor[1]]
        color_distance = (
            (red - donor_red) ** 2
            + (green - donor_green) ** 2
            + (blue - donor_blue) ** 2
        ) ** 0.5
        if color_distance >= 45:
            replacements[(x, y)] = (donor_red, donor_green, donor_blue)

    for (x, y), (red, green, blue) in replacements.items():
        pixels[x, y] = (red, green, blue, pixels[x, y][3])
    return rgba


def normalize_outer_outline(image: Image.Image) -> Image.Image:
    """把主體最外圈統一為內縮的暗色描邊，消除任何色相的殘留亮邊。

    只處理附近找得到非邊界像素的輪廓；單像素鬚、絲帶與尖刺沒有可信的
    內側顏色，因此保留原色，避免為了清 halo 把細節整段染黑或截短。
    """
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size

    def neighbors(x: int, y: int):
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dx == 0 and dy == 0:
                    continue
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    yield nx, ny

    visible = {
        (x, y)
        for y in range(height)
        for x in range(width)
        if pixels[x, y][3]
    }
    edge = {
        (x, y)
        for x, y in visible
        if any(pixels[nx, ny][3] == 0 for nx, ny in neighbors(x, y))
    }
    interior = visible - edge
    replacements = {}
    for x, y in edge:
        red, green, blue, alpha = pixels[x, y]
        _, saturation, value = colorsys.rgb_to_hsv(red / 255, green / 255, blue / 255)
        # 灰白腹緣與原本就夠暗的黑描邊不是彩色 halo，不必改色。
        if saturation < 0.28 or value <= 0.18:
            continue

        donor = None
        for radius in range(1, 5):
            options = [
                (nx, ny)
                for ny in range(max(0, y - radius), min(height, y + radius + 1))
                for nx in range(max(0, x - radius), min(width, x + radius + 1))
                if max(abs(nx - x), abs(ny - y)) == radius
                and (nx, ny) in interior
            ]
            if options:
                donor = min(
                    options,
                    key=lambda point: (point[0] - x) ** 2 + (point[1] - y) ** 2,
                )
                break
        if donor is None:
            # 細鬚等沒有內側像素時只壓暗、不換色；保住輪廓與長度。
            donor_hue = colorsys.rgb_to_hsv(red / 255, green / 255, blue / 255)[0]
            outline_saturation = min(saturation, 0.55)
            outline_value = 0.18
        else:
            donor_red, donor_green, donor_blue, _ = pixels[donor[0], donor[1]]
            donor_hue, donor_saturation, donor_value = colorsys.rgb_to_hsv(
                donor_red / 255,
                donor_green / 255,
                donor_blue / 255,
            )
            outline_value = min(value, donor_value * 0.55, 0.18)
            outline_saturation = min(donor_saturation, 0.55)
        out_red, out_green, out_blue = colorsys.hsv_to_rgb(
            donor_hue,
            outline_saturation,
            outline_value,
        )
        replacements[(x, y)] = (
            round(out_red * 255),
            round(out_green * 255),
            round(out_blue * 255),
            alpha,
        )

    for point, color in replacements.items():
        pixels[point[0], point[1]] = color
    return rgba


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


def prepare_sprite(
    cell: Image.Image,
    *,
    key_color: str,
    spill_tolerance: int,
    purple_edge_value: int,
    largest_only: bool = True,
) -> Image.Image:
    """裁掉透明邊，保留安全留白後置中到遊戲精靈畫布。"""
    cell = despill_key_fringe(cell, key_color, spill_tolerance)
    # 母版的彩色 glow 常有 3～6px 厚；在縮小前先處理才不會壓成一圈實色邊。
    cell = clean_colored_outer_glow(cell, max_depth=6)
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
    sprite = despill_key_fringe(sprite, key_color, spill_tolerance)
    # 傳統等分模式要再清一次跨格殘點；元件分格模式則保留同格內的合法分離部件。
    if largest_only:
        sprite = keep_largest_component(sprite)

    final = Image.new("RGBA", CANVAS_SIZE)
    x = (CANVAS_SIZE[0] - sprite.width) // 2
    y = (CANVAS_SIZE[1] - sprite.height) // 2
    final.alpha_composite(sprite, (x, y))
    final = clean_purple_outer_edge(final, purple_edge_value)
    final = clean_colored_outer_glow(final)
    return normalize_outer_outline(final)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path, help="已去背的 RGBA PNG 素材盤")
    parser.add_argument("output_dir", type=Path, help="輸出精靈資料夾")
    parser.add_argument("--cols", type=int, default=3)
    parser.add_argument("--rows", type=int, default=4)
    parser.add_argument("--key-color", default="ff00ff", help="要移除的背景鍵色，預設 ff00ff")
    parser.add_argument("--key-tolerance", type=int, default=18, help="鍵色每色頻容差，預設 18")
    parser.add_argument(
        "--spill-tolerance",
        type=int,
        default=110,
        help="與透明背景相連的鍵色混色邊緣容差，預設 110；會以最近主體色取代",
    )
    parser.add_argument(
        "--purple-edge-value",
        type=int,
        default=150,
        help="清理最外圈高亮紫／桃紅外光的最低亮度，預設 150",
    )
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
        prepare_sprite(
            cell,
            key_color=args.key_color,
            spill_tolerance=args.spill_tolerance,
            purple_edge_value=args.purple_edge_value,
            largest_only=component_cells is None,
        ).save(
            args.output_dir / f"{name}.png"
        )

    print(f"已輸出 {len(names)} 張精靈至 {args.output_dir}")


if __name__ == "__main__":
    main()
