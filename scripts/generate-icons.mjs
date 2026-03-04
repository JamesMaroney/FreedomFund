// Generates simple PWA icons (gold coin on dark background) to public/
// Run with: node scripts/generate-icons.mjs

import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const s = size;
  const cx = s / 2;
  const cy = s / 2;

  // Background
  ctx.fillStyle = '#0a0a0f';
  ctx.beginPath();
  ctx.roundRect(0, 0, s, s, s * 0.22);
  ctx.fill();

  // Gold coin circle
  const r = s * 0.36;
  const grad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.1, cx, cy, r);
  grad.addColorStop(0, '#ffe680');
  grad.addColorStop(0.5, '#f5c842');
  grad.addColorStop(1, '#c9961a');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Dollar sign
  ctx.fillStyle = '#0a0a0f';
  ctx.font = `bold ${s * 0.34}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', cx, cy + s * 0.01);

  return canvas;
}

const sizes = [192, 512];
for (const size of sizes) {
  const canvas = drawIcon(size);
  const buf = canvas.toBuffer('image/png');
  const outPath = join(__dirname, '..', 'public', `icon-${size}.png`);
  writeFileSync(outPath, buf);
  console.log(`Written ${outPath}`);
}
