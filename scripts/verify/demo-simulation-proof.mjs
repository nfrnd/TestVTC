// Proof that the DEMO server simulates instead of sending, even when it is configured
// exactly like a real sender (EMAIL_TRANSPORT=resend, a key, MAIL_TO, MAIL_FROM).
//
// Every step is checked; the script exits non-zero on the first failure:
//   1. positive control: the spy really detects an outbound call;
//   2. the server starts (readiness is polled, an early exit is a failure);
//   3. the spy is active inside the server (marker in its log);
//   4. quote (JSON), contact (HTML) and no-JS quote (HTML) answer HTTP 200 + simulated;
//   5. zero outbound call in the server log, and no submitted content in it.
//
//   node scripts/verify/demo-simulation-proof.mjs [--entry dist/server/entry.mjs] [--out report.json]
// Run `npm run build` first. Self-test (must fail twice): scripts/verify/demo-simulation-selftest.sh
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';

const arg = (name, dflt) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : dflt; };
const ENTRY = arg('--entry', 'dist/server/entry.mjs');
const OUT = arg('--out', null);
const PORT = Number(process.env.PROOF_PORT || 4412);
const BASE = `http://127.0.0.1:${PORT}`;
const SPY = './scripts/verify/spy-fetch.mjs';
const FAKE_KEY = 'FAKE-KEY-NOT-A-REAL-SECRET';

const steps = [];
const ok = (step, detail = '') => { steps.push({ step, ok: true, detail }); console.log(`ok    ${step}${detail ? ` (${detail})` : ''}`); };
class ProofError extends Error {}
const fail = (step, detail) => { steps.push({ step, ok: false, detail }); throw new ProofError(`${step}: ${detail}`); };

let child = null;
let log = '';
const stop = () => { if (child && child.exitCode === null) child.kill('SIGTERM'); };
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { stop(); process.exit(130); });
process.on('exit', stop);

