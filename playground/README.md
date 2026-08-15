# @finon/connect playground

A local dev tool to test `@finon/connect` providers end to end: paste your OAuth credentials, run the real authorization flow, then fetch accounts and transactions and inspect both the normalized output and the raw provider payload.

It is a small Astro app running on Node. It is **not** part of the published library (it lives outside `src/` and is excluded from the package).

## Why a server (and not a static page)

The OAuth flow cannot run entirely in the browser:

- the **client secret** must never reach client-side JS,
- Coinbase needs a reachable **redirect URI** to deliver the `code`,
- the token and data endpoints are not meant to be called cross-origin.

So this app exposes a few server-side API routes (`src/pages/api/*`) that call the library on the server. The browser only ever talks to this app.

## Run it

It is package-manager agnostic (npm, pnpm, yarn, bun all work):

```sh
cd connect/playground
bun install
bun run dev
```

Open http://localhost:4400. It runs on a dedicated port so it never collides with `app/apps/web` (4321).

## Use it

1. In your Coinbase OAuth application, register the redirect URI `http://localhost:4400/callback`.
2. On the page, paste your **Client ID** and **Client Secret** (redirect URI is prefilled) and click **Connect Coinbase**.
3. Authorize on Coinbase. You are redirected back and the page shows **Connected**.
4. Use **Get accounts**, **Full sync**, or per-account **transactions**. Toggle each result between **Normalized** and **Raw**.

## Notes

- Config and credentials are kept **in memory** in the Node process. Nothing is persisted and nothing is sent to the browser. Restarting the server clears them. Single user, localhost only. Do not deploy this publicly.
- The library is imported directly from its TypeScript source (`../src`) via an alias in `astro.config.mjs`, so no build of the library is needed.

## API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/config` | POST | store config, return Coinbase authorization URL |
| `/callback` | GET | OAuth callback, exchange code for credentials |
| `/api/status` | GET | configured / connected flags |
| `/api/accounts` | GET | normalized accounts |
| `/api/transactions` | POST | normalized transactions for one account |
| `/api/sync` | POST | full sync (accounts + transactions) |
| `/api/reset` | POST | disconnect / clear state |
