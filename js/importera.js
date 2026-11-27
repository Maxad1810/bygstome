/* Importera planritning (bild) -> hus i 3D: skala, ytterkant, innerväggar (manuellt eller automatiskt), fönster och dörrar. */
const IM={img:null,url:'',w:0,h:0,mode:'',pts:[],sc:null,pxLen:0,box:null};
function imS(){return IM.sc||0;}
function imH(x,y){const b=IM.box,s=imS();return b?[(x-b.x0)*s,(b.y1-y)*s]:[x*s,-y*s];}   // bildpunkt -> husets m (x höger, z uppåt i bilden)
function imP(X,Z){const b=IM.box,s=imS()||1;return [b.x0+X/s,b.y1-Z/s];}
function imHint(t){const e=$('imHint');if(e)e.textContent=t;}
function imRender(){
  const svg=$('imSvg');if(!svg||!IM.img){if(svg)svg.innerHTML='';return;}
  svg.setAttribute('viewBox','0 0 '+IM.w+' '+IM.h);
  const u=Math.max(IM.w,IM.h)/400;let h='<image href="'+IM.url+'" x="0" y="0" width="'+IM.w+'" height="'+IM.h+'"/>';
  const dot=(p,c)=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+(3*u)+'" fill="'+c+'"/>';
  if(IM.mode==='scale'||(IM.pxLen&&IM.sPts)){const a=(IM.sPts||IM.pts);if(a.length){h+=a.map(p=>dot(p,'#e22')).join('');if(a.length>1)h+='<line x1="'+a[0][0]+'" y1="'+a[0][1]+'" x2="'+a[1][0]+'" y2="'+a[1][1]+'" stroke="#e22" stroke-width="'+(1.2*u)+'"/>';}}
  if(IM.box){const b=IM.box;h+='<rect x="'+b.x0+'" y="'+b.y0+'" width="'+(b.x1-b.x0)+'" height="'+(b.y1-b.y0)+'" fill="#2a7fd422" stroke="#2a7fd4" stroke-width="'+(1.5*u)+'"/>';
    IW.filter(w=>(w.k||0)===IM.k).forEach(w=>{const p=imP(w.x1,w.z1),q=imP(w.x2,w.z2);h+='<line x1="'+p[0]+'" y1="'+p[1]+'" x2="'+q[0]+'" y2="'+q[1]+'" stroke="#d4501a" stroke-width="'+(2.2*u)+'" stroke-linecap="round" opacity=".85"/>';});}
  if(IM.mode==='box'||IM.mode==='wall'){IM.pts.forEach(p=>{h+=dot(p,'#2a7fd4');});}
  (IM.marks||[]).forEach(m=>{h+='<rect x="'+(m[0]-3*u)+'" y="'+(m[1]-3*u)+'" width="'+(6*u)+'" height="'+(6*u)+'" fill="'+(m[2]==='d'?'#7a4a1a':'#2a9fd4')+'" stroke="#fff" stroke-width="'+(.6*u)+'"/>';});
  svg.innerHTML=h;
}
function imSetMode(m){
  IM.mode=m;IM.pts=[];
  ['imScale','imBox','imWall','imWin','imDoor'].forEach(id=>{const b=$(id);if(b)b.classList.toggle('primary',b.dataset.m===m);});
  imHint({scale:'Klicka på två punkter vars verkliga avstånd du känner, t.ex. husets båda ytterhörn. Skriv sedan avståndet i meter.',box:'Klicka på husets övre vänstra och nedre högra ytterhörn (ytterkant av ytterväggarna).',wall:'Klicka där innerväggen börjar och där den slutar.',win:'Klicka på en yttervägg där ett fönster ska sitta.',door:'Klicka på en yttervägg där en dörr ska sitta.','':'Välj ett steg ovan.'}[m]||'');
  imRender();
}
function imApplyBox(){
  const b=IM.box,s=imS();if(!b||!s)return;
  const L=Math.round((b.x1-b.x0)*s*10)/10,W=Math.round((b.y1-b.y0)*s*10)/10;
  if(!IM.cleared){ops=ops.filter(o=>o.bd);inst=inst.filter(q=>ops.some(o=>o.id===q.oid));IM.cleared=true;try{drawOps();}catch(e){}}
  $('hs').value='r';$('L').value=L;$('W').value=W;
  ['hs','L','W'].forEach(id=>$(id).dispatchEvent(new Event('input',{bubbles:true})));
  try{calc();}catch(e){}
  imHint('Huset är satt till '+L.toString().replace('.',',')+' x '+W.toString().replace('.',',')+' m. Rita nu innerväggar, eller klicka "Hitta innerväggar automatiskt".');
}
function imAddOpening(t,X,Z){
  const W1=g0('W1'),W2=g0('W2'),k=IM.k||0,d=[Z,W1-X,W2-Z,X],ws=[W1,W2,W1,W2];
  // vägg 0 nederkant (z=0), 1 höger (x=W1), 2 överkant (z=W2), 3 vänster (x=0)
  const dist=[Math.abs(Z),Math.abs(X-W1),Math.abs(Z-W2),Math.abs(X)];let wi=0;dist.forEach((v,i)=>{if(v<dist[wi])wi=i;});
  if(dist[wi]>Math.max(.8,.06*Math.max(W1,W2))){imHint('Klicka närmare en yttervägg.');return;}
  const c=[X,Z,W1-X,W2-Z][wi],dm=t==='d'?[.9,2.1]:[1.2,1.2],v=(mcount()>1)?k+1:0;
  let o=ops.find(q=>q.t===t&&q.w===dm[0]&&q.h===dm[1]&&(q.v||0)===v&&!q.bd);
  if(!o){o={t,w:dm[0],h:dm[1],n:0,v,id:++uid};ops.push(o);}
  o.n=(o.n||0)+1;
  inst.push({oid:o.id,k,wall:wi,c:Math.min(Math.max(c,dm[0]/2+.2),ws[wi]-dm[0]/2-.2)});
  (IM.marks=IM.marks||[]).push([...imP(X,Z),t]);
  try{drawOps();calc();build3d();}catch(e){console.error(e);}
  imRender();
}
function imDetect(){
  if(!IM.img||!IM.box||!imS()){imHint('Sätt skala och markera husets ytterkant först.');return 0;}
  const f=Math.min(1,2200/Math.max(IM.w,IM.h)),cw=Math.round(IM.w*f),ch=Math.round(IM.h*f),cv=document.createElement('canvas');cv.width=cw;cv.height=ch;
  const cx=cv.getContext('2d',{willReadFrequently:true});cx.fillStyle='#fff';cx.fillRect(0,0,cw,ch);cx.drawImage(IM.img,0,0,cw,ch);
  const d=cx.getImageData(0,0,cw,ch).data,dark=new Uint8Array(cw*ch);
  for(let i=0;i<cw*ch;i++){const a=d[i*4+3]/255;dark[i]=(a>.5&&(0.3*d[i*4]+0.59*d[i*4+1]+0.11*d[i*4+2])<135)?1:0;}
  const r=imS()/f,b=IM.box,ins=.2/r;   // m per canvas-px
  const X0=Math.round(b.x0*f+ins),X1=Math.round(b.x1*f-ins),Y0=Math.round(b.y0*f+ins),Y1=Math.round(b.y1*f-ins);
  if(X1-X0<20||Y1-Y0<20)return 0;
  const minRun=Math.round(.6/r),gapRows=Math.max(1,Math.round(.12/r)),tMin=.05,tMax=.45;
  const scan=(horiz)=>{
    const A0=horiz?Y0:X0,A1=horiz?Y1:X1,B0=horiz?X0:Y0,B1=horiz?X1:Y1,out=[];
    const val=(a,bb)=>horiz?dark[a*cw+bb]:dark[bb*cw+a];
    let open=[];   // band: {a0,a1,runs:[[b0,b1]],last}
    for(let a=A0;a<=A1;a++){
      const runs=[];let st=-1;
      for(let bb=B0;bb<=B1+1;bb++){const v=bb<=B1?val(a,bb):0;if(v&&st<0)st=bb;else if(!v&&st>=0){if(bb-st>=minRun)runs.push([st,bb-1]);st=-1;}}
      const used=new Set();
      runs.forEach(rn=>{
        const bd=open.find(o=>a-o.last<=gapRows&&Math.min(o.b1,rn[1])-Math.max(o.b0,rn[0])>.6*Math.min(o.b1-o.b0,rn[1]-rn[0]));
        if(bd){bd.last=a;bd.b0=Math.min(bd.b0,rn[0]);bd.b1=Math.max(bd.b1,rn[1]);bd.rows.push([a,rn[0],rn[1]]);used.add(bd);}
        else open.push({a0:a,last:a,b0:rn[0],b1:rn[1],rows:[[a,rn[0],rn[1]]]});
      });
      open=open.filter(o=>{if(a-o.last>gapRows){out.push(o);return false;}return true;});
    }
    out.push(...open);
    return out.filter(o=>{const t=(o.last-o.a0+1)*r;return t>=tMin&&t<=tMax;}).map(o=>{
      const bs=o.rows.map(q=>q[1]).sort((x,y)=>x-y),be=o.rows.map(q=>q[2]).sort((x,y)=>x-y);
      return {a:(o.a0+o.last)/2,b0:bs[Math.floor(bs.length/2)],b1:be[Math.floor(be.length/2)]};
    });
  };
  const toH=(horiz,a,bb)=>horiz?imH(bb/f,a/f):imH(a/f,bb/f);
  let segs=[];
  [true,false].forEach(horiz=>{
    const raw=scan(horiz).sort((p,q)=>p.a-q.a||p.b0-q.b0),lines=[];
    raw.forEach(sg=>{const l=lines.find(L=>Math.abs(L.a-sg.a)<=.12/r);if(l)l.items.push(sg);else lines.push({a:sg.a,items:[sg]});});
    lines.forEach(L=>{
      L.items.sort((p,q)=>p.b0-q.b0);const m=[];
      L.items.forEach(sg=>{const last=m[m.length-1];if(last&&sg.b0-last.b1<=1.25/r){if(sg.b0-last.b1>=.55/r&&last.door==null)last.door=((last.b1+sg.b0)/2);last.b1=Math.max(last.b1,sg.b1);}else m.push({...sg});});
      m.forEach(sg=>{if((sg.b1-sg.b0)*r<.8)return;const p=toH(horiz,L.a,sg.b0),q=toH(horiz,L.a,sg.b1);
        const o={x1:p[0],z1:p[1],x2:q[0],z2:q[1],d:0};if(sg.door!=null){const dp=toH(horiz,L.a,sg.door);o.d=1;o.dc=Math.hypot(dp[0]-p[0],dp[1]-p[1]);}segs.push(o);});
    });
  });
  // slå ihop dubletter
  segs=segs.filter((s,i)=>!segs.some((t,j)=>j<i&&Math.hypot(s.x1-t.x1,s.z1-t.z1)<.2&&Math.hypot(s.x2-t.x2,s.z2-t.z2)<.2));
  const k=IM.k||0;IW=IW.filter(w=>(w.k||0)!==k);
  const bw=(a,lo,hi)=>a>lo+.45&&a<hi-.45,Wm=g0('W1')||(b.x1-b.x0)*imS(),Hm=g0('W2')||(b.y1-b.y0)*imS();
  segs=segs.filter(s=>{const hz=Math.abs(s.z1-s.z2)<.05;return hz?bw(s.z1,0,Hm):bw(s.x1,0,Wm);});
  segs.forEach(s=>{const p=iwSnap(s.x1,s.z1),q=iwSnap(s.x2,s.z2),L=Math.hypot(q[0]-p[0],q[1]-p[1]);if(L<.5)return;IW.push({k,x1:p[0],z1:p[1],x2:q[0],z2:q[1],d:s.d,dc:+(Math.min(Math.max(s.dc==null?L/2:s.dc,.45),L-.45)).toFixed(2)});});
  try{drawIW();calc();build3d();}catch(e){console.error(e);}
  imRender();return IW.filter(w=>(w.k||0)===k).length;
}
(function(){
  const svg=$('imSvg');if(!svg)return;
  IM.k=0;
  const pt=e=>{const m=svg.getScreenCTM();if(!m)return null;const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(m.inverse());return [q.x,q.y];};
  const kSel=()=>{IM.k=+($('imK').value)||0;};
  $('imK').onchange=()=>{kSel();imRender();};
  $('imFile').onchange=ev=>{
    const f=ev.target.files[0];if(!f)return;
    if(!/^image\//.test(f.type)){imHint('Välj en bildfil (PNG eller JPG). Har du en PDF: öppna den och spara sidan som bild, eller ta en skärmbild.');return;}
    const rd=new FileReader();rd.onload=()=>{const im=new Image();im.onload=()=>{IM.img=im;IM.url=rd.result;IM.w=im.naturalWidth;IM.h=im.naturalHeight;IM.sc=null;IM.box=null;IM.sPts=null;IM.pxLen=0;IM.marks=[];IM.cleared=false;imSetMode('scale');};im.onerror=()=>imHint('Bilden kunde inte läsas.');im.src=rd.result;};rd.readAsDataURL(f);
  };
  const need=()=>{if(!IM.img){imHint('Välj en ritning först.');return false;}return true;};
  [['imScale','scale'],['imBox','box'],['imWall','wall'],['imWin','win'],['imDoor','door']].forEach(([id,m])=>{const b=$(id);b.dataset.m=m;b.onclick=()=>{if(!need())return;if(m!=='scale'&&!IM.sc){imHint('Sätt skalan först (steg 1).');return;}if((m==='wall'||m==='win'||m==='door')&&!IM.box){imHint('Markera husets ytterkant först (steg 2).');return;}imSetMode(m);};});
  $('imDist').oninput=()=>{if(IM.pxLen){IM.sc=(parseFloat($('imDist').value.replace(',','.'))||0)/IM.pxLen;if(IM.box)imApplyBox();}};
  svg.addEventListener('click',e=>{
    if(!IM.img||!IM.mode)return;const p=pt(e);if(!p)return;kSel();
    if(IM.mode==='scale'){IM.pts.push(p);if(IM.pts.length===2){IM.sPts=IM.pts.slice();IM.pxLen=Math.hypot(IM.pts[0][0]-IM.pts[1][0],IM.pts[0][1]-IM.pts[1][1]);IM.pts=[];
        const dd=parseFloat($('imDist').value.replace(',','.'));IM.sc=dd>0?dd/IM.pxLen:null;imHint('Skala satt med avståndet '+(dd||0)+' m. Ändra måttet i rutan om det är fel, och gå vidare till steg 2.');imSetMode('');}else imRender();return;}
    if(IM.mode==='box'){IM.pts.push(p);if(IM.pts.length===2){const [a,b]=IM.pts;IM.box={x0:Math.min(a[0],b[0]),x1:Math.max(a[0],b[0]),y0:Math.min(a[1],b[1]),y1:Math.max(a[1],b[1])};IM.pts=[];imApplyBox();imSetMode('');}else imRender();return;}
    const h=imH(p[0],p[1]);
    if(IM.mode==='wall'){
      if(!IM.pts.length){IM.pts=[p];imRender();return;}
      const a=imH(IM.pts[0][0],IM.pts[0][1]),s0=iwSnap(a[0],a[1]),s1=iwOrtho(s0,iwSnap(h[0],h[1])),L=Math.hypot(s1[0]-s0[0],s1[1]-s0[1]);
      if(L>=.3)IW.push({k:IM.k,x1:s0[0],z1:s0[1],x2:s1[0],z2:s1[1],d:0,dc:+(L/2).toFixed(2)});
      IM.pts=[];try{drawIW();calc();build3d();}catch(x){console.error(x);}imRender();return;
    }
    if(IM.mode==='win'||IM.mode==='door')imAddOpening(IM.mode==='win'?'f':'d',h[0],h[1]);
  });
  $('imAuto').onclick=()=>{if(!need())return;const n=imDetect();if(n)imHint('Hittade '+n+' innerväggar. Kontrollera mot ritningen och ta bort eller rita om det som är fel (lista under Innerväggar). Dörrar sätts där väggen har en lucka.');else if(IM.box&&imS())imHint('Hittade inga innerväggar. Rita dem för hand med steg 3.');};
  $('imReset').onclick=()=>{IM.img=null;IM.url='';IM.sc=null;IM.box=null;IM.sPts=null;IM.pxLen=0;IM.marks=[];IM.pts=[];IM.mode='';$('imFile').value='';imRender();imHint('Välj en ritning (bild) för att börja.');};
})();
