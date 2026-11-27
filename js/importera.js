/* Importera planritning (bild eller PDF) -> hus i 3D: skala, husets ytterkant (rektangel, L-, T-, U- eller X-form),
   innerväggar och fönster/dörrar (automatiskt eller för hand). Allt kan ångras. */
const IM={img:null,url:'',w:0,h:0,mode:'',pts:[],sc:null,pxLen:0,poly:null,box:null,rot:0,dz:0,marks:[],k:0,snap:null,wings:[]};
function imS(){return IM.sc||0;}
function imHint(t){const e=$('imHint');if(e)e.textContent=t;}
/* bild -> husets modellkoordinater (x höger, z uppåt i bilden), med ev. kvartsvarv så att huvudkroppen ligger längs x */
function imXf(x,y){
  const b=IM.box,s=imS();if(!b)return [x*s,-y*s];
  let X=(x-b.x0)*s,Z=(b.y1-y)*s,Wd=(b.x1-b.x0)*s,Hd=(b.y1-b.y0)*s;
  for(let i=0;i<IM.rot;i++){const nx=Hd-Z,nz=X;X=nx;Z=nz;const t=Wd;Wd=Hd;Hd=t;}
  return [X,Z-IM.dz];
}
function imInv(X,Z){
  const b=IM.box,s=imS()||1;let Wd=(b.x1-b.x0)*s,Hd=(b.y1-b.y0)*s;Z+=IM.dz;
  const dims=[[Wd,Hd]];for(let i=0;i<IM.rot;i++){const q=dims[dims.length-1];dims.push([q[1],q[0]]);}
  for(let i=IM.rot;i>0;i--){const d=dims[i-1];const x0=Z,z0=d[1]-X;X=x0;Z=z0;}
  return [b.x0+X/s,b.y1-Z/s];
}
function imInPoly(p,x,y){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){if((p[i][1]>y)!==(p[j][1]>y)&&x<(p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0])c=!c;}return c;}
function imModelPoly(){return IM.poly?IM.poly.map(p=>imXf(p[0],p[1])):null;}
function imRender(){
  const svg=$('imSvg');if(!svg||!IM.img){if(svg)svg.innerHTML='';return;}
  svg.setAttribute('viewBox','0 0 '+IM.w+' '+IM.h);
  const u=Math.max(IM.w,IM.h)/400;let h='<image href="'+IM.url+'" x="0" y="0" width="'+IM.w+'" height="'+IM.h+'"/>';
  const dot=(p,c)=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+(3*u)+'" fill="'+c+'"/>';
  if(IM.sPts){h+=IM.sPts.map(p=>dot(p,'#e22')).join('');if(IM.sPts.length>1)h+='<line x1="'+IM.sPts[0][0]+'" y1="'+IM.sPts[0][1]+'" x2="'+IM.sPts[1][0]+'" y2="'+IM.sPts[1][1]+'" stroke="#e22" stroke-width="'+(1.2*u)+'"/>';}
  if(IM.mode==='scale')h+=IM.pts.map(p=>dot(p,'#e22')).join('');
  if(IM.poly){h+='<polygon points="'+IM.poly.map(p=>p.join(',')).join(' ')+'" fill="#2a7fd422" stroke="#2a7fd4" stroke-width="'+(1.5*u)+'"/>';
    if(IM.box)IW.filter(w=>(w.k||0)===IM.k).forEach(w=>{const p=imInv(w.x1,w.z1),q=imInv(w.x2,w.z2);h+='<line x1="'+p[0]+'" y1="'+p[1]+'" x2="'+q[0]+'" y2="'+q[1]+'" stroke="#d4501a" stroke-width="'+(2.2*u)+'" stroke-linecap="round" opacity=".85"/>';});}
  if(IM.mode==='outline'&&IM.pts.length){h+='<polyline points="'+IM.pts.map(p=>p.join(',')).join(' ')+'" fill="none" stroke="#2a7fd4" stroke-width="'+(1.5*u)+'"/>'+IM.pts.map(p=>dot(p,'#2a7fd4')).join('');}
  if(IM.mode==='wall')h+=IM.pts.map(p=>dot(p,'#d4501a')).join('');
  (IM.marks||[]).forEach(m=>{h+='<rect x="'+(m[0]-3*u)+'" y="'+(m[1]-3*u)+'" width="'+(6*u)+'" height="'+(6*u)+'" fill="'+(m[2]==='d'?'#7a4a1a':'#2a9fd4')+'" stroke="#fff" stroke-width="'+(.6*u)+'"/>';});
  svg.innerHTML=h;
}
const IM_HINTS={scale:'Klicka på två punkter vars verkliga avstånd du känner, t.ex. husets båda ytterhörn. Skriv avståndet i meter i rutan.',outline:'Klicka på husets ytterhörn ett i taget runt hela huset (ytterkant av ytterväggarna). Rektangel: klicka två motsatta hörn och sedan Klar. L-, T-, U-form: alla hörn, avsluta med Klar eller genom att klicka på första punkten.',wall:'Klicka där innerväggen börjar och där den slutar.',win:'Klicka på en yttervägg där ett fönster ska sitta.',door:'Klicka på en yttervägg där en dörr ska sitta.','':'Välj ett steg ovan.'};
function imSetMode(m){
  IM.mode=m;IM.pts=[];
  ['imScale','imOutline','imWall','imWin','imDoor'].forEach(id=>{const b=$(id);if(b)b.classList.toggle('primary',b.dataset.m===m);});
  imHint(IM_HINTS[m]||'');imRender();
}
/* ---- Passa polygonen mot husmodellen (huvudkropp + upp till två vingar) ---- */
function imFit(poly){
  const s=imS(),res=.05,b=IM.box,BW=(b.x1-b.x0)*s,BH=(b.y1-b.y0)*s,nx=Math.max(1,Math.round(BW/res)),nz=Math.max(1,Math.round(BH/res));
  const base=poly.map(p=>[(p[0]-b.x0)*s/res,(b.y1-p[1])*s/res]);
  let M=[];for(let i=0;i<nx;i++){const c=new Uint8Array(nz);for(let j=0;j<nz;j++)c[j]=imInPoly(base,i+.5,j+.5)?1:0;M.push(c);}
  let best=null,dims=[nx,nz];
  for(let q=0;q<4;q++){
    const [X,Z]=dims,area=M.reduce((a,c)=>a+c.reduce((x,y)=>x+y,0),0);
    const full=[];for(let j=0;j<Z;j++){let n=0;for(let i=0;i<X;i++)n+=M[i][j];full.push(n>=X-1);}
    let ja=-1,jb=-1,cur=-1;for(let j=0;j<=Z;j++){if(j<Z&&full[j]){if(cur<0)cur=j;}else if(cur>=0){if(j-cur>jb-ja+1||ja<0){ja=cur;jb=j-1;}cur=-1;}}
    if(ja>=0&&(jb-ja+1)*res>=1.5){
      const iv=j=>{const r=[];let st=-1;for(let i=0;i<=X;i++){const v=i<X?M[i][j]:0;if(v&&st<0)st=i;else if(!v&&st>=0){if(i-st>=Math.round(1/res))r.push([st,i-1]);st=-1;}}return r;};
      const wings=[];
      if(jb<Z-1){const j=jb+1+Math.floor((Z-1-jb-1)/2);iv(j).forEach(r=>wings.push({s:'b',x0:r[0]*res,w:(r[1]-r[0]+1)*res,len:(Z-1-jb)*res}));}
      if(ja>0){const j=Math.floor((ja-1)/2);iv(j).forEach(r=>wings.push({s:'f',x0:r[0]*res,w:(r[1]-r[0]+1)*res,len:ja*res}));}
      // jämför förväntad form med verklig
      let bad=0;for(let i=0;i<X;i++)for(let j=0;j<Z;j++){let e=(j>=ja&&j<=jb)?1:0;if(!e)for(const w of wings){const i0=Math.round(w.x0/res),i1=i0+Math.round(w.w/res)-1;if(i>=i0&&i<=i1&&((w.s==='b'&&j>jb)||(w.s==='f'&&j<ja))){e=1;break;}}if(e!==M[i][j])bad++;}
      const cand={q,L:X*res,W:(jb-ja+1)*res,dz:ja*res,wings,bad:bad/Math.max(1,area),nw:wings.length};
      if(!best||cand.bad<best.bad-.01||(Math.abs(cand.bad-best.bad)<=.01&&cand.nw<best.nw))best=cand;
    }
    const N=[];for(let x=0;x<Z;x++)N.push(new Uint8Array(X));for(let i=0;i<X;i++)for(let j=0;j<Z;j++)N[Z-1-j][i]=M[i][j];   // kvartsvarv
    M=N;dims=[Z,X];
  }
  return best;
}
function imSnapshot(){return JSON.stringify({ops,inst,IW,uid,WINGS,WSH,f:['hs','L','W','GL','GB'].map(id=>$(id).value)});}
function imRestore(j){const o=JSON.parse(j);ops=o.ops;inst=o.inst;IW=o.IW;uid=o.uid;WINGS=o.WINGS;WSH=o.WSH;['hs','L','W','GL','GB'].forEach((id,i)=>{$(id).value=o.f[i];});try{drawOps();drawIW();calc();build3d();}catch(e){console.error(e);}}
function imApplyOutline(poly){
  const s=imS();if(!s)return;
  IM.undo=imSnapshot();IM.poly=poly;
  const xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]);IM.box={x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys)};IM.rot=0;IM.dz=0;
  let note='';
  const fit=poly.length<=4?{q:0,L:(IM.box.x1-IM.box.x0)*s,W:(IM.box.y1-IM.box.y0)*s,dz:0,wings:[],bad:0}:imFit(poly);
  if(!fit){IM.poly=[[IM.box.x0,IM.box.y0],[IM.box.x1,IM.box.y0],[IM.box.x1,IM.box.y1],[IM.box.x0,IM.box.y1]];imHint('Formen kunde inte tolkas som L-, T-, U- eller X-form. Jag använde en rektangel runt hela huset.');return imFinish(IM.box,{L:(IM.box.x1-IM.box.x0)*s,W:(IM.box.y1-IM.box.y0)*s,wings:[]});}
  IM.rot=fit.q;IM.dz=fit.dz;
  if(fit.wings.length>2){fit.wings.sort((a,b)=>b.w*b.len-a.w*a.len);fit.wings.length=2;note+=' Mer än två vingar stöds inte, de två största användes.';}
  if(fit.bad>.04)note+=' Formen avviker en del från närmaste hustyp, kontrollera 3D-bilden.';
  if(fit.wings.length>=2&&Math.abs(fit.wings[0].w-fit.wings[1].w)>.3)note+=' Vingarna har olika bredd, medelvärdet användes.';
  imFinish(IM.box,fit,note);
}
function imFinish(b,fit,note){
  const r1=v=>Math.round(v*10)/10,n=fit.wings.length;
  const hs=n===0?'r':n===1?((fit.wings[0].x0>.1&&fit.wings[0].x0+fit.wings[0].w<fit.L-.1)?'t':'l'):(fit.wings.some(w=>w.s==='f')&&fit.wings.some(w=>w.s==='b')?'x':'u');
  if($('imRep').checked){ops=ops.filter(o=>o.bd);inst=inst.filter(q=>ops.some(o=>o.id===q.oid));WINGS.forEach(w=>{w.gops=[];});try{drawOps();}catch(e){}}
  $('hs').value=hs;$('L').value=r1(fit.L);$('W').value=r1(fit.W);
  if(n){$('GB').value=r1(fit.wings.reduce((a,w)=>a+w.w,0)/n);$('GL').value=r1(fit.wings.reduce((a,w)=>a+w.len,0)/n);}
  ['hs','L','W','GL','GB'].forEach(id=>$(id).dispatchEvent(new Event('input',{bubbles:true})));
  try{calc();}catch(e){}
  if(n){const ord=hs==='x'?fit.wings.slice().sort((a,c)=>(a.s==='b'?0:1)-(c.s==='b'?0:1)):fit.wings;WINGS=ord.map(w=>({s:w.s,x0:Math.max(0,Math.min(w.x0,fit.L-g0('GB')))}));}
  try{calc();build3d();}catch(e){console.error(e);}
  IM.fit=fit;
  imHint('Huset är satt till '+({r:'rektangel',l:'L-form',u:'U-form',x:'X-form'}[hs])+', '+r1(fit.L).toString().replace('.',',')+' x '+r1(fit.W).toString().replace('.',',')+' m'+(n?' med '+n+' '+(n>1?'vingar':'vinge'):'')+'.'+(note||'')+' Hitta nu innerväggar, fönster och dörrar automatiskt, eller klicka in dem själv.');
  imRender();
}
/* ---- Bildanalys ---- */
function imCanvas(){
  const f=Math.min(1,2400/Math.max(IM.w,IM.h)),cw=Math.round(IM.w*f),ch=Math.round(IM.h*f),cv=document.createElement('canvas');cv.width=cw;cv.height=ch;
  const cx=cv.getContext('2d',{willReadFrequently:true});cx.fillStyle='#fff';cx.fillRect(0,0,cw,ch);cx.drawImage(IM.img,0,0,cw,ch);
  const d=cx.getImageData(0,0,cw,ch).data,lum=new Uint8Array(cw*ch),blue=new Uint8Array(cw*ch);
  const hist=new Uint32Array(256);
  for(let i=0;i<cw*ch;i++){const r=d[i*4],g=d[i*4+1],b=d[i*4+2],l=Math.round(.3*r+.59*g+.11*b);lum[i]=l;hist[l]++;blue[i]=(b>r+35&&b>g+5&&l>90)?1:0;}
  // Otsu
  let tot=cw*ch,sum=0;for(let t=0;t<256;t++)sum+=t*hist[t];let sB=0,wB=0,mx=0,th=135;
  for(let t=0;t<256;t++){wB+=hist[t];if(!wB)continue;const wF=tot-wB;if(!wF)break;sB+=t*hist[t];const mB=sB/wB,mF=(sum-sB)/wF,v=wB*wF*(mB-mF)*(mB-mF);if(v>mx){mx=v;th=t;}}
  th=Math.min(170,Math.max(90,th));
  const dark=new Uint8Array(cw*ch);for(let i=0;i<cw*ch;i++)dark[i]=lum[i]<th?1:0;
  return {f,cw,ch,dark,blue};
}
function imSnapIn(X,Z,mp){
  // för en punkt nära en yttervägg: placera den på väggens insida (0,145 m)
  let best=null;
  for(let i=0;i<mp.length;i++){const a=mp[i],c=mp[(i+1)%mp.length];
    if(Math.abs(a[1]-c[1])<.02){const lo=Math.min(a[0],c[0]),hi=Math.max(a[0],c[0]);if(X>lo-.45&&X<hi+.45){const d=Math.abs(Z-a[1]);if(d<.45&&(!best||d<best.d))best={d,hz:true,e:a[1]};}}
    else if(Math.abs(a[0]-c[0])<.02){const lo=Math.min(a[1],c[1]),hi=Math.max(a[1],c[1]);if(Z>lo-.45&&Z<hi+.45){const d=Math.abs(X-a[0]);if(d<.45&&(!best||d<best.d))best={d,hz:false,e:a[0]};}}}
  if(!best)return [Math.round(X*20)/20,Math.round(Z*20)/20];
  const sgn=(px,pz)=>imInPoly(mp,px,pz);
  if(best.hz){const zi=sgn(X,best.e+.1)?best.e+.145:best.e-.145;return [Math.round(X*20)/20,zi];}
  const xi=sgn(best.e+.1,Z)?best.e+.145:best.e-.145;return [xi,Math.round(Z*20)/20];
}
function imDetect(){
  if(!IM.img||!IM.poly||!imS()){imHint('Sätt skala och markera husets ytterkant först.');return 0;}
  const {f,cw,ch,dark}=imCanvas(),r=imS()/f,mp=imModelPoly(),k=IM.k||0;
  // inre område: polygonen krympt 0,2 m
  const ins=Math.round(.2/r),inside=new Uint8Array(cw*ch),pc=IM.poly.map(p=>[p[0]*f,p[1]*f]);
  const xs=pc.map(p=>p[0]),ys=pc.map(p=>p[1]),bx0=Math.max(0,Math.floor(Math.min(...xs))),bx1=Math.min(cw-1,Math.ceil(Math.max(...xs))),by0=Math.max(0,Math.floor(Math.min(...ys))),by1=Math.min(ch-1,Math.ceil(Math.max(...ys)));
  for(let y=by0;y<=by1;y++)for(let x=bx0;x<=bx1;x++)inside[y*cw+x]=imInPoly(pc,x+.5,y+.5)?1:0;
  const er=new Uint8Array(cw*ch),tmp=new Uint8Array(cw*ch);
  for(let y=by0;y<=by1;y++){let run=0;for(let x=bx0;x<=bx1;x++){run=inside[y*cw+x]?run+1:0;tmp[y*cw+x]=run>=ins?1:0;}let run2=0;for(let x=bx1;x>=bx0;x--){run2=inside[y*cw+x]?run2+1:0;tmp[y*cw+x]=(tmp[y*cw+x]&&run2>=ins)?1:0;}}
  for(let x=bx0;x<=bx1;x++){let run=0;for(let y=by0;y<=by1;y++){run=tmp[y*cw+x]?run+1:0;er[y*cw+x]=run>=ins?1:0;}let run2=0;for(let y=by1;y>=by0;y--){run2=tmp[y*cw+x]?run2+1:0;er[y*cw+x]=(er[y*cw+x]&&run2>=ins)?1:0;}}
  const minRun=Math.round(.6/r),gapRows=Math.max(1,Math.round(.12/r)),tMin=.04,tMax=.45;
  const scan=horiz=>{
    const A0=horiz?by0:bx0,A1=horiz?by1:bx1,B0=horiz?bx0:by0,B1=horiz?bx1:by1,out=[];
    const val=(a,bb)=>horiz?(dark[a*cw+bb]&&er[a*cw+bb]):(dark[bb*cw+a]&&er[bb*cw+a]);
    let open=[];
    for(let a=A0;a<=A1;a++){
      const runs=[];let st=-1;
      for(let bb=B0;bb<=B1+1;bb++){const v=bb<=B1?val(a,bb):0;if(v&&st<0)st=bb;else if(!v&&st>=0){if(bb-st>=minRun)runs.push([st,bb-1]);st=-1;}}
      runs.forEach(rn=>{
        const bd=open.find(o=>a-o.last<=gapRows&&Math.min(o.b1,rn[1])-Math.max(o.b0,rn[0])>.6*Math.min(o.b1-o.b0,rn[1]-rn[0]));
        if(bd){bd.last=a;bd.b0=Math.min(bd.b0,rn[0]);bd.b1=Math.max(bd.b1,rn[1]);bd.rows.push([a,rn[0],rn[1]]);}
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
  const toM=(horiz,a,bb)=>horiz?imXf(bb/f,a/f):imXf(a/f,bb/f);
  let segs=[];
  [true,false].forEach(horiz=>{
    const raw=scan(horiz).sort((p,q)=>p.a-q.a||p.b0-q.b0),lines=[];
    raw.forEach(sg=>{const l=lines.find(L=>Math.abs(L.a-sg.a)<=.12/r);if(l)l.items.push(sg);else lines.push({a:sg.a,items:[sg]});});
    lines.forEach(L=>{
      L.items.sort((p,q)=>p.b0-q.b0);const m=[];
      L.items.forEach(sg=>{const last=m[m.length-1];if(last&&sg.b0-last.b1<=1.25/r){if(sg.b0-last.b1>=.55/r&&last.door==null)last.door=((last.b1+sg.b0)/2);last.b1=Math.max(last.b1,sg.b1);}else m.push({...sg});});
      m.forEach(sg=>{if((sg.b1-sg.b0)*r<1.0)return;const p=toM(horiz,L.a,sg.b0),q=toM(horiz,L.a,sg.b1);
        const o={x1:p[0],z1:p[1],x2:q[0],z2:q[1],d:0};if(sg.door!=null){const dp=toM(horiz,L.a,sg.door);o.d=1;o.dc=Math.hypot(dp[0]-p[0],dp[1]-p[1]);}segs.push(o);});
    });
  });
  segs=segs.filter((s,i)=>!segs.some((t,j)=>j<i&&Math.hypot(s.x1-t.x1,s.z1-t.z1)<.2&&Math.hypot(s.x2-t.x2,s.z2-t.z2)<.2));
  // väggar som ligger i ytterväggen räknas inte
  const nearOuter=(X,Z)=>{for(let i=0;i<mp.length;i++){const a=mp[i],c=mp[(i+1)%mp.length],lo=[Math.min(a[0],c[0]),Math.min(a[1],c[1])],hi=[Math.max(a[0],c[0]),Math.max(a[1],c[1])];const dx=Math.max(lo[0]-X,0,X-hi[0]),dz=Math.max(lo[1]-Z,0,Z-hi[1]);if(Math.hypot(dx,dz)<.4)return true;}return false;};
  segs=segs.filter(s=>{const mid=[(s.x1+s.x2)/2,(s.z1+s.z2)/2];return imInPoly(mp,mid[0],mid[1])&&!onOuterLine(s,mp);});
  function onOuterLine(s,mp){for(let i=0;i<mp.length;i++){const a=mp[i],c=mp[(i+1)%mp.length];if(Math.abs(a[1]-c[1])<.02&&Math.abs(s.z1-s.z2)<.05&&Math.abs(s.z1-a[1])<.45)return true;if(Math.abs(a[0]-c[0])<.02&&Math.abs(s.x1-s.x2)<.05&&Math.abs(s.x1-a[0])<.45)return true;}return false;}
  // möbler och lösa streck: behåll väggar som är förbundna med ytterväggen eller en annan vägg
  const touch=(X,Z,others)=>{if(nearOuter(X,Z))return true;return others.some(o=>{const lo=[Math.min(o.x1,o.x2)-.4,Math.min(o.z1,o.z2)-.4],hi=[Math.max(o.x1,o.x2)+.4,Math.max(o.z1,o.z2)+.4];return X>=lo[0]&&X<=hi[0]&&Z>=lo[1]&&Z<=hi[1];});};
  let ch2=true;while(ch2){ch2=false;segs=segs.filter(s=>{const o=segs.filter(t=>t!==s),ok=touch(s.x1,s.z1,o)||touch(s.x2,s.z2,o);if(!ok)ch2=true;return ok;});}
  IM.undoIW=JSON.stringify(IW);
  IW=IW.filter(w=>(w.k||0)!==k);
  segs.forEach(s=>{const p=imSnapIn(s.x1,s.z1,mp),q=imSnapIn(s.x2,s.z2,mp),L=Math.hypot(q[0]-p[0],q[1]-p[1]);if(L<.6)return;IW.push({k,x1:p[0],z1:p[1],x2:q[0],z2:q[1],d:s.d,dc:+(Math.min(Math.max(s.dc==null?L/2:s.dc,.45),L-.45)).toFixed(2)});});
  try{drawIW();calc();build3d();}catch(e){console.error(e);}
  imRender();return IW.filter(w=>(w.k||0)===k).length;
}
/* Fönster och dörrar i ytterväggen: luckor eller blå fält i väggbandet, bågar för dörrsvep */
function imDetectOpenings(){
  if(!IM.img||!IM.poly||!imS())return -1;
  const {f,cw,ch,dark,blue}=imCanvas(),r=imS()/f,pc=IM.poly.map(p=>[p[0]*f,p[1]*f]),found=[];
  const half=Math.round(.3/r);
  for(let e=0;e<pc.length;e++){
    const a=pc[e],c=pc[(e+1)%pc.length],horiz=Math.abs(a[1]-c[1])<Math.abs(a[0]-c[0]);
    const len=Math.round(Math.abs(horiz?c[0]-a[0]:c[1]-a[1])),dir=horiz?Math.sign(c[0]-a[0]):Math.sign(c[1]-a[1]);if(len<Math.round(1/r))continue;
    const midx=(a[0]+c[0])/2,midy=(a[1]+c[1])/2,inn=imInPoly(pc,horiz?midx:midx+3,horiz?midy+3:midy)?1:-1;   // +1: inåt är +y/+x
    const pxAt=(t,off)=>{const x=horiz?a[0]+dir*t:a[0]+off*inn,y=horiz?a[1]+off*inn:a[1]+dir*t;return [Math.round(x),Math.round(y)];};
    const fr=new Float32Array(len+1),bl=new Float32Array(len+1),ar=new Float32Array(len+1);
    for(let t=0;t<=len;t++){let dk=0,bu=0,n=0;for(let off=-half;off<=half;off++){const [x,y]=pxAt(t,off);if(x<0||y<0||x>=cw||y>=ch)continue;n++;dk+=dark[y*cw+x];bu+=blue[y*cw+x];}fr[t]=n?dk/n:0;bl[t]=n?bu/n:0;
      let da=0,m2=0;for(let off=half+2;off<=half+Math.round(1.1/r);off+=2){const [x,y]=pxAt(t,off);if(x<0||y<0||x>=cw||y>=ch)continue;m2++;da+=dark[y*cw+x];}ar[t]=m2?da/m2:0;}
    const sm=Math.max(1,Math.round(.04/r)),sf=new Float32Array(len+1);
    for(let t=0;t<=len;t++){let s=0,n=0;for(let q=-sm;q<=sm;q++){const u=t+q;if(u>=0&&u<=len){s+=fr[u];n++;}}sf[t]=s/n;}
    const sorted=Array.from(sf).sort((x,y)=>x-y),nor=sorted[Math.floor(sorted.length*.8)];if(nor<.08)continue;
    const thr=nor*.5,minW=Math.round(.45/r),maxW=Math.round(4/r),edge=Math.round(.3/r);
    let st=-1;const runs=[];
    for(let t=0;t<=len+1;t++){const lo=t<=len&&sf[t]<thr;if(lo&&st<0)st=t;else if(!lo&&st>=0){runs.push([st,t-1]);st=-1;}}
    // slå ihop nära luckor
    const mg=[];runs.forEach(rn=>{const l=mg[mg.length-1];if(l&&rn[0]-l[1]<Math.round(.12/r))l[1]=rn[1];else mg.push(rn.slice());});
    mg.forEach(([s0,s1])=>{
      const w=(s1-s0+1);if(w<minW||w>maxW||s0<edge||s1>len-edge)return;
      let bsum=0,asum=0;for(let t=s0;t<=s1;t++){bsum+=bl[t];asum+=ar[t];}bsum/=w;asum/=w;
      const wm=w*r,cT=(s0+s1)/2,P=pxAt(cT,0);
      const isDoor=bsum<.05&&wm>=.75&&wm<=1.2&&asum>.008&&asum<.45;
      found.push({t:isDoor?'d':'f',w:Math.round(wm*20)/20,px:P});
    });
  }
  return found;
}
function imAddOpening(t,X,Z,wd){
  if(!IM.fit)return false;
  const L=g0('W1'),W=g0('W2'),GB=g0('GB'),GL=g0('GL'),tol=Math.max(.8,.06*Math.max(L,W));
  const dm=t==='d'?[Math.min(Math.max(wd||.9,.8),1.2),2.1]:[Math.min(Math.max(wd||1.2,.4),3),1.2];
  // kandidater: huvudhusets väggar och varje vinges väggar
  const cand=[];
  {const dist=[Math.abs(Z),Math.abs(X-L),Math.abs(Z-W),Math.abs(X)],along=[X,Z,L-X,W-Z],ws=[L,W,L,W];
   dist.forEach((d,wi)=>{if(along[wi]>=0&&along[wi]<=ws[wi])cand.push({d,main:true,wi,c:along[wi],len:ws[wi]});});}
  WINGS.forEach((w,wx)=>{
    const xl=w.s==='b'?Z-W:-Z,zl=w.s==='b'?w.x0+GB-X:X-w.x0;
    if(xl<-.1||xl>GL+.8||zl<-.8||zl>GB+.8)return;
    [[Math.abs(zl),0,xl,GL],[Math.abs(xl-GL),1,zl,GB],[Math.abs(zl-GB),2,GL-xl,GL]].forEach(([d,wi,c,len])=>{if(c>=0&&c<=len)cand.push({d,main:false,wx,wi,c,len});});
  });
  cand.sort((a,b)=>a.d-b.d);const c0=cand[0];
  if(!c0||c0.d>tol)return false;
  if(c0.main){
    const k=IM.k||0,v=(mcount()>1)?k+1:0;
    let o=ops.find(q=>q.t===t&&q.w===dm[0]&&q.h===dm[1]&&(q.v||0)===v&&!q.bd);
    if(!o){o={t,w:dm[0],h:dm[1],n:0,v,id:++uid};ops.push(o);}
    o.n=(o.n||0)+1;
    inst.push({oid:o.id,k,wall:c0.wi,c:Math.min(Math.max(c0.c,dm[0]/2+.2),c0.len-dm[0]/2-.2)});
  }else{
    const w=WINGS[c0.wx];(w.gops=w.gops||[]).push({wall:c0.wi,c:Math.min(Math.max(c0.c,dm[0]/2+.2),c0.len-dm[0]/2-.2),w:dm[0],h:dm[1],t});
  }
  return true;
}
/* lista för öppningar i vingar */
function wgDraw(){
  const box=$('wgOps');if(!box)return;
  const rows=[];WINGS.forEach((w,wx)=>(w.gops||[]).forEach((x,i)=>rows.push({w,wx,x,i})));
  if(!rows.length){box.innerHTML='';return;}
  const nm=['långsida','kortsida (ände)','långsida'];
  box.innerHTML='<p class="note" style="margin:6px 0 2px">Öppningar i vingar (gäller första våningen)</p>'+rows.map(({wx,x,i})=>'<div class="op"><span class="note" style="align-self:end">Vinge '+(wx+1)+', '+nm[x.wall]+'</span>'+
    '<label>Typ<select data-wx="'+wx+'" data-i="'+i+'" data-k="t"><option value="f"'+(x.t==='f'?' selected':'')+'>Fönster</option><option value="d"'+(x.t==='d'?' selected':'')+'>Dörr</option></select></label>'+
    ['w','h','c'].map(k=>'<label>'+({w:'Bredd m',h:'Höjd m',c:'Läge m'}[k])+'<input type="number" step="0.05" min="0" value="'+(Math.round(x[k]*100)/100)+'" data-wx="'+wx+'" data-i="'+i+'" data-k="'+k+'"></label>').join('')+
    '<button class="x" type="button" data-wx="'+wx+'" data-i="'+i+'" data-del="1" aria-label="Ta bort öppning">✕</button></div>').join('');
}
(function(){
  const box=$('wgOps');if(!box)return;
  const upd=()=>{try{calc();build3d();}catch(e){console.error(e);}};
  box.addEventListener('change',e=>{const t=e.target;if(t.dataset.wx==null||t.dataset.del)return;const x=WINGS[+t.dataset.wx].gops[+t.dataset.i],k=t.dataset.k;
    if(k==='t'){x.t=t.value;if(t.value==='d'){x.h=2.1;if(x.w<.8)x.w=.9;}else{x.h=1.2;}}else x[k]=parseFloat(t.value)||x[k];wgDraw();upd();});
  box.addEventListener('click',e=>{const b=e.target.closest('[data-del]');if(!b)return;WINGS[+b.dataset.wx].gops.splice(+b.dataset.i,1);wgDraw();upd();});
  const _c=calc;calc=function(){const r=_c.apply(this,arguments);try{wgDraw();}catch(e){}return r;};
})();
(function(){
  const svg=$('imSvg');if(!svg)return;
  const pt=e=>{const m=svg.getScreenCTM();if(!m)return null;const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(m.inverse());return [q.x,q.y];};
  const kSel=()=>{IM.k=+($('imK').value)||0;};
  $('imK').onchange=()=>{kSel();imRender();};
  const load=(url)=>{const im=new Image();im.onload=()=>{IM.img=im;IM.url=url;IM.w=im.naturalWidth;IM.h=im.naturalHeight;IM.sc=null;IM.box=null;IM.poly=null;IM.sPts=null;IM.pxLen=0;IM.marks=[];IM.fit=null;IM.rot=0;IM.dz=0;imSetMode('scale');};im.onerror=()=>imHint('Bilden kunde inte läsas.');im.src=url;};
  let pdfDoc=null;
  const needPdf=()=>new Promise((res,rej)=>{if(window.pdfjsLib)return res();const sc=document.createElement('script');sc.src='lib/pdf.min.js';sc.onload=()=>{try{pdfjsLib.GlobalWorkerOptions.workerSrc='lib/pdf.worker.min.js';res();}catch(e){rej(e);}};sc.onerror=()=>rej(new Error('PDF-läsaren kunde inte laddas'));document.head.appendChild(sc);});
  const renderPdf=async(n)=>{const pg=await pdfDoc.getPage(n),v0=pg.getViewport({scale:1}),sc=Math.min(4,2400/Math.max(v0.width,v0.height)),v=pg.getViewport({scale:sc}),cv=document.createElement('canvas');cv.width=Math.round(v.width);cv.height=Math.round(v.height);const cx=cv.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,cv.width,cv.height);await pg.render({canvasContext:cx,viewport:v}).promise;load(cv.toDataURL('image/png'));};
  $('imFile').onchange=async ev=>{
    const f=ev.target.files[0];if(!f)return;
    if(f.type==='application/pdf'||/\.pdf$/i.test(f.name)){
      imHint('Läser PDF...');
      try{await needPdf();const buf=await f.arrayBuffer();pdfDoc=await pdfjsLib.getDocument({data:buf}).promise;
        const sel=$('imPg');sel.innerHTML=Array.from({length:pdfDoc.numPages},(_,i)=>'<option value="'+(i+1)+'">Sida '+(i+1)+'</option>').join('');sel.style.display=pdfDoc.numPages>1?'':'none';
        await renderPdf(1);}catch(e){console.error(e);imHint('PDF:en kunde inte läsas ('+(e.message||e)+'). Prova att spara sidan som bild.');}
      return;
    }
    if(!/^image\//.test(f.type)){imHint('Välj en bild (PNG, JPG) eller en PDF.');return;}
    $('imPg').style.display='none';pdfDoc=null;
    const rd=new FileReader();rd.onload=()=>load(rd.result);rd.readAsDataURL(f);
  };
  $('imPg').onchange=()=>{if(pdfDoc)renderPdf(+$('imPg').value||1).catch(e=>imHint('Sidan kunde inte läsas.'));};
  const need=()=>{if(!IM.img){imHint('Välj en ritning först.');return false;}return true;};
  [['imScale','scale'],['imOutline','outline'],['imWall','wall'],['imWin','win'],['imDoor','door']].forEach(([id,m])=>{const b=$(id);b.dataset.m=m;b.onclick=()=>{if(!need())return;if(m!=='scale'&&!IM.sc){imHint('Sätt skalan först (steg 1).');return;}if((m==='wall'||m==='win'||m==='door')&&!IM.poly){imHint('Markera husets ytterkant först (steg 2).');return;}imSetMode(m);};});
  $('imDist').oninput=()=>{if(IM.pxLen){IM.sc=(parseFloat($('imDist').value.replace(',','.'))||0)/IM.pxLen;if(IM.poly)imApplyOutline(IM.poly);}};
  const finishOutline=()=>{
    const P=IM.pts;if(P.length<2){imHint('Klicka minst två hörn.');return;}
    let poly;if(P.length===2){const [a,b]=P;poly=[[Math.min(a[0],b[0]),Math.min(a[1],b[1])],[Math.max(a[0],b[0]),Math.min(a[1],b[1])],[Math.max(a[0],b[0]),Math.max(a[1],b[1])],[Math.min(a[0],b[0]),Math.max(a[1],b[1])]];}
    else if(P.length>=4)poly=P.slice();else{imHint('Klicka minst fyra hörn, eller två motsatta hörn för en rektangel.');return;}
    IM.pts=[];imApplyOutline(poly);imSetMode('');
  };
  $('imDone').onclick=()=>{if(IM.mode==='outline')finishOutline();};
  svg.addEventListener('click',e=>{
    if(!IM.img||!IM.mode)return;const p=pt(e);if(!p)return;kSel();
    if(IM.mode==='scale'){IM.pts.push(p);if(IM.pts.length===2){IM.sPts=IM.pts.slice();IM.pxLen=Math.hypot(IM.pts[0][0]-IM.pts[1][0],IM.pts[0][1]-IM.pts[1][1]);IM.pts=[];
        const dd=parseFloat($('imDist').value.replace(',','.'));IM.sc=dd>0?dd/IM.pxLen:null;imHint('Skala satt med avståndet '+(dd||0)+' m. Ändra måttet i rutan om det är fel, och gå vidare till steg 2.');imSetMode('');}else imRender();return;}
    if(IM.mode==='outline'){
      const u=Math.max(IM.w,IM.h)/400;
      if(IM.pts.length>=3&&Math.hypot(p[0]-IM.pts[0][0],p[1]-IM.pts[0][1])<8*u){finishOutline();return;}
      const q=IM.pts[IM.pts.length-1],tol=.3/(imS()||.02);
      if(q){if(Math.abs(p[0]-q[0])<tol&&Math.abs(p[0]-q[0])<=Math.abs(p[1]-q[1]))p[0]=q[0];else if(Math.abs(p[1]-q[1])<tol)p[1]=q[1];}
      IM.pts.push(p);imRender();return;
    }
    const h=imXf(p[0],p[1]);
    if(IM.mode==='wall'){
      if(!IM.pts.length){IM.pts=[p];imRender();return;}
      const mp=imModelPoly(),a=imXf(IM.pts[0][0],IM.pts[0][1]),s0=imSnapIn(a[0],a[1],mp),s1=imSnapIn(h[0],h[1],mp);
      let e1=s1;if(Math.abs(e1[0]-s0[0])<.2)e1=[s0[0],e1[1]];else if(Math.abs(e1[1]-s0[1])<.2)e1=[e1[0],s0[1]];
      const L=Math.hypot(e1[0]-s0[0],e1[1]-s0[1]);
      if(L>=.3)IW.push({k:IM.k,x1:s0[0],z1:s0[1],x2:e1[0],z2:e1[1],d:0,dc:+(L/2).toFixed(2)});
      IM.pts=[];try{drawIW();calc();build3d();}catch(x){console.error(x);}imRender();return;
    }
    if(IM.mode==='win'||IM.mode==='door'){
      if(imAddOpening(IM.mode==='win'?'f':'d',h[0],h[1])){IM.marks.push([p[0],p[1],IM.mode==='win'?'f':'d']);try{drawOps();calc();build3d();}catch(x){console.error(x);}imRender();}
      else imHint('Klicka närmare en yttervägg.');
    }
  });
  $('imAuto').onclick=()=>{if(!need())return;const n=imDetect();if(n)imHint('Hittade '+n+' innerväggar. Kontrollera mot ritningen och ta bort eller rita om det som är fel (listan under Innerväggar). Dörrar sätts där väggen har en lucka.');else if(IM.poly&&imS())imHint('Hittade inga innerväggar. Rita dem för hand med steg 3.');};
  $('imAutoOp').onclick=()=>{
    if(!need())return;if(!IM.poly||!imS()){imHint('Sätt skala och markera husets ytterkant först.');return;}
    const list=imDetectOpenings();if(!list||!list.length){imHint('Hittade inga fönster eller dörrar i ytterväggarna. Klicka in dem för hand.');return;}
    const before=imSnapshot();let n=0,skipped=0;
    if($('imRep').checked){ops=ops.filter(o=>o.bd);inst=inst.filter(q=>ops.some(o=>o.id===q.oid));WINGS.forEach(w=>{w.gops=[];});}
    kSel();IM.marks=[];
    list.forEach(o=>{const m=imXf(o.px[0]/ (IM.w?Math.min(1,2400/Math.max(IM.w,IM.h)):1),o.px[1]/(IM.w?Math.min(1,2400/Math.max(IM.w,IM.h)):1));if(imAddOpening(o.t,m[0],m[1],o.w)){n++;IM.marks.push([...imInv(m[0],m[1]),o.t]);}else skipped++;});
    IM.undo2=before;
    try{drawOps();calc();build3d();}catch(x){console.error(x);}imRender();
    imHint('Hittade '+n+' fönster och dörrar'+(skipped?' ('+skipped+' låg för långt från en yttervägg och hoppades över)':'')+'. Fönster är '+'1,2 m höga och dörrar 2,1 m. Ändra mått i listan Fönster och dörrar. Fel? Klicka "Ångra import".');
  };
  $('imUndo').onclick=()=>{const j=IM.undo2||IM.undo;if(!j){imHint('Inget att ångra.');return;}imRestore(j);IM.undo2=null;IM.undo=null;IM.marks=[];imRender();imHint('Importen ångrades.');};
  $('imReset').onclick=()=>{IM.img=null;IM.url='';IM.sc=null;IM.box=null;IM.poly=null;IM.sPts=null;IM.pxLen=0;IM.marks=[];IM.pts=[];IM.mode='';IM.fit=null;IM.rot=0;IM.dz=0;$('imFile').value='';$('imPg').style.display='none';pdfDoc=null;imRender();imHint('Välj en ritning (bild eller PDF) för att börja.');};
})();
