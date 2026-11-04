// Minimal static server for the repo root (demo + dist). Listens on
// 127.0.0.1:$PORT only. Run: node scripts/serve.mjs
import { createReadStream, statSync } from "node:fs"
import { createServer } from "node:http"
import { extname, join, normalize, resolve } from "node:path"

const ROOT = resolve(new URL("..", import.meta.url).pathname)
const PORT = Number(process.env.PORT ?? 4173)
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".map": "application/json", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml" }

createServer((req, res) => {
	let p = normalize(decodeURIComponent((req.url ?? "/").split("?")[0]))
	if (p.includes("..") || p.startsWith(join(ROOT, "node_modules"))) return res.writeHead(403).end()
	let file = join(ROOT, p)
	try {
		if (statSync(file).isDirectory()) {
			if (!p.endsWith("/")) return res.writeHead(301, { location: `${p}/` }).end()
			file = join(file, "index.html")
		}
		statSync(file)
	} catch {
		return res.writeHead(404).end("not found")
	}
	res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" })
	createReadStream(file).pipe(res)
}).listen(PORT, "127.0.0.1", () => console.log(`serving ${ROOT} on http://127.0.0.1:${PORT}`))
