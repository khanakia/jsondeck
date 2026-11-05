/**
 * A small stand-in for lucide-react's icon factory. Every lucide icon module
 * (`lucide-react/dist/esm/icons/x.mjs`) calls `createLucideIcon(iconData)`;
 * the build points that import here (see `lucideLite` in vite.shared.ts), so
 * the icons keep lucide's exact drawing while lucide's generic runtime
 * (attribute builder, context provider, case converters: about 7 kB before
 * minifying) stays out of the bundle.
 *
 * Renders what lucide renders for the props jsondeck uses: the same `<svg>`
 * attributes, `class="lucide lucide-<name> <className>"`, and
 * `aria-hidden="true"` unless an aria-*, role or title prop (or children) is
 * given. Not supported, because nothing here passes them: `size`, `color`,
 * `strokeWidth`, `absoluteStrokeWidth`, `nonScalingStroke` and the
 * LucideProvider context; they would be passed through as plain attributes.
 */
import { createElement, type ReactNode, type Ref } from "react"

/** One child of an icon: tag name and attributes ("path", { d, key }). */
type IconNode = [string, Record<string, string | number>][]
/** What each lucide icon module hands to the factory. */
type IconData = { name?: string; size?: number; node: IconNode }
type IconProps = { className?: string; children?: ReactNode; ref?: Ref<SVGSVGElement> } & Record<string, unknown>

const hasA11y = (props: Record<string, unknown>, children: ReactNode): boolean => {
	if (children) return true
	for (const k in props) if (k.startsWith("aria-") || k === "role" || k === "title") return true
	return false
}

export default function createLucideIcon(data: IconData) {
	const box = data.size ?? 24
	const base = data.name ? `lucide lucide-${data.name}` : "lucide"
	return function LucideIcon({ className, children, ref, ...rest }: IconProps) {
		return createElement(
			"svg",
			{
				ref,
				xmlns: "http://www.w3.org/2000/svg",
				width: 24,
				height: 24,
				viewBox: `0 0 ${box} ${box}`,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 2,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				className: className ? `${base} ${className}` : base,
				...(hasA11y(rest, children) ? {} : { "aria-hidden": "true" }),
				...rest,
			},
			...data.node.map(([tag, attrs]) => createElement(tag, attrs)),
			children,
		)
	}
}
