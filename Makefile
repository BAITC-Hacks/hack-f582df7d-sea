.PHONY: setup dev backend frontend test build

setup:      ## установить зависимости бэкенда и фронтенда
	./setup.sh

dev:        ## запустить бэкенд + фронтенд
	./start.sh

backend:    ## только бэкенд на :8001
	cd backend && ./venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8001

frontend:   ## только фронтенд на :3000
	cd client && (command -v bun >/dev/null && bun run dev || npm run dev)

test:       ## проверочный сценарий из ТЗ (бэкенд)
	cd backend && DATABASE_URL=sqlite:///./test.db ./venv/bin/python -m pytest -q test_scenario.py; rm -f backend/test.db

build:      ## production-сборка фронтенда
	cd client && (command -v bun >/dev/null && bun run build || npm run build)
