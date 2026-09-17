import { ConnectError } from "../../core/errors";
import type { ApiKeyCredentials } from "../../core/types";
import { t212Fetch } from "./client";
import {
	ACCOUNT_SUMMARY_PATH,
	CASH_TRANSACTIONS_PATH,
	DIVIDENDS_PATH,
	EXCHANGES_PATH,
	INSTRUMENTS_PATH,
	ORDERS_PATH,
	PERMISSION_ACCOUNT,
	PERMISSION_HISTORY_DIVIDENDS,
	PERMISSION_HISTORY_ORDERS,
	PERMISSION_HISTORY_TRANSACTIONS,
	PERMISSION_METADATA,
	PERMISSION_PORTFOLIO,
	POSITIONS_PATH,
	PROVIDER_ID,
	TRANSACTIONS_PAGE_SIZE,
} from "./constants";
import { buildInstrumentIndex } from "./normalize";
import type {
	Trading212AccountSummary,
	Trading212CashTransaction,
	Trading212CatalogueInstrument,
	Trading212Dividend,
	Trading212Exchange,
	Trading212Instrument,
	Trading212OrderEvent,
	Trading212Paginated,
	Trading212Position,
} from "./types";

/** Options for the paginated history fetchers. */
export interface PaginationOptions {
	since?: number;
	ticker?: string;
}

function toUnixSeconds(date: string): number {
	return Math.floor(new Date(date).getTime() / 1000);
}

/**
 * Follow a cursor-paginated Trading 212 list to the end, optionally stopping
 * early once items are older than `since` (items are returned newest-first).
 */
async function fetchPaginated<T>(
	baseUrl: string,
	path: string,
	params: string,
	credentials: ApiKeyCredentials,
	createdAt: (item: T) => string | undefined,
	options: PaginationOptions = {},
): Promise<T[]> {
	const items: T[] = [];
	let fullUrl: string | null = params ? `${baseUrl}${path}?${params}` : `${baseUrl}${path}`;

	while (fullUrl) {
		const page: Trading212Paginated<T> = await t212Fetch<Trading212Paginated<T>>(fullUrl, credentials);

		if (page.items.length === 0 || page.nextPagePath === null || page.nextPagePath.startsWith("null")) {
			fullUrl = null;
		} else {
			fullUrl = page.nextPagePath?.startsWith("/")
				? `${baseUrl}${page.nextPagePath}`
				: `${baseUrl}${path}?${page.nextPagePath}`;
		}

		for (const item of page.items ?? []) {
			const date = createdAt(item);
			if (options.since !== undefined && date !== undefined && toUnixSeconds(date) < options.since) {
				return items;
			}
			items.push(item);
		}
	}

	return items;
}

/** Fetch the account's cash and investment summary (id, currency, balances). */
export function fetchAccountSummary(
	baseUrl: string,
	credentials: ApiKeyCredentials,
): Promise<Trading212AccountSummary> {
	return t212Fetch<Trading212AccountSummary>(baseUrl + ACCOUNT_SUMMARY_PATH, credentials);
}

/** Fetch all open positions. Pass `ticker` to restrict to one instrument. */
export function fetchPositions(
	baseUrl: string,
	credentials: ApiKeyCredentials,
	options: { ticker?: string } = {},
): Promise<Trading212Position[]> {
	const query = options.ticker ? `?${new URLSearchParams({ ticker: options.ticker })}` : "";
	const url = baseUrl + POSITIONS_PATH + query;
	return t212Fetch<Trading212Position[]>(url, credentials);
}

/**
 * Fetch the full instrument catalogue (ticker, name, exchange symbol,
 * currency). Heavily rate limited: fetch once and cache; sessions do this
 * automatically.
 */
export function fetchInstruments(baseUrl: string, credentials: ApiKeyCredentials): Promise<Trading212Instrument[]> {
	return t212Fetch<Trading212Instrument[]>(baseUrl + INSTRUMENTS_PATH, credentials);
}

/** Fetch the exchange list; joins to instruments via working schedule ids. */
export function fetchExchanges(baseUrl: string, credentials: ApiKeyCredentials): Promise<Trading212Exchange[]> {
	return t212Fetch<Trading212Exchange[]>(baseUrl + EXCHANGES_PATH, credentials);
}

/** Fetch cash movements (deposits, withdrawals, fees), following pagination. */
export function fetchCashTransactions(
	baseUrl: string,
	credentials: ApiKeyCredentials,
	options: PaginationOptions = {},
): Promise<Trading212CashTransaction[]> {
	const params = new URLSearchParams({ limit: String(TRANSACTIONS_PAGE_SIZE) });

	return fetchPaginated<Trading212CashTransaction>(
		baseUrl,
		CASH_TRANSACTIONS_PATH,
		params.toString(),
		credentials,
		(t) => t.dateTime,
		options,
	);
}

