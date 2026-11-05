import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import type * as React from "react";
declare function Popover({ ...props }: PopoverPrimitive.Root.Props): React.JSX.Element;
declare function PopoverTrigger({ asChild, children, ...props }: PopoverPrimitive.Trigger.Props & {
    asChild?: boolean;
}): React.JSX.Element;
declare function PopoverContent({ className, align, side, sideOffset, ...props }: PopoverPrimitive.Popup.Props & {
    align?: PopoverPrimitive.Positioner.Props["align"] | undefined;
    side?: PopoverPrimitive.Positioner.Props["side"] | undefined;
    sideOffset?: PopoverPrimitive.Positioner.Props["sideOffset"] | undefined;
}): React.JSX.Element;
declare function PopoverAnchor({ ...props }: PopoverPrimitive.Arrow.Props): React.JSX.Element;
export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger };
