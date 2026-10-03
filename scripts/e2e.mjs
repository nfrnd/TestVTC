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
const CAR = { left: 542 / 1672, right: 1576 / 1672, top: 340 / 941, bottom: 850 / 941 }; // measured in hero-car-alpha.png

await test('hero: activity, city, vehicle and primary action usable on first paint', async (page) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  assert(/chauffeur privé à Cannes/i.test(await page.textContent('h1')), 'h1');
  const cta = page.locator('[data-hero-actions] a', { hasText: 'Demander un devis' });
  assert(await cta.isVisible(), 'hero CTA visible');
  assert((await cta.getAttribute('href')) === '/devis/', 'CTA href');
  assert(/Tesla Model 3/.test(await page.textContent('.hero__lede')), 'vehicle in hero');
  assert(await page.locator('.demo-strip').isVisible(), 'demo label visible');
});

for (const [w, h] of [[1100, 720], [1440, 900], [1920, 1080], [2560, 1080]]) {
  await test(`hero ${w}x${h}: one composition loaded, car whole at start and end of the movement`, async (page) => {
    const imgs = [];
    page.on('response', (r) => /hero-(background|car-alpha|desktop|mobile)/.test(r.url()) && imgs.push(r.url().split('/').pop()));
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const names = imgs.map((u) => u.split('.')[0]);
    assert(names.some((n) => n.startsWith('hero-background')) && names.some((n) => n.startsWith('hero-car-alpha')), `layers loaded: ${names}`);
    assert(!names.some((n) => n.startsWith('hero-desktop') || n.startsWith('hero-mobile')), `no second option loaded: ${names}`);
    const out = [];
    for (const f of [0, 0.4]) {
      await page.evaluate((v) => scrollTo(0, innerHeight * v), f);
      await page.waitForTimeout(350);
      const r = await page.evaluate((car) => {
        const b = document.querySelector('.hero__layer--car img').getBoundingClientRect();
        return { l: b.left + b.width * car.left, r: b.left + b.width * car.right, b: b.top + b.height * car.bottom, vw: innerWidth };
      }, CAR);
      assert(r.l >= 0 && r.r <= r.vw + 0.5, `car inside horizontally at ${f}: ${Math.round(r.l)}..${Math.round(r.r)} / ${r.vw}`);
      out.push(r);
    }
    return out;
  }, { viewport: { width: w, height: h } });
}

for (const [w, h, expect] of [[390, 844, 'hero-mobile'], [360, 640, 'hero-mobile'], [768, 1024, 'hero-desktop']]) {
  await test(`hero ${w}x${h}: stacked, single photo (${expect}), car not cropped`, async (page) => {
    const imgs = [];
    page.on('response', (r) => /hero-/.test(r.url()) && imgs.push(r.url().split('/').pop()));
    await page.goto(BASE, { waitUntil: 'networkidle' });
    assert(imgs.length === 1 && imgs[0].startsWith(expect), `loaded: ${imgs}`);
    const r = await page.evaluate(() => {
      const img = document.querySelector('.hero__photo img');
      const b = img.getBoundingClientRect();
      return { w: b.width, vw: innerWidth, act: document.querySelector('[data-hero]').getAttribute('data-sc-act') };
    });
    assert(r.act === 'flow', 'not pinned on small screens');
    assert(Math.abs(r.w - r.vw) < 1, 'photo full width, no side crop');
  }, { viewport: { width: w, height: h } });
}

await test('services: choosing a journey updates summary, prices and quote link (mouse + keyboard)', async (page) => {
  await page.goto(BASE);
  await page.locator('label.option', { hasText: 'Professionnels' }).click();
  const panel = page.locator('[data-panel="business"]');
  assert(await panel.isVisible(), 'panel visible after click');
  assert((await panel.locator('a.btn').getAttribute('href')) === '/devis/?prestation=business', 'CTA carries only the choice');
  await page.focus('input[value="business"]');
  await page.keyboard.press('ArrowDown');
  assert(await page.locator('[data-panel="hourly"]').isVisible(), 'arrow key selects next');
  assert(/80/.test(await page.locator('[data-panel="hourly"]').textContent()), 'hourly price shown');
});

