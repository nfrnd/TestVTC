#!/usr/bin/env bash
# Demo simulation proof (see scripts/verify/demo-simulation-proof.mjs for the steps).
# Usage, after `npm run build`: bash scripts/verify/demo-simulation-proof.sh [--out report.json]
# Exits non-zero if any step fails.
set -euo pipefail
cd "$(dirname "$0")/../.."
exec node ./scripts/verify/demo-simulation-proof.mjs "$@"
