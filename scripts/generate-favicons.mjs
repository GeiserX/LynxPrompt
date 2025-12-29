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

// Create ICO file from multiple PNG sizes
// ICO format: header + directory entries + image data
function createIco(images) {
  // ICO header: 6 bytes
  // - 2 bytes: reserved (0)
  // - 2 bytes: type (1 = ICO)
  // - 2 bytes: number of images
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);      // Reserved
  header.writeUInt16LE(1, 2);      // Type: 1 = ICO
  header.writeUInt16LE(images.length, 4); // Number of images
  
  // Directory entries: 16 bytes each
  const dirEntries = [];
  let offset = 6 + (images.length * 16); // Start after header and directory
  
  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);  // Width (0 = 256)
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1); // Height (0 = 256)
    entry.writeUInt8(0, 2);          // Color palette (0 = no palette)
    entry.writeUInt8(0, 3);          // Reserved
    entry.writeUInt16LE(1, 4);       // Color planes
    entry.writeUInt16LE(32, 6);      // Bits per pixel
    entry.writeUInt32LE(img.data.length, 8);  // Image size
    entry.writeUInt32LE(offset, 12); // Offset to image data
    dirEntries.push(entry);
    offset += img.data.length;
  }
  
  return Buffer.concat([header, ...dirEntries, ...images.map(i => i.data)]);
}

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
  
  // Generate proper multi-resolution ICO file (16, 32, 48px)
  const icoSizes = [16, 32, 48];
  const icoImages = await Promise.all(
    icoSizes.map(async (size) => ({
      width: size,
      height: size,
      data: await sharp(input)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    }))
  );
  
  const icoBuffer = createIco(icoImages);
  await fs.writeFile(join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('✓ Generated favicon.ico (multi-resolution: 16, 32, 48px)');
  
  // Generate SVG favicon with embedded base64 PNG
  // External image references don't work in SVG favicons for security reasons
  const pngFor64 = await sharp(input)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const base64Png = pngFor64.toString('base64');
  
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <image href="data:image/png;base64,${base64Png}" width="64" height="64"/>
</svg>`;
  await fs.writeFile(join(publicDir, 'favicon.svg'), svgContent);
  console.log('✓ Generated favicon.svg (with embedded base64 image)');
  
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
