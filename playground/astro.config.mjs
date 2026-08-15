import node from "@astrojs/node";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";

// The playground is a small SSR Astro app (running on Node) that serves the UI
// and exposes API endpoints which call the library server-side, so the OAuth
// client secret never reaches the browser.
//
// The library is imported straight from its TypeScript source via an alias, so
// no build step of the library is required to use the playground.
export default defineConfig({
	output: "server",
	adapter: node({ mode: "standalone" }),
	integrations: [react()],
	// Dedicated port so it never collides with app/apps/web (4321).
	server: { port: 4400 },
	vite: {
		resolve: {
			alias: {
				"@finon/connect": fileURLToPath(new URL("../src/index.ts", import.meta.url)),
			},
		},
		server: {
			// Allow Vite to read the library source, which lives outside this app.
			fs: { allow: [fileURLToPath(new URL("..", import.meta.url))] },
		},
	},
});