await test('prices are identical on every page (content file is the only source)', async (page) => {
  const norm = (s) => s.replace(/[  ]/g, ' ');
  const expected = ['95 €', '55 €', '100 €', '45 €', '170 €', '80 €', '240 €'];
  for (const p of ['/', '/tarifs/', '/en/', '/en/rates/']) {
    await page.goto(BASE + p);
    const text = norm(await page.textContent('main'));
    for (const e of expected) assert(text.includes(p.startsWith('/en') ? e.replace(/(\d+) €/, '€$1') : e) || text.includes(e), `${p} missing ${e}`);
  }
  await page.goto(BASE + '/');
  const faq = norm(await page.textContent('.faq'));
  assert(faq.includes('80 €') && faq.includes('20 %') && faq.includes('45 minutes'), 'FAQ uses the same figures');
});

await test('quote: ?prestation & ?trajet preselect the service and places only', async (page) => {
  await page.goto(`${BASE}/devis/?prestation=airport&trajet=cannes-nice-airport`);
  assert((await page.inputValue('select[name=service]')) === 'airport', 'select preset');
  assert((await page.inputValue('input[name=departure]')) === 'Cannes-centre', 'departure from route');
  assert((await page.inputValue('input[name=name]')) === '', 'nothing personal prefilled');
  await page.goto(`${BASE}/devis/?prestation=monaco`);
  assert((await page.inputValue('select[name=service]')) === '', 'unknown id ignored');
});

async function fillStep1(page) {
  await page.selectOption('select[name=service]', 'airport');
  await page.fill('input[name=departure]', 'Cannes-centre');
  await page.fill('input[name=arrival]', 'Aéroport Nice Côte d’Azur');
  await page.fill('input[name=date]', future());
  await page.fill('input[name=time]', '14:30');
}
async function fillStep2(page) {
  await page.fill('input[name=name]', 'Camille Test');
  await page.check('input[name=contactMethod][value=email]');
  await page.fill('input[name=email]', 'camille@example.com');
}

await test('quote: field errors, conditional fields, recap kept when going back', async (page) => {
  await page.goto(`${BASE}/devis/`);
  await page.click('[data-next]');
  assert((await page.textContent('#e-departure')) === 'Indiquez votre lieu de départ.', 'scenario error message');
  assert(await page.evaluate(() => document.activeElement?.getAttribute('name')) === 'departure', 'focus on first error');
  assert(!(await page.locator('[data-when="travelref"]').isVisible()), 'flight field hidden until relevant');
  await fillStep1(page);
  assert(await page.locator('[data-when="travelref"]').isVisible(), 'flight field for airport');
  await page.check('input[name=tripType][value=return]');
  assert(await page.locator('[data-when="return"]').isVisible(), 'return fields');
  await page.check('input[name=tripType][value=oneway]');
  await page.selectOption('select[name=service]', 'hourly');
  assert(await page.locator('[data-when="hourly"]').isVisible() && !(await page.locator('input[name=arrival]').isVisible()), 'hourly fields swap');
  await page.selectOption('select[name=service]', 'airport');
  await page.click('[data-next]');
  assert(await page.locator('[data-step="2"]').isVisible(), 'step 2 visible');
  assert(/Europe\/Paris/.test(await page.textContent('[data-recap-body]')), 'recap states the time zone');
  await page.check('input[name=contactMethod][value=whatsapp]');
  assert(await page.locator('input[name=phone]').isVisible() && !(await page.locator('input[name=email]').isVisible()), 'only the chosen channel');
  await page.click('[data-back]');
  assert((await page.inputValue('input[name=arrival]')) === 'Aéroport Nice Côte d’Azur', 'values kept');
});

