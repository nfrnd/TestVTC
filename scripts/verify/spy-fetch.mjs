// Records every fetch the server makes (the Resend transport uses fetch).
const orig = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = typeof input === 'string' ? input : input.url;
  console.log(JSON.stringify({ evt: 'OUTBOUND_FETCH', url }));
  return orig(input, init);
};
