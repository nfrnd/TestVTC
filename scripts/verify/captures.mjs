// Evidence screenshots for REVIEW.md, from the built demo site served locally.
//   npm run build && npm start   (other terminal)
//   node scripts/verify/captures.mjs [base]
// Writes PNG files to docs/captures/ (converted to JPEG for the repository) and
// regenerates public/og-image.png from the real hero.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const CHROME = process.env.SCROLLCRAFT_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = process.argv[2] || 'http://127.0.0.1:4321';
const OUT = 'docs/captures';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME });

async function shot(name, url, { width, height = 900, full = false, ctx = {}, before, heroProgress } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, ...ctx });
  const page = await context.newPage();
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  if (full) {
    // Walk the page once so lazy images are loaded before the full-page capture.
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let t = 0; t < total; t += Math.round(height * 0.6)) {
      await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), t);
      await page.waitForTimeout(110);
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  }
  if (heroProgress !== undefined) {
    await page.evaluate((f) => { const hero = document.querySelector('[data-hero]'); scrollTo({ top: Math.max(0, hero.offsetHeight - innerHeight) * f, behavior: 'instant' }); }, heroProgress);
  }
  if (before) await before(page);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  await context.close();
  console.log(name);
}
const scrollToSel = (sel, offset = 0) => async (p) => {
  await p.evaluate(([s, o]) => { const el = document.querySelector(s); scrollTo({ top: el.getBoundingClientRect().top + scrollY - o, behavior: 'instant' }); }, [sel, offset]);
  await p.waitForTimeout(500);
};
async function fillExampleAndGoToStep2(p) {
  await p.click('[data-example]');
  await p.waitForTimeout(200);
  await p.click('[data-next]');
  await p.waitForTimeout(300);
}
const mobile = { isMobile: true, hasTouch: true };

// --- The six requested captures --------------------------------------------
await shot('01-accueil-desktop-1440', '/', { width: 1440 });
await shot('02-accueil-mobile-390', '/', { width: 390, height: 844, ctx: mobile });
await shot('03-section-chauffeur-1440', '/', { width: 1440, before: scrollToSel('#chauffeur', 40) });
await shot('04-tarifs-1440', '/tarifs/', { width: 1440, full: true });
await shot('05a-devis-exemple-rempli-etape1-1440', '/devis/', {
  width: 1440, height: 1500,
  before: async (p) => {
    await p.click('[data-example]');
    await scrollToSel('form[data-form]', 120)(p);
  },
});
await shot('05b-devis-exemple-rempli-etape2-1440', '/devis/', {
  width: 1440, height: 1100,
  before: async (p) => {
    await fillExampleAndGoToStep2(p);
    await scrollToSel('form[data-form]', 120)(p);
  },
});
await shot('06-devis-resultat-simule-1440', '/devis/', {
  width: 1440, height: 1100,
  before: async (p) => {
    await fillExampleAndGoToStep2(p);
    await p.click('[data-submit]');
    await p.waitForSelector('[data-done-box]:not([hidden])');
    await scrollToSel('[data-done-box]', 160)(p);
  },
});

// --- Failure, contact simulation --------------------------------------------
await shot('07-devis-echec-utile-1440', '/devis/', {
  width: 1440, height: 1100,
  before: async (p) => {
    await p.route('**/api/demandes', (r) => r.fulfill({ status: 502, contentType: 'application/json', body: '{"ok":false,"status":"failed"}' }));
    await fillExampleAndGoToStep2(p);
    await p.click('[data-submit]');
    await p.waitForSelector('[data-error-box]:not([hidden])');
    await scrollToSel('[data-error-box]', 300)(p);
  },
});
await shot('08-devis-erreurs-champs-390', '/devis/', { width: 390, height: 844, ctx: mobile, before: async (p) => { await p.click('[data-next]'); await p.waitForTimeout(300); } });
await shot('09-contact-simulation-appel-390', '/contact/', { width: 390, height: 844, ctx: mobile, before: async (p) => { await p.locator('[data-sim="call"]').first().click(); await p.waitForSelector('#sim-call[open]'); } });
await shot('10-contact-simulation-whatsapp-1440', '/contact/', { width: 1440, before: async (p) => { await p.locator('[data-sim="whatsapp"]').first().click(); await p.waitForSelector('#sim-whatsapp[open]'); } });
await shot('11-contact-simulation-email-1440', '/contact/', { width: 1440, before: async (p) => { await p.locator('[data-sim="email"]').first().click(); await p.waitForSelector('#sim-email[open]'); } });

