// Rasterizes apps/web/public/icon.svg into the PNG icons the spec requires:
//   - icon-192.png       (PWA install prompt — Android Chrome)
//   - icon-512.png       (PWA splash + maskable on supporting platforms)
//   - apple-touch-icon.png  (iOS home-screen icon, 180×180, opaque)
//
// Runs as the `build:icons` script chained into the web app's `build` script
// so production bundles always carry the latest icons. Local dev doesn't need
// it; the SVG alone works.
//
// Idempotent: re-running with the same SVG produces byte-identical PNGs.

import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(here, '..', 'public');
const sourceSvg = resolve(publicDir, 'icon.svg');

const renders = [
  { name: 'icon-192.png', size: 192, opaque: false },
  { name: 'icon-512.png', size: 512, opaque: false },
  // iOS strips alpha and renders the icon on a solid background, so we
  // pre-flatten on the brand slate-900 to avoid the OS picking a default.
  { name: 'apple-touch-icon.png', size: 180, opaque: true },
];

async function main() {
  await mkdir(publicDir, { recursive: true });
  for (const r of renders) {
    let pipeline = sharp(sourceSvg, { density: 384 }).resize(r.size, r.size, {
      fit: 'contain',
      background: { r: 15, g: 23, b: 42, alpha: r.opaque ? 1 : 0 },
    });
    if (r.opaque) pipeline = pipeline.flatten({ background: '#0f172a' });
    const out = resolve(publicDir, r.name);
    await pipeline.png({ compressionLevel: 9 }).toFile(out);
    // Build-time progress: stderr is the conventional channel.
    process.stderr.write(`built ${r.name} (${r.size}×${r.size})\n`);
  }
}

main().catch((err) => {
  console.error('build-icons failed', err);
  process.exitCode = 1;
});
