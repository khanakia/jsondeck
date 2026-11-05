/**
 * A small syntax highlighter for the Code tab: JS/TS (also JSON) and HTML
 * (with JS inside <script>). Pure: text in, tokens out; the component maps
 * token kinds to colours. Good enough for config snippets, not a parser.
 */
export declare const TOKEN_KINDS: readonly ["plain", "comment", "string", "number", "keyword", "literal", "punct", "tag", "attr", "property"];
export type TokenKind = (typeof TOKEN_KINDS)[number];
export type Token = {
    kind: TokenKind;
    text: string;
};
export declare const CODE_LANGS: readonly ["js", "ts", "json", "html"];
export type CodeLang = (typeof CODE_LANGS)[number];
export declare function highlightJs(src: string): Token[];
/** HTML: tags + attributes; the body of <script> is highlighted as JS (JSON data tags too). */
export declare function highlightHtml(src: string): Token[];
export declare function highlight(src: string, lang: CodeLang): Token[];
