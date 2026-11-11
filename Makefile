.PHONY: up down logs build help

# Full stack in Docker — only Docker (+ Make) required.
# Postgres, API, and client all run as containers.

up:
	docker compose up --build -d
	@echo ""
	@echo "App:  http://localhost:18080"
	@echo "API:  http://localhost:13001"
	@echo "DB:   localhost:15432 (presight/presight)"
	@echo ""
	@echo "Migrations + seed run automatically inside the API container."
	@echo "Logs: make logs   |   Stop: make down"

down:
	docker compose down
	@echo "Stopped. Postgres data is kept (use: docker compose down -v to wipe)."

logs:
	docker compose logs -f

build:
	docker compose build

help:
	@echo "Requires Docker (and Make)."
	@echo ""
	@echo "  make up      Build & start postgres + api + client"
	@echo "  make down    Stop containers (keeps DB volume)"
	@echo "  make logs    Follow container logs"
	@echo "  make build   Build images only"
