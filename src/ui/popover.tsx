import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import type * as React from "react"
import { usePortalContainer } from "@/lib/portal"
import { cn } from "@/lib/utils"

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
	return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
	asChild,
	children,
	...props
}: PopoverPrimitive.Trigger.Props & { asChild?: boolean }) {
	// base-ui defaults `nativeButton: true`, which works when the asChild
	// child is a real `<button>` / `<Button>`. If a caller renders a
	// non-button (e.g. a styled `<div>` pill), they must pass
	// `nativeButton={false}` themselves — it's forwarded via `{...props}`.
	if (asChild) {
		return (
			<PopoverPrimitive.Trigger
				data-slot="popover-trigger"
				render={children as React.ReactElement}
				{...props}
			/>
		)
	}
	return (
		<PopoverPrimitive.Trigger data-slot="popover-trigger" {...props}>
			{children}
		</PopoverPrimitive.Trigger>
	)
}

function PopoverContent({
	className,
	align,
	side,
	sideOffset = 4,
	...props
}: PopoverPrimitive.Popup.Props & {
	align?: PopoverPrimitive.Positioner.Props["align"] | undefined
	side?: PopoverPrimitive.Positioner.Props["side"] | undefined
	sideOffset?: PopoverPrimitive.Positioner.Props["sideOffset"] | undefined
}) {
	return (
		<PopoverPrimitive.Portal container={usePortalContainer()}>
			<PopoverPrimitive.Positioner
				data-slot="popover-positioner"
				align={align}
				side={side}
				sideOffset={sideOffset}
				className="jd:z-[2147483001]"
			>
				<PopoverPrimitive.Popup
					data-slot="popover-content"
					className={cn(
						"jd:bg-popover jd:text-popover-foreground jd:data-[open]:animate-in jd:data-[closed]:animate-out jd:data-[closed]:fade-out-0 jd:data-[open]:fade-in-0 jd:data-[closed]:zoom-out-95 jd:data-[open]:zoom-in-95 jd:data-[side=bottom]:slide-in-from-top-2 jd:data-[side=left]:slide-in-from-right-2 jd:data-[side=right]:slide-in-from-left-2 jd:data-[side=top]:slide-in-from-bottom-2 jd:z-[2147483001] jd:w-72 jd:rounded-md jd:border jd:p-4 jd:shadow-md jd:outline-hidden",
						className,
					)}
					{...props}
				/>
			</PopoverPrimitive.Positioner>
		</PopoverPrimitive.Portal>
	)
}

function PopoverAnchor({ ...props }: PopoverPrimitive.Arrow.Props) {
	return <PopoverPrimitive.Arrow data-slot="popover-anchor" {...props} />
}

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger }
