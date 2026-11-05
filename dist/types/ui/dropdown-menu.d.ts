/**
 * Dropdown menus that load Base UI on first use. Same names and props as the
 * real wrappers in base-menu.tsx; the trigger renders as a plain button until
 * the "popups" chunk arrives (see ui/deferred.tsx), and every other part only
 * renders inside an open menu. Label is a plain element, kept here. Only the
 * parts jsondeck uses are here (see src/popups.ts).
 */
import type * as React from "react";
import type * as Base from "./base-menu";
declare const DropdownMenu: (props: React.ComponentProps<typeof Base.DropdownMenu>) => React.ReactNode;
declare const DropdownMenuTrigger: (props: React.ComponentProps<typeof Base.DropdownMenuTrigger>) => React.ReactNode;
declare const DropdownMenuContent: (props: import("@base-ui/react").MenuPopupProps & {
    align?: import("@base-ui/react").MenuPositioner.Props["align"] | undefined;
    side?: import("@base-ui/react").MenuPositioner.Props["side"] | undefined;
    sideOffset?: import("@base-ui/react").MenuPositioner.Props["sideOffset"] | undefined;
}) => React.JSX.Element | null;
declare const DropdownMenuGroup: (props: import("@base-ui/react").MenuGroupProps) => React.JSX.Element | null;
declare const DropdownMenuItem: (props: import("@base-ui/react").MenuItemProps & {
    inset?: boolean | undefined;
    variant?: "default" | "destructive" | undefined;
}) => React.JSX.Element | null;
declare const DropdownMenuSeparator: (props: import("@base-ui/react").SeparatorProps) => React.JSX.Element | null;
/** A plain section header (Base UI's GroupLabel needs a Group ancestor; this does not). */
declare function DropdownMenuLabel({ className, inset, ...props }: React.ComponentProps<"div"> & {
    inset?: boolean | undefined;
}): React.JSX.Element;
export { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, };
