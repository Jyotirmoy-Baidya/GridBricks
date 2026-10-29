# Deploying

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
