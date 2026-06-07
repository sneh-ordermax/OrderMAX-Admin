# OrderMAX Admin

Embedded **Shopify Admin** dashboard for the OrderMAX app. Runs inside the Shopify
Admin (iframe), authenticates with Shopify **session tokens**, and talks to an existing
backend API. Frontend-only — no server in this repo.

## Stack & why

| Concern | Choice | Why |
| --- | --- | --- |
| Build tool / framework | **Vite + React 18 + TypeScript** | Fastest dev cycle (instant HMR), minimal config, builds to static assets. SSR frameworks (Next.js/Remix) fight the embedded-iframe + client-side session-token model. |
| UI | **Shopify App Home web components** (`s-*`) | Future-facing embedded UI model from Shopify, no `@shopify/polaris` React dependency. |
| Embedding / auth | **App Bridge v4** (Shopify CDN) + `@shopify/app-bridge-react` | Required for embedded apps; provides session tokens, the Admin nav menu, toasts, modals. Must load from Shopify's CDN — never bundled. |
| Routing | **React Router** | Standard SPA routing, wired to App Bridge nav and URL-based `s-link` navigation. |
| Data fetching | **TanStack Query** | Caching, retries, loading/error states for your API calls. |
| Quality | **ESLint + Prettier** | Consistent, lint-clean code. |

> React is pinned to **v18** for compatibility with Shopify embedded app tooling.

## Getting started

```bash
# 1. One-time setup (installs deps + validates env + troubleshooting prompts)
npm run setup

# 2. Run
npm run dev       # tunnel + dev server (see below) on http://localhost:3000
npm run dev:local # plain Vite, no tunnel
npm run build     # typecheck + production build to dist/
npm run preview   # preview the production build
npm run lint      # eslint
npm run format    # prettier --write
```

`npm run setup` will:
- install dependencies (`npm install`)
- create `.env.local` from `.env.example` if missing
- validate required `VITE_*` variables and prompt you to fix placeholders
- show targeted "How to fix" guidance when a command fails (with retry/continue/exit options)

### Running inside Shopify Admin (dev tunnel)

Embedded apps can't be tested at `localhost` directly — Shopify loads them in an iframe over
HTTPS. `npm run dev` automates this via `scripts/dev-tunnel.mjs`:

1. Starts a **Cloudflare quick tunnel** in front of port 3000 (no Cloudflare account needed).
2. Writes the tunnel's `https://…trycloudflare.com` URL into the sibling Shopify app config at
   `../ordermax/shopify.app.toml` — both `application_url` and every `auth.redirect_urls` entry
   (paths preserved).
3. Starts Vite.
4. Starts `npm run dev` in `../ordermax` so Shopify picks up the fresh tunnel URL.
5. On `Ctrl-C`, **restores the production URL** so the committed `shopify.app.toml` never carries
   an ephemeral dev URL.

Production is unaffected — the tunnel rewrite only happens during `npm run dev`, and the prod URL
is restored on exit. After the URLs are written, run `shopify app deploy` (or let the next
`shopify app dev` pick them up) from `../ordermax` if your flow requires pushing config.

Overrides (env vars): `DEV_PORT` (default `3000`), `SHOPIFY_APP_TOML`
(default `../ordermax/shopify.app.toml`), `SHOPIFY_PROD_URL`
(default `https://ordermax-admin.onrender.com`), `START_SHOPIFY_DEV`
(default `true`, set `false` to skip auto-starting `../ordermax` dev).

## Project structure

```
index.html                 App Bridge CDN script + shopify-api-key meta
src/
  main.tsx                 Entry: Router + providers
  App.tsx                  Route definitions
  config/env.ts            Validated environment variables
  lib/
    api.ts                 fetch client — attaches Shopify session token to every request
    queryClient.ts         TanStack Query config
  providers/
    AppProviders.tsx       QueryClientProvider
  types/
    shopify-web-components.d.ts JSX declarations for `s-*` elements
  components/
    AppFrame.tsx           App Bridge NavMenu (Admin sidebar) + router outlet
  hooks/
    useDashboardMetrics.ts Example data hook (swap for real endpoint)
  pages/
    Dashboard.tsx
    Orders.tsx
    Settings.tsx
    NotFound.tsx
```

## How auth works

1. Shopify loads the app in an iframe; the App Bridge CDN script exposes a global `shopify`.
2. `src/lib/api.ts` calls `shopify.idToken()` to get a short-lived JWT (session token).
3. The token is sent as `Authorization: Bearer <token>` to your backend.
4. Your backend verifies the JWT signature with your app's **API secret** and reads the
   shop/user from the claims.

There are no API secrets in this repo — verification happens on your backend.
