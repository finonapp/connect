import type { Asset } from "@finon/connect";
import { errorResponse, json } from "@lib/server";
import { getSession } from "@lib/store";
import type { APIRoute } from "astro";

export const prerender = false;

/**
 * Statement lines for a single asset: purchases and sales for a fund, deposits
 * and withdrawals for the cash balance. Pass `since` (Unix seconds) to drop
 * older lines.
 */
export const POST: APIRoute = async ({ request }) => {
	try {
		const body = (await request.json()) as { asset?: Asset; since?: number };
		if (!body.asset?.id) {
			return json({ error: "asset (as returned by /api/moneybox/assets) is required" }, 400);
		}
		const transactions = await getSession("moneybox").getTransactions({ asset: body.asset, since: body.since });
		return json({ transactions });
	} catch (error) {
		return errorResponse(error);
	}
};
