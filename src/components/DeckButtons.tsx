/**
 * The deck header's theme toggle and layout-edit button, with their icons:
 * an on-demand chunk, loaded before the first render of a deck that shows
 * either (components/first-paint.ts), so the header never shifts.
 */
import { LayoutGrid, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Labels } from "../core/labels"
import { ICON_BTN, LABEL_BTN, Tip } from "./Tip"

/** Flips the page between light and dark; shows the mode it switches to. */
export function ThemeToggle({ dark, labels: L, onToggle }: { dark: boolean; labels: Labels; onToggle: () => void }) {
	return (
		<Tip label={dark ? L.lightMode : L.darkMode}>
			<Button variant="ghost" size="icon-sm" className={ICON_BTN} aria-label={dark ? L.lightMode : L.darkMode} data-jd="theme-toggle" onClick={onToggle}>
				{dark ? <Sun className="jd:h-3.5 jd:w-3.5" /> : <Moon className="jd:h-3.5 jd:w-3.5" />}
			</Button>
		</Tip>
	)
}

/** Switches the layout editor on and off ("Edit" / "Done"). */
export function EditToggle({ edit, withLabels, labels: L, onToggle }: { edit: boolean; withLabels: boolean; labels: Labels; onToggle: () => void }) {
	return (
		<Tip label={edit ? L.done : L.edit}>
			<Button
				variant={edit ? "default" : "ghost"}
				size="sm"
				aria-label={edit ? L.done : L.edit}
				className={withLabels || edit ? LABEL_BTN : ICON_BTN}
				data-jd="edit-toggle"
				aria-pressed={edit}
				onClick={onToggle}
			>
				<LayoutGrid className="jd:h-3.5 jd:w-3.5" />
				{(withLabels || edit) && (edit ? L.done : L.edit)}
			</Button>
		</Tip>
	)
}
