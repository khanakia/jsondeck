// Writes demo/index.html (3-page dashboard) and demo/tabs.html (no pages).
// Run: node scripts/make-demo.mjs
import { writeFileSync } from "node:fs"
import { dns, ec2, findings } from "./demo-data.mjs"

const data = JSON.stringify({ findings, ec2, dns }).replace(/</g, "\\u003c")

// Dataset configs shared by both pages (tables.*): findings rich, EC2 with a
// custom detector + registered type, DNS zero config. The deliberately bad
// config example lives only in examples.html ("Config errors").
const BASE = String.raw`
  const SEVERITY_WEIGHT = { critical: 4, high: 3, medium: 2, low: 1 }
  const config = {
    data: '#data',
    tableOrder: ['findings', 'ec2', 'dns'],
    pageSize: 50,
    labels: { viewsAll: 'All rows' },
    guess: { detectors: [{ type: 'instance-id', test: (vs) => vs.every((v) => /^i-[0-9a-f]{8,}$/.test(String(v))) }] },
    types: {
      'instance-id': {
        render: (v) => { const el = document.createElement('code'); el.className = 'ec2-id'; el.textContent = v; return el },
        filter: 'text',
        width: 170
      }
    },
    tables: {
      findings: {
        key: 'id',
        columnOrder: ['id', 'severity', 'status', 'risk', 'title', 'affected'],
        defaultSort: ['severity', '-cvss'],
        defaultFilters: [{ column: 'status', value: ['open'] }],
        rowClass: (r) => (r.severity === 'critical' ? 'demo-critical' : undefined),
        onRowClick: (r) => { document.getElementById('clicked').textContent = r.id },
        columns: {
          id: { type: 'mono', pin: 'left', width: 84, link: 'https://tracker.example.test/finding/{id}' },
          severity: { colors: { critical: 'red', high: 'orange', medium: 'amber', low: '#64748b' } },
          status: { pin: 'right', colors: { open: 'red', fixed: 'green', accepted: 'slate' } },
          risk: { label: 'Risk', type: 'number', value: (r) => Math.round(SEVERITY_WEIGHT[r.severity] * r.cvss * 10) / 10, format: 'number:1' },
          detail: { filter: false, tooltip: true },
          cvss: { label: 'CVSS', format: 'number:1' },
          est_cost: { label: 'Est. cost', format: 'currency:USD' },
          first_seen: { label: 'First seen', format: 'relative' },
          break_risk: { order: ['none', 'low', 'medium', 'high'], colors: { none: 'green', high: 'red' } }
        }
      },
      ec2: { key: 'instance_id', columns: { launched: { format: 'datetime' }, tags: { format: 'json' } } }
    }
  }
`

const DASHBOARD = String.raw`
  // Pages place the datasets; a placement may override any table setting.
  config.tableOrder = ['findings', 'ec2', 'dns']
  config.tables.findings.onRowClick = undefined
  config.relations = [
    { from: 'findings.instance_id', to: 'ec2.instance_id', label: 'Instance', reverseLabel: 'Findings' },
    { from: 'dns.content', to: 'ec2.public_ip', label: 'Instance', reverseLabel: 'DNS records' }
  ]
  config.pages = [
    {
      title: 'Overview',
      filters: ['severity', 'region'],
      sections: [
        { title: 'Summary', columns: 4, items: [
          { id: 'stat-open', component: 'stat', table: 'findings', label: 'Open findings', where: { status: 'open' }, upIsGood: false },
          { id: 'stat-critical', component: 'stat', table: 'findings', label: 'Critical', where: { severity: 'critical' }, upIsGood: false },
          { id: 'stat-running', component: 'stat', table: 'ec2', label: 'Running instances', where: { state: 'running' } },
          { id: 'stat-dns', component: 'stat', table: 'dns', label: 'DNS records' }
        ] },
        { title: 'Breakdown', description: 'Click a bar or slice to filter the tables of that dataset on this page.', columns: [2, 1], items: [
          { id: 'sev-chart', component: 'chart', table: 'findings', type: 'bar', groupBy: 'severity', title: 'Findings by severity', height: 260 },
          { id: 'state-chart', component: 'chart', table: 'ec2', type: 'donut', groupBy: 'state', title: 'Instances by state', height: 260 }
        ] },
        { title: 'Findings', columns: [1, 4], items: [
          { id: 'find-facets', component: 'facets', table: 'findings', fields: ['area', 'status'], title: 'Facets' },
          { id: 'find-table', component: 'table', table: 'findings', columnOrder: ['id', 'severity', 'status', 'instance_id', 'title'], pageSize: 25, defaultFilters: [],
            // Hidden columns become the expanded row's detail; related rows (the instance) show as a nested table.
            columns: { detail: { hidden: true }, fix_idea: { hidden: true }, break_risk: { hidden: true }, first_seen: { hidden: true } },
            detail: { columns: 2, related: true } }
        ] },
        { title: 'Notes', collapsible: true, collapsed: true, items: [
          { id: 'notes', component: 'markdown', text: '**Fake data.** Severity colours come from the colors setting; the *Risk* column is computed.\n\n- Click a row to open the detail drawer\n- Instance IDs link to the instance' }
        ] }
      ]
    },
    {
      title: 'Inventory',
      sections: [
        { title: 'Instances', description: 'Click an instance: the findings and DNS records below filter to it (master–detail).', columns: 2, items: [
          { id: 'ec2-table', component: 'table', table: 'ec2', pageSize: 10, span: 2 },
          { id: 'inv-findings', component: 'table', table: 'findings', master: 'ec2-table', title: 'Findings of the selected instance', include: ['id', 'severity', 'status', 'title'], defaultFilters: [], defaultSort: ['severity'], pageSize: 10 },
          { id: 'inv-dns', component: 'table', table: 'dns', master: 'ec2-table', title: 'DNS records pointing at it', include: ['name', 'type', 'content'], pageSize: 10 },
          { id: 'ec2-kv', component: 'kv', table: 'ec2', title: 'First instance', fields: ['instance_id', 'name', 'state', 'region', 'public_ip'], span: 2 }
        ] },
        { title: 'DNS and instances', collapsible: true, tabs: true, sections: [
          { title: 'DNS (zero config)', items: [{ id: 'dns-table', component: 'table', table: 'dns' }] },
          { title: 'Instances (compact)', items: [{ id: 'ec2-compact', component: 'table', table: 'ec2', include: ['instance_id', 'name', 'state', 'region'] }] }
        ] }
      ]
    },
    {
      title: 'Findings',
      sections: [
        { items: [
          { id: 'trend', component: 'chart', table: 'findings', type: 'line', groupBy: 'first_seen', bucket: 'month', title: 'Findings first seen per month', height: 200 },
          { id: 'rich-table', component: 'table', table: 'findings', selectable: true,
            rowActions: [{ label: 'Show id below the table', onSelect: (row, rows) => { document.getElementById('clicked').textContent = rows.map((r) => r.id).join(', ') } }] },
          { id: 'grouped', component: 'table', table: 'findings', title: 'Grouped by severity', groupBy: 'severity', groupAggregates: { est_cost: 'sum', cvss: 'avg' },
            include: ['id', 'severity', 'status', 'title', 'cvss', 'est_cost'], defaultFilters: [], pageSize: 50 }
        ] }
      ]
    }
  ]
`

