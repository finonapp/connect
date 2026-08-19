import type { Asset } from "@finon/connect";
import { errorResponse, json } from "@lib/http";
import { getSession } from "@lib/store";
import type { APIRoute } from "astro";

export const prerender = false;

/**
 * Fetch and normalize Trading 212 transactions for a single asset: order
 * history for a stock position, cash movements for the cash balance. Pass
 * `since` (Unix seconds) for incremental fetches.
 */
export const POST: APIRoute = async ({ request }) => {
	try {
		const body = (await request.json()) as { asset?: Asset; since?: number };
		if (!body.asset?.id) {
			return json({ error: "asset (as returned by /api/trading212/assets) is required" }, 400);
		}
		const transactions = await getSession("trading212").getTransactions({ asset: body.asset, since: body.since });
		return json({ transactions });
	} catch (error) {
		return errorResponse(error);
	}
};
