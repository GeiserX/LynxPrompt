import sharp from 'sharp';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

const sizes = [
  { file: 'favicon-16.png', size: 16 },
  { file: 'favicon-32.png', size: 32 },
  { file: 'favicon-48.png', size: 48 },
  { file: 'favicon-96.png', size: 96 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
];

async function generateFavicons() {
  const input = join(publicDir, 'lynxprompt.png');
  
  console.log('🦁 Generating favicons from', input);
  
  // Generate PNG sizes
  for (const { file, size } of sizes) {
    await sharp(input)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(join(publicDir, file));
    console.log(`✓ Generated ${file} (${size}x${size})`);
  }
  
  // Generate proper ICO file (multi-resolution: 16, 32, 48)
  // Since Sharp doesn't support ICO output, we'll use the 32px PNG as favicon.ico
  // Modern browsers will use the PNG favicons from the manifest
  await sharp(input)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(publicDir, 'favicon.ico'));
  console.log('✓ Generated favicon.ico (32x32 PNG format)');
  
  // Generate SVG favicon
  // Since we're working with a PNG source, we'll create a simple SVG wrapper
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <image href="/lynxprompt.png" width="512" height="512"/>
</svg>`;
  await fs.writeFile(join(publicDir, 'favicon.svg'), svgContent);
  console.log('✓ Generated favicon.svg');
  
  // Generate web app manifest
  const manifest = {
    name: "LynxPrompt",
    short_name: "LynxPrompt",
    description: "AI IDE Configuration Generator",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#9333ea",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ]
  };
  
  await fs.writeFile(
    join(publicDir, 'site.webmanifest'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('✓ Generated site.webmanifest');
  
  console.log('\n✅ All favicons and manifest generated successfully!');
}

generateFavicons().catch(console.error);
