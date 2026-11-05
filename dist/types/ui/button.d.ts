import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { type VariantProps } from "class-variance-authority";
declare const buttonVariants: (props?: ({
    variant?: "default" | "destructive" | "destructive-outline" | "ghost" | "link" | "outline" | "secondary" | null | undefined;
    size?: "default" | "icon" | "icon-lg" | "icon-md" | "icon-sm" | "lg" | "md" | "sm" | "xs" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & {
    ref?: React.RefObject<HTMLButtonElement | null> | undefined;
};
/**
 * True when `render` swaps the <button> for another element (a router Link,
 * an <a>). Base UI must then be told `nativeButton={false}`, or it warns and
 * adds button semantics an anchor should not have.
 */
export declare function rendersNonButton(render: ButtonProps["render"]): boolean;
declare function Button({ className, variant, size, nativeButton, ...props }: ButtonProps): import("react").JSX.Element;
export { Button, buttonVariants };
