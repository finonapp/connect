import type { Client } from "@finon/connect";

/**
 * In-memory, single-user session store for the playground, keyed by provider
 * id. Each provider's endpoints (under `pages/api/<provider>/`) decide how to
 * build their session; this module only holds on to it.
 *
 * Sessions are stored (rather than rebuilt per request) because they cache
 * static, rate-limited data such as the Trading 212 instrument catalogue.
 *
 * This is a DEV TOOL ONLY. Credentials live in the Node process memory, are
 * never persisted to disk, and are never sent to the browser. Restarting the
 * server clears everything. Do not deploy this anywhere public.
 */
const sessions = new Map<string, Client>();

export function setSession(providerId: string, session: Client): void {
	sessions.set(providerId, session);
}

export function isConnected(providerId: string): boolean {
	return sessions.has(providerId);
}

/** The provider's open session. Throws when not connected yet. */
export function getSession(providerId: string): Client {
	const session = sessions.get(providerId);
	if (!session) throw new Error(`Not connected to ${providerId} yet`);
	return session;
}

/** Disconnect one provider: drop its session and credentials. */
export function reset(providerId: string): void {
	sessions.delete(providerId);
}
