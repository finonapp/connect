import { PRODUCT_CASH_ISA, PRODUCT_STOCKS_SHARES_ISA } from "./constants";
import type {
	MoneyboxHolding,
	MoneyboxProduct,
	MoneyboxStatement,
	MoneyboxTransaction,
	MoneyboxTransactionKind,
} from "./types";

/**
 * Text-level parsing of a Moneybox statement. Pure functions over the text
 * extracted from the PDF, so they can be unit tested without a PDF.
 */

const DATE = String.raw`\d{2}/\d{2}/\d{4}`;
const MONEY = String.raw`£[\d,.]+`;

const HOLDINGS_HEADER = "Fund name Allocation Units held Unit Price Value";
const TRANSACTIONS_HEADER = "date Details of transaction Money out Money in Cash balance";
const CLOSING_LINE = new RegExp(String.raw`^(${DATE})\s+Closing cash balance\s+(${MONEY})`, "m");

/** "£1,234.56" -> 1234.56 */
export function parseMoney(value: string): number {
	return Number(value.replace(/[£,\s]/g, ""));
}

/** dd/mm/yyyy -> Unix timestamp in seconds (midnight UTC). */
export function toUnixSeconds(date: string): number {
	const [day, month, year] = date.split("/").map(Number);
	return Math.floor(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1) / 1000);
}

/**
 * Remove the letterhead and footer repeated on every page so the tables read
 * as one continuous block. The footer holds the page counter that pdf text
 * extraction inserts ("-- 2 of 3 --").
 */
export function stripPageChrome(text: string): string {
	return text
		.replace(/Email: support@moneyboxapp\.com[\s\S]*?SE1 9PG\s*/g, "")
		.replace(/Digital Moneybox Limited\. Authorised and regulated[\s\S]*?Page \d+ of \d+\s*/g, "")
		.replace(/-- \d+ of \d+ --\s*/g, "")
		.replace(/^Statement generated \d{2}\/\d{2}\/\d{4}\s*$/gm, "");
}

/** Which product the statement is for, or undefined when it is not a Moneybox statement. */
export function detectProduct(text: string): MoneyboxProduct | undefined {
	if (!/Moneybox/i.test(text)) return undefined;
	if (text.includes(PRODUCT_STOCKS_SHARES_ISA)) return PRODUCT_STOCKS_SHARES_ISA;
	if (text.includes(PRODUCT_CASH_ISA)) return PRODUCT_CASH_ISA;
	return undefined;
}

/**
 * Classify a transaction from its details text. Trades are checked first: a
 * purchase line also mentions its "Currency conversion fee".
 */
export function classifyDetails(details: string): MoneyboxTransactionKind {
	if (/\bPurchase\b/i.test(details)) return "purchase";
	if (/\bSale\b/i.test(details)) return "sale";
	if (/\bWithdraw/i.test(details)) return "withdrawal";
	if (/bank transfer|\bDeposit\b|Direct Debit|Standing Order|Payment in/i.test(details)) return "deposit";
	if (/\bInterest\b/i.test(details)) return "interest";
	if (/\bDividend/i.test(details)) return "dividend";
	if (/\bFee\b|\bCharge\b/i.test(details)) return "fee";
	return "other";
}

/**
 * Pull the trade fields out of a details text such as
 * "Purchase of 1.00373772 Nike (US6541061031) @ $65.44 net cost £49.78 after
 * £1 = $1.3197 rate & £0.22 Currency conversion fee deal time 14:40".
 */
