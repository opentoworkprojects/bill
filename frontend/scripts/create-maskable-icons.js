/**
 * Script to create maskable icons with proper safe zone padding
 * Maskable icons need content within inner 80% (10% padding on each side)
 * 
 * Run: node scripts/create-maskable-icons.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available, if not provide instructions
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp not installed. Installing...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install sharp --save-dev', { stdio: 'inherit' });
    sharp = require('sharp');
  } catch (installError) {
    console.error('Failed to install sharp. Please run: npm install sharp --save-dev');
    process.exit(1);
  }
}

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

async function createMaskableIcon(inputPath, outputPath, size) {
  // For maskable icons, content should be in inner 80%
  // So we add 10% padding on each side
  const padding = Math.round(size * 0.1);
  const innerSize = size - (padding * 2);
  
  try {
    // Read the original icon
    const inputBuffer = fs.readFileSync(inputPath);
    
    // Resize the logo to fit in the safe zone (inner 80%)
    const resizedLogo = await sharp(inputBuffer)
      .resize(innerSize, innerSize, {
        fit: 'contain',
        background: '#7c3aed' // Purple background
      })
      .toBuffer();
    
    // Create the final maskable icon with padding
    const maskableIcon = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: '#7c3aed' // Purple background
      }
    })
      .composite([{
        input: resizedLogo,
        top: padding,
        left: padding
      }])
      .png()
      .toBuffer();
    
    fs.writeFileSync(outputPath, maskableIcon);
    console.log(`Created: ${outputPath} (${size}x${size})`);
  } catch (error) {
    console.error(`Error creating ${outputPath}:`, error.message);
  }
}

async function main() {
  console.log('Creating maskable icons with safe zone padding...\n');
  
  const icon512 = path.join(PUBLIC_DIR, 'icon-512.png');
  const icon192 = path.join(PUBLIC_DIR, 'icon-192.png');
  
  // Check if source icons exist
  if (!fs.existsSync(icon512)) {
    console.error('icon-512.png not found in public folder');
    process.exit(1);
  }
  
  // Create maskable versions
  await createMaskableIcon(icon512, path.join(PUBLIC_DIR, 'icon-512-maskable.png'), 512);
  await createMaskableIcon(icon512, path.join(PUBLIC_DIR, 'icon-192-maskable.png'), 192);
  
  console.log('\n✅ Maskable icons created successfully!');
  console.log('\nNext steps:');
  console.log('1. Update manifest.json to use the new maskable icons');
  console.log('2. Update twa-manifest.json maskableIconUrl');
  console.log('3. Rebuild and deploy');
}

main().catch(console.error);
