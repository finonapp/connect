import { type ApiKeyCredentials, AssetType, AuthKind, type Provider } from "../../core";
import { verifyCredentials } from "./api";
import { PROVIDER_ID, PROVIDER_NAME } from "./constants";
import { BitgetClient } from "./bitget";

export const bitget = {
	id: PROVIDER_ID,
	name: PROVIDER_NAME,
	auth: AuthKind.API_KEY,
	assetTypes: [AssetType.CRYPTO],
	countries: ["GB"],
	url: {
		website: "https://www.bitget.com",
		app: "bitget://",
	},
	validateCredentials: verifyCredentials,
	Client: (credentials: ApiKeyCredentials) => new BitgetClient(credentials),
	setup: [
		{
			description: "Open {{link}} and log into your account.",
			link: {
				text: "Bitget",
				webUrl: "https://www.bitget.com",
				appUrl: "bitget://",
			},
		},
		{
			description:
				'Open your profile menu and select "API keys". In the mobile app, go to "Popular" > "More Services" > "Tools" > "API keys".',
		},
		{
			description:
				'Create an HMAC API key with read-only access. Set its passphrase to "freemyfinances" and enable the available account and spot-trading read permissions.',
		},
		{
			description: "Copy the API Key ID and Secret Key into the form.",
		},
	],
} satisfies Provider<ApiKeyCredentials>;

export type { BitgetClient } from "./bitget";
export type { BitgetAccountAsset, BitgetSpotOrder } from "./types";
