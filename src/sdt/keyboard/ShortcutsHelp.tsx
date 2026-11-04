import type { Labels } from "../../core/labels"
import { useLabels } from "@/lib/labels"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Kbd } from "./Kbd"

type Props = {
	open: boolean
	onOpenChange: (open: boolean) => void
	/** Sections rendered in the dialog. Each section has a title and rows. */
	sections?: ShortcutSection[] | undefined
}

export type ShortcutRow = {
	/** Array so multi-key combos can render: [`Cmd`, `K`]. */
	keys: string[]
	label: string
}

export type ShortcutSection = {
	title: string
	rows: ShortcutRow[]
}

/** Defaults match the shortcuts wired in `useShortcuts`. */
/** The built-in shortcut list, in the current labels. */
export function defaultShortcuts(L: Labels): ShortcutSection[] {
	return [
	{
		title: L.scNavigation,
		rows: [
			{ keys: ["/"], label: L.scFocusSearch },
			{ keys: ["f"], label: L.scFilter },
			{ keys: ["s"], label: L.scSort },
			{ keys: ["v"], label: L.scViews },
			{ keys: ["c"], label: L.scColumns },
			{ keys: ["?"], label: L.scHelp },
			{ keys: ["←", "→"], label: L.scPages },
			{ keys: ["Esc"], label: L.scClose },
		],
	},
	{
		title: L.scDropdowns,
		rows: [
			{ keys: ["↑", "↓"], label: L.scMove },
			{ keys: ["Enter"], label: L.scSelect },
			{ keys: ["Home", "End"], label: L.scJump },
		],
	},
]
}

/**
 * Modal listing all keyboard shortcuts. Triggered by `?`.
 * Pass `sections` to add page-specific shortcuts on top of the defaults.
 */
export function ShortcutsHelp({
	open,
	onOpenChange,
	sections: sectionsProp,
}: Props) {
	const L = useLabels()
	const sections = sectionsProp ?? defaultShortcuts(L)
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="jd:max-w-md">
				<DialogHeader>
					<DialogTitle>{L.shortcuts}</DialogTitle>
					<DialogDescription>
						Press these keys anywhere outside an input field.
					</DialogDescription>
				</DialogHeader>
				<div className="jd:flex jd:flex-col jd:gap-4">
					{sections.map((section) => (
						<div key={section.title}>
							<div className="jd:text-muted-foreground jd:mb-1.5 jd:text-[10px] jd:font-semibold jd:uppercase jd:tracking-wider">
								{section.title}
							</div>
							<div className="jd:flex jd:flex-col">
								{section.rows.map((row) => (
									<div
										key={row.label}
										className="jd:flex jd:items-center jd:justify-between jd:gap-3 jd:py-1.5 jd:text-xs"
									>
										<span className="jd:text-foreground">{row.label}</span>
										<span className="jd:flex jd:items-center jd:gap-1">
											{row.keys.map((k, i) => (
												<span key={k} className="jd:flex jd:items-center jd:gap-1">
													{i > 0 && (
														<span className="jd:text-muted-foreground jd:text-[10px]">
															+
														</span>
													)}
													<Kbd>{k}</Kbd>
												</span>
											))}
										</span>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</DialogContent>
		</Dialog>
	)
}
