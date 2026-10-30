import type { Client, FetchOptions } from "../../core";
import { ConnectError } from "../../core/errors";
import type { Asset, Transaction } from "../../core/types";
import { fetchAccountAssets, fetchSpotOrders, verifyCredentials } from "./api";
import { HISTORY_ORDERS_PAGE_SIZE, PROVIDER_ID, PROVIDER_NAME } from "./constants";
import { normalizeAsset, normalizeTransaction } from "./normalize";
import type { BitgetApiCredentials, BitgetSpotOrder } from "./types";

/** Bitget spot-account connection using an API key and secret. */
export class BitgetClient implements Client<BitgetApiCredentials> {
	readonly id = PROVIDER_ID;
	readonly name = PROVIDER_NAME;
	readonly credentials: BitgetApiCredentials;

	constructor(credentials: BitgetApiCredentials) {
		this.credentials = credentials;
	}

	async verify(): Promise<void> {
		await verifyCredentials(this.credentials);
	}

	async getAssets(): Promise<Asset[]> {
		const assets = await fetchAccountAssets(this.credentials);
		return assets.map(normalizeAsset);
	}

	async getTransactions(options: FetchOptions = {}): Promise<Transaction[]> {
		const since = options.since;
		let cursor: string | undefined;
		const orders: BitgetSpotOrder[] = [];
		const seenCursors = new Set<string>();

		while (true) {
			const page = await fetchSpotOrders(this.credentials, { since, idLessThan: cursor });
			orders.push(...page);
			if (page.length < HISTORY_ORDERS_PAGE_SIZE) break;

			const nextCursor = page[page.length - 1]?.orderId;
			if (!nextCursor || seenCursors.has(nextCursor)) break;
			seenCursors.add(nextCursor);
			cursor = nextCursor;
		}

		let transactions = orders
			.filter((order) => Number(order.baseVolume) > 0)
			.filter(
				(order) => options.asset === undefined || order.baseCoin.toUpperCase() === options.asset.symbol.toUpperCase(),
			)
			.map(normalizeTransaction);

		if (since !== undefined) transactions = transactions.filter((transaction) => transaction.createdAt >= since);
		if (transactions.some((transaction) => !Number.isFinite(transaction.createdAt))) {
			throw new ConnectError(PROVIDER_ID, "Bitget returned an invalid order timestamp");
		}
		return transactions;
	}
}
