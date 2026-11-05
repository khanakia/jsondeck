/*! jsondeck v0.1.1 | MIT License | github.com/khanakia/jsondeck */
import{r as e}from"./rolldown-runtime.js";import{t as a}from"./shared-edittools-popups-codeview-markdown.js";import{t}from"./shared-edittools-rowfeatures-codeview-markdown.js";import{At as s,F as d,G as r,I as i,K as o,L as n,Ot as l,R as c,bt as j,dt as m,gt as h,l as p,s as x,vt as u,yt as g}from"./core.js";import{t as f}from"./shared-edittools-popups.js";import{n as v}from"./shared-edittools-layout-edit.js";var y=l({name:"grip-vertical",size:24,node:[["circle",{cx:"9",cy:"12",r:"1",key:"1vctgf"}],["circle",{cx:"9",cy:"5",r:"1",key:"hp0tcf"}],["circle",{cx:"9",cy:"19",r:"1",key:"fkjjf6"}],["circle",{cx:"15",cy:"12",r:"1",key:"1tmaij"}],["circle",{cx:"15",cy:"5",r:"1",key:"19l28e"}],["circle",{cx:"15",cy:"19",r:"1",key:"f4zoj3"}]]}),b=l({name:"minus",size:24,node:[["path",{d:"M5 12h14",key:"1ays0h"}]]}),k=l({name:"move-horizontal",size:24,node:[["path",{d:"m18 8 4 4-4 4",key:"1ak13k"}],["path",{d:"M2 12h20",key:"9i4pu4"}],["path",{d:"m6 8-4 4 4 4",key:"15zrgr"}]]}),z=l({name:"move-vertical",size:24,node:[["path",{d:"M12 2v20",key:"t6zp3m"}],["path",{d:"m8 18 4 4 4-4",key:"bh5tu3"}],["path",{d:"m8 6 4-4 4 4",key:"ybng9g"}]]}),C=l({name:"rotate-ccw",size:24,node:[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]]}),w=/* @__PURE__ */e(s(),1),N=u();function D({item:e,span:a,cols:t,ops:s}){const d=m();/* @__PURE__ */ /* @__PURE__ */
return(0,N.jsxs)("div",{className:"jd:mb-1 jd:flex jd:items-center jd:gap-0.5 jd:text-[11px]","data-jd":"item-tools",children:[
/* @__PURE__ */
/* @__PURE__ */(0,N.jsxs)("span",{draggable:!0,onDragStart:a=>{a.dataTransfer.setData("text/jd-item",e.id),a.dataTransfer.effectAllowed="move"},title:d.moveHandle,"data-jd":"drag-handle",className:"jd:text-muted-foreground jd:flex jd:cursor-grab jd:items-center jd:gap-1",children:[
/* @__PURE__ */
/* @__PURE__ */(0,N.jsx)(y,{className:"jd:h-3.5 jd:w-3.5"}),e.kind,e.table?` · ${e.table}`:""]}),
/* @__PURE__ */
/* @__PURE__ */(0,N.jsx)("span",{className:"jd:flex-1"}),
/* @__PURE__ */
/* @__PURE__ */(0,N.jsxs)("span",{className:"jd:text-muted-foreground jd:mr-1 jd:tabular-nums","data-jd":"item-size",children:[a,"/",t,e.height?` · ${e.height}px`:""]}),
/* @__PURE__ */
/* @__PURE__ */(0,N.jsx)(h,{variant:"ghost",size:"icon-sm","aria-label":d.narrower,onClick:()=>s.update(e.id,{span:Math.max(1,e.span-1)}),children:/* @__PURE__ */ /* @__PURE__ */(0,N.jsx)(b,{})}),
/* @__PURE__ */
/* @__PURE__ */(0,N.jsx)(k,{className:"jd:text-muted-foreground jd:h-3 jd:w-3"}),
/* @__PURE__ */
/* @__PURE__ */(0,N.jsx)(h,{variant:"ghost",size:"icon-sm","aria-label":d.wider,onClick:()=>s.update(e.id,{span:Math.min(t,e.span+1)}),children:/* @__PURE__ */ /* @__PURE__ */(0,N.jsx)(f,{})}),
/* @__PURE__ */
/* @__PURE__ */(0,N.jsx)(h,{variant:"ghost",size:"icon-sm","aria-label":d.shorter,onClick:()=>s.update(e.id,{height:e.height?e.height-80<120?void 0:e.height-80:void 0}),children:/* @__PURE__ */ /* @__PURE__ */(0,N.jsx)(b,{})}),
/* @__PURE__ */
/* @__PURE__ */(0,N.jsx)(z,{className:"jd:text-muted-foreground jd:h-3 jd:w-3"}),
/* @__PURE__ */
/* @__PURE__ */(0,N.jsx)(h,{variant:"ghost",size:"icon-sm","aria-label":d.taller,onClick:()=>s.update(e.id,{height:(e.height??240)+80}),children:/* @__PURE__ */ /* @__PURE__ */(0,N.jsx)(f,{})}),
/* @__PURE__ */
/* @__PURE__ */(0,N.jsx)(h,{variant:"ghost",size:"icon-sm","aria-label":d.remove,onClick:()=>s.remove(e.id),children:/* @__PURE__ */ /* @__PURE__ */(0,N.jsx)(j,{})})]})}function M({section:e}){const a=w.useContext(x),t=w.useContext(p),s=m(),[d,i]=w.useState("chart"),[n,l]=w.useState(t?.deck.tables[0]?.name??""),[c,j]=w.useState(!1);if(!a?.edit||!t)return null;const u="jd:h-6 jd:rounded jd:border jd:border-input jd:bg-background jd:px-1 jd:text-[11px]";/* @__PURE__ */ /* @__PURE__ */
return(0,N.jsxs)("div",{"data-jd":"add-item","data-jd-section":e.path,className:g("jd:col-span-full jd:flex jd:items-center jd:gap-1 jd:rounded jd:border jd:border-dashed jd:p-1 jd:text-[11px]",c&&"jd:border-primary"),onDragOver:e=>{e.preventDefault(),j(!0)},onDragLeave:()=>j(!1),onDrop:t=>{t.preventDefault(),j(!1);const s=t.dataTransfer.getData("text/jd-item");s&&a.ops.move(s,e.path,e.items.length)},children:[
/* @__PURE__ */
/* @__PURE__ */(0,N.jsxs)("span",{className:"jd:text-muted-foreground jd:mr-1",children:[s.dropHere," ·"]}),
/* @__PURE__ */
/* @__PURE__ */(0,N.jsx)("select",{"aria-label":"Component","data-jd":"add-kind",className:u,value:d,onChange:e=>i(r.find(a=>a===e.target.value)??"table"),children:r.map(e=>/* @__PURE__ */ /* @__PURE__ */(0,N.jsx)("option",{value:e,children:e},e))}),!o.includes(d)&&/* @__PURE__ */ /* @__PURE__ */(0,N.jsx)("select",{"aria-label":"Table","data-jd":"add-table",className:u,value:n,onChange:e=>l(e.target.value),children:t.deck.tables.map(e=>/* @__PURE__ */ /* @__PURE__ */(0,N.jsx)("option",{value:e.name,children:e.label},e.name))}),
/* @__PURE__ */
/* @__PURE__ */(0,N.jsxs)(h,{variant:"outline",size:"xs","data-jd":"add-button",onClick:()=>a.ops.add(e.path,v(t.deck,d,n,a.nextId())),children:[/* @__PURE__ */ /* @__PURE__ */(0,N.jsx)(f,{}),s.addItem]})]})}function L({copied:e,onCopy:s,onReset:r}){const o=m(),l=c();/* @__PURE__ */ /* @__PURE__ */
return(0,N.jsxs)(N.Fragment,{children:[/* @__PURE__ */ /* @__PURE__ */(0,N.jsx)(n,{label:e?o.copied:o.copyConfig,children:/* @__PURE__ */ /* @__PURE__ */(0,N.jsxs)(h,{variant:"ghost",size:"sm","aria-label":o.copyConfig,className:l?i:d,"data-jd":"copy-config",onClick:s,children:[e?/* @__PURE__ */ /* @__PURE__ */(0,N.jsx)(a,{className:"jd:h-3.5 jd:w-3.5"}):/* @__PURE__ */ /* @__PURE__ */(0,N.jsx)(t,{className:"jd:h-3.5 jd:w-3.5"}),l&&(e?o.copied:o.copyConfig)]})}),/* @__PURE__ */ /* @__PURE__ */(0,N.jsx)(n,{label:o.resetLayout,children:/* @__PURE__ */ /* @__PURE__ */(0,N.jsxs)(h,{variant:"ghost",size:"sm","aria-label":o.resetLayout,className:l?i:d,"data-jd":"reset-layout",onClick:r,children:[/* @__PURE__ */ /* @__PURE__ */(0,N.jsx)(C,{className:"jd:h-3.5 jd:w-3.5"}),l&&o.resetLayout]})})]})}export{M as AddItem,L as DeckEditTools,D as ItemTools};
//# sourceMappingURL=edittools.js.map