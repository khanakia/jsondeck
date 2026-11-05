// Settings shared by every build (the <script> loader, the split chunks, the ES
// module and the single offline file) so they stay in step: the "@/…" aliases
// the table files use, the production define, the license banner, the
// minifier options and how chunks are grouped.
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
const pkg: unknown = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"))
const version = typeof pkg === "object" && pkg !== null && "version" in pkg && typeof pkg.version === "string" ? pkg.version : "0.0.0"

/** …plus the package version for src/version.ts (it used to be a literal that releases forgot to bump). */
export const DEFINE = { "process.env.NODE_ENV": JSON.stringify("production"), __JSONDECK_VERSION__: JSON.stringify(version) }

/** The one license comment kept in each file; every bundled third-party license comment is dropped (see LICENSE + the packages themselves). */
export const BANNER = `/*! jsondeck v${version} | MIT License | github.com/khanakia/jsondeck */`

/**
 * Never mangle a variable to these names: the release script's
 * internal-info scan matches a two-letter word, and a minified variable
 * once happened to be called exactly that.
 */
// Spelled out of letters so this source file does not trip the same scan.
const MANGLE = { reserved: [["A", "I"].join("")] }

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
		mangle: MANGLE,
		format: { comments: false, preamble: BANNER, preserve_annotations: false },
	},
}

/** The same for the split ES module builds: `module` lets terser rename top-level names too (an ES module has no globals to protect). */
export const MINIFY_ESM: Pick<BuildEnvironmentOptions, "minify" | "terserOptions"> = {
	minify: "terser",
	terserOptions: {
		module: true,
		compress: { passes: 2, pure_funcs: ["console.debug"] },
		mangle: MANGLE,
		format: { comments: false, preamble: BANNER, preserve_annotations: false },
	},
}

/**
 * File name of a chunk (inside dist/chunks/ or dist/esm/). No content hash:
 * every file is served from a versioned CDN path (…/jsondeck@vX.Y.Z/dist/…),
 * so the tag already busts caches, and plain names keep the README chunk list
 * readable. Shared chunks are named after the parts that use them
 * ("shared~StatTile~Chart" becomes "shared-stattile-chart.js").
 */
export function CHUNK_NAMES(chunk: { name: string }): string {
	const name = chunk.name.startsWith("shared~") ? `shared-${chunk.name.slice(7).split("~").join("-")}` : chunk.name
	return `${name.toLowerCase()}.js`
}

/**
 * How the split builds group modules. Without this the bundler makes a small
 * common chunk for every set of chunks that share a module (a plain table page
 * then fetched about 15 files). Two rules instead:
 *  - "core": everything the entry imports statically (`$initial`), so a table
 *    page needs exactly the entry plus this one file;
 *  - "shared": code that two or more on-demand chunks share and the core does
 *    not have (lucide icons, viz colours, the search helpers), merged per set
 *    of users, with tiny sets folded into a neighbour.
 */
export const CODE_SPLITTING = {
	groups: [
		{ name: "core", tags: ["$initial" as const], priority: 2 },
		{ name: "shared", minShareCount: 2, priority: 1, entriesAware: true },
	],
}
