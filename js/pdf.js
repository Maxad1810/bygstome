/* ---------- PDF-ritningar ---------- */
function pdfSan(t){
  return String(t).replace(/[\u00a0\u202f\u2009]/g,' ').replace(/[\u2013\u2014\u2212]/g,'-').replace(/\u2022/g,'-').replace(/[^\x09\x20-\x7e\u00a1-\u00ff]/g,'?');
}
function pdfRot(th,xl,zl){return [xl*Math.cos(th)+zl*Math.sin(th),-xl*Math.sin(th)+zl*Math.cos(th)];}
const PDF_DIR=[[1,0],[0,1],[-1,0],[0,-1]],PDF_TH=[0,-Math.PI/2,Math.PI,Math.PI/2],PDF_D=.145;
const PDF_M2=v=>nf(v,2);

/* ----- listor med nummer ----- */
function pdfOpenList(){
  const out=[],cnt={};
  const next=(pre)=>{cnt[pre]=(cnt[pre]||0)+1;return pre+cnt[pre];};
  const N=mcount();
  ($('bHus').checked?inst:[]).filter(s=>(s.k||0)<N).slice().sort((a,b)=>((a.k||0)-(b.k||0))||(a.wall-b.wall)||(a.c-b.c)).forEach(s=>{
    const o=ops.find(x=>x.id===s.oid);if(!o)return;
    out.push({grp:'Hus',k:s.k||0,wall:s.wall,c:s.c,w:o.w,h:o.h,t:o.t,ref:s,id:next(o.t==='f'?'F':(o.t==='p'?'P':'D')),sill:o.t==='f'?.9:0});
  });
  const gi=garageInfo();
  if(gi)gi.gops.forEach(x=>out.push({grp:'Garage',k:0,wall:x.wall,c:x.c,w:x.w,h:x.h,t:x.t,id:next(x.t==='f'?'GF':(x.t==='p'?'GP':'GD')),sill:x.t==='f'?.9:0}));
  return out;
}
function pdfElList(){
  const out=[],N=mcount();let n=0;
  ($('bHus').checked?ELS:[]).filter(e=>(e.k||0)<N).slice().sort((a,b)=>((a.k||0)-(b.k||0))||((a.wall||0)-(b.wall||0))||(a.c-b.c)).forEach(e=>{out.push({e,id:'E'+(++n)});});
  return out;
}

/* ----- geometri ----- */
function pdfWallPolys(psl,wsl,plan,tf){
  const out=[];
  for(let i=0;i<4;i++){
    (plan[i]||[{s:0,e:wsl[i]}]).forEach(q=>{
      const L2=q.e-q.s;if(L2<.05)return;
      const st=[psl[i][0]+PDF_DIR[i][0]*q.s,psl[i][1]+PDF_DIR[i][1]*q.s],en=[st[0]+PDF_DIR[i][0]*L2,st[1]+PDF_DIR[i][1]*L2];
      const iw=[Math.sin(PDF_TH[i]),Math.cos(PDF_TH[i])];
      out.push([st,en,[en[0]+iw[0]*PDF_D,en[1]+iw[1]*PDF_D],[st[0]+iw[0]*PDF_D,st[1]+iw[1]*PDF_D]].map(tf));
    });
  }
  return out;
}
function pdfOpenShape(psl,i,o,tf){
  const iw=[Math.sin(PDF_TH[i]),Math.cos(PDF_TH[i])],c=o.c;
  const a=[psl[i][0]+PDF_DIR[i][0]*(c-o.w/2),psl[i][1]+PDF_DIR[i][1]*(c-o.w/2)],b=[psl[i][0]+PDF_DIR[i][0]*(c+o.w/2),psl[i][1]+PDF_DIR[i][1]*(c+o.w/2)];
  const A=tf(a),B=tf(b),rot=tf([a[0]+iw[0],a[1]+iw[1]]),r0=tf(a),iwW=[rot[0]-r0[0],rot[1]-r0[1]];
  return {t:o.t,id:o.id,poly:[a,b,[b[0]+iw[0]*PDF_D,b[1]+iw[1]*PDF_D],[a[0]+iw[0]*PDF_D,a[1]+iw[1]*PDF_D]].map(tf),A,B,iw:iwW,w:o.w,dir:[(B[0]-A[0])/o.w,(B[1]-A[1])/o.w],wall:i,c:o.c};
}
function pdfDecks(){
  const out=[],ws=[g0('W1'),g0('W2'),g0('W3'),g0('W4')],ps=[[0,0],[ws[0],0],[ws[0],ws[1]],[ws[0]-ws[2],ws[1]]];
  const P=(i,x,t)=>{const ou=[-Math.sin(PDF_TH[i]),-Math.cos(PDF_TH[i])];return [ps[i][0]+PDF_DIR[i][0]*x+ou[0]*t,ps[i][1]+PDF_DIR[i][1]*x+ou[1]*t];};
  if(!$('bHus').checked)return out;
  if($('dk').checked){
    const D=deckSegs(),hd=g0('dkH'),top=Math.max(.15,hd-.318)+.318;
    let big=0;D.segs.forEach((sg,i)=>{if(sg.b-sg.a>D.segs[big].b-D.segs[big].a)big=i;});
    const bs=D.segs[big];
    out.push({kind:'deck',k:0,dp:D.dp,top,thick:.318,roof:$('dkRoof')?$('dkRoof').value:'n',rh:g0('dkRH')||2.5,rack:$('dkR').checked,plinth:true,
      label:'Altan '+nf(D.dl,1)+' \u00d7 '+nf(D.dp,1)+' m',bigIdx:big,
      polys:D.segs.map(sg=>({poly:[P(sg.w,sg.a,0),P(sg.w,sg.b,0),P(sg.w,sg.b,D.dp),P(sg.w,sg.a,D.dp)],w:sg.w,dp:D.dp})),
      stair:$('dkT').checked?{w:bs.w,cx:(bs.a+Math.min(bs.b,ws[bs.w]))/2}:null});
  }
  const bi=balcInfo();
  if(bi){
    const H=g0('H2'),jh=(parseInt($('jd').value.split('x')[1])||195)/1000,fo=($('gr').value==='p'?(g0('ph')||.4)+jh:0),y00=fo+jh+.022;
    out.push({kind:'balc',k:bi.k,dp:bi.dp,top:y00+bi.k*(H+jh+.022)-.03,thick:.223,rack:bi.rack,posts:bi.posts,
      label:'Balkong '+nf(bi.dl,1)+' \u00d7 '+nf(bi.dp,1)+' m',bigIdx:0,
      polys:bi.segs.map(sg=>({poly:[P(bi.w,sg.a,0),P(bi.w,sg.b,0),P(bi.w,sg.b,bi.dp),P(bi.w,sg.a,bi.dp)],w:bi.w,dp:bi.dp})),stair:null});
  }
  return out;
}
function pdfPlanData(k,withGarage){
  const ws=[g0('W1'),g0('W2'),g0('W3'),g0('W4')],WB=g0('GB'),WL=g0('GL'),Nm=mcount();
  const ps=[[0,0],[ws[0],0],[ws[0],ws[1]],[ws[0]-ws[2],ws[1]]],id=p=>p;
  const act=WINGS.filter((w,i)=>wcount(i)>k),plan=act.length?wingPlan(ws[0],WB,act):ws.map(l=>[{s:0,e:l}]);
  const out={walls:pdfWallPolys(ps,ws,plan,id),opens:[],deck:[],els:[],ceil:[],gwalls:[],gopens:[],ws,ps,WB,WL,wings:[],garage:null};
  WINGS.forEach((w,i)=>{
    if(wcount(i)<=k)return;
    const wsl=[WL,WB,WL,(k>=Nm?WB:0)],psl=[[0,0],[WL,0],[WL,WB],[0,WB]];
    const th=w.s==='b'?-Math.PI/2:Math.PI/2,pos=w.s==='b'?[w.x0+WB,ws[1]]:[w.x0,0];
    const tf=p=>{const r=pdfRot(th,p[0],p[1]);return [pos[0]+r[0],pos[1]+r[1]];};
    out.walls=out.walls.concat(pdfWallPolys(psl,wsl,wsl.map(l=>[{s:0,e:l}]),tf));
    out.wings.push({w,tf,WL,WB});
  });
  const list=pdfOpenList();
  list.filter(o=>o.grp==='Hus'&&o.k===k).forEach(o=>{
    const i=o.wall;if(!ws[i])return;const oo={...o,c:Math.min(Math.max(o.c,o.w/2),ws[i]-o.w/2)};
    out.opens.push(pdfOpenShape(ps,i,oo,id));
  });
  out.stairs=[];
  pdfDecks().filter(d=>d.k===k).forEach(dk=>{
    dk.polys.forEach((pp,i)=>out.deck.push({poly:pp.poly,w:pp.w,dp:pp.dp,bal:dk.kind==='balc',label:i===dk.bigIdx?dk.label:'',roof:dk.roof||'n'}));
    if(dk.stair){
      const i=dk.stair.w,ou=[-Math.sin(PDF_TH[i]),-Math.cos(PDF_TH[i])],P=(x,t)=>[ps[i][0]+PDF_DIR[i][0]*x+ou[0]*t,ps[i][1]+PDF_DIR[i][1]*x+ou[1]*t];
      const n=Math.max(1,Math.ceil(dk.top/.17)),cx=dk.stair.cx,lines=[];
      for(let j=1;j<n;j++)lines.push([P(cx-.5,dk.dp+j*.28),P(cx+.5,dk.dp+j*.28)]);
      out.stairs.push({poly:[P(cx-.5,dk.dp),P(cx+.5,dk.dp),P(cx+.5,dk.dp+n*.28),P(cx-.5,dk.dp+n*.28)],lines});
    }
  });
  pdfElList().filter(x=>(x.e.k||0)===k).forEach(x=>{
    const e=x.e;
    if(e.t==='t'){out.ceil.push({id:x.id,x:e.c,z:e.h});return;}
    const i=Math.min(3,Math.max(0,e.wall||0)),iw=[Math.sin(PDF_TH[i]),Math.cos(PDF_TH[i])],c=Math.min(Math.max(e.c,.1),ws[i]-.1);
    out.els.push({id:x.id,t:e.t,wall:i,c,x:ps[i][0]+PDF_DIR[i][0]*c+iw[0]*PDF_D*.5,z:ps[i][1]+PDF_DIR[i][1]*c+iw[1]*PDF_D*.5});
  });
  const ht=withGarage?(g0('huR')||0)*Math.PI/180:0;
  if(ht){
    const c=[ws[0]/2,ws[1]/2],rp=p=>{const rx=p[0]-c[0],rz=p[1]-c[1];return [c[0]+rx*Math.cos(ht)+rz*Math.sin(ht),c[1]-rx*Math.sin(ht)+rz*Math.cos(ht)];},rv=v=>[v[0]*Math.cos(ht)+v[1]*Math.sin(ht),-v[0]*Math.sin(ht)+v[1]*Math.cos(ht)];
    out.walls=out.walls.map(pl=>pl.map(rp));
    out.opens.forEach(o=>{o.poly=o.poly.map(rp);o.iw=rv(o.iw);o.dir=rv(o.dir);o.A=rp(o.A);o.B=rp(o.B);});
    out.deck.forEach(x=>{x.poly=x.poly.map(rp);});
    out.stairs.forEach(st=>{st.poly=st.poly.map(rp);st.lines=st.lines.map(l=>[rp(l[0]),rp(l[1])]);});
    out.els.forEach(e=>{const q=rp([e.x,e.z]);e.x=q[0];e.z=q[1];});
    out.ceil.forEach(e=>{const q=rp([e.x,e.z]);e.x=q[0];e.z=q[1];});
    out.rotated=true;out.rotFn=rp;
  }
  const gi=withGarage&&k===0?garageInfo():null;
  if(gi){
    const gps=[[0,0],[gi.L,0],[gi.L,gi.B],[0,gi.B]],gws=[gi.L,gi.B,gi.L,gi.B];
    const gtf=p=>gi.tf(p[0],p[1]);
    out.gwalls=pdfWallPolys(gps,gws,gws.map(l=>[{s:0,e:l}]),gtf);
    if(gi.type==='c'){out.gwalls=carportPosts(gi).map(pl=>pl.map(gtf));out.groof=[[-.2,-.2],[gi.L+.2,-.2],[gi.L+.2,gi.B+.2],[-.2,gi.B+.2]].map(gtf);}
    list.filter(o=>o.grp==='Garage').forEach(o=>out.gopens.push(pdfOpenShape(gps,o.wall,o,gtf)));
    out.garage=gi;
  }
  return out;
}

