/* ---------- Byggritning: ett A3-blad i arkitektstil (plan, sektion, fasader, ritningsstämpel) ---------- */
function archMm(v){return String(Math.round(v*1000));}
function archTitleBlock(doc,x,y,w,h,titel,datum,scale,what){
  const c1=x+38,c2=x+w-48;
  doc.setDrawColor(0);doc.setLineWidth(.5);doc.rect(x,y,w,h);
  doc.setLineWidth(.35);doc.line(c1,y,c1,y+h);doc.line(c2,y,c2,y+h);
  const r=h/3;doc.line(x,y+r,c1,y+r);doc.line(x,y+2*r,c1,y+2*r);
  doc.setFont('helvetica','normal');doc.setFontSize(5.5);doc.setTextColor(60);
  ['NAMN:','FASTIGHET:','KOMMUN:'].forEach((t,i)=>doc.text(t,x+1.5,y+i*r+3.6));
  doc.setDrawColor(150);doc.setLineWidth(.15);doc.setLineDashPattern([.6,.8],0);
  [0,1,2].forEach(i=>doc.line(x+1.5,y+i*r+r-3,c1-1.5,y+i*r+r-3));doc.setLineDashPattern([],0);
  doc.setDrawColor(0);doc.setLineWidth(.35);doc.line(c1,y+14,c2,y+14);
  doc.setFontSize(15);doc.setTextColor(70);doc.text('BYGGRITNING',(c1+c2)/2,y+10.5,{align:'center'});
  let fs=24;doc.setFont('helvetica','bold');doc.setTextColor(0);
  const nm=pdfSan(titel).toUpperCase();doc.setFontSize(fs);
  while(fs>8&&doc.getTextWidth(nm)>c2-c1-6){fs-=1;doc.setFontSize(fs);}
  doc.text(nm,(c1+c2)/2,y+14+(h-14)/2+fs*.17,{align:'center'});
  const q=h/4;doc.setLineWidth(.35);doc.line(c2,y+q,x+w,y+q);doc.line(c2,y+2*q,x+w,y+2*q);doc.line(c2,y+3*q,x+w,y+3*q);
  doc.setFont('helvetica','normal');doc.setFontSize(5.5);doc.setTextColor(60);
  doc.text('DATUM',c2+1.5,y+q+3.4);doc.text('TYP',c2+1.5,y+2*q+3.4);doc.text('SKALA',c2+1.5,y+3*q+3.4);
  doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(0);
  doc.text(pdfSan(what),c2+2,y+q-3.2);
  doc.setFontSize(8.5);doc.text(pdfSan(datum),c2+2,y+2*q-2.6);doc.text('Stomkalkyl',c2+2,y+3*q-2.6);doc.text(pdfSan(scale),c2+2,y+4*q-2.6);
  doc.setFont('helvetica','normal');
}
function archHatchGround(doc,x1,x2,y){
  doc.setDrawColor(0);doc.setLineWidth(.5);doc.line(x1,y,x2,y);
  doc.setLineWidth(.12);doc.setDrawColor(110);for(let x=x1+1;x<x2-1;x+=2.2)doc.line(x,y,x-1.6,y+1.8);
}
function pdfArchSection(doc,c,box){
  const ws1=c.ws1,Htot=c.Htot,ridge=c.ridge,O=c.O,tn=c.tn,RW=c.RW,y00=c.y00,jh=c.jh,tw=c.tw,floors=c.floors;
  const F=pdfFit(-O-.2,ws1+O+.2,-.4,ridge+.15,box),P=F.P;
  const R=(u1,v1,u2,v2,fill,lw)=>{const a=P(u1,v2),b=P(u2,v1);doc.setFillColor(...fill);doc.setDrawColor(0);doc.setLineWidth(lw||.3);doc.rect(a[0],a[1],b[0]-a[0],b[1]-a[1],'FD');};
  const g1=P(-O-.2,0),g2=P(ws1+O+.2,0);archHatchGround(doc,g1[0],g2[0],g1[1]);
  if(c.grOn){[tw/2,ws1-tw/2].forEach(u=>{R(u-.11,0,u+.11,c.ph,[225,225,225],.3);R(u-.25,-.3,u+.25,0,[245,245,245],.25);});}
  const sb=y00-jh-.022;
  R(0,sb,ws1,y00,[255,255,255],.35);
  doc.setLineWidth(.1);doc.setDrawColor(130);for(let u=tw+.2;u<ws1-tw;u+=.6){const a=P(u,sb+.02),b=P(u+.12,y00-.02);doc.line(a[0],a[1],b[0],b[1]);}
  floors.forEach(fy=>{R(0,fy,ws1,fy+jh+.022,[255,255,255],.35);});
  const half=RW/2+O,cxm=ws1/2,ev=Htot-tn*O,rt=.2,pu=c.pu,mu=u=>pu&&pu.dir===-1?ws1-u:u;
  const rp=pu?[[mu(-O),ev],[mu(ws1),ridge],[mu(ws1),ridge-rt],[mu(-O),ev-rt]]:[[cxm-half,ev],[cxm,ridge],[cxm+half,ev],[cxm+half,ev-rt],[cxm,ridge-rt],[cxm-half,ev-rt]];
  doc.setFillColor(255,255,255);doc.setDrawColor(0);doc.setLineWidth(.5);pdfPoly(doc,rp,P,'FD');
  doc.setDrawColor(90);doc.setLineWidth(.15);const ca=P(tw,Htot),cb=P(ws1-tw,Htot);doc.line(ca[0],ca[1],cb[0],cb[1]);
  doc.setFillColor(0,0,0);doc.setDrawColor(0);
  [[0,tw],[ws1-tw,ws1]].forEach(([u1,u2])=>{const hiW=pu&&((pu.dir===1&&u1>0)||(pu.dir===-1&&u1===0)),a=P(u1,hiW?ridge-rt:Htot),b=P(u2,sb);doc.rect(a[0],a[1],b[0]-a[0],b[1]-a[1],'FD');});
  const ar=P(ws1-tw,y00),at=P(ws1-tw,Htot);
  pdfDim(doc,[ar[0]-5,ar[1]],[ar[0]-5,at[1]],0,archMm(Htot-y00),7,0);
  const rb=P(ws1+O+.25,0),rt2=P(ws1+O+.25,ridge);
  pdfDim(doc,rb,rt2,5,archMm(ridge),7,0);
  const lb=P(0,-.4),rb2=P(ws1,-.4);
  pdfDim(doc,lb,rb2,3.5,archMm(ws1),7,1);
  doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(0);
  const ap=pu?P(mu(.9),ev+tn*.9+.3):P(cxm-half+.25,ev+.32);doc.text(pdfSan(nf(c.P,1)+'°'),ap[0],ap[1]);
  return F;
}
function archSheet(doc,o){
  const PW=420,PH=297;
  doc.setDrawColor(0);doc.setLineWidth(.9);doc.rect(10,10,PW-20,PH-20);
  doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(0);
  doc.text('Ritat i Stomkalkyl',PW-14,17,{align:'right'});
  const ratios=[50,75,100,125,150,200,250,300,400,500];
  const hasR=!!o.elev,planBox=hasR?{x:38,y:40,w:168,h:108}:{x:60,y:40,w:300,h:200};
  const F=pdfDrawPlan(doc,o.d,planBox,{mg:0,roof:false,dims:true,arch:true});
  let planRatio=F?F.ratio:50;
  if(F){
    const P=F.P;
    if(o.inner){const q=P(o.inner.x,o.inner.z);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(0);doc.text(pdfSan(o.inner.t),q[0],q[1],{align:'center'});}
    if(o.sect&&!o.d.rotated){
      const x=o.d.ws[0]/2,a=P(x,.35),b=P(x,o.d.ws[1]-.35);
      doc.setDrawColor(0);doc.setLineWidth(.35);doc.setLineDashPattern([5,1.2,1,1.2],0);doc.line(a[0],a[1],b[0],b[1]);doc.setLineDashPattern([],0);
      [a,b].forEach((q,i)=>{const dy=i?1:-1;doc.setFillColor(0);doc.triangle(q[0],q[1],q[0]-3.2,q[1]-dy*1.1,q[0]-3.2,q[1]+dy*1.1,'F');});
      doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(0);
      doc.text('A',b[0]+1.2,b[1]+4.5);doc.text('A',a[0]+1.2,a[1]-2.5);
    }
    doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(0);
    const bx=planBox.x,by=planBox.y+planBox.h+14;
    doc.text(pdfSan(o.planLabel+' 1:'+F.ratio),bx,by);
    doc.setFont('helvetica','normal');doc.setFontSize(9);doc.text(pdfSan('BYGGAREA '+o.area),bx,by+5);
  }
  let elevRatio=null;
  if(o.elev){
    const cfg=o.elev.cfg;cfg.arch=true;
    const ax=232,ay=30,cellW=(PW-10-6-ax)/2,cellH=96;
    const maxW=Math.max(...cfg.ws)+2*cfg.O+.4,maxH=cfg.ridge+.3;
    const sc0=Math.min((cellW-6)/maxW,(cellH-13)/maxH),ratio=ratios.find(r=>1000/r<=sc0)||500,sc=1000/ratio;
    elevRatio=ratio;
    for(let w=0;w<4;w++)pdfElevCell(doc,cfg,w,ax+(w%2)*(cellW+6),ay+Math.floor(w/2)*(cellH+4),cellW,cellH,sc,o.elev.names[w]);
    doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(0);doc.text('FASADER 1:'+ratio,ax,ay+2*cellH+10);
  }
  let secRatio=null;
  if(o.section){
    const S=pdfArchSection(doc,o.section,{x:38,y:186,w:170,h:80});secRatio=S.ratio;
    doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(0);doc.text('SEKTION A-A 1:'+S.ratio,38,282);
  }
  const sc=[planRatio,secRatio,elevRatio].filter(v=>v);
  const uniq=[...new Set(sc)].map(v=>'1:'+v).join(' / ');
  archTitleBlock(doc,PW-10-6-168,PH-10-6-46,168,46,o.titel,o.datum,uniq,o.what);
  doc.setFont('helvetica','normal');doc.setFontSize(6);doc.setTextColor(110);
  doc.text('Planeringsunderlag. Kontrollera mått och konstruktion mot konstruktionsritning.',PW-14,PH-12.5,{align:'right'});
}
function pdfArchBuild(){
  const JS=window.jspdf&&window.jspdf.jsPDF;if(!JS)throw new Error('PDF-biblioteket saknas');
  const doc=new JS({orientation:'landscape',unit:'mm',format:'a3'});
  const titel=$('pjName').value.trim()||'Ritning',datum=new Date().toLocaleDateString('sv-SE');
  const g=g0,N=mcount(),ws=[g('W1'),g('W2'),g('W3'),g('W4')],H=g('H2'),P_=g('P'),gi=garageInfo(),hus=$('bHus').checked;
  const jh=(parseInt($('jd').value.split('x')[1])||195)/1000,grOn=$('gr').value==='p',fo=(grOn?(g('ph')||.4)+jh:0),y00=fo+jh+.022,tn=Math.tan(P_*Math.PI/180),RW=g('RW'),O_=g('O');
  const PUh=roofIsPulpet(null),Htot=y00+N*H+(N-1)*(jh+.022),ridge=Htot+tn*(PUh?RW:RW/2),yFloor=k=>y00+k*(H+jh+.022);
  const floors=[];for(let k=1;k<N;k++)floors.push(y00+k*(H+jh+.022)-jh-.022);
  const dh=(parseInt($('dim').value.split('x')[1])||145)/1000,tw=dh+.12;
  const olist=pdfOpenList();let first=true;
  const newPage=()=>{if(!first)doc.addPage();first=false;};
  if(hus){
    const maxK=Math.max(N,...WINGS.map((w,i)=>wcount(i)));
    let wingA=0;WINGS.forEach(w=>{wingA+=g('GL')*g('GB');});
    const ok=$('hs').value==='r';
    const houseCfg={pu:PUh?{dir:roofDir(null)}:null,ws,Htot,ridge,O:O_,tn,RW,gable:[false,true,false,true],floors,levels:[],yFloor,ops:olist.filter(o=>o.grp==='Hus'),kn:$('kn').checked?$('kc').value:null,caps:capInfos().filter(c=>c.host==='h'),plinth:grOn?fo-jh:0,bodyBottom:grOn?fo-jh:0,panelStd:$('pd').value==='s',decks:pdfDecks(),ps:[[0,0],[ws[0],0],[ws[0],ws[1]],[ws[0]-ws[2],ws[1]]]};
    for(let k=0;k<N;k++)houseCfg.levels.push(yFloor(k));
    for(let k=0;k<maxK;k++){
      newPage();
      const d=pdfPlanData(k,false),ia=(ws[0]-2*tw)*(ws[1]-2*tw);
      archSheet(doc,{d,titel,datum,planLabel:maxK>1?'PLAN VÅNING '+(k+1):'PLAN',area:nf(ws[0]*ws[1]+wingA,1)+' m²',what:k===0?'PLAN/SEKTION/FASAD':'PLAN VÅN '+(k+1),
        inner:ok&&ia>0&&!IW.some(w=>(w.k||0)===k)?{x:ws[0]*.25,z:ws[1]/2,t:nf(ia,1)+' m²'}:null,sect:k===0,
        elev:k===0?{cfg:houseCfg,names:['Framsida','Höger sida','Baksida','Vänster sida']}:null,
        section:k===0?{pu:houseCfg.pu,ws1:ws[1],Htot,ridge,O:O_,tn,RW,y00,jh,tw,floors,grOn,ph:g('ph')||.4,P:P_}:null});
    }
  }
  if(gi){
    newPage();
    const gps=[[0,0],[gi.L,0],[gi.L,gi.B],[0,gi.B]],gws=[gi.L,gi.B,gi.L,gi.B],id=p=>p;
    const d={walls:[],opens:[],deck:[],els:[],ceil:[],gwalls:[],gopens:[],ws:gws,ps:gps,wings:[],car:gi.car?pdfCarShapes(gi.L,gi.B,p=>p):null};
    d.walls=pdfWallPolys(gps,gws,gws.map(l=>[{s:0,e:l}]),id);
    if(gi.type==='c'){d.walls=carportPosts(gi);d.groof=[[-.2,-.2],[gi.L+.2,-.2],[gi.L+.2,gi.B+.2],[-.2,gi.B+.2]];}
    olist.filter(o=>o.grp==='Garage').forEach(o=>d.opens.push(pdfOpenShape(gps,o.wall,o,id)));
    const gPU=gi.type!=='c'&&roofIsPulpet({wing:true,gar:true}),gH=.15+gi.H,gcfg={pu:gPU?{dir:roofDir({gar:true})}:null,ws:gws,Htot:gH,ridge:gH+tn*gi.B*(gPU?1:.5),O:O_,tn,RW:gi.B,kn:$('gkn').checked?$('gkc').value:null,caps:capInfos().filter(c=>c.host==='g'),gable:[false,true,false,true],floors:[],levels:[.15],yFloor:()=>.15,ops:olist.filter(o=>o.grp==='Garage'),plinth:0,bodyBottom:0,panelStd:$('pd').value==='s',decks:null,ghost:gi.type==='c'};
    if(gi.type==='c'){gcfg.gable=[false,false,false,false];gcfg.ridge=gcfg.Htot+.12;}
    archSheet(doc,{d,titel:titel+' - '+GN(),datum,planLabel:'PLAN '+GN().toUpperCase(),area:nf(gi.L*gi.B,1)+' m²',what:'PLAN/FASAD',inner:null,sect:false,
      elev:{cfg:gcfg,names:['Långsida','Gavel med port','Långsida','Gavel']},section:null});
  }
  return doc;
}
async function archSave(){
  if(!$('bHus').checked&&!garageInfo()){pMsg('Slå på Hus eller Garage i lagerlistan först.');return;}
  const doc=pdfArchBuild(),buf=doc.output('arraybuffer');
  const nm=($('pjName').value.trim()||'ritning').replace(/[^\wåäöÅÄÖ\- ]+/g,'').trim().replace(/\s+/g,'-')||'ritning',fn=nm+'-byggritning.pdf';
  const blob=new Blob([buf],{type:'application/pdf'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=fn;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},800);
  pMsg('Byggritningen skapades: '+fn);
}
$('pjArch').onclick=()=>{pMsg('Skapar byggritning...');setTimeout(()=>{archSave().catch(e=>{console.error(e);pMsg('Kunde inte skapa byggritning: '+(e&&e.message||e));});},30);};
