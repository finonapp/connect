import { trading212 } from "@finon/connect";
import { errorResponse, json } from "@lib/server";
import { setSession } from "@lib/store";
import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	try {
		const body = (await request.json()) as { apiKey?: string; apiSecret?: string };
		if (!body.apiKey || !body.apiSecret) {
			return json({ error: "apiKey and apiSecret are required" }, 400);
		}

		const Trading212 = await trading212.createClient({
			apiKey: body.apiKey.trim(),
			apiSecret: body.apiSecret.trim(),
		});

		setSession(trading212.id, Trading212);
		return json({ ok: true });
	} catch (error) {
		return errorResponse(error);
	}
};
