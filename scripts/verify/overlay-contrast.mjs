// Pixel contrast for text that sits on translucent or gradient grounds outside
// the hero (axe-core reports these as "incomplete"): the header pill while it
// floats over light and dark sections, and the dark services panel. Same method
// as hero-contrast.mjs: text made transparent, worst pixel under each text line.
//   node scripts/verify/overlay-contrast.mjs [baseUrl]
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const CHROME = process.env.SCROLLCRAFT_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = process.argv[2] || 'http://127.0.0.1:4321';
const lum = (r, g, b) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const HEADER = ['.brand__name', '.nav > a', '.lang', '.menu summary', '.demo-strip'];
const PANEL = ['[data-panel="airport"] > .h-md', '[data-panel="airport"] > .panel__summary', '[data-panel="airport"] .panel__fares li > span', '[data-panel="airport"] .panel__fares .nums', '.board__note'];
const cases = [
  // [label, width, height, scroll target selector (top of viewport), selectors]
  ['header over services (light)', 1440, 900, '#trajets', HEADER],
  ['header over Tesla (light)', 1440, 900, '#tesla', HEADER],
  ['header over driver (dark)', 1440, 900, '#chauffeur', HEADER],
  ['header over rates page', 1440, 900, null, HEADER, '/tarifs/'],
  ['header 390 over services', 390, 844, '#trajets', HEADER],
  ['header 390 over Tesla', 390, 844, '#tesla', HEADER],
  ['services panel 1440', 1440, 900, '[data-panel="airport"]', PANEL],
  ['services panel 390', 390, 844, '[data-panel="airport"]', PANEL],
];
const browser = await chromium.launch({ executablePath: CHROME });
const out = [];
for (const [label, w, h, target, sels, url = '/'] of cases) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  if (target) await page.evaluate((s) => { const el = document.querySelector(s); scrollTo({ top: el.getBoundingClientRect().top + scrollY - 60, behavior: 'instant' }); }, target);
  else await page.evaluate(() => scrollTo({ top: innerHeight * 0.8, behavior: 'instant' }));
  await page.waitForTimeout(600);
  const items = await page.evaluate((list) => list.flatMap((q) => [...document.querySelectorAll(q)].map((e, i) => {
    const cs = getComputedStyle(e); const b = e.getBoundingClientRect();
    // Visible text nodes only: screen-reader-only text is clipped but still has line boxes.
    const walker = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    const boxes = [];
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      if (!t.textContent.trim() || t.parentElement.closest('.visually-hidden')) continue;
      const range = document.createRange(); range.selectNodeContents(t); boxes.push(...range.getClientRects());
    }
    const rects = boxes.filter((r) => r.width > 1 && r.height > 1 && r.bottom > 0 && r.top < innerHeight).map((r) => [r.x, r.y, r.width, r.height]);
    return { q: i ? `${q} #${i + 1}` : q, c: cs.color, rects, visible: cs.display !== 'none' && cs.visibility !== 'hidden' && b.width > 0 };
  })), sels);
  await page.addStyleTag({ content: `${sels.map((s) => `${s}, ${s} *`).join(', ')} { color: transparent !important; text-shadow: none !important; transition: none !important; } .menu summary svg { visibility: hidden !important }` });
  await page.waitForTimeout(80);
  const png = PNG.sync.read(await page.screenshot());
  for (const { q, c, rects, visible } of items) {
    if (!visible || !rects.length) continue;
    const [r, g, bl] = c.match(/[\d.]+/g).map(Number);
    const ink = lum(r, g, bl); const light = ink > 0.18;
    let worst = light ? 0 : 1;
    for (const b of rects) for (let y = Math.max(0, Math.floor(b[1])); y < Math.min(png.height, b[1] + b[3]); y++) for (let x = Math.max(0, Math.floor(b[0])); x < Math.min(png.width, b[0] + b[2]); x++) {
      const i = (png.width * y + x) * 4; const L = lum(png.data[i], png.data[i + 1], png.data[i + 2]);
      worst = light ? Math.max(worst, L) : Math.min(worst, L);
    }
    out.push({ case: label, element: q, worstContrast: +ratio(ink, worst).toFixed(2) });
  }
  await page.close();
}
await browser.close();
mkdirSync('lab', { recursive: true });
writeFileSync('lab/overlay-contrast.json', JSON.stringify(out, null, 2));
const byCase = {};
for (const r of out) if (!byCase[r.case] || r.worstContrast < byCase[r.case].worstContrast) byCase[r.case] = r;
console.table(Object.values(byCase));
const below = out.filter((r) => r.worstContrast < 4.5);
console.log(below.length ? `below 4.5:1: ${below.map((r) => `${r.case} / ${r.element} ${r.worstContrast}`).join('; ')}` : 'all >= 4.5:1');
