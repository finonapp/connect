import type { Client } from "./connection";
import type { AssetType, AuthKind, Credentials } from "./types";

/**
 * A provider descriptor: static, consumer-facing facts about a provider
 * (everything a product needs to render a "connect an account" screen) plus
 * the `Client` class that talks to it. Each provider module exports its own
 * descriptor, declared `satisfies Provider<ItsCredentials>`, and the package
 * aggregates them into the `providers` registry.
 */
export interface Provider<C extends Credentials = Credentials> {
	/** Stable provider id, matches the connection class (e.g. "trading212"). */
	id: string;
	/** Human readable provider name, e.g. "Trading 212". */
	name: string;
	auth: AuthKind;
	/** The client class for this provider; `createClient` instantiates and verifies it. */
	createClient: (credentials: C) => Promise<Client<C>>;
	/** Asset types a session with this provider can return. */
	assetTypes: AssetType[];
	/** ISO 3166-1 alpha-2 countries served. Omitted = not specified. */
	countries?: string[];
	website: string;
	/** Deep link into the provider's mobile app, when it has one. */
	appUrl?: string;
	/**
	 * Fields to collect from the user, in display order: text fields for API
	 * keys, a file field for statement uploads. Empty for OAuth providers,
	 * where the redirect collects everything.
	 */
	params: CredentialParam[];
	/**
	 * Step-by-step instructions to show the user before the credential form.
	 * Empty for OAuth providers, where the redirect does the walking.
	 */
	setup: SetupStep[];
}

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
 * One field to collect from the user, in display order. `key` matches the
 * field name in the provider's credentials object (e.g. `apiKey`, `files`),
 * so the collected values can be passed to the `Client` constructor as-is.
 */
export interface CredentialParam {
	key: string;
	/** Human readable field label, e.g. "Key ID". */
	label: string;
	/** Kind of input. Defaults to a secret text field; "file" asks for an upload. */
	type?: "text" | "file";
	/** For `type: "file"`: accepted file types, in HTML `accept` attribute syntax. */
	accept?: string;
	/** For `type: "file"`: whether the user may provide several files at once. */
	multiple?: boolean;
}
