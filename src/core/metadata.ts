import type { AssetType } from "./types";

/**
 * Static, consumer-facing facts about a provider: everything a product needs
 * to render a "connect an account" screen without hardcoding provider
 * knowledge. Each provider module exports its own metadata; the package
 * aggregates them into the `providers` registry.
 */

/** How a provider authenticates, i.e. which connection contract it implements. */
export type AuthKind = "oauth" | "api-key";

/** A link a setup step can point the user at. */
export interface SetupLink {
	/** Display text for the link. */
	text: string;
	webUrl: string;
	/** Deep link into the provider's mobile app, when it has one. */
	appUrl?: string;
}

/**
 * One user-facing instruction in a provider's connect flow. When
 * `description` contains the `{{link}}` placeholder, render `link` there;
 * otherwise render the step as plain text.
 */
export interface SetupStep {
	description: string;
	link?: SetupLink;
}

/**
 * One credential field to collect from the user, in display order. `key`
 * matches the field name in the provider's credentials object (e.g.
 * `apiKey`), so the collected values can be passed to `verify` / `session`
 * as-is.
 */
export interface CredentialParam {
	key: string;
	/** Human readable field label, e.g. "Key ID". */
	label: string;
}

/** Static facts about a provider, for rendering connect UIs. */
export interface ProviderMetadata {
	/** Stable provider id, matches the connection class (e.g. "trading212"). */
	id: string;
	/** Human readable provider name, e.g. "Trading 212". */
	name: string;
	auth: AuthKind;
	/** Asset types a session with this provider can return. */
	assetTypes: AssetType[];
	/** ISO 3166-1 alpha-2 countries served. Omitted = not specified. */
	countries?: string[];
	website: string;
	/** Deep link into the provider's mobile app, when it has one. */
	appUrl?: string;
	/**
	 * Credential fields to collect from the user, in display order. Empty for
	 * OAuth providers, where the redirect collects everything.
	 */
	params: CredentialParam[];
	/**
	 * Step-by-step instructions to show the user before the credential form.
	 * Empty for OAuth providers, where the redirect does the walking.
	 */
	setup: SetupStep[];
}
