import * as React from "react";
import { type CodeLang } from "../core/highlight";
/**
 * Copy text: the clipboard API first, then a selected textarea + execCommand
 * (file:// and older browsers). Resolves true only when a copy happened.
 */
export declare function copyText(text: string, host: HTMLElement | null): Promise<boolean>;
export declare function CodeBlock({ code, lang }: {
    code: string;
    lang: CodeLang;
}): React.JSX.Element;
export declare function CodeView({ title, description, code, lang, preview, bare, }: {
    title?: string | undefined;
    description?: string | undefined;
    code: string;
    lang: CodeLang;
    /** Without a preview, only the Code tab shows. */
    preview?: React.ReactNode | undefined;
    /** Code only, slim header: the language name instead of tabs (markdown code fences). */
    bare?: boolean | undefined;
}): React.JSX.Element;
