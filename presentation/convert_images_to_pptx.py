import os
import re
from pptx import Presentation
from pptx.util import Inches

def build_presentation_from_images():
    prs = Presentation()
    # 2048 x 1344 is exactly 16:10.5 aspect ratio (~1.5238:1).
    # Setting presentation dimensions to match:
    # 13.333 inches width x 8.75 inches height (exact fit for 2048x1344)
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(13.333 * 1344 / 2048)
    
    blank_layout = prs.slide_layouts[6]
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    img_dir = os.path.join(base_dir, "images")
    
    files = [f for f in os.listdir(img_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    
    def sort_key(f):
        m = re.search(r'\((\d+)\)', f)
        return int(m.group(1)) if m else 0
        
    sorted_files = sorted(files, key=sort_key)
    
    for filename in sorted_files:
        img_path = os.path.join(img_dir, filename)
        slide = prs.slides.add_slide(blank_layout)
        slide.shapes.add_picture(
            img_path,
            left=0,
            top=0,
            width=prs.slide_width,
            height=prs.slide_height
        )
        print(f"Added slide: {filename}")
        
    output_path = os.path.join(base_dir, "hyperion_slides.pptx")
    prs.save(output_path)
    print(f"\nPresentation successfully saved to: {output_path}")

if __name__ == "__main__":
    build_presentation_from_images()
