/**
 * Generate Electron app icons from logo.png
 * 
 * This script creates:
 * - icon.ico (Windows)
 * - icon.icns (macOS) 
 * - icon.png (Linux)
 * 
 * Run: node scripts/generate-electron-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_IMAGE = path.join(__dirname, '../../logo.png');
const OUTPUT_DIR = path.join(__dirname, '../electron/icons');

// Icon sizes needed
const SIZES = [16, 24, 32, 48, 64, 128, 256, 512, 1024];

async function generateIcons() {
  console.log('🎨 Generating Electron icons from logo.png...\n');
  
  // Check if source exists
  if (!fs.existsSync(SOURCE_IMAGE)) {
    console.error('❌ Source image not found:', SOURCE_IMAGE);
    console.log('   Please ensure logo.png exists in the project root');
    process.exit(1);
  }
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  try {
    // Generate PNG icons at various sizes
    for (const size of SIZES) {
      const outputPath = path.join(OUTPUT_DIR, `icon-${size}.png`);
      await sharp(SOURCE_IMAGE)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toFile(outputPath);
      console.log(`✅ Generated: icon-${size}.png`);
    }
    
    // Generate main icon.png (256x256 for Linux)
    await sharp(SOURCE_IMAGE)
      .resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(OUTPUT_DIR, 'icon.png'));
    console.log('✅ Generated: icon.png (256x256)');
    
    console.log('\n📦 PNG icons generated successfully!');
    console.log('\n⚠️  For Windows (.ico) and macOS (.icns) icons:');
    console.log('   Use an online converter or tool like:');
    console.log('   - https://icoconvert.com/ (for .ico)');
    console.log('   - https://cloudconvert.com/png-to-icns (for .icns)');
    console.log('\n   Or use electron-icon-builder:');
    console.log('   npx electron-icon-builder --input=../../logo.png --output=./electron/icons');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();
