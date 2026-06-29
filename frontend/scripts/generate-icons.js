// Generate all logo variants from the high-res source image (logo.jpeg or logo.png).
// Run: node scripts/generate-icons.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');

const SOURCE_PNG = path.join(PUBLIC, 'logo.png');
const SOURCE_JPEG = path.join(PUBLIC, 'logo.jpeg');

function pickSource() {
  if (fs.existsSync(SOURCE_PNG)) return SOURCE_PNG;
  if (fs.existsSync(SOURCE_JPEG)) return SOURCE_JPEG;
  throw new Error('No logo source found. Add logo.png or logo.jpeg to public/.');
}

const source = pickSource();

async function renderPng(outPath, size, options = {}) {
  const buf = await sharp(source, { density: 384 })
    .resize(size, size, { fit: options.fit || 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(outPath, buf);
  console.log(`  ✓ ${path.relative(ROOT, outPath)}  (${size}×${size}, ${buf.length} bytes)`);
}

async function renderFavicon(outPath, size) {
  // Favicon — keep the wordmark on a transparent background; browsers handle PNG-in-ICO
  const buf = await sharp(source, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(outPath, buf);
  console.log(`  ✓ ${path.relative(ROOT, outPath)}  (${size}×${size} PNG, ${buf.length} bytes)`);
}

async function renderMaskable(outPath, size, bgColor) {
  // Maskable icon: source centered on a solid background, padded to the safe zone
  const inner = Math.round(size * 0.8);
  const innerBuf = await sharp(source, { density: 384 })
    .resize(inner, inner, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();
  const out = await sharp({
    create: { width: size, height: size, channels: 4, background: bgColor },
  })
    .composite([{ input: innerBuf, gravity: 'center' }])
    .png()
    .toBuffer();
  fs.writeFileSync(outPath, out);
  console.log(`  ✓ ${path.relative(ROOT, outPath)}  (${size}×${size}, maskable)`);
}

async function renderOg(outPath, w, h) {
  // Social share — source centered on a white card with generous padding
  const cardPad = 80;
  const innerMaxW = w - cardPad * 2;
  const innerMaxH = h - cardPad * 2;
  const inner = await sharp(source, { density: 384 })
    .resize(innerMaxW, innerMaxH, { fit: 'inside', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();
  const out = await sharp({
    create: { width: w, height: h, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([{ input: inner, gravity: 'center' }])
    .png()
    .toBuffer();
  fs.writeFileSync(outPath, out);
  console.log(`  ✓ ${path.relative(ROOT, outPath)}  (${w}×${h})`);
}

(async () => {
  console.log(`Generating ApnaKit icons from ${path.basename(source)}…`);

  // Favicons
  await renderFavicon(path.join(PUBLIC, 'favicon-16x16.png'), 16);
  await renderFavicon(path.join(PUBLIC, 'favicon-32x32.png'), 32);
  await renderFavicon(path.join(PUBLIC, 'favicon.ico'), 64);
  await renderPng(path.join(PUBLIC, 'apple-touch-icon.png'), 180);
  await renderPng(path.join(PUBLIC, 'apple-touch-icon-precomposed.png'), 180);

  // PWA
  await renderPng(path.join(PUBLIC, 'icons', 'icon-192x192.png'), 192);
  await renderPng(path.join(PUBLIC, 'icons', 'icon-512x512.png'), 512);
  await renderMaskable(path.join(PUBLIC, 'icons', 'icon-maskable-512x512.png'), 512, { r: 30, g: 58, b: 138, alpha: 1 });

  // Raster logo (used where SVG isn't supported)
  await renderPng(path.join(PUBLIC, 'logo.png'), 480);

  // Social share
  await renderOg(path.join(PUBLIC, 'og-image.png'), 1200, 630);

  console.log('Done.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