/* ----- ritverktyg ----- */
function pdfFit(minx,maxx,minz,maxz,box){
  const bw=maxx-minx,bh=maxz-minz,sc0=Math.min(box.w/bw,box.h/bh);
  const ratios=[10,20,25,50,75,100,125,150,200,250,300,400,500,750,1000],ratio=ratios.find(r=>1000/r<=sc0)||1000,sc=1000/ratio;
  const ox=box.x+(box.w-bw*sc)/2,oy=box.y+(box.h-bh*sc)/2;
  return {sc,ratio,P:(x,z)=>[ox+(x-minx)*sc,oy+(maxz-z)*sc]};
}
function pdfPoly(doc,pts,P,style){
  const q=pts.map(p=>P(p[0],p[1]));
  const rel=[];for(let i=1;i<q.length;i++)rel.push([q[i][0]-q[i-1][0],q[i][1]-q[i-1][1]]);
  doc.lines(rel,q[0][0],q[0][1],[1,1],style,true);
}
function pdfDim(doc,a,b,off,txt,fs,skip){
  const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy);if(L<.6)return;
  const nx=-dy/L*off,ny=dx/L*off,A=[a[0]+nx,a[1]+ny],B=[b[0]+nx,b[1]+ny],ux=dx/L,uy=dy/L;
  doc.setLineWidth(.12);doc.setDrawColor(110);
  const sgn=off>=0?1:-1,un=[-dy/L*sgn,dx/L*sgn],sk=(skip==null?.8:skip);
  doc.line(a[0]+un[0]*sk,a[1]+un[1]*sk,A[0]+un[0]*1.2,A[1]+un[1]*1.2);doc.line(b[0]+un[0]*sk,b[1]+un[1]*sk,B[0]+un[0]*1.2,B[1]+un[1]*1.2);
  doc.line(A[0],A[1],B[0],B[1]);
  const tk=1.1;
  doc.setLineWidth(.2);doc.setDrawColor(60);
  doc.line(A[0]-ux*tk-uy*tk,A[1]-uy*tk+ux*tk,A[0]+ux*tk+uy*tk,A[1]+uy*tk-ux*tk);
  doc.line(B[0]-ux*tk-uy*tk,B[1]-uy*tk+ux*tk,B[0]+ux*tk+uy*tk,B[1]+uy*tk-ux*tk);
  const f=fs||6.5;doc.setFontSize(f);doc.setFont('helvetica','normal');doc.setTextColor(30);
  const tw=doc.getTextWidth(pdfSan(txt));if(tw>L-1)return;
  const mx=(A[0]+B[0])/2,my=(A[1]+B[1])/2;
  const vert=Math.abs(dy)>Math.abs(dx),side=off>=0?1:-1;
  if(vert)doc.text(pdfSan(txt),mx+side*1.9,my,{align:'center',angle:90});
  else doc.text(pdfSan(txt),mx,my+(side>0?2.7:-1),{align:'center'});
}
function pdfChain(doc,P,ps,i,len,pts,off,fs,skip){
  const a=[...new Set(pts.map(v=>Math.min(Math.max(+v.toFixed(3),0),len)))].sort((p,q)=>p-q);
  for(let j=0;j<a.length-1;j++){
    if(a[j+1]-a[j]<.03)continue;
    pdfDim(doc,P(ps[i][0]+PDF_DIR[i][0]*a[j],ps[i][1]+PDF_DIR[i][1]*a[j]),P(ps[i][0]+PDF_DIR[i][0]*a[j+1],ps[i][1]+PDF_DIR[i][1]*a[j+1]),off,PDF_M2(a[j+1]-a[j]),fs,skip);
  }
}
function pdfSym(doc,e,q){
  doc.setDrawColor(200,60,20);doc.setLineWidth(.3);doc.setFillColor(255,255,255);
  if(e.t==='u'){doc.circle(q[0],q[1],1.1,'FD');}
  else if(e.t==='b'){doc.circle(q[0],q[1],1.1,'FD');doc.setFontSize(6);doc.setTextColor(200,60,20);doc.text('S',q[0],q[1]+.8,{align:'center'});}
  else if(e.t==='l'){doc.circle(q[0],q[1],1.4,'FD');doc.line(q[0]-1,q[1]-1,q[0]+1,q[1]+1);doc.line(q[0]-1,q[1]+1,q[0]+1,q[1]-1);}
  else if(e.t==='c'){doc.setFillColor(200,60,20);doc.rect(q[0]-2,q[1]-2,4,4,'F');doc.setFontSize(6);doc.setTextColor(255);doc.text('C',q[0],q[1]+.9,{align:'center'});}
}
function pdfOpenDraw(doc,o,P){
  doc.setFillColor(255,255,255);doc.setDrawColor(20);doc.setLineWidth(.2);pdfPoly(doc,o.poly,P,'FD');
  const m1=[(o.poly[0][0]+o.poly[3][0])/2,(o.poly[0][1]+o.poly[3][1])/2],m2=[(o.poly[1][0]+o.poly[2][0])/2,(o.poly[1][1]+o.poly[2][1])/2];
  if(o.t==='f'){const A=P(m1[0],m1[1]),B=P(m2[0],m2[1]);doc.setDrawColor(40,120,170);doc.setLineWidth(.35);doc.line(A[0],A[1],B[0],B[1]);}
  else if(o.t==='p'){const A=P(m1[0],m1[1]),B=P(m2[0],m2[1]);doc.setDrawColor(110,70,30);doc.setLineWidth(.6);doc.line(A[0],A[1],B[0],B[1]);}
  else{
    const hx=o.poly[3][0],hz=o.poly[3][1],pts=[],iw=o.iw,dr=[o.poly[1][0]-o.poly[0][0],o.poly[1][1]-o.poly[0][1]],dl=Math.hypot(dr[0],dr[1])||1,dd=[dr[0]/dl,dr[1]/dl];
    for(let s=0;s<=10;s++){const f=s/10*Math.PI/2;pts.push(P(hx+dd[0]*o.w*Math.cos(f)+iw[0]*o.w*Math.sin(f),hz+dd[1]*o.w*Math.cos(f)+iw[1]*o.w*Math.sin(f)));}
    doc.setDrawColor(120);doc.setLineWidth(.2);for(let s=1;s<pts.length;s++)doc.line(pts[s-1][0],pts[s-1][1],pts[s][0],pts[s][1]);
    const H0=P(hx,hz);doc.setDrawColor(20);doc.line(H0[0],H0[1],pts[10][0],pts[10][1]);
  }
  // nummer
  const c=[(o.poly[0][0]+o.poly[2][0])/2,(o.poly[0][1]+o.poly[2][1])/2],q=P(c[0],c[1]);
  doc.setFontSize(6);doc.setFont('helvetica','bold');doc.setTextColor(30);
  doc.text(o.id,q[0]+o.iw[0]*4.2,q[1]-o.iw[1]*4.2+1,{align:'center'});doc.setFont('helvetica','normal');
}

