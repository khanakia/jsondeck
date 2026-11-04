// Writes demo/viz.html with FAKE fixtures (findings, ec2, dns) for the viz layer.
// Deterministic (seeded). findings.affected holds an ec2 private_ip so the
// relation demo resolves; dns.targets is an array (many-to-many).
// Run: node scripts/make-viz-demo.mjs
import { writeFileSync } from "node:fs"

let seed = 7
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
const pick = (a) => a[Math.floor(rnd() * a.length)]
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1))
const pad = (n) => String(n).padStart(2, "0")
const ymd = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
const dayFrom = (base, spread) => new Date(Date.UTC(2026, 0, 1) + base * 864e5 + Math.floor(rnd() * spread * 864e5))

const regions = ["us-east-1", "us-east-2", "eu-central-1", "eu-west-1", "ap-south-1"]
const types = { "t3.micro": 8, "t3.small": 15, "t3.medium": 30, "m6i.large": 70, "c6g.xlarge": 98, "r6i.2xlarge": 370 }
const ec2 = Array.from({ length: 60 }, (_, i) => {
	const type = pick(Object.keys(types))
	return {
		instance_id: `i-0${Math.floor(rnd() * 1e15).toString(16).padStart(13, "0")}`,
		name: `${pick(["web", "api", "db", "worker", "bastion", "etl"])}-${pick(["prod", "stag", "dev"])}-${i + 1}`,
		state: pick(["running", "running", "running", "stopped", "terminated"]),
		type,
		region: pick(regions),
		private_ip: `10.0.${int(0, 9)}.${i + 10}`,
		launched: dayFrom(-330, 300).toISOString(),
		monthly_cost: Math.round(types[type] * (0.8 + rnd() * 0.4)),
		tags: { env: pick(["prod", "stag", "dev"]), owner: pick(["platform", "data", "web"]) },
	}
})

const areas = ["iam", "network", "storage", "dns", "tls", "secrets", "compute", "logging", "backup"]
const findings = Array.from({ length: 120 }, (_, i) => ({
	id: `F-${String(i + 1).padStart(3, "0")}`,
	severity: pick(["critical", "high", "high", "medium", "medium", "medium", "low", "low"]),
	area: pick(areas),
	title: pick(["Security group allows 0.0.0.0/0 on SSH", "Access key older than 90 days", "Bucket has public read ACL", "No MFA on console user"]),
	affected: ec2[int(0, 19)].private_ip,
	status: pick(["open", "open", "open", "fixed", "accepted"]),
	opened: ymd(dayFrom(-300, 300)),
}))

const zones = ["example.com", "example.net", "demo-shop.test", "acme-tools.test", "sample.org"]
const dns = Array.from({ length: 300 }, () => {
	const zone = pick(zones)
	return {
		zone,
		name: `${pick(["www", "api", "mail", "cdn", "app", "admin"])}.${zone}`,
		type: pick(["A", "A", "A", "CNAME", "CNAME", "MX", "TXT", "AAAA"]),
		targets: [ec2[int(0, 59)].private_ip, ...(rnd() > 0.7 ? [ec2[int(0, 59)].private_ip] : [])],
		ttl: pick([1, 300, 3600, 86400]),
	}
})

const relations = [
	{ from: "findings.affected", to: "ec2.private_ip", label: "host", reverseLabel: "findings" },
	{ from: "dns.targets", to: "ec2.private_ip", label: "host", reverseLabel: "dns records" },
]
const data = JSON.stringify({ findings, ec2, dns }).replace(/</g, "\\u003c")
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>jsondeck viz demo</title>
<link rel="stylesheet" href="../dist-viz/viz.css">
<style>
  /* Hostile host styles: the viz must not be affected by these. */
  /* Site theme: html[data-theme] (set by nav.js / JsonDeck.setTheme) wins; else the OS. */
  :root { --page-bg: #f4f4f5; --page-ink: #09090b; --page-soft: #ffffff99; color-scheme: light; }
  :root[data-theme="dark"], :root.dark { --page-bg: #09090b; --page-ink: #fafafa; --page-soft: #ffffff0f; color-scheme: dark; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme]) { --page-bg: #09090b; --page-ink: #fafafa; --page-soft: #ffffff0f; color-scheme: dark; } }
  body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 18px; background: var(--page-bg); color: var(--page-ink); }
  svg text { font-size: 30px; fill: red; }
  table td, table th { padding: 20px; border: 3px double red; }
  button { background: hotpink; padding: 10px 30px; }
</style>
</head>
<body>
<script src="nav.js"></script>
<script type="application/json" id="data">${data}</script>
<div id="app"></div>
<script src="../dist-viz/viz.js"></script>
<script>JsonDeckViz.mount('#app', JSON.parse(document.getElementById('data').textContent), ${JSON.stringify(relations)})</script>
</body>
</html>
`
writeFileSync(new URL("../demo/viz.html", import.meta.url), html)
console.log("demo/viz.html written:", findings.length, ec2.length, dns.length)
