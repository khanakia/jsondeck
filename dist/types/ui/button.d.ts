import { type VariantProps } from "class-variance-authority";
import type * as React from "react";
declare const buttonVariants: (props?: ({
    variant?: "default" | "destructive" | "destructive-outline" | "ghost" | "link" | "outline" | "secondary" | null | undefined;
    size?: "default" | "icon" | "icon-lg" | "icon-md" | "icon-sm" | "lg" | "md" | "sm" | "xs" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * A plain <button>. It used Base UI's Button before, which only adds
 * `render` / `focusableWhenDisabled` (never used here) and pulled Base UI into
 * the first download of every page. Menu and popover triggers still wrap it
 * (`render={<Button />}`), so it forwards `ref` and every DOM prop as is.
 */
type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>;
declare function Button({ className, variant, size, type, ...props }: ButtonProps): React.JSX.Element;
export { Button, buttonVariants };
