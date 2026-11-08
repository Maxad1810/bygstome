const $=id=>document.getElementById(id);
const nf=(v,d=0)=>v.toLocaleString('sv-SE',{minimumFractionDigits:d,maximumFractionDigits:d});
let ops=[{t:'f',w:1.2,h:1.2,n:6},{t:'d',w:0.9,h:2.1,n:2}];
const STD=[2.4,2.7,3.0,3.3,3.6,4.2,4.8,5.4];
let lastText='';
function drawOps(){
  $('ops').innerHTML=ops.map((o,i)=>`<div class="op">
  <label>Typ<select data-i="${i}" data-k="t"><option value="f"${o.t==='f'?' selected':''}>Fönster</option><option value="d"${o.t==='d'?' selected':''}>Dörr</option></select></label>
  <label>Bredd m<input type="number" step="0.1" min="0.3" value="${o.w}" data-i="${i}" data-k="w"></label>
  <label>Höjd m<input type="number" step="0.1" min="0.3" value="${o.h}" data-i="${i}" data-k="h"></label>
  <label>Antal<input type="number" step="1" min="1" value="${o.n}" data-i="${i}" data-k="n"></label>
  <label>Våning<select data-i="${i}" data-k="v">${['Alla',1,2,3].map((n,j)=>`<option value="${j}"${(o.v||0)===j?' selected':''}>${n}</option>`).join('')}</select></label>
  <button class="x" type="button" data-del="${i}" aria-label="Ta bort öppning">✕</button></div>`).join('');
}
$('ops').addEventListener('input',e=>{const t=e.target,i=t.dataset.i;if(i==null)return;ops[i][t.dataset.k]=t.dataset.k==='t'?t.value:(parseFloat(t.value)||0);calc();});
$('ops').addEventListener('click',e=>{const d=e.target.closest('[data-del]');if(d){ops.splice(+d.dataset.del,1);drawOps();calc();}});
$('add').onclick=()=>{ops.push({t:'f',w:1,h:1.2,n:1});drawOps();calc();};
function stdLen(m){for(const s of STD)if(m<=s+1e-9)return s;return Math.ceil(m*10)/10;}
const g=id=>parseFloat($(id).value)||0;const g0=g;
function sync(){
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
function deckRows(){
  if(!$('dk').checked)return null;
  const dl=g0('dkL'),dp=g0('dkD'),hd=g0('dkH'),sp=1+g0('S')/100,pc=Math.ceil;
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
    const Lr=dl+2*dp-(stairs?1:0),nposts=pc(Lr/1.2)+2;
    rows.push(['Räckesstolpar 95x95 (altan)',nf(nposts)+' st','längd 1,0 m · c/c max 1,2 m']);
    rows.push(['Handledare och ribbor 45x95 (altan)',nf(pc(Lr*3*sp/4.8))+' st','à 4,8 m · '+nf(Lr*3,1)+' m (3 rader)']);
  }
  if(stairs){
    const n=pc(top/.17),len=Math.hypot(top,n*.28)+.2;
    rows.push(['Trappvangar 45x195 (altan)','2 st','längd '+nf(len,1)+' m · '+nf(n)+' steg']);
    rows.push(['Trappsteg 28x120 (altan)',nf(n*2,0)+' m','2 plank per steg, bredd 1,0 m']);
    rows.push(['Plintar trappa (altan)','2 st','under trappvangarna']);
  }
  return rows;
}
function wcount(i){return Math.max(1,parseInt($('vw'+(i+1)).value)||1);}
function mcount(){return Math.max(1,parseInt($('vn').value)||1);}
function calc(){
  sync();wingSetup();
  const Nm=mcount(),WL=g('GL'),WB=g('GB'),L0=g('W1');
  const ROOF=['Tak','Plåtdetaljer och vindskivor','Hängrännor och stuprör'];
  const parts=[{nm:'Hus',N:Nm,main:true}];
  WINGS.forEach((w,i)=>parts.push({nm:'Vinge '+(i+1),N:wcount(i)}));
  let all=[];
  parts.forEach((pt,pi)=>{
    for(let k=0;k<pt.N;k++){
      const top=k===pt.N-1,opt={noGable:!top,noGrund:k>0,N:pt.N};
      let s;const so=ops;
      if(pt.main){
        const act=WINGS.filter((w,i)=>wcount(i)>k),plan=act.length?wingPlan(L0,WB,act):null;
        opt.segs=plan?plan.flat().map(q=>q.e-q.s):null;
        ops=so.filter(o=>!o.v||o.v===k+1);
      }else{
        Object.assign(opt,{wing:true,FL:WL,FW:WB,W1:WL,W2:WB,W3:WL,W4:(k>=Nm?WB:0),RL:WL,RW:WB,I:0});
        ops=[];
      }
      try{s=calcCore(opt);}finally{ops=so;}
      if(pt.main){const er=elRows(k);if(er.length)s.push(['El invändigt',er]);}
      if(!top)s=s.filter(x=>!ROOF.includes(x[0]));
      s.forEach(x=>{
        if(k>0&&x[0]==='Golv')x[0]='Mellanbjälklag';
        x[0]=(pt.N>1?'Våning '+(k+1)+' · ':'')+(pi>0?pt.nm+' – ':'')+x[0];
      });
      all=all.concat(s);
    }
  });
  const dr=deckRows();if(dr)all.push(['Altan',dr]);
  const shn={r:'',l:'L-form',t:'T-form',x:'X-form',u:'U-form'}[$('hs').value];
  TITLE='Stomkalkyl – hus '+nf(g('L'),1)+'×'+nf(g('W'),1)+' m'+(shn?' ('+shn+', vinge '+nf(WL,1)+'×'+nf(WB,1)+' m)':'')+(Nm>1?', '+Nm+' våningar (huvudhus)':'');
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
  const wallA=Math.max(0,per*H-openA)+((o&&o.noGable)?0:W*W*Math.tan(P*Math.PI/180)/2);
  const inA=wallA+I*H*2;
  const vind=Math.ceil(wallA*sp/3.24);
  const gips=Math.ceil(inA*sp/2.88);
  const ins=wallA*sp;
  // Tak
  const rad=P*Math.PI/180,eaveL=L+2*O,slope=(W/2+O)/Math.cos(rad);
  const roofA=2*eaveL*slope;
  const trusses=Math.ceil(L/ccT)+1;
  const lath=roofA/0.3*sp;
  const pc=Math.ceil,rows=pc(slope/.3)+1,strCnt=pc(eaveL/.6)+1;
  const strM=2*strCnt*slope*sp,latM=2*rows*eaveL*sp;
  const paperA=roofA*1.1*sp,rolls=pc(paperA/15);
  const pl=Math.ceil((slope+.05)*10)/10,plN=2*pc(eaveL/1.0);
  const gabM=4*slope,vsP=pc(gabM*sp/2),vtP=pc(gabM*sp/4.8),fotM=2*eaveL,fotP=pc(fotM*sp/2);
  const nockP=pc(eaveL*sp/2),hooks=2*(pc(eaveL/.6)+1),dpN=Math.max(2,pc(fotM/10)),dpL=H*((o&&o.N)||1)+.5;
  const grOn=$('gr').value==='p'&&!(o&&o.noGrund),ph=g('ph')||.4;
  const lines=pc(FW/2.4)+1,perLine=pc(FL/1.8)+1,plinN=lines*perLine,bmN=pc(lines*FL*sp/4.8)*2;
  const floorRows=[
    ...(grOn?[
      ['Plintar',nf(plinN)+' st','höjd '+nf(ph,2)+' m · '+nf(lines)+' rader × '+nf(perLine)+' st'],
      ['Bärlinor 2×'+jd,nf(bmN)+' st','à 4,8 m · '+nf(lines*FL,1)+' m, dubbla'],
      ['Plintpapp (kapillärbrytare)',nf(plinN)+' st','en under varje bärlina på plint']]:[]),
    ['Bjälkar '+jd,nf(jTot)+' st','längd '+nf(jl,1)+' m · c/c '+nf(jc*1000)+' mm'],
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
  const opRows=ops.filter(o=>o.n>0).map(o=>[(o.t==='f'?'Fönster ':'Dörr ')+nf(o.w*1000)+'×'+nf(o.h*1000)+' mm',nf(o.n)+' st','']);
  const rdim=$('rd').value,glu=$('rt').value==='g',rafL=Math.ceil((slope+.05)*10)/10,rafN=trusses*2;
  const roofFrame=glu?[
    ['Limträsparrar '+rdim,nf(rafN)+' st','längd '+nf(rafL,1)+' m · c/c '+nf(ccT,1)+' m, ett par per läge'],
    ['Limträ nockbalk '+rdim,nf(pc(eaveL/12))+' st','totalt '+nf(eaveL,1)+' m, max 12 m per balk'],
    ['Sparrbeslag/balkskor',nf(rafN*2)+' st','ett i vardera änden']
  ]:[
    ['Takstolar '+rdim,nf(trusses)+' st','spännvidd '+nf(W,1)+' m · c/c '+nf(ccT,1)+' m'],
    ['Takstolsbeslag',nf(trusses*2)+' st','2 per takstol']
  ];
  const sec=[
   ['Golv',floorRows],
   ['Väggstomme',[
    ['Reglar ytterväggar '+dim,nf(pc(studs*sp))+' st','längd '+nf(sl,1)+' m ('+nf(studs)+' st + spill, inkl. hörn, öppningar och gavelspetsar)'],
    ['Reglar innerväggar '+dim,nf(pc(inner*sp))+' st','längd '+nf(sl,1)+' m ('+nf(inner)+' st + spill)'],
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
    ['Takyta',nf(roofA,1)+' m²',''+nf(P)+'° · takfot '+nf(O,1)+' m'],
    
    ['Underlagstak/råspont',nf(roofA*sp,1)+' m²','med spill'],
    ['Underlagspapp (takpapp)',nf(rolls)+' rullar','à 15 m² · '+nf(paperA,1)+' m² inkl. 10 % överlapp och spill'],
    ['Ströläkt 25×48',nf(strM,0)+' m','c/c 600 mm, i takets lutningsriktning'],
    ['Tvärläkt/bärläkt (c/c 300 mm)',nf(latM,0)+' m',nf(2*rows)+' rader'],
    ['Takplåt',nf(plN)+' st','längd '+nf(pl,1)+' m · täckbredd 1,0 m · '+nf(roofA,1)+' m² tak'],
    ['Takskruv (plåt)',nf(pc(roofA*6*sp))+' st','ca 6 st/m²']]],
   ['Plåtdetaljer och vindskivor',[
    ['Vindskiva (trä) 22×145',nf(vtP)+' st','à 4,8 m · '+nf(gabM,1)+' m längs gavlarna'],
    ['Vindskiveplåt',nf(vsP)+' st','à 2 m · '+nf(gabM,1)+' m'],
    ['Takfotsplåt (droppkant)',nf(fotP)+' st','à 2 m · '+nf(fotM,1)+' m'],
    ['Nockplåt',nf(nockP)+' st','à 2 m · '+nf(eaveL,1)+' m'],
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
