import type { ProviderMetadata } from "@finon/connect";
import { useRun } from "@lib/hooks";
import { postJson } from "@lib/http";
import { isConnected } from "@lib/store";
import { useState } from "react";
import { SetupInstruction } from "../SetupInstruction";

type Props = {
  provider: ProviderMetadata;
  setConnected: (connected: boolean) => void;
  setBanner: (banner: { kind: "ok" | "error"; text: string } | null) => void;
};

export function PlaygroundApiKey({ provider, setConnected, setBanner }: Props) {
  const { run, banner, busy } = useRun();
  const connected = isConnected(provider.id);
  const [values, setValues] = useState<Record<string, string>>({});
  const filled = provider.params.every((param) => values[param.key]?.trim());

  async function connect() {
    return run(async () => {
      await postJson(`/api/${provider.id}/connect`, values);
      setValues({});
      setConnected(true);
      setBanner(banner);
    });
  }

  return (
    <>
      <p className="muted">
        Paste the API credentials from your {provider.name} account.
      </p>
      {provider.params.map((param) => (
        <label className="field-label" key={param.key}>
          {param.label}
          <input
            type="password"
            value={values[param.key] ?? ""}
            onChange={(e) =>
              setValues({ ...values, [param.key]: e.target.value })
            }
            autoComplete="off"
          />
        </label>
      ))}
      <button
        type="button"
        className="primary"
        disabled={busy || !filled}
        onClick={connect}
      >
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
