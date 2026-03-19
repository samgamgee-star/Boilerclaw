#!/bin/bash
set -euo pipefail

TASK_ID="$1"
MC_DIR="/Users/samuel/mission-control"
TOKEN=$(python3 - <<'PY'
from pathlib import Path
for line in Path('/Users/samuel/mission-control/.env.local').read_text().splitlines():
    if line.startswith('MC_API_TOKEN='):
        print(line.split('=',1)[1].strip())
        break
PY
)

STATUSES=("inbox" "assigned" "in_progress" "testing" "review" "verification" "done")

while true; do
  for status in "${STATUSES[@]}"; do
    ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    curl -sS -X PATCH \
      -H "Authorization: Bearer $TOKEN" \
      -H "x-mc-board-override: true" \
      -H "Content-Type: application/json" \
      --data "{\"status\":\"${status}\",\"board_override\":true,\"override_reason\":\"demo stage cycler ${ts}\"}" \
      "http://127.0.0.1:4000/api/tasks/${TASK_ID}" >/tmp/mission-control-stage-cycler.last.json || true
    sleep 15
  done
done
