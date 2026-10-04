#!/bin/bash
# Usage (after npm run build): bash scripts/verify/demo-simulation-proof.sh [logDir]
# Demo server configured exactly like a live sender would be; fetch is instrumented.
S=${1:-lab}; mkdir -p "$S"
env PORT=4412 HOST=127.0.0.1 EMAIL_TRANSPORT=resend RESEND_API_KEY=FAKE-KEY-NOT-A-REAL-SECRET MAIL_TO=destinataire@example.com "MAIL_FROM=Site <site@example.com>" \
  node --import scripts/verify/spy-fetch.mjs dist/server/entry.mjs > $S/spy.log 2>&1 &
PID=$!
sleep 1.5
echo "server pid $PID env: $(tr '\0' '\n' < /proc/$PID/environ | grep -E '^(PORT|EMAIL_TRANSPORT|MAIL_TO|MAIL_FROM)=' | tr '\n' ' ') RESEND_API_KEY=(factice, définie)"
D=$(date -u -d '+7 days' +%F)
echo "## Réponse devis (JSON)"
curl -s -X POST http://127.0.0.1:4412/api/demandes -H 'Origin: http://127.0.0.1:4412' -H 'Content-Type: application/json' -d "{\"kind\":\"devis\",\"lang\":\"fr\",\"requestId\":\"proof-0001-abcdef\",\"service\":\"airport\",\"departure\":\"Cannes-centre\",\"arrival\":\"Aéroport Nice Côte d’Azur\",\"date\":\"$D\",\"time\":\"10:30\",\"passengers\":\"2\",\"name\":\"Camille Martin\",\"contactMethod\":\"email\",\"email\":\"camille@example.com\"}" | node -e "const r=JSON.parse(require('fs').readFileSync(0));console.log(JSON.stringify({ok:r.ok,status:r.status,reference:r.reference,message:r.message,summaryRows:r.summary?.rows?.length,fare:r.summary?.fare},null,1))"
echo "## Formulaire de contact sans JS (HTML) : HTTP $(curl -s -X POST http://127.0.0.1:4412/api/demandes -H 'Origin: http://127.0.0.1:4412' --data-urlencode kind=contact --data-urlencode lang=fr --data-urlencode name=Camille --data-urlencode contactMethod=email --data-urlencode email=c@example.com --data-urlencode 'message=Bonjour, ceci est un test de contact.' -o /dev/null -w '%{http_code}')"
kill $PID
sleep 0.3
echo "## Journal serveur (complet)"
cat $S/spy.log
echo "## Appels sortants détectés : $(grep -c OUTBOUND_FETCH $S/spy.log)"
