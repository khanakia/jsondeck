// Writes src/externals/*.gen.ts: the import map and preload lists that let the
// <script> build (dist/jsondeck.js + dist/chunks/) load every third-party
// library from the JSPM CDN (ga.jspm.io) instead of bundling it.
//
// How: start from the bare specifiers our chunks import (ENTRIES below), find
// the version installed in node_modules (= pnpm-lock.yaml), point the
// specifier at that exact version's file on ga.jspm.io (read from the
// package.json JSPM serves, whose "exports" name its built files), then fetch
// each file and follow what it imports: relative imports stay inside the
// package, bare imports ("react", "@floating-ui/react-dom", ...) are resolved
// the same way from the importing package's own node_modules. JSPM leaves every
// dependency as a bare specifier, so the import map below decides where each
// one comes from; that is what keeps exactly one React on the page.
//
// Needs network access. Run it when a dependency version changes:
//   node scripts/gen-externals.mjs          (writes src/externals/*.gen.ts)
//   node scripts/gen-externals.mjs --check  (offline: fails if the file no longer matches node_modules)
import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { gzipSync } from "node:zlib"

const ROOT = new URL("../", import.meta.url).pathname
/** src/externals/: map.gen.ts (the import map, for the loader) and one <part>.gen.ts list of files per part. */
const OUT_DIR = join(ROOT, "src/externals")
const CDN = "https://ga.jspm.io/npm:"
/** For a dependency-free package JSPM has not built yet (see resolveBare). */
const FALLBACK = "https://cdn.jsdelivr.net/npm/"
/** Export conditions of a production browser ES module load, in no particular order (the package's key order decides, as in Node). */
const CONDITIONS = new Set(["browser", "production", "import", "module", "default"])

/**
 * Bare specifiers the split build leaves as imports (vite.config.ts EXTERNALS),
 * grouped by when the page first needs them:
 *  - react: the first render (the loader preloads these with the core);
 *  - popups: the popups chunk (menus, popovers, dialogs);
 *  - calendar: the date filter's calendar.
 * clsx and class-variance-authority are in "react": the core's buttons use them.
 */
const ENTRIES = {
	react: ["react", "react/jsx-runtime", "react-dom", "react-dom/client", "clsx", "class-variance-authority"],
	popups: ["@base-ui/react/menu", "@base-ui/react/popover", "@base-ui/react/dialog"],
	calendar: ["react-day-picker"],
}
/** Packages that must resolve to exactly one version and one URL: two copies of any of them crash hooks. */
const SINGLE = ["react", "react-dom", "scheduler"]

const pkgName = (spec) => (spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0])
/** node_modules/<name> as seen from `fromDir`, walking up like Node does (pnpm keeps each package's deps next to it). */
function findPkgDir(name, fromDir) {
	for (let d = fromDir; ; d = dirname(d)) {
		const p = join(d, "node_modules", name, "package.json")
		if (existsSync(p)) return realpathSync(dirname(p))
		if (d === dirname(d)) throw new Error(`gen-externals: ${name} is not installed (looked from ${fromDir})`)
	}
}
const installedVersion = (dir) => JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).version

/** Pick the target of an "exports" value for CONDITIONS. */
function pickTarget(v) {
	if (typeof v === "string") return v
	if (Array.isArray(v)) { for (const x of v) { const t = pickTarget(x); if (t) return t } return null }
	if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) if (CONDITIONS.has(k)) { const t = pickTarget(x); if (t) return t }
	return null
}
/** Resolve "./sub" (or ".") against a package.json "exports" map, with "*" patterns. */
function resolveExports(exp, sub) {
	if (typeof exp === "string" || Array.isArray(exp) || !Object.keys(exp).some((k) => k.startsWith("."))) return sub === "." ? pickTarget(exp) : null
	if (sub in exp) return pickTarget(exp[sub])
	for (const [k, v] of Object.entries(exp)) {
		const star = k.indexOf("*")
		if (star < 0) continue
		const pre = k.slice(0, star), post = k.slice(star + 1)
		if (sub.startsWith(pre) && sub.endsWith(post) && sub.length >= pre.length + post.length) {
			const t = pickTarget(v)
			if (t) return t.replace("*", sub.slice(pre.length, sub.length - post.length))
		}
	}
	return null
}

