// Measures hero copy contrast against the actual composited scene: hides the
// text, screenshots the same frame, and grades each line against the brightest
// background pixel under it (light text on dark). Scroll Craft's harness only
// grades [data-sc-cue] elements, so the stable hero copy is measured here.
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const CHROME = process.env.SCROLLCRAFT_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = process.argv[2] || 'http://127.0.0.1:4321';
const lum = (r, g, b) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const browser = await chromium.launch({ executablePath: CHROME });
const out = [];
for (const [w, h] of [[1440, 900], [390, 844], [360, 640], [1024, 768]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  for (const p of [0, 0.5, 1]) {
    await page.evaluate((f) => scrollTo(0, innerHeight * 0.6 * f), p);
    await page.waitForTimeout(350);
    const sel = ['.hero__eyebrow', '.hero h1', '.hero__lede', '.hero__caption'];
    const boxes = await page.evaluate((s) => s.map((q) => { const e = document.querySelector(q); const b = e.getBoundingClientRect(); const c = getComputedStyle(e).color; return { q, b: [b.x, b.y, b.width, b.height], c, visible: getComputedStyle(e).display !== 'none' }; }), sel);
    await page.addStyleTag({ content: '.hero__copy, .hero__caption, .site-header { visibility: hidden !important }' });
    const png = PNG.sync.read(await page.screenshot());
    await page.evaluate(() => document.querySelectorAll('style').forEach((s) => s.textContent.includes('visibility: hidden !important') && s.remove()));
    for (const { q, b, c, visible } of boxes) {
      if (!visible) continue;
      const [r, g, bl] = c.match(/\d+/g).map(Number);
      const ink = lum(r, g, bl);
      let worst = 0;
      for (let y = Math.max(0, Math.floor(b[1])); y < Math.min(png.height, b[1] + b[3]); y += 2)
        for (let x = Math.max(0, Math.floor(b[0])); x < Math.min(png.width, b[0] + b[2]); x += 2) {
          const i = (png.width * y + x) * 4;
          worst = Math.max(worst, lum(png.data[i], png.data[i + 1], png.data[i + 2]));
        }
      out.push({ viewport: `${w}x${h}`, progress: p, element: q, worstContrast: +ratio(ink, worst).toFixed(2) });
    }
  }
  await page.close();
}
await browser.close();
mkdirSync('lab', { recursive: true });
writeFileSync('lab/hero-contrast.json', JSON.stringify(out, null, 2));
const min = out.reduce((a, r) => (r.worstContrast < a.worstContrast ? r : a));
console.table(out.filter((r) => r.progress !== 0.5));
console.log('minimum', min);
