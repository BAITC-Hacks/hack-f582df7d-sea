#!/usr/bin/env bash
# Установка всех зависимостей проекта (бэкенд + фронтенд). Запускать один раз.
set -e
cd "$(dirname "$0")"

echo "==> Backend: создаём venv и ставим зависимости"
cd backend
if [ ! -d venv ]; then python3 -m venv venv; fi
./venv/bin/pip install -q --upgrade pip >/dev/null 2>&1 || true
./venv/bin/pip install -q -r requirements.txt
[ -f .env ] || cp ../.env.example .env
cd ..

echo "==> Frontend: ставим npm-зависимости"
cd client
if command -v bun >/dev/null 2>&1; then bun install; else npm install; fi
cd ..

echo
echo "Готово. Запуск: ./start.sh  (или make dev)"
