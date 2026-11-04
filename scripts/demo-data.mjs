// Seeded FAKE fixtures shaped like a security inventory (findings, ec2, dns,
// accounts). Shared by make-demo.mjs and make-examples.mjs.
// Deterministic (seeded) so screenshots are stable.

let seed = 42
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
const pick = (a) => a[Math.floor(rnd() * a.length)]
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1))
const pad = (n) => String(n).padStart(2, "0")
const day = (base, spread) => {
	const d = new Date(Date.UTC(2026, 0, 1) + base * 864e5 + Math.floor(rnd() * spread * 864e5))
	return d
}
const iso = (d) => d.toISOString().replace(/\.\d+Z$/, "Z")
const ymd = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`

const regions = ["us-east-1", "us-east-2", "eu-central-1", "eu-west-1", "ap-south-1"]
const ec2 = Array.from({ length: 60 }, (_, i) => {
	const state = pick(["running", "running", "running", "stopped", "terminated", "pending"])
	return {
		instance_id: `i-0${Math.floor(rnd() * 1e15).toString(16).padStart(13, "0")}`,
		name: `${pick(["web", "api", "db", "worker", "bastion", "etl"])}-${pick(["prod", "stag", "dev"])}-${i + 1}`,
		state,
		type: pick(["t3.micro", "t3.small", "t3.medium", "m6i.large", "c6g.xlarge", "r6i.2xlarge"]),
		region: pick(regions),
		public_ip: state === "running" && rnd() > 0.3 ? `198.51.100.${int(1, 254)}` : null,
		private_ip: `10.${int(0, 20)}.${int(0, 255)}.${int(1, 254)}`,
		launched: iso(day(-400, 700)),
		tags: { env: pick(["prod", "stag", "dev"]), owner: pick(["platform", "data", "web"]), cost_center: `cc-${int(100, 140)}` },
	}
})

const areas = ["iam", "network", "storage", "dns", "tls", "secrets", "compute", "logging", "backup"]
const titles = [
	"Security group allows 0.0.0.0/0 on SSH",
	"Access key older than 90 days",
	"Bucket has public read ACL",
	"TLS certificate expires within 30 days",
	"Root account used for API calls",
	"Database port exposed to the internet",
	"No MFA on console user",
	"Log retention shorter than 30 days",
	"Snapshot shared with another account",
	"Wildcard DNS record points to a stopped host",
	"Admin panel served without auth",
	"Outdated kernel on public host",
]
const fixes = ["Restrict to office CIDR", "Rotate and delete old key", "Turn off public ACL", "Renew via ACME", "Use a scoped role", "Move behind VPN", "Enforce MFA policy", "Raise retention to 90 days", "Revoke share", "Remove stale record"]
const lorem =
	"The resource was found during the weekly scan. It is reachable from outside the private network and the current setting does not match the baseline. Changing it may interrupt a client integration that still relies on the old path, so check the access logs for the last 30 days before applying the fix."

const findings = Array.from({ length: 120 }, (_, i) => ({
	id: `F-${String(i + 1).padStart(3, "0")}`,
	severity: pick(["critical", "high", "high", "medium", "medium", "medium", "low", "low"]),
	area: pick(areas),
	title: pick(titles),
	// Whole sentences (1–3), so no value ends mid-word.
	detail: lorem.split(/(?<=\.) /).slice(0, int(1, 3)).join(" "),
	affected: `${pick(["web", "api", "db", "worker", "cache", "edge"])}-${int(1, 24)}.example.internal`,
	fix_idea: pick(fixes),
	break_risk: pick(["none", "low", "medium", "high"]),
	status: pick(["open", "open", "open", "fixed", "accepted"]),
	cvss: Math.round((2 + rnd() * 8) * 10) / 10,
	est_cost: int(0, 40) * 250,
	first_seen: iso(day(-200, 300)),
	instance_id: pick(ec2).instance_id,
	exploitable: rnd() > 0.6,
}))

const accounts = Array.from({ length: 8 }, (_, i) => ({
	name: pick(["Acme", "Globex", "Initech", "Umbrella", "Hooli", "Vandelay"]) + " " + (i + 1),
	email: `owner${i + 1}@example.test`,
	plan: pick(["free", "pro", "team"]),
	mrr: int(0, 90) * 10,
	created: ymd(day(-500, 400)),
}))

const zones = ["example.com", "example.net", "demo-shop.test", "acme-tools.test", "sample.org"]
const subs = ["@", "www", "api", "mail", "cdn", "status", "app", "admin", "staging", "docs", "blog", "vpn", "git", "grafana", "s3"]
const dns = Array.from({ length: 300 }, () => {
	const zone = pick(zones)
	const type = pick(["A", "A", "A", "CNAME", "CNAME", "MX", "TXT", "AAAA"])
	const sub = pick(subs)
	const content =
		type === "A" ? `198.51.100.${int(1, 254)}` : type === "AAAA" ? `2001:db8::${int(1, 9999).toString(16)}` : type === "CNAME" ? `${pick(["lb", "edge", "pages"])}.${pick(zones)}` : type === "MX" ? `mx${int(1, 3)}.mail.${zone}` : `v=spf1 include:_spf.${zone} ~all`
	return {
		zone,
		name: sub === "@" ? zone : `${sub}.${zone}`,
		type,
		content,
		proxied: type === "A" || type === "CNAME" ? rnd() > 0.4 : false,
		ttl: pick([1, 300, 3600, 86400]),
		modified: ymd(day(-300, 600)),
	}
})


export { accounts, dns, ec2, findings }
