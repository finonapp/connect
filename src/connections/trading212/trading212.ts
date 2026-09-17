import type { Client, FetchOptions, Transaction } from "../../core";
import { AssetType, type ApiKeyCredentials, type Asset } from "../../core/types";
import {
	cachedInstrumentIndex,
	fetchAccountSummary,
	fetchCashTransactions,
	fetchDividends,
	fetchOrders,
	fetchPositions,
	verifyPermissions,
} from "./api";
import { LIVE_BASE_URL, PROVIDER_ID, PROVIDER_NAME } from "./constants";
import {
	normalizeCashAccount,
	normalizeCashTransaction,
	normalizeDividend,
	normalizeOrder,
	normalizePosition,
} from "./normalize";
import type { Trading212AccountSummary, Trading212CatalogueInstrument } from "./types";

/**
 * Trading 212 connection client.
 *
 * Trading 212 uses API keys instead of OAuth: the user generates a key pair
 * in the app (Settings > API (Beta)) with the "Account Data", "Portfolio",
 * "Metadata", "History - Transactions", "History - Orders" and
 * "History - Dividends" permissions, and pastes it into your product.
 *
 * @example
 * ```ts
 * // 1. Verify the key pair the user submitted.
 * const client = new Trading212Client({ apiKey, apiSecret });
 * const missing = await client.verify();
 * if (missing.length > 0) throw new Error(`Key is missing: ${missing.join(", ")}`);
 * // ...persist the credentials (encrypted) for this user.
 *
 * // 2. Later, pull normalized data with a client built from the stored keys.
 * const assets = await client.getAssets();
 * const transactions = await client.getTransactions();
 * ```
 */
export class Trading212Client implements Client<ApiKeyCredentials> {
	readonly id = PROVIDER_ID;
	readonly name = PROVIDER_NAME;
	private readonly baseUrl = LIVE_BASE_URL;

	readonly credentials: ApiKeyCredentials;
	private summary: Trading212AccountSummary | null = null;

	constructor(credentials: ApiKeyCredentials) {
		this.credentials = credentials;
	}

	async verify(): Promise<void> {
		await verifyPermissions(this.baseUrl, this.credentials);
	}

	/** Fetch (and cache) the account summary; provides the account currency. */
	private async accountSummary(): Promise<Trading212AccountSummary> {
		if (!this.summary) {
			this.summary = await fetchAccountSummary(this.baseUrl, this.credentials);
		}
		return this.summary;
	}

	private async getInstrumentIndex(): Promise<Map<string, Trading212CatalogueInstrument>> {
		return cachedInstrumentIndex(this.baseUrl, this.credentials);
	}

	async getAssets(): Promise<Asset[]> {
		const [summary, assets, instruments] = await Promise.all([
			this.accountSummary(),
			fetchPositions(this.baseUrl, this.credentials),
			this.getInstrumentIndex(),
		]);

		return [
			normalizeCashAccount(summary),
			...assets.map((asset) => normalizePosition(asset, instruments.get(asset.instrument.ticker))),
		];
	}

	async getTransactions(options: FetchOptions = {}): Promise<Transaction[]> {
		const { currency } = await this.accountSummary();
		const { asset, since } = options;

		let transactions: Transaction[];
		if (asset === undefined) {
			const [cashTransactions, orderEvents, dividends] = await Promise.all([
				fetchCashTransactions(this.baseUrl, this.credentials, { since }),
				fetchOrders(this.baseUrl, this.credentials, { since }),
				fetchDividends(this.baseUrl, this.credentials, { since }),
			]);

			transactions = [
				...cashTransactions.map((transaction) => normalizeCashTransaction(transaction, currency)),
				...orderEvents
					.filter((event) => event.order?.status !== "CANCELLED")
					.map((event) => normalizeOrder(event, currency)),
				...dividends.map((dividend) => normalizeDividend(dividend, currency)),
			];
		} else if (asset.type === AssetType.CASH) {
			const raw = await fetchCashTransactions(this.baseUrl, this.credentials, { since });
			transactions = raw.map((transaction) => normalizeCashTransaction(transaction, currency));
		} else {
			const [orderEvents, dividends] = await Promise.all([
				fetchOrders(this.baseUrl, this.credentials, { ticker: asset.id, since }),
				fetchDividends(this.baseUrl, this.credentials, { ticker: asset.id, since }),
			]);

			transactions = [
				...orderEvents
					.filter((event) => event.order?.status !== "CANCELLED")
					.map((event) => normalizeOrder(event, currency)),
				...dividends.map((dividend) => normalizeDividend(dividend, currency)),
			];
		}

		if (since !== undefined) {
			transactions = transactions.filter((t) => t.createdAt >= since);
		}
		return transactions;
	}
}
