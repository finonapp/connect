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
	validateCredentials?: (credentials: C) => Promise<void>;
	/** The client class for this provider; `createClient` instantiates and verifies it. */
	Client: (credentials: C) => Client<C>;
	/** Asset types a session with this provider can return. */
	assetTypes: AssetType[];
	/** ISO 3166-1 alpha-2 countries served. Omitted = not specified. */
	countries?: string[];
	/** Deep link into the provider's mobile app, when it has one. */
	url?: {
		website: string;
		app?: string;
	};
	/**
	 * Step-by-step instructions to show the user before the credential form.
	 * Empty for OAuth providers, where the redirect does the walking.
	 */
	setup: SetupStep[];
}

/**
 * One user-facing instruction in a provider's connect flow. When
 * `description` contains the `{{link}}` placeholder, render `link` there;
 * otherwise render the step as plain text.
 */
export interface SetupStep {
	id: number;
	description: string;
	link?: {
		/** Display text for the link. */
		text: string;
		webUrl: string;
		/** Deep link into the provider's mobile app, when it has one. */
		appUrl?: string;
	};
}