/**
 * Fetch historical order events, following pagination. Pass `ticker` to
 * restrict to a single instrument; omit it to fetch across the whole account.
 */
export function fetchOrders(
	baseUrl: string,
	credentials: ApiKeyCredentials,
	options: PaginationOptions = {},
): Promise<Trading212OrderEvent[]> {
	const params = new URLSearchParams({ limit: String(TRANSACTIONS_PAGE_SIZE) });
	if (options.ticker) params.set("ticker", options.ticker);

	return fetchPaginated<Trading212OrderEvent>(
		baseUrl,
		ORDERS_PATH,
		params.toString(),
		credentials,
		(e) => e.order?.createdAt,
		options,
	);
}

/**
 * Fetch paid-out dividends, following pagination. Pass `ticker` to restrict
 * to a single instrument; omit it to fetch across the whole account.
 */
export function fetchDividends(
	baseUrl: string,
	credentials: ApiKeyCredentials,
	options: PaginationOptions = {},
): Promise<Trading212Dividend[]> {
	const params = new URLSearchParams({ limit: String(TRANSACTIONS_PAGE_SIZE) });
	if (options.ticker) params.set("ticker", options.ticker);

	return fetchPaginated<Trading212Dividend>(
		baseUrl,
		DIVIDENDS_PATH,
		params.toString(),
		credentials,
		(d) => d.paidOn,
		options,
	);
}

/**
 * Probe one endpoint per required permission and throw a `ConnectError`
 * naming the permissions the key pair is missing. Resolves when the key is
 * fully usable.
 */
export async function verifyPermissions(baseUrl: string, credentials: ApiKeyCredentials): Promise<void> {
	const probes: Array<[string, () => Promise<unknown>]> = [
		[PERMISSION_ACCOUNT, () => fetchAccountSummary(baseUrl, credentials)],
		[PERMISSION_PORTFOLIO, () => fetchPositions(baseUrl, credentials)],
		[PERMISSION_METADATA, () => t212Fetch(`${baseUrl}${EXCHANGES_PATH}`, credentials)],
		[PERMISSION_HISTORY_TRANSACTIONS, () => t212Fetch(`${baseUrl}${CASH_TRANSACTIONS_PATH}?limit=1`, credentials)],
		[PERMISSION_HISTORY_ORDERS, () => t212Fetch(`${baseUrl}${ORDERS_PATH}?limit=1`, credentials)],
		[PERMISSION_HISTORY_DIVIDENDS, () => t212Fetch(`${baseUrl}${DIVIDENDS_PATH}?limit=1`, credentials)],
	];

	const missing: string[] = [];
	for (const [permission, probe] of probes) {
		try {
			await probe();
		} catch (_error) {
			missing.push(permission);
		}
	}

	if (missing.length > 0) {
		throw new ConnectError(PROVIDER_ID, `API key is missing permissions: ${missing.join(", ")}`, { status: 403 });
	}
}

/**
 * Module-level instrument index cache. The catalogue (instruments joined with
 * their exchanges via working schedule ids) is account-independent metadata,
 * so one fetch per base URL serves every session in the process; the TTL
 * eventually picks up newly listed instruments.
 */
const INSTRUMENTS_TTL_MS = 24 * 60 * 60 * 1000;
const instrumentIndexes = new Map<string, { index: Map<string, Trading212CatalogueInstrument>; fetchedAt: number }>();

export async function cachedInstrumentIndex(
	baseUrl: string,
	credentials: ApiKeyCredentials,
): Promise<Map<string, Trading212CatalogueInstrument>> {
	const cached = instrumentIndexes.get(baseUrl);
	if (cached && Date.now() - cached.fetchedAt < INSTRUMENTS_TTL_MS) return cached.index;

	const catalogue = Promise.all([
		fetchInstruments(baseUrl, credentials),
		// Exchanges only add the exchange code to identifiers; degrade to an
		// instruments-only index rather than failing the whole catalogue.
		fetchExchanges(baseUrl, credentials).catch((): Trading212Exchange[] => []),
	]).then(([instruments, exchanges]) => {
		const index = buildInstrumentIndex(instruments, exchanges);
		instrumentIndexes.set(baseUrl, { index, fetchedAt: Date.now() });
		return index;
	});

	try {
		return await catalogue;
	} catch (_error) {
		// Metadata only improves symbols and identifiers, so a failure (e.g. a
		// key without that scope) degrades to a stale or empty index instead
		// of failing the sync.
		return cached?.index ?? new Map();
	}
}
