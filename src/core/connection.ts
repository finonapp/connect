import type { ApiKeyCredentials, Asset, Credentials, Transaction } from "./types";

/** Options for fetching transactions. */
export interface FetchOptions {
	/**
	 * Restrict to transactions of a single asset (as returned by
	 * `getAssets`). Omit to fetch across the whole connected account.
	 */
	asset?: Asset;
	since?: number;
}

/**
 * An authenticated session for one connected account. OAuth sessions
 * transparently refresh the access token when expired (notifying via
 * `onRefresh`); API-key sessions authenticate every request with the key pair.
 */
export interface Client<C = Credentials> {
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

/**
 * Client contract for API-key providers. On top of the data methods, the key
 * pair can be verified before being persisted.
 */
export interface ApiKeyClient extends Client<ApiKeyCredentials> {
	/**
	 * Probe the API with the client's key pair and return the human-readable
	 * names of the permissions the key is missing. An empty array means the
	 * key is valid and fully usable.
	 */
	verify(): Promise<string[]>;
}
