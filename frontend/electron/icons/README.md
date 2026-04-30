# BillByteKOT Desktop App Icons

Place your app icons in this folder with the following names:

## Required Icon Files:

### Windows
- `icon.ico` - Windows icon (256x256 recommended, multi-resolution ICO file)

### macOS
- `icon.icns` - macOS icon (1024x1024 recommended)

### Linux
- `icon.png` - PNG icon (512x512 or 1024x1024)
- Or multiple sizes: `16x16.png`, `32x32.png`, `48x48.png`, `64x64.png`, `128x128.png`, `256x256.png`, `512x512.png`

## How to Generate Icons:

### Option 1: Online Tools
1. Use https://www.icoconverter.com/ for ICO files
2. Use https://cloudconvert.com/png-to-icns for ICNS files

### Option 2: Using electron-icon-builder (Recommended)
```bash
npm install -g electron-icon-builder
electron-icon-builder --input=./icon.png --output=./
```

### Option 3: Using ImageMagick
```bash
# For ICO (Windows)
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico

# For ICNS (macOS)
# Use iconutil on macOS
```

## Current Logo
The BillByteKOT logo features:
- Teal/cyan gradient background
- Receipt/bill icon on the left
- Cloud with tech circuits and food cloche on the right
- Rounded corners app icon style

Save your logo image as `icon.png` (1024x1024) in this folder, then generate the platform-specific formats.
