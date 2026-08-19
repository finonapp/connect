/**
 * Raw Trading 212 API payloads. These mirror what the Trading 212 REST API
 * (v0, "API Beta") returns; the library normalizes them into the shapes in
 * `core/types`.
 */

/** Cash and investment breakdown from `/equity/account/summary`. */
export interface Trading212AccountSummary {
	/** Primary trading account number, as shown in the Trading 212 app. */
	id: number;
	/** The account's primary currency in ISO 4217 format, e.g. "GBP". */
	currency: string;
	cash: {
		/** Funds available for investing. */
		availableToTrade: number;
		/** Uninvested cash sitting inside pies. */
		inPies: number;
		/** Cash reserved for pending orders, not available for new trades. */
		reservedForOrders: number;
	};
	investments: {
		currentValue: number;
		/** All-time realised profit/loss from executed trades. */
		realizedProfitLoss: number;
		/** Cost basis of the current investments. */
		totalCost: number;
		unrealizedProfitLoss: number;
	};
	/** Investments value in the account's primary currency. */
	totalValue: number;
}

/** Instrument summary embedded in positions, orders and dividends. */
export interface Trading212InstrumentRef {
	ticker: string;
	name?: string;
	isin?: string;
	currency?: string;
}

/** An open position from `/equity/positions`. */
export interface Trading212Position {
	instrument: Trading212InstrumentRef;
	/** Total quantity of shares owned. */
	quantity: number;
	/** Average price paid, in instrument currency, per share. */
	averagePricePaid: number;
	/** Current price, in instrument currency, of a single share. */
	currentPrice: number;
	/** ISO 8601 date of when the position was opened. */
	createdAt?: string;
	quantityAvailableForTrading?: number;
	quantityInPies?: number;
	/** Value and result of the position, in `walletImpact.currency`. */
	walletImpact?: {
		currency?: string;
		currentValue?: number;
		totalCost?: number;
		/** currentValue - totalCost. */
		unrealizedProfitLoss?: number;
		/** FX component of the result when instrument and account currency differ. */
		fxImpact?: number;
	};
}

/** Instrument metadata from `/equity/metadata/instruments`. */
export interface Trading212Instrument {
	/** Trading 212 ticker, e.g. "AAPL_US_EQ". Keys positions and orders. */
	ticker: string;
	/** e.g. "STOCK", "ETF". */
	type?: string;
	/** Exchange symbol, e.g. "AAPL". */
	shortName?: string;
	name: string;
	currencyCode: string;
	isin?: string;
	extendedHours?: boolean;
	workingScheduleId?: number;
	maxOpenQuantity?: number;
	addedOn?: string;
}

/** An exchange from `/equity/metadata/exchanges`. */
export interface Trading212Exchange {
	id: number;
	/** Display name, e.g. "London Stock Exchange". */
	name: string;
	/** Schedules whose ids appear as `workingScheduleId` on instruments. */
	workingSchedules?: Array<{ id: number; timeEvents?: unknown[] }>;
}

/**
 * A catalogue instrument enriched with its exchange, resolved by joining
 * `workingScheduleId` against the `/equity/metadata/exchanges` list.
 */
export interface Trading212CatalogueInstrument {
	/** Trading 212 ticker, e.g. "AAPL_US_EQ". Keys positions and orders. */
	ticker: string;
	/** e.g. "AAPL". */
	symbol: string;
	/** Full instrument name, e.g. "Apple Inc.". */
	name: string;
	/** ISIN code, e.g. "US0378331005". */
	isin?: string;
	/** Exchange display name, e.g. "London Stock Exchange". */
	exchangeName: string | undefined;
	/** Short exchange code used in asset identifiers, e.g. "LSE", "XETR". */
	exchangeSymbol: string | undefined;
	/** Instrument currency in ISO 4217 format. */
	currency: string;
}

/** Cursor-paginated list response. `nextPagePath` is a ready-to-fetch path. */
export interface Trading212Paginated<T> {
	items: T[];
	nextPagePath: string | null;
}

/** A cash movement from `/equity/history/transactions`. */
export interface Trading212CashTransaction {
	/** e.g. "DEPOSIT", "WITHDRAW", "FEE", "TRANSFER", "INTEREST_ON_FREE_CASH", "LENDING_INTEREST". */
	type: string;
	/** Signed amount in the currency of the transaction. */
	amount: number;
	/** Currency of the transaction. */
	currency?: string;
	/** Unique reference, used as the transaction id. */
	reference: string;
	dateTime: string;
}

/** A dividend payout from `/equity/history/dividends`. */
export interface Trading212Dividend {
	/** Unique reference, used as the transaction id. */
	reference: string;
	/** Trading 212 ticker of the paying instrument, e.g. "AAPL_US_EQ". */
	ticker?: string;
	/** e.g. "ORDINARY", "DIVIDEND", "INTEREST". */
	type?: string;
	/** Amount paid, in the account's primary currency. */
	amount: number;
	amountInEuro?: number;
	/** The account's primary currency. */
	currency?: string;
	/** Gross amount per share, in instrument currency. */
	grossAmountPerShare?: number;
	quantity?: number;
	tickerCurrency?: string;
	paidOn: string;
	instrument?: Trading212InstrumentRef;
}

export interface Trading212Tax {
	/** e.g. "STAMP_DUTY", "CURRENCY_CONVERSION_FEE", "TRANSACTION_FEE". */
	name?: string;
	/** Signed tax amount. */
	quantity?: number;
	currency?: string;
	chargedAt?: string;
}

export interface Trading212WalletImpact {
	currency?: string;
	/** Signed cash impact of the fill (negative for buys). */
	netValue?: number;
	fxRate?: number;
	taxes?: Trading212Tax[];
	realisedProfitLoss?: number;
}

export interface Trading212Order {
	id: number;
	ticker: string;
	/** e.g. "NEW", "FILLED", "PARTIALLY_FILLED", "CANCELLED", "REJECTED". */
	status: string;
	/** "BUY" or "SELL". */
	side?: string;
	/** "LIMIT", "STOP", "MARKET" or "STOP_LIMIT". */
	type?: string;
	/** "QUANTITY" or "VALUE". */
	strategy?: string;
	currency?: string;
	value?: number;
	filledValue?: number;
	quantity?: number;
	filledQuantity?: number;
	/** Applicable to LIMIT and STOP_LIMIT orders. */
	limitPrice?: number;
	/** Applicable to STOP and STOP_LIMIT orders. */
	stopPrice?: number;
	/** "DAY" or "GOOD_TILL_CANCEL". */
	timeInForce?: string;
	extendedHours?: boolean;
	/** e.g. "API", "WEB", "AUTOINVEST". */
	initiatedFrom?: string;
	createdAt: string;
	instrument?: Trading212InstrumentRef;
}

export interface Trading212Fill {
	id: number;
	quantity?: number;
	price?: number;
	/** "TRADE" for regular fills; corporate actions use e.g. "STOCK_SPLIT". */
	type?: string;
	/** "TOTV" or "OTC". */
	tradingMethod?: string;
	filledAt?: string;
	walletImpact?: Trading212WalletImpact;
}

/**
 * An entry from `/equity/history/orders`: the order plus, when it (partially)
 * executed, one fill. An order with several fills appears once per fill.
 */
export interface Trading212OrderEvent {
	order: Trading212Order;
	fill?: Trading212Fill;
}
