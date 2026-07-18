#!/bin/bash

# Generate PWA icons from SVG
# Requires: inkscape or convert (ImageMagick)

ICON_SIZES=(72 96 128 144 152 192 384 512)
SOURCE_SVG="assets/images/icon.svg"
OUTPUT_DIR="assets/images"

if [ ! -f "$SOURCE_SVG" ]; then
    echo "Source SVG not found: $SOURCE_SVG"
    exit 1
fi

echo "Generating PWA icons..."

for size in "${ICON_SIZES[@]}"; do
    output_file="${OUTPUT_DIR}/icon-${size}x${size}.png"
    
    if command -v inkscape &> /dev/null; then
        inkscape -w $size -h $size "$SOURCE_SVG" -o "$output_file"
    elif command -v convert &> /dev/null; then
        convert -background none -size ${size}x${size} "$SOURCE_SVG" "$output_file"
    else
        echo "Please install Inkscape or ImageMagick"
        exit 1
    fi
    
    echo "  Generated: $output_file"
done

echo "Icons generated successfully!"
