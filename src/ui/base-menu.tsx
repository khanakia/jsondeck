import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"
import type * as React from "react"
import { usePortalContainer } from "@/lib/portal"
import { cn } from "@/lib/utils"

function DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
	return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({ ...props }: MenuPrimitive.Portal.Props) {
	return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
}

function DropdownMenuTrigger({
	asChild,
	children,
	...props
}: MenuPrimitive.Trigger.Props & { asChild?: boolean }) {
	if (asChild) {
		return (
			<MenuPrimitive.Trigger
				data-slot="dropdown-menu-trigger"
				render={children as React.ReactElement}
				{...props}
			/>
		)
	}
	return (
		<MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props}>
			{children}
		</MenuPrimitive.Trigger>
	)
}

function DropdownMenuContent({
	className,
	align,
	side,
	sideOffset = 4,
	...props
}: MenuPrimitive.Popup.Props & {
	align?: MenuPrimitive.Positioner.Props["align"] | undefined
	side?: MenuPrimitive.Positioner.Props["side"] | undefined
	sideOffset?: MenuPrimitive.Positioner.Props["sideOffset"] | undefined
}) {
	return (
		<MenuPrimitive.Portal container={usePortalContainer()}>
			<MenuPrimitive.Positioner
				data-slot="dropdown-menu-positioner"
				align={align}
				side={side}
				sideOffset={sideOffset}
				className="jd:z-[2147483001]"
			>
				<MenuPrimitive.Popup
					data-slot="dropdown-menu-content"
					className={cn(
						"jd:bg-popover jd:text-popover-foreground jd:data-[open]:animate-in jd:data-[closed]:animate-out jd:data-[closed]:fade-out-0 jd:data-[open]:fade-in-0 jd:data-[closed]:zoom-out-95 jd:data-[open]:zoom-in-95 jd:data-[side=bottom]:slide-in-from-top-2 jd:data-[side=left]:slide-in-from-right-2 jd:data-[side=right]:slide-in-from-left-2 jd:data-[side=top]:slide-in-from-bottom-2 jd:z-[2147483001] jd:max-h-(--available-height) jd:min-w-[7rem] jd:origin-(--transform-origin) jd:overflow-x-hidden jd:overflow-y-auto jd:rounded-md jd:border jd:border-border jd:p-0.5 jd:shadow-md",
						className,
					)}
					{...props}
				/>
			</MenuPrimitive.Positioner>
		</MenuPrimitive.Portal>
	)
}

function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props) {
	return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
}

function DropdownMenuItem({
	className,
	inset,
	variant = "default",
	...props
}: MenuPrimitive.Item.Props & {
	inset?: boolean | undefined
	variant?: "default" | "destructive" | undefined
}) {
	return (
		<MenuPrimitive.Item
			data-slot="dropdown-menu-item"
			data-inset={inset}
			data-variant={variant}
			className={cn(
				"jd:focus:bg-accent jd:focus:text-accent-foreground jd:data-[variant=destructive]:text-destructive jd:data-[variant=destructive]:focus:bg-destructive/10 jd:dark:data-[variant=destructive]:focus:bg-destructive/20 jd:data-[variant=destructive]:focus:text-destructive jd:data-[variant=destructive]:*:[svg]:!text-destructive jd:[&_svg:not([class*='text-'])]:text-muted-foreground jd:relative jd:flex jd:cursor-default jd:items-center jd:gap-2 jd:rounded-sm jd:px-2 jd:py-1 jd:text-[12px] jd:outline-hidden jd:select-none jd:data-[disabled]:pointer-events-none jd:data-[disabled]:opacity-50 jd:data-[inset]:pl-7 jd:[&_svg]:pointer-events-none jd:[&_svg]:shrink-0 jd:[&_svg:not([class*='size-'])]:size-3.5",
				className,
			)}
			{...props}
		/>
	)
}

function DropdownMenuCheckboxItem({
	className,
	children,
	checked,
	...props
}: MenuPrimitive.CheckboxItem.Props) {
	return (
		<MenuPrimitive.CheckboxItem
			data-slot="dropdown-menu-checkbox-item"
			className={cn(
				"jd:focus:bg-accent jd:focus:text-accent-foreground jd:relative jd:flex jd:cursor-default jd:items-center jd:gap-2 jd:rounded-sm jd:py-1 jd:pr-2 jd:pl-7 jd:text-[12px] jd:outline-hidden jd:select-none jd:data-[disabled]:pointer-events-none jd:data-[disabled]:opacity-50 jd:[&_svg]:pointer-events-none jd:[&_svg]:shrink-0 jd:[&_svg:not([class*='size-'])]:size-3.5",
				className,
			)}
			checked={checked}
			{...props}
		>
			<span className="jd:pointer-events-none jd:absolute jd:left-2 jd:flex jd:size-3.5 jd:items-center jd:justify-center">
				<MenuPrimitive.CheckboxItemIndicator>
					<CheckIcon className="jd:size-4" />
				</MenuPrimitive.CheckboxItemIndicator>
			</span>
			{children}
		</MenuPrimitive.CheckboxItem>
	)
}

function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
	return (
		<MenuPrimitive.RadioGroup
			data-slot="dropdown-menu-radio-group"
			{...props}
		/>
	)
}

