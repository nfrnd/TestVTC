// Quick first-screen and section snapshots on phones (and a tablet), for visual review.
//   node scripts/verify/snap-mobile.mjs [baseUrl] [outDir] [path]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const CHROME = process.env.SCROLLCRAFT_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = process.argv[2] || 'http://127.0.0.1:4321';
const OUT = process.argv[3] || 'lab/mobile';
const PATH = process.argv[4] || '/';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME });
for (const [w, h] of [[360, 640], [390, 844], [412, 915], [768, 1024]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: w < 700, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(BASE + PATH, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${OUT}/${PATH.replace(/\W+/g, '_') || 'home'}-${w}x${h}.png` });
  await ctx.close();
}
await browser.close();
