import type { Asset, Provider, Transaction } from "@finon/connect";
import { useRun } from "@lib/hooks";
import { getJson, postJson } from "@lib/http";
import { isConnected, reset } from "@lib/store";
import { useEffect, useState } from "react";
import DataViewer from "../DataView";
import { PlaygroundApiKey } from "./ApiKey";
import { PlaygroundFileImport } from "./FileImport";

export default function Playground({ provider }: { provider: Provider }) {
	const [connected, setConnected] = useState(false);
	const { busy, banner, run } = useRun();

	// Data
	const [assets, setAssets] = useState<Asset[] | null>(null);
	const [transactions, setTransactions] = useState<Transaction[] | null>(null);
	const [txnAssetName, setTxnAssetName] = useState<string>("");

	useEffect(() => {
		setConnected(isConnected(provider.id));
	}, [provider.id, provider.auth]);

	// Compared as strings: importing the `AuthKind` enum would pull the whole
	// (Node-only) library into the browser bundle.
	const auth: string = provider.auth;
	const connectHeading = auth === "file-import" ? `${provider.name} statement` : `${provider.name} credentials`;

	function disconnect() {
		return run(async () => {
			reset(provider.id);
			setAssets(null);
			setTransactions(null);
			setConnected(false);
		});
	}

	function loadAssets() {
		return run(async () => {
			const { assets } = await getJson(`/api/${provider.id}/assets`);
			setAssets(assets);
			setTransactions(null);
		});
	}

	function fullSync() {
		return run(async () => {
			const result = await postJson(`/api/${provider.id}/sync`);
			setAssets(result.assets);
			setTransactions(result.transactions);
			setTxnAssetName("all assets");
		});
	}

	function loadTransactions(asset: Asset) {
		return run(async () => {
			const { transactions } = await postJson(`/api/${provider.id}/transactions`, { asset });
			setTransactions(transactions);
			setTxnAssetName(`${asset.name} (${asset.symbol})`);
		});
	}

	function renderConnect() {
		const props = { provider, setConnected, run, busy, connected };
		switch (auth) {
			case "api-key":
				return <PlaygroundApiKey {...props} />;
			case "file-import":
				return <PlaygroundFileImport {...props} />;
			default:
				return (
					<p className="muted">
						{provider.name} uses OAuth; the browser redirect flow is not wired into the playground yet.
					</p>
				);
		}
	}

	return (
		<div className="playground">
			{banner && <div className={`banner ${banner.kind}`}>{banner.text}</div>}

			<section className="card">
				<div className="toolbar">
					<h2>{connectHeading}</h2>
					<div className="spacer" />
					{connected && (
						<>
							<span className="status-dot connected" /> Connected
							<button type="button" className="ghost" disabled={busy} onClick={disconnect}>
								Disconnect
							</button>
						</>
					)}
				</div>

				{renderConnect()}
			</section>

			<section className="card">
				<div className="toolbar">
					<h2>Assets</h2>
					<div className="spacer" />
					<button type="button" disabled={busy || !connected} onClick={loadAssets}>
						Get assets
					</button>
					<button type="button" disabled={busy || !connected} onClick={fullSync}>
						Full sync
					</button>
				</div>
				{assets ? (
					<>
						<DataViewer title="" items={assets as unknown as Array<Record<string, unknown>>} />
						{assets.length > 0 && (
							<div className="account-actions">
								<span className="muted">Fetch transactions for:</span>
								{assets.map((asset) => (
									<button type="button" key={asset.id} disabled={busy} onClick={() => loadTransactions(asset)}>
										{asset.name} ({asset.symbol})
									</button>
								))}
							</div>
						)}
					</>
				) : (
					<p className="muted">
						{connected ? "Load assets with the buttons above." : "Connect above, then load assets."}
					</p>
				)}
			</section>

			<section className="card">
				<h2>Transactions{transactions ? ` — ${txnAssetName}` : ""}</h2>
				{transactions ? (
					<DataViewer title="" items={transactions as unknown as Array<Record<string, unknown>>} />
				) : (
					<p className="muted">Pick an asset above, or run a full sync.</p>
				)}
			</section>
		</div>
	);
}
