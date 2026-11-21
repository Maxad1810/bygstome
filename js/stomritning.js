/* PDF: kapplista + stomritning (reglar, syll, ovanregel, bärlinor) med mått för varje vägg. */
function skWallSpec(kind,wall,k,N){
  const P=g0('P'),tn=Math.tan(P*Math.PI/180),tL=Math.tan(65*Math.PI/180),gar=kind==='g',gi=gar?garageInfo():null;
  const o=gar?{wing:true,gar:true}:null,PU=roofIsPulpet(o),PD=roofDir(o),RK=roofKind(o);
  const ws=gar?[gi.L,gi.B,gi.L,gi.B]:[g0('W1'),g0('W2'),g0('W3'),g0('W4')],H=gar?gi.H:g0('H2'),RW=gar?gi.B:g0('RW'),len=ws[wall];
  const top=(gar||k===N-1);let fn=null,maxTop=H;
  if(top&&len>0){
    if(PU){const hi=PD===1?2:0;
      if(wall===hi)fn=()=>H+tn*RW;
      else if(wall===1||wall===3){fn=x=>{const f=Math.max(0,Math.min(1,x/len)),fr=(PD===1)===(wall===1)?f:1-f;return H+tn*RW*fr-.05;};}
    }else if(wall===1||wall===3){
      fn=x=>{const d=Math.max(0,RW/2-Math.abs(x-len/2));if(RK==='m'){const a1=.3*RW/2,hK=a1*tL;return H+(d<=a1?d*tL:hK+(d-a1)*tn)-.05;}return H+tn*d-.05;};
    }
    if(fn){maxTop=0;for(let i=0;i<=40;i++)maxTop=Math.max(maxTop,fn(len*i/40));}
  }
  const ol=gar?(gi.gops||[]).filter(x=>x.wall===wall).map((x,i)=>({id:(x.t==='f'?'GF':x.t==='p'?'GP':'GD')+(i+1),c:x.c,w:x.w,h:x.h,t:x.t,sill:x.t==='f'?.9:0}))
    :pdfOpenList().filter(x=>x.grp==='Hus'&&x.wall===wall&&x.k===k).map(x=>({id:x.id,c:x.c,w:x.w,h:x.h,t:x.t,sill:x.sill}));
  return {title:(gar?'Garage':'Hus')+' - vägg '+(wall+1)+(gar?'':' - våning '+(k+1)),len,H,top:fn,maxTop,ops:ol};
}
function skDrawWall(doc,box,s){
  const dim=($('dim').value||'45x145').split('x').map(Number),t=(dim[0]||45)/1000,dd=(dim[1]||145)/1000,cc=g0('cc')||.6;
  const len=s.len,H=s.H,topF=s.top||(()=>H),pl=.045,pt=.09;
  doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(30);doc.text(pdfSan(s.title),box.x,box.y+4);
  doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(90);
  doc.text(pdfSan('Reglar '+Math.round(t*1000)+'x'+Math.round(dd*1000)+' c/c '+Math.round(cc*1000)+' mm  |  syll '+Math.round(t*1000)+'x'+Math.round(dd*1000)+'  |  ovanregel 2x'+Math.round(t*1000)+'x'+Math.round(dd*1000)+'  |  barlina 2x'+Math.round(t*1000)+'x145 over oppningar  |  alla matt i mm'.replace('barlina','bärlina').replace('over','över').replace('oppningar','öppningar').replace('alla matt','alla mått')),box.x,box.y+8);
  const mT=16,mL=18,mR=22,mB=22,sc=Math.min((box.w-mL-mR)/len,(box.h-mT-mB)/s.maxTop),gx=box.x+mL,gy=box.y+box.h-mB;
  const X=x=>gx+x*sc,Y=y=>gy-y*sc;
  const fill=(c)=>doc.setFillColor(c[0],c[1],c[2]);
  const rect=(x1,y1,x2,y2,c)=>{if(x2-x1<=0||y2-y1<=0)return;fill(c);doc.setDrawColor(90);doc.setLineWidth(.12);doc.rect(X(x1),Y(y2),(x2-x1)*sc,(y2-y1)*sc,'FD');};
  const STUD=[235,205,150],PL=[205,160,95],HD=[190,140,80];
  const opsz=s.ops.map(o=>{const c=Math.min(Math.max(o.c,o.w/2),len-o.w/2);return {...o,c,x1:c-o.w/2,x2:c+o.w/2,yh:o.sill+o.h};});
  // syll
  rect(0,0,len,pl,PL);
  // ovanregel (2 lager), följer ev. sluttande topp
  const N=Math.max(2,Math.ceil(len/.25)),xs=[];for(let i=0;i<=N;i++)xs.push(len*i/N);
  if(s.top){
    const up=xs.map(x=>[X(x),Y(topF(x))]),lo=xs.map(x=>[X(x),Y(topF(x)-pt)]).reverse();
    fill(PL);doc.setDrawColor(90);doc.setLineWidth(.12);
    const pts=up.concat(lo);doc.lines(pts.slice(1).map((p,i)=>[p[0]-pts[i][0],p[1]-pts[i][1]]),pts[0][0],pts[0][1],[1,1],'FD',true);
    doc.setLineWidth(.1);doc.lines(xs.slice(1).map((x,i)=>[X(x)-X(xs[i]),Y(topF(x)-pl)-Y(topF(xs[i])-pl)]),X(0),Y(topF(0)-pl),[1,1],'S');
  }else{rect(0,H-pt,len,H,PL);doc.setLineWidth(.1);doc.setDrawColor(90);doc.line(X(0),Y(H-pl),X(len),Y(H-pl));}
  const topAt=x=>topF(Math.max(0,Math.min(len,x)))-pt;
  const stud=(xc,y1,y2)=>rect(xc-t/2,y1,xc+t/2,y2,STUD);
  // grid
  const grid=[];for(let x=t/2;x<len-t/2;x+=cc)grid.push(x);grid.push(len-t/2);
  const zone=x=>opsz.find(o=>x>o.x1-2*t-.001&&x<o.x2+2*t+.001);
  grid.forEach(x=>{if(!zone(x))stud(x,pl,topAt(x));});
  opsz.forEach(o=>{
    // kungsreglar och stödreglar
    [[o.x1-2*t,o.x1-t,o.x1],[o.x2+t,o.x2+2*t,o.x2]].forEach(([k1,k2,j])=>{
      rect(Math.min(k1,k2,j===o.x1?k1:o.x2+t),pl,Math.max(k1,k2),topAt(k1),STUD);
    });
    rect(o.x1-2*t,pl,o.x1-t,topAt(o.x1-1.5*t),STUD);rect(o.x2+t,pl,o.x2+2*t,topAt(o.x2+1.5*t),STUD);
    rect(o.x1-t,pl,o.x1,o.yh,STUD);rect(o.x2,pl,o.x2+t,o.yh,STUD);
    // bärlina
    rect(o.x1-t,o.yh,o.x2+t,o.yh+.145,HD);
    // öppning
    doc.setDrawColor(40,110,170);doc.setLineWidth(.2);doc.setLineDashPattern([1.2,.8],0);doc.rect(X(o.x1),Y(o.yh),o.w*sc,o.h*sc,'S');doc.setLineDashPattern([],0);
    // knekt över och under
    const inside=grid.filter(x=>x>o.x1+t/2&&x<o.x2-t/2);const cr=inside.length?inside:[o.c];
    cr.forEach(x=>{stud(x,o.yh+.145,topAt(x));if(o.sill>0)stud(x,pl,o.sill-pl);});
    if(o.sill>0)rect(o.x1,o.sill-pl,o.x2,o.sill,HD);
    doc.setFontSize(6.5);doc.setTextColor(30,80,140);doc.setFont('helvetica','bold');
    const cx=X(o.c);doc.text(pdfSan(o.id),cx,Y(o.sill+o.h/2)-.5,{align:'center'});doc.setFont('helvetica','normal');
    doc.text(pdfSan(Math.round(o.w*1000)+'x'+Math.round(o.h*1000)+(o.sill?'  UK '+Math.round(o.sill*1000):'')),cx,Y(o.sill+o.h/2)+2.6,{align:'center'});
  });
  // mått
  const tick=(x,y,dx,dy)=>doc.line(x-dx,y-dy,x+dx,y+dy);
  const dimH=(x1,x2,y,txt,fs)=>{doc.setDrawColor(30);doc.setLineWidth(.15);doc.line(X(x1),y,X(x2),y);tick(X(x1),y,1.2,1.2);tick(X(x2),y,1.2,1.2);doc.setFontSize(fs||6.5);doc.setTextColor(20);doc.text(pdfSan(String(txt)),(X(x1)+X(x2))/2,y-1,{align:'center'});};
  const pts=[0,len];opsz.forEach(o=>pts.push(o.x1,o.x2));
  const u=[...new Set(pts.map(v=>Math.round(v*1000)))].sort((a,b)=>a-b).map(v=>v/1000);
  for(let i=0;i<u.length-1;i++){if((u[i+1]-u[i])*sc>6)dimH(u[i],u[i+1],gy+7,Math.round((u[i+1]-u[i])*1000));}
  dimH(0,len,gy+14,Math.round(len*1000)+' mm',7.5);
  // höjdmått
  const dimV=(y1,y2,x,txt)=>{doc.setDrawColor(30);doc.setLineWidth(.15);doc.line(x,Y(y1),x,Y(y2));tick(x,Y(y1),1.2,1.2);tick(x,Y(y2),1.2,1.2);doc.setFontSize(6.5);doc.setTextColor(20);doc.text(pdfSan(String(txt)),x+1.5,(Y(y1)+Y(y2))/2,{angle:90});};
  dimV(0,s.top?s.maxTop:H,X(len)+9,Math.round((s.top?s.maxTop:H)*1000));
  if(s.top)dimV(0,H,X(0)-8,Math.round(H*1000)+' (vid hörn)');
  const sl=Math.round((H-pl-pt)*1000);doc.setFontSize(6.5);doc.setTextColor(90);doc.text(pdfSan('Regellängd (full vägghöjd) '+sl+' mm'),gx,gy+19.5);
}
function skBuildPdf(){
  const JS=window.jspdf&&window.jspdf.jsPDF;if(!JS)throw new Error('PDF-biblioteket saknas');
  const doc=new JS({orientation:'landscape',unit:'mm',format:'a4'}),PW=297,PH=210;
  const name=($('pjName')&&$('pjName').value.trim())||'Stomkalkyl';
  const head=t=>{doc.setFont('helvetica','bold');doc.setFontSize(14);doc.setTextColor(30);doc.text(pdfSan(t),14,14);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(110);doc.text(pdfSan(name+'  |  '+new Date().toLocaleDateString('sv-SE')),PW-14,14,{align:'right'});doc.setDrawColor(200,120,30);doc.setLineWidth(.5);doc.line(14,17,PW-14,17);};
  const foot=n=>{doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(120);doc.text('Planeringsunderlag. Kontrollera mått mot konstruktionsritning.',14,PH-6);doc.text('Sida '+n,PW-14,PH-6,{align:'right'});};
  let page=1;
  // kapplista
  head('Kapplista');
  const rows=klCollect()||[];
  const lineH=4.1,colW=(PW-28)/3,perCol=Math.floor((PH-34)/lineH);let idx=0,col=0,y0=24,curDim='';
  const colHead=x=>{doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(60);doc.text('Dimension',x,y0);doc.text('Längd mm',x+colW*.48,y0,{align:'right'});doc.text('Antal',x+colW*.66,y0,{align:'right'});doc.text('Summa m',x+colW*.86,y0,{align:'right'});doc.setFont('helvetica','normal');};
  colHead(14);let line=1;
  rows.forEach(r=>{
    if(line>=perCol){col++;line=1;curDim='';if(col>2){foot(page);doc.addPage();page++;head('Kapplista (forts.)');col=0;}colHead(14+col*colW);}
    const x=14+col*colW,y=y0+line*lineH;doc.setFontSize(7);doc.setTextColor(20);
    if(r.dim!==curDim){doc.setFont('helvetica','bold');doc.text(pdfSan(r.dim),x,y);doc.setFont('helvetica','normal');curDim=r.dim;}
    doc.text(String(r.len),x+colW*.48,y,{align:'right'});doc.text(String(r.n),x+colW*.66,y,{align:'right'});doc.text(pdfSan(nf(r.len*r.n/1000,1)),x+colW*.86,y,{align:'right'});
    line++;
  });
  foot(page);
  // väggar
  const walls=[],N=mcount();
  if($('bHus').checked)for(let k=0;k<N;k++)for(let w=0;w<4;w++){if(g0('W'+(w+1))>0)walls.push(skWallSpec('h',w,k,N));}
  const gi=garageInfo();if(gi&&gi.type!=='c')for(let w=0;w<4;w++)walls.push(skWallSpec('g',w,0,1));
  for(let i=0;i<walls.length;i+=2){
    doc.addPage();page++;head('Stomritning - väggar');
    skDrawWall(doc,{x:14,y:20,w:PW-28,h:86},walls[i]);
    if(walls[i+1])skDrawWall(doc,{x:14,y:108,w:PW-28,h:86},walls[i+1]);
    foot(page);
  }
  return doc;
}
async function skSave(){
  if(!$('bHus').checked&&!garageInfo()){pMsg('Slå på Hus eller Garage i lagerlistan först.');return;}
  try{
    const doc=skBuildPdf(),buf=doc.output('arraybuffer');
    const nm=(($('pjName')&&$('pjName').value)||'stomkalkyl').replace(/[^\wåäöÅÄÖ\- ]+/g,'').trim().replace(/\s+/g,'-')||'stomkalkyl',fn=nm+'-kapplista-stomritning.pdf';
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([buf],{type:'application/pdf'}));a.download=fn;document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},800);
    pMsg('Kapplista och stomritning skapades: '+fn);
  }catch(e){console.error(e);pMsg('Kunde inte skapa PDF: '+e.message);}
}
(function(){const b=$('klPdf');if(b)b.onclick=skSave;})();
