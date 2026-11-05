/*! jsondeck v0.1.2 | MIT License | github.com/khanakia/jsondeck */
import{t as o}from"./shared-daterangecontrol-datecontrol.js";import{jsx as t}from"react/jsx-runtime";function e({value:e,onChange:n,onCommit:r}){const i=e?new Date(e):void 0;/* @__PURE__ */
return t(o,{mode:"single",selected:i,onSelect:o=>{if(!o)return void n(void 0);const t=o.toISOString();n(t),r?.(t)},autoFocus:!0})}export{e as DateControl};
//# sourceMappingURL=datecontrol.js.map