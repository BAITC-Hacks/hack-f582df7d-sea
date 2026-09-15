#!/usr/bin/env bash
# run backend :8001 + frontend :3000
set -e
cd "$(dirname "$0")"

[ -d backend/venv ] && [ -d client/node_modules ] || ./setup.sh

cleanup() { kill 0 2>/dev/null; }
trap cleanup EXIT INT TERM

echo "==> Backend:  http://localhost:8001  (Swagger: /docs)"
(cd backend && ./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8001) &

echo "==> Frontend: http://localhost:3000"
cd client
if command -v bun >/dev/null 2>&1; then bun run dev; else npm run dev; fi
