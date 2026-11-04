import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { isValidElement } from "react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
	"jd:inline-flex jd:cursor-pointer jd:items-center jd:justify-center jd:gap-2 jd:whitespace-nowrap jd:rounded-md jd:text-sm jd:font-medium jd:transition-all jd:disabled:pointer-events-none jd:disabled:opacity-50 jd:disabled:cursor-not-allowed jd:[&_svg]:pointer-events-none jd:[&_svg:not([class*='size-'])]:size-4 jd:shrink-0 jd:[&_svg]:shrink-0 jd:outline-none jd:focus-visible:border-ring jd:focus-visible:ring-ring/50 jd:focus-visible:ring-[3px] jd:aria-invalid:ring-destructive/20 jd:dark:aria-invalid:ring-destructive/40 jd:aria-invalid:border-destructive",
	{
		variants: {
			variant: {
				// Polaris-grade primary: flat black, no drop shadow, slight
				// active-press for tactile feedback.
				default:
					"jd:bg-primary jd:text-primary-foreground jd:hover:bg-primary/90 jd:active:translate-y-px",
				destructive:
					"jd:bg-destructive jd:text-white jd:hover:bg-destructive/90 jd:active:translate-y-px jd:focus-visible:ring-destructive/20 jd:dark:focus-visible:ring-destructive/40 jd:dark:bg-destructive/60",
				// Outline frame + red text — the "soft delete" affordance used for
				// row/inline destructive actions (Delete in a list). Reads as a
				// sibling of `outline`, not the heavy solid-red `destructive`.
				"destructive-outline":
					"jd:border jd:border-input jd:bg-background jd:text-destructive jd:hover:bg-destructive/10 jd:hover:text-destructive jd:active:translate-y-px jd:dark:bg-input/30 jd:dark:border-input",
				// Outline: flat 1px border + white bg. Reads as a clickable
				// surface via the visible frame, no shadow needed.
				outline:
					"jd:border jd:border-input jd:bg-background jd:text-foreground jd:hover:bg-muted jd:hover:text-foreground jd:active:translate-y-px jd:dark:bg-input/30 jd:dark:border-input jd:dark:hover:bg-input/50",
				secondary:
					"jd:bg-secondary jd:text-secondary-foreground jd:hover:bg-secondary/80 jd:active:translate-y-px",
				ghost:
					"jd:text-foreground/80 jd:hover:bg-muted jd:hover:text-foreground jd:dark:hover:bg-accent/50",
				link: "jd:text-primary jd:underline-offset-4 jd:hover:underline",
			},
			// Polaris-grade density. Polaris's *actual* default Button in their
			// docs renders at 28px / 12px / font-weight 500 / rounded-lg — that
			// reads as "slim" against a chunky 36px default. We
			// promote that to project default. The h-7 height was right; the
			// missing piece was `font-medium` (Polaris weight) — without it,
			// buttons read anemic at this height.
			size: {
				// DEFAULT — Polaris "slim/default": 28px · 12px · medium · rounded-lg.
				default:
					"jd:h-7 jd:rounded-lg jd:gap-1.5 jd:px-3 jd:text-[12px] jd:font-medium jd:has-[>svg]:px-2.5 jd:[&_svg]:size-3.5",
				// xs — table-row actions / filter chips. 24px.
				xs: "jd:h-6 jd:rounded-md jd:gap-1 jd:px-2 jd:text-[11px] jd:font-medium jd:has-[>svg]:px-1.5 jd:[&_svg]:size-3",
				// sm — alias of default; existing call sites keep working.
				sm: "jd:h-7 jd:rounded-lg jd:gap-1.5 jd:px-3 jd:text-[12px] jd:font-medium jd:has-[>svg]:px-2.5 jd:[&_svg]:size-3.5",
				// md — Polaris "medium", for page-header CTAs that need to stand out.
				md: "jd:h-8 jd:rounded-lg jd:gap-1.5 jd:px-3.5 jd:text-[13px] jd:font-medium jd:has-[>svg]:px-3 jd:[&_svg]:size-4",
				// lg — full-width form CTAs (login / set-password).
				lg: "jd:h-9 jd:rounded-lg jd:px-4 jd:text-[13px] jd:font-medium jd:has-[>svg]:px-3.5 jd:[&_svg]:size-4",
				// Square icon-only buttons.
				icon: "jd:size-7 jd:[&_svg]:size-3.5",
				"icon-sm": "jd:size-6 jd:[&_svg]:size-3",
				"icon-md": "jd:size-8 jd:[&_svg]:size-4",
				"icon-lg": "jd:size-9 jd:[&_svg]:size-4",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
)

type ButtonProps = ButtonPrimitive.Props &
	VariantProps<typeof buttonVariants> & {
		ref?: React.RefObject<HTMLButtonElement | null> | undefined
	}

/**
 * True when `render` swaps the <button> for another element (a router Link,
 * an <a>). Base UI must then be told `nativeButton={false}`, or it warns and
 * adds button semantics an anchor should not have.
 */
export function rendersNonButton(render: ButtonProps["render"]): boolean {
	if (render === undefined) return false
	return !(isValidElement(render) && render.type === "button")
}

function Button({
	className,
	variant,
	size,
	nativeButton,
	...props
}: ButtonProps) {
	return (
		<ButtonPrimitive
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			nativeButton={nativeButton ?? !rendersNonButton(props.render)}
			{...props}
		/>
	)
}

export { Button, buttonVariants }
