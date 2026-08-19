# @finon/connect

Connect to financial providers with a uniform flow and a normalized data model. Bring your own storage; the library handles authorization, token refresh, rate limiting, paginated fetching, and classification, and hands you clean, provider-agnostic assets and transactions.

Currently supported: **Trading 212** (API key) and **Coinbase** (OAuth).

## Install

```sh
bun add @finon/connect
```

## Design

- **Zero infrastructure coupling.** No database, no auth provider, no encryption, no environment variables. Just `fetch` and TypeScript.
- **Bring your own persistence.** The library returns credentials and normalized data. You store them (encrypt the tokens) and decide what to do with the data.
- **Normalized model.** Every provider maps its payloads into the same `Asset` / `Transaction` shapes. The original payload is always on `raw`.
- **Uniform contract.** OAuth providers implement the `Connection` interface and API-key providers implement `ApiKeyConnection`; both hand out the same `Session`, so adding providers does not change how you consume data.

## Quick start: Trading 212 (API key)

Trading 212 has no OAuth flow. The user generates a key pair in the app (Settings > API (Beta)) with the "Account Info", "Portfolio", "History - Transactions" and "History - Orders" permissions and pastes it into your product.

```ts
import { Trading212 } from "@finon/connect";

const trading212 = new Trading212(); // or { environment: "demo" } for practice accounts

// 1. Verify the key pair the user submitted. Returns the names of any
//    missing permissions; empty means the key is fully usable.
const credentials = { apiKey, apiSecret };
const missing = await trading212.verify(credentials);
if (missing.length > 0) throw new Error(`Key is missing: ${missing.join(", ")}`);
// persist `credentials` (encrypted) keyed to this user

// 2. Open a session and pull normalized data. The session respects
//    Trading 212's per-endpoint rate limits and follows pagination.
const session = trading212.session(credentials);
const { assets, transactions } = await session.sync();
```

`assets` contains one cash asset plus one stock asset per open position (instrument names and exchange symbols resolved from Trading 212's metadata catalogue). `transactions` contains cash movements (deposits, withdrawals, interest, fees) and order fills (`bought` / `sold`, with taxes summed into `fees`).

## Quick start: Coinbase (OAuth)

```ts
import { Coinbase } from "@finon/connect";

const coinbase = new Coinbase({
  clientId: process.env.COINBASE_CLIENT_ID!,
  clientSecret: process.env.COINBASE_CLIENT_SECRET!,
  redirectUri: "https://example.com/connect/coinbase/callback",
});

// 1. Send the user to Coinbase to authorize.
const url = coinbase.getAuthorizationUrl({ state: "csrf-token" });
// redirect(url)

// 2. In your callback handler, exchange the code for credentials.
const credentials = await coinbase.exchangeCode(code);
// persist `credentials` (encrypt the tokens) keyed to this user

// 3. Open a session and pull normalized data. Tokens refresh automatically.
const session = coinbase.session(credentials, {
  onRefresh: (creds) => saveCredentials(userId, creds), // persist refreshed tokens
});

const { assets, transactions } = await session.sync();
```

### Incremental sync

Pass `since` (a Unix timestamp in seconds) to fetch only newer transactions:

```ts
const { transactions } = await session.sync({ since: lastSyncedAt });
```

### Working with a single asset

```ts
const assets = await session.getAssets();
for (const asset of assets) {
  const txns = await session.getTransactions({ asset, since: lastSyncedAt });
}
```

## The normalized model

Two nouns, everywhere: what the user **holds** (assets) and what **happened** (transactions). Anything provider-specific stays on `raw`.

```ts
interface Asset {
  id: string;               // provider id for this holding
  type: AssetType;          // "crypto" | "cash" | "stock" | "savings"
  name: string;             // "Apple", "Bitcoin Wallet"
  symbol: string;           // "BTC", "AAPL", "USD"
  slug: string;             // provider asset identifier ("bitcoin", "AAPL_US_EQ")
  quantity: number;         // units held; balance for cash
  currency?: string;        // denomination currency, when the provider reports one
  raw: unknown;             // original provider payload
}

interface Transaction {
  id: string;
  flow: TransactionFlow;    // in | out | move | earned | bought | sold | other
  quantity: string;         // positive, precision-preserving
  assetSymbol: string;
  amount: number;           // monetary value, signed (negative = money out)
  currency: string;         // currency `amount` is denominated in
  fees: number;
  status: string;
  createdAt: number;        // Unix seconds
  rawType: string;          // original provider type
  raw: unknown;
}
```

> Note: `amount` is the valuation the provider reports, in the provider's currency for that transaction. The library does **not** convert to a single reporting currency (e.g. USD) — that, and persistence, is the consumer's job.

## Provider registry

Every provider ships static metadata — enough to render a "connect an account" picker without hardcoding provider knowledge:

```ts
import { providers } from "@finon/connect";
// or individually: import { trading212Metadata, coinbaseMetadata } from "@finon/connect";

for (const provider of providers) {
  provider.id;         // "trading212"
  provider.name;       // "Trading 212"
  provider.auth;       // "oauth" | "api-key" — which flow to run
  provider.assetTypes; // what a session can return, e.g. [stock, cash]
  provider.countries;  // ISO 3166-1 alpha-2, when specified
  provider.website;    // and optionally appUrl (mobile deep link)
  provider.setup;      // user-facing steps to show before the credential form
}
```

`setup` steps are plain descriptions; when one contains the `{{link}}` placeholder, render its `link` there (see the playground for a reference implementation). OAuth providers have an empty `setup` — the redirect does the walking.

## Advanced / stateless use

If you do not want the provider classes, every piece is exported as a pure function:

```ts
import {
  // Coinbase
  buildAuthorizationUrl,
  exchangeCode,
  refreshToken,
  fetchAccounts,
  fetchTransactions,
  classifyTransactionFlow,
  normalizeAccount,
  normalizeTransaction,
  // Trading 212
  verifyPermissions,
  fetchCash,
  fetchPortfolio,
  fetchOrders,
  fetchCashTransactions,
  fetchInstruments,
  classifyOrderFlow,
  normalizePosition,
  normalizeOrder,
} from "@finon/connect";
```

The classification helpers (`classifyTransactionFlow`, `getTransactionFees`, `classifyAccountType` for Coinbase; `classifyCashTransactionFlow`, `classifyOrderFlow`, `getOrderFees` for Trading 212) encode each provider's transaction-type taxonomy and are useful on their own.

## Adding a provider

Implement the `Connection` (OAuth) or `ApiKeyConnection` (key pair) interface from the core module:

```ts
import type { ApiKeyConnection, Connection, Session } from "@finon/connect";
```

An OAuth provider supplies `getAuthorizationUrl`, `exchangeCode`, `refresh`, and `session()`; an API-key provider supplies `verify` and `session()`. The session returns `Asset[]` / `Transaction[]`. Follow the structure under `src/connections/coinbase` or `src/connections/trading212` (`api`, `normalize`, `session`, the configured class).

## Development

```sh
bun install
bun run typecheck
bun test
```

## License

MIT