function DropdownMenuRadioItem({
	className,
	children,
	...props
}: MenuPrimitive.RadioItem.Props) {
	return (
		<MenuPrimitive.RadioItem
			data-slot="dropdown-menu-radio-item"
			className={cn(
				"jd:focus:bg-accent jd:focus:text-accent-foreground jd:relative jd:flex jd:cursor-default jd:items-center jd:gap-2 jd:rounded-sm jd:py-1 jd:pr-2 jd:pl-7 jd:text-[12px] jd:outline-hidden jd:select-none jd:data-[disabled]:pointer-events-none jd:data-[disabled]:opacity-50 jd:[&_svg]:pointer-events-none jd:[&_svg]:shrink-0 jd:[&_svg:not([class*='size-'])]:size-3.5",
				className,
			)}
			{...props}
		>
			<span className="jd:pointer-events-none jd:absolute jd:left-2 jd:flex jd:size-3.5 jd:items-center jd:justify-center">
				<MenuPrimitive.RadioItemIndicator>
					<CircleIcon className="jd:size-2 jd:fill-current" />
				</MenuPrimitive.RadioItemIndicator>
			</span>
			{children}
		</MenuPrimitive.RadioItem>
	)
}

/**
 * Plain styled label. Base UI's `Menu.GroupLabel` requires a `<Menu.Group>`
 * ancestor and throws "MenuGroupRootContext is missing" otherwise — but most
 * callers use `DropdownMenuLabel` as a top-level header, not
 * inside a group. Render a div so the API stays drop-in.
 */
function DropdownMenuLabel({
	className,
	inset,
	...props
}: React.ComponentProps<"div"> & {
	inset?: boolean | undefined
}) {
	return (
		<div
			data-slot="dropdown-menu-label"
			data-inset={inset}
			className={cn(
				"jd:px-2 jd:py-1 jd:text-[11px] jd:font-semibold jd:uppercase jd:tracking-wider jd:text-muted-foreground jd:data-[inset]:pl-7",
				className,
			)}
			{...props}
		/>
	)
}

function DropdownMenuSeparator({
	className,
	...props
}: MenuPrimitive.Separator.Props) {
	return (
		<MenuPrimitive.Separator
			data-slot="dropdown-menu-separator"
			className={cn("jd:bg-border jd:-mx-1 jd:my-1 jd:h-px", className)}
			{...props}
		/>
	)
}

function DropdownMenuShortcut({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="dropdown-menu-shortcut"
			className={cn(
				"jd:text-muted-foreground jd:ml-auto jd:text-xs jd:tracking-widest",
				className,
			)}
			{...props}
		/>
	)
}

function DropdownMenuSub({ ...props }: MenuPrimitive.SubmenuRoot.Props) {
	return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
	className,
	inset,
	children,
	...props
}: MenuPrimitive.SubmenuTrigger.Props & {
	inset?: boolean | undefined
}) {
	return (
		<MenuPrimitive.SubmenuTrigger
			data-slot="dropdown-menu-sub-trigger"
			data-inset={inset}
			className={cn(
				"jd:focus:bg-accent jd:focus:text-accent-foreground jd:data-[open]:bg-accent jd:data-[open]:text-accent-foreground jd:flex jd:cursor-default jd:items-center jd:gap-2 jd:rounded-sm jd:px-2 jd:py-1 jd:text-[12px] jd:outline-hidden jd:select-none jd:data-[inset]:pl-7 jd:[&_svg]:pointer-events-none jd:[&_svg]:shrink-0 jd:[&_svg:not([class*='size-'])]:size-3.5 jd:data-[variant=destructive]:*:[svg]:!text-destructive jd:[&_svg:not([class*='text-'])]:text-muted-foreground",
				className,
			)}
			{...props}
		>
			{children}
			<ChevronRightIcon className="jd:ml-auto jd:size-4" />
		</MenuPrimitive.SubmenuTrigger>
	)
}

function DropdownMenuSubContent({
	className,
	sideOffset = 4,
	...props
}: MenuPrimitive.Popup.Props & {
	sideOffset?: MenuPrimitive.Positioner.Props["sideOffset"] | undefined
}) {
	return (
		<MenuPrimitive.Portal container={usePortalContainer()}>
			<MenuPrimitive.Positioner sideOffset={sideOffset} className="jd:z-[2147483001]">
				<MenuPrimitive.Popup
					data-slot="dropdown-menu-sub-content"
					className={cn(
						"jd:bg-popover jd:text-popover-foreground jd:data-[open]:animate-in jd:data-[closed]:animate-out jd:data-[closed]:fade-out-0 jd:data-[open]:fade-in-0 jd:data-[closed]:zoom-out-95 jd:data-[open]:zoom-in-95 jd:data-[side=bottom]:slide-in-from-top-2 jd:data-[side=left]:slide-in-from-right-2 jd:data-[side=right]:slide-in-from-left-2 jd:data-[side=top]:slide-in-from-bottom-2 jd:z-[2147483001] jd:min-w-[7rem] jd:origin-(--transform-origin) jd:overflow-hidden jd:rounded-md jd:border jd:border-border jd:p-0.5 jd:shadow-lg",
						className,
					)}
					{...props}
				/>
			</MenuPrimitive.Positioner>
		</MenuPrimitive.Portal>
	)
}

export {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
}
