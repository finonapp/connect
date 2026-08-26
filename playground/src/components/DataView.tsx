import { useState } from "react";

interface DataViewProps {
	/** Optional heading; omit when the surrounding card already has one. */
	title?: string;
	/** Each item is a normalized object that also carries a `raw` provider payload. */
	items: Array<Record<string, unknown>>;
}

function stringifyCell(value: unknown): string {
	if (value === null || value === undefined) return "";
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
}

/** Renders a list of normalized records with a toggle to inspect the raw payload. */
export default function DataView({ title, items }: DataViewProps) {
	const [mode, setMode] = useState<"normalized" | "raw">("normalized");

	if (items.length === 0) {
		return (
			<section className="data-view">
				{title && (
					<div className="data-view-head">
						<h3>{title}</h3>
					</div>
				)}
				<p className="muted">No records returned.</p>
			</section>
		);
	}

	// Columns = all normalized keys except the raw escape hatch.
	const columns = Array.from(
		items.reduce((set, item) => {
			for (const key of Object.keys(item)) if (key !== "raw") set.add(key);
			return set;
		}, new Set<string>()),
	);

	return (
		<section className="data-view">
			<div className="data-view-head">
				<h3>
					{title ? `${title} ` : ""}
					<span className="count">({items.length})</span>
				</h3>
				<div className="toggle">
					<button type="button" className={mode === "normalized" ? "active" : ""} onClick={() => setMode("normalized")}>
						Normalized
					</button>
					<button type="button" className={mode === "raw" ? "active" : ""} onClick={() => setMode("raw")}>
						Raw
					</button>
				</div>
			</div>

			{mode === "normalized" ? (
				<div className="table-scroll">
					<table>
						<thead>
							<tr>
								{columns.map((col) => (
									<th key={col}>{col}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{items.map((item, i) => (
								<tr key={(item.id as string) ?? i}>
									{columns.map((col) => (
										<td key={col}>{stringifyCell(item[col])}</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : (
				<pre className="raw-json">
					{JSON.stringify(
						items.map((item) => item.raw ?? item),
						null,
						2,
					)}
				</pre>
			)}
		</section>
	);
}
