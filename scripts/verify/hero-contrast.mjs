// Measures hero text contrast against the actual composited photo scene.
// For each text element: makes the text transparent (backgrounds, scrim and
// button fills stay), screenshots the same frame, and grades the text colour
// against the WORST pixel under its box (brightest for light text, darkest for
// dark text). Conservative: one bright pixel anywhere in the box sets the score.
// Scroll Craft's harness only grades [data-sc-cue] elements, so the hero copy
// is measured here, at the start, middle and end of the hero movement.
//   node scripts/verify/hero-contrast.mjs [baseUrl]
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const CHROME = process.env.SCROLLCRAFT_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = process.argv[2] || 'http://127.0.0.1:4321';
const PATH = process.argv[3] || '/';
const lum = (r, g, b) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const SEL = ['.hero__eyebrow', '.hero__title', '.hero__lede', '.hero__facts li', '.hero__signature', '.hero__caption', '.hero__actions .btn--primary', '.hero__actions .btn--ghost'];
const HIDE = 'hide-text-for-contrast';
const browser = await chromium.launch({ executablePath: CHROME });
const out = [];
for (const [w, h] of [[1440, 900], [1920, 1080], [2560, 1080], [1100, 720], [1024, 768], [768, 1024], [390, 844], [360, 640]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(BASE + PATH, { waitUntil: 'networkidle' });
  for (const p of [0, 0.5, 1]) {
    await page.evaluate((f) => { const hero = document.querySelector('[data-hero]'); scrollTo(0, Math.max(0, hero.offsetHeight - innerHeight) * f); }, p);
    await page.waitForTimeout(400);
    const boxes = await page.evaluate((sels) => sels.flatMap((q) => [...document.querySelectorAll(q)].map((e, i) => {
      // The text's own line boxes (Range rects): excludes padding, rounded
      // corners and decorative ::before bullets, which are not text.
      // Visible text nodes only: screen-reader-only text is clipped but still has line boxes.
      const walker = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
      const lines = [];
      for (let t = walker.nextNode(); t; t = walker.nextNode()) {
        if (!t.textContent.trim() || t.parentElement.closest('.visually-hidden')) continue;
        const range = document.createRange();
        range.selectNodeContents(t);
        lines.push(...range.getClientRects());
      }
      const rects = lines.filter((r) => r.width > 1 && r.height > 1).map((r) => [r.x, r.y, r.width, r.height]);
      const b = e.getBoundingClientRect();
      const cs = getComputedStyle(e);
      return { q: i ? `${q} #${i + 1}` : q, rects, c: cs.color, visible: cs.display !== 'none' && cs.visibility !== 'hidden' && b.width > 0 && b.bottom > 0 && b.top < innerHeight };
    })), SEL);
    const mode = await page.evaluate(() => document.querySelector('[data-hero]').getAttribute('data-hero-mode') || (matchMedia('(min-width:1100px) and (min-aspect-ratio:3/2)').matches ? 'layered' : 'stacked'));
    await page.addStyleTag({ content: `.hero__copy, .hero__copy *, .hero__caption, .hero__caption * { color: transparent !important; text-shadow: none !important; transition: none !important; } .site-header, .demo-strip { visibility: hidden !important } /* ${HIDE} */` });
    await page.waitForTimeout(50);
    const png = PNG.sync.read(await page.screenshot());
    await page.evaluate((m) => document.querySelectorAll('style').forEach((s) => s.textContent.includes(m) && s.remove()), HIDE);
    for (const { q, rects, c, visible } of boxes) {
      if (!visible || !rects.length) continue;
      const [r, g, bl] = c.match(/[\d.]+/g).map(Number);
      const ink = lum(r, g, bl);
      const light = ink > 0.18;
      let worst = light ? 0 : 1;
      for (const b of rects)
        for (let y = Math.max(0, Math.floor(b[1])); y < Math.min(png.height, b[1] + b[3]); y += 2)
          for (let x = Math.max(0, Math.floor(b[0])); x < Math.min(png.width, b[0] + b[2]); x += 2) {
            const i = (png.width * y + x) * 4;
            const L = lum(png.data[i], png.data[i + 1], png.data[i + 2]);
            worst = light ? Math.max(worst, L) : Math.min(worst, L);
          }
      out.push({ viewport: `${w}x${h}`, mode, progress: p, element: q, worstContrast: +ratio(ink, worst).toFixed(2) });
    }
  }
  await page.close();
}
await browser.close();
mkdirSync('lab', { recursive: true });
writeFileSync(PATH === '/' ? 'lab/hero-contrast.json' : 'lab/hero-contrast-en.json', JSON.stringify(out, null, 2));
const byVp = {};
for (const r of out) { const k = `${r.viewport} ${r.mode}`; if (!byVp[k] || r.worstContrast < byVp[k].worstContrast) byVp[k] = r; }
console.table(Object.values(byVp));
const below = out.filter((r) => r.worstContrast < 4.5);
console.log(below.length ? `below 4.5:1 → ${JSON.stringify(below, null, 1)}` : 'all hero text >= 4.5:1 against the worst pixel under it');