// --- Hero: start, middle, end of the movement (layered screens) ---------------
for (const [w, h] of [[1100, 720], [1440, 900], [2560, 1080]]) {
  for (const [tag, f] of [['1-debut', 0], ['2-milieu', 0.5], ['3-fin', 1]]) await shot(`hero-${w}x${h}-${tag}`, '/', { width: w, height: h, heroProgress: f });
}
// --- Hero recomposed by a resize, without reload (fix after the independent review) ---
for (const [from, to, name] of [[[1440, 900], [390, 844], 'hero-redimensionne-1440-vers-390'], [[390, 844], [1440, 900], 'hero-redimensionne-390-vers-1440']]) {
  const context = await browser.newContext({ viewport: { width: from[0], height: from[1] } });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.setViewportSize({ width: to[0], height: to[1] });
  await page.waitForTimeout(900);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  await context.close();
  console.log(name);
}
// --- First screen at the four reference widths ----------------------------------
for (const w of [360, 390, 768, 1440]) await shot(`largeur-${w}`, '/', { width: w, height: w < 800 ? 780 : 900, ctx: w < 800 ? mobile : {} });

// --- Full pages ------------------------------------------------------------------
// The home page is captured with reduced motion: a full-page screenshot of the
// pinned hero would show its scroll room as an empty band nobody sees on screen.
await shot('page-accueil-1440-mouvement-reduit', '/', { width: 1440, full: true, ctx: { reducedMotion: 'reduce' } });
await shot('page-accueil-390', '/', { width: 390, height: 844, full: true, ctx: mobile });
await shot('page-contact-390', '/contact/', { width: 390, height: 844, full: true, ctx: mobile });
await shot('page-en-home-1440', '/en/', { width: 1440 });
await shot('page-en-rates-390', '/en/rates/', { width: 390, height: 844, full: true, ctx: mobile });
await shot('page-a-propos-demo-1440', '/mentions-legales/', { width: 1440, full: true });

// --- Motion off, no JavaScript ---------------------------------------------------
await shot('mouvement-reduit-accueil-1440', '/', { width: 1440, ctx: { reducedMotion: 'reduce' } });
await shot('sans-js-accueil-390', '/', { width: 390, height: 844, full: true, ctx: { javaScriptEnabled: false } });
await shot('sans-js-simulation-appel-390', '/contact/', { width: 390, height: 844, ctx: { javaScriptEnabled: false }, before: async (p) => { await p.locator('[data-sim="call"]').first().click(); await p.waitForTimeout(300); } });
{
  // No-JS quote: real POST to /api/demandes, the server answers with an HTML summary page.
  // Reduced motion only to switch off smooth scrolling, which keeps the form moving
  // while Playwright fills it; the captured result page is unaffected.
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false, reducedMotion: 'reduce' });
  const p = await context.newPage();
  await p.goto(`${BASE}/devis/`);
  const d = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  await p.selectOption('select[name=service]', 'airport');
  await p.fill('input[name=departure]', 'Cannes-centre');
  await p.fill('input[name=arrival]', 'Aéroport Nice Côte d’Azur');
  await p.fill('input[name=date]', d);
  await p.fill('input[name=time]', '10:30');
  await p.fill('input[name=name]', 'Camille Martin');
  await p.check('input[name=contactMethod][value=email]');
  await p.fill('input[name=email]', 'camille.martin@example.com');
  await Promise.all([p.waitForURL('**/api/demandes'), p.click('button[type=submit]')]);
  await p.screenshot({ path: `${OUT}/sans-js-devis-resultat-390.png`, fullPage: true });
  await context.close();
  console.log('sans-js-devis-resultat-390');
}
await shot('menu-mobile-ouvert-390', '/tarifs/', { width: 390, height: 844, ctx: mobile, before: async (p) => p.click('.menu summary') });
await shot('barre-action-mobile-390', '/', { width: 390, height: 844, ctx: mobile, before: scrollToSel('#tesla', 0) });

// --- Open Graph image (1200x630) from the real hero --------------------------------
{
  const context = await browser.newContext({ viewport: { width: 1200, height: 630 } });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '.site-header, .hero__pv { display: none !important }' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'public/og-image.png' });
  await context.close();
  console.log('og-image');
}
await browser.close();
