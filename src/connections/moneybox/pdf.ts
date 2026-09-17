import { PDFParse } from "pdf-parse";
import { ConnectError } from "../../core/errors";
import { PROVIDER_ID } from "./constants";

/** Name to show for a file in messages: `File.name` when it has one. */
export function fileLabel(file: Blob, index: number): string {
	const name = (file as Partial<File>).name;
	return name && name.length > 0 ? name : `file #${index + 1}`;
}

/** Extract the text of a PDF statement, pages joined in order. */
export async function extractText(file: Blob): Promise<string> {
	const parser = new PDFParse({ data: new Uint8Array(await file.arrayBuffer()) });
	try {
		const result = await parser.getText();
		return result.text;
	} catch (error) {
		throw new ConnectError(PROVIDER_ID, "Could not read the file as a PDF", { cause: error });
	} finally {
		await parser.destroy().catch(() => undefined);
	}
}
