import { useState } from "react";

export const useRun = () => {
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

	async function run<T>(fn: () => Promise<T>) {
		setBusy(true);
		setBanner(null);
		try {
			await fn();
		} catch (e) {
			setBanner({ kind: "error", text: e instanceof Error ? e.message : "Something went wrong" });
		} finally {
			setBusy(false);
		}
	}

  return { busy, banner, run };
}