import type { Provider } from "@finon/connect";
import { postJson } from "@lib/http";
import { useState } from "react";
import { SetupInstruction } from "../SetupInstruction";

type Props = {
	provider: Provider;
	setConnected: (connected: boolean) => void;
	run: (fn: () => Promise<void>) => Promise<void>;
	busy: boolean;
	connected: boolean;
};

export function PlaygroundApiKey({ provider, setConnected, run, busy, connected }: Props) {
	const [apiKey, setApiKey] = useState("");
	const [apiSecret, setApiSecret] = useState("");
	const filled = apiKey.trim() !== "" && apiSecret.trim() !== "";

	async function connect() {
		return run(async () => {
			await postJson(`/api/${provider.id}/connect`, { apiKey, apiSecret });
			setApiKey("");
			setApiSecret("");
			setConnected(true);
		});
	}

	return (
		<>
			<p className="muted">Paste the API credentials from your {provider.name} account.</p>
			<label className="field-label">
				Key ID
				<input
					type="password"
					value={apiKey}
					onChange={(e) => setApiKey(e.target.value)}
					autoComplete="off"
				/>
			</label>
			<label className="field-label">
				Secret Key
				<input
					type="password"
					value={apiSecret}
					onChange={(e) => setApiSecret(e.target.value)}
					autoComplete="off"
				/>
			</label>
			<button type="button" className="primary" disabled={busy || !filled} onClick={connect}>
				{busy ? "Verifying..." : connected ? "Reconnect" : "Connect"}
			</button>
			{provider.setup.length > 0 && (
				<details className="help-steps" open>
					<summary>How to find your keys</summary>
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
