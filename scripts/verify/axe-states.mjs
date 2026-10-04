// axe-core (WCAG 2.x A/AA rules, colour contrast included) on interactive states
// Lighthouse never sees: field errors, simulated result, failure, open dialogs.
//   AXE_PATH=/path/to/axe.min.js node scripts/verify/axe-states.mjs [baseUrl]
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const CHROME = process.env.SCROLLCRAFT_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = process.argv[2] || 'http://127.0.0.1:4321';
const AXE = readFileSync(process.env.AXE_PATH || 'node_modules/axe-core/axe.min.js', 'utf8');
const browser = await chromium.launch({ executablePath: CHROME });
const example = async (p) => { await p.click('[data-example]'); await p.click('[data-next]'); };
const states = [
  ['accueil', '/', null],
  ['accueil-390', '/', null, 390],
  ['tarifs', '/tarifs/', null],
  ['devis-erreurs', '/devis/', async (p) => { await p.click('[data-next]'); }],
  ['devis-etape2', '/devis/', example],
  ['devis-resultat', '/devis/', async (p) => { await example(p); await p.click('[data-submit]'); await p.waitForSelector('[data-done-box]:not([hidden])'); }],
  ['devis-echec', '/devis/', async (p) => { await p.route('**/api/demandes', (r) => r.fulfill({ status: 502, contentType: 'application/json', body: '{"ok":false,"status":"failed"}' })); await example(p); await p.click('[data-submit]'); await p.waitForSelector('[data-error-box]:not([hidden])'); }],
  ['contact-erreurs', '/contact/', async (p) => { await p.click('form[data-form=contact] [data-submit]'); }],
  ['dialog-appel', '/contact/', async (p) => { await p.locator('[data-sim="call"]').first().click(); await p.waitForSelector('#sim-call[open]'); }],
  ['dialog-whatsapp', '/contact/', async (p) => { await p.locator('[data-sim="whatsapp"]').first().click(); await p.waitForSelector('#sim-whatsapp[open]'); }],
  ['dialog-email', '/contact/', async (p) => { await p.locator('[data-sim="email"]').first().click(); await p.waitForSelector('#sim-email[open]'); }],
  ['menu-mobile', '/', async (p) => { await p.click('.menu summary'); }, 390],
  ['a-propos', '/mentions-legales/', null],
  ['en-quote-errors', '/en/quote/', async (p) => { await p.click('[data-next]'); }],
];
const report = [];
for (const [name, url, act, width = 1440] of states) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  if (act) await act(page);
  await page.waitForTimeout(400);
  await page.addScriptTag({ content: AXE });
  const r = await page.evaluate(async () => {
    const res = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
    return { violations: res.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => ({ target: n.target.join(' '), summary: n.failureSummary })) })), incomplete: res.incomplete.map((v) => ({ id: v.id, count: v.nodes.length })), passes: res.passes.length };
  });
  report.push({ state: name, url, width, ...r });
  console.log(`${r.violations.length ? 'VIOL' : 'ok  '} ${name.padEnd(18)} violations=${r.violations.length} passes=${r.passes} incomplete=${r.incomplete.map((i) => `${i.id}:${i.count}`).join(',') || '-'}`);
  for (const v of r.violations) console.log(`       ${v.id} (${v.impact}) ${v.nodes.slice(0, 3).map((n) => n.target).join(' | ')}`);
  await page.close();
}
await browser.close();
mkdirSync('lab', { recursive: true });
writeFileSync('lab/axe-states.json', JSON.stringify(report, null, 2));
