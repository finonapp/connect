import { AssetType, AuthKind, type FileImportCredentials, type Provider } from "../../core";
import { APP_URL, PROVIDER_ID, PROVIDER_NAME, WEBSITE } from "./constants";
import { MoneyboxClient } from "./moneybox";

export const moneybox = {
	id: PROVIDER_ID,
	name: PROVIDER_NAME,
	auth: AuthKind.FILE_IMPORT,
	assetTypes: [AssetType.STOCK, AssetType.CASH, AssetType.SAVINGS],
	countries: ["GB"],
	website: WEBSITE,
	appUrl: APP_URL,
	createClient: async (credentials: FileImportCredentials) => {
		const client = new MoneyboxClient(credentials);
		await client.verify();

		return client;
	},
	params: [
		{
			key: "files",
			label: "Statement PDF",
			type: "file",
			accept: "application/pdf,.pdf",
			multiple: true,
		},
	],
	setup: [
		{
			description: "Open {{link}} and log into your account.",
			link: {
				text: "Moneybox",
				webUrl: WEBSITE,
				appUrl: APP_URL,
			},
		},
		{
			description: 'Tap "Settings" in the navigation bar.',
		},
		{
			description: 'Navigate to "Statements and documents" > "Statements".',
		},
		{
			description:
				'Generate a new statement for your "Stocks & Shares ISA" or "Cash ISA" covering the period since the account was opened, then tap the email icon in the top right to send it to your email address.',
		},
		{
			description: "You will receive an email with a PDF attachment. Download the PDF and upload it here.",
		},
	],
} satisfies Provider<FileImportCredentials>;

export type { MoneyboxClient } from "./moneybox";
export type {
	MoneyboxHolding,
	MoneyboxInstrument,
	MoneyboxProduct,
	MoneyboxStatement,
	MoneyboxTransaction,
	MoneyboxTransactionKind,
} from "./types";
