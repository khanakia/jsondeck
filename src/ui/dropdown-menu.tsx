/**
 * Dropdown menus that load Base UI on first use. Same names and props as the
 * real wrappers in base-menu.tsx; the trigger renders as a plain button until
 * the "popups" chunk arrives (see ui/deferred.tsx), and every other part only
 * renders inside an open menu. Label is a plain element, kept here. Only the
 * parts jsondeck uses are here (see src/popups.ts).
 */
import type * as React from "react"
import { cn } from "@/lib/utils"
import type * as Base from "./base-menu"
import { deferredRoot, lazyPart } from "./deferred"
import { type Popups, popups } from "./popups-handle"

const pair = deferredRoot<Popups, React.ComponentProps<typeof Base.DropdownMenu>, React.ComponentProps<typeof Base.DropdownMenuTrigger>>(popups, (m) => m.DropdownMenu, (m) => m.DropdownMenuTrigger, "menu")
const DropdownMenu: (props: React.ComponentProps<typeof Base.DropdownMenu>) => React.ReactNode = pair.Root
const DropdownMenuTrigger: (props: React.ComponentProps<typeof Base.DropdownMenuTrigger>) => React.ReactNode = pair.Trigger
const DropdownMenuContent = lazyPart(popups, (m) => m.DropdownMenuContent)
const DropdownMenuGroup = lazyPart(popups, (m) => m.DropdownMenuGroup)
const DropdownMenuItem = lazyPart(popups, (m) => m.DropdownMenuItem)
const DropdownMenuSeparator = lazyPart(popups, (m) => m.DropdownMenuSeparator)

/** A plain section header (Base UI's GroupLabel needs a Group ancestor; this does not). */
function DropdownMenuLabel({ className, inset, ...props }: React.ComponentProps<"div"> & { inset?: boolean | undefined }) {
	return (
		<div
			data-slot="dropdown-menu-label"
			data-inset={inset}
			className={cn("jd:px-2 jd:py-1 jd:text-[11px] jd:font-semibold jd:uppercase jd:tracking-wider jd:text-muted-foreground jd:data-[inset]:pl-7", className)}
			{...props}
		/>
	)
}

export {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
}
