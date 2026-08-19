import { errorResponse, json } from "@lib/http";
import { getSession } from "@lib/store";
import type { APIRoute } from "astro";

export const prerender = false;

/**
 * Fetch and normalize everything the user holds at Trading 212: open stock
 * positions plus the free cash balance.
 */
export const GET: APIRoute = async () => {
	try {
		const assets = await getSession("trading212").getAssets();
		console.log(JSON.stringify(assets, null, 2));
		return json({ assets });
	} catch (error) {
		return errorResponse(error);
	}
};
