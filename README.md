# @finon/connect

Connect to financial providers with a uniform contract and a normalized data model. The library handles authorization, rate limiting, paginated fetching, and classification, and hands you clean, provider-agnostic assets and transactions. Bring your own storage: credentials come back in plain text for you to encrypt and persist.

- **Zero infrastructure coupling.** No database, no auth provider, no environment variables. Just `fetch` and TypeScript.
- **Normalized model.** Every provider maps its payloads into the same `Asset` / `Transaction` shapes; the original payload is always on `raw`.
- **Uniform contract.** Every provider, whether it takes an API key, OAuth tokens or uploaded statements, is created the same way with `createClient(provider, credentials)` and exposes the same `getAssets()` / `getTransactions()`, so adding providers does not change how you consume data.
- **Pickers for free.** Each provider ships static metadata (id, name, auth type, asset types, setup steps) so you can render a "connect an account" flow without hardcoding provider knowledge.

## Available connections

| Provider    | Auth        | Asset types           |
| ----------- | ----------- | --------------------- |
| Trading 212 | API key     | Stocks, cash          |
| Moneybox    | File import | Stocks, cash, savings |

Per-provider usage and setup details will live in the docs; in the meantime, each provider's metadata (`setup`, `params`) and the [playground](playground/) show the full flow.

## Install

```sh
bun add @finon/connect
```

## Quick start

```ts
import { createClient, trading212 } from "@finon/connect";

// Verifies the credentials the user submitted and throws a ConnectError
// naming any missing permissions. A client you get back is ready to use.
const client = await createClient(trading212, { apiKey, apiSecret });

// Pull normalized data.
const assets = await client.getAssets();
const transactions = await client.getTransactions({ since: lastSyncedAt });

// Later, rebuild a client from stored credentials without re-verifying.
const stored = new trading212.Client(storedCredentials);
```

Providers without an API work the same way from statement files. Moneybox, for example, parses the PDF statement the user generates in the app:

```ts
import { createClient, moneybox } from "@finon/connect";

// Throws a ConnectError naming any file that is not a readable Moneybox statement.
const client = await createClient(moneybox, { files: [statementPdf] });

const assets = await client.getAssets(); // funds, cash, Cash ISA balance
const transactions = await client.getTransactions();
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
