const $=id=>document.getElementById(id);
const nf=(v,d=0)=>v.toLocaleString('sv-SE',{minimumFractionDigits:d,maximumFractionDigits:d});
let ops=[{t:'f',w:1.2,h:1.2,n:6},{t:'d',w:0.9,h:2.1,n:2}];
const STD=[2.4,2.7,3.0,3.3,3.6,4.2,4.8,5.4];
let lastText='';
function drawOps(){
  $('ops').innerHTML=ops.map((o,i)=>`<div class="op">
  <label>Typ<select data-i="${i}" data-k="t"><option value="f"${o.t==='f'?' selected':''}>Fönster</option><option value="d"${o.t==='d'?' selected':''}>Dörr</option><option value="p"${o.t==='p'?' selected':''}>Garageport</option></select></label>
  <label>Bredd m<input type="number" step="0.1" min="0.3" value="${o.w}" data-i="${i}" data-k="w"></label>
  <label>Höjd m<input type="number" step="0.1" min="0.3" value="${o.h}" data-i="${i}" data-k="h"></label>
  <label>Antal<input type="number" step="1" min="1" value="${o.n}" data-i="${i}" data-k="n"></label>
  <label>Våning<select data-i="${i}" data-k="v">${['Alla',1,2,3].map((n,j)=>`<option value="${j}"${(o.v||0)===j?' selected':''}>${n}</option>`).join('')}</select></label>
  <button class="x" type="button" data-del="${i}" aria-label="Ta bort öppning">✕</button></div>`).join('');
}
$('ops').addEventListener('input',e=>{const t=e.target,i=t.dataset.i;if(i==null)return;ops[i][t.dataset.k]=t.dataset.k==='t'?t.value:(parseFloat(t.value)||0);if(t.dataset.k==='t'){const d0={f:[1.2,1.2],d:[.9,2.1],p:[2.5,2.2]}[t.value];if(d0){ops[i].w=d0[0];ops[i].h=d0[1];}drawOps();}calc();});
$('ops').addEventListener('click',e=>{const d=e.target.closest('[data-del]');if(d){ops.splice(+d.dataset.del,1);drawOps();calc();}});
$('add').onclick=()=>{ops.push({t:'f',w:1,h:1.2,n:1});drawOps();calc();};
function stdLen(m){for(const s of STD)if(m<=s+1e-9)return s;return Math.ceil(m*10)/10;}
const g=id=>parseFloat($(id).value)||0;const g0=g;
function syncBuild(){
  const hus=$('bHus').checked,ga=$('gaOn').checked;
  if(!hus&&$('dk').checked)$('dk').checked=false;
  if(!hus&&$('bk').checked)$('bk').checked=false;
  if(!hus&&$('cp').checked)$('cp').checked=false;$('cp').disabled=!hus;
  $('dk').disabled=!hus;$('bk').disabled=!hus;
  if(hus&&$('bk').checked){
    const kv=Math.max(1,Math.min(parseInt($('bkV').value)||2,mcount()));
    let bd=ops.find(o=>o.bd);
    if(!bd){bd={t:'d',w:.9,h:2.1,n:1,v:kv,bd:true,id:++uid};ops.push(bd);drawOps();}
    bd.v=kv;
  }else if(ops.some(o=>o.bd)){ops=ops.filter(o=>!o.bd);drawOps();}
  document.querySelectorAll('fieldset[data-need]').forEach(f=>{
    const n=f.dataset.need;
    const show=n==='hus'?hus:(n==='any'?(hus||ga):(n==='dk'?(hus&&$('dk').checked):(n==='bk'?(hus&&$('bk').checked):(n==='cp'?(hus&&$('cp').checked):(n==='ga'?ga:true)))));
    f.style.display=show?'':'none';
    if(n==='ga'&&$('gcBox'))$('gcBox').style.display=($('gcOn').checked&&$('gaT').value!=='c')?'':'none';
  });
}
function sync(){
  syncBuild();
  const rt=$('rt'),rd=$('rd');
  if(rd.dataset.t!==rt.value){
    const gl=rt.value==='g',o=gl?['90x225','90x315','115x315','115x405']:['45x95','45x120','45x145','45x195'],def=gl?'90x315':'45x145';
    rd.innerHTML=o.map(v=>`<option${v===def?' selected':''}>${v}</option>`).join('');rd.dataset.t=rt.value;
  }
  const shR=$('hs').value==='r';$('GL').disabled=shR;$('GB').disabled=shR;
  $('vw1').disabled=shR;$('vw2').disabled=!['x','u'].includes($('hs').value);
  const hl=g('L'),hw=g('W'),h=g('H');
  [['sF',{FL:hl,FW:hw}],['sWl',{W1:hl,W2:hw,W3:hl,W4:hw,H2:h}],['sR',{RL:hl,RW:hw}]].forEach(([c,m])=>{const on=$(c).checked;for(const k in m){$(k).disabled=on;if(on)$(k).value=m[k];}});
}
function spread(items,len,fixed){
  const gap=.15,lo=w=>w/2+.2,hi=w=>len-w/2-.2,placed=[];
  const ok=(c,w)=>c>=lo(w)-1e-6&&c<=hi(w)+1e-6&&placed.every(p=>Math.abs(c-p.c)>=(w+p.w)/2+gap-1e-6);
  items.slice().sort((a,b)=>(a.ref===fixed?-1:b.ref===fixed?1:a.c-b.c)).forEach(it=>{
    let best=Math.min(Math.max(it.c,lo(it.w)),hi(it.w));
    if(!ok(best,it.w)){
      const cand=[];placed.forEach(p=>{cand.push(p.c+(p.w+it.w)/2+gap,p.c-(p.w+it.w)/2-gap);});
      let bd=1e9,bc=null;cand.forEach(c=>{if(ok(c,it.w)&&Math.abs(c-it.c)<bd){bd=Math.abs(c-it.c);bc=c;}});
      if(bc!=null)best=bc;
    }
    it.c=best;placed.push(it);
  });
  return items;
}
let WINGS=[],WSH='r';
function wingSetup(){
  const hs=$('hs').value,L0=g('W1'),B=g('GB');
  if(hs!==WSH){
    WSH=hs;const c=Math.max(0,(L0-B)/2);
    WINGS=hs==='l'?[{s:'b',x0:0}]:hs==='t'?[{s:'b',x0:c}]:hs==='x'?[{s:'b',x0:c},{s:'f',x0:c}]:hs==='u'?[{s:'b',x0:0},{s:'b',x0:Math.max(0,L0-B)}]:[];
  }
  WINGS.forEach(w=>{w.x0=Math.min(Math.max(w.x0,0),Math.max(0,L0-B));});
}
function wingPlan(L0,B,list){
  list=list||WINGS;
  const plan=[[{s:0,e:L0}],[{s:0,e:g0('W2')}],[{s:0,e:g0('W3')}],[{s:0,e:g0('W4')}]];
  const cut=(wi,a,b)=>{plan[wi]=plan[wi].flatMap(q=>{
    if(a>=q.e||b<=q.s)return [q];
    const r=[];if(a>q.s)r.push({s:q.s,e:a});if(b<q.e)r.push({s:b,e:q.e});return r;});};
  list.forEach(w=>{if(w.s==='f')cut(0,w.x0,w.x0+B);else cut(2,L0-w.x0-B,L0-w.x0);});
  return plan;
}
let GOPS_OLD=[];
let GROWS=[{id:1,t:'p',w:2.5,h:2.2,n:1},{id:2,t:'d',w:.9,h:2.1,n:1},{id:3,t:'f',w:1,h:1,n:1}],GUID=3,GOPS=[];
function garageOps(L,B){
  GROWS.forEach(r=>{if(!r.id)r.id=++GUID;});
  GOPS=GOPS.filter(o=>GROWS.some(r=>r.id===o.gid));
  GROWS.forEach(r=>{
    const n=Math.min(8,Math.max(0,Math.round(r.n||0))),mine=GOPS.filter(o=>o.gid===r.id);
    mine.slice(n).forEach(o=>GOPS.splice(GOPS.indexOf(o),1));
    for(let i=mine.length;i<n;i++){
      const wall=r.t==='p'?1:(r.t==='d'?0:2),len=wall%2?B:L;
      GOPS.push({gid:r.id,wall,c:len*(i+1)/(n+1)});
    }
  });
  GOPS.forEach(o=>{
    const r=GROWS.find(x=>x.id===o.gid),len=o.wall%2?B:L;
    o.t=r.t;o.w=Math.max(.4,Math.min(r.w||1,len-.4));o.h=Math.max(.4,r.h||1);o.garage=true;
  });
  GOPS.sort((a,b)=>({p:0,d:1,f:2}[a.t]-{p:0,d:1,f:2}[b.t])||(a.gid-b.gid));
  return GOPS;
}
function garageInfo(){
  if(!$('gaOn')||!$('gaOn').checked)return null;
  const L=Math.max(3,g0('gaL')),B=Math.max(2.5,g0('gaB'));
  const th=Math.PI/2+g0('gaR')*Math.PI/180;
  const rot=(x,z)=>[x*Math.cos(th)+z*Math.sin(th),-x*Math.sin(th)+z*Math.cos(th)];
  const cs=[[0,0],[L,0],[L,B],[0,B]].map(p=>rot(p[0],p[1]));
  const minx=Math.min(...cs.map(c=>c[0])),minz=Math.min(...cs.map(c=>c[1]));
  const bw=Math.max(...cs.map(c=>c[0]))-minx,bh=Math.max(...cs.map(c=>c[1]))-minz;
  const ox=g0('gaX')-minx,oz=g0('gaZ')-minz,gops=garageOps(L,B);
  const tf=(x,z)=>{const r=rot(x,z);return [ox+r[0],oz+r[1]];};
  const type=($('gaT')&&$('gaT').value)||'g';
  return {L,B,H:g0('gaH'),th,ox,oz,bw,bh,gops:type==='c'?[]:gops,tf,ins:$('gaI').checked,type,car:!!($('gaCar')&&$('gaCar').checked)};
}
function carportRows(gi){
  const L=gi.L,B=gi.B,H=gi.H,A=L*B,sp=1+g0('S')/100,pc=Math.ceil,tn=Math.tan(Math.min(g0('P'),15)*Math.PI/180),rise=tn*B;
  const nP=2*(pc(L/3)+1),slope=Math.hypot(B+.6,rise),roofA=(L+.6)*slope,rafN=pc(L/.9)+1;
  return [[GN()+' \u2013 Carport',[
    ['Stolpar 95x95 (carport)',nf(nP)+' st','l\u00e4ngd '+nf(H+rise+.3,1)+' m'],
    ['Plintar (carport)',nf(nP)+' st','under varje stolpe'],
    ['B\u00e4rbalk 2\u00d745x195 (carport)',nf(pc(2*L*sp/4.8)*2)+' st','\u00e0 4,8 m \u00b7 '+nf(2*L,1)+' m, dubbla'],
    ['Takbj\u00e4lkar 45x145 (carport)',nf(pc(rafN*sp))+' st','l\u00e4ngd '+nf(B+.6,1)+' m \u00b7 c/c 900 mm'],
    ['Takstolsbeslag (carport)',nf(rafN*2)+' st','2 per bj\u00e4lke'],
    ['Underlagstak/r\u00e5spont (carport)',nf(roofA*sp,1)+' m\u00b2','med spill'],
    ['Underlagspapp (carport)',nf(pc(roofA*1.1*sp/15))+' rullar','\u00e0 15 m\u00b2'],
    ['Takpl\u00e5t (carport)',nf(roofA*1.05,1)+' m\u00b2','t\u00e4ckt yta + 5 %'],
    ['Takfotspl\u00e5t (carport)',nf(pc(L*sp/2))+' st','\u00e0 2 m'],
    ['Vindskivepl\u00e5t (carport)',nf(pc(2*slope*sp/2))+' st','\u00e0 2 m'],
    ['H\u00e4ngr\u00e4nnor (carport)',nf(pc(L*sp/3))+' st','\u00e0 3 m'],
    ['Stupr\u00f6r (carport)','2 st','\u00e0 3 m'],
    ['Dr\u00e4nerande makadam 0-32 mm (carport)',nf(A*.15*1.15,1)+' m\u00b3','150 mm under taket']
  ]]];
}
function capInfos(){
  const out=[];
  const mk=(host,pre,wl,label)=>{
    const w=Math.min(3,Math.max(0,parseInt($(pre+'S').value)||0)),wlen=wl[w]||0;if(wlen<1)return;
    const L=Math.max(2,Math.min(g0(pre+'L'),wlen)),x0=Math.min(Math.max(g0(pre+'X'),0),Math.max(0,wlen-L));
    out.push({host,w,L,x0,D:Math.max(2,g0(pre+'D')),H:Math.max(2,g0(pre+'H')),lvl:Math.max(0,Math.min(1.5,g0(pre+'Y'))),pre,car:$(pre+'Car').checked,label});
  };
  if($('bHus').checked&&$('cp')&&$('cp').checked)mk('h','cp',[g0('W1'),g0('W2'),g0('W3'),g0('W4')],'Carport vid huset');
  const gi=garageInfo();
  if(gi&&gi.type!=='c'&&$('gcOn')&&$('gcOn').checked)mk('g','gc',[gi.L,gi.B,gi.L,gi.B],'Carport vid garaget');
  return out;
}
function capRows(c){
  const L=c.L,D=c.D,H=c.H,A=L*D,sp=1+g0('S')/100,pc=Math.ceil,tn=Math.tan(8*Math.PI/180),rise=tn*D;
  const nP=pc(L/3)+1,slope=Math.hypot(D+.4,rise),roofA=(L+.4)*slope,rafN=pc(L/.9)+1;
  return [c.label,[
    ['Stolpar 95x95 (carport)',nf(nP)+' st','l\u00e4ngd '+nf(H+.3+c.lvl,1)+' m \u00b7 l\u00e4ngs ytterkanten'],
    ['Plintar (carport)',nf(nP)+' st','under varje stolpe'],
    ['B\u00e4rbalk 2\u00d745x195 (carport)',nf(pc(2*L*sp/4.8)*2)+' st','\u00e0 4,8 m \u00b7 '+nf(2*L,1)+' m, dubbla'],
    ['Ledger 45x195 mot v\u00e4gg (carport)',nf(pc(L*sp/4.8))+' st','\u00e0 4,8 m \u00b7 '+nf(L,1)+' m'],
    ['Ankarbult (carport)',nf(pc(L/.6)+1)+' st','ledger mot v\u00e4gg c/c 600'],
    ['Takbj\u00e4lkar 45x145 (carport)',nf(pc(rafN*sp))+' st','l\u00e4ngd '+nf(D+.4,1)+' m \u00b7 c/c 900 mm'],
    ['Takstolsbeslag (carport)',nf(rafN*2)+' st','2 per bj\u00e4lke'],
    ['Underlagstak/r\u00e5spont (carport)',nf(roofA*sp,1)+' m\u00b2','med spill'],
    ['Underlagspapp (carport)',nf(pc(roofA*1.1*sp/15))+' rullar','\u00e0 15 m\u00b2'],
    ['Takpl\u00e5t (carport)',nf(roofA*1.05,1)+' m\u00b2','t\u00e4ckt yta + 5 %'],
    ['Takfotspl\u00e5t (carport)',nf(pc(L*sp/2))+' st','\u00e0 2 m'],
    ['Vindskivepl\u00e5t (carport)',nf(pc(2*slope*sp/2))+' st','\u00e0 2 m'],
    ['H\u00e4ngr\u00e4nnor (carport)',nf(pc(L*sp/3))+' st','\u00e0 3 m'],
    ['Stupr\u00f6r (carport)','1 st','\u00e0 3 m'],
    ['Dr\u00e4nerande makadam 0-32 mm (carport)',nf(A*.15*1.15,1)+' m\u00b3','150 mm under taket']
  ]];
}
function garageRows(){
  const gi=garageInfo();if(!gi)return [];
  if(gi.type==='c')return carportRows(gi);
  const so=ops;ops=gi.gops.map((x,i)=>({t:x.t,w:x.w,h:x.h,n:1,id:'g'+i}));
  let s;
  try{s=calcCore({wing:true,gar:true,FL:gi.L,FW:gi.B,W1:gi.L,W2:gi.B,W3:gi.L,W4:gi.B,RL:gi.L,RW:gi.B,H2:gi.H,I:0,noGrund:true,N:1});}
  finally{ops=so;}
  s=s.filter(x=>x[0]!=='Golv');
  const A=gi.L*gi.B,KILL=gi.ins?[]:['Isolering','Ångspärr','Installationsläkt','Gipsskiva'];
  s.forEach(x=>{if(x[0]==='Skivor och isolering')x[1]=x[1].filter(r=>!KILL.some(k=>r[0].startsWith(k)));});
  s=s.filter(x=>x[1].length>0);
  const slab=['Platta på mark',[
    ['Dränerande makadam 0-32 mm',nf(A*.2*1.15,1)+' m³','200 mm, 15 % packning'],
    ['Cellplast EPS 100 mm under platta',nf(A*1.05,1)+' m²',''],
    ['Armeringsnät K189 (platta)',nf(A*1.15,1)+' m²',''],
    ['Betong C25/30 (platta 120 mm)',nf(A*.12*1.08,1)+' m³','+ 8 % för kantförstärkning'],
    ['Kantelement/formvirke (platta)',nf(2*(gi.L+gi.B),1)+' m','runt plattan']
  ]];
  s.unshift(slab);
  s.forEach(x=>{x[0]=GN()+' – '+x[0];});
  return s;
}
function wingCuts(w,k){
  const out=[];
  if(!$('hs')||$('hs').value==='r'||!WINGS.length)return out;
  const B=g0('GB'),L0=g0('W1');
  WINGS.forEach((wg,i)=>{
    if(wcount(i)<=k)return;
    if(w===0&&wg.s==='f')out.push([wg.x0,wg.x0+B]);
    if(w===2&&wg.s==='b')out.push([L0-wg.x0-B,L0-wg.x0]);
  });
  return out;
}
function cutPieces(w,a,b,k){
  let cur=[{a,b}];
  wingCuts(w,k).forEach(([ia,ib])=>{
    cur=cur.flatMap(p=>{if(ib<=p.a||ia>=p.b)return [p];const r=[];if(ia>p.a)r.push({a:p.a,b:ia});if(ib<p.b)r.push({a:ib,b:p.b});return r;});
  });
  return cur.filter(p=>p.b-p.a>.15).map(p=>({a:p.a,b:p.b,startCut:Math.abs(p.a-a)>1e-6,endCut:Math.abs(p.b-b)>1e-6}));
}
function balcInfo(){
  if(!$('bk')||!$('bk').checked||!$('bHus').checked)return null;
  const wl=[g0('W1'),g0('W2'),g0('W3'),g0('W4')],w=Math.min(3,Math.max(0,parseInt($('bkS').value)||0));
  const dl=Math.max(.8,Math.min(g0('bkL'),wl[w])),dp=Math.max(.6,g0('bkD')),x0=Math.min(Math.max(g0('bkX'),0),Math.max(0,wl[w]-dl));
  const k=Math.max(1,Math.min(parseInt($('bkV').value)||2,mcount()))-1;
  const segs=cutPieces(w,x0,x0+dl,k).map(p=>({a:p.a,b:p.b,startRail:!p.startCut,endRail:!p.endCut}));
  if(!segs.length)return null;
  const dlT=segs.reduce((a2,p)=>a2+(p.b-p.a),0);
  return {w,dl:dlT,dlReq:dl,dp,x0,k,wl,segs,rack:$('bkR').checked,posts:$('bkP').checked};
}
function balcRows(){
  const b=balcInfo();if(!b)return null;
  const sp=1+g0('S')/100,pc=Math.ceil,dl=b.dl,dp=b.dp,area=dl*dp,H=g0('H2');
  const jh=(parseInt($('jd').value.split('x')[1])||195)/1000,fo=($('gr').value==='p'?(g0('ph')||.4)+jh:0),y00=fo+jh+.022;
  const top=y00+b.k*(H+jh+.022)-.03,nj=pc(dl/.6)+1;
  const rows=[
    ['Balkongbjälkar 45x195 (balkong)',nf(pc(nj*sp))+' st','längd '+nf(dp+.4,1)+' m · c/c 600 mm, inspända i våningsbjälklaget'],
    ['Randbjälke 45x195 (balkong)',nf(pc(dl*sp/4.8))+' st','à 4,8 m · '+nf(dl,1)+' m'],
    ['Bjälkskor (balkong)',nf(nj*2)+' st','2 per bjälke'],
    ['Däcksplank 28x120 (balkong)',nf(area/.125*1.1,0)+' m',nf(area,1)+' m² · c/c 125 mm, 10 % spill'],
    ['Däckskruv 4,5x60 (balkong)',nf(pc(area*40*sp))+' st','ca 40 st/m²']
  ];
  if(b.rack){const Lr=dl+2*dp;rows.push(['Räckesstolpar 95x95 (balkong)',nf(pc(Lr/1.2)+2)+' st','längd 1,0 m · c/c max 1,2 m']);rows.push(['Handledare och ribbor 45x95 (balkong)',nf(pc(Lr*3*sp/4.8))+' st','à 4,8 m · '+nf(Lr*3,1)+' m (3 rader)']);}
  if(b.posts){const h=Math.max(.5,top-.223);rows.push(['Stödstolpar 95x95 (balkong)','2 st','längd '+nf(h,1)+' m, till marken']);rows.push(['Plintar (balkong)','2 st','under stödstolparna']);}
  return rows;
}
function deckSegs(){
  const wl=[g0('W1'),g0('W2'),g0('W3'),g0('W4')],dp=g0('dkD'),per=wl.reduce((a,b)=>a+b,0);
  const dl=Math.max(.5,Math.min(g0('dkL'),per-.1));
  let w=Math.min(3,Math.max(0,parseInt($('dkS').value)||0)),x=Math.min(Math.max(g0('dkX'),0),Math.max(0,wl[w]-.05));
  const segs=[];let rem=dl,guard=0;
  while(rem>.01&&guard++<8){
    const avail=wl[w]-x;
    if(rem>avail+.001){segs.push({w,a:x,b:wl[w]+dp,first:segs.length===0,last:false,ext:true});rem-=avail;w=(w+1)%4;x=0;}
    else{segs.push({w,a:x,b:x+rem,first:segs.length===0,last:true,ext:false});rem=0;}
  }
  const pieces=[];
  segs.forEach(sg=>{
    cutPieces(sg.w,sg.a,sg.b,0).forEach(p=>{
      pieces.push({w:sg.w,a:p.a,b:p.b,ext:sg.ext&&!p.endCut,first:sg.first&&!p.startCut,last:sg.last&&!p.endCut,startRail:!p.startCut,endRail:!p.endCut});
    });
  });
  const corners=pieces.filter(s=>s.ext).length,leff=pieces.reduce((a2,p)=>a2+(p.b-p.a),0);
  return {segs:pieces,dp,dl:Math.max(0,leff-corners*dp),corners,leff,cutByWing:pieces.length!==segs.length||segs.some((sg,i)=>!pieces[i]||Math.abs(pieces[i].b-sg.b)>1e-6||Math.abs(pieces[i].a-sg.a)>1e-6)};
}
function deckRows(){
  if(!$('dk').checked)return null;
  const D=deckSegs(),dl=D.leff,dp=D.dp,hd=g0('dkH'),sp=1+g0('S')/100,pc=Math.ceil;
  const pl=Math.max(.15,hd-.318),top=pl+.318,lines=pc(dp/1.6)+1,perL=pc(dl/1.8)+1,np=lines*perL,area=dl*dp;
  const rows=[
    ['Plintar (altan)',nf(np)+' st','höjd '+nf(pl,2)+' m · '+nf(lines)+' rader × '+nf(perL)+' st'],
    ['Plintpapp (altan)',nf(np)+' st','under varje bärlina'],
    ['Bärlinor 2×45x145 (altan)',nf(pc(lines*dl*sp/4.8)*2)+' st','à 4,8 m · '+nf(lines*dl,1)+' m, dubbla'],
    ['Däcksbjälkar 45x145 (altan)',nf(pc((pc(dl/.6)+1)*sp))+' st','längd '+nf(dp,1)+' m · c/c 600 mm'],
    ['Randbjälke och ledger 45x145 (altan)',nf(pc(2*dl*sp/4.8))+' st','à 4,8 m · '+nf(2*dl,1)+' m'],
    ['Ankarbultar mot husvägg (altan)',nf(pc(dl/.6)+1)+' st','c/c 600 mm'],
    ['Däcksplank 28x120 (altan)',nf(area/.125*1.1,0)+' m',nf(area,1)+' m² · c/c 125 mm, 10 % spill'],
    ['Däckskruv 4,5x60 (altan)',nf(pc(area*40*sp))+' st','ca 40 st/m²']
  ];
  const stairs=$('dkT').checked;
  if($('dkR').checked){
    const Lr=dl+2*dp+D.corners*dp-(stairs?1:0),nposts=pc(Lr/1.2)+2;
    rows.push(['Räckesstolpar 95x95 (altan)',nf(nposts)+' st','längd 1,0 m · c/c max 1,2 m']);
    rows.push(['Handledare och ribbor 45x95 (altan)',nf(pc(Lr*3*sp/4.8))+' st','à 4,8 m · '+nf(Lr*3,1)+' m (3 rader)']);
  }
  if(stairs){
    const n=pc(top/.17),len=Math.hypot(top,n*.28)+.2;
    rows.push(['Trappvangar 45x195 (altan)','2 st','längd '+nf(len,1)+' m · '+nf(n)+' steg']);
    rows.push(['Trappsteg 28x120 (altan)',nf(n*2,0)+' m','2 plank per steg, bredd 1,0 m']);
    rows.push(['Plintar trappa (altan)','2 st','under trappvangarna']);
  }
  const rt=$('dkRoof')?$('dkRoof').value:'n';
  if(rt!=='n'){
    const rh=g0('dkRH')||2.5,sl=Math.tan(8*Math.PI/180),rafL=Math.hypot(dp+.3,sl*(dp+.3));
    const np=D.segs.reduce((a,sg)=>a+Math.max(2,pc((sg.b-sg.a)/2.8)+1),0),rafN=D.segs.reduce((a,sg)=>a+pc((sg.b-sg.a)/(rt==='f'?.6:.9))+1,0);
    rows.push(['Stolpar 95x95 (altantak)',nf(np)+' st','l\u00e4ngd '+nf(rh,1)+' m']);
    rows.push(['B\u00e4rbalk 2\u00d745x195 (altantak)',nf(pc(D.leff*2*sp/4.8)*2)+' st','\u00e0 4,8 m \u00b7 '+nf(D.leff*2,1)+' m, dubbla']);
    rows.push(['Takbj\u00e4lkar 45x145 (altantak)',nf(pc(rafN*sp))+' st','l\u00e4ngd '+nf(rafL,1)+' m']);
    rows.push(['Ledger 45x195 mot husv\u00e4gg (altantak)',nf(pc(D.leff*sp/4.8))+' st','\u00e0 4,8 m \u00b7 '+nf(D.leff,1)+' m']);
    rows.push(['Takbalkskor och beslag (altantak)',nf(rafN*2)+' st','2 per bj\u00e4lke']);
    if(rt==='p')rows.push(['Lameller 28x70 (altantak)',nf(D.leff*pc((dp+.3)/.3)*sp,0)+' m','c/c 300 mm']);
    else{const roofA=D.leff*rafL;rows.push(['Underlagstak/r\u00e5spont (altantak)',nf(roofA*sp,1)+' m\u00b2','med spill']);rows.push(['Underlagspapp (altantak)',nf(pc(roofA*1.1*sp/15))+' rullar','\u00e0 15 m\u00b2']);rows.push(['Takpl\u00e5t (altantak)',nf(roofA*1.05,1)+' m\u00b2','t\u00e4ckt yta + 5 %']);rows.push(['Takfotspl\u00e5t (altantak)',nf(pc(D.leff*sp/2))+' st','\u00e0 2 m']);}
  }
  return rows;
}
function wcount(i){return Math.max(1,parseInt($('vw'+(i+1)).value)||1);}
function mcount(){return Math.max(1,parseInt($('vn').value)||1);}
function calc(){
  sync();wingSetup();
  const Nm=mcount(),WL=g('GL'),WB=g('GB'),L0=g('W1');
  const ROOF=['Tak','Plåtdetaljer och vindskivor','Hängrännor och stuprör'];
  const hus=$('bHus').checked;
  const parts=hus?[{nm:'Hus',N:Nm,main:true}]:[];
  if(hus)WINGS.forEach((w,i)=>parts.push({nm:'Vinge '+(i+1),N:wcount(i)}));
  let all=[];
  parts.forEach((pt,pi)=>{
    for(let k=0;k<pt.N;k++){
      const top=k===pt.N-1,opt={noGable:!top,noGrund:k>0,N:pt.N};
      let s;const so=ops;
      if(pt.main){
        const act=WINGS.filter((w,i)=>wcount(i)>k),plan=act.length?wingPlan(L0,WB,act):null;
        opt.segs=plan?plan.flat().map(q=>q.e-q.s):null;
        ops=so.filter(o=>!o.v||o.v===k+1);
        if(IW.length)opt.I=iwLen(k);
      }else{
        Object.assign(opt,{wing:true,FL:WL,FW:WB,W1:WL,W2:WB,W3:WL,W4:(k>=Nm?WB:0),RL:WL,RW:WB,I:0});
        ops=[];
      }
      try{s=calcCore(opt);}finally{ops=so;}
      if(pt.main){const nd=iwDoors(k);if(nd)s.push(['Innerdörrar',[['Innerdörr 800×2100 mm (dörrblad, karm, foder)',nf(nd)+' st','i ritade innerväggar']]]);const er=elRows(k);if(er.length)s.push(['El invändigt',er]);}
      if(!top)s=s.filter(x=>!ROOF.includes(x[0]));
      s.forEach(x=>{
        if(k>0&&x[0]==='Golv')x[0]='Mellanbjälklag';
        x[0]=(pt.N>1?'Våning '+(k+1)+' · ':'')+(pi>0?pt.nm+' – ':'')+x[0];
      });
      all=all.concat(s);
    }
  });
  const dr=hus?deckRows():null;if(dr)all.push(['Altan',dr]);
  const brr=hus?balcRows():null;if(brr)all.push(['Balkong',brr]);
  {const bs=parseInt($('hBS').value)||0;if(hus&&Nm>1&&bs>0)all.push(['Stöd under mellanbjälklag',[['Limträbalk 115x315 (bjälklagsstöd)',nf(bs*(Nm-1))+' st','längd '+nf(g('FL'),1)+' m · en per stödlinje och våning']]]);}
  garageRows().forEach(x=>all.push(x));
  capInfos().forEach(c=>all.push(capRows(c)));
  const shn={r:'',l:'L-form',t:'T-form',x:'X-form',u:'U-form'}[$('hs').value];
  TITLE='Stomkalkyl – hus '+nf(g('L'),1)+'×'+nf(g('W'),1)+' m'+(shn?' ('+shn+', vinge '+nf(WL,1)+'×'+nf(WB,1)+' m)':'')+(Nm>1?', '+Nm+' våningar (huvudhus)':'');
  if(!hus)TITLE='Stomkalkyl – fristående garage';
  try{renderWarn();}catch(e){console.error(e);}
  renderRes(all);
}
function calcPrev(){
  sync();wingSetup();
  const N=parseInt($('vn').value)||1,WL=g('GL'),WB=g('GB'),L0=g('W1');
  const plan=WINGS.length?wingPlan(L0,WB):null,segs=plan?plan.flat().map(q=>q.e-q.s):null;
  const ROOF=['Tak','Plåtdetaljer och vindskivor','Hängrännor och stuprör'];
  let all=[];
  for(let k=0;k<N;k++){
    const top=k===N-1,fl={noGable:!top,noGrund:k>0,N};
    const parts=[['Hus',{...fl,segs}]];
    WINGS.forEach((w,i)=>parts.push(['Vinge '+(i+1),{...fl,wing:true,FL:WL,FW:WB,W1:WL,W2:WB,W3:WL,W4:0,RL:WL,RW:WB,I:0}]));
    parts.forEach(([nm,opt],pi)=>{
      let s;
      if(opt.wing){const so=ops;ops=[];try{s=calcCore(opt);}finally{ops=so;}}else s=calcCore(opt);
      if(!top)s=s.filter(x=>!ROOF.includes(x[0]));
      s.forEach(x=>{
        if(k>0&&x[0]==='Golv')x[0]='Mellanbjälklag';
        x[0]=(N>1?'Våning '+(k+1)+' · ':'')+(pi>0?nm+' – ':'')+x[0];
      });
      all=all.concat(s);
    });
  }
  const shn={r:'',l:'L-form',t:'T-form',x:'X-form'}[$('hs').value];
  TITLE='Stomkalkyl – hus '+nf(g('L'),1)+'×'+nf(g('W'),1)+' m'+(shn?' ('+shn+', vinge '+nf(WL,1)+'×'+nf(WB,1)+' m)':'')+(N>1?', '+N+' våningar':'');
  renderRes(all);
}
function calcOld(){
  sync();
  const hs=$('hs').value==='l',WL=g('GL'),WB=g('GB');
  let sec=calcCore(hs?{W3:Math.max(0,g('W3')-WB),Lm:true}:null);
  if(hs){
    const so=ops;ops=[];let w;
    try{w=calcCore({wing:true,FL:WL,FW:WB,W1:WL,W2:WB,W3:WL,W4:0,RL:WL,RW:WB,I:0});}finally{ops=so;}
    w.forEach(s=>{s[0]='Vinge – '+s[0];});sec=sec.concat(w);
  }
  TITLE='Stomkalkyl – hus '+nf(g('L'),1)+'×'+nf(g('W'),1)+' m'+(hs?' + vinge '+nf(WL,1)+'×'+nf(WB,1)+' m':'');
  renderRes(sec);
}
function calcCore(o){
  const g=id=>(o&&o[id]!=null)?o[id]:g0(id);
  if(!o||!o.wing)sync();
  const HL=g('L'),HW=g('W'),I=g('I'),cc=g('cc'),ccT=g('ccT'),P=g('P'),O=g('O'),sp=1+g('S')/100,dim=$('dim').value;
  const ws=(o&&o.segs)||[g('W1'),g('W2'),g('W3'),g('W4')],H=g('H2'),per=ws.reduce((a,b)=>a+b,0);
  const L=g('RL'),W=g('RW');
  const FL=g('FL'),FW=g('FW'),jc=g('jc'),jd=$('jd').value;
  const jTot=Math.ceil((Math.ceil(FL/jc)+1)*sp),jl=stdLen(FW),rim=Math.ceil(2*FL*sp/4.8),floorA=FL*FW;
  // Väggreglar
  let studs=ws.reduce((a,l)=>a+Math.ceil(l/cc)+1,0)+8;
  if(!(o&&o.noGable))studs+=2*(Math.ceil(W/cc)+1); // 3-regelhörn
  if(roofIsPulpet(o)&&!(o&&o.noGable))studs+=Math.ceil((Math.ceil(L/cc)+1)*(W*Math.tan(P*Math.PI/180)/2)/Math.max(.5,H-.135)); // högre vägg på takets höga sida
  const inner=I>0?Math.ceil(I/cc)+1:0;
  let hdrM=0,sillM=0,openA=0,doorW=0;
  ops.forEach(o=>{
    studs+=Math.max(0,4-Math.floor(o.w/cc))*o.n;
    hdrM+=2*(o.w+0.2)*o.n; openA+=o.w*o.h*o.n;
    if(o.t==='f')sillM+=o.w*o.n; else doorW+=o.w*o.n;
  });
  const sl=stdLen(H-0.135);
  const studTot=Math.ceil((studs+inner)*sp);
  const plateM=(per+I)*3-doorW;
  const plateP=Math.ceil(plateM*sp/4.8);
  const hdrP=Math.ceil(hdrM*sp/4.8);
  const sillP=Math.ceil(sillM*sp/4.8);
  const wallA=Math.max(0,per*H-openA)+((o&&o.noGable)?0:W*W*Math.tan(P*Math.PI/180)/2)+((roofIsPulpet(o)&&!(o&&o.noGable))?L*W*Math.tan(P*Math.PI/180):0);
  const inA=wallA+I*H*2;
  const vind=Math.ceil(wallA*sp/3.24);
  const gips=Math.ceil(inA*sp/2.88);
  const ins=wallA*sp;
  // Tak
  const rad=P*Math.PI/180,eaveL=L+((o&&o.wing&&!o.gar)?O:2*O),PU=roofIsPulpet(o),nSl=PU?1:2,slope=(PU?W+O:W/2+O)/Math.cos(rad);
  const roofA=nSl*eaveL*slope;
  const trusses=Math.ceil(L/ccT)+1;
  const lath=roofA/0.3*sp;
  const pc=Math.ceil,rows=pc(slope/.3)+1,strCnt=pc(eaveL/.6)+1;
  const strM=nSl*strCnt*slope*sp,latM=nSl*rows*eaveL*sp;
  const paperA=roofA*1.1*sp,rolls=pc(paperA/15);
  const pl=Math.ceil((slope+.05)*10)/10,plN=nSl*pc(eaveL/1.0);
  const gabM=2*nSl*slope,vsP=pc(gabM*sp/2),vtP=pc(gabM*sp/4.8),fotM=nSl*eaveL,fotP=pc(fotM*sp/2);
  const nockP=pc(eaveL*sp/2),hooks=nSl*(pc(eaveL/.6)+1),dpN=Math.max(2,pc(fotM/10)),dpL=H*((o&&o.N)||1)+.5;
  const grOn=$('gr').value==='p'&&!(o&&o.noGrund),ph=g('ph')||.4;
  const lines=pc(FW/2.4)+1,perLine=pc(FL/1.8)+1,plinN=lines*perLine,bmN=pc(lines*FL*sp/4.8)*2;
  const floorRows=[
    ...(grOn?[
      ['Plintar',nf(plinN)+' st','höjd '+nf(ph,2)+' m · '+nf(lines)+' rader × '+nf(perLine)+' st'],
      ['Bärlinor 2×'+jd,nf(bmN)+' st','à 4,8 m · '+nf(lines*FL,1)+' m, dubbla'],
      ['Plintpapp (kapillärbrytare)',nf(plinN)+' st','en under varje bärlina på plint']]:[]),
    ['Bjälkar '+jd,nf(jTot)+' st','längd '+nf(jl,1)+' m, exakt '+nf(FW,2)+' m · c/c '+nf(jc*1000)+' mm'],
    ['Randbjälkar '+jd,nf(rim)+' st','à 4,8 m · längs '+nf(2*FL,1)+' m'],
    ['Bjälkskor',nf(jTot*2)+' st','2 per bjälke'],
    ['Vindskydd under bjälklag (vindpapp/duk)',nf(floorA*1.1*sp,1)+' m²','med överlapp och spill'],
    ['Isolering '+jd.split('x')[1]+' mm',nf(floorA*sp,1)+' m²','i bjälklaget'],
    ['Ångspärr (plastfolie 0,2 mm)',nf(floorA*1.15,1)+' m²','tejpade skarvar'],
    ['Golvskiva 22 mm (spont)',nf(pc(floorA*sp/1.44))+' st','600×2400 · '+nf(floorA,1)+' m²'],
    ['Golvskruv 4,5×50',nf(pc(floorA*20*sp))+' st','ca 20 st/m²'],
    ['Underlagsmatta',nf(floorA*1.1,1)+' m²','10 % spill'],
    ['Golvbeläggning (parkett/laminat)',nf(floorA*1.1,1)+' m²','10 % spill'],
    ['Golvlist',nf(pc(2*(FL+FW)*1.1/2.4))+' st','à 2,4 m · '+nf(2*(FL+FW),1)+' m']
  ];
  const sillLen=Math.max(0,per-doorW),boltN=pc(per/1.2)+1,nailN=pc(studTot*6);
  const braceM=ws.reduce((a,l)=>a+2*Math.hypot(Math.min(l,2.4),Math.max(H-.135,.5)),0)*sp;
  const rowsI=pc(H/.6)+1,instM=per*rowsI*sp,fasStr=(pc(per/.6)+1)*H*sp;
  const opPer=ops.reduce((a,o)=>a+2*(o.w+o.h)*(o.n||0),0)*1.1;
  const opRows=ops.filter(o=>o.n>0).map(o=>[(o.t==='f'?'Fönster ':(o.t==='p'?'Garageport ':'Dörr '))+nf(o.w*1000)+'×'+nf(o.h*1000)+' mm',nf(o.n)+' st','']);
  const rdim=$('rd').value,glu=$('rt').value==='g',rafL=Math.ceil((slope+.05)*10)/10,rafN=trusses*nSl;
  const roofFrame=glu?[
    ['Limträsparrar '+rdim,nf(rafN)+' st','längd '+nf(rafL,1)+' m · c/c '+nf(ccT,1)+' m, ett par per läge'],
    ['Limträ nockbalk '+rdim,nf(pc(eaveL/12))+' st','totalt '+nf(eaveL,1)+' m, max 12 m per balk'],
    ['Sparrbeslag/balkskor',nf(rafN*2)+' st','ett i vardera änden'],
    ...((parseInt($('hNS').value)||0)>0?(()=>{const nS=parseInt($('hNS').value)||0,hp=H+Math.tan(P*Math.PI/180)*(PU?W:W/2);return [['Stolpar 95x95 (nockstöd)',nf(nS)+' st','längd '+nf(hp,1)+' m'],['Plintar (nockstöd)',nf(nS)+' st','under varje stöd']];})():[])
  ]:[
    [(PU?'Takstolar, snett tak ':'Takstolar ')+rdim,nf(trusses)+' st','spännvidd '+nf(W,1)+' m · c/c '+nf(ccT,1)+' m'],
    ['Takstolsbeslag',nf(trusses*2)+' st','2 per takstol']
  ];
  const sec=[
   ['Golv',floorRows],
   ['Väggstomme',[
    ['Reglar ytterväggar '+dim,nf(pc(studs*sp))+' st','längd '+nf(sl,1)+' m, exakt '+nf(H-.135,2)+' m ('+nf(studs)+' st + spill, inkl. hörn, öppningar och gavelspetsar)'],
    ['Reglar innerväggar '+dim,nf(pc(inner*sp))+' st','längd '+nf(sl,1)+' m, exakt '+nf(H-.135,2)+' m ('+nf(inner)+' st + spill)'],
    ['Syll och ovanregel '+dim,nf(plateP)+' st','à 4,8 m · '+nf(plateM,1)+' m, 1 syll + 2 ovanreglar'],
    ['Bärlinor över öppningar 2×'+dim,nf(hdrP)+' st','à 4,8 m · '+nf(hdrM,1)+' m'],
    ['Fönsterbröstregel '+dim,nf(sillP)+' st','à 4,8 m · '+nf(sillM,1)+' m'],
    ['Syllpapp/tätningslist',nf(sillLen,1)+' m','under syllen, ej under dörrar'],
    ['Syllbultar/ankarskruv',nf(boltN)+' st','c/c 1,2 m runt ytterväggarna'],
    ['Vindavstyvning (stålband)',nf(braceM,0)+' m','kryss på varje vägg, ej förbi öppningar'],
    ['Spik 90 mm (regelförband)',nf(nailN)+' st','ca 6 per regel']]],
   ['Skivor och isolering',[
    ['Vindskyddsskiva 9 mm',nf(vind)+' st','1200×2700 · '+nf(wallA,1)+' m² yttervägg'],
    ['Gipsskiva 13 mm',nf(gips)+' st','1200×2400 · '+nf(inA,1)+' m² (inner- och ytterväggar)'],
    ['Isolering '+dim.split('x')[1]+' mm',nf(ins,1)+' m²','i ytterväggar'],
    ['Ångspärr (plastfolie 0,2 mm)',nf(wallA*1.15,1)+' m²','insidan yttervägg, tejpade skarvar'],
    ['Installationsläkt 45×45 (c/c 600 mm)',nf(instM,0)+' m',nf(rowsI)+' rader invändigt']]],
   ['Fönster, dörrar och fasad',[
    ...opRows,
    ['Fönsterfoder och dörrfoder',nf(opPer,1)+' m','runt alla öppningar, inkl. 10 % spill'],
    ['Fönsterbleck/bräda',nf(sillM*1.1,1)+' m','under fönster'],
    ['Ströläkt fasad 28×70',nf(fasStr,0)+' m','c/c 600 mm, stående · ger 28 mm luftspalt'],
    ['Insektsnät/ventilationsprofil',nf(per*2*1.05,1)+' m','nederkant och överkant, öppen luftspalt'],
    ...($('pd').value==='s'?[['Tvärläkt fasad 28×45',nf(per*pc(H/.6)*sp,0)+' m','c/c 600 mm, bär stående panel']]:[]),
    ['Fasadpanel 22×145',nf(wallA*1.1*sp/.12,0)+' m',($('pd').value==='s'?'Stående · ':'Liggande · ')+nf(wallA*1.1*sp,1)+' m² med 10 % extra och spill'],
    ['Hörnbrädor',nf(8)+' st','2 per hörn · längd '+nf(H,1)+' m']]],
   ['Tak',[
    ...roofFrame,
    ['Takyta',nf(roofA,1)+' m²',(PU?'Snett tak · ':'')+nf(P)+'° · takfot '+nf(O,1)+' m'],
    
    ['Underlagstak/råspont',nf(roofA*sp,1)+' m²','med spill'],
    ['Underlagspapp (takpapp)',nf(rolls)+' rullar','à 15 m² · '+nf(paperA,1)+' m² inkl. 10 % överlapp och spill'],
    ['Ströläkt 25×48',nf(strM,0)+' m','c/c 600 mm, i takets lutningsriktning'],
    ['Tvärläkt/bärläkt (c/c 300 mm)',nf(latM,0)+' m',nf(nSl*rows)+' rader'],
    ['Takplåt',nf(plN)+' st','längd '+nf(pl,1)+' m · täckbredd 1,0 m · '+nf(roofA,1)+' m² tak'],
    ['Takskruv (plåt)',nf(pc(roofA*6*sp))+' st','ca 6 st/m²']]],
   ['Plåtdetaljer och vindskivor',[
    ['Vindskiva (trä) 22×145',nf(vtP)+' st','à 4,8 m · '+nf(gabM,1)+' m längs gavlarna'],
    ['Vindskiveplåt',nf(vsP)+' st','à 2 m · '+nf(gabM,1)+' m'],
    ['Takfotsplåt (droppkant)',nf(fotP)+' st','à 2 m · '+nf(fotM,1)+' m'],
    [PU?'Avslutsplåt, takets höga kant':'Nockplåt',nf(nockP)+' st','à 2 m · '+nf(eaveL,1)+' m'],
    ...((o&&o.wing&&!o.gar)?(()=>{const tv=Math.tan(rad),vl=(W/2)*Math.sqrt(2+tv*tv),vm=2*vl*1.1;return [['Ränndalsplåt (takanslutning)',nf(vm,1)+' m','2 ränndalar à '+nf(vl,1)+' m, 10 % spill'],['Ränndalsbräda 22x195',nf(vm,1)+' m','under plåten i ränndalen']];})():[]),
    ['Snörasskydd, rör Ø25 (2 rader)',nf(pc(4*(eaveL-.5)*sp/3))+' st','à 3 m · '+nf(4*(eaveL-.5),1)+' m, 0,6 m från takfot'],
    ['Snörasskyddskonsoler',nf(2*(pc((eaveL-.5)/.9)+1))+' st','c/c 900 mm · inkl. tätning och skruv'],
    ['Ändlock för rör',nf(8)+' st','2 per rör']]],
   ['Hängrännor och stuprör',[
    ['Hängrännor',nf(pc(fotM*sp/3))+' st','à 3 m · '+nf(fotM,1)+' m'],
    ['Rännkrokar',nf(hooks)+' st','c/c 600 mm'],
    ['Stuprör',nf(dpN*pc(dpL/3))+' st','à 3 m · '+nf(dpN)+' nedlopp'],
    ['Utlopp och rännhörn',nf(dpN)+' st','ett per stuprör, hörn tillkommer']]]
  ];
  return sec;
  
}