async function main() {
  console.log(`Demo simulation proof · entry=${ENTRY} · ${new Date().toISOString()}`);

  // 1. Positive control: without it, "0 outbound call" could just mean a blind spy.
  const probe = "await fetch('http://127.0.0.1:9/').catch(() => {}); const { get } = await import('node:http'); get('http://127.0.0.1:9/').on('error', () => {});";
  const control = spawnSync(process.execPath, ['--input-type=module', '--import', SPY, '-e', probe], { encoding: 'utf8' });
  const detected = (control.stdout.match(/"OUTBOUND_CALL"/g) ?? []).length;
  if (control.status !== 0 || detected !== 2) fail('positive control: spy detects fetch and http calls', `exit=${control.status} detected=${detected}/2 ${control.stderr.trim()}`);
  ok('positive control: spy detects fetch and http calls', '2/2 calls detected');

  // 2. Start the server configured like a real sender.
  if (!existsSync(ENTRY)) fail('server entry exists', `${ENTRY} not found (run npm run build)`);
  // A stale server on the port would answer instead of the one under test.
  const busy = await fetch(BASE + '/').then(() => true, () => false);
  if (busy) fail('port is free', `something already answers on ${BASE}; stop it or set PROOF_PORT`);
  child = spawn(process.execPath, ['--import', SPY, ENTRY], {
    env: { ...process.env, HOST: '127.0.0.1', PORT: String(PORT), EMAIL_TRANSPORT: 'resend', RESEND_API_KEY: FAKE_KEY, MAIL_TO: 'destinataire@example.com', MAIL_FROM: 'Site <site@example.com>', RATE_LIMIT_MAX: '50' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (d) => (log += d));
  child.stderr.on('data', (d) => (log += d));
  let ready = false;
  for (let i = 0; i < 100 && !ready; i++) {
    if (child.exitCode !== null) fail('server starts', `exited with code ${child.exitCode}: ${log.trim().split('\n').slice(-3).join(' | ')}`);
    try { ready = (await fetch(BASE + '/')).status === 200; } catch { /* not listening yet */ }
    if (!ready) await new Promise((r) => setTimeout(r, 100));
  }
  if (!ready) fail('server starts', `no HTTP 200 on ${BASE}/ within 10 s`);
  ok('server starts', BASE);

  // 3. The spy must be loaded in the server process.
  if (!log.includes('"SPY_ACTIVE"')) fail('spy active in the server', 'marker missing from the server log');
  ok('spy active in the server');

  // 4. The three submissions.
  const date = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const quote = { kind: 'devis', lang: 'fr', requestId: `proof-${Date.now()}`, service: 'airport', departure: 'Cannes-centre', arrival: 'Aéroport Nice Côte d’Azur', date, time: '10:30', passengers: '2', name: 'Camille Preuve', contactMethod: 'email', email: 'camille.preuve@example.com' };
  const headers = { Origin: BASE };

  const r1 = await fetch(BASE + '/api/demandes', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(quote) });
  const t1 = await r1.text();
  let j1 = null;
  try { j1 = JSON.parse(t1); } catch { /* checked below */ }
  if (r1.status !== 200 || j1?.status !== 'simulated') fail('quote (JSON) simulated', `HTTP ${r1.status}, status=${j1?.status ?? 'unparsable'}: ${t1.slice(0, 160)}`);
  if (!/^DEMO-/.test(j1.reference ?? '') || !/Aucun message n’a été envoyé/.test(j1.message ?? '')) fail('quote (JSON) simulated', `unexpected reference/message: ${j1.reference} / ${j1.message}`);
  ok('quote (JSON) simulated', `HTTP 200, status=simulated, ${j1.reference}, fare: ${j1.summary?.fare?.lines?.[0] ?? '-'}`);

  const form = (o) => new URLSearchParams(o).toString();
  const r2 = await fetch(BASE + '/api/demandes', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form({ kind: 'contact', lang: 'fr', name: 'Camille Preuve', contactMethod: 'email', email: 'camille.preuve@example.com', message: 'Bonjour, ceci est un message fictif de preuve.' }) });
  const t2 = await r2.text();
  if (r2.status !== 200 || !t2.includes('Message simulé')) fail('contact (HTML, no JS) simulated', `HTTP ${r2.status}: ${t2.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 160)}`);
  ok('contact (HTML, no JS) simulated', 'HTTP 200, « Message simulé »');

  const r3 = await fetch(BASE + '/api/demandes', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form({ ...quote, requestId: `proof-nojs-${Date.now()}` }) });
  const t3 = await r3.text();
  if (r3.status !== 200 || !t3.includes('Simulation terminée') || !t3.includes('95')) fail('quote (HTML, no JS) simulated', `HTTP ${r3.status}: ${t3.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 160)}`);
  ok('quote (HTML, no JS) simulated', 'HTTP 200, « Simulation terminée », fare 95 €');

  // 5. Nothing went out, nothing personal was logged.
  await new Promise((r) => setTimeout(r, 300));
  const calls = (log.match(/"OUTBOUND_CALL"/g) ?? []).length;
  if (calls !== 0) fail('no outbound call', `${calls} call(s): ${log.split('\n').filter((l) => l.includes('OUTBOUND_CALL')).join(' | ')}`);
  ok('no outbound call', '0 fetch / http / https request from the server');
  const leaked = [quote.email, quote.departure, quote.name, 'message fictif'].filter((s) => log.includes(s));
  if (leaked.length) fail('no submitted content in the server log', `found: ${leaked.join(', ')}`);
  ok('no submitted content in the server log');
}

let code = 0;
try {
  await main();
  console.log('\nPROOF PASSED');
} catch (e) {
  code = 1;
  console.log(`\nPROOF FAILED · ${e instanceof ProofError ? e.message : e.stack}`);
} finally {
  stop();
  const serverLog = log.trim();
  console.log(`\n--- server log (complete) ---\n${serverLog || '(empty)'}`);
  if (OUT) writeFileSync(OUT, JSON.stringify({ entry: ENTRY, passed: code === 0, steps, serverLog }, null, 2));
}
process.exit(code);
