#!/usr/bin/env python3
"""
Script untuk generate icon PNG dari SVG
Requires: pip install cairosvg pillow
"""

import os
import cairosvg
from PIL import Image
import io

SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
ASSETS_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'images')

def generate_png_from_svg(svg_path, png_path, size):
    """Generate PNG dari SVG"""
    try:
        # Convert SVG to PNG menggunakan cairosvg
        png_data = cairosvg.svg2png(
            url=svg_path,
            output_width=size,
            output_height=size
        )
        
        # Simpan PNG
        with open(png_path, 'wb') as f:
            f.write(png_data)
        
        print(f"  ✓ Generated: {os.path.basename(png_path)} ({size}x{size})")
        return True
    except Exception as e:
        print(f"  ✗ Failed: {os.path.basename(png_path)} - {e}")
        return False

def main():
    print("Generating PNG icons from SVG...")
    
    # Cari file SVG 192x192 sebagai base
    base_svg = os.path.join(ASSETS_DIR, 'icon-192x192.svg')
    
    if not os.path.exists(base_svg):
        print("✗ Base SVG not found:", base_svg)
        return
    
    for size in SIZES:
        svg_file = os.path.join(ASSETS_DIR, f'icon-{size}x{size}.svg')
        png_file = os.path.join(ASSETS_DIR, f'icon-{size}x{size}.png')
        
        # Gunakan file SVG spesifik jika ada, jika tidak gunakan base
        svg_source = svg_file if os.path.exists(svg_file) else base_svg
        
        generate_png_from_svg(svg_source, png_file, size)
    
    print("\nDone! All icons generated.")

if __name__ == '__main__':
    main()
