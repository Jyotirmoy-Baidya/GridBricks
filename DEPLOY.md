# Deploying

The API (with Postgres and Redis) goes to Heroku; the web app goes to Vercel. Deploy the API first.

Rough monthly cost on Heroku: Eco dyno (about $5, shared across apps), Postgres Essential-0 (about $5) and Key-Value Store mini (about $3). Check current prices before creating them.

## 1. API on Heroku

Needs the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) and Docker running.

```bash
heroku login
cd backend
heroku create YOUR-APP-NAME --stack container
heroku addons:create heroku-postgresql:essential-0 -a YOUR-APP-NAME
heroku addons:create heroku-redis:mini -a YOUR-APP-NAME
heroku config:set ADMIN_TOKEN=$(openssl rand -hex 16) CORS_ORIGINS=http://localhost:5173 -a YOUR-APP-NAME
heroku container:login
heroku container:push web -a YOUR-APP-NAME
heroku container:release web -a YOUR-APP-NAME
curl https://YOUR-APP-NAME.herokuapp.com/api/v1/health
```

Expected: `{"status":"ok","database":true,"redis":true}`.

`DATABASE_URL` and `REDIS_URL` are set by the add-ons. On first boot the API creates the tables and loads the bundled January data (`backend/data/seed.json.gz`), so no ingest is needed. To refresh from Elexon later:

```bash
curl -X POST https://YOUR-APP-NAME.herokuapp.com/api/v1/admin/ingest \
  -H "X-Admin-Token: <the ADMIN_TOKEN you set>" -H "Content-Type: application/json" \
  -d '{"from":"2025-12-30","to":"2026-02-01"}'
```

## 2. Web on Vercel

1. Import the GitHub repo in Vercel.
2. Set **Root Directory** to `frontend` (framework: Vite; build `npm run build`; output `dist`).
3. Add the environment variable `VITE_API_BASE_URL` = `https://YOUR-APP-NAME.herokuapp.com/api/v1`.
4. Deploy. `frontend/vercel.json` makes deep links such as `/dashboard/accuracy/horizon` load directly.

## 3. Allow the web app to call the API

```bash
heroku config:set CORS_ORIGINS=https://YOUR-PROJECT.vercel.app -a YOUR-APP-NAME
```

Open the Vercel URL in a private window and check the Overview, Accuracy and Day-ahead pages.

## Notes

- The API uses TLS without certificate checks for non-local Postgres and Redis hosts, because Heroku's certificates are self-signed.
- The pool is limited to 5 connections per process and 2 processes, well under the Essential-0 limit of 20.
- The first request after a long idle period may be slow on an Eco dyno (cold start). The dashboard shows skeletons while it wakes.
