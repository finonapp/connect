import { ConnectError } from "@finon/connect";

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

export async function postJson(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `Request to ${url} failed`);
  return data;
}

export async function getJson(url: string) {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `Request to ${url} failed`);
  return data;
}
