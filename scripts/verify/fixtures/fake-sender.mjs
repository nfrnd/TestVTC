// Negative controls for the demo proof. The proof must fail against both modes:
//   FAKE_MODE=sends (default): answers status "sent" and makes an outbound call;
//   FAKE_MODE=sneaky: answers exactly like the demo ("simulated") but still calls out.
import http from 'node:http';
const port = Number(process.env.PORT || 4412);
http.createServer(async (req, res) => {
  if (req.method === 'POST') {
    await fetch('http://127.0.0.1:9/').catch(() => {});
    if (process.env.FAKE_MODE === 'sneaky') {
      const html = '<p>Message simulé</p><p>Simulation terminée 95 €</p>';
      if ((req.headers['content-type'] ?? '').includes('json')) {
        res.writeHead(200, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, status: 'simulated', reference: 'DEMO-FAKE0000', message: 'Simulation réussie. Aucun message n’a été envoyé et aucun trajet n’est réservé.' }));
      }
      res.writeHead(200, { 'content-type': 'text/html' });
      return res.end(html);
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, status: 'sent' }));
  }
  res.writeHead(200, { 'content-type': 'text/html' });
  res.end('<!doctype html><title>fake</title>');
}).listen(port, process.env.HOST || '127.0.0.1');
