import { trading212 } from "@finon/connect";
import { errorResponse, json } from "@lib/http";
import { setSession } from "@lib/store";
import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	try {
		const body = (await request.json()) as { apiKey?: string; apiSecret?: string };
		if (!body.apiKey || !body.apiSecret) {
			return json({ error: "apiKey and apiSecret are required" }, 400);
		}

		const Trading212 = new trading212.Client({
			apiKey: body.apiKey.trim(),
			apiSecret: body.apiSecret.trim(),
		});

		const missing = await Trading212.verify();
		if (missing.length > 0) {
			return json({ error: `The key is invalid or missing permissions: ${missing.join(", ")}` }, 400);
		}

		setSession(trading212.id, Trading212);
		return json({ ok: true });
	} catch (error) {
		return errorResponse(error);
	}
};
