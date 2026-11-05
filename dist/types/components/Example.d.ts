/**
 * Shell for JsonDeck.example(): a scoped root (theme follows the OS) holding
 * the Preview / Code box, with the mounted deck in the Preview tab. An
 * on-demand chunk (with the config → HTML snippet writer), loaded by example().
 */
import type * as React from "react";
import type { CodeLang } from "../core/highlight";
import type { JsonDeckConfig } from "../core/config";
import type { Labels } from "../core/labels";
export type ExampleShellProps = {
    labels: Labels;
    title?: string | undefined;
    description?: string | undefined;
    /** Code tab text as given; without it, a complete HTML page is written from `config`. */
    code?: string | undefined;
    /** The example's config with its data already parsed (for the generated snippet). */
    config?: JsonDeckConfig | undefined;
    lang: CodeLang;
    preview?: React.ReactNode | undefined;
};
export declare function ExampleShell(props: ExampleShellProps): React.JSX.Element;
