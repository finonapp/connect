import { createHash } from "node:crypto";
import type { Asset, Transaction } from "../../core/types";
import { AssetType, TransactionFlow } from "../../core/types";
import { CASH_ASSET_ID, CASH_ISA_ASSET_ID, INSTRUMENTS, PRODUCT_CASH_ISA, STATEMENT_CURRENCY } from "./constants";
import { toUnixSeconds } from "./parse";
import type {
	MoneyboxHolding,
	MoneyboxInstrument,
	MoneyboxStatement,
	MoneyboxTransaction,
	MoneyboxTransactionKind,
} from "./types";

/** Name printed for the cash line of the holdings table. */
export const CASH_HOLDING_NAME = "Cash";

const FLOW_BY_KIND: Record<MoneyboxTransactionKind, TransactionFlow> = {
	purchase: TransactionFlow.BOUGHT,
	sale: TransactionFlow.SOLD,
	deposit: TransactionFlow.IN,
	withdrawal: TransactionFlow.OUT,
	interest: TransactionFlow.EARNED,
	dividend: TransactionFlow.EARNED,
	fee: TransactionFlow.OUT,
	other: TransactionFlow.OTHER,
};

/** How a stock holding or trade is identified across the library. */
export interface StockIdentity {
	/** `SYMBOL:EXCHANGE` when the instrument is known, otherwise the ISIN, otherwise the name. */
	id: string;
	symbol: string;
	exchange?: string;
	currency?: string;
	instrument?: MoneyboxInstrument;
}

/** Look an instrument up by either of its printed names, or by ISIN. */
export function findInstrument(name?: string, isin?: string): MoneyboxInstrument | undefined {
	const needle = name?.trim().toLowerCase();
	return INSTRUMENTS.find(
		(instrument) =>
			(isin !== undefined && instrument.isin === isin) ||
			(needle !== undefined &&
				(instrument.longName.toLowerCase() === needle || instrument.shortName.toLowerCase() === needle)),
	);
}

/**
 * Resolve the identity of a fund from what the statement prints. Holdings only
 * carry a name; trades carry a name and an ISIN. Unknown funds fall back to
 * the ISIN, then the name, so nothing the user holds is dropped.
 */
export function identifyStock(name: string, isin?: string): StockIdentity {
	const instrument = findInstrument(name, isin);
	const resolvedIsin = instrument?.isin ?? isin;

	if (instrument?.symbol) {
		return {
			id: instrument.exchange ? `${instrument.symbol}:${instrument.exchange}` : instrument.symbol,
			symbol: instrument.symbol,
			exchange: instrument.exchange,
			currency: instrument.currency,
			instrument,
		};
	}

	return { id: resolvedIsin ?? name, symbol: resolvedIsin ?? name, currency: instrument?.currency, instrument };
}

/** Deterministic id for a statement line: same line in two statements hashes the same. */
export function transactionId(transaction: MoneyboxTransaction): string {
	return createHash("sha256")
		.update(`${transaction.date}|${transaction.details}|${transaction.balance}`)
		.digest("hex")
		.slice(0, 32);
}

/**
 * The id of the asset a statement line belongs to: the traded fund for
 * purchases and sales, otherwise the cash balance of the product.
 */
export function transactionAssetId(transaction: MoneyboxTransaction, statement: MoneyboxStatement): string {
	if ((transaction.kind === "purchase" || transaction.kind === "sale") && transaction.assetName) {
		return identifyStock(transaction.assetName, transaction.isin).id;
	}
	return statement.product === PRODUCT_CASH_ISA ? CASH_ISA_ASSET_ID : CASH_ASSET_ID;
}

/**
 * Normalize a holdings row. The cash line becomes the GBP cash asset; any
 * other row a stock asset with its units as quantity. `transactions` from the
 * same statement help identify funds missing from the instrument map, via the
 * ISIN printed on their trades.
 */
export function normalizeHolding(
	holding: MoneyboxHolding,
	transactions: MoneyboxTransaction[] = [],
): Asset<MoneyboxHolding> {
	if (holding.name === CASH_HOLDING_NAME) {
		return {
			id: CASH_ASSET_ID,
			type: AssetType.CASH,
			name: STATEMENT_CURRENCY,
			symbol: STATEMENT_CURRENCY,
			quantity: holding.value,
			currency: STATEMENT_CURRENCY,
			raw: holding,
		};
	}

	const name = holding.name.toLowerCase();
	const isin = transactions.find((t) => t.isin && t.assetName?.toLowerCase() === name)?.isin;
	const identity = identifyStock(holding.name, isin);

	return {
		id: identity.id,
		type: AssetType.STOCK,
		name: holding.name,
		symbol: identity.symbol,
		exchange: identity.exchange,
		quantity: holding.units ?? 0,
		currency: identity.currency,
		raw: holding,
	};
}

/** A Cash ISA is one savings balance: the product value at the end of the statement. */
export function normalizeCashIsa(statement: MoneyboxStatement): Asset<MoneyboxStatement> {
	return {
		id: CASH_ISA_ASSET_ID,
		type: AssetType.SAVINGS,
		name: PRODUCT_CASH_ISA,
		symbol: STATEMENT_CURRENCY,
		quantity: statement.closingValue ?? statement.closingCashBalance ?? 0,
		currency: STATEMENT_CURRENCY,
		raw: statement,
	};
}

/** Every asset a statement describes. */
export function normalizeAssets(statement: MoneyboxStatement): Asset[] {
	if (statement.product === PRODUCT_CASH_ISA) return [normalizeCashIsa(statement)];
	return statement.holdings.map((holding) => normalizeHolding(holding, statement.transactions));
}

/**
 * Normalize a statement line. `amount` is the cash that actually moved
 * (fee included, negative when money left the account); for trades the
 * pre-fee "net cost" / "net received" stays on `raw.netAmount`.
 */
export function normalizeTransaction(transaction: MoneyboxTransaction): Transaction<MoneyboxTransaction> {
	const isTrade = transaction.kind === "purchase" || transaction.kind === "sale";
	const identity =
		isTrade && transaction.assetName ? identifyStock(transaction.assetName, transaction.isin) : undefined;

	return {
		id: transactionId(transaction),
		flow: FLOW_BY_KIND[transaction.kind],
		quantity: String(isTrade ? (transaction.units ?? 0) : transaction.movement),
		assetSymbol: identity?.symbol ?? STATEMENT_CURRENCY,
		amount: transaction.direction === "in" ? transaction.movement : -transaction.movement,
		currency: STATEMENT_CURRENCY,
		fees: transaction.fee,
		status: "completed",
		createdAt: toUnixSeconds(transaction.date),
		raw: transaction,
	};
}
