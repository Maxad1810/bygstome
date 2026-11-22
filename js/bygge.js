/* Inköpslista (virkesoptimering + pris), takstolsritning och bjälklagsritning. */
const BG_DEF='3.0,3.6,4.2,4.8,5.4,6.0';
function bgStocks(){
  const v=($('bgLen')&&$('bgLen').value||BG_DEF).split(/[;,\s]+/).map(s=>parseFloat(s.replace(',','.'))).filter(x=>x>0.3&&x<20).sort((a,b)=>a-b);
  return (v.length?v:BG_DEF.split(',').map(Number)).map(x=>Math.round(x*1000));
}
function bgPrice(dim){
  if(/fasadpanel/.test(dim)||/^22x/.test(dim))return 27;
  try{const r=ROWS.find(r=>r.mode==='lm'&&r.name.indexOf(dim.replace('x','x'))>=0);if(r&&r.p>0)return r.p;}catch(e){}
  const h=+(dim.split('x')[1]||145);const ks=Object.keys(LUM).map(Number).sort((a,b)=>a-b),k=ks.find(x=>x>=h)||145;return LUM[k];
}
function bgOptimize(rows){
  const st=bgStocks(),max=st[st.length-1],kerf=3,by={};
  rows.forEach(r=>{(by[r.dim]=by[r.dim]||[]);for(let i=0;i<r.n;i++){let l=r.len;while(l>max){by[r.dim].push(max);l-=max;by[r.dim].skarv=(by[r.dim].skarv||0)+1;}if(l>0)by[r.dim].push(l);}});
  const out=[];
  Object.keys(by).sort().forEach(dim=>{
    const ps=by[dim].slice().sort((a,b)=>b-a),bins=[];
    ps.forEach(p=>{let b=bins.find(b=>b.u+p+kerf<=max);if(!b){b={u:0,c:0};bins.push(b);}b.u+=p+kerf;b.c++;});
    const buy={};let sum=0,use=0;
    bins.forEach(b=>{const s=st.find(s=>s>=b.u-kerf)||max;buy[s]=(buy[s]||0)+1;sum+=s;});
    ps.forEach(p=>use+=p);
    const pr=bgPrice(dim),items=Object.keys(buy).map(Number).sort((a,b)=>b-a).map(l=>({len:l,n:buy[l]}));
    out.push({dim,items,buyM:sum/1000,useM:use/1000,price:pr,cost:sum/1000*pr,waste:sum?(1-use/sum):0,skarv:by[dim].skarv||0,pieces:ps.length});
  });
  return out;
}
function bgRender(){
  const rows=klCollect(),box=$('bgOut');if(!box)return null;
  if(!rows||!rows.length){box.innerHTML='<p class="note">Ingen modell att räkna på än.</p>';return null;}
  const o=bgOptimize(rows);let tc=0,tm=0;
  let h='<table class="kl"><thead><tr><th>Dimension</th><th>Köp (antal × längd)</th><th>Meter</th><th>kr/m</th><th>Kostnad</th><th>Spill</th></tr></thead><tbody>';
  o.forEach(x=>{tc+=x.cost;tm+=x.buyM;h+='<tr><td>'+x.dim+'</td><td>'+x.items.map(i=>i.n+' × '+nf(i.len/1000,1)+' m').join(', ')+(x.skarv?' <em>('+x.skarv+' skarv)</em>':'')+'</td><td>'+nf(x.buyM,0)+'</td><td>'+nf(x.price,0)+'</td><td>'+nf(x.cost,0)+' kr</td><td>'+Math.round(x.waste*100)+' %</td></tr>';});
  h+='</tbody></table><p class="note"><b>Totalt '+nf(tc,0)+' kr</b> ('+nf(tm,0)+' m virke att köpa, riktpris inkl. moms). Kapplistans delar är packade i valda standardlängder med 3 mm sågsnitt. Delar längre än längsta längd måste skarvas.</p>';
  box.innerHTML=h;return o;
}
/* ----- PDF-sidor ----- */
function bgPdfBuy(doc,P){
  const rows=klCollect()||[],o=bgOptimize(rows);P.np('Inköpslista och kostnad');
  const x=[14,60,175,205,230,262];let y=26;doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(60);
  ['Dimension','Köp (antal x längd)','Meter','kr/m','Kostnad kr','Spill'].forEach((t,i)=>doc.text(pdfSan(t),x[i],y));
  doc.setFont('helvetica','normal');doc.setTextColor(20);y+=5;let tc=0,tm=0;
  o.forEach(r=>{
    const txt=r.items.map(i=>i.n+' x '+nf(i.len/1000,1)+' m').join(',  ')+(r.skarv?'  ('+r.skarv+' skarv)':'');
    const lines=doc.splitTextToSize(pdfSan(txt),110);
    if(y+lines.length*4>PH_-14){P.done();P.np('Inköpslista (forts.)');y=26;}
    doc.setFont('helvetica','bold');doc.text(pdfSan(r.dim),x[0],y);doc.setFont('helvetica','normal');
    doc.text(lines,x[1],y);doc.text(nf(r.buyM,0),x[2],y);doc.text(nf(r.price,0),x[3],y);doc.text(nf(r.cost,0),x[4],y);doc.text(Math.round(r.waste*100)+' %',x[5],y);
    tc+=r.cost;tm+=r.buyM;y+=lines.length*4+1.5;doc.setDrawColor(225);doc.line(14,y-3,PW_-14,y-3);
  });
  y+=3;doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text(pdfSan('Totalt '+nf(tc,0)+' kr  |  '+nf(tm,0)+' m virke att köpa (riktpris inkl. moms)'),14,y);
  doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(100);
  doc.text(pdfSan('Delarna är packade i standardlängder ('+bgStocks().map(v=>nf(v/1000,1)).join(', ')+' m) med 3 mm sågsnitt. Priser är riktpriser och kan ändras i prislistan.'),14,y+6);
  P.done();
}
const PW_=297,PH_=210;
function bgDimH(doc,x1,x2,y,t,fs){doc.setDrawColor(30);doc.setLineWidth(.15);doc.line(x1,y,x2,y);doc.line(x1,y-1.2,x1,y+1.2);doc.line(x2,y-1.2,x2,y+1.2);doc.setFontSize(fs||7);doc.setTextColor(20);doc.text(pdfSan(String(t)),(x1+x2)/2,y-1,{align:'center'});}
function bgDimV(doc,x,y1,y2,t){doc.setDrawColor(30);doc.setLineWidth(.15);doc.line(x,y1,x,y2);doc.line(x-1.2,y1,x+1.2,y1);doc.line(x-1.2,y2,x+1.2,y2);doc.setFontSize(7);doc.setTextColor(20);doc.text(pdfSan(String(t)),x+1.6,(y1+y2)/2,{angle:90,align:'center'});}
function bgPdfTruss(doc,P){
  const W=g0('RW'),L=g0('RL'),Pa=g0('P'),tn=Math.tan(Pa*Math.PI/180),tL=Math.tan(65*Math.PI/180),RK=roofKind(null),PU=roofIsPulpet(null),PD=roofDir(null),O=g0('O')||0,ccT=g0('ccT')||1.2;
  if(!(W>0&&L>0))return;P.np('Takstolar');
  const n=RK==='a'&&!PU?2:Math.ceil(L/ccT)+1,real=n>1?L/(n-1):L,dm=$('rd')?$('rd').value:'';
  const kind={s:'Sadeltak',x:'Saxtak',m:'Mansardtak',r:'Ramverk',a:'Takåsar (gavelstolar)',p:'Pulpettak'}[PU?'p':RK]||'Sadeltak';
  doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(30);doc.text(pdfSan(kind+' - takstol, '+dm+', '+n+' st'),14,26);
  doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(90);
  doc.text(pdfSan('Spännvidd '+Math.round(W*1000)+' mm  |  taklutning '+nf(Pa,0)+' grader  |  c/c '+Math.round(real*1000)+' mm (max '+Math.round(ccT*1000)+')  |  takfot '+Math.round(O*1000)+' mm  |  principskiss, takstolstillverkare/konstruktör dimensionerar'),14,31);
  // profil
  let pts,hr;const a1=.3*W/2,hK=a1*tL;
  if(PU){hr=tn*W;pts=PD===1?[[0,0],[W,0],[W,hr]]:[[0,0],[W,0],[0,hr]];}
  else if(RK==='m'){hr=hK+(W/2-a1)*tn;pts=[[0,0],[W,0],[W-a1,hK],[W/2,hr],[a1,hK]];}
  else{hr=tn*W/2;pts=[[0,0],[W,0],[W/2,hr]];}
  const bx={x:14,y:36,w:150,h:150},sc=Math.min((bx.w-30)/W,(bx.h-45)/hr),gx=bx.x+16,gy=bx.y+bx.h-22,X=v=>gx+v*sc,Y=v=>gy-v*sc;
  doc.setDrawColor(100,70,30);doc.setLineWidth(1.1);
  pts.forEach((p,i)=>{const q=pts[(i+1)%pts.length];doc.line(X(p[0]),Y(p[1]),X(q[0]),Y(q[1]));});
  doc.setLineWidth(.5);
  if(!PU&&RK!=='m'){const m=W/2;[W*.25,W*.75].forEach(x=>{const hh=tn*(x<m?x:W-x);doc.line(X(x),Y(0),X(x),Y(hh));});doc.line(X(m),Y(0),X(m),Y(hr));doc.line(X(W*.25),Y(0),X(m),Y(hr));doc.line(X(W*.75),Y(0),X(m),Y(hr));}
  else if(RK==='m'&&!PU){doc.line(X(a1),Y(0),X(a1),Y(hK));doc.line(X(W-a1),Y(0),X(W-a1),Y(hK));doc.line(X(W/2),Y(0),X(W/2),Y(hr));doc.line(X(a1),Y(0),X(W/2),Y(hr));doc.line(X(W-a1),Y(0),X(W/2),Y(hr));}
  else{[.33,.66].forEach(f=>{const x=W*f,hh=PD===1?tn*x:tn*(W-x);doc.line(X(x),Y(0),X(x),Y(hh));});}
  bgDimH(doc,X(0),X(W),gy+10,Math.round(W*1000)+' mm (spännvidd)',8);
  bgDimV(doc,X(W)+10,Y(0),Y(hr),Math.round(hr*1000)+' mm');
  // sparrlängder
  doc.setFontSize(7.5);doc.setTextColor(60);
  const seg=(a,b)=>Math.round(Math.hypot((b[0]-a[0]),(b[1]-a[1]))*1000);
  const tx=[];if(PU)tx.push('Snedsparre '+seg(pts[PD===1?1:0],pts[2])+' mm');
  else if(RK==='m'){tx.push('Nedre (brant) sparre '+seg(pts[0],pts[4])+' mm','Övre sparre '+seg(pts[4],pts[3])+' mm');}
  else tx.push('Sparre '+seg(pts[0],pts[2])+' mm (utan takfot)');
  tx.forEach((t,i)=>doc.text(pdfSan(t),gx,gy+20+i*4));
  // plan
  const px=180,py=50,pw=100,ph=Math.min(110,pw*L/W||100),s2=Math.min(pw/W,ph/L);
  doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(30);doc.text(pdfSan('Placering ovanifrån'),px,44);doc.setFont('helvetica','normal');
  const rw=W*s2,rl=L*s2;doc.setDrawColor(120);doc.setLineWidth(.4);doc.rect(px,py,rw,rl);
  doc.setDrawColor(150,100,40);doc.setLineWidth(.6);for(let i=0;i<n;i++){const y=py+(n>1?i*rl/(n-1):0);doc.line(px,y,px+rw,y);}
  bgDimH(doc,px,px+rw,py+rl+8,Math.round(W*1000)+' mm',7);bgDimV(doc,px+rw+8,py,py+rl,Math.round(L*1000)+' mm');
  doc.setFontSize(7.5);doc.setTextColor(60);doc.text(pdfSan(n+' takstolar, c/c ca '+Math.round(real*1000)+' mm'),px,py+rl+16);
  P.done();
}
function bgPdfFloor(doc,P){
  const FL=g0('FL'),FW=g0('FW'),jc=g0('jc')||.6,jd=$('jd')?$('jd').value:'45x195';
  if(!(FL>0&&FW>0)||!$('bHus')||!$('bHus').checked)return;P.np('Golvbjälklag');
  const n=Math.ceil(FL/jc)+1,real=FL/(n-1);
  doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(30);doc.text(pdfSan('Golvbjälkar '+jd+' c/c '+Math.round(jc*1000)+' mm'),14,26);
  doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(90);
  doc.text(pdfSan(n+' bjälkar a '+Math.round(FW*1000)+' mm (spännvidd) + 2 randbjälkar '+Math.round(FL*1000)+' mm. Verkligt c/c '+Math.round(real*1000)+' mm. Kontrollera spännvidd mot konstruktör.'),14,31);
  const bx={x:14,y:36,w:269,h:150},sc=Math.min((bx.w-40)/FL,(bx.h-50)/FW),gx=bx.x+14,gy=bx.y+22,X=v=>gx+v*sc,Y=v=>gy+v*sc;
  doc.setDrawColor(90);doc.setLineWidth(.3);doc.setFillColor(235,205,150);
  doc.rect(X(0),Y(0),FL*sc,.045*sc+.3,'FD');doc.rect(X(0),Y(FW)-.045*sc,FL*sc,.045*sc+.3,'FD');
  for(let i=0;i<n;i++){const x=i*real,xx=Math.min(Math.max(x-.0225,0),FL-.045);doc.rect(X(xx),Y(.045),.045*sc+.3,(FW-.09)*sc,'FD');
    if(sc*real>7){doc.setFontSize(5.5);doc.setTextColor(120);doc.text(String(i+1),X(xx)+.1,Y(FW)+4.5);}}
  doc.setTextColor(20);
  bgDimH(doc,X(0),X(FL),Y(FW)+12,Math.round(FL*1000)+' mm',8);bgDimV(doc,X(FL)+8,Y(0),Y(FW),Math.round(FW*1000)+' mm');
  if(n>2)bgDimH(doc,X(0),X(real),Y(0)-5,'c/c '+Math.round(real*1000),7);
  P.done();
}
function bgPdfPages(doc,P){bgPdfBuy(doc,P);bgPdfTruss(doc,P);bgPdfFloor(doc,P);}
(function(){const b=$('bgBtn');if(b)b.onclick=bgRender;})();
