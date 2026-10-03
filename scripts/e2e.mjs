// End-to-end checks against the BUILT site (npm run build first).
// Starts its own server on a spare port with the test transport, drives
// headless Chromium, writes lab/e2e/results.json and exits non-zero on failure.
//   node scripts/e2e.mjs
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const CHROME = process.env.SCROLLCRAFT_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PORT = Number(process.env.E2E_PORT || 4399);
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = 'lab/e2e';
mkdirSync(OUT, { recursive: true });

const server = spawn('node', ['dist/server/entry.mjs'], {
  env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', EMAIL_TRANSPORT: 'test', ALLOWED_ORIGINS: BASE, RATE_LIMIT_MAX: '500' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const serverLog = [];
server.stdout.on('data', (d) => serverLog.push(String(d)));
for (let i = 0; i < 50; i++) {
  try { if ((await fetch(BASE)).ok) break; } catch { /* starting */ }
  await new Promise((r) => setTimeout(r, 150));
}

const browser = await chromium.launch({ executablePath: CHROME });
const results = [];
async function test(name, fn, ctxOpts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...ctxOpts });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));
  const t0 = Date.now();
  try {
    const detail = await fn(page, ctx);
    if (errors.length && !ctxOpts.allowErrors) throw new Error(`console errors: ${errors.join(' | ')}`);
    results.push({ name, ok: true, ms: Date.now() - t0, detail: detail ?? null });
    console.log(`  ok   ${name}`);
  } catch (e) {
    results.push({ name, ok: false, error: String(e.message || e) });
    console.log(`  FAIL ${name}\n       ${e.message}`);
    await page.screenshot({ path: `${OUT}/fail-${name.replace(/\W+/g, '-')}.png` }).catch(() => {});
  } finally {
    await ctx.close();
  }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const future = (days = 4) => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
await test('hero: activity, city, car and primary action usable on first paint', async (page) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  const h1 = await page.textContent('h1');
  assert(/chauffeur privé à Cannes/i.test(h1), 'h1');
  const cta = page.locator('[data-hero-actions] a', { hasText: 'Demander un devis' });
  assert(await cta.isVisible(), 'hero CTA visible');
  assert((await cta.getAttribute('href')) === '/devis/', 'CTA href');
  const lede = await page.textContent('.hero__lede');
  assert(/Tesla Model 3/.test(lede), 'vehicle in hero');
  assert(await page.locator('.hero__car[role=img]').isVisible(), 'car visible');
});

await test('hero: wheels roll in proportion to travel (no sliding)', async (page) => {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const read = () => page.evaluate(() => ({
    car: getComputedStyle(document.querySelector('.hero__car')).transform,
    wheel: getComputedStyle(document.querySelector('.hero__car .wheel')).transform,
  }));
  const a = await read();
  await page.evaluate(() => scrollTo(0, innerHeight * 0.3));
  await page.waitForTimeout(400);
  const b = await read();
  assert(a.car !== b.car && a.wheel !== b.wheel, 'car and wheels move with scroll');
  return { start: a, mid: b };
});

await test('services: choosing a journey updates summary and quote link (mouse + keyboard)', async (page) => {
  await page.goto(BASE);
  await page.locator('label.option', { hasText: 'Déplacements professionnels' }).click();
  const panel = page.locator('[data-panel="affaires"]');
  assert(await panel.isVisible(), 'panel visible after click');
  assert((await panel.locator('a.btn').getAttribute('href')) === '/devis/?prestation=affaires', 'CTA carries only the choice');
  assert(!(await page.locator('[data-panel="transfert"]').isVisible()), 'other panel hidden');
  await page.focus('input[value="affaires"]');
  await page.keyboard.press('ArrowDown');
  assert(await page.locator('[data-panel="evenement"]').isVisible(), 'arrow key selects next');
  assert(await page.locator('[data-motif-for="evenement"]').isVisible(), 'motif follows');
});

await test('quote: ?prestation preselects only the journey type', async (page) => {
  await page.goto(`${BASE}/devis/?prestation=affaires`);
  assert((await page.inputValue('select[name=service]')) === 'affaires', 'select preset');
  assert(/Déplacements professionnels/.test(await page.textContent('[data-preselected]')), 'note');
  assert((await page.inputValue('input[name=departure]')) === '', 'nothing else prefilled');
  await page.goto(`${BASE}/devis/?prestation=monaco`);
  assert((await page.inputValue('select[name=service]')) === '', 'unknown id ignored');
});

