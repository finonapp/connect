/**
 * Raw shapes extracted from Moneybox PDF statements. Moneybox has no API: the
 * user generates a statement in the app and the library parses its text. The
 * library normalizes these into the shapes in `core/types`; they stay
 * available on `raw`.
 */

/** A Moneybox product, as printed on its statement. */
export type MoneyboxProduct = "Stocks & Shares ISA" | "Cash ISA";

/** A fund or stock Moneybox offers, as it appears on statements. */
export interface MoneyboxInstrument {
	/** Name used in the transaction list, e.g. "FTSE 100 ETF". */
	shortName: string;
	/** Name used in the holdings table, e.g. "Vanguard FTSE 100 UCITS ETF Accumulating". */
	longName: string;
	/** Exchange symbol, e.g. "VUKG". Missing for a few unlisted funds. */
	symbol?: string;
	isin?: string;
	/** Short exchange code, e.g. "LSE", "NASDAQ". */
	exchange?: string;
	/** Quote currency of the listing; "GBp" means pence. */
	currency?: string;
}

/** One statement, i.e. one uploaded PDF. */
export interface MoneyboxStatement {
	product: MoneyboxProduct;
	/** Name of the uploaded file, when it carried one. */
	fileName?: string;
	/** Dates are kept as printed: dd/mm/yyyy. */
	generatedOn?: string;
	periodFrom?: string;
	periodTo?: string;
	/** "Value of your product" at the start and end of the period, in GBP. */
	openingValue?: number;
	closingValue?: number;
	/** Running cash balance after the last transaction, in GBP. */
	closingCashBalance?: number;
	/** Holdings table. Empty for a Cash ISA, which is a single balance. */
	holdings: MoneyboxHolding[];
	transactions: MoneyboxTransaction[];
}

/** One row of the "Holdings" table. The cash line is named "Cash". */
export interface MoneyboxHolding {
	/** Fund name as printed (matches `MoneyboxInstrument.longName`). */
	name: string;
	/** Share of the portfolio, in percent (25.55 = 25.550%). */
	allocation: number;
	/** Units held. Absent on the cash line. */
	units?: number;
	/** Price per unit, in the fund's quote currency. Absent on the cash line. */
	unitPrice?: number;
	/** Value in GBP. */
	value: number;
}

/** What a transaction line says it is, from its "Details of transaction" text. */
export type MoneyboxTransactionKind =
	| "purchase"
	| "sale"
	| "deposit"
	| "withdrawal"
	| "interest"
	| "dividend"
	| "fee"
	| "other";

/** One line of the "Transaction" table. */
export interface MoneyboxTransaction {
	/** As printed: dd/mm/yyyy. */
	date: string;
	/** Full "Details of transaction" text, line breaks collapsed. */
	details: string;
	kind: MoneyboxTransactionKind;
	/** For purchases and sales: fund name as printed (matches `MoneyboxInstrument.shortName`). */
	assetName?: string;
	isin?: string;
	/** For purchases and sales: units traded. */
	units?: number;
	/** For purchases and sales: "net cost" / "net received" before the fee, in GBP. */
	netAmount?: number;
	/** Fee charged on the line (e.g. currency conversion), in GBP. */
	fee: number;
	/** Cash moved on the line ("Money out" or "Money in"), in GBP, always positive. */
	movement: number;
	/** Which of the two money columns the movement sat in. */
	direction: "in" | "out";
	/** Running "Cash balance" after the line, in GBP. */
	balance: number;
}
