.PHONY: up down reset ingest seed test lint

up:
	docker compose up --build -d

down:
	docker compose down

reset:
	docker compose down -v

ingest:
	docker compose exec api python -m scripts.ingest --from 2025-12-30 --to 2026-02-01

seed:
	docker compose exec api python -m scripts.build_seed

test:
	cd backend && python -m pytest -q
	cd frontend && npx vitest run --passWithNoTests

lint:
	cd backend && python -m ruff check . && python -m mypy app
	cd frontend && npm run lint && npx tsc --noEmit -p tsconfig.app.json
