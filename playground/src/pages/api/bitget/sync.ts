import { errorResponse, json } from "@lib/server";
import { getSession } from "@lib/store";
import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async () => {
	try {
		const client = getSession("bitget");
		const [assets, transactions] = await Promise.all([client.getAssets(), client.getTransactions()]);
		return json({ assets, transactions });
	} catch (error) {
		return errorResponse(error);
	}
};
