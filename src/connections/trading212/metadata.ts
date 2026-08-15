import type { ProviderMetadata } from "../../core/metadata";
import { AssetType } from "../../core/types";
import { PROVIDER_ID, PROVIDER_NAME } from "./constants";

export const trading212Metadata: ProviderMetadata = {
	id: PROVIDER_ID,
	name: PROVIDER_NAME,
	auth: "api-key",
	assetTypes: [AssetType.STOCK, AssetType.CASH],
	countries: ["GB"],
	website: "https://www.trading212.com",
	appUrl: "trading212://",
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
};
