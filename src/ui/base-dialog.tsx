import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { XIcon } from "lucide-react"
import type * as React from "react"
import { Button } from "@/components/ui/button"
import { usePortalContainer } from "@/lib/portal"
import { cn } from "@/lib/utils"

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
	return <DialogPrimitive.Root {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
	return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
	return <DialogPrimitive.Portal data-slot="dialog-portal" container={usePortalContainer()} {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
	return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
	className,
	...props
}: DialogPrimitive.Backdrop.Props) {
	// base-ui drives transitions through `data-starting-style` and
	// `data-ending-style` markers. We use CSS transitions (not
	// tailwindcss-animate keyframes) — keyframe animations don't compose with
	// base-ui's marker lifecycle and produce a visible black-overlay flash on
	// close. Plain `transition-opacity` + opacity-0 markers are reliable.
	return (
		<DialogPrimitive.Backdrop
			data-slot="dialog-overlay"
			className={cn(
				"jd:fixed jd:inset-0 jd:z-[2147483001] jd:bg-black/50 jd:transition-opacity jd:duration-150 jd:data-[starting-style]:opacity-0 jd:data-[ending-style]:opacity-0",
				className,
			)}
			{...props}
		/>
	)
}

function DialogContent({
	className,
	children,
	showCloseButton = true,
	...props
}: Omit<DialogPrimitive.Popup.Props, "children"> & {
	children?: React.ReactNode | undefined
	showCloseButton?: boolean | undefined
}) {
	return (
		<DialogPortal>
			<DialogOverlay />
			<DialogPrimitive.Popup
				data-slot="dialog-content"
				// Polaris-grade modal: 3-zone structure where DialogHeader
				// and DialogFooter draw their OWN padding + separator
				// borders. The content surface itself is padding-less; the
				// header/footer/body each control their own space. Inner
				// `flex flex-col` so the 3 zones stack and the footer can
				// stick to the bottom even with tall body content.
				className={cn(
					"jd:fixed jd:top-[50%] jd:left-[50%] jd:z-[2147483001] jd:flex jd:w-full jd:max-w-[calc(100%-2rem)] jd:translate-x-[-50%] jd:translate-y-[-50%] jd:flex-col jd:overflow-hidden jd:rounded-lg jd:border jd:border-border jd:bg-background jd:shadow-lg jd:outline-none jd:transition-opacity jd:duration-150 jd:data-[starting-style]:opacity-0 jd:data-[ending-style]:opacity-0 jd:sm:max-w-[400px]",
					className,
				)}
				{...props}
			>
				{children}
				{showCloseButton && (
					<DialogPrimitive.Close
						data-slot="dialog-close"
						className="jd:absolute jd:top-2.5 jd:right-2.5 jd:cursor-pointer jd:rounded jd:p-1 jd:text-muted-foreground jd:opacity-80 jd:hover:bg-muted/60 jd:hover:opacity-100 jd:focus:outline-none jd:disabled:pointer-events-none jd:disabled:cursor-not-allowed jd:[&_svg]:pointer-events-none jd:[&_svg]:shrink-0 jd:[&_svg:not([class*='size-'])]:size-3.5"
					>
						<XIcon />
						<span className="jd:sr-only">Close</span>
					</DialogPrimitive.Close>
				)}
			</DialogPrimitive.Popup>
		</DialogPortal>
	)
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="dialog-header"
			// Polaris-grade header bar: own padding, bottom border, leaves
			// space at the right for the absolute X close (pr-8).
			className={cn(
				"jd:flex jd:flex-col jd:gap-0.5 jd:border-b jd:border-border jd:px-4 jd:py-3 jd:pr-8 jd:text-left",
				className,
			)}
			{...props}
		/>
	)
}

// DialogBody — the content area between header and footer. Owns its own
// padding so the page-level form can stay clean of repetitive `p-4`
// wrappers. Use this around any form fields / descriptive content
// inside a Dialog.
function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="dialog-body"
			className={cn("jd:px-4 jd:py-3.5", className)}
			{...props}
		/>
	)
}

function DialogFooter({
	className,
	showCloseButton = false,
	children,
	...props
}: React.ComponentProps<"div"> & {
	showCloseButton?: boolean | undefined
}) {
	return (
		<div
			data-slot="dialog-footer"
			// Polaris-grade footer: own padding, top border + subtle muted
			// background so the actions visually anchor at the bottom of
			// the modal. Right-aligned actions, gap-2 between them.
			className={cn(
				"jd:flex jd:flex-row jd:justify-end jd:gap-2 jd:border-t jd:border-border jd:bg-muted/50 jd:px-4 jd:py-2.5",
				className,
			)}
			{...props}
		>
			{children}
			{showCloseButton && (
				<DialogPrimitive.Close
					render={<Button variant="outline">Close</Button>}
				/>
			)}
		</div>
	)
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
	return (
		<DialogPrimitive.Title
			data-slot="dialog-title"
			// Polaris title: text-[15px] semibold. Substantial enough to
			// own the header bar without shouting.
			className={cn("jd:text-[15px] jd:leading-tight jd:font-semibold", className)}
			{...props}
		/>
	)
}

function DialogDescription({
	className,
	...props
}: DialogPrimitive.Description.Props) {
	return (
		<DialogPrimitive.Description
			data-slot="dialog-description"
			className={cn("jd:text-[11px] jd:text-muted-foreground", className)}
			{...props}
		/>
	)
}

export {
	Dialog,
	DialogBody,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
}