await test('quote: fictional example + simulated result with summary; double click sends once', async (page) => {
  let posts = 0;
  page.on('request', (r) => r.url().endsWith('/api/demandes') && r.method() === 'POST' && posts++);
  await page.goto(`${BASE}/devis/`);
  await page.click('[data-example]');
  const expectedDate = await page.evaluate(() => {
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const d = new Date(`${p}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 7); return d.toISOString().slice(0, 10);
  });
  assert((await page.inputValue('input[name=date]')) === expectedDate && (await page.inputValue('input[name=time]')) === '10:30', 'example date = Paris today + 7, 10:30');
  await page.click('[data-next]');
  assert((await page.textContent('[data-submit]')).trim() === 'Simuler ma demande de devis', 'submit label');
  await page.locator('[data-submit]').dblclick();
  await page.waitForSelector('[data-done-box]:not([hidden])');
  const text = (await page.textContent('[data-done-box]')).replace(/[  ]/g, ' ');
  assert(text.includes('Simulation réussie. Aucun message n’a été envoyé et aucun trajet n’est réservé.'), 'exact simulation message');
  assert(/DEMO-[A-Z0-9]{8}/.test(text) && text.includes('95 €') && text.includes('Repère tarifaire de démonstration'), 'reference + fare guide');
  assert(posts === 1, `one request only (got ${posts})`);
  await page.click('[data-edit]');
  assert((await page.inputValue('input[name=departure]')) === 'Cannes-centre', 'edit keeps values');
});

await test('quote: server-side errors mapped to fields, step 1 reopens', async (page) => {
  await page.route('**/api/demandes', (r) => r.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ ok: false, status: 'invalid', errors: { arrival: 'tooShort' } }) }));
  await page.goto(`${BASE}/devis/`);
  await fillStep1(page);
  await page.click('[data-next]');
  await fillStep2(page);
  await page.click('[data-submit]');
  await page.waitForSelector('#e-arrival:not(:empty)');
  assert(await page.locator('[data-step="1"]').isVisible(), 'back on step 1');
});

await test('quote: simulation failure keeps fields and re-enables the button', async (page) => {
  await page.route('**/api/demandes', (r) => r.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ ok: false, status: 'failed' }) }));
  await page.goto(`${BASE}/devis/`);
  await fillStep1(page);
  await page.click('[data-next]');
  await fillStep2(page);
  const rid = await page.inputValue('input[name=requestId]');
  await page.click('[data-submit]');
  await page.waitForSelector('[data-error-box]:not([hidden])');
  assert(/simulation n’a pas abouti/.test(await page.textContent('[data-error-text]')), 'useful explanation');
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

await test('contact: simulated call, WhatsApp and email dialogs; no outbound link anywhere', async (page) => {
  for (const p of ['/', '/tarifs/', '/devis/', '/contact/', '/mentions-legales/', '/confidentialite/', '/en/', '/en/contact/']) {
    const html = await (await fetch(BASE + p)).text();
    assert(!/href="(tel:|mailto:|https:\/\/wa\.me)/.test(html), `${p} contains an outbound contact link`);
  }
  await page.goto(`${BASE}/contact/`);
  for (const kind of ['call', 'whatsapp', 'email']) {
    await page.locator(`.blocks a[data-sim="${kind}"]`).click();
    const dialog = page.locator(`#sim-${kind}`);
    assert(await dialog.isVisible(), `${kind} dialog open`);
    await page.keyboard.press('Escape');
    assert(!(await dialog.isVisible()), `${kind} dialog closes with Escape`);
  }
  await page.fill('input[name=name]', 'Alex');
  await page.check('input[name=contactMethod][value=email]');
  await page.fill('input[name=email]', 'alex@example.com');
  await page.fill('textarea[name=message]', 'Bonjour, une question sur un trajet.');
  await page.click('[data-submit]');
  await page.waitForSelector('[data-done-box]:not([hidden])');
  assert(/Message simulé/.test(await page.textContent('[data-done-box]')), 'simulated contact message');
});

await test('no JavaScript: content, selector, dialogs, FAQ and a quote posted to a summary page', async (page) => {
  await page.goto(BASE);
  assert(await page.locator('[data-panel="airport"]').isVisible(), 'default panel visible');
  await page.locator('label.option', { hasText: 'Mise à disposition' }).click();
  assert(await page.locator('[data-panel="hourly"]').isVisible(), 'CSS-only selector');
  await page.locator('.qa summary').first().click();
  assert(await page.locator('.qa').first().evaluate((d) => d.open), 'FAQ opens');
  await page.locator('.hero a[data-sim="call"]').click();
  assert(await page.locator('#sim-call').isVisible(), 'call simulation shown via :target');
  await page.goto(`${BASE}/devis/`);
  await page.selectOption('select[name=service]', 'airport');
  await page.fill('input[name=departure]', 'Cannes-centre');
  await page.fill('input[name=arrival]', 'Gare d’Antibes');
  await page.fill('input[name=date]', future());
  await page.fill('input[name=time]', '09:00');
  await page.fill('input[name=name]', 'Alex');
  await page.check('input[name=contactMethod][value=email]');
  await page.fill('input[name=email]', 'alex@example.com');
  await Promise.all([page.waitForNavigation(), page.click('button[type=submit]')]);
  const html = await page.content();
  assert(page.url().endsWith('/api/demandes'), 'POST to the endpoint, no data in the URL');
  assert(/Simulation terminée/.test(html) && /Gare d’Antibes/.test(html), 'summary page');
}, { javaScriptEnabled: false });

await test('reduced motion: hero not pinned, layers static, content complete', async (page) => {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const r = await page.evaluate(() => ({
    act: document.querySelector('[data-hero]').getAttribute('data-sc-act'),
    h: document.querySelector('[data-hero]').getBoundingClientRect().height,
    vh: innerHeight,
    car: getComputedStyle(document.querySelector('.hero__layer--car')).transform,
  }));
  assert(r.act === 'flow', 'not pinned');
  assert(Math.abs(r.h - r.vh) < 2, `no extra scroll space (${r.h} vs ${r.vh})`);
  assert(r.car === 'none', 'car static');
}, { reducedMotion: 'reduce' });

await test('hero media unavailable: text and action still there, no script error', async (page) => {
  await page.route(/\.webp$/, (r) => r.abort());
  await page.goto(BASE, { waitUntil: 'load' });
  assert(await page.locator('[data-hero-actions] a').first().isVisible(), 'CTA');
  assert(await page.locator('h1').isVisible(), 'h1');
});

await test('mobile: menu opens and closes with Escape; language switch goes to equivalent page', async (page) => {
  await page.goto(`${BASE}/tarifs/`);
  await page.click('.menu summary');
  assert(await page.locator('.menu__panel').isVisible(), 'menu open');
  assert((await page.getAttribute('.menu summary', 'aria-label')) === 'Fermer le menu', 'accessible name follows state');
  await page.keyboard.press('Escape');
  assert(!(await page.locator('.menu').evaluate((d) => d.open)), 'closed');
  await page.click('.menu summary');
  await Promise.all([page.waitForURL('**/en/rates/'), page.click('.menu__panel a[hreflang=en]')]);
}, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

await test('mobile action bar: Appeler (simulated) + Devis, hidden over the hero, never covering content', async (page) => {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const hiddenAtTop = await page.locator('[data-action-bar]').evaluate((b) => b.classList.contains('is-hidden'));
  await page.evaluate(() => scrollTo(0, innerHeight * 2.2));
  await page.waitForTimeout(400);
  const shown = await page.locator('[data-action-bar]').evaluate((b) => !b.classList.contains('is-hidden'));
  const pad = await page.evaluate(() => parseFloat(getComputedStyle(document.body).paddingBottom));
  const barH = await page.locator('[data-action-bar]').evaluate((b) => b.getBoundingClientRect().height);
  assert(hiddenAtTop && shown, `bar visibility ${hiddenAtTop}/${shown}`);
  assert(pad >= barH - 1, `body reserves bar space (${pad} >= ${barH})`);
  await page.locator('[data-action-bar] a[data-sim="call"]').click();
  assert(await page.locator('#sim-call').isVisible(), 'call is simulated');
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

await test('SEO: titles, canonical, hreflang, robots (demo noindex, no LocalBusiness), sitemap pairs translations', async (page) => {
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
      jsonld: Boolean(document.querySelector('script[type="application/ld+json"]')),
    }));
    assert(m.h1 === 1, `${p} one h1`);
    assert(!seen.has(m.title), `${p} unique title`);
    seen.add(m.title);
    assert(m.canonical, `${p} canonical`);
    assert(m.alts.includes('fr') && m.alts.includes('en') && m.alts.includes('x-default'), `${p} hreflang`);
    assert(/noindex/.test(m.robots), `${p} demo is noindex`);
    assert(!m.jsonld, `${p} no LocalBusiness in demo`);
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
