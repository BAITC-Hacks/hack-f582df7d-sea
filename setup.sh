#!/usr/bin/env bash
# install backend + frontend deps
set -e
cd "$(dirname "$0")"

echo "backend"
cd backend
if [ ! -d venv ]; then python3 -m venv venv; fi
./venv/bin/pip install -q --upgrade pip >/dev/null 2>&1 || true
./venv/bin/pip install -q -r requirements.txt
[ -f .env ] || cp ../.env.example .env
cd ..

echo "frontend"
cd client
if command -v bun >/dev/null 2>&1; then bun install; else npm install; fi
cd ..

echo
echo "done: ./start.sh"
