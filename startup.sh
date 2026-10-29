#!/usr/bin/env bash
# Run the whole system locally in Docker (web, api, postgres, redis).
#
#   ./startup.sh            build and start everything, then wait until it is healthy
#   ./startup.sh ingest     load fresh Elexon data up to today into the running database
#   ./startup.sh logs       follow the logs
#   ./startup.sh stop       stop the containers (data is kept)
#   ./startup.sh reset      stop and delete the database volume (the seed reloads on next start)
set -euo pipefail

cd "$(dirname "$0")"
WEB_URL="http://localhost:5173"

need_docker() {
  docker info >/dev/null 2>&1 || { echo "Docker is not running. Start Docker Desktop and try again." >&2; exit 1; }
}

wait_healthy() {
  echo "Waiting for the API to become healthy..."
  for _ in $(seq 1 45); do
    if body="$(curl -fsS "$WEB_URL/api/v1/health" 2>/dev/null)" && echo "$body" | grep -q '"status":"ok"'; then
      echo "$body"
      return 0
    fi
    sleep 2
  done
  echo "The API did not become healthy. Check: ./startup.sh logs" >&2
  return 1
}

case "${1:-start}" in
  start)
    need_docker
    docker compose up --build -d
    wait_healthy
    echo
    echo "Ready:"
    echo "  App          $WEB_URL"
    echo "  API docs     http://localhost:8000/docs"
    echo "  Postgres     localhost:5433  (user windmon, database windmon)"
    echo "Stop with ./startup.sh stop"
    ;;
  ingest)
    need_docker
    docker compose exec api python -m scripts.ingest --from 2025-12-30 --to "$(date +%F)"
    ;;
  logs)
    need_docker
    docker compose logs -f --tail 100
    ;;
  stop)
    need_docker
    docker compose down
    ;;
  reset)
    need_docker
    docker compose down -v
    echo "Database volume deleted. Run ./startup.sh to start again."
    ;;
  *)
    echo "usage: $0 [start|ingest|logs|stop|reset]" >&2
    exit 1
    ;;
esac
