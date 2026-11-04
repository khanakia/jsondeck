/**
 * Shell for JsonDeck.example(): a scoped root (theme follows the OS) holding
 * the Preview / Code box, with the mounted deck in the Preview tab.
 */
import type * as React from "react"
import { LabelsContext } from "@/lib/labels"
import { usePageTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"
import type { CodeLang } from "../core/highlight"
import type { Labels } from "../core/labels"
import { CodeView } from "./CodeView"

export function ExampleShell(props: { labels: Labels; title?: string | undefined; description?: string | undefined; code: string; lang: CodeLang; preview?: React.ReactNode | undefined }) {
	const dark = usePageTheme() === "dark"
	return (
		<div className={cn("jd-root", dark && "jd-dark")} data-jd="example">
			<LabelsContext.Provider value={props.labels}>
				<CodeView title={props.title} description={props.description} code={props.code} lang={props.lang} preview={props.preview} />
			</LabelsContext.Provider>
		</div>
	)
}