const jspmPkgCache = new Map()
async function jspmPkg(name, version) {
	const key = `${name}@${version}`
	if (!jspmPkgCache.has(key)) {
		const r = await fetch(`${CDN}${key}/package.json`)
		if (r.status === 404) jspmPkgCache.set(key, null)
		else if (!r.ok) throw new Error(`gen-externals: ${CDN}${key}/package.json answered ${r.status}`)
		else jspmPkgCache.set(key, await r.json())
	}
	return jspmPkgCache.get(key)
}

/** CDN URL of a bare specifier imported from `fromDir`: { url, name, version, dir }. */
async function resolveBare(spec, fromDir) {
	const name = pkgName(spec)
	const dir = findPkgDir(name, fromDir)
	const version = installedVersion(dir)
	const pkg = await jspmPkg(name, version)
	const sub = spec === name ? "." : `.${spec.slice(name.length)}`
	if (!pkg) {
		// JSPM has not built this exact version. A package with no dependencies of its
		// own can come from jsDelivr's +esm build instead: it then imports nothing, so
		// it cannot bring a second copy of anything (crawl() fails if it does import).
		const own = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"))
		if (Object.keys({ ...own.dependencies, ...own.peerDependencies }).length) throw new Error(`gen-externals: JSPM has no build of ${name}@${version}, and it has dependencies, so jsDelivr's +esm file (which pins them itself) is not safe`)
		return { url: `${FALLBACK}${name}@${version}${sub === "." ? "" : sub.slice(1)}/+esm`, name, version, dir }
	}
	const target = pkg.exports ? resolveExports(pkg.exports, sub) : sub === "." ? (pkg.module ?? pkg.main ?? "index.js") : sub
	if (!target) throw new Error(`gen-externals: ${spec}@${version} has no export for ${sub} on JSPM`)
	return { url: new URL(target, `${CDN}${name}@${version}/`).href, name, version, dir }
}

