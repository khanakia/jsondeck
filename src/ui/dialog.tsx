/**
 * Dialogs that load Base UI when they first open (same names and props as
 * base-dialog.tsx). Every dialog here is controlled (`open`), so a closed
 * dialog renders nothing and an open one starts the "popups" load and shows
 * as soon as it arrives. See ui/deferred.tsx.
 */
import * as React from "react"
import type * as Base from "./base-dialog"
import { lazyPart, preload } from "./deferred"
import { popups } from "./popups-handle"

function Dialog(props: React.ComponentProps<typeof Base.Dialog>) {
	const m = popups.use()
	const open = props.open === true
	React.useEffect(() => {
		if (open) preload(popups)
	}, [open])
	if (!m) return null
	return <m.Dialog {...props} />
}

const DialogContent = lazyPart(popups, (m) => m.DialogContent)
const DialogHeader = lazyPart(popups, (m) => m.DialogHeader)
const DialogFooter = lazyPart(popups, (m) => m.DialogFooter)
const DialogTitle = lazyPart(popups, (m) => m.DialogTitle)
const DialogDescription = lazyPart(popups, (m) => m.DialogDescription)

export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle }
