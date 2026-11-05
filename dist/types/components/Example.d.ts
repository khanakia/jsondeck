/**
 * Shell for JsonDeck.example(): a scoped root (theme follows the OS) holding
 * the Preview / Code box, with the mounted deck in the Preview tab.
 */
import type * as React from "react";
import type { CodeLang } from "../core/highlight";
import type { Labels } from "../core/labels";
export declare function ExampleShell(props: {
    labels: Labels;
    title?: string | undefined;
    description?: string | undefined;
    code: string;
    lang: CodeLang;
    preview?: React.ReactNode | undefined;
}): React.JSX.Element;
