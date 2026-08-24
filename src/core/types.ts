/** High-level kind of an asset held in an account. */
export enum AssetType {
	CRYPTO = "crypto",
	CASH = "cash",
	STOCK = "stock",
	SAVINGS = "savings",
}

/** Direction / nature of a transaction, after classification. */
export enum TransactionFlow {
	IN = "in",
	OUT = "out",
	MOVE = "move",
	EARNED = "earned",
	BOUGHT = "bought",
	SOLD = "sold",
	OTHER = "other",
}

export enum AuthKind {
	API_KEY = "api-key",
	OAUTH = "oauth",
}

/**
 * Credentials for a connected account, whatever the auth kind.
 *
 * Secrets are handled in plain text. Encrypt them yourself before persisting.
 */
export type Credentials = ApiKeyCredentials | OAuthCredentials;

export interface ApiKeyCredentials {
	apiKey: string;
	apiSecret: string;
}

export interface OAuthCredentials {
	clientId: string;
	clientSecret: string;
	/** The callback URL registered with the provider. */
	redirectUri: string;
}

/**
 * Something the user holds at the provider: a cash balance, a stock position,
 * a crypto wallet. Providers map whatever they call it (account, wallet,
 * position) into this shape. Provider-specific detail lives on `raw`.
 */
export interface Asset<Raw = unknown> {
	id: string;
	type: AssetType;
	name: string;
	symbol: string;
	quantity: number;
	exchange?: string;
	currency?: string;
	raw: Raw;
}

/** A normalized transaction. */
export interface Transaction<Raw = unknown> {
	/** Provider transaction id. */
	id: string;
	flow: TransactionFlow;
	/**
	 * Quantity of the asset moved, kept as a string to preserve precision.
	 * Always positive (use `flow` for direction).
	 */
	quantity: string;
	/** Asset code the quantity is denominated in (e.g. "BTC"). */
	assetSymbol: string;
	/** Monetary value of the transaction, signed (negative = money out). */
	amount: number;
	/** Currency `amount` is denominated in (e.g. "USD", "EUR"). */
	currency: string;
	/** Fees charged for the transaction, in `currency`. */
	fees: number;
	status: string;
	/** Unix timestamp in seconds. */
	createdAt: number;
	/** Original provider payload. */
	raw: Raw;
}
