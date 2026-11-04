// Optional IIFE built against Preact instead of React: dist/jsondeck.preact.js,
// same global `JsonDeck`, same API, react and react-dom aliased to preact/compat.
// Written to dist-preact/ and copied into dist/ only by `pnpm build:preact`, so
// the default build never depends on it. Shared settings: vite.shared.ts.
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { ALIASES, DEFINE, MINIFY } from "./vite.shared"

const compat = fileURLToPath(new URL("./node_modules/preact/compat/", import.meta.url))
const preact = fileURLToPath(new URL("./node_modules/preact/", import.meta.url))

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: [
			...ALIASES,
			{ find: /^react\/jsx-(dev-)?runtime$/, replacement: `${preact}jsx-runtime/dist/jsxRuntime.mjs` },
			{ find: /^react-dom\/client$/, replacement: `${compat}client.mjs` },
			{ find: /^react-dom$/, replacement: `${compat}dist/compat.mjs` },
			{ find: /^react$/, replacement: `${compat}dist/compat.mjs` },
		],
	},
	define: DEFINE,
	build: {
		outDir: "dist-preact",
		emptyOutDir: true,
		cssCodeSplit: false,
		sourcemap: true,
		...MINIFY,
		lib: { entry: "src/bundle.ts", name: "JsonDeck", formats: ["iife"], fileName: () => "jsondeck.preact.js", cssFileName: "jsondeck" },
	},
})
