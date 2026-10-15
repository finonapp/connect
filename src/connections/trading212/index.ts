import { type ApiKeyCredentials, AssetType, AuthKind, type Provider } from "../../core";
import { verifyPermissions } from "./api";
import { LIVE_BASE_URL, PROVIDER_ID, PROVIDER_NAME } from "./constants";
import { Trading212Client } from "./trading212";

export const trading212 = {
	id: PROVIDER_ID,
	name: PROVIDER_NAME,
	auth: AuthKind.API_KEY,
	assetTypes: [AssetType.STOCK, AssetType.CASH],
	countries: ["GB"],
	url: {
		website: "https://www.trading212.com",
		app: "trading212://",
	},
	validateCredentials: async (credentials: ApiKeyCredentials, baseUrl = LIVE_BASE_URL) => {
		await verifyPermissions(baseUrl, credentials);
	},
	Client: (credentials: ApiKeyCredentials) => new Trading212Client(credentials),
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
				"Generate a new API key, set a name (e.g. the app you are connecting), make sure IP access is unrestricted, and grant access to:\n- Account Data\n- History - Dividends\n- History - Orders\n- History - Transactions\n- Metadata\n- Portfolio",
		},
		{
			description: "You will now be presented with an API Key ID and a Secret Key. Copy and paste those into the form.",
		},
	],
} satisfies Provider<ApiKeyCredentials>;

export type { Trading212Client } from "./trading212";
