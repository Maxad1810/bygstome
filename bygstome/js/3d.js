/* ---------- 3D ---------- */
let R3=null,F3=false,M=null,inst=[],uid=0,drag=null,dragW=null,dragE=null,dragK=false,LOCK3=!!(window.matchMedia&&matchMedia('(max-width:700px)').matches);
function reconcile(ws,N){
  N=N||1;
  ops.forEach(o=>{if(!o.id)o.id=++uid;});
  inst=inst.filter(s=>ops.some(o=>o.id===s.oid)&&(s.k||0)<N);
  ops.forEach(o=>{
    const n0=Math.min(Math.max(Math.round(o.n||0),0),12);
    for(let k=0;k<N;k++){
      const n=(!o.v||o.v===k+1)?n0:0;
      const mine=inst.filter(s=>s.oid===o.id&&(s.k||0)===k);
      mine.slice(n).forEach(s=>inst.splice(inst.indexOf(s),1));
      for(let i=mine.length;i<n;i++){
        const b0=inst.filter(s=>s.oid===o.id&&(s.k||0)===0)[i];
        if(k>0&&b0){inst.push({oid:o.id,k,wall:b0.wall,c:b0.c});continue;}
        const w=inst.filter(s=>(s.k||0)===k).length%4,cnt=inst.filter(s=>(s.k||0)===k&&s.wall===w).length;
        inst.push({oid:o.id,k,wall:w,c:ws[w]*(((cnt*.31)+.3)%.8+.1)});
      }
    }
  });
}
function reconcileOld(ws){
  ops.forEach(o=>{if(!o.id)o.id=++uid;});
  inst=inst.filter(s=>ops.some(o=>o.id===s.oid));
  ops.forEach(o=>{
    const n=Math.min(Math.max(Math.round(o.n||0),0),12);
    const mine=inst.filter(s=>s.oid===o.id);
    mine.slice(n).forEach(s=>inst.splice(inst.indexOf(s),1));
    for(let i=mine.length;i<n;i++){
      const w=inst.length%4,cnt=inst.filter(s=>s.wall===w).length;
      inst.push({oid:o.id,wall:w,c:ws[w]*(((cnt*.31)+.3)%.8+.1)});
    }
  });
}
function bind3d(R){
  const cv=R.ren.domElement,rc=new THREE.Raycaster(),m=new THREE.Vector2();
  cv.style.touchAction=LOCK3?'pan-y':'none';
  const setM=e=>{const b=cv.getBoundingClientRect();m.set(((e.clientX-b.left)/b.width)*2-1,-((e.clientY-b.top)/b.height)*2+1);rc.setFromCamera(m,R.cam);};
  const hit=e=>{setM(e);const h=rc.intersectObjects(R.pick||[],false).filter(x=>{for(let p=x.object;p;p=p.parent)if(!p.visible)return false;return true;});return h.length?h[0].object.userData:null;};
  cv.addEventListener('pointerdown',e=>{
    if(LOCK3)return;const u=hit(e);if(!u)return;
    if(u.deck)dragK=true;else if(u.wing)dragW=u.wing;else if(u.el)dragE=u.el;else drag=u.ref;if(R.ctl)R.ctl.enabled=false;cv.style.cursor='grabbing';
    try{cv.setPointerCapture(e.pointerId);}catch(_){}
    e.preventDefault();build3d();
  },true);
  cv.addEventListener('pointermove',e=>{
    if(dragK){
      setM(e);const G=R.geo;if(!G)return;
      const p=new THREE.Vector3();
      if(rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-G.y0),p)){
        let best=null;
        G.ps.forEach((s,i)=>{const dx=G.dirs[i][0],dz=G.dirs[i][1],len=G.ws[i];const t=Math.min(Math.max((p.x-s[0])*dx+(p.z-s[1])*dz,0),len);const dist=Math.hypot(p.x-(s[0]+dx*t),p.z-(s[1]+dz*t));if(!best||dist<best.dist)best={i,t,dist};});
        if(best){const dl=g0('dkL'),wl=G.ws[best.i];$('dkS').value=String(best.i);$('dkX').value=String(Math.round(Math.min(Math.max(best.t-dl/2,0),Math.max(0,wl-dl))*20)/20);build3d();}
      }
      return;
    }
    if(dragE){
      setM(e);const G=R.geo;if(!G)return;
      const p=new THREE.Vector3(),y=G.y0+((G.yo&&G.yo[dragE.k||0])||0)+(dragE.t==='t'?G.H-.09:dragE.h);
      if(rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-y),p)){
        if(dragE.t==='t'){dragE.c=Math.round(Math.min(Math.max(p.x,.1),G.ws[0]-.1)*20)/20;dragE.h=Math.round(Math.min(Math.max(p.z,.1),G.ws[1]-.1)*20)/20;drawEls();build3d();return;}
        let best=null;
        G.ps.forEach((s,i)=>{const dx=G.dirs[i][0],dz=G.dirs[i][1],len=G.ws[i];const t=Math.min(Math.max((p.x-s[0])*dx+(p.z-s[1])*dz,0),len);const dist=Math.hypot(p.x-(s[0]+dx*t),p.z-(s[1]+dz*t));if(!best||dist<best.dist)best={i,t,dist};});
        if(best){dragE.wall=best.i;dragE.c=Math.round(best.t*20)/20;drawEls();build3d();}
      }
      return;
    }
    if(dragW){setM(e);const p=new THREE.Vector3(),G=R.geo;if(G&&rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-G.y0),p)){dragW.x0=Math.min(Math.max(p.x-g0('GB')/2,0),Math.max(0,G.ws[0]-g0('GB')));build3d();}return;}
    if(!drag){cv.style.cursor=hit(e)?'grab':'';return;}
    setM(e);
    const o=ops.find(x=>x.id===drag.oid),G=R.geo;if(!o||!G)return;
    const y=G.y0+((G.yo&&G.yo[drag.k||0])||0)+(o.t==='f'?.9+o.h/2:o.h/2),p=new THREE.Vector3();
    if(!rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-y),p))return;
    let best=null;
    G.ps.forEach((s,i)=>{
      const dx=G.dirs[i][0],dz=G.dirs[i][1],len=G.ws[i];
      const t=Math.min(Math.max((p.x-s[0])*dx+(p.z-s[1])*dz,0),len);
      const dist=Math.hypot(p.x-(s[0]+dx*t),p.z-(s[1]+dz*t));
      if(!best||dist<best.dist)best={i,t,dist};
    });
    if(best){drag.wall=best.i;drag.c=best.t;build3d();}
  });
  const end=()=>{if(!drag&&!dragW&&!dragE&&!dragK)return;const hadE=!!dragE||dragK;drag=null;dragW=null;dragE=null;dragK=false;if(R.ctl)R.ctl.enabled=!LOCK3;cv.style.cursor='';build3d();if(hadE)calc();};
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
}
const BOX=()=>window.THREE?new THREE.BoxGeometry(1,1,1):null;
function mkTex(vert){
  const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');
  x.fillStyle='#8a2f23';x.fillRect(0,0,64,64);x.fillStyle='#4f1812';
  if(vert)x.fillRect(0,0,3,64);else x.fillRect(0,61,64,3);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
}
function panelMat(w,h,std){
  const rx=std?Math.max(1,Math.round(w/.12)):1,ry=std?1:Math.max(1,Math.round(h/.12)),key=(std?'s':'l')+rx+'x'+ry;
  if(!R3.pmat[key]){
    const t=(std?R3.tex.v:R3.tex.h).clone();t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.needsUpdate=true;
    R3.pmat[key]=new THREE.MeshLambertMaterial({map:t});
  }
  return R3.pmat[key];
}
function init3d(){
  if(R3||F3||!window.THREE)return R3;
  try{
    const el=$('c3d'),ren=new THREE.WebGLRenderer({antialias:true,alpha:true});
    ren.setPixelRatio(Math.min(window.devicePixelRatio||1,2));el.appendChild(ren.domElement);
    const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(40,1,0.2,300);
    sc.add(new THREE.AmbientLight(0xffffff,.75));
    const dl=new THREE.DirectionalLight(0xffffff,.8);dl.position.set(8,14,6);sc.add(dl);
    const gr=new THREE.GridHelper(60,60,0x8a9895,0xaab4b1);gr.material.transparent=true;gr.material.opacity=.45;sc.add(gr);
    const gp=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshBasicMaterial({color:0x6f8a5a,transparent:true,opacity:.25}));gp.rotation.x=-Math.PI/2;gp.position.y=-.01;sc.add(gp);
    const root=new THREE.Group();sc.add(root);
    const ctl=THREE.OrbitControls?new THREE.OrbitControls(cam,ren.domElement):null;
    const draw=()=>ren.render(sc,cam);
    if(ctl)ctl.addEventListener('change',draw);
    const rs=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;ren.setSize(w,h);cam.aspect=w/h;cam.updateProjectionMatrix();draw();};
    if(window.ResizeObserver)new ResizeObserver(rs).observe(el);else window.addEventListener('resize',rs);
    const L=c=>new THREE.MeshLambertMaterial({color:c});
    const PO=(m,f)=>{m.polygonOffset=true;m.polygonOffsetFactor=-f;m.polygonOffsetUnits=-f;return m;};
    M={stud:L(0xe0b36a),plate:L(0xb5803c),hdr:L(0x9a6a2e),joist:L(0xd4a45c),floor:L(0xefe1bf),roof:new THREE.MeshLambertMaterial({color:0xb8741a,transparent:true,opacity:.5,depthWrite:false}),win:new THREE.MeshLambertMaterial({color:0x7ec8e8,transparent:true,opacity:.6}),door:new THREE.MeshLambertMaterial({color:0x6b3f1d}),sel:new THREE.MeshLambertMaterial({color:0xffd24a,transparent:true,opacity:.9}),metal:PO(L(0x5f6e78),2),metal2:PO(L(0x3f4a52),3),papp:PO(L(0x22262a),1),spont:L(0xcfa768),conc:L(0x9aa3a3),falu:L(0x8a2f23),frame:L(0xf1efe8),limtra:L(0xdcb872),cond:L(0xe8742a),deck:L(0x8f7348),pick:new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})};
    R3={ren,sc,cam,root,ctl,draw,rs,fresh:true,box:BOX(),cyl:new THREE.CylinderGeometry(1,1,1,12),tex:{v:mkTex(true),h:mkTex(false)},pmat:{}};bind3d(R3);
  }catch(e){F3=true;$('c3d').innerHTML='<p class="note" style="padding:12px">3D-vyn stöds inte i den här webbläsaren.</p>';}
  return R3;
}
function mk(grp,sx,sy,sz,mat){const m=new THREE.Mesh(R3.box,mat);m.scale.set(sx,sy,sz);grp.add(m);return m;}
function beam(grp,a,b,w,h,mat){const m=new THREE.Mesh(R3.box,mat);m.position.copy(a).add(b).multiplyScalar(.5);m.scale.set(w,h,a.distanceTo(b));grp.add(m);grp.updateWorldMatrix(true,false);m.lookAt(grp.localToWorld(b.clone()));}
function wall3d(grp,len,st,th,os,H,d,cc,y0,gc,gv,ga){
  if(len<=0)return;
  const g2=new THREE.Group();g2.position.set(st[0],y0,st[1]);g2.rotation.y=th;grp.add(g2);
  const pt=.045,top=Math.max(.5,H-3*pt)+pt;
  const mkb=(x,y1,y2,w,mat)=>{if(y2-y1<.01)return;const m=mk(g2,w,y2-y1,d,mat);m.position.set(x,(y1+y2)/2,d/2);};
  [[0,pt],[top,top+pt],[top+pt,top+2*pt]].forEach(([a,b])=>mkb(len/2,a,b,len,M.plate));
  mkb(len/2,-.004,0,len,M.papp);
  const xs=[];for(let x=.0225;x<len-.0225;x+=cc)xs.push(x);xs.push(len-.0225);
  const sill=o=>o.t==='f'?.9:0,hb=o=>Math.min(top-.1,pt+sill(o)+o.h),hh=o=>Math.min(hb(o)+.2,top);
  xs.forEach(x=>{
    const o=os.find(o=>Math.abs(x-o.c)<o.w/2+.0225);
    if(!o){mkb(x,pt,top,.045,M.stud);if(H>2.2&&x+cc<len-.0225){const nx=x+cc/2,yy=pt+(top-pt)/2+((Math.round(x/cc)%2)?.1:-.1);if(!os.some(q=>Math.abs(nx-q.c)<q.w/2+.1))mkb(nx,yy,yy+.045,cc-.045,M.stud);}return;}
    mkb(x,hh(o),top,.045,M.stud);
    if(o.t==='f')mkb(x,pt,pt+sill(o)-.045,.045,M.stud);
  });
  os.forEach(o=>{
    const a=o.c-o.w/2-.0225,b=o.c+o.w/2+.0225;
    mkb(a,pt,hb(o),.045,M.hdr);mkb(b,pt,hb(o),.045,M.hdr);
    mkb(a-.045,pt,top,.045,M.stud);mkb(b+.045,pt,top,.045,M.stud);
    mkb(o.c,hb(o),hh(o),o.w+.2,M.hdr);
    if(o.t==='f')mkb(o.c,pt+sill(o)-.045,pt+sill(o),o.w,M.hdr);
    if(R3&&R3.pick){const y1=pt+sill(o),y2=hb(o);if(y2-y1>.05){const mm=mk(g2,o.w,y2-y1,d*.5,o.ref===drag?M.sel:(o.t==='f'?M.win:M.door));mm.position.set(o.c,(y1+y2)/2,d/2);mm.userData.ref=o.ref;R3.pick.push(mm);const fh=y2-y1,fz=d*.55;[-1,1].forEach(sx=>mk(g2,.05,fh,fz,M.frame).position.set(o.c+sx*(o.w/2-.025),(y1+y2)/2,d/2));mk(g2,o.w,.05,fz,M.frame).position.set(o.c,y2-.025,d/2);if(o.t==='f'){mk(g2,o.w,.05,fz,M.frame).position.set(o.c,y1+.025,d/2);mk(g2,.04,fh,fz,M.frame).position.set(o.c,(y1+y2)/2,d/2);mk(g2,o.w+.12,.03,.12,M.frame).position.set(o.c,y1-.015,-.03);}else{mk(g2,.035,.035,.08,M.metal2).position.set(o.c+o.w/2-.12,(y1+y2)/2-.1,-.04);mk(g2,o.w,.03,d,M.hdr).position.set(o.c,y1+.015,d/2);}}}
  });
  const g3=new THREE.Group();g3.position.copy(g2.position);g3.rotation.y=th;gc.add(g3);
  const g4=new THREE.Group();g4.position.copy(g2.position);g4.rotation.y=th;gv.add(g4);
  const g5=new THREE.Group();g5.position.copy(g2.position);g5.rotation.y=th;ga.add(g5);
  const full=top+2*pt;
  const cl=(x1,x2,y1,y2)=>{
    if(x2-x1<.02||y2-y1<.02)return;
    const a=mk(g4,x2-x1,y2-y1,.009,M.spont);a.position.set((x1+x2)/2,(y1+y2)/2,-.0045);
    const std=$('pd').value==='s';
    const b=mk(g3,x2-x1,y2-y1,.022,panelMat(x2-x1,y2-y1,std));b.position.set((x1+x2)/2,(y1+y2)/2,std?-.076:-.048);
    if(std)for(let y=y1+.3;y<y2-.02;y+=.6)mk(g5,x2-x1,.045,.028,M.stud).position.set((x1+x2)/2,y,-.051);
    for(let x=x1+.035;x<x2-.03;x+=.6)mk(g5,.07,y2-y1,.028,M.stud).position.set(x,(y1+y2)/2,-.023);
    mk(g5,.07,y2-y1,.028,M.stud).position.set(x2-.035,(y1+y2)/2,-.023);
    if(y1<.01)mk(g5,x2-x1,.03,.028,M.papp).position.set((x1+x2)/2,.015,-.023);
    if(y2>full-.01)mk(g5,x2-x1,.03,.028,M.papp).position.set((x1+x2)/2,y2-.015,-.023);
  };
  let cur=0;
  os.slice().sort((a,b)=>a.c-b.c).forEach(o=>{
    const x1=o.c-o.w/2,x2=o.c+o.w/2,s0=o.t==='f'?pt+.9:pt,h0=Math.min(top-.1,s0+o.h);
    cl(cur,x1,0,full);cl(x1,x2,Math.min(full,h0),full);if(o.t==='f')cl(x1,x2,0,s0);
    cur=Math.max(cur,x2);
  });
  cl(cur,len,0,full);
}
function build3d(){
  const R=init3d();if(!R)return;
  R.root.clear();R.pick=[];wingSetup();R.layers={};
  const Nm=mcount(),WL=g('GL'),WB=g('GB'),L0=g('W1');
  const jh=(parseInt($('jd').value.split('x')[1])||195)/1000,H=g('H2');
  const y00=($('gr').value==='p'?(g('ph')||.4)+jh:0)+jh+.022;
  const yoffOf=k=>k===0?0:y00+H+(k-1)*(H+jh+.022);
  for(let k=0;k<Nm;k++){
    const yoff=yoffOf(k),sg=new THREE.Group();sg.position.y=yoff;R.root.add(sg);
    const act=WINGS.filter((w,i)=>wcount(i)>k),plan=act.length?wingPlan(L0,WB,act):null;
    part3d(R,{plan,noRoof:k<Nm-1,noGrund:k>0,yoff,k,N:Nm},sg);
    if(R.geo){if(k===0)R.geo.yo=[];R.geo.yo[k]=yoff;}
  }
  const ext0=Math.max(0,Math.min(WB/2+.5,g('RW')/2-.1));
  WINGS.forEach((w,i)=>{
    const Nw=wcount(i),ext=Nw===Nm?ext0:0;
    for(let k=0;k<Nw;k++){
      const yoff=yoffOf(k),sg=new THREE.Group();sg.position.y=yoff;R.root.add(sg);
      const wg=new THREE.Group();sg.add(wg);
      if(w.s==='b'){wg.rotation.y=-Math.PI/2;wg.position.set(w.x0+WB,0,g('W2'));}
      else{wg.rotation.y=Math.PI/2;wg.position.set(w.x0,0,0);}
      part3d(R,{wing:true,FL:WL,FW:WB,W1:WL,W2:WB,W3:WL,W4:(k>=Nm?WB:0),RL:WL+ext,RW:WB,rext:ext,plan:null,wref:w,noRoof:k<Nw-1,noGrund:k>0,yoff,k,N:Nw},wg);
    }
  });
  R.draw();
}
function build3dPrev(){
  const R=init3d();if(!R)return;
  R.root.clear();R.pick=[];wingSetup();
  const N=parseInt($('vn').value)||1,WL=g('GL'),WB=g('GB'),L0=g('W1');
  const plan=WINGS.length?wingPlan(L0,WB):null;
  const jh=(parseInt($('jd').value.split('x')[1])||195)/1000,H=g('H2');
  const y00=($('gr').value==='p'?(g('ph')||.4)+jh:0)+jh+.022;
  for(let k=0;k<N;k++){
    const yoff=k===0?0:y00+H+(k-1)*(H+jh+.022);
    const sg=new THREE.Group();sg.position.y=yoff;R.root.add(sg);
    const fl={plan,noRoof:k<N-1,noGrund:k>0,yoff,k,N};
    part3d(R,fl,sg);
    if(R.geo){if(k===0)R.geo.yo=[];R.geo.yo[k]=yoff;}
    const ext=Math.max(0,Math.min(WB/2+.5,g('RW')/2-.1));
    WINGS.forEach(w=>{
      const wg=new THREE.Group();sg.add(wg);
      if(w.s==='b'){wg.rotation.y=-Math.PI/2;wg.position.set(w.x0+WB,0,g('W2'));}
      else{wg.rotation.y=Math.PI/2;wg.position.set(w.x0,0,0);}
      part3d(R,{...fl,wing:true,FL:WL,FW:WB,W1:WL,W2:WB,W3:WL,W4:0,RL:WL+ext,RW:WB,rext:ext,plan:null,wref:w},wg);
    });
  }
  R.draw();
}
function build3dOld(){
  const R=init3d();if(!R)return;
  R.root.clear();R.pick=[];
  const hs=$('hs').value==='l',WL=g('GL'),WB=g('GB');
  part3d(R,hs?{Lm:true,W3:Math.max(0,g('W3')-WB)}:null,R.root);
  if(hs){
    const wg=new THREE.Group();R.root.add(wg);wg.rotation.y=-Math.PI/2;wg.position.set(WB,0,g('W2'));
    part3d(R,{wing:true,FL:WL,FW:WB,W1:WL,W2:WB,W3:WL,W4:0,RL:WL,RW:WB},wg);
  }
  R.draw();
}
function part3d(R,o,parent){
  const isW=!!(o&&o.wing),g=id=>(o&&o[id]!=null)?o[id]:g0(id);
  const RL=g('RL'),RW=g('RW'),FL=g('FL'),FW=g('FW'),jc=g('jc')||.6,cc=g('cc')||.6,P=g('P'),O=g('O'),ccT=g('ccT')||1.2,H=g('H2');
  const ws=[g('W1'),g('W2'),g('W3'),g('W4')];
  const jh=(parseInt($('jd').value.split('x')[1])||195)/1000,d=(parseInt($('dim').value.split('x')[1])||145)/1000,fo=($('gr').value==='p'&&!(o&&o.noGrund)?(g('ph')||.4)+jh:0),y0=fo+jh+.022;
  const gF=new THREE.Group(),gW=new THREE.Group(),gT=new THREE.Group(),gR=new THREE.Group(),gD=new THREE.Group(),gG=new THREE.Group(),gC=new THREE.Group(),gV=new THREE.Group(),gP=new THREE.Group(),gS=new THREE.Group(),gA=new THREE.Group(),gE=new THREE.Group(),gK=new THREE.Group();
  parent.add(gF,gW,gT,gR,gD,gG,gC,gV,gP,gS,gA,gE,gK);
  gF.visible=$('l1').checked;gW.visible=$('l2').checked;gT.visible=$('l3').checked;const LG={l1:gF,l2:gW,l3:gT,l5:gD,l6:gG,l7:gC,l8:gV,l9:gS,l10:gP,l11:gR,l12:gA,l13:gE,l14:gK};Object.keys(LG).forEach(id=>{LG[id].visible=$(id).checked;(R.layers[id]=R.layers[id]||[]).push(LG[id]);});
  // Golv
  if(FL>0&&FW>0){
    const xs=[];for(let x=.0225;x<FL-.0225;x+=jc)xs.push(x);xs.push(FL-.0225);
    xs.forEach(x=>{mk(gF,.045,jh,FW,M.joist).position.set(x,fo+jh/2,FW/2);});
    [.0225,FW-.0225].forEach(z=>mk(gF,FL,jh,.045,M.joist).position.set(FL/2,fo+jh/2,z));
    mk(gF,FL,.022,FW,M.floor).position.set(FL/2,fo+jh+.011,FW/2);
    if(isW&&o.wref&&o.k===0){const pb=new THREE.Mesh(R3.box,M.pick);pb.scale.set(FL,.3,FW);pb.position.set(FL/2,fo+jh/2,FW/2);pb.userData.wing=o.wref;R.pick.push(pb);gF.add(pb);}
    if($('gr').value==='p'&&!(o&&o.noGrund)){
      const ph=g('ph')||.4,ln=Math.ceil(FW/2.4)+1,pl=Math.ceil(FL/1.8)+1;
      for(let a=0;a<ln;a++){
        const z=ln===1?FW/2:.05+a*(FW-.1)/(ln-1);
        mk(gF,FL,jh,.09,M.plate).position.set(FL/2,ph+jh/2,z);
        for(let b=0;b<pl;b++){const x=pl===1?FL/2:.1+b*(FL-.2)/(pl-1);mk(gF,.2,ph,.2,M.conc).position.set(x,ph/2,z);mk(gF,.35,.1,.35,M.conc).position.set(x,.05,z);mk(gF,.2,.012,.1,M.papp).position.set(x,ph+.006,z);}
      }
    }
  }
  // Väggar
  const ps=[[0,0],[ws[0],0],[ws[0],ws[1]],[ws[0]-ws[2],ws[1]]],ths=[0,-Math.PI/2,Math.PI,Math.PI/2];
  if(o&&o.Lm)ps[3]=[0,ws[1]];
  if(!isW&&!(o&&o.k>0)){R.geo={ps,ws,dirs:[[1,0],[0,1],[-1,0],[0,-1]],y0,H};reconcile(ws,(o&&o.N)||1);}
  const per=[[],[],[],[]];
  if(!isW)inst.filter(s=>(s.k||0)===((o&&o.k)||0)).forEach(s=>{
    const o=ops.find(x=>x.id===s.oid),len=ws[s.wall];
    if(!o||!(o.w>0&&o.w<len-.4))return;
    per[s.wall].push({c:Math.min(Math.max(s.c,o.w/2+.2),len-o.w/2-.2),w:o.w,h:o.h,t:o.t,ref:s});
  });
  const plan=(o&&o.plan)||ws.map(l=>[{s:0,e:l}]),DIRS=[[1,0],[0,1],[-1,0],[0,-1]];
  per.forEach((os,i)=>{
    const sg=plan[i];
    sg.forEach((q,qi)=>{
      const L2=q.e-q.s;if(L2<=.05)return;
      const mine=os.filter(x=>{
        const b=sg.reduce((bb,qq,j)=>{const dd=x.c<qq.s?qq.s-x.c:(x.c>qq.e?x.c-qq.e:0);return dd<bb.d?{d:dd,j}:bb;},{d:1e9,j:0});
        return b.j===qi;
      }).map(x=>({...x,c:Math.min(Math.max(x.c-q.s,x.w/2+.2),L2-x.w/2-.2)}));
      spread(mine,L2,drag);mine.forEach(x=>{if(x.ref)x.ref.c=x.c+q.s;});
      wall3d(gW,L2,[ps[i][0]+DIRS[i][0]*q.s,ps[i][1]+DIRS[i][1]*q.s],ths[i],mine,H,d,cc,y0,gC,gV,gA);
    });
  });
  if(!isW){
    const kk=(o&&o.k)||0,LA=ELS.filter(e=>(e.k||0)===kk),L=LA.filter(e=>e.t!=='t'),LT=LA.filter(e=>e.t==='t'),y1=g0('elY')||.25;
    const wl=ws.slice(),perim=wl.reduce((a,b)=>a+b,0),cum=[0,wl[0],wl[0]+wl[1],wl[0]+wl[1]+wl[2]];
    const gEw={};
    const geo=i=>gEw[i]||(gEw[i]=(()=>{const q=new THREE.Group();q.position.set(ps[i][0],y0,ps[i][1]);q.rotation.y=ths[i];gE.add(q);return q;})());
    const hseg=(i,xa,xb,y)=>{const a=Math.min(xa,xb),b=Math.max(xa,xb);if(b-a>.02)mk(geo(i),b-a,.02,.02,M.cond).position.set((a+b)/2,y,d*.5);};
    const vseg=(i,x,ya,yb)=>{const a=Math.min(ya,yb),b=Math.max(ya,yb);if(b-a>.02)mk(geo(i),.02,b-a,.02,M.cond).position.set(x,(a+b)/2,d*.5);};
    const wi=e=>Math.min(3,Math.max(0,e.wall||0));
    const cen=L.find(e=>e.t==='c')||{t:'c',wall:0,c:1,h:1.5};
    const pos=e=>cum[wi(e)]+Math.min(e.c,wl[wi(e)]);
    L.forEach(e=>{
      const i=wi(e);
      if(!(plan[i]||[]).some(q=>e.c>=q.s&&e.c<=q.e))return;
      const x=Math.min(Math.max(e.c,.1),Math.max(.1,wl[i]-.1)),h=e.h,isC=e.t==='c',sz=isC?[.4,.6,.12]:[.085,.085,.03];
      mk(geo(i),sz[0],sz[1],sz[2],isC?M.metal:M.frame).position.set(x,h,d+sz[2]/2);
      if(!isC)mk(geo(i),.06,.06,.04,M.metal2).position.set(x,h,d-.02);
      const pk=new THREE.Mesh(R.box,M.pick);pk.scale.set(.22,.22,.12);pk.position.set(x,h,d+.04);pk.userData.el=e;geo(i).add(pk);R.pick.push(pk);
    });
    const pc=pos(cen),ci=wi(cen),cxx=Math.min(Math.max(cen.c,.1),Math.max(.1,wl[ci]-.1));
    vseg(ci,cxx,y1,cen.h);
    L.forEach(e=>{
      if(e.t==='c')return;
      const i0=wi(e),x0=Math.min(Math.max(e.c,.1),Math.max(.1,wl[i0]-.1));
      vseg(i0,x0,e.h,y1);
      const df=(((pc-pos(e))%perim)+perim)%perim,dir=df<=perim/2?1:-1;
      let w=i0,xl=x0,rem=dir>0?df:perim-df,guard=0;
      while(rem>.02&&guard++<8){
        const avail=dir>0?wl[w]-xl:xl,step=Math.min(rem,avail);
        hseg(w,xl,xl+dir*step,y1);
        rem-=step;xl+=dir*step;
        if(rem>.02){if(dir>0){w=(w+1)%4;xl=0;}else{w=(w+3)%4;xl=wl[w];}}
      }
    });
    const yc=y0+H-.09,inw=i=>[Math.sin(ths[i]),Math.cos(ths[i])];
    const cw=[ps[ci][0]+DIRS[ci][0]*cxx+inw(ci)[0]*(d+.03),ps[ci][1]+DIRS[ci][1]*cxx+inw(ci)[1]*(d+.03)];
    LT.forEach(e=>{
      const lx=e.c,lz=e.h,yh=yc+.04;
      const cyl=new THREE.Mesh(R.cyl,M.frame);cyl.scale.set(.07,.03,.07);cyl.position.set(lx,yc-.015,lz);gE.add(cyl);
      const pk=new THREE.Mesh(R.box,M.pick);pk.scale.set(.28,.28,.28);pk.position.set(lx,yc-.05,lz);pk.userData.el=e;gE.add(pk);R.pick.push(pk);
      const ax=Math.abs(cw[0]-lx),az=Math.abs(cw[1]-lz);
      if(ax>.02)mk(gE,ax,.02,.02,M.cond).position.set((lx+cw[0])/2,yh,lz);
      if(az>.02)mk(gE,.02,.02,az,M.cond).position.set(cw[0],yh,(lz+cw[1])/2);
    });
    if(LT.length){const top2=yc+.04,bot=y0+cen.h;if(top2-bot>.02)mk(gE,.02,top2-bot,.02,M.cond).position.set(cw[0],(top2+bot)/2,cw[1]);}
  }
  if(!isW&&!(o&&o.k>0)&&$('dk').checked){
    const sd=Math.min(3,Math.max(0,parseInt($('dkS').value)||0)),dl=g0('dkL'),dp=g0('dkD'),hd=g0('dkH'),wlen=ws[sd];
    const x0=Math.min(Math.max(g0('dkX'),0),Math.max(0,wlen-dl));
    const gk=new THREE.Group();gk.position.set(ps[sd][0],0,ps[sd][1]);gk.rotation.y=ths[sd];gK.add(gk);
    const pl=Math.max(.15,hd-.318),top=pl+.318,yBl=pl+.0725,yJ=pl+.145+.0725,yP=pl+.29+.014;
    const lines=Math.ceil(dp/1.6)+1,perL=Math.ceil(dl/1.8)+1;
    for(let a=0;a<lines;a++){
      const z=-(lines===1?dp/2:.1+a*(dp-.2)/(lines-1));
      mk(gk,dl,.145,.09,M.plate).position.set(x0+dl/2,yBl,z);
      for(let b=0;b<perL;b++){const x=x0+(perL===1?dl/2:.1+b*(dl-.2)/(perL-1));mk(gk,.2,pl,.2,M.conc).position.set(x,pl/2,z);}
    }
    const nj=Math.ceil(dl/.6)+1;
    for(let j=0;j<nj;j++){const x=x0+(nj===1?dl/2:.0225+j*(dl-.045)/(nj-1));mk(gk,.045,.145,dp,M.joist).position.set(x,yJ,-dp/2);}
    mk(gk,dl,.145,.045,M.joist).position.set(x0+dl/2,yJ,-dp+.0225);
    mk(gk,dl,.145,.045,M.joist).position.set(x0+dl/2,yJ,-.0225);
    const np=Math.max(1,Math.floor(dp/.125));
    for(let q=0;q<np;q++)mk(gk,dl,.028,.12,M.deck).position.set(x0+dl/2,yP,-(.0625+q*((dp-.125)/Math.max(1,np-1))));
    const stairs=$('dkT').checked,sx0=x0+dl/2-.5,sx1=x0+dl/2+.5;
    if($('dkR').checked){
      const ry=1.0,post=(x,z)=>mk(gk,.095,ry,.095,M.stud).position.set(x,top+ry/2,z);
      const rails=(xa,xb,z)=>{if(xb-xa<.05)return;[ry-.03,ry*.5,.15].forEach(yy=>mk(gk,xb-xa,.045,.07,M.stud).position.set((xa+xb)/2,top+yy,z));};
      const zo=-dp+.05,segs=stairs?[[x0,sx0],[sx1,x0+dl]]:[[x0,x0+dl]];
      segs.forEach(([xa,xb])=>{const n=Math.max(1,Math.ceil((xb-xa)/1.2));for(let i=0;i<=n;i++)post(xa+.05+i*(xb-xa-.1)/n,zo);rails(xa,xb,zo);});
      const nz=Math.max(1,Math.ceil(dp/1.2));
      [x0+.05,x0+dl-.05].forEach(x=>{for(let i=1;i<=nz;i++)post(x,-.05-i*(dp-.1)/nz);[ry-.03,ry*.5,.15].forEach(yy=>mk(gk,.07,.045,dp-.1,M.stud).position.set(x,top+yy,-dp/2));});
    }
    if(stairs){
      const n=Math.max(1,Math.ceil(top/.17)),rs=top/n,run=.28;
      for(let k=0;k<n;k++)mk(gk,1.0,.04,run+.02,M.deck).position.set(x0+dl/2,top-(k+1)*rs-.02,-dp-(k+.5)*run);
      [sx0+.05,sx1-.05].forEach(x=>beam(gk,new THREE.Vector3(x,top-.1,-dp),new THREE.Vector3(x,.1,-dp-n*run),.045,.195,M.joist));
    }
    const pb=new THREE.Mesh(R.box,M.pick);pb.scale.set(dl,.5,dp);pb.position.set(x0+dl/2,top-.25,-dp/2);pb.userData.deck=true;gk.add(pb);R.pick.push(pb);
  }
  if(false)ELS.filter(e=>(e.k||0)===((o&&o.k)||0)).forEach(e=>{
    const i=Math.min(3,Math.max(0,e.wall||0)),len=ws[i];
    if(!(plan[i]||[]).some(q=>e.c>=q.s&&e.c<=q.e))return;
    const ge=new THREE.Group();ge.position.set(ps[i][0],y0,ps[i][1]);ge.rotation.y=ths[i];gE.add(ge);
    const x=Math.min(Math.max(e.c,.1),Math.max(.1,len-.1)),h=e.h,cen=e.t==='c',sz=cen?[.4,.6,.12]:[.085,.085,.03];
    mk(ge,sz[0],sz[1],sz[2],cen?M.metal:M.frame).position.set(x,h,d+sz[2]/2);
    if(!cen)mk(ge,.06,.06,.04,M.metal2).position.set(x,h,d-.02);
    const y1=.25,vh=Math.abs(h-y1);
    if(vh>.02)mk(ge,.02,vh,.02,M.cond).position.set(x,(h+y1)/2,d*.5);
    const cn=ELS.find(q=>q.t==='c'&&(q.k||0)===(e.k||0)&&(q.wall||0)===(e.wall||0)),tx=cn?cn.c:(x<len/2?.15:len-.15);
    if(Math.abs(tx-x)>.05)mk(ge,Math.abs(tx-x),.02,.02,M.cond).position.set((x+tx)/2,y1,d*.5);
  });
  const mnX=Math.min(...ps.map(p=>p[0])),mxX=Math.max(...ps.map(p=>p[0])),mnZ=Math.min(...ps.map(p=>p[1])),mxZ=Math.max(...ps.map(p=>p[1]));
  const cx=(mnX+mxX)/2-((o&&o.rext)||0)/2,cz=(mnZ+mxZ)/2;
  // Tak
  const base=y0+H,tn=Math.tan(P*Math.PI/180);
  if(RL>0&&RW>0&&!(o&&o.noRoof)){
    const glu=$('rt').value==='g',[rw,rh]=$('rd').value.split('x').map(v=>parseInt(v)/1000),rof=rh/2-.0725;
    const WBg=g0('GB'),ovAt=(sd,x)=>isW?(x<0?0:O):(WINGS.some(w=>w.s===(sd<0?'f':'b')&&x>w.x0&&x<w.x0+WBg)?0:O);
    const n=Math.max(2,Math.ceil(RL/ccT)+1);
    for(let i=0;i<n;i++){
      const x=cx-RL/2+rw/2+i*(RL-rw)/(n-1),end=i===0||i===n-1,v=(y,z)=>new THREE.Vector3(x,y,z),ridge=v(base+tn*RW/2,cz);
      if(!glu)beam(gT,v(base,cz-RW/2),v(base,cz+RW/2),rw,rh,M.stud);
      [-1,1].forEach(q=>mk(gT,rw+.01,.12,.1,M.metal2).position.set(x,base+.02,cz+q*RW/2));
      {const ov=ovAt(-1,x);beam(gT,v(base-tn*ov,cz-RW/2-ov),ridge,rw,rh,glu?M.limtra:M.stud);}
      {const ov=ovAt(1,x);beam(gT,v(base-tn*ov,cz+RW/2+ov),ridge,rw,rh,glu?M.limtra:M.stud);}
      if(!glu&&!end){const B1=v(base,cz-RW/6),B2=v(base,cz+RW/6),ML=v(base+tn*RW/4,cz-RW/4),MR=v(base+tn*RW/4,cz+RW/4);beam(gT,B1,ridge,.045,.07,M.plate);beam(gT,B2,ridge,.045,.07,M.plate);beam(gT,B1,ML,.045,.07,M.plate);beam(gT,B2,MR,.045,.07,M.plate);[B1,B2,ridge,ML,MR].forEach(p=>mk(gT,.052,.1,.1,M.metal).position.copy(p));}
      
      
    }
    const V=THREE.Vector3,eL=RL+2*O,co=Math.cos(P*Math.PI/180),si=Math.sin(P*Math.PI/180),sL=(RW/2+O)/co;
    const xs0=isW?Math.max(cx-eL/2,0):cx-eL/2;
    const dpN=Math.max(2,Math.ceil(2*eL/10)),px=(p,x)=>{const q=p.clone();q.x=x;return q;};
    if(glu)mk(gT,eL,rh,rw,M.limtra).position.set(cx,base+tn*RW/2-rh*.35,cz);
    const WBh=g0('GB'),xa0=cx-eL/2,xb0=cx+eL/2;
    const cutsFor=s=>isW?[{a:xa0-1,b:0}]:WINGS.filter(w=>w.s===(s<0?'f':'b')).map(w=>({a:w.x0,b:w.x0+WBh}));
    const yoR=(o&&o.yoff)||0,hP=base-tn*O-.07-.045+yoR;
    [-1,1].forEach(s=>{
      const nv=new V(0,co,s*si),cuts=cutsFor(s);
      const pts=[xa0,xb0];cuts.forEach(c=>{pts.push(Math.min(Math.max(c.a,xa0),xb0),Math.min(Math.max(c.b,xa0),xb0));});
      const xs=[...new Set(pts)].sort((p,q)=>p-q),segs=[];
      for(let i=0;i<xs.length-1;i++){const a=xs[i],b=xs[i+1];if(b-a<.01)continue;const mid=(a+b)/2;segs.push({a,b,ov:cuts.some(c=>mid>c.a&&mid<c.b)?0:O});}
      const Rf=new V(cx,base+tn*RW/2,cz),Ef=new V(cx,base-tn*O,cz+s*(RW/2+O));
      const atf=(p,off)=>p===Rf?new V(cx,Rf.y+(off+rof)/co,cz):p.clone().addScaledVector(nv,off+rof);
      beam(gD,atf(Rf,.125),atf(Rf.clone().lerp(Ef,.2/Ef.distanceTo(Rf)),.125),eL,.014,M.metal2);
      [-1,1].forEach(sx=>{
        if(isW&&sx===-1)return;
        const x1=cx+sx*(eL/2-.011),x2=cx+sx*(eL/2+.003);
        beam(gD,px(atf(Ef,.045),x1),px(atf(Rf,.045),x1),.022,.145,M.joist);
        beam(gD,px(atf(Ef,.03),x2),px(atf(Rf,.03),x2),.006,.17,M.metal2);
      });
      const cand=[];
      segs.forEach(sg=>{
        const xc=(sg.a+sg.b)/2,len=sg.b-sg.a,Os=sg.ov;
        const E=new V(xc,base-tn*Os,cz+s*(RW/2+Os)),Rg=new V(xc,base+tn*RW/2,cz);
        const at=(p,off)=>p===Rg?new V(xc,Rg.y+(off+rof)/co,cz):p.clone().addScaledVector(nv,off+rof);
        beam(gR,at(E,.0835),at(Rg,.0835),len,.022,M.spont);
        beam(gP,at(E,.0965),at(Rg,.0965),len,.004,M.papp);
        const nS=Math.max(1,Math.ceil(len/1.0)),w=len/nS;
        for(let i=0;i<nS;i++){const x=sg.a+w*(i+.5);beam(gS,px(at(E,.1045),x),px(at(Rg,.1045),x),w-.012,.012,M.metal);for(let r=0;r<5;r++){const rx=x-w/2+.012+(r+.5)*(w-.024)/5;beam(gS,px(at(E,.116),rx),px(at(Rg,.116),rx),.03,.012,M.metal2);}}
        if(Os<=0)return;
        const q=at(E,.11);
        beam(gD,new V(sg.a,q.y,q.z),new V(sg.b,q.y,q.z),.12,.012,M.metal2);
        const fb=at(E,-.02);beam(gD,new V(sg.a,fb.y-.05,fb.z),new V(sg.b,fb.y-.05,fb.z),.022,.145,M.joist);
        const tp=E.clone().lerp(Rg,.6/E.distanceTo(Rg)),x0=sg.a+.25,x1=sg.b-.25;
        if(x1-x0>.8){
          const tube=p=>{const t=new THREE.Mesh(R3.cyl,M.metal2);t.scale.set(.0125,x1-x0,.0125);t.rotation.z=Math.PI/2;t.position.set((x0+x1)/2,p.y,p.z);gD.add(t);};
          tube(at(tp,.156));tube(at(tp,.221));
          const nb=Math.ceil((x1-x0)/.9)+1;
          for(let k=0;k<nb;k++){
            const x=x0+k*(x1-x0)/(nb-1);
            beam(gD,px(at(tp,.111),x),px(at(tp,.117),x),.08,.1,M.metal2);
            beam(gD,px(at(tp,.111),x),px(at(tp,.235),x),.022,.022,M.metal2);
            [.156,.221].forEach(oo=>{const c=new THREE.Mesh(R3.box,M.metal2);c.scale.set(.03,.03,.03);const pp=at(tp,oo);c.position.set(x,pp.y,pp.z);gD.add(c);});
          }
        }
        const gy=E.y-.07,gz=E.z+s*.1;
        const gm=new THREE.Mesh(R3.cyl,M.metal2);gm.scale.set(.055,len,.055);gm.rotation.z=Math.PI/2;gm.position.set(xc,gy,gz);gG.add(gm);
        for(let hx=sg.a+.1;hx<=sg.b;hx+=.6)mk(gG,.012,.1,.1,M.metal).position.set(hx,gy-.02,gz);
        if(len>.6)cand.push(sg.a+.2,sg.b-.2);
      });
      const mP=s===-1?Math.ceil(dpN/2):Math.floor(dpN/2);
      let xsP=[];
      if(isW){for(let i=0;i<mP;i++)xsP.push(cx+eL/2-.2-i*1.5);}
      else{const c2=s<0?cand:cand.slice().reverse(),step=Math.max(1,Math.ceil(c2.length/Math.max(1,mP)));xsP=c2.filter((_,i)=>i%step===0).slice(0,mP);}
      const gzF=cz+s*(RW/2+O)+s*.1;
      xsP.forEach(x=>{if(hP>.1){
        const pm=new THREE.Mesh(R3.cyl,M.metal2);pm.scale.set(.04,hP,.04);pm.position.set(x,hP/2-yoR,gzF);gG.add(pm);
        [.3,hP/2,hP-.3].forEach(yy=>mk(gG,.1,.03,.1,M.metal).position.set(x,yy-yoR,gzF));
        mk(gG,.08,.06,.12,M.metal2).position.set(x,.03-yoR,gzF+s*.06);}});
    });
    [].forEach(s=>{
      const Os=O,E=new V(cx,base-tn*Os,cz+s*(RW/2+Os)),Rg=new V(cx,base+tn*RW/2,cz),nv=new V(0,co,s*si);
      const at=(p,off)=>p===Rg?new V(cx,Rg.y+(off+rof)/co,cz):p.clone().addScaledVector(nv,off+rof);
      // råspont, takpapp och takplåt
      beam(gR,at(E,.0835),at(Rg,.0835),eL,.022,M.spont);
      beam(gP,at(E,.0965),at(Rg,.0965),eL,.004,M.papp);
      const nS=Math.ceil(eL/1.0),w=eL/nS;
      for(let i=0;i<nS;i++){const x=cx-eL/2+w*(i+.5);beam(gS,px(at(E,.1045),x),px(at(Rg,.1045),x),w-.012,.012,M.metal);for(let r=0;r<5;r++){const rx=x-w/2+.012+(r+.5)*(w-.024)/5;beam(gS,px(at(E,.116),rx),px(at(Rg,.116),rx),.03,.012,M.metal2);}}
      // nockplåt
      beam(gD,at(Rg,.125),at(Rg.clone().lerp(E,.2/E.distanceTo(Rg)),.125),eL,.014,M.metal2);
      // vindskiva (trä) och vindskiveplåt på båda gavlarna
      [-1,1].forEach(sx=>{
        if(isW&&sx===-1)return;
        const x1=cx+sx*(eL/2-.011),x2=cx+sx*(eL/2+.003);
        beam(gD,px(at(E,.045),x1),px(at(Rg,.045),x1),.022,.145,M.joist);
        beam(gD,px(at(E,.03),x2),px(at(Rg,.03),x2),.006,.17,M.metal2);
      });
      // takfotsplåt och snörasskydd
      const q=at(E,.11);
      beam(gD,new V(xs0,q.y,q.z),new V(cx+eL/2,q.y,q.z),.12,.012,M.metal2);
      const fb=at(E,-.02);beam(gD,new V(xs0,fb.y-.05,fb.z),new V(cx+eL/2,fb.y-.05,fb.z),.022,.145,M.joist);
      const tp=E.clone().lerp(Rg,.6/E.distanceTo(Rg)),x0=xs0+.25,x1=cx+eL/2-.25;
      const tube=p=>{const m=new THREE.Mesh(R3.cyl,M.metal2);m.scale.set(.0125,x1-x0,.0125);m.rotation.z=Math.PI/2;m.position.set((x0+x1)/2,p.y,p.z);gD.add(m);};
      tube(at(tp,.156));tube(at(tp,.221));
      const nb=Math.ceil((x1-x0)/.9)+1;
      for(let k=0;k<nb;k++){
        const x=x0+k*(x1-x0)/(nb-1);
        beam(gD,px(at(tp,.111),x),px(at(tp,.117),x),.08,.1,M.metal2);
        beam(gD,px(at(tp,.111),x),px(at(tp,.235),x),.022,.022,M.metal2);
        const cap=(o)=>{const m=new THREE.Mesh(R3.box,M.metal2);m.scale.set(.03,.03,.03);const p=at(tp,o);m.position.set(x,p.y,p.z);gD.add(m);};
        cap(.156);cap(.221);
      }
      // hängränna och stuprör
      const gy=E.y-.07,gz=E.z+s*.1;
      const gm=new THREE.Mesh(R3.cyl,M.metal2);gm.scale.set(.055,cx+eL/2-xs0,.055);gm.rotation.z=Math.PI/2;gm.position.set((xs0+cx+eL/2)/2,gy,gz);gG.add(gm);
      for(let hx=xs0+.1;hx<=cx+eL/2;hx+=.6)mk(gG,.012,.1,.1,M.metal).position.set(hx,gy-.02,gz);
      const m=s===-1?Math.ceil(dpN/2):Math.floor(dpN/2),yo=(o&&o.yoff)||0,h=gy-.045+yo;
      for(let i=0;i<m;i++){
        const x=isW?cx+eL/2-.2-i*1.5:(m===1?cx+s*(eL/2-.2):cx-eL/2+.2+i*(eL-.4)/(m-1));
        if(h>.1){const pm=new THREE.Mesh(R3.cyl,M.metal2);pm.scale.set(.04,h,.04);pm.position.set(x,h/2-yo,gz);gG.add(pm);[.3,h/2,h-.3].forEach(yy=>mk(gG,.1,.03,.1,M.metal).position.set(x,yy-yo,gz));mk(gG,.08,.06,.12,M.metal2).position.set(x,.03-yo,gz+s*.06);}
      }
    });
    // Gavelspetsar: går hela vägen upp till taket
    [1,3].forEach(i=>{
      const len=ws[i],s0=ps[i],sg=i===1?1:-1;
      if(len<=0)return;
      const gg=new THREE.Group();gg.position.set(s0[0],base,s0[1]);gg.rotation.y=ths[i];gW.add(gg);
      const gc=new THREE.Group();gc.position.copy(gg.position);gc.rotation.y=ths[i];gC.add(gc);
      const gq=new THREE.Group();gq.position.copy(gg.position);gq.rotation.y=ths[i];gV.add(gq);
      const gx=new THREE.Group();gx.position.copy(gg.position);gx.rotation.y=ths[i];gA.add(gx);
      const ht=x=>Math.max(0,tn*(RW/2-Math.abs(s0[1]+sg*x-cz))-rh/(2*co)-.03);
      const xs=[];for(let x=.0225;x<len-.0225;x+=cc)xs.push(x);xs.push(len-.0225);
      xs.forEach(x=>{const h=ht(x);if(h>.05)mk(gg,.045,h,d,M.stud).position.set(x,h/2,d/2);});
      for(let x=0;x<len-.01;x+=.4){
        const w=Math.min(.4,len-x),mid=x+w/2,h=ht(mid);
        if(h<.02)continue;
        mk(gq,w,h,.009,M.spont).position.set(mid,h/2,-.0045);
        {const sd=$('pd').value==='s';mk(gc,w,h,.022,panelMat(w,h,sd)).position.set(mid,h/2,sd?-.076:-.048);if(sd)for(let y=.3;y<h-.02;y+=.6)mk(gx,w,.045,.028,M.stud).position.set(mid,y,-.051);}
      }
      for(let x=.035;x<len-.03;x+=.6){const h=ht(x);if(h>.05)mk(gx,.07,h,.028,M.stud).position.set(x,h/2,-.023);}
    });
  }
  if(R.fresh&&!isW){
    const size=Math.max(FL,FW,RL,RW,6);
    R.cam.position.set(cx+size*.9,size*.85,cz+size*1.5);
    if(R.ctl){R.ctl.target.set(cx,(y0+H)*((o&&o.N)||1)/2,cz);R.ctl.update();}else R.cam.lookAt(cx,(y0+H)*((o&&o.N)||1)/2,cz);
    R.fresh=false;R.rs();
  }
  R.draw();
}
const calc0=calc;
calc=function(){calc0();try{build3d();}catch(e){console.error(e);}};
$('rs3').onclick=()=>{if(R3)R3.fresh=true;build3d();};
$('rs4').onclick=()=>{inst=[];build3d();};
