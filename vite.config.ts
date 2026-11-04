// IIFE build for <script> use: dist/jsondeck.js (global `JsonDeck`, React, Base UI
// and lucide bundled in) plus dist/jsondeck.css. Shared settings: vite.shared.ts.
// The one-tag file dist/jsondeck.full.js is made from this output by scripts/make-full.mjs.
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { ALIASES, DEFINE, MINIFY } from "./vite.shared"

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: { alias: ALIASES },
	define: DEFINE,
	build: {
		outDir: "dist",
		emptyOutDir: true,
		cssCodeSplit: false,
		sourcemap: true,
		...MINIFY,
		lib: {
			entry: "src/bundle.ts",
			name: "JsonDeck",
			formats: ["iife"],
			fileName: () => "jsondeck.js",
			cssFileName: "jsondeck",
		},
	},
})
