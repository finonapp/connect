import { ConnectError } from "../../core/errors";
import type { ApiKeyCredentials } from "../../core/types";
import { PROVIDER_ID } from "./constants";

/**
 * Rate-limit-aware HTTP client for the Trading 212 API.
 *
 * Trading 212 rate-limits per endpoint and per API key, reporting the bucket
 * state via `x-ratelimit-*` headers. The client remembers each bucket, waits
 * out exhausted ones before firing, and retries 429s with a capped backoff.
 */

interface Bucket {
	remaining: number | null;
	/** Epoch milliseconds at which the bucket refills. */
	resetAt: number | null;
}

const MAX_RETRIES = 3;
/** Cap a single sleep; the longest documented limit period is 1 minute. */
const MAX_WAIT_MS = 70_000;

const buckets = new Map<string, Bucket>();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Basic auth value for a Trading 212 key pair. */
export function encodeKey(credentials: ApiKeyCredentials): string {
	return Buffer.from(`${credentials.apiKey}:${credentials.apiSecret}`, "utf-8").toString("base64");
}

/** Limits are per endpoint (ignoring the query) and per API key. */
function bucketKey(url: string, credentials: ApiKeyCredentials): string {
	return `${credentials.apiKey}:${new URL(url).pathname}`;
}

/** Header is documented as a unix timestamp; tolerate seconds or milliseconds. */
function toEpochMs(reset: number): number {
	return reset < 1e12 ? reset * 1000 : reset;
}

function parseRateLimitHeader(value: string | null): number | null {
	if (value === null || value.trim() === "") return null;

	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function readBucket(response: Response): Bucket | null {
	const remaining = parseRateLimitHeader(response.headers.get("x-ratelimit-remaining"));
	const reset = parseRateLimitHeader(response.headers.get("x-ratelimit-reset"));
	if (remaining === null && reset === null) return null;

	return {
		remaining,
		resetAt: reset !== null ? toEpochMs(reset) : null,
	};
}

function waitTimeFor(bucket: Bucket | undefined, fallbackMs: number): number {
	if (!bucket) return fallbackMs;
	if (bucket.remaining !== null && bucket.remaining > 0) return 0;
	if (bucket.resetAt === null) return fallbackMs;

	// Bucket exhausted: wait until the reset timestamp (plus a small buffer).
	const wait = bucket.resetAt - Date.now() + 500;
	return Math.min(Math.max(wait, 0), MAX_WAIT_MS);
}

/** Authenticated GET against the Trading 212 API, respecting rate limits. */
export async function t212Fetch<T>(url: string, credentials: ApiKeyCredentials): Promise<T> {
	const bucket = bucketKey(url, credentials);

	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		const preWait = waitTimeFor(buckets.get(bucket), 0);
		if (preWait > 0) await sleep(preWait);

		let response: Response;
		try {
			response = await fetch(url, {
				headers: {
					"Content-Type": "application/json",
					Authorization: `Basic ${encodeKey(credentials)}`,
				},
			});
		} catch (error) {
			throw new ConnectError(PROVIDER_ID, `Network error contacting Trading 212 API (${url})`, { cause: error });
		}

		const state = readBucket(response);
		if (state) buckets.set(bucket, state);

		if (response.status === 429) {
			const backoff = 2 ** attempt * 3000;
			const wait = waitTimeFor(state ?? undefined, backoff);
			await sleep(Math.max(wait, backoff));
			continue;
		}

		if (!response.ok) {
			const body = await response.text().catch(() => "");
			throw new ConnectError(PROVIDER_ID, `Trading 212 API request failed (${response.status}): ${body}`, {
				status: response.status,
			});
		}

		return (await response.json()) as T;
	}

	throw new ConnectError(PROVIDER_ID, `Trading 212 request still rate limited after ${MAX_RETRIES} retries: ${url}`, {
		status: 429,
	});
}