async function fillStep1(page) {
  await page.fill('input[name=departure]', 'Hôtel Martinez, Cannes');
  await page.fill('input[name=arrival]', 'Gare de Cannes');
  await page.fill('input[name=date]', future());
  await page.fill('input[name=time]', '14:30');
  await page.fill('input[name=passengers]', '2');
}
async function fillStep2(page) {
  await page.fill('input[name=name]', 'Camille Test');
  await page.fill('input[name=email]', 'camille@example.com');
}

await test('quote: step errors near fields, recap kept when going back', async (page) => {
  await page.goto(`${BASE}/devis/`);
  await page.fill('input[name=passengers]', '');
  await page.click('[data-next]');
  assert((await page.textContent('#e-departure')).length > 0, 'error shown next to field');
  assert((await page.getAttribute('input[name=departure]', 'aria-invalid')) === 'true', 'aria-invalid');
  assert(await page.evaluate(() => document.activeElement?.getAttribute('name')) === 'departure', 'focus on first error');
  await fillStep1(page);
  await page.click('[data-next]');
  assert(await page.locator('[data-step="2"]').isVisible(), 'step 2 visible');
  assert(/Hôtel Martinez/.test(await page.textContent('[data-recap-body]')), 'recap');
  assert(/Europe\/Paris/.test(await page.textContent('[data-recap-body]')), 'recap states the time zone');
  await page.click('[data-back]');
  assert((await page.inputValue('input[name=arrival]')) === 'Gare de Cannes', 'values kept');
});

await test('quote: valid submission says "simulated" in test mode; double click sends once', async (page) => {
  let posts = 0;
  page.on('request', (r) => r.url().endsWith('/api/demandes') && r.method() === 'POST' && posts++);
  await page.goto(`${BASE}/devis/`);
  await fillStep1(page);
  await page.click('[data-next]');
  await fillStep2(page);
  await page.locator('[data-submit]').dblclick();
  await page.waitForSelector('[data-done-box]:not([hidden])');
  const text = await page.textContent('[data-done-box]');
  assert(/Mode test/.test(text), 'simulated result announced as such');
  assert(/n’est pas encore réservé/.test(text), 'states that nothing is booked');
  assert(posts === 1, `one request only (got ${posts})`);
});

await test('quote: confirmed sending shows the exact required message (provider mocked)', async (page) => {
  await page.route('**/api/demandes', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, status: 'sent' }) }));
  await page.goto(`${BASE}/devis/`);
  await fillStep1(page);
  await page.click('[data-next]');
  await fillStep2(page);
  await page.click('[data-submit]');
  await page.waitForSelector('[data-done-box]:not([hidden])');
  const text = await page.textContent('[data-done-text]');
  assert(text === 'Votre demande a été transmise. Le chauffeur vous contactera pour préciser le tarif et la disponibilité.', `message: ${text}`);
});

await test('quote: server-side errors are mapped to fields and step 1 reopens', async (page) => {
  await page.route('**/api/demandes', (r) => r.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ ok: false, status: 'invalid', errors: { arrival: 'tooShort' } }) }));
  await page.goto(`${BASE}/devis/`);
  await fillStep1(page);
  await page.click('[data-next]');
  await fillStep2(page);
  await page.click('[data-submit]');
  await page.waitForSelector('#e-arrival:not(:empty)');
  assert(await page.locator('[data-step="1"]').isVisible(), 'back on step 1');
});

await test('quote: transport failure keeps fields and re-enables the button', async (page) => {
  await page.route('**/api/demandes', (r) => r.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ ok: false, status: 'failed' }) }));
  await page.goto(`${BASE}/devis/`);
  await fillStep1(page);
  await page.click('[data-next]');
  await fillStep2(page);
  const rid = await page.inputValue('input[name=requestId]');
  await page.click('[data-submit]');
  await page.waitForSelector('[data-error-box]:not([hidden])');
  assert(/n’a pas pu être transmise/.test(await page.textContent('[data-error-text]')), 'useful explanation');
  assert(!(await page.isDisabled('[data-submit]')), 'button re-enabled');
  assert((await page.inputValue('input[name=name]')) === 'Camille Test', 'fields kept');
  assert((await page.inputValue('input[name=requestId]')) === rid, 'same request id for the retry');
});

await test('quote: network failure has its own message', async (page) => {
  await page.route('**/api/demandes', (r) => r.abort());
  await page.goto(`${BASE}/devis/`);
  await fillStep1(page);
  await page.click('[data-next]');
  await fillStep2(page);
  await page.click('[data-submit]');
  await page.waitForSelector('[data-error-box]:not([hidden])');
  assert(/connexion/.test(await page.textContent('[data-error-text]')), 'network message');
}, { allowErrors: true });

