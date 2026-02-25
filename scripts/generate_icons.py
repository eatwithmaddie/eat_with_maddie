from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


ICON_SIZES = {
    "icon-16x16.png": 16,
    "icon-32x32.png": 32,
    "icon-48x48.png": 48,
    "icon-64x64.png": 64,
    "apple-touch-icon.png": 180,
    "android-chrome-192x192.png": 192,
    "android-chrome-512x512.png": 512,
}


def load_best_frame(source: Path) -> Image.Image:
    with Image.open(source) as ico:
        frame_count = getattr(ico, "n_frames", 1)
        best: Image.Image | None = None
        best_area = -1
        best_max_edge = -1

        for frame_index in range(frame_count):
            if frame_count > 1:
                ico.seek(frame_index)
            frame = ico.convert("RGBA")
            width, height = frame.size
            area = width * height
            max_edge = max(width, height)

            if area > best_area or (area == best_area and max_edge > best_max_edge):
                best = frame.copy()
                best_area = area
                best_max_edge = max_edge

        if best is None:
            raise RuntimeError(f"Could not read icon frames from {source}")
        return best


def resize_icon(base_icon: Image.Image, target_size: int) -> Image.Image:
    icon = base_icon.copy()
    icon.thumbnail((target_size, target_size), Image.Resampling.LANCZOS, reducing_gap=3.0)

    canvas = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
    left = (target_size - icon.width) // 2
    top = (target_size - icon.height) // 2
    canvas.paste(icon, (left, top), icon)
    return canvas


def generate_icons(source: Path, output_dir: Path) -> None:
    if not source.exists():
        raise FileNotFoundError(f"Input icon not found: {source}")

    output_dir.mkdir(parents=True, exist_ok=True)
    base_icon = load_best_frame(source)

    for filename, size in ICON_SIZES.items():
        target = output_dir / filename
        image = resize_icon(base_icon, size)
        image.save(target, format="PNG", optimize=True)
        print(f"Wrote {target}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate web/app icon PNGs from a .ico source file."
    )
    parser.add_argument(
        "input",
        nargs="?",
        default="assets/Icons/favicon.ico",
        help="Path to the source .ico file (default: assets/Icons/favicon.ico)",
    )
    parser.add_argument(
        "--output",
        default="client/public/icons",
        help="Output directory for PNG icons (default: client/public/icons)",
    )
    args = parser.parse_args()

    source = Path(args.input)
    output_dir = Path(args.output)
    generate_icons(source=source, output_dir=output_dir)


if __name__ == "__main__":
    main()