/* ---------- Färger ---------- */
const FC_PRESETS=[['Falu röd','#8a2f23'],['Vit','#f2f0ea'],['Ljusgrå','#b9bec0'],['Grafit','#3b4247'],['Gul','#d8b04a'],['Blå','#3e6a8a'],['Grön','#4f6b4c'],['Natur trä','#b0814f']];
FC_PRESETS.forEach(([n,c])=>{
  const b=document.createElement('button');b.type='button';b.title=n;b.setAttribute('aria-label','Fasadfärg '+n);
  b.style.cssText='width:44px;min-height:44px;flex:0 0 44px;padding:0;border:2px solid var(--line);border-radius:50%;background:'+c;
  b.onclick=()=>{const e=$('fc');e.value=c;e.dispatchEvent(new Event('input',{bubbles:true}));};
  $('fcSw').appendChild(b);
});
function hexRgb(h){const m=/^#?([0-9a-f]{6})$/i.exec(h||'');const v=m?parseInt(m[1],16):0x8a2f23;return [(v>>16)&255,(v>>8)&255,v&255];}
function hexShade(h,f){return hexRgb(h).map(v=>Math.max(0,Math.min(255,Math.round(v*f))));}

/* ---------- Byggnadstyper (garage, förråd, gäststuga, carport) ---------- */
function GN(){return {g:'Garage',f:'Förråd',s:'Gäststuga',c:'Carport'}[($('gaT')&&$('gaT').value)||'g']||'Garage';}
const GPRE={
  g:{L:6,B:4,H:2.5,ins:false,rows:[{t:'p',w:2.5,h:2.2,n:1},{t:'d',w:.9,h:2.1,n:1},{t:'f',w:1,h:1,n:1}]},
  f:{L:4,B:3,H:2.3,ins:false,rows:[{t:'d',w:.9,h:2.0,n:1},{t:'f',w:.8,h:.8,n:1}]},
  s:{L:6,B:5,H:2.5,ins:true,rows:[{t:'d',w:.9,h:2.1,n:1},{t:'f',w:1.2,h:1.2,n:3}]},
  c:{L:6,B:3.5,H:2.4,ins:false,rows:[]}
};
$('gaT').addEventListener('input',()=>{
  const p=GPRE[$('gaT').value];if(!p)return;
  $('gaL').value=p.L;$('gaB').value=p.B;$('gaH').value=p.H;$('gaI').checked=p.ins;
  GROWS=p.rows.map(r=>({...r,id:++GUID}));GOPS=[];
  drawGOps();
});
