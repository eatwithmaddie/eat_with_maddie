from __future__ import annotations

import argparse
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps


VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
TARGET_RATIO_WIDTH = 3
TARGET_RATIO_HEIGHT = 2


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def parse_widths(raw_widths: str) -> list[int]:
    widths: list[int] = []
    for piece in raw_widths.split(","):
        value = piece.strip()
        if not value:
            continue
        parsed = int(value)
        if parsed < 64:
            raise ValueError(f"Width must be at least 64px, got {parsed}")
        widths.append(parsed)
    if not widths:
        raise ValueError("At least one output width is required.")
    return sorted(set(widths))


def get_height_from_width(width: int) -> int:
    return int(round(width * TARGET_RATIO_HEIGHT / TARGET_RATIO_WIDTH))


def make_canvas(image: Image.Image, width: int, height: int) -> Image.Image:
    background = Image.new("RGB", (width, height), (26, 12, 12))
    fit = image.copy()
    fit.thumbnail((width, height), Image.Resampling.LANCZOS, reducing_gap=3.0)
    left = (width - fit.width) // 2
    top = (height - fit.height) // 2
    background.paste(fit, (left, top))
    return background


def make_squircle_mask(width: int, height: int) -> Image.Image:
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)
    radius = int(min(width, height) * 0.30)
    draw.rounded_rectangle((0, 0, width, height), radius=radius, fill=255)
    return mask


def process_image(source: Path, output_dir: Path, widths: list[int], quality: int) -> list[Path]:
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")

    slug = slugify(source.stem)
    generated: list[Path] = []

    for width in widths:
        height = get_height_from_width(width)
        canvas = make_canvas(image, width, height).convert("RGBA")
        canvas.putalpha(make_squircle_mask(width, height))

        output_path = output_dir / f"{slug}-{width}x{height}.webp"
        canvas.save(
            output_path,
            format="WEBP",
            quality=quality,
            method=6,
            exact=True,
        )
        generated.append(output_path)

    return generated


def delete_old_outputs(output_dir: Path) -> None:
    for path in output_dir.glob("*.webp"):
        path.unlink()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Prepare optimized squircle carousel images for the web.",
    )
    parser.add_argument(
        "--input-dir",
        default="assets/Meal Carousel",
        help="Source image directory (default: assets/Meal Carousel)",
    )
    parser.add_argument(
        "--output-dir",
        default="client/public/images/carousel",
        help="Destination directory (default: client/public/images/carousel)",
    )
    parser.add_argument(
        "--widths",
        default="360,600",
        help="Comma-separated output widths in pixels for 3:2 images (default: 360,600)",
    )
    parser.add_argument(
        "--quality",
        type=int,
        default=88,
        help="WebP quality 1-100 (default: 88)",
    )

    args = parser.parse_args()
    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    widths = parse_widths(args.widths)
    quality = max(1, min(100, args.quality))

    if not input_dir.exists():
        raise FileNotFoundError(f"Input directory not found: {input_dir}")

    sources = sorted(
        path for path in input_dir.iterdir() if path.is_file() and path.suffix.lower() in VALID_EXTENSIONS
    )
    if not sources:
        raise FileNotFoundError(f"No supported image files found in {input_dir}")

    output_dir.mkdir(parents=True, exist_ok=True)
    delete_old_outputs(output_dir)

    print(f"Preparing {len(sources)} image(s) -> {output_dir}")
    print(
        f"Output widths: {', '.join(str(width) for width in widths)} | ratio=3:2 | quality={quality}"
    )

    generated_count = 0
    for source in sources:
        generated = process_image(source, output_dir, widths, quality)
        generated_count += len(generated)
        for path in generated:
            print(f"Wrote {path}")

    print(f"Done. Generated {generated_count} optimized carousel preview(s).")


if __name__ == "__main__":
    main()
