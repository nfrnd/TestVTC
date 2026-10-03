// Screenshots of the layered hero at the start, middle and end of its movement
// (hero-depth acceptance: opening, intermediate state, final state).
//   node scripts/verify/hero-states.mjs [baseUrl] [outDir]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const CHROME = process.env.SCROLLCRAFT_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = process.argv[2] || 'http://127.0.0.1:4321';
const OUT = process.argv[3] || 'lab/hero-states';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME });
for (const [w, h] of [[1440, 900], [1100, 720], [2560, 1080]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  for (const [name, f] of [['debut', 0], ['milieu', 0.5], ['fin', 1]]) {
    await page.evaluate((p) => { const hero = document.querySelector('[data-hero]'); scrollTo(0, Math.max(0, hero.offsetHeight - innerHeight) * p); }, f);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/hero-${w}x${h}-${name}.png` });
  }
  await page.close();
}
await browser.close();
console.log(`written to ${OUT}`);
