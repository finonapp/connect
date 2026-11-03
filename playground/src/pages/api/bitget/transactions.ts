import type { Asset } from "@finon/connect";
import { errorResponse, json } from "@lib/server";
import { getSession } from "@lib/store";
import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	try {
		const body = (await request.json()) as { asset?: Asset; since?: number };
		if (!body.asset?.id) {
			return json({ error: "asset (as returned by /api/bitget/assets) is required" }, 400);
		}
		console.log("Fetching transactions for asset:", body.asset, "since:", body.since);
		const transactions = await getSession("bitget").getTransactions({ asset: body.asset, since: body.since });
		return json({ transactions });
	} catch (error) {
		return errorResponse(error);
	}
};
