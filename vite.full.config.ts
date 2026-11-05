// The single offline file: dist/jsondeck.full.js, one IIFE (global `JsonDeck`)
// with React, every on-demand part (its `import()`s are inlined here, so
// nothing is fetched) and, after scripts/make-full.mjs, the CSS. For pages
// opened from file://, where browsers block the module loading the split
// build needs. Also writes dist/jsondeck.css. Runs first: it empties dist/.
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { ALIASES, DEFINE, MINIFY, lucideLite } from "./vite.shared"

export default defineConfig({
	plugins: [lucideLite(), react(), tailwindcss()],
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
			fileName: () => "jsondeck.full.js",
			cssFileName: "jsondeck",
		},
	},
})
