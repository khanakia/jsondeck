/**
 * Dialogs that load Base UI when they first open (same names and props as
 * base-dialog.tsx). Every dialog here is controlled (`open`), so a closed
 * dialog renders nothing and an open one starts the "popups" load and shows
 * as soon as it arrives. See ui/deferred.tsx.
 */
import * as React from "react";
import type * as Base from "./base-dialog";
declare function Dialog(props: React.ComponentProps<typeof Base.Dialog>): React.JSX.Element | null;
declare const DialogContent: (props: Omit<import("@base-ui/react").DialogPopupProps, "children"> & {
    children?: React.ReactNode | undefined;
    showCloseButton?: boolean | undefined;
}) => React.JSX.Element | null;
declare const DialogHeader: (props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>) => React.JSX.Element | null;
declare const DialogFooter: (props: React.ClassAttributes<HTMLDivElement> & React.HTMLAttributes<HTMLDivElement> & {
    showCloseButton?: boolean | undefined;
}) => React.JSX.Element | null;
declare const DialogTitle: (props: import("@base-ui/react").DialogTitleProps) => React.JSX.Element | null;
declare const DialogDescription: (props: import("@base-ui/react").DialogDescriptionProps) => React.JSX.Element | null;
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle };
