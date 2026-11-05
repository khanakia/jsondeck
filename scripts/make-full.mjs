// Finishes dist/jsondeck.full.js: the single-file IIFE (vite.full.config.ts) with
// dist/jsondeck.css embedded, so one <script src> tag is enough. The CSS is injected once, as
// <style data-jsondeck> in <head>, and skipped when the page already links
// jsondeck.css or a copy was injected before (the script loaded twice).
//
// The injector is APPENDED after the IIFE rather than prepended, so every line
// and column of the built file stays where it was and its source map is reused
// as-is (only the "file" field changes). It still runs before any later
// <script> on the page, because a classic script runs to the end in one go.
import { readFileSync, writeFileSync } from "node:fs"

const DIR = new URL("../dist/", import.meta.url)
const js = readFileSync(new URL("jsondeck.full.js", DIR), "utf8").replace(/\n\/\/# sourceMappingURL=.*\s*$/, "\n")
const css = readFileSync(new URL("jsondeck.css", DIR), "utf8")
const map = JSON.parse(readFileSync(new URL("jsondeck.full.js.map", DIR), "utf8"))

// "<" escaped so the file can also be pasted inline into a <script> block.
const cssLiteral = JSON.stringify(css).replace(/</g, "\\u003c")
const injector = `;(function(){if(typeof document==="undefined")return;var d=document;if(d.querySelector("style[data-jsondeck]"))return;var l=d.querySelectorAll('link[rel~="stylesheet"]');for(var i=0;i<l.length;i++){if(/(^|\\/)jsondeck(\\.min)?\\.css(\\?|#|$)/.test(l[i].getAttribute("href")||""))return}var s=d.createElement("style");s.setAttribute("data-jsondeck","");s.textContent=${cssLiteral};(d.head||d.documentElement).appendChild(s)})();\n`

writeFileSync(new URL("jsondeck.full.js", DIR), `${js}${injector}//# sourceMappingURL=jsondeck.full.js.map\n`)
writeFileSync(new URL("jsondeck.full.js.map", DIR), JSON.stringify({ ...map, file: "jsondeck.full.js" }))
console.log("make-full: dist/jsondeck.full.js written")
