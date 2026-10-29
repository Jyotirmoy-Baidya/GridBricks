# Deploying

Two ways. **Free:** everything on Vercel (Hobby plan) with Neon Postgres and Upstash Redis on their free tiers. **Paid alternative:** API on Heroku (below). Hobby is for personal, non-commercial use.

## Free: Vercel + Neon + Upstash

Two Vercel projects from the same GitHub repo.

| Project | Root Directory | Notes |
|---|---|---|
| API | `backend` | FastAPI is detected from `app/main.py`; `backend/vercel.json` sets a 60 s limit |
| Web | `frontend` | Vite; `frontend/vercel.json` makes deep links work |

### 1. Database and cache
- **Neon:** copy the connection string (the `-pooler` one is fine).
- **Upstash:** use the TLS URL: `rediss://default:TOKEN@HOST:6379` (note the double s).

### 2. Load tables and data once (from your machine)
Serverless functions do not create the schema on startup, so do it once:

```bash
cd backend
DATABASE_URL='postgresql://...neon...' REDIS_URL='rediss://...' python -m scripts.init_db
```

It connects through Neon's direct host (advisory locks need it), creates the tables and loads `data/seed.json.gz` (30 Dec 2025 to 28 Oct 2026). It does nothing if data is already there.

### 3. API project, environment variables
| Name | Value |
|---|---|
| `DATABASE_URL` | Neon connection string |
| `REDIS_URL` | the `rediss://` Upstash URL |
| `RUN_STARTUP_INIT` | `false` |
| `TRUST_FORWARDED_FOR` | `true` (real client IP for the rate limit) |
| `DB_POOL_MAX` | `2` |
| `ADMIN_TOKEN` | a long random string |
| `CORS_ORIGINS` | the web project's URL, e.g. `https://your-web.vercel.app` |

Check `https://YOUR-API.vercel.app/api/v1/health` returns `{"status":"ok","database":true,"redis":true}`.

### 4. Web project
Add `VITE_API_BASE_URL` = `https://YOUR-API.vercel.app/api/v1`, then redeploy (it is read at build time). Open the web URL in a private window and check Overview, Accuracy, Day-ahead and Live.

### Notes
- The first request after idle takes a few seconds (cold start); the Neon database also wakes after idle. The dashboard shows skeletons meanwhile.
- Data refresh: call `POST /api/v1/admin/ingest` with the `X-Admin-Token` header (same body as the Heroku example below). Hobby cron is daily at most.
- Never commit connection strings. If one was shared anywhere, reset the password in Neon or Upstash.

---

# Alternative: Heroku API

The API (with Postgres and Redis) goes to Heroku; the web app goes to Vercel. Deploy the API first. Everything Heroku needs is already in the repo; nothing has been pushed yet.

Rough monthly cost on Heroku: Eco dyno (about $5, shared across apps), Postgres Essential-0 (about $5) and Key-Value Store mini (about $3). Heroku has no free tier, so check current prices first.

## What is prepared

| File | Purpose |
|---|---|
| `backend/Dockerfile` | Multi-stage image. Listens on `$PORT`, trusts Heroku's forwarded client IP, worker count from `WEB_CONCURRENCY` (default 2). |
| `backend/heroku.yml` | Tells Heroku to build the image from the Dockerfile. |
| `backend/app.json` | Stack (`container`), add-ons (Postgres, Redis) and config vars, for review apps and documentation. |
| `deploy-heroku.sh` | One script that does the steps below. |
| `frontend/vercel.json` | Lets deep links such as `/dashboard/accuracy/horizon` load directly. |

How the API behaves on Heroku:
- `DATABASE_URL` and `REDIS_URL` are set by the add-ons. The API uses TLS without certificate checks for non-local hosts, because Heroku's certificates are self-signed.
- On first boot it creates the tables and loads the bundled data (`backend/data/seed.json.gz`, up to 28 Oct 2026). Both steps are guarded by Postgres advisory locks, so two workers starting together cannot collide.
- The pool allows 5 connections per worker, so 2 workers use at most 10 of Essential-0's 20.

## 1. API on Heroku

Needs the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli), Docker running, and `heroku login`.

```bash
./deploy-heroku.sh YOUR-APP-NAME
```

It asks before creating anything paid, creates the app and add-ons if they are missing, sets `ADMIN_TOKEN`, builds and releases the image, then waits for `/api/v1/health`. Expected: `{"status":"ok","database":true,"redis":true}`.

The same steps by hand:

```bash
cd backend
heroku create YOUR-APP-NAME --stack container
heroku addons:create heroku-postgresql:essential-0 -a YOUR-APP-NAME
heroku addons:create heroku-redis:mini -a YOUR-APP-NAME
heroku config:set ADMIN_TOKEN=$(openssl rand -hex 16) -a YOUR-APP-NAME
heroku container:login
heroku container:push web -a YOUR-APP-NAME
heroku container:release web -a YOUR-APP-NAME
```

To refresh data from Elexon later:

```bash
curl -X POST https://YOUR-APP-NAME.herokuapp.com/api/v1/admin/ingest \
  -H "X-Admin-Token: $(heroku config:get ADMIN_TOKEN -a YOUR-APP-NAME)" \
  -H "Content-Type: application/json" -d '{"from":"2025-12-30","to":"2026-10-29"}'
```

## 2. Web on Vercel

1. Import the GitHub repo in Vercel.
2. Set **Root Directory** to `frontend` (framework: Vite; build `npm run build`; output `dist`).
3. Add the environment variable `VITE_API_BASE_URL` = `https://YOUR-APP-NAME.herokuapp.com/api/v1`.
4. Deploy.

## 3. Allow the web app to call the API

```bash
./deploy-heroku.sh YOUR-APP-NAME https://YOUR-PROJECT.vercel.app
# or: heroku config:set CORS_ORIGINS=https://YOUR-PROJECT.vercel.app -a YOUR-APP-NAME
```

Open the Vercel URL in a private window and check Overview, Accuracy, Day-ahead and Live.

## Notes

- The first request after a long idle period may be slow on an Eco dyno (cold start). The dashboard shows skeletons while it wakes.
- The Live page calls Elexon from the dyno, so it needs outbound internet access, which Heroku allows.
- Logs: `heroku logs --tail -a YOUR-APP-NAME`.