export function parseTradeDetails(
	details: string,
): Pick<MoneyboxTransaction, "assetName" | "isin" | "units" | "netAmount" | "fee"> {
	const asset = details.match(/\bof\s+([\d.]+)\s+(.*?)\s*\(/i);
	const isin = details.match(/\(([A-Z]{2}[A-Z0-9]{9}\d)\)/);
	const net = details.match(/net (?:cost|received)\s+(£[\d,.]+)/i);
	const fee = details.match(/&\s+(£[\d,.]+)/);

	return {
		units: asset?.[1] !== undefined ? Number(asset[1]) : undefined,
		assetName: asset?.[2]?.trim() || undefined,
		isin: isin?.[1],
		netAmount: net?.[1] !== undefined ? parseMoney(net[1]) : undefined,
		fee: fee?.[1] !== undefined ? parseMoney(fee[1]) : 0,
	};
}

/** Kinds that put money into the account when the statement gives no balance to compare against. */
const INBOUND_KINDS: MoneyboxTransactionKind[] = ["deposit", "sale", "interest", "dividend"];

/**
 * Parse the "Transaction" table. Each entry starts with a date at the start of
 * a line and ends with the two money columns ("£movement £balance"); the
 * details may wrap over several lines in between. The statement prints a
 * single money column per line, so the direction is inferred from the change
 * in the running balance, falling back to the kind for the first line.
 */
export function parseTransactions(text: string): MoneyboxTransaction[] {
	const start = text.indexOf(TRANSACTIONS_HEADER);
	if (start === -1) return [];

	const closing = CLOSING_LINE.exec(text.slice(start));
	const end = closing ? start + closing.index : text.length;
	const section = text
		.slice(start + TRANSACTIONS_HEADER.length, end)
		// The table header (and the product title above it) repeats on every page.
		.replace(new RegExp(String.raw`^(Transaction|${TRANSACTIONS_HEADER}|Stocks & Shares ISA|Cash ISA)\s*$`, "gm"), "");

	const entry = new RegExp(String.raw`^(${DATE})\s+([\s\S]*?)\s*(${MONEY})\s+(${MONEY})\s*$`);
	const transactions: MoneyboxTransaction[] = [];
	let previousBalance: number | undefined;

	for (const block of section.split(new RegExp(String.raw`(?=^${DATE}\b)`, "m"))) {
		const match = entry.exec(block.trim());
		if (!match) continue;
		const [, date, rawDetails, rawMovement, rawBalance] = match as unknown as [string, string, string, string, string];

		const details = rawDetails.replace(/\s+/g, " ").trim();
		const kind = classifyDetails(details);
		const movement = parseMoney(rawMovement);
		const balance = parseMoney(rawBalance);

		let direction: "in" | "out";
		if (previousBalance !== undefined && balance !== previousBalance) {
			direction = balance > previousBalance ? "in" : "out";
		} else {
			direction = INBOUND_KINDS.includes(kind) ? "in" : "out";
		}
		previousBalance = balance;

		const trade = kind === "purchase" || kind === "sale" ? parseTradeDetails(details) : { fee: 0 };
		transactions.push({ date, details, kind, ...trade, movement, direction, balance });
	}

	return transactions;
}

/**
 * Parse the "Holdings" table of a Stocks & Shares ISA statement. Fund names
 * may wrap onto a second line; the allocation percentage anchors each row.
 */
export function parseHoldings(text: string): MoneyboxHolding[] {
	const sections = [
		...text.matchAll(new RegExp(String.raw`${HOLDINGS_HEADER}\s+([\s\S]*?)(?=\n\s*\n|${TRANSACTIONS_HEADER}|$)`, "g")),
	];
	if (sections.length === 0) return [];

	const row = new RegExp(String.raw`([\s\S]+?)\s+(\d{1,3}\.\d{3})%\s+([\s\S]*?)(${MONEY})(?=\s|$)`, "g");
	const holdings: MoneyboxHolding[] = [];

	for (const section of sections) {
		for (const match of (section[1] ?? "").matchAll(row)) {
			const [, rawName, allocation, rawNumbers, rawValue] = match as unknown as [
				string,
				string,
				string,
				string,
				string,
			];
			const numbers = rawNumbers.trim().split(/\s+/).filter(Boolean).map(Number);
			holdings.push({
				name: rawName.replace(/\s+/g, " ").trim(),
				allocation: Number(allocation),
				units: numbers[0],
				unitPrice: numbers[1],
				value: parseMoney(rawValue),
			});
		}
	}

	return holdings;
}

/**
 * Parse the text of one statement PDF. Returns `undefined` when the text is
 * not recognised as a Moneybox statement.
 */
export function parseStatement(text: string, fileName?: string): MoneyboxStatement | undefined {
	const product = detectProduct(text);
	if (!product) return undefined;

	const generated = text.match(new RegExp(`Statement generated (${DATE})`));
	const period = text.match(new RegExp(`Statement period From (${DATE}) to (${DATE})`));
	const values = [...text.matchAll(new RegExp(`Value of your product on (${DATE}) (${MONEY})`, "g"))];
	const first = values[0];
	const last = values[values.length - 1];

	const body = stripPageChrome(text);
	const closing = CLOSING_LINE.exec(body);

	return {
		product,
		fileName,
		generatedOn: generated?.[1],
		periodFrom: period?.[1] ?? first?.[1],
		periodTo: period?.[2] ?? last?.[1],
		openingValue: first?.[2] !== undefined ? parseMoney(first[2]) : undefined,
		closingValue: last?.[2] !== undefined ? parseMoney(last[2]) : undefined,
		closingCashBalance: closing?.[2] !== undefined ? parseMoney(closing[2]) : undefined,
		holdings: product === PRODUCT_STOCKS_SHARES_ISA ? parseHoldings(body) : [],
		transactions: parseTransactions(body),
	};
}
