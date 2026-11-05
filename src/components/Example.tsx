/**
 * Shell for JsonDeck.example(): a scoped root (theme follows the OS) holding
 * the Preview / Code box, with the mounted deck in the Preview tab. An
 * on-demand chunk (with the config → HTML snippet writer), loaded by example().
 */
import type * as React from "react"
import { LabelsContext } from "@/lib/labels"
import { usePageTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"
import type { CodeLang } from "../core/highlight"
import type { JsonDeckConfig } from "../core/config"
import type { Labels } from "../core/labels"
import { htmlSnippet } from "../core/serialize"
import { version } from "../version"
import { CodeView, OnDemand } from "./lazy"

export type ExampleShellProps = {
	labels: Labels
	title?: string | undefined
	description?: string | undefined
	/** Code tab text as given; without it, a complete HTML page is written from `config`. */
	code?: string | undefined
	/** The example's config with its data already parsed (for the generated snippet). */
	config?: JsonDeckConfig | undefined
	lang: CodeLang
	preview?: React.ReactNode | undefined
}

export function ExampleShell(props: ExampleShellProps) {
	const dark = usePageTheme() === "dark"
	const code = props.code ?? (props.config ? htmlSnippet(props.config, { version }) : "")
	return (
		<div className={cn("jd-root", dark && "jd-dark")} data-jd="example">
			<LabelsContext.Provider value={props.labels}>
				<OnDemand>
					<CodeView title={props.title} description={props.description} code={code} lang={props.lang} preview={props.preview} />
				</OnDemand>
			</LabelsContext.Provider>
		</div>
	)
}
