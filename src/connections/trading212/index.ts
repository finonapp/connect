import { AssetType, type ProviderMetadata } from "../../core";
import { PROVIDER_ID, PROVIDER_NAME } from "./constants";
import { Trading212 } from "./trading212";

export const trading212 = {
	id: PROVIDER_ID,
	name: PROVIDER_NAME,
	auth: "api-key",
	assetTypes: [AssetType.STOCK, AssetType.CASH],
	countries: ["GB"],
	website: "https://www.trading212.com",
	appUrl: "trading212://",
	Client: Trading212,
	params: [
		{ key: "apiKey", label: "Key ID" },
		{ key: "apiSecret", label: "Secret Key" },
	],
	setup: [
		{
			description: "Open {{link}} and log into your account.",
			link: {
				text: "Trading 212",
				webUrl: "https://www.trading212.com",
				appUrl: "trading212://",
			},
		},
		{
			description: "Click on the hamburger menu (three horizontal lines) in the navigation bar.",
		},
		{
			description: 'Navigate to "Settings" > "API (Beta)".',
		},
		{
			description:
				'Generate a new API key, set a name (e.g. the app you are connecting), make sure IP access is unrestricted, and grant access to "Account Data", "Portfolio", "Metadata", "History - Transactions", "History - Orders" and "History - Dividends".',
		},
		{
			description: "You will now be presented with an API Key ID and a Secret Key. Copy and paste those into the form.",
		},
	],
} satisfies ProviderMetadata & { Client: typeof Trading212 };

export type { Trading212 } from "./trading212";
export type * from "./types";
