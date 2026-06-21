#!/usr/bin/env python3
"""
Generate reference-style quill cursor: curved shaft, symmetric vanes,
radiating barb lines, soft alpha edges. Outputs SVG + 32×32 PNG.
"""

from __future__ import annotations

import math
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT_SVG = ROOT / "src/assets/cursors/quill-cursor.svg"
OUT_PNG = ROOT / "src/assets/cursors/quill-cursor.png"

SCALE = 8
SIZE = 32
HI = SIZE * SCALE

# High-contrast palette — bright white body, subtle warm accents (readable on papyrus/dark UIs)
COLORS = {
    "base": (255, 255, 255, 255),       # pure white vane
    "band_light": (255, 255, 255, 80),
    "band_warm": (252, 250, 246, 60),
    "barb_main": (230, 222, 212, 55),   # barely-there veins
    "barb_fine": (240, 235, 228, 35),
    "outline": (72, 54, 38, 200),       # thin edge for contrast on any bg
    "shaft": (96, 72, 52, 255),
    "nib": (44, 32, 24, 255),
}
SVG_COLORS = {
    "base": "#FFFFFF",
    "band_light": "#FFFFFF",
    "band_warm": "#FCFAF6",
    "barb": "#D8D0C4",
    "outline": "#483826",
    "shaft": "#604838",
    "nib": "#2C2018",
}


def bez(t: float, p0, p1, p2, p3):
    u = 1 - t
    x = u**3 * p0[0] + 3 * u**2 * t * p1[0] + 3 * u * t**2 * p2[0] + t**3 * p3[0]
    y = u**3 * p0[1] + 3 * u**2 * t * p1[1] + 3 * u * t**2 * p2[1] + t**3 * p3[1]
    return x, y


def bez_tangent(t: float, p0, p1, p2, p3):
    u = 1 - t
    dx = 3 * u**2 * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t**2 * (p3[0] - p2[0])
    dy = 3 * u**2 * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t**2 * (p3[1] - p2[1])
    length = math.hypot(dx, dy) or 1.0
    return dx / length, dy / length


def to_hi(x: float, y: float):
    return x * SCALE, y * SCALE


def to_32(x: float, y: float):
    return x / SCALE, y / SCALE


# Curved S-shaped shaft (32px coords) — nib bottom-left, tip top-right
P0 = (3.5, 30.0)
P1 = (8.0, 22.0)
P2 = (18.0, 8.0)
P3 = (25.5, 3.5)


def vane_width(t: float) -> float:
    """Symmetric bell — widest mid-feather, soft taper at tip and calamus."""
    if t < 0.06:
        return 0.5 + t * 9.0
    if t > 0.94:
        return 0.4 + (1 - t) * 7.0
    peak = math.sin((t - 0.06) / 0.88 * math.pi)
    return 1.4 + 6.2 * (peak**0.68)


def build_outline(samples: int = 48) -> tuple[list[tuple[float, float]], list[tuple[float, float]], list[tuple[float, float]]]:
    left: list[tuple[float, float]] = []
    right: list[tuple[float, float]] = []
    shaft: list[tuple[float, float]] = []

    for i in range(samples):
        t = i / (samples - 1)
        sx, sy = bez(t, P0, P1, P2, P3)
        tx, ty = bez_tangent(t, P0, P1, P2, P3)
        nx, ny = -ty, tx
        w = vane_width(t)
        shaft.append((sx, sy))
        left.append((sx + nx * w, sy + ny * w))
        right.append((sx - nx * w, sy - ny * w))

    return left, right, shaft


def outline_polygon(left, right) -> list[tuple[float, float]]:
    return left + list(reversed(right))


def build_barbs(shaft, left, right, count: int = 14) -> list[tuple[tuple[float, float], tuple[float, float], float]]:
    """Barb segments: start on shaft, end toward outer edge, with band opacity."""
    barbs = []
    n = len(shaft)
    for i in range(1, count - 1):
        idx = int(i / (count - 1) * (n - 1))
        t = idx / (n - 1)
        if t < 0.05 or t > 0.92:
            continue
        sx, sy = shaft[idx]
        lx, ly = left[idx]
        rx, ry = right[idx]
        # Leaf-vein angle: barbs lean slightly toward tip (+tangent)
        tx, ty = bez_tangent(t, P0, P1, P2, P3)

        # Left barb (extends to ~82% of outer edge)
        barbs.append(
            (
                (sx + tx * 0.15, sy + ty * 0.15),
                (sx + (lx - sx) * 0.82 + tx * 0.2, sy + (ly - sy) * 0.82 + ty * 0.2),
                0.48 if i % 2 == 0 else 0.30,
            )
        )
        # Right barb
        barbs.append(
            (
                (sx - tx * 0.12, sy - ty * 0.12),
                (sx + (rx - sx) * 0.82 - tx * 0.15, sy + (ry - sy) * 0.82 - ty * 0.15),
                0.48 if i % 2 == 1 else 0.30,
            )
        )
    return barbs