/* ----- ett planblad ----- */
function pdfDrawPlan(doc,d,box,opt){
  const xs=[],zs=[],addp=p=>{xs.push(p[0]);zs.push(p[1]);};
  d.walls.forEach(pl=>pl.forEach(addp));d.deck.forEach(x=>x.poly.forEach(addp));d.gwalls.forEach(pl=>pl.forEach(addp));(d.groof||[]).forEach(addp);
  if(!xs.length)return null;
  const mg=opt.mg||0,minx=Math.min(...xs)-mg,maxx=Math.max(...xs)+mg,minz=Math.min(...zs)-mg,maxz=Math.max(...zs)+mg;
  const F=pdfFit(minx,maxx,minz,maxz,box),P=F.P,sc=F.sc;
  // takutskjutande (streckad)
  if(opt.roof){
    const O=g0('O'),ws=d.ws;
    doc.setDrawColor(130);doc.setLineWidth(.15);doc.setLineDashPattern([2,1.2],0);
    const r=[[-O,-O],[ws[0]+O,-O],[ws[0]+O,ws[1]+O],[-O,ws[1]+O]];
    pdfPoly(doc,d.rotFn?r.map(d.rotFn):r,P,'S');
    doc.setLineDashPattern([],0);
  }
  doc.setDrawColor(150,110,60);doc.setFillColor(238,225,198);doc.setLineWidth(.25);
  doc.setLineDashPattern([1.2,1],0);d.deck.forEach(x=>pdfPoly(doc,x.poly,P,'FD'));doc.setLineDashPattern([],0);
  d.deck.forEach(x=>{if(x.roof&&x.roof!=='n'){doc.setDrawColor(120,80,40);doc.setLineWidth(.4);doc.setLineDashPattern([3,1.5],0);pdfPoly(doc,x.poly,P,'S');doc.setLineDashPattern([],0);}});
  (d.stairs||[]).forEach(st=>{doc.setDrawColor(150,110,60);doc.setFillColor(248,240,224);doc.setLineWidth(.2);pdfPoly(doc,st.poly,P,'FD');st.lines.forEach(l=>{const a=P(l[0][0],l[0][1]),b=P(l[1][0],l[1][1]);doc.line(a[0],a[1],b[0],b[1]);});});
  d.deck.forEach(x=>{
    if(x.bal){doc.setLineWidth(.5);doc.setDrawColor(150,110,60);pdfPoly(doc,x.poly,P,'S');}
    if(!x.label)return;
    const c=[x.poly.reduce((a2,p)=>a2+p[0],0)/4,x.poly.reduce((a2,p)=>a2+p[1],0)/4],q=P(c[0],c[1]);
    doc.setFontSize(7);doc.setFont('helvetica','bold');doc.setTextColor(120,85,40);doc.text(pdfSan(x.label),q[0],q[1],{align:'center'});doc.setFont('helvetica','normal');doc.setTextColor(30);
  });
  doc.setDrawColor(20);doc.setFillColor(55,55,55);doc.setLineWidth(.2);
  d.walls.forEach(pl=>pdfPoly(doc,pl,P,'FD'));d.gwalls.forEach(pl=>pdfPoly(doc,pl,P,'FD'));
  if(d.groof){doc.setDrawColor(120,80,40);doc.setLineWidth(.35);doc.setLineDashPattern([3,1.5],0);pdfPoly(doc,d.groof,P,'S');doc.setLineDashPattern([],0);}
  d.opens.forEach(o=>pdfOpenDraw(doc,o,P));d.gopens.forEach(o=>pdfOpenDraw(doc,o,P));
  d.els.forEach(e=>{const q=P(e.x,e.z);pdfSym(doc,e,q);doc.setFontSize(5.5);doc.setTextColor(200,60,20);doc.text(e.id,q[0]+1.7,q[1]-1.4);});
  d.ceil.forEach(e=>{const q=P(e.x,e.z);doc.setDrawColor(200,60,20);doc.setLineWidth(.3);doc.setFillColor(255,255,255);doc.circle(q[0],q[1],1.7,'FD');doc.line(q[0]-1.2,q[1]-1.2,q[0]+1.2,q[1]+1.2);doc.line(q[0]-1.2,q[1]+1.2,q[0]+1.2,q[1]-1.2);doc.setFontSize(5.5);doc.setTextColor(200,60,20);doc.text(e.id,q[0]+2.2,q[1]-1.6);});
  doc.setTextColor(30);
  // mått: öppningar + totalt per vägg
  if(opt.dims!==false){
    const ws=d.ws,ps=d.ps;
    const deckOff=i=>{const m=d.deck.filter(x=>x.w===i).reduce((a,x)=>Math.max(a,x.dp),0);return m?m*sc+3:0;};
    for(let i=0;i<4;i++){
      if(!ws[i])continue;
      const base=deckOff(i)+4;
      const items=d.opens.filter(o=>o.wall===i);
      const pts=[0,ws[i]];items.forEach(o=>{pts.push(o.c-o.w/2,o.c+o.w/2);});
      if(items.length)pdfChain(doc,P,ps,i,ws[i],pts,base,6,deckOff(i));
      pdfDim(doc,P(ps[i][0],ps[i][1]),P(ps[i][0]+PDF_DIR[i][0]*ws[i],ps[i][1]+PDF_DIR[i][1]*ws[i]),base+(items.length?7:0),PDF_M2(ws[i])+' m',7.5,deckOff(i));
      // el invändigt: avstånd från väggens start
      const ei=d.els.filter(e=>e.wall===i);
      if(ei.length)pdfChain(doc,P,ps,i,ws[i],[0,...ei.map(e=>e.c),ws[i]],-5,5.5);
    }
    d.wings.forEach(wg=>{
      const tf=wg.tf,A=tf([0,0]),B=tf([0,wg.WB]),C=tf([wg.WL,wg.WB]),D2=tf([wg.WL,0]);
      pdfDim(doc,P(D2[0],D2[1]),P(C[0],C[1]),5,PDF_M2(wg.WB)+' m',7);
      pdfDim(doc,P(A[0],A[1]),P(D2[0],D2[1]),5,PDF_M2(wg.WL)+' m',7);
    });
    d.deck.forEach(x=>{
      const q=x.poly;pdfDim(doc,P(q[3][0],q[3][1]),P(q[2][0],q[2][1]),-2.5,PDF_M2(Math.hypot(q[2][0]-q[3][0],q[2][1]-q[3][1]))+' m',6);
    });
  }
  return F;
}
function pdfTitleBlock(doc,PW,PH,titel,datum,scale,sheet){
  const w=70,h=18,x=PW-12-w,y=PH-12-h-4;
  doc.setDrawColor(60);doc.setLineWidth(.3);doc.rect(x,y,w,h);doc.line(x,y+9,x+w,y+9);doc.line(x+45,y,x+45,y+h);
  doc.setFontSize(7);doc.setFont('helvetica','normal');doc.setTextColor(110);doc.text('Projekt',x+1.5,y+3.2);doc.text('Skala',x+46.5,y+3.2);doc.text('Datum',x+1.5,y+12);doc.text('Blad',x+46.5,y+12);
  doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(30);doc.text(pdfSan(titel).slice(0,26),x+1.5,y+7.4);doc.text(pdfSan(scale),x+46.5,y+7.4);doc.text(pdfSan(datum),x+1.5,y+16);doc.text(pdfSan(sheet),x+46.5,y+16);
  doc.setFont('helvetica','normal');
}
function pdfLegend(doc,lx,ly,items){
  doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(30);doc.text('F\u00f6rklaring',lx,ly);doc.setFont('helvetica','normal');doc.setFontSize(7.5);
  items.forEach(([n,t],i)=>{
    const y=ly+7+i*6.2;doc.setLineWidth(.3);
    if(t==='w'){doc.setFillColor(55,55,55);doc.rect(lx,y-2.2,6,3,'F');}
    else if(t==='f'){doc.setDrawColor(40,120,170);doc.setLineWidth(.5);doc.line(lx,y-.6,lx+6,y-.6);}
    else if(t==='d'){doc.setDrawColor(120);doc.line(lx,y-.6,lx+5,y-.6);}
    else if(t==='p'){doc.setDrawColor(110,70,30);doc.setLineWidth(.7);doc.line(lx,y-.6,lx+6,y-.6);}
    else if(t==='u'){doc.setDrawColor(200,60,20);doc.circle(lx+3,y-.8,1.1);}
    else if(t==='b'){doc.setDrawColor(200,60,20);doc.circle(lx+3,y-.8,1.1);doc.setFontSize(6);doc.text('S',lx+3,y-.1,{align:'center'});doc.setFontSize(7.5);}
    else if(t==='l'||t==='t'){doc.setDrawColor(200,60,20);doc.circle(lx+3,y-.8,1.5);doc.line(lx+2,y-1.8,lx+4,y+.2);doc.line(lx+2,y+.2,lx+4,y-1.8);}
    else if(t==='c'){doc.setFillColor(200,60,20);doc.rect(lx+1,y-2.8,4,4,'F');}
    else if(t==='a'){doc.setFillColor(238,225,198);doc.setDrawColor(150,110,60);doc.rect(lx,y-2.2,6,3,'FD');}
    else if(t==='r'){doc.setDrawColor(130);doc.setLineDashPattern([1.5,1],0);doc.line(lx,y-.6,lx+6,y-.6);doc.setLineDashPattern([],0);}
    doc.setTextColor(30);doc.text(pdfSan(n),lx+9,y);
  });
}