const IMPORT_RE = /(?:\bimport\s*(?:[\w$*{}\s,]+from\s*)?|\bexport\s*[\w$*{}\s,]*from\s*|\bimport\s*\()\s*["']([^"']+)["']/g

/** imports: spec -> url. files: url -> { name, gz, group }. */
const imports = new Map()
const files = new Map()
const versions = new Map()
const urlOwner = new Map()

async function crawl(group) {
	const queue = []
	for (const spec of ENTRIES[group]) {
		const r = await resolveBare(spec, ROOT)
		setImport(spec, r)
		queue.push(r)
	}
	while (queue.length) {
		const batch = queue.splice(0, 12)
		await Promise.all(batch.map(async ({ url, name, version, dir }) => {
			if (files.has(url)) return
			files.set(url, null)
			const res = await fetch(url)
			if (!res.ok) throw new Error(`gen-externals: ${url} answered ${res.status}`)
			const code = await res.text()
			files.set(url, { name, version, gz: gzipSync(code, { level: 9 }).length, group })
			for (const m of code.matchAll(IMPORT_RE)) {
				const s = m[1]
				if (s.startsWith("http:") || s.startsWith("https:") || (s.startsWith("/") && !s.startsWith("//"))) throw new Error(`gen-externals: ${url} imports a URL (${s}); only bare and relative imports keep one copy per package`)
				if (s.startsWith(".")) { queue.push({ url: new URL(s, url).href, name, version, dir }); continue }
				const r = await resolveBare(s, dir)
				setImport(s, r)
				queue.push(r)
			}
		}))
	}
}
function setImport(spec, r) {
	const prev = imports.get(spec)
	if (prev && prev !== r.url) throw new Error(`gen-externals: ${spec} resolves to two files (${prev} and ${r.url}); add an import-map scope for it before going further`)
	imports.set(spec, r.url)
	const v = versions.get(r.name)
	if (v && v !== r.version) throw new Error(`gen-externals: two versions of ${r.name} (${v}, ${r.version})`)
	versions.set(r.name, r.version)
	urlOwner.set(r.url, r.name)
}

if (process.argv.includes("--check")) {
	// Offline: every package version written into the file must still be the installed one.
	const text = readdirSync(OUT_DIR).filter((f) => f.endsWith(".gen.ts")).map((f) => readFileSync(join(OUT_DIR, f), "utf8")).join("\n")
	const bad = []
	for (const m of text.matchAll(/npm:((?:@[^/@]+\/)?[^/@]+)@([^/"]+)\//g)) {
		const [, name, version] = m
		let have = ""
		try { have = installedVersion(findPkgDir(name, ROOT)) } catch { have = "" }
		// Transitive packages are not in the root node_modules; only check what is.
		if (have && have !== version && !bad.includes(name)) bad.push(`${name} ${version} (installed ${have})`)
	}
	if (bad.length) { console.error(`gen-externals --check: src/externals/*.gen.ts are out of date: ${bad.join(", ")}; run node scripts/gen-externals.mjs`); process.exit(1) }
	console.log("gen-externals --check: src/externals/*.gen.ts match node_modules")
	process.exit(0)
}

for (const g of Object.keys(ENTRIES)) await crawl(g)
for (const n of SINGLE) if (!versions.has(n)) throw new Error(`gen-externals: ${n} never resolved`)

const byGroup = {}
for (const g of Object.keys(ENTRIES)) byGroup[g] = [...files].filter(([, f]) => f?.group === g).map(([u]) => u).sort()
const sizes = {}
for (const [u, f] of files) if (f) sizes[u] = f.gz
const pkgOf = {}
for (const [u, f] of files) if (f) pkgOf[u] = f.name

const sortedImports = Object.fromEntries([...imports].sort(([a], [b]) => a.localeCompare(b)))
const HEAD = `// Generated by scripts/gen-externals.mjs from the versions in pnpm-lock.yaml. Do not edit:
// change a dependency, then run \`node scripts/gen-externals.mjs\`.
`
mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(join(OUT_DIR, "map.gen.ts"), `${HEAD}
/**
 * Import map for the <script> build: every bare specifier our chunks and the
 * CDN files import, pinned to one exact file. JSPM leaves all dependencies as
 * bare specifiers, so this map alone decides where each one comes from, and
 * each package (React above all) loads exactly once. Only the loader reads it.
 */
export const IMPORT_MAP: Readonly<Record<string, string>> = ${JSON.stringify(sortedImports, null, "\t")}

/** Exact version of every package loaded from the CDN. */
export const EXTERNAL_VERSIONS: Readonly<Record<string, string>> = ${JSON.stringify(Object.fromEntries([...versions].sort()), null, "\t")}
`)
const WHEN = {
	react: "the first render: the loader preloads them together with the core (React, React DOM, the scheduler, clsx, class-variance-authority)",
	popups: "the popups chunk: preloaded the moment it starts loading (Base UI, floating-ui and their helpers)",
	calendar: "a date filter's calendar: preloaded when it starts loading (react-day-picker, date-fns)",
}
for (const [g, list] of Object.entries(byGroup)) {
	writeFileSync(join(OUT_DIR, `${g}.gen.ts`), `${HEAD}
/**
 * Every CDN file needed by ${WHEN[g]}. Listed so they can all be fetched in
 * parallel (modulepreload) instead of one import level at a time. A file
 * listed for an earlier part is not repeated here.
 */
export const FILES: readonly string[] = ${JSON.stringify(list, null, "\t")}
`)
}
// Sizes for the README and the report (gzip -9 of what JSPM serves).
const kb = (n) => `${(n / 1024).toFixed(1)} kB`
for (const [g, list] of Object.entries(byGroup)) {
	const perPkg = {}
	for (const u of list) perPkg[pkgOf[u]] = (perPkg[pkgOf[u]] ?? 0) + sizes[u]
	console.log(`${g}: ${list.length} files, ${kb(list.reduce((a, u) => a + sizes[u], 0))} gzip`)
	for (const [p, s] of Object.entries(perPkg).sort((a, b) => b[1] - a[1])) console.log(`  ${p}@${versions.get(p)} ${kb(s)}`)
}
writeFileSync(join(ROOT, "shots/externals-sizes.json"), JSON.stringify({ sizes, pkgOf, byGroup, versions: Object.fromEntries(versions) }, null, 1))
console.log(`wrote ${OUT_DIR}/*.gen.ts (${imports.size} specifiers, ${files.size} files)`)
