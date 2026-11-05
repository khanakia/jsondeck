// ESM build for apps that bring their own React: dist/jsondeck.mjs with react,
// react-dom and the JSX runtime left as imports (peer dependencies), the code
// every page needs in dist/esm/core.js and the on-demand parts in dist/esm/
// (same split as the <script> build, loaded with plain `import()`). Runs after
// the other builds and must not empty dist/.
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, esmExternalRequirePlugin } from "vite"
import { ALIASES, CHUNK_NAMES, CODE_SPLITTING, DEFINE, MINIFY_ESM } from "./vite.shared"

const PEERS = [/^react$/, /^react\//, /^react-dom$/, /^react-dom\//]

// Base UI pulls in use-sync-external-store/shim, a CommonJS file that calls
// require("react"). With react external, a plain build leaves that require in
// the output, and it throws in every browser ESM load ("Calling `require` for
// react in an environment that doesn't expose the `require` function").
// esmExternalRequirePlugin marks the peers external AND turns those requires
// into real `import` statements (so no rollupOptions.external here: with both,
// the requires stayed).
// Proven by the esm case in scripts/verify-cdn.mjs.

export default defineConfig({
	plugins: [react(), tailwindcss(), esmExternalRequirePlugin({ external: PEERS })],
	resolve: { alias: ALIASES },
	define: DEFINE,
	build: {
		outDir: "dist",
		emptyOutDir: false,
		cssCodeSplit: false,
		sourcemap: true,
		...MINIFY_ESM,
		lib: { entry: "src/bundle.ts", formats: ["es"], fileName: () => "jsondeck.mjs", cssFileName: "jsondeck" },
		rollupOptions: { output: { chunkFileNames: (c) => `esm/${CHUNK_NAMES(c)}`, codeSplitting: CODE_SPLITTING } },
	},
})