/* ----- fasader ----- */
function pdfElevCell(doc,cfg,w,cx0,cy0,cellW,cellH,sc,title){
  const ws=cfg.ws,Htot=cfg.Htot,ridge=cfg.ridge,gy=cy0+cellH-16,x0=cx0+12+(cellW-24-ws[w]*sc)/2;
  const X=x=>x0+x*sc,Y=y=>gy-y*sc;
  doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(30);doc.text(pdfSan(title),cx0,cy0);
  // mark
  doc.setDrawColor(90);doc.setLineWidth(.3);doc.line(cx0,gy,cx0+cellW,gy);
  doc.setLineWidth(.1);doc.setDrawColor(170);for(let x=cx0;x<cx0+cellW-2;x+=3)doc.line(x,gy,x-2,gy+2);
  // plintar
  if(cfg.plinth){doc.setFillColor(160,165,165);doc.setDrawColor(100);doc.setLineWidth(.1);const n=Math.ceil(ws[w]/1.8)+1,hh=cfg.plinth;for(let i=0;i<n;i++){const x=n===1?ws[w]/2:.1+i*(ws[w]-.2)/(n-1);doc.rect(X(x-.1),Y(hh),.2*sc,hh*sc,'FD');}}
  // kropp
  const yb=cfg.bodyBottom||0;
  if(cfg.ghost){
    doc.setFillColor(150,115,70);doc.setDrawColor(60);doc.setLineWidth(.2);
    const np=Math.ceil(ws[w]/3)+1;for(let i=0;i<np;i++){const x=np===1?ws[w]/2:.15+i*(ws[w]-.3)/(np-1);doc.rect(X(x-.0475),Y(Htot-.1),.095*sc,(Htot-.1)*sc,'FD');}
  }else{
  doc.setFillColor(...hexRgb($('fc').value));doc.setDrawColor(40);doc.setLineWidth(.3);
  doc.rect(X(0),Y(Htot),ws[w]*sc,(Htot-yb)*sc,'FD');
  // panellinjer
  doc.setDrawColor(...hexShade($('fc').value,.8));doc.setLineWidth(.05);
  if(cfg.panelStd){for(let x=.12;x<ws[w];x+=.12)doc.line(X(x),Y(Htot),X(x),Y(yb));}
  else{for(let y=yb+.12;y<Htot;y+=.12)doc.line(X(0),Y(y),X(ws[w]),Y(y));}
  }
  // våningsskarvar
  cfg.floors.forEach(fy=>{doc.setDrawColor(255,255,255);doc.setLineWidth(.2);doc.line(X(0),Y(fy),X(ws[w]),Y(fy));});
  // tak
  const O=cfg.O,tn=cfg.tn;
  doc.setDrawColor(40);doc.setFillColor(...hexRgb($('rcol').value));doc.setLineWidth(.3);
  if(cfg.gable[w]){
    const half=cfg.RW/2+O,cxm=ws[w]/2;
    pdfPoly(doc,[[cxm-half,Htot-tn*O],[cxm,ridge],[cxm+half,Htot-tn*O]],(x,y)=>[X(x),Y(y)],'FD');
    doc.setDrawColor(210);doc.setLineWidth(.12);doc.line(X(cxm-half+.05),Y(Htot-tn*O+.04),X(cxm),Y(ridge-.03));doc.line(X(cxm+half-.05),Y(Htot-tn*O+.04),X(cxm),Y(ridge-.03));
  }else{
    pdfPoly(doc,[[-O,Htot-tn*O],[ws[w]+O,Htot-tn*O],[ws[w]+O,Htot+.1],[-O,Htot+.1]],(x,y)=>[X(x),Y(y)],'FD');
    doc.setDrawColor(95,110,120);doc.setLineDashPattern([1.5,1],0);doc.line(X(-O),Y(ridge),X(ws[w]+O),Y(ridge));doc.setLineDashPattern([],0);
    doc.setFontSize(6);doc.setFont('helvetica','normal');doc.setTextColor(110);doc.text('nock',X(ws[w]+O)+1,Y(ridge)+.8);
    // ränna + stuprör
    doc.setDrawColor(60);doc.setLineWidth(.35);doc.line(X(-O),Y(Htot-tn*O-.07),X(ws[w]+O),Y(Htot-tn*O-.07));
    doc.setLineWidth(.4);doc.line(X(ws[w]+O-.2),Y(Htot-tn*O-.07),X(ws[w]+O-.2),Y(0));
  }
  // öppningar
  cfg.ops.filter(o=>o.wall===w).forEach(o=>{
    const c=Math.min(Math.max(o.c,o.w/2),ws[w]-o.w/2),y1=cfg.yFloor(o.k)+o.sill;
    const win=o.t==='f';
    doc.setFillColor(win?190:(o.t==='p'?210:110),win?225:(o.t==='p'?205:75),win?240:(o.t==='p'?195:35));doc.setDrawColor(245);doc.setLineWidth(.4);
    doc.rect(X(c-o.w/2),Y(y1+o.h),o.w*sc,o.h*sc,'FD');
    doc.setDrawColor(70);doc.setLineWidth(.12);
    if(win){doc.line(X(c),Y(y1+o.h),X(c),Y(y1));doc.line(X(c-o.w/2),Y(y1+o.h/2),X(c+o.w/2),Y(y1+o.h/2));}
    else if(o.t==='p'){for(let yy=y1+.5;yy<y1+o.h-.1;yy+=.5)doc.line(X(c-o.w/2),Y(yy),X(c+o.w/2),Y(yy));}
    else{doc.setFillColor(230,200,90);doc.circle(X(c+o.w/2)-1.6,Y(y1+o.h*.45),.6,'F');}
    doc.setFontSize(5.5);doc.setFont('helvetica','bold');doc.setTextColor(30);
    const tx=X(c),ty=Y(y1+o.h)+2.6;
    if(o.w*sc>7){doc.text(o.id,tx,ty,{align:'center'});doc.setFont('helvetica','normal');doc.text(nf(o.w,2)+'x'+nf(o.h,2),tx,ty+2.3,{align:'center'});if(o.w*sc>10)doc.text('UK '+nf(y1,2),tx,ty+4.6,{align:'center'});}
    doc.setFont('helvetica','normal');
  });
  // altan och balkong (syns även från sidorna)
  (cfg.decks||[]).forEach(dk=>{
    const ps0=cfg.ps,ou=[-Math.sin(PDF_TH[w]),-Math.cos(PDF_TH[w])];
    dk.polys.forEach(pp=>{
      const q=pp.poly.map(p=>[(p[0]-ps0[w][0])*PDF_DIR[w][0]+(p[1]-ps0[w][1])*PDF_DIR[w][1],(p[0]-ps0[w][0])*ou[0]+(p[1]-ps0[w][1])*ou[1]]);
      const xmin=Math.min(...q.map(a2=>a2[0])),xmax=Math.max(...q.map(a2=>a2[0])),tmax=Math.max(...q.map(a2=>a2[1]));
      const front=tmax>.05,segsX=(front?[[xmin,xmax]]:[[xmin,Math.min(xmax,0)],[Math.max(xmin,ws[w]),xmax]]).filter(sx=>sx[1]-sx[0]>.05);
      segsX.forEach(([xmin,xmax])=>{
      doc.setFillColor(143,115,72);doc.setDrawColor(60);doc.setLineWidth(.25);
      doc.rect(X(xmin),Y(dk.top),(xmax-xmin)*sc,dk.thick*sc,'FD');
      doc.setDrawColor(90);doc.setLineWidth(.3);
      if(dk.posts){[xmin+.1,xmax-.1].forEach(x=>doc.line(X(x),Y(dk.top-dk.thick),X(x),Y(0)));}
      else if(dk.plinth){for(let x=xmin+.1;x<=xmax-.05;x+=1.8)doc.line(X(x),Y(dk.top-dk.thick),X(x),Y(0));}
      if(dk.rack){
        doc.setDrawColor(70);doc.setLineWidth(.25);
        doc.line(X(xmin),Y(dk.top+1),X(xmax),Y(dk.top+1));doc.line(X(xmin),Y(dk.top+.5),X(xmax),Y(dk.top+.5));
        for(let x=xmin;x<=xmax+.01;x+=1.2)doc.line(X(x),Y(dk.top),X(x),Y(dk.top+1));
        doc.line(X(xmax),Y(dk.top),X(xmax),Y(dk.top+1));
      }
      if(dk.roof&&dk.roof!=='n'){
        const rh=dk.rh||2.5;
        doc.setDrawColor(90,60,30);doc.setLineWidth(.3);
        [xmin+.1,xmax-.1].forEach(x=>doc.line(X(x),Y(dk.top),X(x),Y(dk.top+rh-.1)));
        if(dk.roof==='f'){doc.setFillColor(...hexRgb($('rcol').value));doc.setDrawColor(40);}else{doc.setFillColor(200,170,120);doc.setDrawColor(90,60,30);}
        doc.rect(X(xmin)-1,Y(dk.top+rh+.12),(xmax-xmin)*sc+2,.22*sc,'FD');
      }
      });
    });
    if(dk.stair&&dk.stair.w===w){
      const n=Math.max(1,Math.ceil(dk.top/.17)),rs=dk.top/n,cx=dk.stair.cx;
      doc.setFillColor(160,130,85);doc.setDrawColor(60);doc.setLineWidth(.15);
      for(let i=0;i<n;i++)doc.rect(X(cx-.5),Y(dk.top-i*rs),1.0*sc,rs*sc,'FD');
    }
    // etikett
    if(dk.polys.some(pp=>pp.w===w)){doc.setFontSize(6);doc.setFont('helvetica','bold');doc.setTextColor(110,80,40);doc.text(pdfSan(dk.kind==='balc'?'Balkong':'Altan'),X(dk.polys.find(pp=>pp.w===w).poly.reduce((a2,p)=>a2+((p[0]-cfg.ps[w][0])*PDF_DIR[w][0]+(p[1]-cfg.ps[w][1])*PDF_DIR[w][1]),0)/4),Y(dk.top)-1.2,{align:'center'});doc.setFont('helvetica','normal');doc.setTextColor(30);}
  });
  // måttkedja nedtill: öppningar + totalt
  const items=cfg.ops.filter(o=>o.wall===w),pts=[0,ws[w]];items.forEach(o=>{pts.push(o.c-o.w/2,o.c+o.w/2);});
  const a=[...new Set(pts.map(v=>+Math.min(Math.max(v,0),ws[w]).toFixed(3)))].sort((p,q)=>p-q);
  if(items.length)for(let j=0;j<a.length-1;j++)if(a[j+1]-a[j]>.03)pdfDim(doc,[X(a[j]),gy],[X(a[j+1]),gy],4.2,PDF_M2(a[j+1]-a[j]),5.8);
  pdfDim(doc,[X(0),gy],[X(ws[w]),gy],items.length?8.6:4.2,PDF_M2(ws[w])+' m',7);
  // höjdkedja till höger
  const lv=[0,...cfg.levels,Htot];
  const hx=X(ws[w])+Math.max(5,cfg.O*sc+4);
  for(let j=0;j<lv.length-1;j++)if(lv[j+1]-lv[j]>.03)pdfDim(doc,[hx,Y(lv[j])],[hx,Y(lv[j+1])],-0.0001+0.001,'',5);
  doc.setDrawColor(60);doc.setLineWidth(.12);
  [...lv,ridge].forEach(y=>{doc.line(hx-1.6,Y(y),hx+1.6,Y(y));});
  doc.line(hx,Y(0),hx,Y(ridge));
  doc.setFontSize(5.8);doc.setFont('helvetica','normal');doc.setTextColor(30);
  const lab=[['mark',0],...cfg.levels.map((y,i)=>[i===0?'golv':'v\u00e5n '+(i+1),y]),['\u00f6k tak',Htot],['nock',ridge]];
  lab.forEach(([n,y])=>doc.text(pdfSan(n+' +'+nf(y,2)),hx+2,Y(y)+.8));
}
function pdfElevPage(doc,head,cfg,title,names,PW,PH,M0){
  head(title);
  const cellW=(PW-2*M0-8)/2,cellH=(PH-M0-34)/2;
  const maxW=Math.max(...cfg.ws)+2*cfg.O+3.5,maxH=cfg.ridge+.8;
  const sc0=Math.min((cellW-24)/maxW,(cellH-24)/maxH),ratios=[20,25,50,75,100,125,150,200,250,300,400,500],ratio=ratios.find(r=>1000/r<=sc0)||500,sc=1000/ratio;
  for(let w=0;w<4;w++){
    const cx0=M0+(w%2)*(cellW+8),cy0=M0+16+Math.floor(w/2)*cellH;
    pdfElevCell(doc,cfg,w,cx0,cy0,cellW,cellH,sc,names[w]);
  }
  doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(30);doc.text('Skala 1:'+ratio+' (A4)',M0,PH-12);
  return ratio;
}

