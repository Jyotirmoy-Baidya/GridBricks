# Frontend

React 19 + TypeScript + Vite + Tailwind. See the [root README](../README.md) for how to run the whole app.

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api to http://localhost:8000
npm run build      # type-check and production build
npm run lint
npx vitest run     # unit tests
```

Layout: `src/api` (axios instance, `v1/` endpoint modules), `src/store` (Zustand), `src/pages`, `src/layouts`, `src/components`, `src/hooks`, `src/utils`, `src/types`.
