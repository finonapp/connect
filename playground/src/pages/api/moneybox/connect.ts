import { moneybox } from "@finon/connect";
import { errorResponse, json } from "@lib/server";
import { setSession } from "@lib/store";
import type { APIRoute } from "astro";

export const prerender = false;

/**
 * "Connect" a Moneybox account: there are no credentials, the user uploads the
 * statement PDF(s) generated in the Moneybox app as a multipart form under the
 * `files` field. The client parses them once; the session serves the data.
 */
export const POST: APIRoute = async ({ request }) => {
	try {
		const form = await request.formData();
		const files = form.getAll("files").filter((entry): entry is File => entry instanceof File);
		if (files.length === 0) {
			return json({ error: "Upload at least one statement PDF under the 'files' field" }, 400);
		}

		const Moneybox = new moneybox.Client({ files });

		const unreadable = await Moneybox.verify();
		if (unreadable.length > 0) {
			return json({ error: `Not readable as Moneybox statements: ${unreadable.join(", ")}` }, 400);
		}

		setSession(moneybox.id, Moneybox);
		return json({ ok: true, files: files.map((file) => file.name) });
	} catch (error) {
		return errorResponse(error);
	}
};
