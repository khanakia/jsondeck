// Typed usage of jsondeck: names autocomplete and typos fail to compile.
// Checked by `pnpm typecheck` (tsconfig.examples.json).
import { defineConfig, mount } from "../src/index"

type Finding = { id: string; severity: "critical" | "high" | "medium" | "low"; cvss: number; status: string; host: string }
type Host = { ip: string; name: string; os: string }

const raw: Finding[] = [{ id: "F-1", severity: "high", cvss: 7.5, status: "open", host: "10.0.0.1" }]
// A typed computed column: add the field to the rows, so "risk" is part of the row type.
const findings = raw.map((f) => ({ ...f, risk: f.cvss * 2 }))
const hosts: Host[] = [{ ip: "10.0.0.1", name: "web-1", os: "linux" }]

const config = defineConfig(
	{ findings, hosts },
	{
		theme: "auto",
		tableOrder: ["findings", "hosts"],
		relations: [{ from: "findings.host", to: "hosts.ip" }],
		tables: {
			findings: {
				key: "id",
				columnOrder: ["id", "severity", "risk"],
				defaultSort: ["severity", "-cvss"],
				defaultFilters: [{ column: "status", value: ["open"] }],
				rowClass: (row) => (row.severity === "critical" ? "crit" : undefined),
				columns: {
					severity: { colors: { critical: "red" }, render: (value) => value.toUpperCase() },
					cvss: { format: "number:1", sort: (a, b) => a - b },
					risk: { label: "Risk", format: "number:1" },
				},
			},
			hosts: { columns: { ip: "mono" }, search: { columns: ["name", "ip"] } },
		},
		pages: [
			{
				title: "Overview",
				filters: ["findings.severity"],
				sections: [
					{
						columns: [2, 1],
						items: [
							{ component: "chart", table: "findings", type: "bar", groupBy: "severity", where: { status: "open" } },
							{ component: "stat", table: "findings", label: "Open", where: { status: "open" } },
							{ component: "table", table: "findings", columnOrder: ["risk", "id"], pageSize: 25 },
							{ component: "facets", table: "hosts", fields: ["os"] },
						],
					},
				],
			},
		],
	},
)

export function show(el: Element): void {
	mount(el, config)
}
