import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const products = [
  { id: 'pro-monthly', name: 'lynxprompt-pro-monthly' },
  { id: 'pro-annual', name: 'lynxprompt-pro-annual' },
  { id: 'max-monthly', name: 'lynxprompt-max-monthly' },
  { id: 'max-annual', name: 'lynxprompt-max-annual' },
  { id: 'teams-monthly', name: 'lynxprompt-teams-monthly' },
  { id: 'teams-annual', name: 'lynxprompt-teams-annual' },
];

async function captureImages() {
  // Create output directory
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set viewport to be large enough
  await page.setViewport({ width: 1920, height: 1200, deviceScaleFactor: 2 });
  
  // Load the HTML file
  const htmlPath = `file://${path.join(__dirname, 'generate-images.html')}`;
  await page.goto(htmlPath, { waitUntil: 'networkidle0' });
  
  // Wait a bit for any fonts to load
  await new Promise(resolve => setTimeout(resolve, 500));
  
  for (const product of products) {
    console.log(`Capturing ${product.name}...`);
    
    const element = await page.$(`#${product.id}`);
    if (element) {
      await element.screenshot({
        path: path.join(outputDir, `${product.name}.png`),
        type: 'png',
        omitBackground: false,
      });
      console.log(`  ✓ Saved ${product.name}.png`);
    } else {
      console.log(`  ✗ Element #${product.id} not found`);
    }
  }
  
  await browser.close();
  
  console.log('\n✅ All images captured successfully!');
  console.log(`   Output directory: ${outputDir}`);
}

captureImages().catch(console.error);