const page = (title, script) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="stylesheet" href="../dist/jsondeck.css">
<style>
  /* Hostile host styles: jsondeck must not be affected by these. */
  /* Site theme: html[data-theme] (set by nav.js / JsonDeck.setTheme) wins; else the OS. */
  :root { --page-bg: #f4f4f5; --page-ink: #09090b; --page-soft: #ffffff99; color-scheme: light; }
  :root[data-theme="dark"], :root.dark { --page-bg: #09090b; --page-ink: #fafafa; --page-soft: #ffffff0f; color-scheme: dark; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme]) { --page-bg: #09090b; --page-ink: #fafafa; --page-soft: #ffffff0f; color-scheme: dark; } }
  body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 18px; background: var(--page-bg); color: var(--page-ink); }
  table td, table th { padding: 20px; border: 3px double red; font-size: 22px; }
  button { background: hotpink; padding: 10px 30px; border-radius: 20px; }
  input, select { height: 50px; font-size: 20px; }
  h1 { font-size: 20px; font-weight: 600; letter-spacing: -0.01em; margin: 12px 16px; }
  /* rowClass from config: a host rule marks critical rows */
  .demo-critical { box-shadow: inset 3px 0 0 #dc2626; }
  code.ec2-id { font: 12px ui-monospace, monospace; color: #7c3aed; }
</style>
</head>
<body>
<script src="nav.js"></script>
<h1>${title} (fake data)</h1>
<script type="application/json" id="data">${data}</script>
<div id="app" style="margin: 0 16px 16px"></div>
<p style="margin: 0 16px; font-size: 13px">Last row clicked: <b id="clicked">none</b></p>
<details style="margin: 8px 16px 16px; font-size: 12px"><summary>Resolved config (JsonDeck.describe)</summary><pre id="describe" style="max-height: 400px; overflow: auto; background: var(--page-soft); padding: 8px"></pre></details>
<script src="../dist/jsondeck.js"></script>
<script>
${script}
  JsonDeck.mount('#app', config)
  const { data: _omit, ...rest } = config
  document.getElementById('describe').textContent = JSON.stringify(JsonDeck.describe('#data', rest), null, 2)
</script>
</body>
</html>
`

const TABS_EXTRA = String.raw`
  // Quick filters above the findings table, synced with the filter pills.
  config.tables.findings.quickFilters = [
    { column: 'severity', kind: 'chips' },
    { column: 'status', kind: 'chips' },
    { column: 'cvss', kind: 'range' },
    { column: 'est_cost', kind: 'range' },
    { column: 'exploitable', kind: 'toggle', label: 'Exploitable only' }
  ]
`
writeFileSync(new URL("../demo/tabs.html", import.meta.url), page("jsondeck tabs", BASE + TABS_EXTRA))
writeFileSync(new URL("../demo/index.html", import.meta.url), page("jsondeck dashboard", BASE + DASHBOARD))
console.log("demo/index.html (dashboard) + demo/tabs.html (default tabs) written:", findings.length, ec2.length, dns.length)
