import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import type * as React from "react";
declare function DropdownMenu({ ...props }: MenuPrimitive.Root.Props): React.JSX.Element;
declare function DropdownMenuPortal({ ...props }: MenuPrimitive.Portal.Props): React.JSX.Element;
declare function DropdownMenuTrigger({ asChild, children, ...props }: MenuPrimitive.Trigger.Props & {
    asChild?: boolean;
}): React.JSX.Element;
declare function DropdownMenuContent({ className, align, side, sideOffset, ...props }: MenuPrimitive.Popup.Props & {
    align?: MenuPrimitive.Positioner.Props["align"] | undefined;
    side?: MenuPrimitive.Positioner.Props["side"] | undefined;
    sideOffset?: MenuPrimitive.Positioner.Props["sideOffset"] | undefined;
}): React.JSX.Element;
declare function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props): React.JSX.Element;
declare function DropdownMenuItem({ className, inset, variant, ...props }: MenuPrimitive.Item.Props & {
    inset?: boolean | undefined;
    variant?: "default" | "destructive" | undefined;
}): React.JSX.Element;
declare function DropdownMenuCheckboxItem({ className, children, checked, ...props }: MenuPrimitive.CheckboxItem.Props): React.JSX.Element;
declare function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props): React.JSX.Element;
declare function DropdownMenuRadioItem({ className, children, ...props }: MenuPrimitive.RadioItem.Props): React.JSX.Element;
/**
 * Plain styled label. Base UI's `Menu.GroupLabel` requires a `<Menu.Group>`
 * ancestor and throws "MenuGroupRootContext is missing" otherwise — but most
 * callers use `DropdownMenuLabel` as a top-level header, not
 * inside a group. Render a div so the API stays drop-in.
 */
declare function DropdownMenuLabel({ className, inset, ...props }: React.ComponentProps<"div"> & {
    inset?: boolean | undefined;
}): React.JSX.Element;
declare function DropdownMenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props): React.JSX.Element;
declare function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">): React.JSX.Element;
declare function DropdownMenuSub({ ...props }: MenuPrimitive.SubmenuRoot.Props): React.JSX.Element;
declare function DropdownMenuSubTrigger({ className, inset, children, ...props }: MenuPrimitive.SubmenuTrigger.Props & {
    inset?: boolean | undefined;
}): React.JSX.Element;
declare function DropdownMenuSubContent({ className, sideOffset, ...props }: MenuPrimitive.Popup.Props & {
    sideOffset?: MenuPrimitive.Positioner.Props["sideOffset"] | undefined;
}): React.JSX.Element;
export { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, };
