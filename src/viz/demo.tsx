/**
 * Demo entry for the viz layer only (built by vite.viz.config.ts into
 * dist-viz/viz.js). Not part of the library: the real wiring lives in
 * index.tsx, owned by the table/layout work.
 */
import { useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import { usePageTheme } from "../lib/theme"
import { type Row } from "../core/aggregate"
import { buildRelations, type Relation } from "../core/relations"
import "../styles.css"
import { Chart, type ChartSpec } from "./Chart"
import { KeyValueCard } from "./KeyValueCard"
import { Markdown } from "./Markdown"
import { StatTile } from "./StatTile"

type Data = { findings: Row[]; ec2: Row[]; dns: Row[] }

declare global {
	interface Window {
		/** Demo only: every onSelect call, read by scripts/verify-viz.mjs. */
		__vizSelect?: string[]
	}
}
const SEV = ["critical", "high", "medium", "low"]

const CHARTS: ChartSpec[] = [
	{ type: "bar", title: "Findings by severity", groupBy: "severity", sort: SEV },
	{ type: "bar", title: "Findings by area (horizontal)", groupBy: "area", horizontal: true },
	{ type: "stacked", title: "Findings by area and severity", groupBy: "area", series: "severity", sort: SEV },
	{ type: "grouped", title: "EC2 by region and state", groupBy: "region", series: "state" },
	{ type: "stacked", title: "DNS records by zone and type (horizontal)", groupBy: "zone", series: "type", horizontal: true },
	{ type: "line", title: "Findings opened per month", groupBy: "opened", bucket: "month" },
	{ type: "area", title: "EC2 launches per month by env", groupBy: "launched", bucket: "month", series: "tags.env" },
	{ type: "pie", title: "EC2 by instance type", groupBy: "type" },
	{ type: "donut", title: "Findings by status", groupBy: "status" },
	{ type: "bar", title: "Average cost per instance type", groupBy: "type", measure: "avg:monthly_cost" },
]

const MD = `## Notes
This page is **fake data**. Click a bar, slice or point to filter the *findings* table idea.

- Severity uses the reserved status colours.
- A [safe link](https://example.com) works; a [bad link](javascript:alert(1)) is plain text.
- Raw HTML is shown as text: <script>alert(1)</script> <img src=x onerror=alert(1)>

| Area | Owner |
|---|---|
| iam | platform |`

function App({ data, relations }: { data: Data; relations: Relation[] }) {
	// Follows the site-wide page theme (html data-theme / OS), like every deck; the navbar toggle is the only switch.
	const dark = usePageTheme() === "dark"
	const [picked, setPicked] = useState<string>("")
	const index = useMemo(() => buildRelations(data, relations), [data, relations])
	const finding: Row = data.findings[0] ?? {} // empty data: the cards show "–" and no relations
	const related = index.lookup("findings", finding)
	const host = related.find((g) => g.direction === "forward")?.rows[0]
	const hostBack = host ? index.lookup("ec2", host) : []
	const rowsFor = (spec: ChartSpec) => (["region", "type", "launched"].includes(String(spec.groupBy)) ? data.ec2 : String(spec.groupBy) === "zone" ? data.dns : data.findings)
	const select = (id: string) => (v: string, s?: string) => {
		const text = `${id}: ${v}${s ? ` / ${s}` : ""}`
		window.__vizSelect?.push(text)
		setPicked(text)
	}
	return (
		<div className={`jd-root${dark ? " jd-dark" : ""} jd:min-h-screen jd:p-3`}>
			<div className="jd:mb-2 jd:flex jd:items-center jd:gap-2">
				<h1 className="jd:text-sm jd:font-semibold">jsondeck viz demo (fake data)</h1>
				<span className="jd:text-xs jd:text-muted-foreground" data-jd="picked">{picked ? `Selected ${picked}` : "Click a mark"}</span>
			</div>
			<div className="jd:mb-3 jd:grid jd:grid-cols-2 jd:gap-2 jd:md:grid-cols-4">
				<StatTile rows={data.findings} spec={{ label: "Open findings", where: { status: "open" }, compare: { status: "fixed" }, compareLabel: "vs fixed", upIsGood: false }} />
				<StatTile rows={data.findings} spec={{ label: "Critical open", where: { status: "open", severity: "critical" }, upIsGood: false, trend: { field: "opened", bucket: "month" } }} />
				<StatTile rows={data.ec2} spec={{ label: "Monthly EC2 cost", measure: "sum:monthly_cost", where: { state: "running" }, hint: "running instances" }} />
				<StatTile rows={data.dns} spec={{ label: "Zones", measure: "distinct:zone" }} />
			</div>
			<div className="jd:grid jd:grid-cols-1 jd:gap-4 jd:md:grid-cols-2" data-jd="charts">
				{CHARTS.map((spec, i) => (
					<div key={i} className="jd:rounded-lg jd:border jd:border-card-border jd:bg-card jd:p-2 jd:shadow-(--jds-card-shadow)" data-chart-index={i}>
						<Chart rows={rowsFor(spec)} spec={spec} onSelect={select(spec.title ?? String(i))} />
					</div>
				))}
				<div className="jd:rounded-lg jd:border jd:border-card-border jd:bg-card jd:p-2 jd:shadow-(--jds-card-shadow)" data-chart-index="empty">
					<Chart rows={[]} spec={{ type: "bar", title: "Empty state", groupBy: "x" }} />
				</div>
				<div className="jd:rounded-lg jd:border jd:border-card-border jd:bg-card jd:p-2 jd:shadow-(--jds-card-shadow)">
					<p className="jd:mb-1 jd:text-xs jd:font-medium">Sparkline</p>
					<Chart rows={data.findings} spec={{ type: "sparkline", groupBy: "opened", bucket: "month" }} />
				</div>
			</div>
			<div className="jd:mt-4 jd:grid jd:grid-cols-1 jd:gap-4 jd:md:grid-cols-2">
				<KeyValueCard spec={{ title: `Finding ${String(finding.id)}`, fields: ["id", "severity", "title", "affected", "status", "opened"] }} row={finding} columnSpecs={[{ id: "id", type: "mono" }, { id: "severity", type: "enum" }, { id: "affected", type: "ip", label: "Host IP" }, { id: "status", type: "enum" }, { id: "opened", type: "date" }]} />
				<section className="jd:rounded-lg jd:border jd:border-card-border jd:bg-card jd:px-3 jd:py-2 jd:text-xs jd:shadow-(--jds-card-shadow)" data-jd="relations">
					<h3 className="jd:mb-1 jd:font-medium">Relations of {String(finding.id)}</h3>
					{related.map((g) => (
						<p key={`${g.relation.from}${g.direction}`}>{g.direction} → {g.label} ({g.field}): {g.rows.length} row(s){g.rows[0] ? `, first: ${String(g.rows[0].name ?? g.rows[0].id)}` : ""}</p>
					))}
					{host && <p className="jd:mt-1">Back from {String(host.name)}: {hostBack.map((g) => `${g.direction} ${g.label}: ${g.rows.length}`).join(" · ")}</p>}
				</section>
				<div className="jd:rounded-lg jd:border jd:border-card-border jd:bg-card jd:px-3 jd:py-2 jd:shadow-(--jds-card-shadow) jd:md:col-span-2"><Markdown text={MD} /></div>
			</div>
		</div>
	)
}

function mount(el: string, data: Data, relations: Relation[]) {
	window.__vizSelect = []
	const node = document.querySelector(el)
	if (!node) throw new Error(`no element ${el}`)
	createRoot(node).render(<App data={data} relations={relations} />)
}

export { mount }
