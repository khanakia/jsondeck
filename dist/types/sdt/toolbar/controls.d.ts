/**
 * The table's popup controls as the core sees them. Each real control (with
 * its popup, state and logic) is in the on-demand popups chunk (src/popups.ts);
 * until that chunk arrives, its stand-in here renders the very same trigger
 * button (toolbar/triggers.tsx) with the same tooltip and the same early
 * "nothing to show" rules, so the toolbar looks identical and keyboard
 * shortcuts find the same `data-jd-*` attributes. See ui/deferred.tsx for the
 * hand-over (preload on hover / focus, a cold click replayed on the real one).
 */
import type * as React from "react";
import type { Row } from "../../core/query";
import type { ShortcutsHelp as RealShortcutsHelp } from "../keyboard/ShortcutsHelp";
export declare const FilterPicker: (props: {
    fields: import("../types").FilterFieldDef<unknown>[];
    onAdd: (cond: import("../types").FilterCondition) => void;
    open?: boolean | undefined;
    onOpenChange?: ((open: boolean) => void) | undefined;
    initialField?: string | null | undefined;
    onInitialFieldConsumed?: (() => void) | undefined;
    activeCount?: number | undefined;
}) => React.JSX.Element;
export declare const SortDropdown: (props: {
    options: import("../types").SortOption[];
    value: import("../types").SortRule[];
    onChange: (sort: import("../types").SortRule[]) => void;
}) => React.JSX.Element;
export declare const ColumnVisibilityMenu: (props: {
    columns: import("../types").DataTableColumn<Row>[];
    hiddenColumns: string[];
    onToggle: (columnId: string) => void;
    onShowAll: () => void;
    detailColumns?: string[] | undefined;
    onToggleDetail?: ((columnId: string) => void) | undefined;
}) => React.JSX.Element;
export declare const ViewSelector: (props: {
    views: import("../views/storage/ViewStorage").SavedView[];
    activeViewId: string | null;
    state: import("../types").TableState;
    onSelectView: (view: import("../views/storage/ViewStorage").SavedView) => void;
    onCreateView: (name: string) => Promise<import("../views/storage/ViewStorage").SavedView>;
    onUpdateView: (view: import("../views/storage/ViewStorage").SavedView) => Promise<import("../views/storage/ViewStorage").SavedView>;
    onDeleteView: (id: string) => Promise<void>;
    onSetDefault: (id: string | null) => Promise<void>;
    onSetFavorite: (id: string, favorite: boolean) => Promise<void>;
}) => React.JSX.Element;
export declare const GroupByMenu: (props: {
    columns: import("../..").ResolvedColumn[];
    value: string[];
    onChange: (v: string[]) => void;
}) => React.JSX.Element;
export declare const MoreMenu: (props: {
    items: {
        label: string;
        onSelect: () => void;
        id: string;
    }[];
}) => React.JSX.Element;
export declare const TableExportButton: (props: {
    ctx: import("../types").ToolbarCtx<Row, unknown>;
    filename?: (string | (() => string)) | undefined;
    fields: readonly import("./csv").CsvField<Row>[];
    mode?: "page" | "all" | "both" | undefined;
    label?: string | undefined;
    hideIcon?: boolean | undefined;
    maxAllRows?: number | undefined;
}) => React.JSX.Element;
export declare const ColumnHeaderMenu: (props: {
    column: import("../types").DataTableColumn<Row>;
    sortFieldIds: Set<string>;
    filterFieldIds: Set<string>;
    hideable: boolean;
    currentSort: import("../types").SortRule[];
    onSort: (rule: import("../types").SortRule | null) => void;
    onFilter: (filterFieldId: string) => void;
    onHide: () => void;
}) => React.JSX.Element;
export declare const PageSizeSelect: (props: {
    value: number;
    options: number[];
    onChange: (size: number) => void;
}) => React.JSX.Element;
/** Filter pills: only exist once a filter is set; they load (with the popups chunk) the first time one shows. */
export declare const FilterPill: (props: {
    field: import("../types").FilterFieldDef<unknown>;
    condition: import("../types").FilterCondition;
    onUpdate: (cond: import("../types").FilterCondition) => void;
    onRemove: () => void;
}) => React.JSX.Element | null;
/** The "?" shortcuts dialog: nothing until opened, then loads and shows. */
export declare function ShortcutsHelp(p: React.ComponentProps<typeof RealShortcutsHelp>): React.JSX.Element | null;
