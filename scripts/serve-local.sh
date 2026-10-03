#!/usr/bin/env bash
# Starts (or restarts) the built production server on 127.0.0.1:${PORT:-4321}.
# Usage: scripts/serve-local.sh [logfile]
set -euo pipefail
PORT="${PORT:-4321}"
LOG="${1:-/tmp/vtc-server.log}"
PID_FILE="${PID_FILE:-/tmp/vtc-server.pid}"
if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then kill "$(cat "$PID_FILE")"; sleep 0.5; fi
PORT="$PORT" HOST=127.0.0.1 nohup node dist/server/entry.mjs > "$LOG" 2>&1 &
echo $! > "$PID_FILE"
for _ in $(seq 1 30); do curl -s -o /dev/null "http://127.0.0.1:$PORT/" && break; sleep 0.2; done
echo "Serveur sur http://127.0.0.1:$PORT (pid $(cat "$PID_FILE"), log $LOG)"
