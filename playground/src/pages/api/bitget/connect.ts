import { bitget } from "@finon/connect";
import { errorResponse, json } from "@lib/server";
import { setSession } from "@lib/store";
import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	try {
		const body = (await request.json()) as { apiKey?: unknown; apiSecret?: unknown };
		if (
			typeof body.apiKey !== "string" ||
			body.apiKey.trim() === "" ||
			typeof body.apiSecret !== "string" ||
			body.apiSecret.trim() === ""
		) {
			return json({ error: "apiKey and apiSecret must be non-empty strings" }, 400);
		}

		const credentials = { apiKey: body.apiKey.trim(), apiSecret: body.apiSecret.trim(), passphrase: "freemyfinances" };
		await bitget.validateCredentials?.(credentials);
		const client = bitget.Client(credentials);
		setSession(bitget.id, client);
		return json({ ok: true });
	} catch (error) {
		return errorResponse(error);
	}
};
