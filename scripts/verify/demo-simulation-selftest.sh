#!/usr/bin/env bash
# Self-test of the demo proof: it must FAIL (non-zero exit) when
#   1. the server entry is missing,
#   2. the server process dies before listening,
#   3. the server claims to send (status "sent"),
#   4. the server answers "simulated" but still makes an outbound call,
#   5. another process already answers on the proof's port.
# This script exits 0 only if all five negative controls are reported as failures.
set -uo pipefail
cd "$(dirname "$0")/../.."
status=0
expect_failure() {
  local label=$1; shift
  if node ./scripts/verify/demo-simulation-proof.mjs "$@" > "/tmp/demo-proof-selftest-$$.log" 2>&1; then
    echo "SELF-TEST BROKEN · ${label}: the proof PASSED but should have failed"; status=1
  else
    echo "ok    ${label}: proof exited non-zero · $(grep -m1 'PROOF FAILED' "/tmp/demo-proof-selftest-$$.log")"
  fi
  rm -f "/tmp/demo-proof-selftest-$$.log"
}
expect_failure "server entry missing" --entry dist/server/does-not-exist.mjs
expect_failure "server that dies on start" --entry scripts/verify/fixtures/crash-on-start.mjs
FAKE_MODE=sends expect_failure "server that answers status sent" --entry scripts/verify/fixtures/fake-sender.mjs
FAKE_MODE=sneaky expect_failure "server that says simulated but calls out" --entry scripts/verify/fixtures/fake-sender.mjs
PORT=4412 node ./scripts/verify/fixtures/fake-sender.mjs & squatter=$!
for _ in $(seq 1 50); do curl -s -o /dev/null http://127.0.0.1:4412/ && break; sleep 0.1; done
expect_failure "port already taken by another server" --entry dist/server/entry.mjs
kill "$squatter" 2>/dev/null; wait "$squatter" 2>/dev/null
[ $status -eq 0 ] && echo "SELF-TEST PASSED (all five negative controls fail as expected)"
exit $status
