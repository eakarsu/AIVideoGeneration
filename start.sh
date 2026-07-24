#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[[ -f "$project_dir/.env" ]] || { echo 'Missing .env; copy .env.example and provide real secrets.' >&2; exit 1; }
set -a
# shellcheck disable=SC1091
source "$project_dir/.env"
set +a

[[ -d "$project_dir/backend/node_modules" && -d "$project_dir/frontend/node_modules" ]] || { echo 'Dependencies are missing; install them explicitly before starting.' >&2; exit 1; }
backend_port="${BACKEND_PORT:?BACKEND_PORT is required}"
frontend_port="${FRONTEND_PORT:?FRONTEND_PORT is required}"
[[ "$backend_port" != "$frontend_port" ]] || { echo 'Backend and frontend ports must be different; no process was changed.' >&2; exit 1; }
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${OPENROUTER_API_KEY:?OPENROUTER_API_KEY is required}"
: "${OPENROUTER_MODEL:?OPENROUTER_MODEL is required}"
: "${OPENROUTER_BASE_URL:?OPENROUTER_BASE_URL is required}"
[[ ${#JWT_SECRET} -ge 32 ]] || { echo 'JWT_SECRET must contain at least 32 characters.' >&2; exit 1; }
[[ "${ALLOW_SCHEMA_MIGRATION:-}" == "true" || "${ALLOW_SCHEMA_MIGRATION:-}" == "1" ]] || { echo 'ALLOW_SCHEMA_MIGRATION=true is required.' >&2; exit 1; }

for port in "$backend_port" "$frontend_port"; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $port is occupied; no process was changed." >&2
    exit 1
  fi
done

(cd "$project_dir/backend" && node scripts/prepareRuntime.js)

backend_pid=""
frontend_pid=""
cleanup() {
  [[ -z "$frontend_pid" ]] || kill "$frontend_pid" 2>/dev/null || true
  [[ -z "$backend_pid" ]] || kill "$backend_pid" 2>/dev/null || true
  wait "$backend_pid" "$frontend_pid" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

(cd "$project_dir/backend" && BACKEND_PORT="$backend_port" PORT="$backend_port" node server.js) &
backend_pid=$!
(cd "$project_dir/frontend" && BACKEND_PORT="$backend_port" PORT="$frontend_port" REACT_APP_API_URL="/api" BROWSER=none npm start) &
frontend_pid=$!
wait "$backend_pid" "$frontend_pid"
