import type { Asset, Transaction } from "../../core/types";
import { AssetType, TransactionFlow } from "../../core/types";
import { EXCHANGE_SYMBOLS } from "./constants";
import type {
	Trading212AccountSummary,
	Trading212CashTransaction,
	Trading212CatalogueInstrument,
	Trading212Dividend,
	Trading212Exchange,
	Trading212Instrument,
	Trading212OrderEvent,
	Trading212Position,
} from "./types";

/**
 * Classification of Trading 212 cash transaction `type` values into flows.
 * Anything unknown falls back to the sign of the amount.
 */
export const CASH_IN_TYPES = ["DEPOSIT"];
export const CASH_OUT_TYPES = ["WITHDRAW", "WITHDRAWAL", "FEE"];
export const CASH_EARNED_TYPES = ["INTEREST", "INTEREST_ON_FREE_CASH", "LENDING", "LENDING_INTEREST"];
export const CASH_MOVEMENT_TYPES = ["TRANSFER"];

/** Convert an ISO date string to a Unix timestamp in seconds. */
function toUnixSeconds(date: string): number {
	return Math.floor(new Date(date).getTime() / 1000);
}

/** Exchange symbol embedded in a Trading 212 ticker ("AAPL_US_EQ" -> "AAPL"). */
export function tickerSymbol(ticker: string): string {
	return ticker.split("_")[0] ?? ticker;
}

/**
 * Index the instrument catalogue by ticker, resolving each instrument's
 * exchange by joining `workingScheduleId` against the exchange list.
 */
export function buildInstrumentIndex(
	instruments: Trading212Instrument[],
	exchanges: Trading212Exchange[],
): Map<string, Trading212CatalogueInstrument> {
	const scheduleExchange = new Map<number, string>();
	for (const exchange of exchanges) {
		for (const schedule of exchange.workingSchedules ?? []) {
			scheduleExchange.set(schedule.id, exchange.name);
		}
	}

	return new Map(
		instruments.map((instrument) => {
			const exchangeName =
				instrument.workingScheduleId !== undefined ? scheduleExchange.get(instrument.workingScheduleId) : undefined;
			return [
				instrument.ticker,
				{
					ticker: instrument.ticker,
					symbol: instrument.shortName ?? tickerSymbol(instrument.ticker),
					name: instrument.name,
					isin: instrument.isin,
					exchangeName,
					exchangeSymbol: exchangeName ? EXCHANGE_SYMBOLS[exchangeName.toLowerCase()] : undefined,
					currency: instrument.currencyCode,
				},
			];
		}),
	);
}

/** Determine the {@link TransactionFlow} for a cash movement. */
export function classifyCashTransactionFlow(transaction: Trading212CashTransaction): TransactionFlow {
	const type = (transaction.type ?? "").toUpperCase();

	if (CASH_IN_TYPES.includes(type)) return TransactionFlow.IN;
	if (CASH_OUT_TYPES.includes(type)) return TransactionFlow.OUT;
	if (CASH_EARNED_TYPES.includes(type)) return TransactionFlow.EARNED;
	if (CASH_MOVEMENT_TYPES.includes(type)) return TransactionFlow.MOVE;

	return transaction.amount >= 0 ? TransactionFlow.IN : TransactionFlow.OUT;
}

/**
 * Determine the {@link TransactionFlow} for an order event, using the order
 * side and falling back to the sign of the cash impact (negative = cash spent
 * on a buy).
 */
export function classifyOrderFlow(event: Trading212OrderEvent): TransactionFlow {
	const side = event.order?.side?.toUpperCase();
	if (side === "BUY") return TransactionFlow.BOUGHT;
	if (side === "SELL") return TransactionFlow.SOLD;

	const netValue = event.fill?.walletImpact?.netValue;
	if (netValue !== undefined && netValue !== 0) {
		return netValue < 0 ? TransactionFlow.BOUGHT : TransactionFlow.SOLD;
	}

	return TransactionFlow.OTHER;
}

/** Total taxes/fees charged on a fill, in the order currency. */
export function getOrderFees(event: Trading212OrderEvent): number {
	const taxes = event.fill?.walletImpact?.taxes;
	if (!taxes) return 0;
	return taxes.reduce((total, tax) => total + Math.abs(tax.quantity ?? 0), 0);
}

