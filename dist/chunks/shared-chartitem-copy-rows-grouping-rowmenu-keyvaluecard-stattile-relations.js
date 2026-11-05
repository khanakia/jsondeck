/*! jsondeck v0.1.2 | MIT License | github.com/khanakia/jsondeck */
function t(t,e){if(e in t)return t[e];if(!e.includes("."))return;let n=t;for(const r of e.split(".")){if(null===n||"object"!=typeof n)return;n=Reflect.get(n,r)}return n}export{t};
//# sourceMappingURL=shared-chartitem-copy-rows-grouping-rowmenu-keyvaluecard-stattile-relations.js.map