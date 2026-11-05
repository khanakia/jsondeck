/**
 * Popovers that load Base UI on first use (same names and props as
 * base-popover.tsx). The trigger is a plain element until the "popups" chunk
 * arrives; the content only renders inside an open popover. See ui/deferred.tsx.
 */
import type * as React from "react";
import type * as Base from "./base-popover";
type RootProps = React.ComponentProps<typeof Base.Popover>;
type TriggerProps = React.ComponentProps<typeof Base.PopoverTrigger>;
declare const Popover: (props: RootProps) => React.ReactNode;
declare const PopoverTrigger: (props: TriggerProps) => React.ReactNode;
declare const PopoverContent: (props: import("@base-ui/react").PopoverPopupProps & {
    align?: import("@base-ui/react").PopoverPositioner.Props["align"] | undefined;
    side?: import("@base-ui/react").PopoverPositioner.Props["side"] | undefined;
    sideOffset?: import("@base-ui/react").PopoverPositioner.Props["sideOffset"] | undefined;
}) => React.JSX.Element | null;
export { Popover, PopoverContent, PopoverTrigger };
