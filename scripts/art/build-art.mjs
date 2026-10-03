// Regenerates every authored illustration. Run: node scripts/art/build-art.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { carSvg } from './car.mjs';
import { backSvg, midSvg, roadSvg, frondsSvg } from './scene.mjs';
const out = 'src/assets/art';
mkdirSync(out, { recursive: true });
mkdirSync('src/assets/art', { recursive: true });
const min = (s) => s.replace(/\n\s*/g, ' ').replace(/>\s+</g, '><');
const files = {
  [`${out}/back-desktop.svg`]: backSvg('desktop'),
  [`${out}/back-mobile.svg`]: backSvg('mobile'),
  [`${out}/mid-desktop.svg`]: midSvg('desktop'),
  [`${out}/mid-mobile.svg`]: midSvg('mobile'),
  [`${out}/road.svg`]: roadSvg(),
  [`${out}/fronds.svg`]: frondsSvg(),
  // inlined by components so the wheels can rotate
  ['src/assets/art/car-dusk.svg']: carSvg('dusk'),
  ['src/assets/art/car-studio.svg']: carSvg('studio'),
};
for (const [f, s] of Object.entries(files)) {
  writeFileSync(f, min(s));
  console.log(f, (min(s).length / 1024).toFixed(1) + ' KB');
}
