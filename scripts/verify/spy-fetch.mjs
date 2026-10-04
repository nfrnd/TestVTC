// Loaded with `node --import ./scripts/verify/spy-fetch.mjs <server>`: records every
// outbound call the server process makes, so the demo proof can show there is none.
// Covers fetch (used by the Resend transport) and node:http / node:https requests.
import http from 'node:http';
import https from 'node:https';
import { syncBuiltinESMExports } from 'node:module';

const report = (kind, url) => console.log(JSON.stringify({ evt: 'OUTBOUND_CALL', kind, url: String(url) }));

const origFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  report('fetch', typeof input === 'string' || input instanceof URL ? input : input.url);
  return origFetch(input, init);
};
for (const [name, mod] of [['http', http], ['https', https]]) {
  for (const fn of ['request', 'get']) {
    const orig = mod[fn];
    mod[fn] = function (...args) {
      const a = args[0];
      report(`${name}.${fn}`, typeof a === 'string' || a instanceof URL ? a : `${a?.protocol ?? name + ':'}//${a?.hostname ?? a?.host ?? '?'}${a?.path ?? ''}`);
      return orig.apply(this, args);
    };
  }
}
syncBuiltinESMExports();
// Marker: the proof refuses to conclude "0 calls" unless this line is in the log.
console.log(JSON.stringify({ evt: 'SPY_ACTIVE' }));
