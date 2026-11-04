// Settings shared by every library build (IIFE, ESM, Preact IIFE) so the three
// stay in step: the "@/…" aliases the table files use, the
// production define, the license banner and the minifier options.
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import type { Alias, BuildEnvironmentOptions } from "vite"

export const src = (p: string) => fileURLToPath(new URL(`./src/${p}`, import.meta.url))

/** The ported files import the app paths "@/components/ui/…" and "@/lib/…"; map them into src/. */
export const ALIASES: Alias[] = [
	{ find: /^@\/components\/ui\//, replacement: `${src("ui")}/` },
	{ find: /^@\/lib\//, replacement: `${src("lib")}/` },
]

/**
 * Always a production build: drops React and Base UI dev-only code, and leaves no
 * `process.env` reference behind, which would throw when the ESM file is loaded
 * straight into a browser from a CDN (there is no `process` there).
 */
export const DEFINE = { "process.env.NODE_ENV": JSON.stringify("production") }

const pkg: unknown = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"))
const version = typeof pkg === "object" && pkg !== null && "version" in pkg && typeof pkg.version === "string" ? pkg.version : "0.0.0"

/** The one license comment kept in each file; every bundled third-party license comment is dropped (see LICENSE + the packages themselves). */
export const BANNER = `/*! jsondeck v${version} | MIT License | github.com/khanakia/jsondeck */`

/**
 * terser, not the default oxc minifier: in library ESM mode Vite's oxc pass skips
 * whitespace, which left dist/jsondeck.mjs at 696 kB raw / 178 kB gzip; terser
 * takes it to about 509 kB / 154 kB and matches oxc on the IIFE. PURE annotations
 * are not kept: they added about 30 kB raw and nothing consumes them, because the
 * package is one module that the mount entry uses as a whole.
 */
export const MINIFY: Pick<BuildEnvironmentOptions, "minify" | "terserOptions"> = {
	minify: "terser",
	terserOptions: {
		compress: { passes: 2, pure_funcs: ["console.debug"] },
		mangle: true,
		format: { comments: false, preamble: BANNER, preserve_annotations: false },
	},
}
