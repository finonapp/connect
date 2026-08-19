import type { ApiKeyCredentials, Asset, Credentials, Transaction } from "./types";

/** Options accepted when building a provider authorization URL. */
export interface AuthorizationUrlOptions {
	/** Opaque value echoed back to your callback. Use it for CSRF / correlation. */
	state?: string;
	/** Override the default OAuth scopes. */
	scopes?: string[];
}

/** Options for an authenticated session. */
export interface SessionOptions {
	/**
	 * Called whenever the access token is refreshed, with the new credentials.
	 * Persist them so the next session starts with fresh tokens.
	 */
	onRefresh?: (credentials: Credentials) => void | Promise<void>;
}

/** Options for syncing. */
export interface SyncOptions {
	/**
	 * Only return transactions created at or after this Unix timestamp (seconds).
	 * Enables incremental syncs.
	 */
	since?: number;
}

/** Options for fetching transactions. */
export interface FetchOptions extends SyncOptions {
	/**
	 * Restrict to transactions of a single asset (as returned by
	 * `getAssets`). Omit to fetch across the whole connected account.
	 */
	asset?: Asset;
}

/**
 * Contract implemented by every OAuth provider in this library (the
 * configured client, e.g. `Coinbase`). Implementing this keeps the surface
 * uniform as new providers are added.
 */
export interface Connection {
	/** Stable provider id, e.g. "coinbase". */
	readonly id: string;
	/** Human readable provider name, e.g. "Coinbase". */
	readonly name: string;

	/** Build the URL to redirect a user to, to begin the OAuth flow. */
	getAuthorizationUrl(options?: AuthorizationUrlOptions): string;

	/** Exchange the authorization `code` from the callback for credentials. */
	exchangeCode(code: string): Promise<Credentials>;

	/** Exchange a refresh token for a fresh set of credentials. */
	refresh(refreshToken: string): Promise<Credentials>;

	/** Create an authenticated session for a connected account. */
	session(credentials: Credentials, options?: SessionOptions): Session;
}

/**
 * Contract implemented by API-key providers (the configured client, e.g.
 * `Trading212`). There is no browser flow: the user pastes a key pair, you
 * `verify` it, then open sessions with it.
 */
export interface ApiKeyConnection {
	/** Stable provider id, e.g. "trading212". */
	readonly id: string;
	/** Human readable provider name, e.g. "Trading 212". */
	readonly name: string;

	/**
	 * Probe the API with the given key pair and return the human-readable
	 * names of the permissions the key is missing. An empty array means the
	 * key is valid and fully usable.
	 */
	verify(credentials: ApiKeyCredentials): Promise<string[]>;

	/** Create an authenticated session for a connected account. */
	session(credentials: ApiKeyCredentials): Session<ApiKeyCredentials>;
}

/**
 * An authenticated session for one connected account. OAuth sessions
 * transparently refresh the access token when expired (notifying via
 * `onRefresh`); API-key sessions authenticate every request with the key pair.
 */
export interface Session<C = Credentials> {
	/** The current credentials (updated in place after a refresh). */
	readonly credentials: C;

	/** Fetch and normalize everything the user holds. */
	getAssets(): Promise<Asset[]>;

	/**
	 * Fetch and normalize transactions across the connected account, or for a
	 * single asset via `options.asset`.
	 */
	getTransactions(options?: FetchOptions): Promise<Transaction[]>;
}
