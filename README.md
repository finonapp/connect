# @finon/connect

Connect to financial providers with a uniform contract and a normalized data model. The library handles authorization, rate limiting, paginated fetching, and classification, and hands you clean, provider-agnostic assets and transactions. Bring your own storage: credentials come back in plain text for you to encrypt and persist.

- **Zero infrastructure coupling.** No database, no auth provider, no environment variables. Just `fetch` and TypeScript.
- **Normalized model.** Every provider maps its payloads into the same `Asset` / `Transaction` shapes; the original payload is always on `raw`.
- **Uniform contract.** OAuth providers implement `Connection`, API-key providers implement `ApiKeyConnection`, and every session exposes the same `getAssets()` / `getTransactions()`, so adding providers does not change how you consume data.
- **Pickers for free.** Each provider ships static metadata (id, name, auth type, asset types, setup steps) so you can render a "connect an account" flow without hardcoding provider knowledge.

## Available connections

| Provider    | Auth    | Asset types  |
| ----------- | ------- | ------------ |
| Trading 212 | API key | Stocks, cash |

Per-provider usage and setup details will live in the docs; in the meantime, each provider's metadata (`setup`, `params`) and the [playground](playground/) show the full flow.

## Install

```sh
bun add @finon/connect
```

## Quick start

```ts
import { trading212 } from "@finon/connect";

const client = new trading212.Client({ apiKey, apiSecret });

// Verify the credentials the user submitted. Returns the names of any
// missing permissions; empty means the key is fully usable.
const missing = await client.verify();
if (missing.length > 0) throw new Error(`Key is missing: ${missing.join(", ")}`);

// Pull normalized data.
const assets = await client.getAssets();
const transactions = await client.getTransactions({ since: lastSyncedAt });
```

All providers are also available through the default export, keyed by id:

```ts
import providers from "@finon/connect";

providers.trading212.name; // "Trading 212"
providers.trading212.auth; // "api-key"
```

## Development

```sh
bun install
bun run typecheck
bun test
```

## License

MIT
