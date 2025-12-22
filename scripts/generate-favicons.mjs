import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceImage = path.join(__dirname, '../logos/LynxPrompt-lynx.png');
const publicDir = path.join(__dirname, '../public');

async function generateFavicons() {
  console.log('Generating favicons from:', sourceImage);
  
  // Read the source image
  const image = sharp(sourceImage);
  
  // Generate different sizes
  const sizes = [
    { name: 'favicon-16.png', size: 16 },
    { name: 'favicon-32.png', size: 32 },
    { name: 'favicon-48.png', size: 48 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
  ];
  
  for (const { name, size } of sizes) {
    const outputPath = path.join(publicDir, name);
    await sharp(sourceImage)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    console.log(`Generated: ${name} (${size}x${size})`);
  }
  
  // Generate ICO file (using 32x32 as the base)
  // ICO is just a PNG renamed for modern browsers
  await sharp(sourceImage)
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Generated: favicon.ico (32x32)');
  
  // Also copy a version as logo.png at a reasonable size
  await sharp(sourceImage)
    .resize(256, 256, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(publicDir, 'logo.png'));
  console.log('Generated: logo.png (256x256)');
  
  console.log('\nAll favicons generated successfully!');
}

generateFavicons().catch(console.error);
