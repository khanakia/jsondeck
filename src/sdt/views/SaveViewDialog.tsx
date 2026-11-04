import { useLabels } from "@/lib/labels"
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type Props = {
	open: boolean
	onOpenChange: (open: boolean) => void
	/** Pre-fill the input (used by Rename / Save-as) */
	initialName?: string | undefined
	title?: string | undefined
	description?: string | undefined
	confirmLabel?: string | undefined
	onSave: (name: string) => Promise<void> | void
}

export function SaveViewDialog({
	open,
	onOpenChange,
	initialName = "",
	title,
	description,
	confirmLabel,
	onSave,
}: Props) {
	const L = useLabels()
	const [name, setName] = React.useState(initialName)
	const [saving, setSaving] = React.useState(false)

	// Re-seed when reopened
	React.useEffect(() => {
		if (open) setName(initialName)
	}, [open, initialName])

	const submit = async () => {
		const trimmed = name.trim()
		if (!trimmed) return
		setSaving(true)
		try {
			await onSave(trimmed)
			onOpenChange(false)
		} finally {
			setSaving(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title ?? L.saveViewTitle}</DialogTitle>
					<DialogDescription>{description ?? L.saveViewDescription}</DialogDescription>
				</DialogHeader>
				<Input
					autoFocus
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder={L.viewName}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault()
							void submit()
						}
					}}
				/>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={saving}
					>
						{L.cancel}
					</Button>
					<Button onClick={submit} disabled={saving || !name.trim()}>
						{saving ? L.saving : (confirmLabel ?? L.saveViewConfirm)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
