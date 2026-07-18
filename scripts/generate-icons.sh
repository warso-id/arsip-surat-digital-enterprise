#!/bin/bash

# Script untuk generate semua icon PNG dari SVG
# Requires: inkscape atau rsvg-convert

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ASSETS_DIR="$SCRIPT_DIR/../public/assets/images"

SIZES=(72 96 128 144 152 192 384 512)

echo "Generating PWA icons..."

for size in "${SIZES[@]}"; do
    INPUT_SVG="$ASSETS_DIR/icon-${size}x${size}.svg"
    OUTPUT_PNG="$ASSETS_DIR/icon-${size}x${size}.png"
    
    if [ -f "$INPUT_SVG" ]; then
        echo "Generating ${size}x${size}..."
        
        if command -v rsvg-convert &> /dev/null; then
            rsvg-convert -w $size -h $size "$INPUT_SVG" -o "$OUTPUT_PNG"
        elif command -v inkscape &> /dev/null; then
            inkscape -w $size -h $size "$INPUT_SVG" -o "$OUTPUT_PNG" 2>/dev/null
        elif command -v convert &> /dev/null; then
            convert -background none -size ${size}x${size} "$INPUT_SVG" "$OUTPUT_PNG"
        else
            echo "Please install inkscape, rsvg-convert, or imagemagick"
            exit 1
        fi
        
        echo "  ✓ Created: $OUTPUT_PNG"
    else
        echo "  ✗ SVG not found: $INPUT_SVG"
    fi
done

echo "Done! All icons generated."
