.PHONY: setup dev backend frontend test build

setup:      ## install deps
	./setup.sh

dev:        ## run both
	./start.sh

backend:    ## backend :8001
	cd backend && ./venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8001

frontend:   ## frontend :3000
	cd client && (command -v bun >/dev/null && bun run dev || npm run dev)

test:       ## backend tests
	cd backend && DATABASE_URL=sqlite:///./test.db ./venv/bin/python -m pytest -q test_scenario.py; rm -f backend/test.db

build:      ## build frontend
	cd client && (command -v bun >/dev/null && bun run build || npm run build)
