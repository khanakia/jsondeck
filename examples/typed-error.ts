// MUST FAIL to type-check: every marked line is a mistake the types catch.
// scripts/expect-type-error.mjs runs tsc on this file and requires an error on each.
import { defineConfig } from "../src/index"

type Finding = { id: string; severity: string; cvss: number }
const findings: Finding[] = []

export const bad = defineConfig(
	{ findings },
	{
		tables: {
			findings: {
				columnOrder: ["id", "sevrity"], // @expect-error unknown column
				defaultSort: ["-cvs"], // @expect-error unknown column in sort
				columns: {
					severty: { label: "Severity" }, // @expect-error not a column
					cvss: { render: (value) => value.toUpperCase() }, // @expect-error cvss is a number
				},
			},
		},
		pages: [{ title: "P", sections: [{ items: [{ component: "chart", table: "findings", type: "bar", groupBy: "severityy" }] }] }], // @expect-error unknown column in chart
	},
)

// An unknown table name on its own (excess-property errors report one per object).
export const badTable = defineConfig({ findings }, { tables: { findngs: {} } }) // @expect-error unknown table
