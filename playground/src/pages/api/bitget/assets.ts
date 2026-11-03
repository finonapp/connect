import { errorResponse, json } from "@lib/server";
import { getSession } from "@lib/store";
import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async () => {
	try {
		const assets = await getSession("bitget").getAssets();
		return json({ assets });
	} catch (error) {
		return errorResponse(error);
	}
};