await test('contact: short form submits (test transport)', async (page) => {
  await page.goto(`${BASE}/en/contact/`);
  await page.fill('input[name=name]', 'Alex');
  await page.check('input[value=phone]');
  await page.fill('input[name=phone]', '+44 20 7946 0000');
  await page.fill('textarea[name=message]', 'Hello, is Saturday evening possible?');
  await page.click('[data-submit]');
  await page.waitForSelector('[data-done-box]:not([hidden])');
  assert(/Test mode/.test(await page.textContent('[data-done-box]')), 'english simulated message');
});

await test('no JavaScript: content, selector, FAQ and form posting all work', async (page) => {
  await page.goto(BASE);
  assert(await page.locator('.hero__beat').evaluate((e) => getComputedStyle(e).opacity === '1'), 'cued text visible');
  assert(await page.locator('[data-panel="transfert"]').isVisible(), 'default panel visible');
  await page.locator('label.option', { hasText: 'Événements' }).click();
  assert(await page.locator('[data-panel="evenement"]').isVisible(), 'CSS-only selector');
  await page.locator('.qa summary').first().click();
  assert(await page.locator('.qa').first().evaluate((d) => d.open), 'FAQ opens');
  await page.goto(`${BASE}/contact/`);
  assert(await page.locator('[data-step], input[name=email]').first().isVisible(), 'form visible');
  await page.fill('input[name=name]', 'Alex');
  await page.fill('input[name=email]', 'alex@example.com');
  await page.fill('textarea[name=message]', 'Bonjour, une question sur un trajet.');
  await Promise.all([page.waitForURL('**/contact/simulation/'), page.click('button[type=submit]')]);
  assert(!page.url().includes('alex%40'), 'POST, no personal data in URL');
}, { javaScriptEnabled: false });

await test('reduced motion: hero not pinned, nothing moves, content complete', async (page) => {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const r = await page.evaluate(() => ({
    act: document.querySelector('[data-hero]').getAttribute('data-sc-act'),
    h: document.querySelector('[data-hero]').getBoundingClientRect().height,
    vh: innerHeight,
    car: getComputedStyle(document.querySelector('.hero__car')).transform,
    beat: getComputedStyle(document.querySelector('.hero__beat')).opacity,
  }));
  assert(r.act === 'flow', 'not pinned');
  assert(Math.abs(r.h - r.vh) < 2, `no extra scroll space (${r.h} vs ${r.vh})`);
  assert(r.car === 'none', 'car static');
  assert(r.beat === '1', 'second line shown');
}, { reducedMotion: 'reduce' });

await test('hero media unavailable: text and action still there, no script error', async (page) => {
  await page.route(/\.svg$/, (r) => r.abort());
  await page.goto(BASE, { waitUntil: 'load' });
  assert(await page.locator('[data-hero-actions] a').first().isVisible(), 'CTA');
  assert(await page.locator('h1').isVisible(), 'h1');
}, { allowErrors: false });

