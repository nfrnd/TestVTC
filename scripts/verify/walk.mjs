// Visitor's-eye review: screenshots of each screen while scrolling down a page
// (entrance animations get time to play), for phones or desktop.
//   node scripts/verify/walk.mjs <path> <width> <height> [outDir] [baseUrl]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const CHROME = process.env.SCROLLCRAFT_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const [path = '/', w = '390', h = '844', out = 'lab/walk', base = 'http://127.0.0.1:4321'] = process.argv.slice(2);
const W = Number(w), H = Number(h);
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: CHROME });
const mobile = W < 700;
const ctx = await b.newContext({ viewport: { width: W, height: H }, isMobile: mobile, hasTouch: mobile });
const page = await ctx.newPage();
await page.goto(base + path, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const total = await page.evaluate(() => document.documentElement.scrollHeight);
const tag = `${path.replace(/\W+/g, '_')}${W}`;
let i = 0;
for (let y = 0; ; y += Math.round(H * 0.85)) {
  await page.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), y);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/${tag}-${String(i++).padStart(2, '0')}.png` });
  if (y + H >= total) break;
}
console.log(`${tag}: ${i} screens`);
await b.close();