/* ----- tabeller ----- */
function pdfTable(doc,head,title,cols,rows,PW,PH,M0,note){
  head(title);let y=M0+16;
  const hdr=()=>{doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor(90);cols.forEach(c=>doc.text(pdfSan(c.t),c.x,y,{align:c.a||'left'}));y+=2;doc.setDrawColor(200);doc.setLineWidth(.2);doc.line(M0,y,PW-M0,y);y+=4.8;};
  if(note){doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(110);doc.text(pdfSan(note),M0,y);y+=6;}
  hdr();
  rows.forEach((r,i)=>{
    if(y>PH-16){head(title+' (forts.)');y=M0+16;hdr();}
    if(r.sec){doc.setFillColor(238,240,238);doc.rect(M0,y-3.6,PW-2*M0,5,'F');doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor(30);doc.text(pdfSan(r.sec),M0+1,y);y+=5.4;return;}
    doc.setFont('helvetica','normal');doc.setFontSize(8.3);doc.setTextColor(30);
    cols.forEach((c,j)=>doc.text(pdfSan(String(r.v[j]==null?'':r.v[j])),c.x,y,{align:c.a||'left'}));
    y+=4.9;
  });
}

function pdfBuild(){
  const JS=window.jspdf&&window.jspdf.jsPDF;if(!JS)throw new Error('PDF-biblioteket saknas');
  const doc=new JS({orientation:'landscape',unit:'mm',format:'a4'}),PW=297,PH=210,M0=12;
  const titel=$('pjName').value.trim()||'Ritning',datum=new Date().toLocaleDateString('sv-SE');
  let page=0;
  const head=(txt)=>{
    page++;if(page>1)doc.addPage();
    doc.setFont('helvetica','bold');doc.setFontSize(15);doc.setTextColor(30);doc.text(pdfSan(txt),M0,M0+5);
    doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(90);doc.text(pdfSan(titel+'  |  '+datum),PW-M0,M0+5,{align:'right'});
    doc.setDrawColor(184,116,26);doc.setLineWidth(.6);doc.line(M0,M0+8,PW-M0,M0+8);
    doc.setFontSize(7.5);doc.setTextColor(120);
    doc.text('Planeringsunderlag framtaget i Stomkalkyl. Kontrollera m\u00e5tt, balkar och takstolar mot konstruktionsritning. Elinstallation f\u00e5r bara g\u00f6ras av beh\u00f6rig elinstallat\u00f6r.',M0,PH-6);
    doc.text('Sida '+page,PW-M0,PH-6,{align:'right'});
    doc.setTextColor(30);
  };
  const g=g0,N=mcount(),ws=[g('W1'),g('W2'),g('W3'),g('W4')],H=g('H2'),P_=g('P'),gi=garageInfo();
  const hsn={r:'Rektangel',l:'L-form',t:'T-form',x:'X-form (kors)',u:'U-form'}[$('hs').value];
  const jh=(parseInt($('jd').value.split('x')[1])||195)/1000,fo=($('gr').value==='p'?(g('ph')||.4)+jh:0),y00=fo+jh+.022,tn=Math.tan(P_*Math.PI/180),RW=g('RW'),O_=g('O');
  const Htot=y00+N*H+(N-1)*(jh+.022),ridge=Htot+tn*RW/2;
  const floors=[];for(let k=1;k<N;k++)floors.push(y00+k*(H+jh+.022)-jh-.022);
  const yFloor=k=>y00+k*(H+jh+.022);
  // ===== Sida 1: översikt =====
  head('Ritning \u2013 \u00f6versikt');
  const info=[
    ['Husform',hsn],['Husets m\u00e5tt',nf(ws[0],1)+' \u00d7 '+nf(ws[1],1)+' m'],
    ['V\u00e5ningar (huvudhus)',String(N)],['V\u00e4ggh\u00f6jd per v\u00e5ning',nf(H,1)+' m'],
    ['Takvinkel',nf(P_)+'\u00b0'],['Takkonstruktion',($('rt').value==='g'?'Limtr\u00e4balkar ':'Takstolar ')+$('rd').value],
    ['Regelstomme',$('dim').value+', c/c '+nf(g('cc')*1000)+' mm'],['Grund',$('gr').value==='p'?'Plintar, h\u00f6jd '+nf(g('ph'),2)+' m':'Golv p\u00e5 mark'],
    ['Fasadpanel',$('pd').value==='s'?'St\u00e5ende':'Liggande'],['F\u00f6nster och d\u00f6rrar',nf(pdfOpenList().filter(o=>o.grp==='Hus').length)+' st (se schema)'],
    ['El inv\u00e4ndigt',nf(ELS.length)+' punkter (se elschema)'],['Altan',$('dk').checked?nf(g('dkL'),1)+' \u00d7 '+nf(g('dkD'),1)+' m, h\u00f6jd '+nf(g('dkH'),2)+' m':'Ingen'],
    ['Balkong',balcInfo()?nf(balcInfo().dl,1)+' \u00d7 '+nf(balcInfo().dp,1)+' m, v\u00e5ning '+(balcInfo().k+1):'Ingen'],
    [GN(),gi?nf(gi.L,1)+' \u00d7 '+nf(gi.B,1)+' m, '+gi.gops.length+' \u00f6ppningar (se schema)':'Inget']
  ];
  if($('hs').value!=='r')info.splice(2,0,['Vingar',WINGS.length+' st, '+nf(g('GL'),1)+' \u00d7 '+nf(g('GB'),1)+' m']);
  doc.setFontSize(10);
  const hus=$('bHus').checked;
  (hus?info:[['Byggnad','Frist\u00e5ende '+GN().toLowerCase()],info[info.length-1]]).forEach(([a,b],i)=>{const y=M0+20+i*8;doc.setFont('helvetica','bold');doc.setTextColor(90);doc.text(pdfSan(a),M0,y);doc.setFont('helvetica','normal');doc.setTextColor(30);doc.text(pdfSan(b),M0+48,y);});
  let tot=0;try{tot=ROWS.reduce((a,r)=>a+rowCost(r),0);}catch(e){}
  doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text(pdfSan('Materialkostnad ca '+nf(tot)+' kr inkl. moms (riktpriser)'),M0,PH-18);
  try{
    if(R3&&R3.draw){
      R3.draw();
      const cv=R3.ren.domElement,url=cv.toDataURL('image/jpeg',.92),r=cv.width/Math.max(1,cv.height);
      const bw=150,bh=bw/r,bx=PW-M0-bw,by=M0+16,hh=Math.min(bh,PH-by-24);
      doc.addImage(url,'JPEG',bx,by,bw,hh);
      doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(120);doc.text('3D-vy (aktuell vinkel och lager)',bx,by+hh+4);
    }
  }catch(e){}
  const legAll=[['V\u00e4gg','w'],['F\u00f6nster (F)','f'],['D\u00f6rr (D)','d'],['Garageport (P/GP)','p'],['Eluttag','u'],['Str\u00f6mbrytare','b'],['Lamputtag (v\u00e4gg)','l'],['Taklampa','t'],['Elcentral','c'],['Altan / balkong','a'],['Takfot (streckad)','r']];
  // ===== Situationsplan (garage) =====
  if(gi&&hus){
    head('Situationsplan \u2013 hus och garage');
    const d=pdfPlanData(0,true);
    const F=pdfDrawPlan(doc,d,{x:M0+8,y:M0+18,w:PW-2*M0-70,h:PH-M0-46},{mg:0,roof:true,dims:false});
    if(F){
      const P=F.P,sc=F.sc;
      const hx=[...d.walls.flat().map(p=>p[0])],hz=[...d.walls.flat().map(p=>p[1])],gx=d.gwalls.flat().map(p=>p[0]),gz=d.gwalls.flat().map(p=>p[1]);
      const hminx=Math.min(...hx),hmaxx=Math.max(...hx),hminz=Math.min(...hz),hmaxz=Math.max(...hz),gminx=Math.min(...gx),gmaxx=Math.max(...gx),gminz=Math.min(...gz),gmaxz=Math.max(...gz);
      const axis=v=>Math.abs(Math.sin(2*v))<1e-6,okAx=axis((g0('huR')||0)*Math.PI/180)&&axis(gi.th);
      if(okAx){
      // avstånd mellan hus och garage
      if(gminx>=hmaxx){const zz=Math.max(hminz,gminz)+Math.min(hmaxz,gmaxz)>0?(Math.max(hminz,gminz)+Math.min(hmaxz,gmaxz))/2:hminz;pdfDim(doc,P(hmaxx,zz),P(gminx,zz),0,PDF_M2(gminx-hmaxx)+' m',7);}
      else if(gmaxx<=hminx){const zz=(Math.max(hminz,gminz)+Math.min(hmaxz,gmaxz))/2;pdfDim(doc,P(gmaxx,zz),P(hminx,zz),0,PDF_M2(hminx-gmaxx)+' m',7);}
      if(gminz>=hmaxz){const xx=(Math.max(hminx,gminx)+Math.min(hmaxx,gmaxx))/2;pdfDim(doc,P(xx,hmaxz),P(xx,gminz),0,PDF_M2(gminz-hmaxz)+' m',7);}
      else if(gmaxz<=hminz){const xx=(Math.max(hminx,gminx)+Math.min(hmaxx,gmaxx))/2;pdfDim(doc,P(xx,gmaxz),P(xx,hminz),0,PDF_M2(hminz-gmaxz)+' m',7);}
      pdfDim(doc,P(gminx,gminz),P(gmaxx,gminz),5,PDF_M2(gmaxx-gminx)+' m',7);
      pdfDim(doc,P(gmaxx,gminz),P(gmaxx,gmaxz),5,PDF_M2(gmaxz-gminz)+' m',7);
      if(!d.rotated){pdfDim(doc,P(hminx,hminz),P(hmaxx,hminz),5,PDF_M2(hmaxx-hminx)+' m',7);
      pdfDim(doc,P(hminx,hminz),P(hminx,hmaxz),-5,PDF_M2(hmaxz-hminz)+' m',7);}
      }else{doc.setFontSize(7);doc.setFont('helvetica','normal');doc.setTextColor(110);doc.text('Avstånd och mått mellan byggnaderna visas bara när hus och garage är vinkelräta mot varandra (rotation 0, 90, 180 eller 270 grader).',M0+8,PH-18);doc.setTextColor(30);}
      // port-pil
      const gp=d.gopens.find(o=>o.t==='p');
      if(gp){const m=[(gp.poly[0][0]+gp.poly[1][0])/2,(gp.poly[0][1]+gp.poly[1][1])/2],iw=gp.iw,a=P(m[0],m[1]),b=P(m[0]-iw[0]*2.2,m[1]-iw[1]*2.2);doc.setDrawColor(110,70,30);doc.setLineWidth(.4);doc.line(a[0],a[1],b[0],b[1]);doc.setFontSize(7);doc.setTextColor(110,70,30);doc.text('Garageport',b[0]+1.5,b[1]);doc.setTextColor(30);}
      doc.setFontSize(9);doc.setFont('helvetica','bold');doc.text('Skala 1:'+F.ratio+' (A4)',M0,PH-12);
      pdfLegend(doc,PW-M0-46,M0+20,legAll.filter(x=>['w','f','d','p','a','r'].includes(x[1])));
      pdfTitleBlock(doc,PW,PH,titel,datum,'1:'+F.ratio,'Situationsplan');
    }
  }
  // ===== Planritningar hus =====
  const maxK=Math.max(N,...WINGS.map((w,i)=>wcount(i)));
  for(let k=0;k<(hus?maxK:0);k++){
    const d=pdfPlanData(k,false);
    head('Planritning \u2013 v\u00e5ning '+(k+1));
    const F=pdfDrawPlan(doc,d,{x:M0+10,y:M0+18,w:PW-2*M0-70,h:PH-M0-46},{mg:0,roof:false,dims:true});
    if(!F)continue;
    doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(30);doc.text('Skala 1:'+F.ratio+' (A4)',M0,PH-12);
    const f0=F.P(ws[0]/2,0);doc.setFontSize(7);doc.setFont('helvetica','normal');doc.setTextColor(120);doc.text('FRAMSIDA (v\u00e4gg 1)',f0[0],Math.min(PH-18,f0[1]+(d.deck.length||WINGS.some(w=>w.s==='f')?34:25)),{align:'center'});
    doc.setTextColor(30);
    pdfLegend(doc,PW-M0-46,M0+20,legAll);
    doc.setFontSize(6.5);doc.setTextColor(110);doc.text(['M\u00e4tt i meter. V\u00e4ggarnas nummer g\u00e5r moturs','fr\u00e5n v\u00e4nstra framh\u00f6rnet (v\u00e4gg 1 fram,','2 h\u00f6ger, 3 bak, 4 v\u00e4nster).','Avst\u00e5nd till f\u00f6nster/d\u00f6rr m\u00e4ts utv\u00e4ndigt,','el-avst\u00e5nd inv\u00e4ndigt fr\u00e5n v\u00e4ggens start.'],PW-M0-46,M0+20+7+legAll.length*6.2+4);
    doc.setTextColor(30);
    pdfTitleBlock(doc,PW,PH,titel,datum,'1:'+F.ratio,'Plan v\u00e5n '+(k+1));
  }
  // ===== Garage: planritning =====
  if(gi){
    head(GN()+' \u2013 planritning');
    const gps=[[0,0],[gi.L,0],[gi.L,gi.B],[0,gi.B]],gws=[gi.L,gi.B,gi.L,gi.B],id=p=>p;
    const d={walls:[],opens:[],deck:[],els:[],ceil:[],gwalls:[],gopens:[],ws:gws,ps:gps,wings:[]};
    d.walls=pdfWallPolys(gps,gws,gws.map(l=>[{s:0,e:l}]),id);
    if(gi.type==='c'){d.walls=carportPosts(gi);d.groof=[[-.2,-.2],[gi.L+.2,-.2],[gi.L+.2,gi.B+.2],[-.2,gi.B+.2]];}
    pdfOpenList().filter(o=>o.grp==='Garage').forEach(o=>d.opens.push(pdfOpenShape(gps,o.wall,o,id)));
    const F=pdfDrawPlan(doc,d,{x:M0+10,y:M0+18,w:PW-2*M0-70,h:PH-M0-46},{mg:0,roof:false,dims:true});
    if(F){
      doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(30);doc.text('Skala 1:'+F.ratio+' (A4)',M0,PH-12);
      pdfLegend(doc,PW-M0-46,M0+20,legAll.filter(x=>(gi.type==='c'?['w']:['w','f','d','p']).includes(x[1])));
      doc.setFontSize(6.5);doc.setFont('helvetica','normal');doc.setTextColor(110);doc.text(gi.type==='c'?['Carport: stolpar c/c max 3 m,','pulpettak (streckad kontur).']:['Garagets v\u00e4ggar: 1 = l\u00e5ngsida, 2 = gavel med port,','3 = l\u00e5ngsida, 4 = gavel. Platta p\u00e5 mark 150 mm.','Sadeltak, samma vinkel som huset.'],PW-M0-46,M0+20+7+4*6.2+4);
      doc.setTextColor(30);pdfTitleBlock(doc,PW,PH,titel,datum,'1:'+F.ratio,GN()+' plan');
    }
  }
  // ===== Fasader =====
  const dk=$('dk').checked?deckSegs():null,hd=g('dkH');
  const olist=pdfOpenList();
  const houseCfg={ws,Htot,ridge,O:O_,tn,RW,gable:[false,true,false,true],floors,levels:[y00,...floors.map((f,i)=>y00+(i+1)*(H+jh+.022))].slice(0,N),yFloor,
    ops:olist.filter(o=>o.grp==='Hus'),plinth:$('gr').value==='p'?fo-jh:0,bodyBottom:$('gr').value==='p'?fo-jh:0,panelStd:$('pd').value==='s',
    decks:pdfDecks(),ps:[[0,0],[ws[0],0],[ws[0],ws[1]],[ws[0]-ws[2],ws[1]]]};
  houseCfg.levels=[];for(let k=0;k<N;k++)houseCfg.levels.push(yFloor(k));
  const names=['Framsida (v\u00e4gg 1)','H\u00f6ger sida (v\u00e4gg 2)','Baksida (v\u00e4gg 3)','V\u00e4nster sida (v\u00e4gg 4)'];
  if(hus)pdfElevPage(doc,head,houseCfg,'Fasader \u2013 hus',names,PW,PH,M0);
  if(gi){
    const gH=.15+gi.H,gcfg={ws:[gi.L,gi.B,gi.L,gi.B],Htot:gH,ridge:gH+tn*gi.B/2,O:O_,tn,RW:gi.B,gable:[false,true,false,true],floors:[],levels:[.15],yFloor:()=>.15,
      ops:olist.filter(o=>o.grp==='Garage'),plinth:0,bodyBottom:0,panelStd:$('pd').value==='s',deck:null,ghost:gi.type==='c'};
    if(gi.type==='c'){gcfg.gable=[false,false,false,false];gcfg.ridge=gcfg.Htot+.12;}
    pdfElevPage(doc,head,gcfg,'Fasader \u2013 '+GN().toLowerCase(),['Garage: l\u00e5ngsida (v\u00e4gg 1)','Garage: gavel med port (v\u00e4gg 2)','Garage: l\u00e5ngsida (v\u00e4gg 3)','Garage: gavel (v\u00e4gg 4)'],PW,PH,M0);
  }
  // ===== Fönster- och dörrschema =====
  {
    const wn=['1 fram','2 h\u00f6ger','3 bak','4 v\u00e4nster'],rows=[];let cur='';
    olist.forEach(o=>{
      const sec=o.grp==='Hus'?'Hus \u2013 v\u00e5ning '+(o.k+1):GN();
      if(sec!==cur){cur=sec;rows.push({sec});}
      rows.push({v:[o.id,o.t==='f'?'F\u00f6nster':(o.t==='p'?'Garageport':'D\u00f6rr'),nf(o.w,2)+' \u00d7 '+nf(o.h,2)+' m',o.grp==='Garage'?['1 l\u00e5ngsida','2 gavel (port)','3 l\u00e5ngsida','4 gavel'][o.wall]:wn[o.wall],nf(Math.max(0,o.c-o.w/2),2)+' m',nf(o.c,2)+' m',nf(o.sill,2)+' m',nf(o.sill+o.h,2)+' m']});
    });
    if(!rows.length)rows.push({sec:'Inga \u00f6ppningar'});
    pdfTable(doc,head,'F\u00f6nster- och d\u00f6rrschema',[{t:'Nr',x:M0},{t:'Typ',x:M0+16},{t:'Mått (B \u00d7 H)',x:M0+52},{t:'V\u00e4gg',x:M0+98},{t:'Fr\u00e5n h\u00f6rn till kant',x:M0+128},{t:'Fr\u00e5n h\u00f6rn till mitt',x:M0+170},{t:'Underkant',x:M0+212},{t:'\u00d6verkant',x:M0+240}],rows,PW,PH,M0,'M\u00e5tt i meter, m\u00e4tt fr\u00e5n v\u00e4ggens start (moturs, v\u00e4gg 1 b\u00f6rjar i v\u00e4nstra framh\u00f6rnet). Underkant och \u00f6verkant r\u00e4knas fr\u00e5n golvets \u00f6verkant.');
  }
  // ===== Elschema =====
  {
    const wn=['1 fram','2 h\u00f6ger','3 bak','4 v\u00e4nster'],rows=[];let cur=-1;
    const TN={u:'Eluttag',b:'Str\u00f6mbrytare',l:'Lamputtag (v\u00e4gg)',t:'Taklampa',c:'Elcentral (s\u00e4kringssk\u00e5p)'};
    pdfElList().forEach(x=>{
      const e=x.e,k=e.k||0;if(k!==cur){cur=k;rows.push({sec:'V\u00e5ning '+(k+1)});}
      if(e.t==='t')rows.push({v:[x.id,TN.t,'Tak','X '+nf(e.c,2)+' m','Z '+nf(e.h,2)+' m','']});
      else rows.push({v:[x.id,TN[e.t],wn[Math.min(3,Math.max(0,e.wall||0))],nf(e.c,2)+' m',nf(e.h,2)+' m','']});
    });
    if(!rows.length)rows.push({sec:'Inga elpunkter'});
    pdfTable(doc,head,'Elschema \u2013 placering och m\u00e5tt',[{t:'Nr',x:M0},{t:'Typ',x:M0+16},{t:'V\u00e4gg / plats',x:M0+78},{t:'Avst\u00e5nd fr\u00e5n v\u00e4ggens start',x:M0+118},{t:'H\u00f6jd \u00f6ver golv',x:M0+176}],rows,PW,PH,M0,'Alla kablar dras i v\u00e4ggen till elcentralen. Kabelh\u00f6jd l\u00e4ngs v\u00e4ggen: '+nf(g('elY'),2)+' m. Taklampor m\u00e4ts fr\u00e5n husets v\u00e4nstra framh\u00f6rn (X \u00e5t h\u00f6ger, Z bak\u00e5t).');
  }
  try{pdfExtraPages(doc,head,PW,PH,M0,{hus:hus,gi:gi,Htot:Htot,y00:y00,jh:jh,fo:fo,H:H,P:P_,O:O_});}catch(e){console.error(e);}
  // ===== Materiallista =====
  head('Materiallista med riktpriser');
  let y=M0+16;
  const colX=[M0,128,160,190,222];
  const th=()=>{doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor(90);doc.text('Material',colX[0],y);doc.text('M\u00e4ngd',colX[1],y);doc.text('Enhetspris',colX[2],y);doc.text('Summa',colX[3]+22,y,{align:'right'});doc.text('Anm\u00e4rkning',colX[4],y);y+=2;doc.setDrawColor(200);doc.setLineWidth(.2);doc.line(M0,y,PW-M0,y);y+=4.5;};
  th();
  let cur=-1,secSum={};
  ROWS.forEach(r=>{secSum[r.si]=(secSum[r.si]||0)+rowCost(r);});
  const UN={lm:'m',plat:'m\u00b2',st:'st',m:'m','m\u00b2':'m\u00b2','m3':'m\u00b3',rull:'rulle'};
  ROWS.forEach(r=>{
    if(y>PH-16){head('Materiallista med riktpriser (forts.)');y=M0+16;th();}
    if(r.si!==cur){cur=r.si;y+=1.5;doc.setFillColor(238,240,238);doc.rect(M0,y-3.6,PW-2*M0,5,'F');doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor(30);doc.text(pdfSan(r.sec),M0+1,y);doc.text(pdfSan(nf(secSum[r.si])+' kr'),colX[3]+22,y,{align:'right'});y+=5;}
    doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(30);
    doc.text(pdfSan(r.name).slice(0,62),colX[0]+2,y);doc.text(pdfSan(r.qty),colX[1],y);
    if(r.mode){doc.text(pdfSan(nf(r.p,r.p<5?2:0)+' kr/'+(UN[r.mode]||'')),colX[2],y);doc.text(pdfSan(nf(rowCost(r))+' kr'),colX[3]+22,y,{align:'right'});}
    doc.setTextColor(110);doc.text(pdfSan(r.note||'').slice(0,52),colX[4],y);y+=4.6;
  });
  if(y>PH-24){head('Materiallista (forts.)');y=M0+16;}
  y+=3;doc.setDrawColor(30);doc.setLineWidth(.4);doc.line(M0,y-4,PW-M0,y-4);
  doc.setFont('helvetica','bold');doc.setFontSize(11);doc.setTextColor(30);doc.text('Totalt (inkl. moms, riktpriser)',M0,y+1);doc.text(pdfSan(nf(tot)+' kr'),colX[3]+22,y+1,{align:'right'});
  return doc;
}
async function pdfSave(){
  const doc=pdfBuild(),buf=doc.output('arraybuffer');
  const nm=($('pjName').value.trim()||'ritning').replace(/[^\wåäöÅÄÖ\- ]+/g,'').trim().replace(/\s+/g,'-')||'ritning',fn=nm+'-ritning.pdf';
  let dl=null;
  try{if(window.claude&&claude.use)dl=await claude.use('downloads');}catch(e){dl=null;}
  if(dl){
    try{await dl.save({filename:fn,data:new Blob([buf],{type:'application/pdf'})});pMsg('PDF-ritningen \u00e4r klar: '+fn);}
    catch(e){pMsg(e&&e.code==='declined'?'Sparandet avbr\u00f6ts.':'Kunde inte spara PDF-filen.');}
    return;
  }
  const blob=new Blob([buf],{type:'application/pdf'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=fn;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},800);
  pMsg('PDF-ritningen skapades: '+fn);
}
$('pjPdf').onclick=()=>{pMsg('Skapar PDF...');setTimeout(()=>{pdfSave().catch(e=>pMsg('Kunde inte skapa PDF: '+(e&&e.message||e)));},30);};
