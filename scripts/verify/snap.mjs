// Quick screenshots for development: node scripts/verify/snap.mjs <url> <out-prefix> [w] [h] [scrollY...]
import { chromium } from 'playwright-core';
const CHROME = process.env.SCROLLCRAFT_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const [url, out, w = '1440', h = '900', ...ys] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, reducedMotion: process.env.REDUCED ? 'reduce' : 'no-preference', javaScriptEnabled: !process.env.NOJS });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const positions = ys.length ? ys : ['0'];
for (const y of positions) {
  if (y === 'full') {
    // Walk the page first: reveal-on-entry content only fires when it is actually scrolled to.
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let t = 0; t < total; t += Math.round(+h * 0.6)) {
      await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), t);
      await page.waitForTimeout(120);
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}-full.png`, fullPage: true });
    continue;
  }
  await page.evaluate((v) => window.scrollTo({ top: +v, behavior: 'instant' }), y);
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${out}-${y}.png` });
}
if (errors.length) console.log('ERRORS', errors);
await browser.close();
