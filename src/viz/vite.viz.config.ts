// Demo build for the viz layer only: dist-viz/viz.js (global JsonDeckViz) + viz.css.
// Run from the repo root: pnpm exec vite build -c src/viz/vite.viz.config.ts
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// URL.pathname instead of node:url keeps this file type-checkable under the repo tsconfig (types: []).
const root = decodeURIComponent(new URL("../../", import.meta.url).pathname)
const src = (p: string) => `${root}src/${p}`

export default defineConfig({
	root,
	plugins: [react(), tailwindcss()],
	resolve: { alias: [
		{ find: /^@\/components\/ui\//, replacement: `${src("ui")}/` },
		{ find: /^@\/lib\//, replacement: `${src("lib")}/` },
	] },
	define: { "process.env.NODE_ENV": JSON.stringify("production") },
	build: {
		outDir: `${root}dist-viz`,
		emptyOutDir: true,
		cssCodeSplit: false,
		lib: { entry: src("viz/demo.tsx"), name: "JsonDeckViz", formats: ["iife"], fileName: () => "viz.js", cssFileName: "viz" },
	},
})
