/**
 * Error thrown for any failure originating in a connection (OAuth exchange,
 * token refresh, or an API request). Carries the provider id and an optional
 * HTTP status so consumers can branch on it.
 */
export class ConnectError extends Error {
	readonly provider: string;
	readonly status?: number;
	override readonly cause?: unknown;

	constructor(provider: string, message: string, options?: { status?: number; cause?: unknown }) {
		super(message);
		this.name = "ConnectError";
		this.provider = provider;
		this.status = options?.status;
		this.cause = options?.cause;
	}
}
