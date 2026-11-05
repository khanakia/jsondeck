/**
 * The on-demand "popups" chunk: every Base UI piece jsondeck uses (menus,
 * popovers, dialogs, with floating-ui and focus management) plus the table
 * controls that live in popups (filter picker and pills, sort, columns, views,
 * group by, more, export, column header menu, rows per page, shortcuts help).
 *
 * Nothing imports this file statically; ui/popups-handle.ts loads it the first
 * time a trigger is hovered, focused or clicked, or a dialog opens. Until then
 * the core shows stand-in triggers (sdt/toolbar/controls.tsx) and the light
 * Base UI wrappers (ui/dropdown-menu.tsx, popover.tsx, dialog.tsx). Keep it
 * that way: one static import of a file below would pull it back into the
 * first download.
 */
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/base-dialog";
export { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/base-menu";
export { Popover, PopoverContent, PopoverTrigger } from "./ui/base-popover";
export { ColumnHeaderMenu } from "./sdt/columns/ColumnHeaderMenu";
export { ColumnVisibilityMenu } from "./sdt/columns/ColumnVisibilityMenu";
export { FilterPicker } from "./sdt/filters/FilterPicker";
export { FilterPill } from "./sdt/filters/FilterPill";
export { ShortcutsHelp } from "./sdt/keyboard/ShortcutsHelp";
export { PageSizeSelect } from "./sdt/pagination/PageSizeSelect";
export { GroupByMenu, MoreMenu } from "./sdt/rows/ToolbarMenus";
export { SortDropdown } from "./sdt/sort/SortDropdown";
export { TableExportButton } from "./sdt/toolbar/TableExportButton";
export { ViewSelector } from "./sdt/views/ViewSelector";
