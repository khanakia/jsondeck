import * as React from "react";
type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Pre-fill the input (used by Rename / Save-as) */
    initialName?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    confirmLabel?: string | undefined;
    onSave: (name: string) => Promise<void> | void;
};
export declare function SaveViewDialog({ open, onOpenChange, initialName, title, description, confirmLabel, onSave, }: Props): React.JSX.Element;
export {};
