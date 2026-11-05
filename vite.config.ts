// The split build behind the classic <script> loader (dist/jsondeck.js): an ES
// module entry dist/chunks/index.js with React and react-dom bundled in, the
// code every page needs in dist/chunks/core.js, and one chunk per on-demand
// part (popups, charts, calendar, drawer, editor, ...) next to them. React is
// in core.js only, and every chunk imports it from there: one shared copy.
// Other builds: vite.full.config.ts (single offline file, runs first and
// empties dist/), vite.esm.config.ts (module build for React apps),
// vite.loader.config.ts (the loader itself, runs after this one).
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { ALIASES, CHUNK_NAMES, CODE_SPLITTING, DEFINE, MINIFY_ESM, lucideLite } from "./vite.shared"

export default defineConfig({
	plugins: [lucideLite(), react(), tailwindcss()],
	resolve: { alias: ALIASES },
	define: DEFINE,
	build: {
		outDir: "dist",
		emptyOutDir: false,
		cssCodeSplit: false,
		sourcemap: true,
		...MINIFY_ESM,
		lib: { entry: "src/split.ts", formats: ["es"], fileName: () => "chunks/index.js", cssFileName: "jsondeck" },
		rollupOptions: { output: { chunkFileNames: (c) => `chunks/${CHUNK_NAMES(c)}`, codeSplitting: CODE_SPLITTING } },
	},
})
