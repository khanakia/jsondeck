/**
 * Toolbar menus of ClientDataTable: group by (multi-level, in pick order) and
 * "more" (expand / collapse all, select all matches, clear grouping). Part of
 * the on-demand popups chunk (src/popups.ts); the core shows their stand-ins.
 */
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLabels } from "@/lib/labels"
import { Tip } from "../../components/Tip"
import type { ResolvedColumn } from "../../core/resolve"
import { GroupTrigger, groupTip, MoreTrigger } from "../toolbar/triggers"

export function GroupByMenu({ columns, value, onChange }: { columns: ResolvedColumn[]; value: string[]; onChange: (v: string[]) => void }) {
	const L = useLabels()
	const candidates = columns.filter((c) => c.type === "enum" || c.type === "boolean" || c.type === "text" || c.type === "mono" || c.type === "date")
	return (
		<DropdownMenu>
			<Tip label={groupTip(L, value)}>
				<DropdownMenuTrigger asChild>
					<GroupTrigger value={value} />
				</DropdownMenuTrigger>
			</Tip>
			<DropdownMenuContent align="end" className="jd:min-w-44 jd:p-0.5">
				<DropdownMenuGroup>
					<DropdownMenuItem className="jd:h-7 jd:px-2 jd:text-xs" onClick={() => onChange([])}>
						{L.noGrouping}
					</DropdownMenuItem>
					{candidates.map((c) => {
						const i = value.indexOf(c.id)
						return (
							<DropdownMenuItem
								key={c.id}
								closeOnClick={false}
								data-jd-group-option={c.id}
								className="jd:h-7 jd:gap-1.5 jd:px-2 jd:text-xs"
								onClick={() => onChange(i >= 0 ? value.filter((v) => v !== c.id) : [...value, c.id])}
							>
								<span className="jd:inline-flex jd:w-3.5 jd:justify-center jd:text-[10px] jd:tabular-nums">{i >= 0 ? i + 1 : ""}</span>
								{c.label}
							</DropdownMenuItem>
						)
					})}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

export function MoreMenu({ items }: { items: { label: string; onSelect: () => void; id: string }[] }) {
	const L = useLabels()
	if (items.length === 0) return null
	return (
		<DropdownMenu>
			<Tip label={L.more}>
				<DropdownMenuTrigger asChild>
					<MoreTrigger />
				</DropdownMenuTrigger>
			</Tip>
			<DropdownMenuContent align="end" className="jd:min-w-40 jd:p-0.5">
				<DropdownMenuGroup>
					{items.map((it) => (
						<DropdownMenuItem key={it.id} data-jd-more={it.id} className="jd:h-7 jd:px-2 jd:text-xs" onClick={it.onSelect}>
							{it.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
