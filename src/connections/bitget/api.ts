import { createHmac } from "node:crypto";
import { ConnectError } from "../../core/errors";
import type { ApiKeyCredentials } from "../../core/types";
import {
	ACCOUNT_ASSETS_PATH,
	ACCOUNT_INFO_PATH,
	API_PASSPHRASE,
	BASE_URL,
	HISTORY_ORDERS_PAGE_SIZE,
	HISTORY_ORDERS_PATH,
	PROVIDER_ID,
	SPOT_READ_AUTHORITIES,
} from "./constants";
import type { BitgetAccountAsset, BitgetAccountInfo, BitgetResponse, BitgetSpotOrder } from "./types";

function signature(secret: string, timestamp: string, requestPath: string): string {
	return createHmac("sha256", secret).update(`${timestamp}GET${requestPath}`).digest("base64");
}

function authenticationErrorMessage(code: string, fallback: string): string {
	switch (code) {
		case "40006":
		case "40037":
		case "40041":
			return "Bitget did not recognize this API Key ID. Check the key and make sure it has not been deleted.";
		case "40009":
			return "Bitget rejected the request signature. Check the API Secret; if it is correct, check the machine clock.";
		case "40036":
			return `The Bitget API passphrase is incorrect. The key's passphrase must be "${API_PASSPHRASE}".`;
		case "40012":
			return `Bitget rejected the API key or passphrase. Check the API Key ID and that the key was created with the required passphrase "${API_PASSPHRASE}".`;
		default:
			return fallback;
	}
}

async function bitgetGet<T>(path: string, credentials: ApiKeyCredentials, query?: URLSearchParams): Promise<T> {
	const queryString = query?.toString();
	const requestPath = queryString ? `${path}?${queryString}` : path;
	const timestamp = Date.now().toString();
	let response: Response;

	try {
		response = await fetch(`${BASE_URL}${requestPath}`, {
			method: "GET",
			headers: {
				"ACCESS-KEY": credentials.apiKey,
				"ACCESS-PASSPHRASE": API_PASSPHRASE,
				"ACCESS-SIGN": signature(credentials.apiSecret, timestamp, requestPath),
				"ACCESS-TIMESTAMP": timestamp,
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		throw new ConnectError(PROVIDER_ID, "Could not reach the Bitget API", { status: 502, cause: error });
	}

	let payload: BitgetResponse<T> | null;
	try {
		payload = (await response.json()) as BitgetResponse<T> | null;
		console.log("Bitget response payload:", payload);
	} catch (error) {
		throw new ConnectError(PROVIDER_ID, "Bitget returned an unreadable response", {
			status: response.ok ? 502 : response.status,
			cause: error,
		});
	}

	if (!payload || typeof payload !== "object") {
		throw new ConnectError(PROVIDER_ID, "Bitget returned an invalid response", {
			status: response.ok ? 502 : response.status,
		});
	}

	if (!response.ok || payload.code !== "00000") {
		const fallback = typeof payload.msg === "string" && payload.msg ? payload.msg : "Bitget request failed";
		const message = authenticationErrorMessage(payload.code, fallback);
		throw new ConnectError(PROVIDER_ID, message, { status: response.ok ? 400 : response.status });
	}

	return payload.data;
}

export async function verifyCredentials(credentials: ApiKeyCredentials): Promise<void> {
	const info = await bitgetGet<BitgetAccountInfo>(ACCOUNT_INFO_PATH, credentials);
	const authorities = info?.authorities ?? [];

	if (!authorities.some((authority) => SPOT_READ_AUTHORITIES.includes(authority))) {
		throw new ConnectError(
			PROVIDER_ID,
			"API key is missing permissions: Spot > Trade. Enable it on the key and try again.",
			{ status: 403 },
		);
	}
}

export function fetchAccountAssets(credentials: ApiKeyCredentials): Promise<BitgetAccountAsset[]> {
	return bitgetGet<BitgetAccountAsset[]>(ACCOUNT_ASSETS_PATH, credentials);
}

export function fetchSpotOrders(
	credentials: ApiKeyCredentials,
	options: { since?: number; idLessThan?: string } = {},
): Promise<BitgetSpotOrder[]> {
	const query = new URLSearchParams({ limit: String(HISTORY_ORDERS_PAGE_SIZE) });
	if (options.since !== undefined) query.set("startTime", String(options.since * 1000));
	if (options.idLessThan) query.set("idLessThan", options.idLessThan);
	return bitgetGet<BitgetSpotOrder[]>(HISTORY_ORDERS_PATH, credentials, query);
}
