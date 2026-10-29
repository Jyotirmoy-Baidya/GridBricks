#!/usr/bin/env bash
# Deploy the API to Heroku (container stack) with Postgres and Redis add-ons.
#
#   ./deploy-heroku.sh <app-name> [web-origin]
#
# Example: ./deploy-heroku.sh my-wind-api https://my-wind.vercel.app
#
# Needs the Heroku CLI (logged in with `heroku login`) and Docker running.
# Safe to re-run: it only creates what is missing, then rebuilds and releases the image.
# Add-ons are paid (about $8 a month together); the script asks before creating anything.
set -euo pipefail

APP="${1:-}"
ORIGIN="${2:-}"
if [ -z "$APP" ]; then
  echo "usage: $0 <app-name> [web-origin]" >&2
  exit 1
fi

command -v heroku >/dev/null || { echo "Install the Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli" >&2; exit 1; }
docker info >/dev/null 2>&1 || { echo "Docker is not running. Start Docker Desktop first." >&2; exit 1; }
heroku auth:whoami >/dev/null 2>&1 || { echo "Not logged in. Run: heroku login" >&2; exit 1; }

cd "$(dirname "$0")"

if ! heroku apps:info -a "$APP" >/dev/null 2>&1; then
  echo "App '$APP' does not exist yet."
  echo "This will create it on the container stack and add Heroku Postgres (essential-0)"
  echo "and Heroku Key-Value Store / Redis (mini). Both are paid add-ons."
  read -r -p "Continue? [y/N] " answer
  [ "$answer" = "y" ] || [ "$answer" = "Y" ] || { echo "Cancelled."; exit 1; }
  heroku create "$APP" --stack container
fi

addons="$(heroku addons -a "$APP" 2>/dev/null || true)"
echo "$addons" | grep -qi "heroku-postgresql" || heroku addons:create heroku-postgresql:essential-0 -a "$APP" --wait
echo "$addons" | grep -qi "heroku-redis" || heroku addons:create heroku-redis:mini -a "$APP" --wait

if ! heroku config:get ADMIN_TOKEN -a "$APP" | grep -q .; then
  heroku config:set ADMIN_TOKEN="$(openssl rand -hex 16 2>/dev/null || date +%s%N | sha256sum | head -c 32)" -a "$APP" >/dev/null
  echo "Set a new ADMIN_TOKEN. Read it with: heroku config:get ADMIN_TOKEN -a $APP"
fi
if [ -n "$ORIGIN" ]; then
  heroku config:set CORS_ORIGINS="$ORIGIN" -a "$APP" >/dev/null
  echo "CORS_ORIGINS set to $ORIGIN"
fi

heroku container:login
(cd backend && heroku container:push web -a "$APP" && heroku container:release web -a "$APP")

URL="https://${APP}.herokuapp.com"
echo "Waiting for $URL/api/v1/health ..."
for _ in $(seq 1 30); do
  if body="$(curl -fsS "$URL/api/v1/health" 2>/dev/null)"; then
    echo "$body"
    echo "API is up: $URL"
    echo "Next: set VITE_API_BASE_URL=$URL/api/v1 in Vercel, then re-run with your Vercel origin to allow CORS."
    exit 0
  fi
  sleep 4
done
echo "The API did not answer in time. Check: heroku logs --tail -a $APP" >&2
exit 1
