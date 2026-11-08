/* ---------- El invändigt ---------- */
let ELS=[{t:'c',k:0,wall:0,c:1,h:1.5},{t:'u',k:0,wall:0,c:3,h:.3},{t:'u',k:0,wall:1,c:2,h:.3},{t:'u',k:0,wall:2,c:3,h:.3},{t:'u',k:0,wall:3,c:2,h:.3},{t:'b',k:0,wall:0,c:2,h:1.1}];
const ELN={u:'Eluttag',b:'Strömbrytare',l:'Lamputtag (vägg)',t:'Taklampa (i taket)',c:'Elcentral (säkringsskåp)'};
function drawEls(){
  const opt=(arr,cur)=>arr.map(([v,t])=>`<option value="${v}"${String(cur)===String(v)?' selected':''}>${t}</option>`).join('');
  $('elList').innerHTML=ELS.map((e,i)=>`<div class="op">
  <label>Typ<select data-e="${i}" data-k="t">${opt(Object.entries(ELN),e.t)}</select></label>
  <label>Våning<select data-e="${i}" data-k="k">${opt([[0,1],[1,2],[2,3]],e.k||0)}</select></label>
  ${e.t==='t'?'<label>Plats<input type="text" value="Tak" disabled></label>':`<label>Vägg<select data-e="${i}" data-k="wall">${opt([[0,1],[1,2],[2,3],[3,4]],e.wall||0)}</select></label>`}
  <label>${e.t==='t'?'X m':'Läge m'}<input type="number" step="0.1" min="0" value="${e.c}" data-e="${i}" data-k="c"></label>
  <label>${e.t==='t'?'Z m':'Höjd m'}<input type="number" step="0.1" min="0" value="${e.h}" data-e="${i}" data-k="h"></label>
  <button class="x" type="button" data-edel="${i}" aria-label="Ta bort">✕</button></div>`).join('');
}
$('elList').addEventListener('input',ev=>{const t=ev.target,i=t.dataset.e;if(i==null)return;const k=t.dataset.k;ELS[i][k]=k==='t'?t.value:(parseFloat(t.value)||0);calc();});
$('elList').addEventListener('click',ev=>{const d=ev.target.closest('[data-edel]');if(d){ELS.splice(+d.dataset.edel,1);drawEls();calc();}});
[['addU','u',.3],['addB','b',1.1],['addL','l',2.4],['addT','t',2],['addC','c',1.5]].forEach(([id,t,h])=>{$(id).onclick=()=>{ELS.push(t==='t'?{t,k:0,wall:0,c:2,h:2}:{t,k:0,wall:0,c:1,h});drawEls();calc();};});
function elRows(k){
  const L=ELS.filter(e=>(e.k||0)===k);if(!L.length)return [];
  const wl=[g0('W1'),g0('W2'),g0('W3'),g0('W4')],per=wl.reduce((a,b)=>a+b,0);
  const pos=e=>{const i=Math.min(3,Math.max(0,e.wall||0));return wl.slice(0,i).reduce((a,b)=>a+b,0)+Math.min(e.c,wl[i]);};
  const cen=L.find(e=>e.t==='c')||{wall:0,c:1,h:1.5},p0=pos(cen);
  let c15=0,c25=0;
  const y1=g0('elY')||.25;
  L.forEach(e=>{if(e.t==='c'||e.t==='t')return;const d0=Math.abs(pos(e)-p0),dist=Math.min(d0,per-d0)+Math.abs(e.h-y1)+Math.abs(cen.h-y1)+.5;if(e.t==='u')c25+=dist;else c15+=dist;});
  const ci2=Math.min(3,Math.max(0,cen.wall||0)),cxy=[[cen.c,0],[wl[0],cen.c],[wl[0]-cen.c,wl[1]],[0,wl[1]-cen.c]][ci2];
  L.forEach(e=>{if(e.t!=='t')return;c15+=Math.abs(e.c-cxy[0])+Math.abs(e.h-cxy[1])+Math.max(0,g0('H2')-.09-cen.h)+.5;});
  const n=t=>L.filter(e=>e.t===t).length,nu=n('u'),nb=n('b'),nl=n('l'),nt=n('t'),nc=n('c')||(k===0?1:0);
  const k15=c15*1.15,k25=c25*1.15,rows=[];
  if(nu)rows.push(['Eluttag (jordat, infällt)',nf(nu)+' st','']);
  if(nb)rows.push(['Strömbrytare',nf(nb)+' st','']);
  if(nl)rows.push(['Lamputtag (vägg)',nf(nl)+' st','']);
  if(nt)rows.push(['Taklamputtag (i tak)',nf(nt)+' st','kabel dras i taket till väggen och ner till centralen']);
  if(nc)rows.push(['Elcentral (säkringsskåp)',nf(nc)+' st','alla kablar går hit via väggarna']);
  if(nu+nb+nl+nt)rows.push(['Apparatdosa',nf(nu+nb+nl+nt)+' st','en per uttag, brytare och lamputtag']);
  if(k25>0)rows.push(['Kabel 3G2,5 (uttag)',nf(k25,0)+' m','ca '+nf(c25,0)+' m + 15 % spill']);
  if(k15>0)rows.push(['Kabel 3G1,5 (belysning)',nf(k15,0)+' m','ca '+nf(c15,0)+' m + 15 % spill']);
  if(k15+k25>0){rows.push(['Installationsrör 20 mm',nf((k15+k25)*.6,0)+' m','upp och ner i väggarna']);rows.push(['Kabelklammor',nf(Math.ceil((k15+k25)/.3))+' st','c/c 300 mm']);}
  if(k>0&&!L.some(e=>e.t==='c'))rows.push(['Matarkabel 5G10 till undercentral',nf(k*(g0('H2')+.5)+per/4,0)+' m','från huvudcentralen på våning 1']);
  return rows;
}
