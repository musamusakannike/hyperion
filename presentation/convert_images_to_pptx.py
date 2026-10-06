#!/usr/bin/env python3
"""
Convert image flows (slides) into a Microsoft PowerPoint (.pptx) presentation.
Designed for Hyperion Presentation Slides.
"""

import os
import sys
import glob
import re
import argparse
from io import BytesIO
from PIL import Image
from pptx import Presentation
from pptx.util import Inches, Pt


def natural_sort_key(path):
    """Sort filenames naturally (e.g., 1.png, 2.png, ..., 10.png, 11.png)."""
    basename = os.path.basename(path)
    stem, _ = os.path.splitext(basename)
    # Extract digits or fallback to stem
    digits = re.findall(r'\d+', stem)
    if digits:
        return int(digits[0])
    return stem


def convert_images_to_pptx(
    images_dir: str,
    output_path: str,
    mode: str = "native",
    remove_top_border: bool = True
):
    """
    Converts all slide images in `images_dir` to a PPTX presentation at `output_path`.
    
    :param images_dir: Directory containing slide image files.
    :param output_path: Destination PPTX file path.
    :param mode: 'native' (exact image aspect ratio) or '16:9' (standard widescreen 13.333" x 7.5").
    :param remove_top_border: Whether to crop the 1px top black border artifact.
    """
    extensions = ("*.png", "*.jpg", "*.jpeg", "*.webp")
    image_paths = []
    for ext in extensions:
        image_paths.extend(glob.glob(os.path.join(images_dir, ext)))

    if not image_paths:
        print(f"Error: No image files found in {images_dir}", file=sys.stderr)
        sys.exit(1)

    image_paths.sort(key=natural_sort_key)
    print(f"Found {len(image_paths)} images to convert in '{images_dir}':")
    for idx, p in enumerate(image_paths, 1):
        print(f"  Slide {idx:2d}: {os.path.basename(p)}")

    # Inspect first image to determine target dimensions
    sample_img = Image.open(image_paths[0])
    orig_w, orig_h = sample_img.size
    sample_img.close()

    # Determine slide width and height
    prs = Presentation()
    blank_layout = prs.slide_layouts[6]  # Index 6 is completely blank layout in python-pptx

    if mode == "16:9":
        # Standard PowerPoint 16:9 Widescreen: 13.333 x 7.5 inches
        prs.slide_width = Inches(13.333333)
        prs.slide_height = Inches(7.5)
    else:
        # Native aspect ratio matching images (typically ~2560 x 1478)
        # Using 13.333333 inches as base width
        prs.slide_width = Inches(13.333333)
        prs.slide_height = Inches(13.333333 * (orig_h / orig_w))

    print(f"\nPresentation dimensions: {prs.slide_width.inches:.3f}\" x {prs.slide_height.inches:.3f}\" (Mode: {mode})")

    # Add each image as a full-bleed slide
    for idx, img_path in enumerate(image_paths, 1):
        with Image.open(img_path) as img:
            w, h = img.size
            
            # Optionally remove 1px black top border artifact
            if remove_top_border:
                # Check if top row is black
                top_row = img.crop((0, 0, w, 1)).convert("RGB")
                colors = top_row.getcolors(maxcolors=w)
                # If predominantly or all black, crop 1px off top
                if colors and len(colors) == 1 and colors[0][1] == (0, 0, 0):
                    img = img.crop((0, 1, w, h))

            # Save processed image to memory buffer
            buf = BytesIO()
            img.save(buf, format="PNG")
            buf.seek(0)

        # Create blank slide
        slide = prs.slides.add_slide(blank_layout)

        # Add image to fill the entire slide
        slide.shapes.add_picture(
            buf,
            left=0,
            top=0,
            width=prs.slide_width,
            height=prs.slide_height
        )
        print(f"Added slide {idx}/{len(image_paths)}: {os.path.basename(img_path)}")

    # Ensure output directory exists
    out_dir = os.path.dirname(os.path.abspath(output_path))
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    prs.save(output_path)
    file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"\nSuccessfully generated presentation:")
    print(f"  Path: {output_path}")
    print(f"  Size: {file_size_mb:.2f} MB")
    print(f"  Slides: {len(image_paths)}")


def main():
    parser = argparse.ArgumentParser(
        description="Convert image flows into a PowerPoint (.pptx) presentation."
    )
    parser.add_argument(
        "--input-dir", "-i",
        default=os.path.join(os.path.dirname(__file__), "images"),
        help="Path to folder containing slide images (default: ./images)"
    )
    parser.add_argument(
        "--output", "-o",
        default=os.path.join(os.path.dirname(__file__), "Hyperion_Presentation.pptx"),
        help="Path for generated PPTX file (default: ./Hyperion_Presentation.pptx)"
    )
    parser.add_argument(
        "--mode", "-m",
        choices=["native", "16:9"],
        default="native",
        help="Slide dimensions: 'native' (exact image ratio, default) or '16:9' (standard widescreen)"
    )
    parser.add_argument(
        "--keep-top-border",
        action="store_true",
        help="Do not remove the 1px black top border artifact"
    )

    args = parser.parse_args()

    convert_images_to_pptx(
        images_dir=args.input_dir,
        output_path=args.output,
        mode=args.mode,
        remove_top_border=not args.keep_top_border
    )


if __name__ == "__main__":
    main()
