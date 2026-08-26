import { ConnectError } from "@finon/connect";

/** JSON response helpers for the API routes (server only). */
export function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

/** Turn any thrown error into a JSON error response. */
export function errorResponse(error: unknown): Response {
	if (error instanceof ConnectError) {
		return json({ error: error.message, provider: error.provider, status: error.status }, error.status ?? 502);
	}
	const message = error instanceof Error ? error.message : "Unknown error";
	return json({ error: message }, 400);
}
