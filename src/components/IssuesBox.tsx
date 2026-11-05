/**
 * The config issues box ("3 config issues" with each problem and a "did you
 * mean"), loaded only when a config has issues.
 */
import { TriangleAlert } from "lucide-react"
import { fill } from "../core/labels"
import { formatIssue, type Issue } from "../core/validate"

export function IssuesBox({ issues, label }: { issues: Issue[]; label: string }) {
	if (issues.length === 0) return null
	return (
		<details open className="jd:rounded-md jd:border jd:border-amber-300 jd:bg-amber-50 jd:px-2 jd:py-1 jd:text-[12px] jd:text-amber-900 jd:dark:border-amber-800 jd:dark:bg-amber-950 jd:dark:text-amber-200" data-jd="issues">
			<summary className="jd:flex jd:cursor-pointer jd:items-center jd:gap-1.5 jd:font-medium">
				<TriangleAlert className="jd:h-3.5 jd:w-3.5" />
				{fill(label, { n: issues.length })}
			</summary>
			<ul className="jd:mt-1 jd:flex jd:flex-col jd:gap-0.5 jd:pl-5 jd:font-mono jd:text-[11px]">
				{issues.map((i) => (
					<li key={`${i.path}|${i.message}`}>{formatIssue(i)}</li>
				))}
			</ul>
		</details>
	)
}