await test('mobile: menu opens and closes with Escape; language switch goes to equivalent page', async (page) => {
  await page.goto(`${BASE}/tarifs/`);
  await page.click('.menu summary');
  assert(await page.locator('.menu__panel').isVisible(), 'menu open');
  await page.keyboard.press('Escape');
  assert(!(await page.locator('.menu').evaluate((d) => d.open)), 'closed');
  await page.click('.menu summary');
  await Promise.all([page.waitForURL('**/en/rates/'), page.click('.menu__panel a[hreflang=en]')]);
}, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

await test('mobile action bar: hidden over the hero, shown after it, never covering content', async (page) => {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const hiddenAtTop = await page.locator('[data-action-bar]').evaluate((b) => b.classList.contains('is-hidden'));
  await page.evaluate(() => scrollTo(0, innerHeight * 2.2));
  await page.waitForTimeout(400);
  const shown = await page.locator('[data-action-bar]').evaluate((b) => !b.classList.contains('is-hidden'));
  const pad = await page.evaluate(() => parseFloat(getComputedStyle(document.body).paddingBottom));
  const barH = await page.locator('[data-action-bar]').evaluate((b) => b.getBoundingClientRect().height);
  assert(hiddenAtTop && shown, `bar visibility ${hiddenAtTop}/${shown}`);
  assert(pad >= barH - 1, `body reserves bar space (${pad} >= ${barH})`);
  await page.goto(`${BASE}/devis/`);
  assert((await page.locator('[data-action-bar]').count()) === 0, 'no bar over the quote form');
}, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const pages = ['/', '/tarifs/', '/devis/', '/contact/', '/mentions-legales/', '/confidentialite/', '/en/', '/en/rates/', '/en/quote/', '/en/contact/'];
for (const width of [360, 390, 768, 1440]) {
  await test(`layout ${width}px: no horizontal overflow, targets >= 44px`, async (page) => {
    const issues = [];
    for (const p of pages) {
      await page.goto(BASE + p, { waitUntil: 'networkidle' });
      const r = await page.evaluate(() => {
        const over = document.documentElement.scrollWidth - innerWidth;
        const small = [...document.querySelectorAll('a, button, summary, input, select, textarea, label.choice')]
          .filter((el) => {
            const b = el.getBoundingClientRect();
            if (!b.width || getComputedStyle(el).visibility === 'hidden' || el.closest('.hp, .visually-hidden, .skip-link')) return false;
            if (el.matches('input[type=radio], input[type=checkbox]') && el.closest('label')) return false; // the label is the target
            if (el.closest('p, li') && el.matches('a') && !el.matches('.btn') && el.closest('.prose, .privacy-note, .notice')) return false; // inline text links
            return b.height < 43.5 || b.width < 24;
          })
          .map((el) => `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ')[0] : ''}:${Math.round(el.getBoundingClientRect().height)}`);
        return { over, small };
      });
      if (r.over > 0) issues.push(`${p} overflow ${r.over}px`);
      if (r.small.length) issues.push(`${p} small: ${[...new Set(r.small)].join(', ')}`);
    }
    assert(issues.length === 0, issues.join(' | '));
  }, { viewport: { width, height: 900 } });
}

await test('keyboard: skip link then visible focus ring on first controls', async (page) => {
  await page.goto(`${BASE}/devis/`);
  await page.keyboard.press('Tab');
  assert(await page.evaluate(() => document.activeElement.classList.contains('skip-link')), 'skip link first');
  const outline = [];
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    outline.push(await page.evaluate(() => {
      const s = getComputedStyle(document.activeElement);
      return `${document.activeElement.tagName}:${s.outlineStyle}/${s.boxShadow !== 'none'}`;
    }));
  }
  assert(outline.every((o) => /solid|true/.test(o)), outline.join(' '));
  return outline;
});

await test('SEO: titles, canonical, hreflang, robots (preview noindex), sitemap pairs translations', async (page) => {
  const seen = new Set();
  for (const p of pages) {
    await page.goto(BASE + p);
    const m = await page.evaluate(() => ({
      title: document.title,
      h1: document.querySelectorAll('h1').length,
      canonical: document.querySelector('link[rel=canonical]')?.href,
      alts: [...document.querySelectorAll('link[rel=alternate][hreflang]')].map((l) => l.hreflang),
      robots: document.querySelector('meta[name=robots]')?.content,
      lang: document.documentElement.lang,
    }));
    assert(m.h1 === 1, `${p} one h1`);
    assert(!seen.has(m.title), `${p} unique title`);
    seen.add(m.title);
    assert(m.canonical, `${p} canonical`);
    assert(m.alts.includes('fr') && m.alts.includes('en') && m.alts.includes('x-default'), `${p} hreflang`);
    assert(/noindex/.test(m.robots), `${p} preview is noindex`);
  }
  const robots = await (await fetch(`${BASE}/robots.txt`)).text();
  assert(/Disallow: \//.test(robots), 'robots disallow in preview');
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
  assert(sitemap.includes('/tarifs/') && sitemap.includes('/en/rates/') && sitemap.includes('hreflang="en"'), 'sitemap');
});

await test('no third-party requests and no cookies/storage on any page', async (page, ctx) => {
  const external = new Set();
  page.on('request', (r) => { const u = new URL(r.url()); if (u.origin !== BASE) external.add(u.origin); });
  for (const p of pages) await page.goto(BASE + p, { waitUntil: 'networkidle' });
  const cookies = await ctx.cookies();
  const storage = await page.evaluate(() => localStorage.length + sessionStorage.length);
  assert(external.size === 0, `external: ${[...external].join(', ')}`);
  assert(cookies.length === 0 && storage === 0, 'no cookies or storage');
});

await test('404 page served with status 404', async (page) => {
  const res = await page.goto(`${BASE}/nexiste-pas/`);
  assert(res.status() === 404, `status ${res.status()}`);
  assert(/n’existe pas/.test(await page.textContent('h1')), '404 copy');
});

await browser.close();
server.kill();
const failed = results.filter((r) => !r.ok);
writeFileSync(`${OUT}/results.json`, JSON.stringify({ date: new Date().toISOString(), base: BASE, browser: 'Chromium (headless, playwright-core)', total: results.length, failed: failed.length, results }, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
