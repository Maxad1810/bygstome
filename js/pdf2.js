/* ---------- Extra PDF-sidor: kapningslista, kategorier, bygglov, snitt ---------- */
function carportPosts(gi){
  const n=Math.ceil(gi.L/3)+1,out=[];
  for(let i=0;i<n;i++){
    const x=.15+i*(gi.L-.3)/(n-1);
    [.15,gi.B-.15].forEach(z=>out.push([[x-.0475,z-.0475],[x+.0475,z-.0475],[x+.0475,z+.0475],[x-.0475,z+.0475]]));
  }
  return out;
}
function pdfSectionPage(doc,head,PW,PH,M0,c){
  head('Snitt genom v\u00e4gg, golv och takfot');
  const jd=(parseInt($('jd').value.split('x')[1])||195)/1000,dh=(parseInt($('dim').value.split('x')[1])||145)/1000;
  const rdim=$('rd').value.split('x').map(v=>parseInt(v)/1000),rh=rdim[1]||.145;
  const sc=100,fcRgb=hexRgb($('fc').value),rcRgb=hexRgb($('rcol').value);   // 1:10 => 100 mm per m
  const grOn=$('gr').value==='p',ph=grOn?(g0('ph')||.4):0,P=g0('P'),tn=Math.tan(P*Math.PI/180),co=Math.cos(P*Math.PI/180),O=g0('O');
  doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(30);doc.text('Skala 1:10 (A4)',M0,PH-12);
  const lbl=(x1,y1,x2,y2,t1,t2)=>{doc.setDrawColor(120);doc.setLineWidth(.12);doc.line(x1,y1,x2,y2);doc.setFontSize(7);doc.setFont('helvetica','bold');doc.setTextColor(30);doc.text(pdfSan(t1),x2+1.2,y2+.6);if(t2){doc.setFont('helvetica','normal');doc.setTextColor(100);doc.text(pdfSan(t2),x2+1.2,y2+3.6);}doc.setTextColor(30);};
  // ===== A: fundament, golv och vägg =====
  {
    const ox=40,oy=175,U=u=>ox+u*sc,V=v=>oy-v*sc;
    const R=(u1,v1,u2,v2,fill,line)=>{doc.setFillColor(...fill);doc.setDrawColor(...(line||[60,60,60]));doc.setLineWidth(.15);doc.rect(U(u1),V(v2),(u2-u1)*sc,(v2-v1)*sc,'FD');};
    doc.setFontSize(10);doc.setFont('helvetica','bold');doc.text('A \u2013 Golv, grund och yttervägg',M0,M0+16);
    // mark
    doc.setDrawColor(90);doc.setLineWidth(.3);doc.line(U(-.25),V(0),U(.6),V(0));doc.setLineWidth(.1);doc.setDrawColor(150);for(let u=-.25;u<.6;u+=.04)doc.line(U(u),V(0),U(u-.03),V(0)+2);
    const fo=ph+jd,y0=fo+jd+.022,wall=.45,x1=.059;
    if(grOn){R(x1+.02,0,x1+.18,ph,[170,175,175]);R(x1+.01,ph-.012,x1+.19,ph,[40,44,48]);}
    if(grOn)R(x1,ph,x1+.09,fo,[200,160,100]);
    // bjälke + isolering + vindskydd under
    const jb=grOn?fo:0.02;
    R(0,jb,.6,jb+jd,[232,170,185]);doc.setDrawColor(190,120,140);doc.setLineWidth(.1);for(let u=.02;u<.58;u+=.05)doc.line(U(u),V(jb+jd),U(u+.03),V(jb));
    R(.05,jb,.1,jb+jd,[205,165,100]);R(.3,jb,.35,jb+jd,[205,165,100]);
    doc.setDrawColor(60);doc.setLineWidth(.35);doc.line(U(0),V(jb),U(.6),V(jb));
    R(-.0,jb+jd-.0,.6,jb+jd+.022,[238,225,198]);
    // syll + vägg
    R(x1,y0-.0,x1+dh,y0+.045,[184,128,60]);
    const wt=y0+.045;
    R(x1,wt,x1+dh,wt+wall,[205,165,100]);R(x1+.0,wt,x1+dh,wt+wall,[232,170,185]);
    R(x1,wt,x1+.045,wt+wall,[205,165,100]);R(x1+dh-.045,wt,x1+dh,wt+wall,[205,165,100]);
    R(.05,y0-.12,x1,wt+wall,[205,200,150]);                              // vindskydd
    R(.022,y0-.12,.05,wt+wall,[245,240,225],[120,120,120]);R(.022+.0,y0-.12,.05,wt+wall,[245,240,225]);
    for(const uu of [.027,.043])doc.setDrawColor(190);
    R(.022,y0-.12,.05,y0-.09,[40,44,48]);                                // insektsnät
    R(0,y0-.12,.022,wt+wall,fcRgb);                                      // panel
    doc.setDrawColor(40,120,170);doc.setLineWidth(.4);doc.line(U(x1+dh),V(wt),U(x1+dh),V(wt+wall));   // ångspärr
    R(x1+dh,wt,x1+dh+.045,wt+wall,[205,165,100]);                         // installationsläkt
    if(c.gi&&false){}
    R(x1+dh+.045,wt,x1+dh+.058,wt+wall,[240,240,240]);                    // gips
    doc.setDrawColor(60);doc.setLineWidth(.3);doc.line(U(0)-2,V(wt+wall),U(x1+dh+.058)+2,V(wt+wall)+1.2);doc.line(U(0)-2,V(wt+wall)-1,U(x1+dh+.058)+2,V(wt+wall)+.2); // brytlinje
    // golv
    R(x1,y0-.022,x1+dh+.1,y0,[238,225,198]);
    // etiketter (höger)
    const LX=U(.7),ly=i=>66+i*7.4;
    const items=[
      [U(.011),V(wt+.3),'Fasadpanel 22 mm',($('pd').value==='s'?'st\u00e5ende':'liggande')],
      [U(.036),V(wt+.22),'Luftspalt 28 mm','str\u00f6l\u00e4kt 28\u00d770 c/c 600, insektsn\u00e4t nedtill'],
      [U(.0545),V(wt+.14),'Vindskyddsskiva 9 mm'],
      [U(x1+dh/2),V(wt+.08),'Regel '+$('dim').value+' + isolering '+nf(dh*1000)+' mm','c/c '+nf(g0('cc')*1000)+' mm'],
      [U(x1+dh),V(wt+.02),'\u00c5ngsp\u00e4rr (plastfolie)'],
      [U(x1+dh+.0225),V(wt-.0),'Installationsl\u00e4kt 45 mm'],
      [U(x1+dh+.0515),V(wt+.05),'Gips 13 mm'],
      [U(x1+dh/2),V(y0+.02),'Syll '+$('dim').value,'syllpapp under'],
      [U(.3),V(y0-.01),'Golvskiva 22 mm'],
      [U(.3),V(jb+jd/2),'Bj\u00e4lkar '+$('jd').value,'isolering, vindskydd under'],
      ...(grOn?[[U(x1+.1),V(ph/2),'Plint + b\u00e4rlina','plintpapp under b\u00e4rlina']]:[]),
      [U(.3),V(0),'Mark']
    ];
    items.forEach((it,i)=>lbl(it[0],it[1],LX,ly(i),it[2],it[3]));
    // mått
    doc.setFontSize(6.5);doc.setTextColor(60);doc.text('golv +'+nf(y0,2)+' m',U(-.24),V(y0)+.6);doc.text('mark \u00b10,00',U(-.24),V(0)-.8);doc.setTextColor(30);
  }
  // ===== B: takfot =====
  {
    const ox=218,oy=150,U=u=>ox+u*sc,V=v=>oy-v*sc;
    doc.setFontSize(10);doc.setFont('helvetica','bold');doc.setTextColor(30);doc.text('B \u2013 Takfot och takfall',175,M0+16);
    const R=(pts,fill,line)=>{doc.setFillColor(...fill);doc.setDrawColor(...(line||[60,60,60]));doc.setLineWidth(.15);const q=pts.map(p=>[U(p[0]),V(p[1])]);const rel=[];for(let i=1;i<q.length;i++)rel.push([q[i][0]-q[i-1][0],q[i][1]-q[i-1][1]]);doc.lines(rel,q[0][0],q[0][1],[1,1],'FD',true);};
    const x1=.059,wallTop=0,pl=.09;
    // vägg nedåt
    R([[0,-.4],[.022,-.4],[.022,0],[0,0]],fcRgb);
    R([[.022,-.4],[.05,-.4],[.05,0],[.022,0]],[245,240,225]);R([[.05,-.4],[.059,-.4],[.059,0],[.05,0]],[205,200,150]);
    R([[x1,-.4],[x1+dh,-.4],[x1+dh,0],[x1,0]],[232,170,185]);R([[x1,-.4],[x1+.045,-.4],[x1+.045,0],[x1,0]],[205,165,100]);R([[x1+dh-.045,-.4],[x1+dh,-.4],[x1+dh,0],[x1+dh-.045,0]],[205,165,100]);
    R([[x1+dh,-.4],[x1+dh+.045,-.4],[x1+dh+.045,0],[x1+dh,0]],[205,165,100]);R([[x1+dh+.045,-.4],[x1+dh+.058,-.4],[x1+dh+.058,0],[x1+dh+.045,0]],[240,240,240]);
    // ovanreglar
    R([[x1,0],[x1+dh,0],[x1+dh,pl],[x1,pl]],[184,128,60]);
    // takstol/sparre
    const vb=u=>pl+tn*(u-(x1+dh/2)),rt=rh/co,uE=-Math.min(O,.3),uI=.42;
    R([[uE,vb(uE)],[uI,vb(uI)],[uI,vb(uI)+rt],[uE,vb(uE)+rt]],[205,165,100]);
    const lay=[[.022/co,[238,225,198],'R\u00e5spont 22 mm'],[.004/co,[40,44,48],'Takpapp'],[.012/co,rcRgb,'Takpl\u00e5t']];
    let off=rt;const marks=[];
    lay.forEach(([t,col,nm])=>{R([[uE,vb(uE)+off],[uI,vb(uI)+off],[uI,vb(uI)+off+t],[uE,vb(uE)+off+t]],col);marks.push([nm,off+t/2]);off+=t;});
    // fotbräda + ränna + luftspalt
    R([[uE-.022,vb(uE)+rt-.145],[uE,vb(uE)+rt-.145],[uE,vb(uE)+rt],[uE-.022,vb(uE)+rt]],[205,165,100]);
    doc.setDrawColor(60);doc.setFillColor(...rcRgb);doc.setLineWidth(.2);doc.circle(U(uE-.08),V(vb(uE)+rt-.06),.06*sc,'FD');
    // luftspalt upp mot taket (pilar)
    doc.setDrawColor(40,120,170);doc.setLineWidth(.3);doc.line(U(.036),V(-.35),U(.036),V(-.02));doc.line(U(.036),V(-.02),U(.03),V(-.07));doc.line(U(.036),V(-.02),U(.042),V(-.07));
    const LX=U(.5),ly=i=>66+i*8;
    const it2=[
      [U(.3),V(vb(.3)+rt+.004+.011),'Takpl\u00e5t'],
      [U(.3),V(vb(.3)+rt+.002),'Takpapp'],
      [U(.3),V(vb(.3)+rt-.011),'R\u00e5spont 22 mm'],
      [U(.25),V(vb(.25)+rt/2),'Takstol/sparre '+$('rd').value,($('rt').value==='g'?'limtr\u00e4':'takstol')+' c/c '+nf(g0('ccT'),1)+' m'],
      [U(x1+dh/2),V(pl/2),'Ovanregel 2\u00d745 mm'],
      [U(uE-.011),V(vb(uE)+rt-.07),'Fotbr\u00e4da 22\u00d7145'],
      [U(uE-.08),V(vb(uE)+rt-.06),'H\u00e4ngr\u00e4nna'],
      [U(.036),V(-.2),'Luftspalt 28 mm','luft upp mot takfoten']
    ];
    it2.forEach((it,i)=>lbl(it[0],it[1],LX,ly(i),it[2],it[3]));
    doc.setFontSize(6.5);doc.setTextColor(60);doc.text('Takvinkel '+nf(P)+'\u00b0, takfot '+nf(O,2)+' m',U(-.3),V(-.38));doc.setTextColor(30);
  }
  doc.setFontSize(7.5);doc.setFont('helvetica','normal');doc.setTextColor(110);
  doc.text('Principsnitt (ej konstruktionsritning). Tjocklekar enligt standardval i appen. Kontrollera fukt, tätskikt och anslutningar mot detaljer från tillverkare och konstruktör.',M0,PH-18);
  doc.setTextColor(30);
}
function pdfExtraPages(doc,head,PW,PH,M0,c){
  // ----- Kapningslista -----
  const plan=cutPlan();
  const rows=[];
  plan.forEach(p=>{
    const buy=Object.keys(p.buys).map(Number).sort((a,b)=>b-a).map(S=>p.buys[S]+' \u00d7 '+nf(S,1)+' m').join(', ');
    rows.push({v:[p.dim,buy,nf(p.usedM,1)+' m',nf(p.stockM,1)+' m',nf(p.waste*100,1)+' %']});
    Object.entries(p.pat).sort((a,b)=>b[1]-a[1]).slice(0,4).forEach(([k,n])=>rows.push({v:['','   '+n+' \u00d7 '+k.replace(': ',' m \u2192 ').replace('\u2192','kapas'),'','','']}));
  });
  if(!rows.length)rows.push({sec:'Inga virkesrader'});
  pdfTable(doc,head,'Kapningslista \u2013 minst spill',[{t:'Dimension',x:M0},{t:'K\u00f6p (standardl\u00e4ngder)',x:M0+30},{t:'\u00c5tg\u00e5ng',x:M0+170},{t:'Ink\u00f6pt virke',x:M0+205},{t:'Spill',x:M0+245}],rows,PW,PH,M0,'Delarna packas i standardl\u00e4ngder 2,4\u20136,0 m med 4 mm s\u00e5gkapning. Antal delar kommer fr\u00e5n ink\u00f6pslistan.');
  // ----- Inköp per kategori -----
  const cats=catData(),r2=[];
  cats.forEach(cg=>{r2.push({sec:cg.cat+'  \u2013  '+nf(cg.sum)+' kr'});cg.rows.forEach(r=>r2.push({v:[r.name.slice(0,64),r.qty,r.mode?nf(rowCost(r))+' kr':'']}));});
  pdfTable(doc,head,'Ink\u00f6p per kategori (leverant\u00f6r)',[{t:'Artikel',x:M0},{t:'M\u00e4ngd',x:M0+150},{t:'Summa',x:M0+215}],r2,PW,PH,M0,'Gruppera ink\u00f6pen efter vilken butik eller leverant\u00f6r du handlar hos. Priserna \u00e4r riktpriser.');
  // ----- Bygglovskoll -----
  head('Bygglovskoll \u2013 grov v\u00e4gledning');
  const box=document.createElement('div');box.innerHTML=($('byggBox')&&$('byggBox').innerHTML)||'';
  const txt=[...box.querySelectorAll('p')].map(p=>p.textContent.replace(/\s+/g,' ').trim()).filter(Boolean);
  let y=M0+20;doc.setFontSize(9.5);doc.setFont('helvetica','normal');doc.setTextColor(30);
  txt.forEach(t=>{const lines=doc.splitTextToSize(pdfSan(t),PW-2*M0);if(y+lines.length*4.6>PH-16)return;doc.text(lines,M0,y);y+=lines.length*4.6+3;});
  // ----- Hållfasthetskontroll -----
  try{
    const R=hallfast(),cf=strCfg(),rows3=[];
    R.forEach(r=>{rows3.push({v:[r.el.slice(0,42),(r.dim||'').slice(0,36),(r.span||'').slice(0,26),r.info?'':nf(r.ub*100)+' %',r.info?'':nf(r.uv*100)+' %',r.info?'':nf(r.ud*100)+' %',strWord(r)]});if(r.hint)rows3.push({v:['','   '+r.hint.slice(0,120),'','','','','']});});
    if(!R.length)rows3.push({sec:'Inget att kontrollera'});
    pdfTable(doc,head,'H\u00e5llfasthetskontroll (f\u00f6renklad)',[{t:'Del',x:M0},{t:'M\u00e5tt och last',x:M0+62},{t:'Spann',x:M0+128},{t:'B\u00f6j',x:M0+170},{t:'Skj',x:M0+190},{t:'Nedb.',x:M0+210},{t:'Status',x:M0+232}],rows3,PW,PH,M0,'S0 '+nf(cf.S0,1)+' kN/m2, snö på tak '+nf(snowRoof(g0('P'),cf.S0),2)+' kN/m2, gamma_d '+nf(cf.gd,2)+'. Förenklad förkontroll enligt Eurokod 5 – ersätter inte konstruktör.');
  }catch(e){console.error(e);}
  // ----- Snitt -----
  if(c.hus||c.gi)pdfSectionPage(doc,head,PW,PH,M0,c);
}
