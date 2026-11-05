import * as React from "react";
import type { SortOption, SortRule } from "../types";
type Props = {
    options: SortOption[];
    value: SortRule[];
    onChange: (sort: SortRule[]) => void;
};
/**
 * Multi-column sort dropdown.
 *
 * Active rules render at the top in priority order (1., 2., …).
 * Available fields render below — clicking one appends it as the
 * next-lowest priority. Up/down arrows navigate the entire list
 * (active + available); Enter toggles the highlighted item.
 *
 * Uses Popover (not base-ui Menu) so the unified arrow-key nav
 * driven by `useListNavigation` works across our mixed row types.
 */
export declare function SortDropdown({ options, value, onChange }: Props): React.JSX.Element;
export {};
