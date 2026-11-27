/* ---------- El invändigt ---------- */
let ELS=[{t:'c',k:0,wall:0,c:1,h:1.5},{t:'u',k:0,wall:0,c:3,h:.3},{t:'u',k:0,wall:1,c:2,h:.3},{t:'u',k:0,wall:2,c:3,h:.3},{t:'u',k:0,wall:3,c:2,h:.3},{t:'b',k:0,wall:0,c:2,h:1.1}];
const ELN={u:'Eluttag',b:'Strömbrytare',l:'Lamputtag (vägg)',t:'Taklampa (i taket)',c:'Elcentral (säkringsskåp)'};
function elWallOpts(){
  const o=[[0,'Hus 1'],[1,'Hus 2'],[2,'Hus 3'],[3,'Hus 4']];
  WINGS.forEach((w,wx)=>[0,1,2].forEach(j=>o.push([10+wx*3+j,'Vinge '+(wx+1)+', '+(j===1?'kortsida':'långsida '+(j===0?'1':'2'))])));
  return o;
}
/* var en el-punkt sitter i förhållande till husets omkrets: värdväggen på huvudhuset + kabelsträcka längs vingen */
function elLoc(e){
  const wl=[g0('W1'),g0('W2'),g0('W3'),g0('W4')],q=e.wall||0;
  if(q<10){const i=Math.min(3,Math.max(0,q));return {i,c:Math.min(e.c,wl[i]),extra:0};}
  const wx=Math.floor((q-10)/3),j=(q-10)%3,w=WINGS[wx];if(!w)return {i:0,c:0,extra:0};
  const GB=g0('GB'),GL=g0('GL'),B=w.s==='b',len=j===1?GB:GL,c=Math.min(Math.max(e.c,0),len);
  const jx=j===2?(B?w.x0:w.x0+GB):(B?w.x0+GB:w.x0),host=B?2:0,hc=B?Math.max(0,g0('W1')-jx):jx,run=j===0?c:(j===2?GL-c:c+GL);
  return {i:host,c:Math.min(hc,wl[host]),extra:run};
}
function elFrame(q){
  const wx=Math.floor((q-10)/3),j=(q-10)%3,w=WINGS[wx];if(!w)return null;
  const GB=g0('GB'),GL=g0('GL'),W2=g0('W2'),B=w.s==='b';
  const tab=B?[[[w.x0+GB,W2],[0,1],GL],[[w.x0+GB,W2+GL],[-1,0],GB],[[w.x0,W2+GL],[0,-1],GL]]:[[[w.x0,0],[0,-1],GL],[[w.x0,-GL],[1,0],GB],[[w.x0+GB,-GL],[0,1],GL]];
  const t=tab[j];return {O:t[0],dir:t[1],th:Math.atan2(-t[1][1],t[1][0]),len:t[2]};
}
function elWallName(e){const q=e.wall||0;if(q<10)return 'Hus '+(Math.min(3,Math.max(0,q))+1);const wx=Math.floor((q-10)/3),j=(q-10)%3;return 'Vinge '+(wx+1)+(j===1?' kortsida':' långsida '+(j===0?'1':'2'));}
function drawEls(){
  const opt=(arr,cur)=>arr.map(([v,t])=>`<option value="${v}"${String(cur)===String(v)?' selected':''}>${t}</option>`).join('');
  $('elList').innerHTML=ELS.map((e,i)=>`<div class="op">
  <label>Typ<select data-e="${i}" data-k="t">${opt(Object.entries(ELN),e.t)}</select></label>
  <label>Våning<select data-e="${i}" data-k="k">${opt([[0,1],[1,2],[2,3]],e.k||0)}</select></label>
  ${e.t==='t'?'<label>Plats<input type="text" value="Tak" disabled></label>':`<label>Vägg<select data-e="${i}" data-k="wall">${opt(elWallOpts(),e.wall||0)}</select></label>`}
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
  const pos=e=>{const l=elLoc(e);return wl.slice(0,l.i).reduce((a,b)=>a+b,0)+l.c;};
  const cen=L.find(e=>e.t==='c')||{wall:0,c:1,h:1.5},p0=pos(cen),cx=elLoc(cen).extra;
  let c15=0,c25=0;
  const y1=g0('elY')||.25;
  L.forEach(e=>{if(e.t==='c'||e.t==='t')return;const d0=Math.abs(pos(e)-p0),dist=Math.min(d0,per-d0)+elLoc(e).extra+cx+Math.abs(e.h-y1)+Math.abs(cen.h-y1)+.5;if(e.t==='u')c25+=dist;else c15+=dist;});
  const ci2=Math.min(3,Math.max(0,elLoc(cen).i)),cl=elLoc(cen),cxy=[[cl.c,0],[wl[0],cl.c],[wl[0]-cl.c,wl[1]],[0,wl[1]-cl.c]][ci2];
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

/* ---------- Garagets fönster, dörrar och portar ---------- */
function drawGOps(){
  const TN=[['f','Fönster'],['d','Dörr'],['p','Garageport']];
  $('gaList').innerHTML=GROWS.map((r,i)=>`<div class="op">
  <label>Typ<select data-g="${i}" data-k="t">${TN.map(([v,t])=>`<option value="${v}"${r.t===v?' selected':''}>${t}</option>`).join('')}</select></label>
  <label>Bredd m<input type="number" step="0.1" min="0.4" value="${r.w}" data-g="${i}" data-k="w"></label>
  <label>Höjd m<input type="number" step="0.1" min="0.4" value="${r.h}" data-g="${i}" data-k="h"></label>
  <label>Antal<input type="number" step="1" min="1" max="8" value="${r.n}" data-g="${i}" data-k="n"></label>
  <span></span>
  <button class="x" type="button" data-gdel="${i}" aria-label="Ta bort öppning">✕</button></div>`).join('');
}
$('gaList').addEventListener('input',ev=>{
  const t=ev.target,i=t.dataset.g;if(i==null)return;const k=t.dataset.k,r=GROWS[i];
  if(k==='t'){r.t=t.value;const d0={f:[1,1],d:[.9,2.1],p:[2.5,2.2]}[r.t];if(d0){r.w=d0[0];r.h=d0[1];}drawGOps();}
  else r[k]=parseFloat(t.value)||0;
  calc();
});
$('gaList').addEventListener('click',ev=>{const d=ev.target.closest('[data-gdel]');if(d){GROWS.splice(+d.dataset.gdel,1);drawGOps();calc();}});
$('gaAdd').onclick=()=>{GROWS.push({id:++GUID,t:'f',w:1,h:1,n:1});drawGOps();calc();};

/* ---------- Varningar och tips ---------- */
function ptIn(poly,p){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(((a[1]>p[1])!==(b[1]>p[1]))&&(p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]))c=!c;}return c;}
function houseWorldPolys(){
  const ws=[g0('W1'),g0('W2'),g0('W3'),g0('W4')],t=(g0('huR')||0)*Math.PI/180,c=[ws[0]/2,ws[1]/2],WB=g0('GB'),WL=g0('GL');
  const rp=p=>{const rx=p[0]-c[0],rz=p[1]-c[1];return [c[0]+rx*Math.cos(t)+rz*Math.sin(t),c[1]-rx*Math.sin(t)+rz*Math.cos(t)];};
  const polys=[[[0,0],[ws[0],0],[ws[0],ws[1]],[0,ws[1]]]];
  if($('hs').value!=='r')WINGS.forEach(w=>{polys.push(w.s==='b'?[[w.x0,ws[1]],[w.x0+WB,ws[1]],[w.x0+WB,ws[1]+WL],[w.x0,ws[1]+WL]]:[[w.x0,-WL],[w.x0+WB,-WL],[w.x0+WB,0],[w.x0,0]]);});
  return {polys:polys.map(pl=>pl.map(rp)),rp};
}
function renderWarn(){
  const W=[],add=(t,s)=>W.push({t,s:s||'w'});
  const hus=$('bHus').checked,P=g0('P'),N=mcount(),ws=[g0('W1'),g0('W2'),g0('W3'),g0('W4')],H=g0('H2'),RW=g0('RW'),pc=nf;
  const vn=['vägg 1 (fram)','vägg 2 (höger)','vägg 3 (bak)','vägg 4 (vänster)'];
  if(hus){
    const hd=parseInt($('dim').value.split('x')[1])||145;
    if(H>3&&hd<195)add('Vägghöjden är '+pc(H,1)+' m med '+$('dim').value+'. Reglar längre än ca 3 m brukar ha större dimension (45x195) eller extra noggar.');
    if($('rt').value==='t'&&RW>12)add('Takstolarnas spännvidd är '+pc(RW,1)+' m. Takstolar över 12 m kräver oftast särskild tillverkning och transport – prata med takstolstillverkaren.');
    if($('rt').value==='g'&&RW>9)add('Limträsparrar utan mellanstöd över '+pc(RW,1)+' m spännvidd behöver dimensioneras av konstruktör.');
    if(P<14)add('Takvinkeln är '+pc(P)+'°. Kontrollera plåttillverkarens minsta lutning och tätskikt innan du beställer.');
    ops.forEach(o=>{if(o.t!=='p'&&o.w>1.8)add((o.t==='f'?'Fönstret':'Dörren')+' på '+pc(o.w,2)+' m är brett. Bärlinan över kan behöva större dimension än 2×'+$('dim').value+'.');if(o.t==='p'&&o.w>3)add('Garageport på '+pc(o.w,1)+' m i huset: kräver kraftig bärlina eller limträbalk.');});
    // väggar som blir för fulla
    const sum={};inst.forEach(s=>{const o=ops.find(x=>x.id===s.oid);if(!o||(s.k||0)>=N)return;const k=(s.k||0)+'|'+s.wall;sum[k]=(sum[k]||0)+o.w;});
    Object.keys(sum).forEach(k=>{const [kk,w]=k.split('|'),len=ws[+w];if(len>0&&sum[k]>len*.7)add('Våning '+(+kk+1)+', '+vn[+w]+': öppningarna fyller '+Math.round(sum[k]/len*100)+' % av väggen ('+pc(sum[k],1)+' av '+pc(len,1)+' m). Det blir trångt och svagt.');});
    // el
    if(ELS.length&&!ELS.some(e=>e.t==='c'))add('Det finns elpunkter men ingen elcentral. Kablarna räknas mot en tänkt central vid hörnet.','i');
    if($('dk').checked){
      if(g0('dkH')>.5&&!$('dkR').checked)add('Altanen är '+pc(g0('dkH'),2)+' m över mark utan räcke. Höjder över ca 0,5 m kräver normalt räcke.');
      const D=deckSegs();if(D.cutByWing)add('Altanen har delats vid vingen så att den inte går genom väggen. Verklig längd: '+pc(D.dl,1)+' m.','i');
    }
    if($('bk').checked){
      const b=balcInfo();
      if(!b)add('Balkongen får ingen plats: den ligger helt över en vinge.');
      else{
        if(!b.rack)add('Balkongen har inget räcke. Balkong kräver räcke.');
        if(b.dp>1.5)add('Balkongdjup '+pc(b.dp,1)+' m: långa frit utskjutande bjälkar behöver dimensioneras av konstruktör.');
        if(b.k>0&&wingCuts(b.w,0).some(([a,c])=>b.x0<c&&b.x0+b.dlReq>a))add('Balkongen ligger ovanför en envånings vinge. Kontrollera takets anslutning.');
        if(!b.posts&&b.dp>1.2)add('Balkongen har inga stödstolpar och djupet är '+pc(b.dp,1)+' m. Kontrollera infästning och dimension.','i');
      }
    }
  }
  const gi=garageInfo();
  if(gi){
    const gl=[gi.L,gi.B,gi.L,gi.B],gs={};
    gi.gops.forEach(o=>{gs[o.wall]=(gs[o.wall]||0)+o.w;});
    Object.keys(gs).forEach(w=>{const len=gl[+w];if(gs[w]>len-.4*(gi.gops.filter(o=>o.wall===+w).length+1))add('Garagets vägg '+(+w+1)+' är '+pc(len,1)+' m men öppningarna är '+pc(gs[w],1)+' m tillsammans. De får inte plats.');});
    if(!gi.gops.some(o=>o.t==='p'))add('Garaget saknar port.','i');
    if(P<14)add('Garagetaket har samma vinkel som huset ('+pc(P)+'°). Kontrollera plåtens minsta lutning.');
    if(hus){
      const hw=houseWorldPolys(),gp=[];
      for(let i=0;i<=8;i++)for(let j=0;j<=8;j++)gp.push(gi.tf(gi.L*i/8,gi.B*j/8));
      if(gp.some(p=>hw.polys.some(pl=>ptIn(pl,p))))add('Garaget ligger över huset. Flytta garaget på tomten.');
      else{
        let dm=1e9;hw.polys.forEach(pl=>pl.forEach(a=>{gp.forEach(b=>{dm=Math.min(dm,Math.hypot(a[0]-b[0],a[1]-b[1]));});}));
        if(dm<4.5)add('Avståndet mellan hus och garage är ungefär '+pc(dm,1)+' m. För nära byggnader kan kräva brandskydd – kolla med kommunen.','i');
      }
      if($('dk').checked&&pdfDecks().some(d=>d.kind==='deck'&&d.polys.some(pp=>gp.some(p=>ptIn(pp.poly.map(hw.rp),p)))))add('Altanen ligger över garaget. Flytta det ena.');
    }
  }
  try{const bad=hallfast().filter(r=>!r.info&&r.u>1);if(bad.length)add(bad.length+' konstruktionsdel'+(bad.length>1?'ar':'')+' klarar inte den förenklade hållfasthetskontrollen: '+bad.map(r=>r.el).join(', ')+'. Se rutan Hållfasthetskontroll.');}catch(e){console.error(e);}
  const box=$('warn');if(!box)return;
  if(!W.length){box.innerHTML='<div class="wok">Inga varningar. Mängderna är ändå ungefärliga – kontrollera mot konstruktionsritning.</div>';return;}
  box.innerHTML='<div class="whd">Varningar och tips ('+W.length+')</div>'+W.map(x=>'<div class="'+(x.s==='i'?'wi':'ww')+'">'+(x.s==='i'?'ℹ️ ':'⚠️ ')+x.t+'</div>').join('')+'<div class="wnote">Tumregler – ersätter inte konstruktör eller kommunens bedömning.</div>';
}

(function(){let key='';const _c=calc;calc=function(){const r=_c.apply(this,arguments);const k=WINGS.map(w=>w.s).join(',');if(k!==key){key=k;try{drawEls();}catch(e){}}return r;};})();
