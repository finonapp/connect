import type { Provider } from "@finon/connect";
import { postForm } from "@lib/http";
import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import { SetupInstruction } from "../SetupInstruction";

type Props = {
	provider: Provider;
	setConnected: (connected: boolean) => void;
	run: (fn: () => Promise<void>) => Promise<void>;
	busy: boolean;
	connected: boolean;
};

/**
 * Connect surface for `file-import` providers: the user drops the statement
 * file(s) the provider's app exported, and the dev server parses them in
 * memory. The file field itself (label, accepted types, single or multiple)
 * comes from the provider descriptor.
 */
export function PlaygroundFileImport({ provider, setConnected, run, busy, connected }: Props) {
	const fileParam = provider.params.find((param) => param.type === "file");
	const key = fileParam?.key ?? "files";
	const label = fileParam?.label ?? "File";
	const accept = fileParam?.accept;
	const multiple = fileParam?.multiple ?? false;

	const inputRef = useRef<HTMLInputElement>(null);
	const [files, setFiles] = useState<File[]>([]);
	const [dragging, setDragging] = useState(false);
	const [skipped, setSkipped] = useState(0);

	function addFiles(incoming: FileList | File[]) {
		const list = Array.from(incoming);
		const accepted = list.filter((file) => matchesAccept(file, accept));
		setSkipped(list.length - accepted.length);
		setFiles((previous) => dedupe(multiple ? [...previous, ...accepted] : accepted.slice(-1)));
	}

	function removeFile(target: File) {
		setFiles((previous) => previous.filter((file) => file !== target));
	}

	function onInputChange(event: ChangeEvent<HTMLInputElement>) {
		if (event.target.files) addFiles(event.target.files);
		// Reset so picking the same file again still fires onChange.
		event.target.value = "";
	}

	function onDragOver(event: DragEvent<HTMLButtonElement>) {
		event.preventDefault();
		if (!dragging && !busy) setDragging(true);
	}

	function onDrop(event: DragEvent<HTMLButtonElement>) {
		event.preventDefault();
		setDragging(false);
		if (busy) return;
		addFiles(event.dataTransfer.files);
	}

	function connect() {
		return run(async () => {
			const form = new FormData();
			for (const file of files) form.append(key, file);
			await postForm(`/api/${provider.id}/connect`, form);
			setFiles([]);
			setSkipped(0);
			setConnected(true);
		});
	}

	const formats = describeAccept(accept);
	const hasFiles = files.length > 0;
	const title = !hasFiles
		? `Drop your ${label} here, or click to browse`
		: multiple
			? "Drop more files here, or click to browse"
			: "Drop a file here to replace it, or click to browse";
	const hint = [formats, multiple ? "several files at once" : null].filter(Boolean).join(", ");

	return (
		<>
			<p className="muted">
				{provider.name} has no API. Export a statement from the {provider.name} app and upload it here.
			</p>

			<div className="file-field">
				<span className="field-label">{label}</span>
				<button
					type="button"
					className={`drop-zone${dragging ? " dragging" : ""}`}
					disabled={busy}
					onClick={() => inputRef.current?.click()}
					onDragOver={onDragOver}
					onDragLeave={() => setDragging(false)}
					onDrop={onDrop}
					aria-label={`${label}: click to browse or drop files here`}
				>
					<span className="drop-zone-title">{title}</span>
					{hint && <span className="drop-zone-hint">{hint}</span>}
				</button>
				<input
					ref={inputRef}
					className="file-input"
					type="file"
					accept={accept}
					multiple={multiple}
					onChange={onInputChange}
				/>
			</div>

			{hasFiles && (
				<ul className="file-list">
					{files.map((file) => (
						<li className="file-row" key={`${file.name}:${file.size}:${file.lastModified}`}>
							<span className="file-name" title={file.name}>
								{file.name}
							</span>
							<span className="file-size">{formatSize(file.size)}</span>
							<button
								type="button"
								className="ghost"
								disabled={busy}
								onClick={() => removeFile(file)}
								aria-label={`Remove ${file.name}`}
							>
								Remove
							</button>
						</li>
					))}
				</ul>
			)}

			{skipped > 0 && (
				<p className="muted file-note">
					Skipped {skipped} {skipped === 1 ? "file" : "files"} not matching {formats || label}.
				</p>
			)}

			<button type="button" className="primary" disabled={busy || !hasFiles} onClick={connect}>
				{busy ? "Reading statements..." : connected ? "Reconnect" : "Upload and connect"}
			</button>

			<p className="muted file-note">
				Files are parsed in memory on the local dev server and never leave this machine.
			</p>

			{provider.setup.length > 0 && (
				<details className="help-steps" open>
					<summary>How to get your statement</summary>
					<ol className="muted">
						{provider.setup.map((step) => (
							<SetupInstruction key={step.description} step={step} />
						))}
					</ol>
				</details>
			)}
		</>
	);
}

/** Does the file satisfy an HTML `accept` list (extensions and MIME types, comma separated)? */
function matchesAccept(file: File, accept?: string): boolean {
	if (!accept) return true;
	const name = file.name.toLowerCase();
	const type = file.type.toLowerCase();
	return accept
		.split(",")
		.map((rule) => rule.trim().toLowerCase())
		.filter(Boolean)
		.some((rule) => {
			if (rule.startsWith(".")) return name.endsWith(rule);
			if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
			return type === rule;
		});
}

/** Human readable form of an `accept` list, e.g. "PDF" for "application/pdf,.pdf". */
function describeAccept(accept?: string): string {
	if (!accept) return "";
	const rules = accept
		.split(",")
		.map((rule) => rule.trim())
		.filter(Boolean);
	const extensions = rules.filter((rule) => rule.startsWith(".")).map((rule) => rule.slice(1).toUpperCase());
	if (extensions.length > 0) return [...new Set(extensions)].join(", ");
	return rules.join(", ");
}

/** Drop repeats of the same file (same name, size and modification time). */
function dedupe(files: File[]): File[] {
	const seen = new Set<string>();
	return files.filter((file) => {
		const id = `${file.name}:${file.size}:${file.lastModified}`;
		if (seen.has(id)) return false;
		seen.add(id);
		return true;
	});
}

function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
