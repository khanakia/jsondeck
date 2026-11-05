/*! jsondeck v0.1.1 | MIT License | github.com/khanakia/jsondeck */
import{t as o}from"./shared-daterangecontrol-datecontrol.js";import{vt as t}from"./core.js";var e=t();function n({value:t,onChange:n,onCommit:r}){const a=t?new Date(t):void 0;/* @__PURE__ */ /* @__PURE__ */
return(0,e.jsx)(o,{mode:"single",selected:a,onSelect:o=>{if(!o)return void n(void 0);const t=o.toISOString();n(t),r?.(t)},autoFocus:!0})}export{n as DateControl};
//# sourceMappingURL=datecontrol.js.map