def band_regions(shaft, left, right, bands: int = 5) -> list[tuple[list[tuple[float, float]], str]]:
    """Horizontal-ish band fills between barb rows (reference striping)."""
    regions = []
    n = len(shaft)
    colors = ["#F0E0B0", "#E8D4A8", "#F0E0B0", "#E8D4A8"]
    for b in range(bands):
        t0 = 0.08 + b * 0.16
        t1 = t0 + 0.14
        i0 = max(1, int(t0 * (n - 1)))
        i1 = min(n - 2, int(t1 * (n - 1)))
        if i1 <= i0:
            continue
        poly = (
            shaft[i0:i1]
            + left[i0:i1]
            + list(reversed(left[i0:i1]))
        )
        # Build band as quad between two shaft indices
        quad = (
            [left[i0], left[i1], shaft[i1], shaft[i0]]
            + [right[i0], right[i1], shaft[i1], shaft[i0]]
        )
        # Simpler: strip between left/right at two t values
        strip = left[i0:i1] + list(reversed(right[i0:i1]))
        regions.append((strip, colors[b % len(colors)]))
    return regions


def render_hi_res() -> Image.Image:
    left, right, shaft = build_outline(56)
    poly = outline_polygon(left, right)
    barbs = build_barbs(shaft, left, right, 22)

    img = Image.new("RGBA", (HI, HI), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    hi_poly = [to_hi(x, y) for x, y in poly]

    # Base fill — bright white quill body
    draw.polygon(hi_poly, fill=COLORS["base"])

    # Thin silhouette outline so the quill reads on light and dark backgrounds
    draw.line(hi_poly + [hi_poly[0]], fill=COLORS["outline"], width=2)

    # Subtle white-on-white banding only (no brown)
    n = len(shaft)
    for b in range(6):
        t_center = 0.12 + b * 0.12
        half = 0.032
        i0 = max(1, int((t_center - half) * (n - 1)))
        i1 = min(n - 2, int((t_center + half) * (n - 1)))
        if i1 <= i0:
            continue
        strip = [to_hi(*p) for p in left[i0:i1] + list(reversed(right[i0:i1]))]
        fill = (252, 250, 246, 70) if b % 2 == 0 else (255, 255, 255, 50)
        draw.polygon(strip, fill=fill)

    # Barb lines — faint light veins
    for start, end, opacity in barbs:
        s = to_hi(*start)
        e = to_hi(*end)
        r, g, b, base_a = COLORS["barb_main"]
        alpha = int(base_a * opacity / 0.48 * 0.75)
        draw.line([s, e], fill=(r, g, b, alpha), width=max(1, SCALE // 3))

    for i in range(2, n - 3, 2):
        t = i / (n - 1)
        if t < 0.07 or t > 0.90:
            continue
        sx, sy = shaft[i]
        lx, ly = left[i]
        rx, ry = right[i]
        tx, ty = bez_tangent(t, P0, P1, P2, P3)
        draw.line(
            [to_hi(sx + tx * 0.1, sy + ty * 0.1), to_hi(lx, ly)],
            fill=COLORS["barb_fine"],
            width=1,
        )
        draw.line(
            [to_hi(sx - tx * 0.08, sy - ty * 0.08), to_hi(rx, ry)],
            fill=COLORS["barb_fine"],
            width=1,
        )

    # Shaft (central stick)
    hi_shaft = [to_hi(*p) for p in shaft]
    draw.line(hi_shaft, fill=COLORS["shaft"], width=SCALE + 1)

    # Calamus / nib extension
    tx, ty = bez_tangent(0.0, P0, P1, P2, P3)
    nib_tip = (P0[0] - tx * 0.6, P0[1] - ty * 0.6)
    draw.line([to_hi(*nib_tip), to_hi(*P0)], fill=COLORS["shaft"], width=SCALE)
    draw.polygon(
        [to_hi(*nib_tip), to_hi(P0[0] + 0.4, P0[1] - 0.5), to_hi(P0[0] + 0.8, P0[1] - 0.2)],
        fill=COLORS["nib"],
    )

    # Soft edge feathering — blur alpha channel only
    r, g, b, a = img.split()
    a = a.filter(ImageFilter.GaussianBlur(radius=SCALE * 0.42))
    # Preserve solid interior
    a_np = np.array(a, dtype=np.float32)
    a_np = np.clip(a_np * 1.08, 0, 255)
    a = Image.fromarray(a_np.astype(np.uint8))
    img = Image.merge("RGBA", (r, g, b, a))

    return img


def path_from_points(points: list[tuple[float, float]], smooth: bool = True) -> str:
    if len(points) < 3:
        coords = " L ".join(f"{x:.2f} {y:.2f}" for x, y in points)
        return f"M {coords} Z"
    parts = [f"M {points[0][0]:.2f} {points[0][1]:.2f}"]
    for i in range(1, len(points)):
        x0, y0 = points[i - 1]
        x1, y1 = points[i]
        if smooth:
            cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
            parts.append(f"Q {x0:.2f} {y0:.2f} {cx:.2f} {cy:.2f}")
        else:
            parts.append(f"L {x1:.2f} {y1:.2f}")
    parts.append("Z")
    return " ".join(parts)


def render_svg() -> None:
    left, right, shaft = build_outline(40)
    poly = outline_polygon(left, right)
    barbs = build_barbs(shaft, left, right, 22)

    lines = [
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">',
        "  <!-- Bright white feather quill — hotspot (3, 30) -->",
        f'  <path d="{path_from_points(poly)}" fill="{SVG_COLORS["base"]}" stroke="{SVG_COLORS["outline"]}" stroke-width="0.55" stroke-linejoin="round" />',
    ]

    n = len(shaft)
    for b in range(6):
        t_center = 0.12 + b * 0.12
        half = 0.032
        i0 = max(1, int((t_center - half) * (n - 1)))
        i1 = min(n - 2, int((t_center + half) * (n - 1)))
        if i1 <= i0:
            continue
        strip = left[i0:i1] + list(reversed(right[i0:i1]))
        fill = SVG_COLORS["band_warm"] if b % 2 == 0 else SVG_COLORS["band_light"]
        opacity = 0.14 if b % 2 == 0 else 0.08
        lines.append(
            f'  <path d="{path_from_points(strip)}" fill="{fill}" opacity="{opacity:.2f}" />'
        )

    for start, end, opacity in barbs:
        lines.append(
            f'  <line x1="{start[0]:.2f}" y1="{start[1]:.2f}" x2="{end[0]:.2f}" y2="{end[1]:.2f}" '
            f'stroke="{SVG_COLORS["barb"]}" stroke-width="0.45" stroke-linecap="round" opacity="{opacity * 0.55:.2f}" />'
        )

    shaft_path = " L ".join(f"{x:.2f} {y:.2f}" for x, y in shaft)
    lines.append(
        f'  <path d="M {shaft_path}" stroke="{SVG_COLORS["shaft"]}" stroke-width="1.2" stroke-linecap="round" />'
    )

    tx, ty = bez_tangent(0.0, P0, P1, P2, P3)
    nib_tip = (P0[0] - tx * 0.6, P0[1] - ty * 0.6)
    lines.append(f'  <path d="M {nib_tip[0]:.2f} {nib_tip[1]:.2f} L {P0[0]:.2f} {P0[1]:.2f}" '
                 f'stroke="{SVG_COLORS["shaft"]}" stroke-width="1.0" stroke-linecap="round" />')
    lines.append(
        f'  <path d="M {nib_tip[0]:.2f} {nib_tip[1]:.2f} L {P0[0]+0.4:.2f} {P0[1]-0.5:.2f} '
        f'L {P0[0]+0.8:.2f} {P0[1]-0.2:.2f} Z" fill="{SVG_COLORS["nib"]}" />'
    )
    lines.append("</svg>\n")
    OUT_SVG.write_text("\n".join(lines))


def main() -> None:
    render_svg()
    hi = render_hi_res()
    out = hi.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    out.save(OUT_PNG)
    print(f"Wrote {OUT_SVG}")
    print(f"Wrote {OUT_PNG}")


if __name__ == "__main__":
    main()
