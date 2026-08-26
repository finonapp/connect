import { errorResponse, json } from "@lib/server";
import { getSession } from "@lib/store";
import type { APIRoute } from "astro";

export const prerender = false;

/**
 * Everything the uploaded statements hold: fund positions and the cash line of
 * a Stocks & Shares ISA, the balance of a Cash ISA.
 */
export const GET: APIRoute = async () => {
	try {
		const assets = await getSession("moneybox").getAssets();
		return json({ assets });
	} catch (error) {
		return errorResponse(error);
	}
};
