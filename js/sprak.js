/* Språkval: svenska (original), engelska och tyska.
   Texten i sidan är skriven på svenska. Den här filen byter ut texten i webbläsaren
   (hela meningar först, sedan ord) och översätter även texten i PDF-filerna. */
(function(){
'use strict';
const LANGS=[['sv','Svenska'],['en','English'],['de','Deutsch']];
let LANG='sv';
const IDX={sv:0,en:1,de:2};
const exact=new Map(),gloss=[];
let ready=false;
const norm=s=>s.replace(/\s+/g,' ').trim();
function load(){
  if(ready)return;ready=true;
  (window.SK_EXACT||'').split('\n').forEach(l=>{const p=l.split('|');if(p.length>=3){const k=norm(p[0]);if(k)exact.set(k,[k,p[1],p.slice(2).join('|')]);}});
  const seen=new Map();
  (window.SK_GLOSS||'').split('\n').forEach(l=>{const p=l.split('|');if(p.length>=3&&p[0].trim()){const k=p[0].trim();seen.set(k.toLowerCase(),[k,p[1],p.slice(2).join('|')]);}});
  seen.forEach(v=>gloss.push(v));
  gloss.sort((a,b)=>b[0].length-a[0].length);
}
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
let GR=null;
function buildRe(){
  if(GR)return;
  const L='A-Za-zÅÄÖåäöÉéÜüß0-9';
  // bara ord/fraser som börjar och slutar vid ordgräns
  GR={re:new RegExp('(^|[^'+L+'])('+gloss.map(g=>esc(g[0])).join('|')+')(?![' +L+'])','gi'),map:new Map(gloss.map(g=>[g[0].toLowerCase(),g]))};
}
const cache={en:new Map(),de:new Map()};
function cap(from,to){return from&&from[0]!==from[0].toLowerCase()&&to?to[0].toUpperCase()+to.slice(1):to;}
function tr(s){
  if(LANG==='sv'||typeof s!=='string'||!s)return s;
  const m=/^(\s*)([\s\S]*?)(\s*)$/.exec(s);if(!m||!m[2])return s;
  const key=m[2],c=cache[LANG];
  let out=c.get(key);
  if(out===undefined){
    load();const i=IDX[LANG],n=norm(key),ex=exact.get(n);
    if(ex)out=ex[i];
    else if(!/[A-Za-zÅÄÖåäö]{2}/.test(key))out=key;
    else{
      buildRe();
      out=key.replace(GR.re,(all,pre,w)=>{const g=GR.map.get(w.toLowerCase());return g?pre+cap(w,g[i]):all;});
      GR.re.lastIndex=0;
    }
    if(c.size>6000)c.clear();
    c.set(key,out);
  }
  return m[1]+out+m[3];
}
window.skTr=tr;
/* ===== DOM ===== */
const textSrc=new WeakMap();       // textnod -> {sv,out}
const SKIP={SCRIPT:1,STYLE:1,TEXTAREA:1,CANVAS:1,NOSCRIPT:1,SVG:0};
const ATTR=['placeholder','title','aria-label','alt'];
function skip(n){for(let p=n.parentNode;p;p=p.parentNode){if(p.nodeType===1&&(SKIP[p.nodeName]||p.hasAttribute&&p.hasAttribute('data-notr')))return true;}return false;}
function doText(n){
  if(skip(n))return;
  const cur=n.nodeValue,rec=textSrc.get(n);
  let sv=cur;if(rec&&cur===rec.out)sv=rec.sv;
  const out=tr(sv);
  if(out!==cur){textSrc.set(n,{sv,out});n.nodeValue=out;}
  else if(LANG==='sv'&&rec)textSrc.delete(n);
  else if(!rec&&out===sv&&LANG!=='sv')textSrc.set(n,{sv,out});
}
function doAttrs(el){
  if(!el.getAttribute||el.hasAttribute('data-notr'))return;
  ATTR.forEach(a=>{
    if(!el.hasAttribute(a))return;
    const cur=el.getAttribute(a),sk='__sv_'+a,rec=el[sk];
    let sv=cur;if(rec&&cur===rec.out)sv=rec.sv;
    const out=tr(sv);
    if(out!==cur){el[sk]={sv,out};el.setAttribute(a,out);}
    else if(LANG==='sv'&&rec)el[sk]=null;
  });
}
function walk(root){
  if(!root)return;
  if(root.nodeType===3){doText(root);return;}
  if(root.nodeType!==1)return;
  if(SKIP[root.nodeName]||root.hasAttribute('data-notr'))return;
  doAttrs(root);
  for(let c=root.firstChild;c;c=c.nextSibling)walk(c);
}
let obs=null,pend=new Set(),raf=0;
function flush(){
  raf=0;
  if(obs)obs.disconnect();
  try{pend.forEach(n=>{if(n.isConnected!==false)walk(n);});}finally{pend.clear();attach();}
}
function attach(){
  if(!obs)return;
  obs.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTR});
}
function setupObserver(){
  obs=new MutationObserver(recs=>{
    if(LANG==='sv'){return;}
    recs.forEach(r=>{
      if(r.type==='childList')r.addedNodes.forEach(n=>pend.add(n));
      else if(r.type==='characterData')pend.add(r.target);
      else pend.add(r.target);
    });
    if(!raf)raf=requestAnimationFrame(flush);
  });
  attach();
}
function apply(){
  if(obs)obs.disconnect();
  try{walk(document.body);}finally{attach();}
  document.documentElement.lang=LANG;
  try{
    const t=document.querySelector('title');
    if(t){if(!t.__sv)t.__sv=t.textContent;t.textContent=tr(t.__sv);}
  }catch(_){}
}
/* ===== PDF ===== */
function patchPdf(){
  const J=window.jspdf&&window.jspdf.jsPDF;
  if(!J||J.__skPatched)return;
  const tx=t=>LANG==='sv'?t:(typeof t==='string'?tr(t):(Array.isArray(t)?t.map(x=>typeof x==='string'?tr(x):x):t));
  function W(...a){
    const d=new J(...a);
    ['text','splitTextToSize','getTextWidth','getStringUnitWidth'].forEach(k=>{
      const f=d[k];
      if(typeof f!=='function')return;
      d[k]=function(t,...r){return f.call(this,tx(t),...r);};
    });
    return d;
  }
  W.prototype=J.prototype;
  Object.keys(J).forEach(k=>{try{W[k]=J[k];}catch(_){}});
  W.__skPatched=true;W.API=J.API;
  window.jspdf.jsPDF=W;
}
/* ===== Val ===== */
function setLang(l,save){
  if(!IDX.hasOwnProperty(l))l='sv';
  LANG=l;
  if(save!==false){try{localStorage.setItem('sk_lang',l);}catch(_){}}
  const sel=document.getElementById('lang');if(sel)sel.value=l;
  apply();patchPdf();
  try{window.dispatchEvent(new CustomEvent('sk-lang',{detail:l}));}catch(_){}
}
window.skSetLang=setLang;
window.skLang=()=>LANG;
function init(){
  let l='sv',saved=null;
  try{saved=localStorage.getItem('sk_lang');}catch(_){}
  if(saved&&IDX.hasOwnProperty(saved))l=saved;
  else{const n=(navigator.language||'sv').slice(0,2).toLowerCase();if(IDX.hasOwnProperty(n))l=n;}
  const sel=document.getElementById('lang');
  if(sel){
    sel.innerHTML=LANGS.map(x=>'<option value="'+x[0]+'">'+x[1]+'</option>').join('');
    sel.addEventListener('change',()=>setLang(sel.value));
  }
  setupObserver();
  setLang(l,false);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));
else setTimeout(init,0);
// jsPDF kan laddas lite senare
let tries=0;const iv=setInterval(()=>{patchPdf();if((window.jspdf&&window.jspdf.jsPDF&&window.jspdf.jsPDF.__skPatched)||++tries>40)clearInterval(iv);},500);
})();
