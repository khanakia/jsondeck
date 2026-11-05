/**
 * An item shown in a Preview / Code box (`code: true` on its spec): the spec
 * as source text (core/serialize.ts) next to the live item. An on-demand chunk.
 */
import type * as React from "react"
import type { PageItem } from "../core/config"
import { toSource } from "../core/serialize"
import { CodeView } from "./CodeView"

export function ItemCode({ spec, preview }: { spec: PageItem; preview: React.ReactNode }) {
	const { code, ...rest } = spec
	return <CodeView code={typeof code === "string" ? code : toSource(rest)} lang="js" preview={preview} />
}
