import type { Client, FetchOptions } from "../../core";
import { ConnectError } from "../../core/errors";
import type { Asset, FileImportCredentials, Transaction } from "../../core/types";
import { PROVIDER_ID, PROVIDER_NAME } from "./constants";
import { normalizeAssets, normalizeTransaction, transactionAssetId, transactionId } from "./normalize";
import { parseStatement, toUnixSeconds } from "./parse";
import { extractText, fileLabel } from "./pdf";
import type { MoneyboxStatement } from "./types";

interface ParsedFile {
	label: string;
	statement?: MoneyboxStatement;
	error?: unknown;
}

/**
 * Moneybox connection client.
 *
 * Moneybox has no API. The user generates a statement in the app (Settings >
 * Statements and documents > Statements), receives it by email as a PDF, and
 * uploads it. The client parses the PDF text once and serves assets and
 * transactions from it. Several statements can be uploaded together, e.g. one
 * per product (Stocks & Shares ISA, Cash ISA).
 *
 * @example
 * ```ts
 * // 1. Build a client from the uploaded files. Throws a ConnectError naming
 * //    any file that is not a readable Moneybox statement.
 * const client = await createClient(moneybox, { files });
 *
 * // 2. Pull normalized data. Nothing to persist: there are no credentials.
 * const assets = await client.getAssets();
 * const transactions = await client.getTransactions();
 * ```
 */
export class MoneyboxClient implements Client<FileImportCredentials> {
	readonly id = PROVIDER_ID;
	readonly name = PROVIDER_NAME;

	readonly credentials: FileImportCredentials;
	private parsed: Promise<ParsedFile[]> | null = null;

	constructor(credentials: FileImportCredentials) {
		this.credentials = credentials;
	}

	/** Parse every file once; later calls reuse the result. */
	private parseFiles(): Promise<ParsedFile[]> {
		if (!this.parsed) {
			this.parsed = Promise.all(
				this.credentials.files.map(async (file, index): Promise<ParsedFile> => {
					const label = fileLabel(file, index);
					try {
						return { label, statement: parseStatement(await extractText(file), label) };
					} catch (error) {
						return { label, error };
					}
				}),
			);
		}
		return this.parsed;
	}

	/** Throws a `ConnectError` naming every file that is not a readable Moneybox statement. */
	async verify(): Promise<void> {
		const files = await this.parseFiles();
		const unreadable = files.filter((file) => !file.statement);
		if (unreadable.length > 0) {
			throw new ConnectError(PROVIDER_ID, `Not readable as Moneybox statements: ${unreadable.map((file) => file.label).join(", ")}`, {
				cause: unreadable[0]?.error,
			});
		}
	}

	/**
	 * The parsed statements, oldest period first. Throws when a file could not
	 * be read as a Moneybox statement (`verify` reports all of them at once).
	 */
	async getStatements(): Promise<MoneyboxStatement[]> {
		const files = await this.parseFiles();
		const statements: MoneyboxStatement[] = [];

		for (const file of files) {
			if (file.statement) {
				statements.push(file.statement);
			} else if (file.error instanceof ConnectError) {
				throw file.error;
			} else {
				throw new ConnectError(PROVIDER_ID, `${file.label} is not a Moneybox statement`, { cause: file.error });
			}
		}

		return statements.sort((a, b) => periodEnd(a) - periodEnd(b));
	}

	/**
	 * Everything the statements hold. When several statements describe the
	 * same asset (e.g. two Stocks & Shares ISA statements), the most recent
	 * one wins.
	 */
	async getAssets(): Promise<Asset[]> {
		const assets = new Map<string, Asset>();
		for (const statement of await this.getStatements()) {
			for (const asset of normalizeAssets(statement)) assets.set(asset.id, asset);
		}
		return [...assets.values()];
	}

	async getTransactions(options: FetchOptions = {}): Promise<Transaction[]> {
		const { asset, since } = options;
		const transactions = new Map<string, Transaction>();

		for (const statement of await this.getStatements()) {
			for (const transaction of statement.transactions) {
				if (asset !== undefined && transactionAssetId(transaction, statement) !== asset.id) continue;
				// Overlapping statement periods print the same lines twice.
				transactions.set(transactionId(transaction), normalizeTransaction(transaction));
			}
		}

		let result = [...transactions.values()];
		if (since !== undefined) result = result.filter((t) => t.createdAt >= since);
		return result;
	}
}

function periodEnd(statement: MoneyboxStatement): number {
	return statement.periodTo ? toUnixSeconds(statement.periodTo) : 0;
}
