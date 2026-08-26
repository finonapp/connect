/**
 * Browser-side fetch helpers used by the playground components. Keep this file
 * free of `@finon/connect` value imports: the library targets Node (pdf-parse,
 * node:crypto) and must not end up in the client bundle. Server responses
 * live in `server.ts`.
 */

async function unwrap(url: string, res: Response) {
	const data = await res.json();
	if (!res.ok) throw new Error(data?.error ?? `Request to ${url} failed`);
	return data;
}

export async function getJson(url: string) {
	return unwrap(url, await fetch(url));
}

export async function postJson(url: string, body?: unknown) {
	const res = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: body ? JSON.stringify(body) : undefined,
	});
	return unwrap(url, res);
}

/** Multipart POST. No Content-Type header: the browser sets the boundary. */
export async function postForm(url: string, body: FormData) {
	return unwrap(url, await fetch(url, { method: "POST", body }));
}
