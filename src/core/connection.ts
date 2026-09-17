import type { Asset, Credentials, Transaction } from "./types";

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
 * `onRefresh`); API-key sessions authenticate every request with the key pair;
 * file-import sessions read everything from the statement files they were
 * given.
 *
 * Build one with `createClient`, which verifies the credentials before handing
 * the client back. Use `new provider.Client(credentials)` directly only to
 * rebuild a client from credentials that were already verified and stored.
 */
export interface Client<C = Credentials> {
	/** The current credentials (updated in place after a refresh). */
	readonly credentials: C;

	/**
	 * Check the credentials are usable: probe the API with the key pair, or
	 * parse the statement files. Resolves when everything is in order and
	 * throws a `ConnectError` describing what is wrong (missing permissions,
	 * unreadable files) otherwise. `createClient` calls this for you.
	 */
	verify(): Promise<void>;

	/** Fetch and normalize everything the user holds. */
	getAssets(): Promise<Asset[]>;

	/**
	 * Fetch and normalize transactions across the connected account, or for a
	 * single asset via `options.asset`.
	 */
	getTransactions(options?: FetchOptions): Promise<Transaction[]>;
}
