import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generate() {
  const iconSvgPath = path.resolve('public/icon.svg');
  const maskableSvgPath = path.resolve('public/icon-maskable.svg');
  
  const iconSvg = fs.readFileSync(iconSvgPath);
  const maskableSvg = fs.readFileSync(maskableSvgPath);

  console.log('Generating 192x192 PNG...');
  await sharp(iconSvg)
    .resize(192, 192)
    .png()
    .toFile('public/pwa-192x192.png');

  console.log('Generating 512x512 PNG...');
  await sharp(iconSvg)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-512x512.png');

  console.log('Generating 512x512 Maskable PNG...');
  await sharp(maskableSvg)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-maskable-512x512.png');

  console.log('Generating 180x180 Apple Touch Icon...');
  await sharp(iconSvg)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');

  console.log('Generating 64x64 Favicon PNG...');
  await sharp(iconSvg)
    .resize(64, 64)
    .png()
    .toFile('public/favicon.ico');

  console.log('All PWA icons generated successfully!');
}

generate().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
