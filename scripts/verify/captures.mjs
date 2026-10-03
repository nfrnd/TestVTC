// Evidence screenshots for REVIEW.md, from the built site served locally.
//   scripts/serve-local.sh && node scripts/verify/captures.mjs [base]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const CHROME = process.env.SCROLLCRAFT_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = process.argv[2] || 'http://127.0.0.1:4321';
const OUT = 'docs/captures';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME });

async function shot(name, url, { width, height = 900, scrollTo = 0, full = false, ctx = {}, before } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, ...ctx });
  const page = await context.newPage();
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  if (full) {
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let t = 0; t < total; t += Math.round(height * 0.6)) {
      await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), t);
      await page.waitForTimeout(110);
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  }
  if (before) await before(page);
  if (scrollTo) await page.evaluate((f) => window.scrollTo({ top: innerHeight * f, behavior: 'instant' }), scrollTo);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  await context.close();
  console.log(name);
}

// Hero transition: start, middle, end of the pinned travel (0.6 viewport).
for (const [w, h, tag] of [[1440, 900, 'desktop'], [390, 844, 'mobile']]) {
  await shot(`hero-${tag}-1-debut`, '/', { width: w, height: h });
  await shot(`hero-${tag}-2-milieu`, '/', { width: w, height: h, scrollTo: tag === 'mobile' ? 0.22 : 0.3 });
  await shot(`hero-${tag}-3-fin`, '/', { width: w, height: h, scrollTo: tag === 'mobile' ? 0.45 : 0.6 });
}
// First screen at the four reference widths.
for (const w of [360, 390, 768, 1440]) await shot(`accueil-${w}`, '/', { width: w, height: w < 800 ? 780 : 900 });
// Full pages.
await shot('page-accueil-1440', '/', { width: 1440, full: true });
await shot('page-accueil-390', '/', { width: 390, height: 844, full: true });
await shot('page-tarifs-1440', '/tarifs/', { width: 1440, full: true });
await shot('page-contact-390', '/contact/', { width: 390, height: 844, full: true });
await shot('page-en-quote-1440', '/en/quote/', { width: 1440, full: true });
// Quote flow states.
await shot('devis-etape2-recap-390', '/devis/?prestation=transfert', {
  width: 390, height: 844, ctx: { isMobile: true, hasTouch: true },
  before: async (p) => {
    const d = new Date(Date.now() + 4 * 864e5).toISOString().slice(0, 10);
    await p.fill('input[name=departure]', 'Hôtel Martinez, Cannes');
    await p.fill('input[name=arrival]', 'Aéroport');
    await p.fill('input[name=date]', d);
    await p.fill('input[name=time]', '09:15');
    await p.click('[data-next]');
    await p.waitForTimeout(500);
  },
});
await shot('devis-erreurs-1440', '/devis/', { width: 1440, before: async (p) => { await p.fill('input[name=passengers]', ''); await p.click('[data-next]'); await p.waitForTimeout(300); } });
await shot('devis-echec-transport-1440', '/devis/', {
  width: 1440,
  before: async (p) => {
    await p.route('**/api/demandes', (r) => r.fulfill({ status: 502, contentType: 'application/json', body: '{"ok":false,"status":"failed"}' }));
    const d = new Date(Date.now() + 4 * 864e5).toISOString().slice(0, 10);
    await p.fill('input[name=departure]', 'Hôtel Martinez, Cannes');
    await p.fill('input[name=arrival]', 'Gare de Cannes');
    await p.fill('input[name=date]', d);
    await p.fill('input[name=time]', '14:30');
    await p.click('[data-next]');
    await p.fill('input[name=name]', 'Camille Test');
    await p.fill('input[name=email]', 'camille@example.com');
    await p.click('[data-submit]');
    await p.waitForSelector('[data-error-box]:not([hidden])');
  },
});
await shot('devis-envoye-simulation-1440', '/devis/', {
  width: 1440,
  before: async (p) => {
    const d = new Date(Date.now() + 4 * 864e5).toISOString().slice(0, 10);
    await p.fill('input[name=departure]', 'Hôtel Martinez, Cannes');
    await p.fill('input[name=arrival]', 'Gare de Cannes');
    await p.fill('input[name=date]', d);
    await p.fill('input[name=time]', '14:30');
    await p.click('[data-next]');
    await p.fill('input[name=name]', 'Camille Test');
    await p.fill('input[name=email]', 'camille@example.com');
    await p.click('[data-submit]');
    await p.waitForSelector('[data-done-box]:not([hidden])');
  },
});
await shot('services-selection-affaires-1440', '/', { width: 1440, before: async (p) => { await p.locator('label.option', { hasText: 'Déplacements' }).click(); await p.locator('#trajets').scrollIntoViewIfNeeded(); await p.evaluate(() => scrollBy(0, 260)); await p.waitForTimeout(800); } });
await shot('menu-mobile-ouvert-390', '/tarifs/', { width: 390, height: 844, before: async (p) => p.click('.menu summary') });
await shot('barre-action-mobile-390', '/', { width: 390, height: 844, scrollTo: 2.4 });
await shot('reduced-motion-accueil-1440', '/', { width: 1440, ctx: { reducedMotion: 'reduce' } });
await shot('sans-js-accueil-390', '/', { width: 390, height: 844, full: true, ctx: { javaScriptEnabled: false } });
await shot('mentions-legales-1440', '/mentions-legales/', { width: 1440, full: true });

// Open Graph image (1200x630) from the real hero.
{
  const context = await browser.newContext({ viewport: { width: 1200, height: 630 } });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '.site-header, .hero__pv, .hero__beat { display: none !important }' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'public/og-image.png' });
  await context.close();
  console.log('og-image');
}
await browser.close();
