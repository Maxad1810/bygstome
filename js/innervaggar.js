/* ---------- Innerväggar: ritas i en planvy, räknas i kalkylen, syns i 3D och i planritningen ---------- */
let IW=[],IWP=null,IWH=null,IWK=0;
const IWF=.145;   // ytterväggens tjocklek i planen
function iwLen(k){return IW.filter(w=>(w.k||0)===k).reduce((a,w)=>a+Math.hypot(w.x2-w.x1,w.z2-w.z1),0);}
function iwDoors(k){return IW.filter(w=>(w.k||0)===k&&w.d).length;}
function iwFloorCount(){return Math.max(1,mcount(),...WINGS.map((w,i)=>wcount(i)));}
function iwSnap(x,z){
  let X=Math.round(x*10)/10,Z=Math.round(z*10)/10;
  if($('hs').value==='r'){
    const a=g0('W1'),b=g0('W2');
    if(Math.abs(x)<.28)X=IWF;if(Math.abs(x-a)<.28)X=a-IWF;
    if(Math.abs(z)<.28)Z=IWF;if(Math.abs(z-b)<.28)Z=b-IWF;
    X=Math.min(Math.max(X,IWF),a-IWF);Z=Math.min(Math.max(Z,IWF),b-IWF);
  }
  return [X,Z];
}
function iwOrtho(p,q){if(!p)return q;if(Math.abs(q[0]-p[0])<.2)return [p[0],q[1]];if(Math.abs(q[1]-p[1])<.2)return [q[0],p[1]];return q;}
function iwPlanSvg(){
  const svg=$('iwPlan');if(!svg)return;
  const k=IWK,d=pdfPlanData(k,false),xs=[],zs=[];
  d.walls.forEach(pl=>pl.forEach(p=>{xs.push(p[0]);zs.push(p[1]);}));
  if(!xs.length){svg.innerHTML='';return;}
  const m=.6,minx=Math.min(...xs)-m,maxx=Math.max(...xs)+m,minz=Math.min(...zs)-m,maxz=Math.max(...zs)+m;
  svg.setAttribute('viewBox',`${minx} ${-maxz} ${maxx-minx} ${maxz-minz}`);
  svg.dataset.b=[minx,maxz].join(',');
  const poly=pl=>pl.map(p=>p[0]+','+(-p[1])).join(' ');
  let h='';
  // rutnät varje meter
  for(let x=Math.ceil(minx);x<maxx;x++)h+=`<line x1="${x}" y1="${-maxz}" x2="${x}" y2="${-minz}" stroke="#8886" stroke-width=".012"/>`;
  for(let z=Math.ceil(minz);z<maxz;z++)h+=`<line x1="${minx}" y1="${-z}" x2="${maxx}" y2="${-z}" stroke="#8886" stroke-width=".012"/>`;
  d.walls.forEach(pl=>{h+=`<polygon points="${poly(pl)}" fill="#444"/>`;});
  d.opens.forEach(o=>{h+=`<polygon points="${poly(o.poly)}" fill="${o.t==='f'?'#9cd3ee':'#fff'}" stroke="#333" stroke-width=".02"/>`;});
  IW.filter(w=>(w.k||0)===k).forEach((w,i)=>{
    const L=Math.hypot(w.x2-w.x1,w.z2-w.z1)||1,ux=(w.x2-w.x1)/L,uz=(w.z2-w.z1)/L;
    h+=`<line x1="${w.x1}" y1="${-w.z1}" x2="${w.x2}" y2="${-w.z2}" stroke="#b8741a" stroke-width=".11" stroke-linecap="butt"/>`;
    if(w.d){const c=Math.min(Math.max(w.dc==null?L/2:w.dc,.45),L-.45),a=[w.x1+ux*(c-.4),w.z1+uz*(c-.4)],b=[w.x1+ux*(c+.4),w.z1+uz*(c+.4)];
      h+=`<line x1="${a[0]}" y1="${-a[1]}" x2="${b[0]}" y2="${-b[1]}" stroke="#fff" stroke-width=".13"/>`;
      h+=`<line x1="${a[0]}" y1="${-a[1]}" x2="${a[0]-uz*.8}" y2="${-(a[1]+ux*.8)}" stroke="#333" stroke-width=".03"/>`;}
  });
  const pv=IWP&&IWH?[IWP,iwOrtho(IWP,IWH)]:null;
  if(pv)h+=`<line x1="${pv[0][0]}" y1="${-pv[0][1]}" x2="${pv[1][0]}" y2="${-pv[1][1]}" stroke="#2a7fd4" stroke-width=".09" stroke-dasharray=".2 .1"/><text x="${(pv[0][0]+pv[1][0])/2}" y="${-(pv[0][1]+pv[1][1])/2-.15}" font-size=".38" text-anchor="middle" fill="#2a7fd4">${nf(Math.hypot(pv[1][0]-pv[0][0],pv[1][1]-pv[0][1]),2)} m</text>`;
  if(IWP)h+=`<circle cx="${IWP[0]}" cy="${-IWP[1]}" r=".12" fill="#2a7fd4"/>`;
  svg.innerHTML=h;
}
function drawIW(){
  const nF=iwFloorCount();if(IWK>=nF)IWK=0;
  const sel=$('iwK');if(sel){sel.innerHTML=Array.from({length:nF},(_,i)=>`<option value="${i}"${i===IWK?' selected':''}>Våning ${i+1}</option>`).join('');}
  const opt=(arr,cur)=>arr.map(([v,t])=>`<option value="${v}"${String(cur)===String(v)?' selected':''}>${t}</option>`).join('');
  $('iwList').innerHTML=IW.map((w,i)=>({w,i})).filter(x=>(x.w.k||0)===IWK).map(({w,i})=>{
    const L=Math.hypot(w.x2-w.x1,w.z2-w.z1);
    return `<div class="op iw"><label>Från x m<input type="number" step="0.1" value="${nf(w.x1,2).replace(',','.')}" data-w="${i}" data-k="x1"></label>
    <label>Från z m<input type="number" step="0.1" value="${nf(w.z1,2).replace(',','.')}" data-w="${i}" data-k="z1"></label>
    <label>Till x m<input type="number" step="0.1" value="${nf(w.x2,2).replace(',','.')}" data-w="${i}" data-k="x2"></label>
    <label>Till z m<input type="number" step="0.1" value="${nf(w.z2,2).replace(',','.')}" data-w="${i}" data-k="z2"></label>
    <label>Dörr<select data-w="${i}" data-k="d">${opt([[0,'Ingen'],[1,'Ja']],w.d?1:0)}</select></label>
    <label>Dörrläge m<input type="number" step="0.1" min="0.45" value="${nf(w.dc==null?L/2:w.dc,2).replace(',','.')}" data-w="${i}" data-k="dc"></label>
    <span class="note" style="align-self:end">${nf(L,2)} m</span>
    <button class="x" type="button" data-wdel="${i}" aria-label="Ta bort innervägg">✕</button></div>`;}).join('');
  $('iwSum').textContent=IW.length?('Ritade innerväggar: '+nf(IW.reduce((a,w)=>a+Math.hypot(w.x2-w.x1,w.z2-w.z1),0),1)+' m totalt – de används i kalkylen i stället för fältet "Innerväggar, total längd".'):'Inga ritade innerväggar. Då används längden du skrev i fältet "Innerväggar, total längd" under Väggar.';
  iwPlanSvg();
}
(function(){
  const svg=$('iwPlan');
  const pt=e=>{const m=svg.getScreenCTM();if(!m)return null;const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(m.inverse());return iwSnap(q.x,-q.y);};
  svg.addEventListener('pointerenter',()=>{try{iwPlanSvg();}catch(e){}});
  svg.addEventListener('pointermove',e=>{if(!IWP)return;const p=pt(e);if(p){IWH=p;iwPlanSvg();}});
  svg.addEventListener('click',e=>{
    const p=pt(e);if(!p)return;
    if(!IWP){IWP=p;IWH=p;iwPlanSvg();$('iwHint').textContent='Klicka där väggen ska sluta (Esc avbryter).';return;}
    const q=iwOrtho(IWP,p),L=Math.hypot(q[0]-IWP[0],q[1]-IWP[1]);
    if(L>=.3){IW.push({k:IWK,x1:IWP[0],z1:IWP[1],x2:q[0],z2:q[1],d:0,dc:+(L/2).toFixed(2)});}
    IWP=null;IWH=null;$('iwHint').textContent='Klicka i planen där väggen ska börja.';drawIW();calc();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&IWP){IWP=null;IWH=null;$('iwHint').textContent='Klicka i planen där väggen ska börja.';iwPlanSvg();}});
  $('iwK').onchange=e=>{IWK=+e.target.value||0;IWP=null;drawIW();};
  $('iwList').addEventListener('input',ev=>{
    const t=ev.target,i=t.dataset.w;if(i==null)return;const k=t.dataset.k,w=IW[i];
    if(k==='d')w.d=t.value==='1'?1:0;else w[k]=parseFloat(t.value)||0;
    if(k!=='dc'&&k!=='d'){const L=Math.hypot(w.x2-w.x1,w.z2-w.z1);if(w.dc>L-.45)w.dc=Math.max(.45,+(L/2).toFixed(2));}
    iwPlanSvg();calc();
  });
  $('iwList').addEventListener('change',ev=>{if(ev.target.dataset.w!=null)drawIW();});
  $('iwList').addEventListener('click',ev=>{const d=ev.target.closest('[data-wdel]');if(d){IW.splice(+d.dataset.wdel,1);drawIW();calc();}});
  $('iwUndo').onclick=()=>{for(let i=IW.length-1;i>=0;i--)if((IW[i].k||0)===IWK){IW.splice(i,1);break;}drawIW();calc();};
  $('iwClear').onclick=()=>{IW=IW.filter(w=>(w.k||0)!==IWK);drawIW();calc();};
  $('iwCopy').onclick=()=>{const n=iwFloorCount();if(n<2)return;const src=IW.filter(w=>(w.k||0)===IWK),to=(IWK+1)%n;IW=IW.filter(w=>(w.k||0)!==to).concat(src.map(w=>({...w,k:to})));IWK=to;drawIW();calc();};
})();
const _calcIW=calc;
calc=function(){_calcIW.apply(this,arguments);try{drawIW();}catch(e){}};
try{drawIW();}catch(e){}
window.addEventListener('load',()=>{try{drawIW();}catch(e){}});
document.addEventListener('input',e=>{if(e.target.closest&&!e.target.closest('#iwList'))setTimeout(()=>{try{drawIW();}catch(x){}},0);});