/**
 * Normalize the account's cash balance into a cash asset. `quantity` is the
 * cash available to trade; cash inside pies or reserved for pending orders
 * stays visible on `raw.cash`.
 */
export function normalizeCashAccount(summary: Trading212AccountSummary): Asset<Trading212AccountSummary> {
	return {
		id: summary.currency.toLowerCase(),
		type: AssetType.CASH,
		name: summary.currency.toUpperCase(),
		symbol: summary.currency,
		quantity: summary.cash.availableToTrade,
		currency: summary.currency,
		raw: summary,
	};
}

/**
 * Normalize an open position into a stock asset. The position embeds its
 * instrument's name and currency; pass the matching catalogue instrument to
 * resolve the clean symbol and exchange. `id` is then a cross-provider
 * identifier in the legacy `SYMBOL:EXCHANGE` form (e.g. "AAPL:NASDAQ"),
 * falling back to the bare symbol when the exchange is unknown; the Trading
 * 212 ticker stays on `slug` (and `raw`).
 */
export function normalizePosition(
	position: Trading212Position,
	instrument?: Trading212CatalogueInstrument,
): Asset<Trading212Position> {
	const ticker = position.instrument.ticker;

	return {
		id: ticker,
		name: position.instrument.name ?? instrument?.name ?? ticker,
		type: AssetType.STOCK,
		symbol: instrument?.symbol ?? tickerSymbol(ticker),
		exchange: instrument?.exchangeSymbol ?? "",
		quantity: position.quantity,
		currency: instrument?.currency ?? position.instrument.currency,
		raw: position,
	};
}

/** Normalize a raw cash movement. `currency` is the account currency. */
export function normalizeCashTransaction(
	transaction: Trading212CashTransaction,
	currency: string,
): Transaction<Trading212CashTransaction> {
	return {
		id: transaction.reference,
		flow: classifyCashTransactionFlow(transaction),
		quantity: String(Math.abs(transaction.amount)),
		assetSymbol: transaction.currency ?? currency,
		amount: transaction.amount,
		currency: transaction.currency ?? currency,
		fees: 0,
		status: "completed",
		createdAt: toUnixSeconds(transaction.dateTime),
		raw: transaction,
	};
}

/**
 * Normalize a dividend payout into an earned cash transaction. The paying
 * instrument stays available on `raw` (ticker, quantity, per-share amount).
 * `fallbackCurrency` (the account currency) is used when the payout carries
 * no currency of its own.
 */
export function normalizeDividend(
	dividend: Trading212Dividend,
	fallbackCurrency: string,
): Transaction<Trading212Dividend> {
	const currency = dividend.currency ?? fallbackCurrency;
	console.log("Normalizing dividend asset: " + currency);
	return {
		id: dividend.reference,
		flow: TransactionFlow.EARNED,
		quantity: String(Math.abs(dividend.amount)),
		assetSymbol: currency,
		amount: dividend.amount,
		currency,
		fees: 0,
		status: "completed",
		createdAt: toUnixSeconds(dividend.paidOn),
		raw: dividend,
	};
}

/**
 * Normalize a raw order event. `fallbackCurrency` (the account currency) is
 * used when the order carries no currency of its own.
 */
export function normalizeOrder(
	event: Trading212OrderEvent,
	fallbackCurrency: string,
): Transaction<Trading212OrderEvent> {
	const { order, fill } = event;
	const quantity = Math.abs(fill?.quantity ?? order.filledQuantity ?? 0);
	const amount = fill?.walletImpact?.netValue ?? order.filledValue ?? 0;

	console.log("Normalizing order asset: " + order.ticker);

	return {
		id: fill?.id !== undefined ? `${order.id}-${fill.id}` : String(order.id),
		flow: classifyOrderFlow(event),
		quantity: String(quantity),
		assetSymbol: tickerSymbol(order.ticker),
		amount,
		currency: (fill?.walletImpact?.currency ?? order.currency ?? fallbackCurrency).toUpperCase(),
		fees: getOrderFees(event),
		status: order.status,
		createdAt: toUnixSeconds(fill?.filledAt ?? order.createdAt),
		raw: event,
	};
}
