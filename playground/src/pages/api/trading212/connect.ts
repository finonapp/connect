import { trading212 } from "@finon/connect";
import { errorResponse, json } from "@lib/server";
import { setSession } from "@lib/store";
import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	try {
		const body = (await request.json()) as { apiKey?: string; apiSecret?: string };
		if (
			typeof body.apiKey !== "string" ||
			body.apiKey.trim() === "" ||
			typeof body.apiSecret !== "string" ||
			body.apiSecret.trim() === ""
		) {
			return json({ error: "apiKey and apiSecret must be non-empty strings" }, 400);
		}

		const apiKey = body.apiKey.trim();
		const apiSecret = body.apiSecret.trim();

		await trading212.validateCredentials({ apiKey, apiSecret });

		const Trading212 = trading212.Client({ apiKey, apiSecret });

		setSession(trading212.id, Trading212);
		return json({ ok: true });
	} catch (error) {
		return errorResponse(error);
	}
};
