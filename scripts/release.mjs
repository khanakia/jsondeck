#!/usr/bin/env node
// Release jsondeck: version, changelog, build, checks, scans, commit, tag, push,
// GitHub release, CDN URLs.
//
//   node scripts/release.mjs            release (asks before committing)
//   node scripts/release.mjs --dry      everything except commit, tag, push and release
//   node scripts/release.mjs --yes      no confirmation prompt (used by the workflow)
//   --bump patch                        the only bump allowed (default); minor/major are refused
//   --target github[,cloudflare][,npm]  where to publish (default github)
//
// How the built files reach the CDN without living on main:
//   1. main gets one commit, "release: vX.Y.Z", with only package.json and CHANGELOG.md.
//   2. A second commit, a child of that one and on no branch, adds dist/ (force-added
//      through a temporary git index, so the working tree and main are never touched).
//   3. The tag vX.Y.Z points at that second commit. jsdelivr serves
//      https://cdn.jsdelivr.net/gh/khanakia/jsondeck@vX.Y.Z/dist/<file> from the tag.
// So main stays free of dist/, and every tag carries exactly the files it was built with.
//
// Which version: the first run releases package.json's version as is (0.1.0). Once
// that tag is on GitHub, the next run bumps the patch number and needs entries
// under "## [Unreleased]" in CHANGELOG.md. Re-running is safe: a tag that exists
// locally but not on GitHub is pushed (no rebuild), an existing GitHub release is
// left alone, and a version whose tag is already on GitHub is never released again.
//
// Internal-info scan: the patterns live outside the repo, one regular expression per
// line, in .git/info/release-denylist (never tracked) or the RELEASE_DENYLIST env
// var (a repository secret in CI). Without either, --dry warns and a real run refuses.
//
// Optional targets, read from env vars:
//   cloudflare: R2_BUCKET, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN (uploads dist/ to
//               <bucket>/jsondeck@vX.Y.Z/ with wrangler)
//   npm:        an npm login or NODE_AUTH_TOKEN (npm publish --access public)
import { execFileSync, spawnSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { createInterface } from "node:readline/promises"

const REPO = "khanakia/jsondeck"
const BRANCH = "main"
const REMOTE = "origin"
/** Files in dist/ attached to the GitHub release (the ones people load from a CDN). */
const ASSETS = ["jsondeck.full.js", "jsondeck.js", "jsondeck.mjs", "jsondeck.css"]
const TARGETS = new Set(["github", "cloudflare", "npm"])
/** Each network git call gets a connect timeout and this many tries (the link can be flaky). */
const NET_TRIES = 5
const ROOT = new URL("../", import.meta.url).pathname
const PKG = join(ROOT, "package.json")
const CHANGELOG = join(ROOT, "CHANGELOG.md")
const DENYLIST = join(ROOT, ".git/info/release-denylist")
const TMP_INDEX = join(ROOT, ".git/release-index")

/** Original text of every file this run edited, restored on failure and after a dry run. */
const originals = new Map()

// ---------- arguments ----------
const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const value = (name, fallback) => {
	const i = args.indexOf(name)
	if (i === -1) return fallback
	const v = args[i + 1]
	if (!v || v.startsWith("--")) fail(`${name} needs a value`)
	return v
}
const KNOWN = new Set(["--dry", "--yes", "--bump", "--target", "--help"])
for (let i = 0; i < args.length; i++) {
	const a = args[i]
	if (!KNOWN.has(a)) fail(`unknown argument: ${a} (see the top of scripts/release.mjs)`)
	if (a === "--bump" || a === "--target") i++
}
if (flag("--help")) {
	console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").filter((l) => l.startsWith("//")).map((l) => l.slice(3)).join("\n"))
	process.exit(0)
}
const DRY = flag("--dry")
const YES = flag("--yes")
const bump = value("--bump", "patch")
if (bump !== "patch") fail(`--bump ${bump} refused: jsondeck releases are patch bumps only (0.1.0 -> 0.1.1)`)
const targets = value("--target", "github").split(",").map((t) => t.trim()).filter(Boolean)
for (const t of targets) if (!TARGETS.has(t)) fail(`unknown --target ${t} (github, cloudflare or npm)`)

// ---------- helpers ----------
function fail(msg) {
	console.error(`release: ${msg}`)
	restoreFiles()
	process.exit(1)
}
const step = (n, msg) => console.log(`\n== ${n}. ${msg}${DRY ? "  [dry]" : ""}`)
/** Runs a command and returns its trimmed stdout; throws on a non-zero exit. */
const out = (cmd, cmdArgs, opts = {}) => execFileSync(cmd, cmdArgs, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim()
/** Runs a command with its output shown; fails the release on a non-zero exit. */
const run = (cmd, cmdArgs, opts = {}) => {
	console.log(`$ ${cmd} ${cmdArgs.join(" ")}`)
	const r = spawnSync(cmd, cmdArgs, { cwd: ROOT, stdio: "inherit", ...opts })
	if (r.status !== 0) fail(`${cmd} ${cmdArgs.join(" ")} failed (exit ${r.status ?? r.signal})`)
}
const ok = (cmd, cmdArgs) => spawnSync(cmd, cmdArgs, { cwd: ROOT, stdio: "ignore" }).status === 0
const NET_ENV = { ...process.env, GIT_SSH_COMMAND: process.env.GIT_SSH_COMMAND ?? "ssh -o ConnectTimeout=20" }
/** git over the network, retried. Returns stdout, or throws after the last try. */
function gitNet(gitArgs) {
	let last
	for (let i = 1; i <= NET_TRIES; i++) {
		try {
			return out("git", gitArgs, { env: NET_ENV, timeout: 90_000 })
		} catch (e) {
			last = e
			console.log(`  git ${gitArgs[0]} try ${i}/${NET_TRIES} failed`)
		}
	}
	throw last
}

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/
const parse = (v) => {
	const m = SEMVER.exec(v)
	if (!m) fail(`"${v}" is not a plain x.y.z version`)
	return [Number(m[1]), Number(m[2]), Number(m[3])]
}
const cmp = (a, b) => {
	const x = parse(a), y = parse(b)
	for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]
	return 0
}
const patchOf = (v) => {
	const [a, b, c] = parse(v)
	return `${a}.${b}.${c + 1}`
}

// package.json and CHANGELOG.md are edited before the build (the banner carries the
// version); `originals` (declared at the top) keeps them so a failure or a dry run puts them back.
function editFile(path, next) {
	if (!originals.has(path)) originals.set(path, readFileSync(path, "utf8"))
	writeFileSync(path, next)
}
function restoreFiles() {
	for (const [path, text] of originals) writeFileSync(path, text)
	originals.clear()
	rmSync(TMP_INDEX, { force: true })
}

const today = () => new Date().toISOString().slice(0, 10)
const readPkgVersion = () => {
	const pkg = JSON.parse(readFileSync(PKG, "utf8"))
	if (typeof pkg.version !== "string") fail("package.json has no version")
	return pkg.version
}

/** The text under "## [version]" up to the next "## [" heading, or null. */
function changelogSection(text, version) {
	const lines = text.split("\n")
	const start = lines.findIndex((l) => l.startsWith(`## [${version}]`))
	if (start === -1) return null
	let end = lines.findIndex((l, i) => i > start && l.startsWith("## ["))
	if (end === -1) end = lines.length
	return lines.slice(start + 1, end).join("\n").trim()
}

// ---------- 1. preflight ----------
step(1, "Clean tree on main")
const branch = out("git", ["rev-parse", "--abbrev-ref", "HEAD"])
if (branch !== BRANCH) fail(`on branch "${branch}"; releases are made from ${BRANCH} only`)
const dirty = out("git", ["status", "--porcelain"])
if (dirty) fail(`the working tree has uncommitted changes; commit or stash them first:\n${dirty}`)
console.log(`on ${BRANCH} at ${out("git", ["rev-parse", "--short", "HEAD"])}, tree clean`)

// ---------- 2. version ----------
step(2, "Pick the version (patch bumps only)")
const current = readPkgVersion()
parse(current)
let remoteTags = null
try {
	remoteTags = gitNet(["ls-remote", "--tags", REMOTE]).split("\n").map((l) => l.split("\t")[1] ?? "").filter((r) => r.startsWith("refs/tags/v") && !r.endsWith("^{}")).map((r) => r.slice("refs/tags/v".length)).filter((v) => SEMVER.test(v))
} catch {
	if (!DRY) fail(`cannot reach ${REMOTE} to read its tags`)
	console.log(`  could not reach ${REMOTE}; the dry run assumes no release tags exist there`)
	remoteTags = []
}
const localTags = out("git", ["tag", "-l", "v*"]).split("\n").filter(Boolean).map((t) => t.slice(1)).filter((v) => SEMVER.test(v))
const latest = [...remoteTags].sort(cmp).at(-1) ?? null

let version
let resume = false
if (localTags.includes(current) && !remoteTags.includes(current)) {
	// A previous run tagged but did not finish pushing: push what exists, no rebuild.
	version = current
	resume = true
	console.log(`v${version} is tagged here but not on ${REMOTE}: resuming at the push step`)
} else if (!latest) {
	version = current
	console.log(`no release tags on ${REMOTE} yet: first release, v${version} as in package.json (no bump)`)
} else if (remoteTags.includes(current)) {
	version = patchOf(current)
	console.log(`v${current} is already released; next patch is v${version}`)
} else {
	// package.json was changed by hand past the last release: only the next patch is allowed.
	const allowed = patchOf(latest)
	if (current !== allowed) fail(`package.json says ${current}, but after v${latest} the only allowed version is ${allowed} (patch bumps only)`)
	version = current
	console.log(`package.json already at the next patch, v${version}`)
}
if (!resume && localTags.includes(version)) fail(`tag v${version} already exists here; delete it or finish that release first`)
const TAG = `v${version}`

// ---------- 3. changelog + package.json ----------
step(3, `CHANGELOG.md and package.json for ${version}`)
if (!resume) {
	const text = readFileSync(CHANGELOG, "utf8")
	const unreleased = changelogSection(text, "Unreleased")
	const existing = changelogSection(text, version)
	if (existing !== null) {
		console.log(`CHANGELOG.md already has a ${version} section; leaving it as written`)
		if (unreleased) fail(`"## [Unreleased]" has entries while ${version} already has its own section; move them into one place first`)
	} else {
		if (!unreleased) fail(`nothing under "## [Unreleased]" in CHANGELOG.md; write what changed before releasing ${version}`)
		const next = text.replace(/## \[Unreleased\][\s\S]*?(?=\n## \[|$)/, `## [Unreleased]\n\n## [${version}] - ${today()}\n\n${unreleased}\n`)
		editFile(CHANGELOG, next)
		console.log(`moved the Unreleased entries under "## [${version}] - ${today()}"`)
	}
	if (current !== version) {
		const pkgText = readFileSync(PKG, "utf8")
		editFile(PKG, pkgText.replace(`"version": "${current}"`, `"version": "${version}"`))
		if (readPkgVersion() !== version) fail("could not set the version in package.json")
		console.log(`package.json ${current} -> ${version}`)
	}
} else {
	console.log("resume: skipped")
}

// ---------- 4. build + checks ----------
step(4, "Build, type check and every headless check")
if (!resume) {
	run("pnpm", ["build"])
	run("pnpm", ["typecheck"])
	run("bash", ["scripts/verify-all.sh"])
	for (const f of ASSETS) if (!existsSync(join(ROOT, "dist", f))) fail(`dist/${f} was not built`)
} else {
	console.log("resume: skipped (the tag already holds the built files)")
}

// ---------- 5. secret + internal-info scans ----------
step(5, "gitleaks and the internal-info scan")
if (!ok("gitleaks", ["version"])) fail("gitleaks is not installed (https://github.com/gitleaks/gitleaks)")
run("gitleaks", ["git", "--redact", "--no-banner", "-l", "warn", "."])
run("gitleaks", ["dir", "--redact", "--no-banner", "-l", "warn", "dist"])
const denySource = process.env.RELEASE_DENYLIST ?? (existsSync(DENYLIST) ? readFileSync(DENYLIST, "utf8") : "")
const deny = denySource.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")).map((l) => new RegExp(l))
if (deny.length === 0) {
	if (!DRY) fail("no internal-info patterns found (.git/info/release-denylist or RELEASE_DENYLIST); refusing to release unscanned")
	console.log("  WARN: no internal-info patterns (.git/info/release-denylist or RELEASE_DENYLIST): scan skipped in this dry run")
} else {
	const tracked = out("git", ["ls-files"]).split("\n").filter(Boolean)
	const built = readdirSync(join(ROOT, "dist"), { recursive: true }).map((f) => join("dist", String(f))).filter((f) => statSync(join(ROOT, f)).isFile())
	const hits = []
	for (const file of [...tracked, ...built]) {
		if (/\.(png|jpe?g|gif|ico|woff2?)$/.test(file) || !existsSync(join(ROOT, file))) continue
		const lines = readFileSync(join(ROOT, file), "utf8").split("\n")
		lines.forEach((line, i) => deny.forEach((re, n) => { if (re.test(line)) hits.push(`${file}:${i + 1} (pattern ${n + 1})`) }))
	}
	if (hits.length) fail(`internal info found in ${hits.length} place(s):\n  ${hits.slice(0, 40).join("\n  ")}`)
	console.log(`internal-info scan: ${deny.length} patterns over ${tracked.length} tracked + ${built.length} built files, nothing found`)
}

// ---------- 6. confirm ----------
step(6, "Confirm")
const URLS = ASSETS.map((f) => `https://cdn.jsdelivr.net/gh/${REPO}@${TAG}/dist/${f}`)
if (DRY) {
	console.log(`would release ${TAG} to ${targets.join(", ")}`)
} else if (!YES) {
	const rl = createInterface({ input: process.stdin, output: process.stdout })
	const answer = (await rl.question(`Release ${TAG} to ${targets.join(", ")}? This commits, tags and pushes. [y/N] `)).trim().toLowerCase()
	rl.close()
	if (answer !== "y" && answer !== "yes") fail("stopped at the confirmation")
}

// ---------- 7. commit + tag ----------
step(7, `Commit "release: ${TAG}" on ${BRANCH}, tag a child commit that adds dist/`)
if (DRY) {
	console.log(`would commit package.json + CHANGELOG.md on ${BRANCH}, then commit dist/ on top (no branch) and tag it ${TAG}`)
} else if (!resume) {
	run("git", ["add", "package.json", "CHANGELOG.md"])
	run("git", ["commit", "--allow-empty", "-m", `release: ${TAG}`])
	const env = { ...process.env, GIT_INDEX_FILE: TMP_INDEX }
	out("git", ["read-tree", "HEAD"], { env })
	out("git", ["add", "-f", "dist"], { env })
	const tree = out("git", ["write-tree"], { env })
	rmSync(TMP_INDEX, { force: true })
	const distCommit = out("git", ["commit-tree", tree, "-p", "HEAD", "-m", `release: ${TAG} (built files in dist/)`])
	run("git", ["tag", "-a", TAG, distCommit, "-m", `jsondeck ${TAG}`])
	originals.clear() // committed: nothing to restore any more
}

// ---------- 8. push ----------
step(8, `Push ${BRANCH} and ${TAG}, confirm with git ls-remote`)
if (DRY) {
	console.log(`would run: git push ${REMOTE} ${BRANCH} && git push ${REMOTE} ${TAG}`)
} else {
	gitNet(["push", REMOTE, BRANCH])
	gitNet(["push", REMOTE, TAG])
	const remote = gitNet(["ls-remote", REMOTE, `refs/heads/${BRANCH}`, `refs/tags/${TAG}^{}`])
	const want = { [`refs/heads/${BRANCH}`]: out("git", ["rev-parse", "HEAD"]), [`refs/tags/${TAG}^{}`]: out("git", ["rev-parse", `${TAG}^{commit}`]) }
	for (const [ref, sha] of Object.entries(want)) {
		if (!remote.includes(`${sha}\t${ref}`)) fail(`${REMOTE} does not show ${ref} at ${sha.slice(0, 7)} after the push:\n${remote}`)
		console.log(`  ${REMOTE} ${ref} = ${sha.slice(0, 7)}`)
	}
}

// ---------- 9. publish targets ----------
step(9, `Publish: ${targets.join(", ")}`)
const notes = changelogSection(readFileSync(CHANGELOG, "utf8"), version) ?? `jsondeck ${TAG}`
const notesFile = join(ROOT, ".git/release-notes.md")
writeFileSync(notesFile, `${notes}\n\n**CDN**\n\n${URLS.map((u) => `- ${u}`).join("\n")}\n`)
const ghArgs = ["release", "create", TAG, "-R", REPO, "--title", `jsondeck ${TAG}`, "--notes-file", notesFile, "--verify-tag", ...ASSETS.map((f) => `dist/${f}`)]
for (const t of targets) {
	if (t === "github") {
		// Only create the release as the repository owner; any other logged-in account
		// would put the wrong name on it, so print the command instead.
		const owner = REPO.split("/")[0]
		let ghUser = ""
		try { ghUser = out("gh", ["api", "user", "-q", ".login"], { timeout: 30_000 }) } catch { ghUser = "" }
		// In the release workflow the job token acts for the repository itself (it cannot read /user).
		if (process.env.GITHUB_ACTIONS === "true" && process.env.GH_TOKEN) ghUser = owner
		if (DRY) {
			console.log(ghUser === owner ? `would run: gh ${ghArgs.join(" ")}` : `would print, not run (gh is ${ghUser ? `logged in as ${ghUser}, not ${owner}` : "not logged in"}): gh ${ghArgs.join(" ")}`)
		} else if (ghUser !== owner) {
			console.log(`gh is ${ghUser ? `logged in as ${ghUser}, not ${owner}` : "not logged in"}; create the release from a shell logged in as ${owner}:`)
			console.log(`  gh ${ghArgs.join(" ")}`)
		} else if (ok("gh", ["release", "view", TAG, "-R", REPO])) {
			console.log(`GitHub release ${TAG} already exists; left as is`)
		} else {
			run("gh", ghArgs)
		}
	} else if (t === "cloudflare") {
		const need = ["R2_BUCKET", "CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN"].filter((k) => !process.env[k])
		if (need.length) fail(`--target cloudflare needs ${need.join(", ")}`)
		for (const f of readdirSync(join(ROOT, "dist")).filter((f) => statSync(join(ROOT, "dist", f)).isFile())) {
			const key = `${process.env.R2_BUCKET}/jsondeck@${version}/${f}`
			if (DRY) console.log(`would upload dist/${f} -> r2://${key}`)
			else run("npx", ["--yes", "wrangler", "r2", "object", "put", key, "--file", `dist/${f}`, "--remote"])
		}
	} else if (t === "npm") {
		if (DRY) run("npm", ["pack", "--dry-run"])
		else if (ok("npm", ["view", `jsondeck@${version}`, "version"])) console.log(`jsondeck@${version} is already on npm; left as is`)
		else run("npm", ["publish", "--access", "public"])
	}
}

// ---------- 10. URLs ----------
step(10, "CDN URLs")
for (const u of URLS) console.log(`  ${u}`)
console.log(`  (ESM import: ${URLS[2]})`)
if (DRY) {
	restoreFiles()
	console.log(`\nrelease:dry: ${TAG} is ready; nothing was committed, tagged or pushed`)
} else {
	console.log(`\nreleased ${TAG}`)
}
