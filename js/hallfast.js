/* ---------- Förenklad hållfasthetskontroll (Eurokod 5, tumregler) ---------- */
const MAT={
  C24:{fm:24,fv:4.0,fc0:21,fc90:2.5,E:11000,E05:7400,gm:1.3,kcr:.67,gl:false},
  GL30:{fm:30,fv:3.5,fc0:24.5,fc90:2.5,E:13000,E05:10800,gm:1.25,kcr:.67,gl:true}
};
const SOLID_H=[95,120,145,170,195,220,270,320],GL_SEC=[[90,225],[90,315],[115,315],[115,405],[140,405],[140,495],[165,495]];
function strCfg(){
  return {S0:g0('hS0')||2.5,gd:parseFloat($('hSK').value)||.91,gRoof:g0('hGR')||.6,gFloor:g0('hGF')||.5,qFloor:g0('hQF')||2,qBalc:g0('hQB')||3.5};
}
function snowRoof(P,S0){const mu=P<=30?.8:(P>=60?0:.8*(60-P)/30);return mu*S0;}   // Sk = mu * Ct * Ce * S0, Ct=Ce=1
function chkMember(o){
  const m=MAT[o.mat||'C24'],gd=o.gd,b=o.b/1000,h=o.h/1000,n=o.n||1,L=o.L,kmod=o.kmod||.8,kdef=o.kdef||.6,cant=!!o.cant;
  if(!(L>0))return {ub:0,uv:0,ud:0,u:0};
  const g=o.g||0,q1=o.q1||0,q2=o.q2||0,p0=.7;
  const ed=(a,c)=>gd*(1.2*g+1.5*a+1.5*p0*c),Ed=Math.max(ed(q1,q2),ed(q2,q1));
  const M=cant?Ed*L*L/2:Ed*L*L/8,V=cant?Ed*L:Ed*L/2;
  const W=n*b*h*h/6,I=n*b*h*h*h/12,kh=m.gl?Math.min(1.1,Math.pow(.6/h,.1)):(h<.15?Math.min(1.3,Math.pow(.15/h,.2)):1);
  const fmd=kmod*kh*m.fm*1000/m.gm,fvd=kmod*m.fv*1000/m.gm;
  const ub=(M/W)/fmd,uv=(1.5*V/(m.kcr*n*b*h))/fvd;
  const EI=m.E*1000*I,dl=cant?Math.pow(L,4)/(8*EI):5*Math.pow(L,4)/(384*EI);
  const qv=Math.max(q1+p0*q2,q2+p0*q1),winst=qv*dl,wfin=g*dl*(1+kdef)+qv*dl*(1+.3*kdef);
  const ud=Math.max(winst/(cant?L/150:L/300),wfin/(cant?L/125:L/250));
  return {ub,uv,ud,u:Math.max(ub,uv,ud)};
}
function suggestMember(o){
  if(o.mat==='GL30'){for(const s of GL_SEC){const r=chkMember({...o,b:s[0],h:s[1]});if(r.u<=1)return s[0]+'x'+s[1]+' (limträ)';}return 'st\u00f6rre \u00e4n 165x495 (konstrukt\u00f6r)';}
  for(const hh of SOLID_H){const r=chkMember({...o,h:hh});if(r.u<=1)return (o.n>1?o.n+'\u00d7':'')+(o.b)+'x'+hh;}
  return 'st\u00f6rre \u00e4n '+(o.n>1?o.n+'\u00d7':'')+o.b+'x320 (limtr\u00e4/konstrukt\u00f6r)';
}
function chkStud(h,Hc,Nd,kmod){   // tryckt regel 45xh, knäckning kring starka axeln (kläd håller svaga)
  const m=MAT.C24,b=.045,hh=h/1000,i=hh/Math.sqrt(12),lam=Hc/i,lrel=lam/Math.PI*Math.sqrt(m.fc0/m.E05);
  const k=.5*(1+.2*(lrel-.3)+lrel*lrel),kc=1/(k+Math.sqrt(Math.max(0,k*k-lrel*lrel)));
  const fcd=(kmod||.8)*m.fc0*1000/m.gm,u1=(Nd/(b*hh))/(kc*fcd);
  const fc90=1.25*(kmod||.8)*m.fc90*1000/m.gm,u2=(Nd/(b*hh))/fc90;
  return Math.max(u1,u2);
}
function hallfast(){
  const R=[],c=strCfg(),P=g0('P'),co=Math.cos(P*Math.PI/180),S=snowRoof(P,c.S0),hus=$('bHus').checked,N=mcount(),gi=garageInfo();
  const H=g0('H2'),RW=g0('RW'),O=g0('O'),FW=g0('FW'),FL=g0('FL'),ccT=g0('ccT')||1.2,jc=g0('jc')||.6,cc=g0('cc')||.6;
  const jd=parseInt($('jd').value.split('x')[1])||195,dh=parseInt($('dim').value.split('x')[1])||145;
  const add=(el,dim,span,load,r,hint)=>R.push({el,dim,span,load,ub:r.ub,uv:r.uv,ud:r.ud,u:r.u,hint:hint||''});
  const ass=(o)=>{const r=chkMember(o);return [r,r.u>1?'F\u00f6rslag: '+suggestMember(o):''];};
  if(hus){
    if($('gr').value==='p'){
      const lines=Math.ceil(FW/2.4)+1,sp=FW/(lines-1);
      let o={b:45,h:jd,L:sp,g:c.gFloor*jc,q1:c.qFloor*jc,gd:c.gd};
      let [r,hn]=ass(o);add('Golvbj\u00e4lkar (v\u00e5ning 1)','45x'+jd+' c/c '+nf(jc*1000),nf(sp,2)+' m','golv '+nf(c.qFloor,1)+' kN/m\u00b2',r,hn);
      const perL=Math.ceil(FL/1.8)+1,ps=FL/(perL-1);
      o={b:45,h:jd,n:2,L:ps,g:c.gFloor*sp,q1:c.qFloor*sp,gd:c.gd};[r,hn]=ass(o);add('B\u00e4rlinor (plintar)','2\u00d745x'+jd,nf(ps,2)+' m','linjelast '+nf(c.qFloor*sp,1)+' kN/m',r,hn);
    }
    if(N>1){
      const bs=parseInt($('hBS').value)||0,Lj=FW/(bs+1);
      const o={b:45,h:jd,L:Lj,g:c.gFloor*jc,q1:c.qFloor*jc,gd:c.gd},[r,hn]=ass(o);
      add('Mellanbj\u00e4lklag (v\u00e5ning 2+)','45x'+jd+' c/c '+nf(jc*1000),nf(Lj,2)+' m ('+(bs?bs+' st\u00f6dbalk'+(bs>1?'ar':''):'fritt mellan ytterv\u00e4ggar')+')','golv '+nf(c.qFloor,1)+' kN/m\u00b2',r,hn+(r.u>1&&bs<3?' eller fler st\u00f6dbalkar (ruta under Laster)':''));
      if(bs>0){
        const tr=FW/(bs+1),ob={mat:'GL30',b:115,h:315,L:FL,g:c.gFloor*tr,q1:c.qFloor*tr,gd:c.gd,kmod:.8},[r2,h2]=ass(ob);
        add('St\u00f6dbalk under mellanbj\u00e4lklag','GL30 115x315',nf(FL,2)+' m (mellan ytterv\u00e4ggar/st\u00f6d)','linjelast '+nf((c.gFloor+c.qFloor)*tr,1)+' kN/m',r2,h2);
      }
    }
    // tak
    if($('rt').value==='g'){
      const [bb,hh]=$('rd').value.split('x').map(Number),Lr=(RW/2)/co;
      let o={mat:'GL30',b:bb,h:hh,L:Lr,g:c.gRoof*ccT*co,q1:S*ccT*co*co,gd:c.gd,kmod:.8};
      let [r,hn]=ass(o);add('Limtr\u00e4sparrar','GL30 '+bb+'x'+hh+' c/c '+nf(ccT,1)+' m',nf(Lr,2)+' m (sparrl\u00e4ngd)','snö '+nf(S,2)+' kN/m\u00b2',r,hn);
      const RL=g0('RL'),nS=parseInt($('hNS').value)||0,Ls=RL/(nS+1);
      o={mat:'GL30',b:bb,h:hh,L:Ls,g:c.gRoof*RW/co,q1:S*RW,gd:c.gd,kmod:.8};[r,hn]=ass(o);add('Limtr\u00e4 nockbalk','GL30 '+bb+'x'+hh,nf(Ls,2)+' m ('+(nS?nS+' mellanst\u00f6d':'mellan gavlarna')+')','linjelast '+nf(S*RW,1)+' kN/m sn\u00f6',r,hn+(r.u>1&&nS<4?' eller fler mellanst\u00f6d under nocken (ruta under Laster)':''));
    }else R.push({el:'Takstolar',dim:$('rd').value,span:nf(RW,1)+' m',load:'snö '+nf(S,2)+' kN/m\u00b2',ub:0,uv:0,ud:0,u:0,hint:'Dimensioneras av tillverkaren. Ange snölast S0 = '+nf(c.S0,1)+' kN/m\u00b2 (taklast Sk = '+nf(S,2)+') vid best\u00e4llning.',info:true});
    // bärlina över största öppning + regel
    const fl=N-1;
    let worst=null;
    inst.forEach(s=>{
      const o=ops.find(x=>x.id===s.oid);if(!o||(s.k||0)>=N||s.wall%2!==0)return;
      const k=s.k||0,above=N-1-k;
      const gl=c.gRoof/co*(RW/2+O)+above*c.gFloor*FW/2+.4*H*(above+1),qs=S*(RW/2+O),qf=above*c.qFloor*FW/2;
      const ob={b:45,h:dh,n:2,L:o.w+.2,g:gl,q1:qs,q2:qf,gd:c.gd},r=chkMember(ob);
      if(!worst||r.u>worst.r.u)worst={o:ob,r,w:o.w,k,wall:s.wall,above};
    });
    if(worst){const hn=worst.r.u>1?'F\u00f6rslag: '+suggestMember(worst.o)+' eller limtr\u00e4balk':'';add('B\u00e4rlina \u00f6ver st\u00f6rsta \u00f6ppning','2\u00d745x'+dh+' ('+nf(worst.w,2)+' m, v\u00e5ning '+(worst.k+1)+')',nf(worst.o.L,2)+' m','linjelast ca '+nf(worst.o.g+worst.o.q1+(worst.o.q2||0),1)+' kN/m',worst.r,hn);}
    // regel nedre våning, långvägg
    {
      const above=N-1,gl=c.gRoof/co*(RW/2+O)+above*c.gFloor*FW/2+.4*H*(above+1),qs=S*(RW/2+O),qf=above*c.qFloor*FW/2;
      const Ed=Math.max(c.gd*(1.2*gl+1.5*qs+1.5*.7*qf),c.gd*(1.2*gl+1.5*qf+1.5*.7*qs))*cc;
      const u=chkStud(dh,H,Ed,.8);
      R.push({el:'Reglar nedre v\u00e5ning (tryck)',dim:'45x'+dh+' c/c '+nf(cc*1000),span:nf(H,2)+' m',load:nf(Ed,1)+' kN per regel',ub:u,uv:0,ud:0,u,hint:u>1?'F\u00f6rslag: tätare c/c, st\u00f6rre dimension eller dubbla reglar':''});
    }
    if($('bk').checked){
      const b=balcInfo();
      if(b){
        const sb=.8*c.S0,o={b:45,h:195,L:b.dp,cant:true,g:.6*.6,q1:c.qBalc*.6,q2:sb*.6,gd:c.gd,kmod:.65,kdef:2},[r,hn]=ass(o);
        add('Balkongbj\u00e4lkar (utkragade)','45x195 c/c 600',nf(b.dp,2)+' m utkragning','nyttig '+nf(c.qBalc,1)+' kN/m\u00b2',r,hn+' \u2013 kontrollera \u00e4ven inspänning bakåt (minst 2\u00d7 utkragningen)');
      }
    }
    if($('dk').checked){
      const D=deckSegs(),lines=Math.ceil(D.dp/1.6)+1,sp=D.dp/(lines-1);
      let o={b:45,h:145,L:sp,g:.4*.6,q1:2*.6,gd:c.gd,kmod:.65,kdef:2},[r,hn]=ass(o);
      add('D\u00e4cksbj\u00e4lkar (altan)','45x145 c/c 600',nf(sp,2)+' m','nyttig 2,0 kN/m\u00b2',r,hn);
      const perL=Math.ceil(D.leff/1.8)+1,ps=D.leff/Math.max(1,perL-1);
      o={b:45,h:145,n:2,L:ps,g:.4*sp,q1:2*sp,gd:c.gd,kmod:.65,kdef:2};[r,hn]=ass(o);add('B\u00e4rlinor (altan)','2\u00d745x145',nf(ps,2)+' m','linjelast '+nf(2*sp,1)+' kN/m',r,hn);
      const rt=$('dkRoof').value;
      if(rt!=='n'){
        const stp=rt==='f'?.6:.9,Lh=D.dp+.3;
        o={b:45,h:145,L:Lh,g:.35*stp,q1:(rt==='f'?.8*c.S0:.4*c.S0)*stp,gd:c.gd,kmod:.8,kdef:.8};[r,hn]=ass(o);add('Takbj\u00e4lkar (altantak)','45x145 c/c '+nf(stp*1000),nf(Lh,2)+' m','sn\u00f6 '+nf(rt==='f'?.8*c.S0:.4*c.S0,2)+' kN/m\u00b2',r,hn);
        const Lb=2.8;o={b:45,h:195,n:2,L:Lb,g:.35*(D.dp/2+.15),q1:(rt==='f'?.8*c.S0:.4*c.S0)*(D.dp/2+.15),gd:c.gd,kmod:.8,kdef:.8};[r,hn]=ass(o);add('B\u00e4rbalk (altantak)','2\u00d745x195',nf(Lb,2)+' m (stolpavst\u00e5nd)','',r,hn);
      }
    }
  }
  if(gi){
    const nm=GN();
    if(gi.type==='c'){
      const L=gi.L,B=gi.B,n=Math.ceil(L/3)+1,sp=L/(n-1),Sc=.8*c.S0;
      let o={b:45,h:145,L:B,g:.4*.9,q1:Sc*.9,gd:c.gd,kmod:.8,kdef:.8},[r,hn]=ass(o);add('Takbj\u00e4lkar ('+nm+')','45x145 c/c 900',nf(B,2)+' m','sn\u00f6 '+nf(Sc,2)+' kN/m\u00b2',r,hn);
      o={b:45,h:195,n:2,L:sp,g:.4*(B/2+.15),q1:Sc*(B/2+.15),gd:c.gd,kmod:.8,kdef:.8};[r,hn]=ass(o);add('B\u00e4rbalk ('+nm+')','2\u00d745x195',nf(sp,2)+' m (stolpavst\u00e5nd)','',r,hn);
    }else{
      const p=gi.gops.find(x=>x.t==='p');
      if(p){
        const trib=(p.wall%2===0?gi.B/2+O:ccT/2+.3),gl=c.gRoof/co*trib+.4*gi.H,qs=S*trib;
        const o={b:45,h:dh,n:2,L:p.w+.2,g:gl,q1:qs,gd:c.gd,kmod:.8},[r,hn]=ass(o);
        add('B\u00e4rlina \u00f6ver garageport ('+nm+')','2\u00d745x'+dh+' ('+nf(p.w,2)+' m)',nf(p.w+.2,2)+' m','linjelast ca '+nf(gl+qs,1)+' kN/m',r,hn+(r.u>1?' eller limtr\u00e4balk':''));
      }
      R.push({el:'Takstolar ('+nm+')',dim:$('rd').value,span:nf(gi.B,1)+' m',load:'snö '+nf(S,2)+' kN/m\u00b2',ub:0,uv:0,ud:0,u:0,hint:'Dimensioneras av tillverkaren (S0 = '+nf(c.S0,1)+' kN/m\u00b2).',info:true});
    }
  }
  return R;
}
function strStatus(r){return r.info?'\u2139\ufe0f Tillverkare':(r.u>1?'\u274c Klarar inte':(r.u>.85?'\u26a0\ufe0f N\u00e4ra gr\u00e4nsen':'\u2705 OK'));}
function renderStruct(){
  const box=$('strBox');if(!box)return;
  const R=hallfast(),c=strCfg(),S=snowRoof(g0('P'),c.S0);
  if(!R.length){box.innerHTML='<p class="note">Inget att kontrollera.</p>';return;}
  const pc=v=>nf(v*100)+' %';
  box.innerHTML='<p class="note" style="margin-top:0">S0 = '+nf(c.S0,1)+' kN/m\u00b2 \u2192 snö på tak Sk = '+nf(S,2)+' kN/m\u00b2. \u03b3d = '+nf(c.gd,2)+', C24 (limträ GL30), klimatklass 1 (utomhus 3).</p><div class="scroll"><table><thead><tr><th>Del</th><th style="text-align:right">Spann</th><th style="text-align:right">B\u00f6j</th><th style="text-align:right">Skj</th><th style="text-align:right">Nedb.</th><th>Status</th></tr></thead><tbody>'+
    R.map(r=>'<tr><td>'+r.el+'<small>'+r.dim+(r.load?' \u00b7 '+r.load:'')+(r.hint?'<br>'+r.hint:'')+'</small></td><td class="n">'+r.span+'</td><td class="n">'+(r.info?'':pc(r.ub))+'</td><td class="n">'+(r.info?'':pc(r.uv))+'</td><td class="n">'+(r.info?'':pc(r.ud))+'</td><td>'+strStatus(r)+'</td></tr>').join('')+
    '</tbody></table></div><p class="note"><b>Förenklad förkontroll</b> enligt Eurokod 5 med svenska tumregler (säkerhetsklass, kmod 0,8, γM 1,3/1,25). Vind, stabilitet, infästningar, knutpunkter, grund, takstolar och brand ingår inte. <b>Ersätter inte konstruktörens beräkning</b> – låt en konstruktör granska innan du bygger.</p>';
}

function strWord(r){return r.info?'Tillverkare':(r.u>1?'Klarar inte':(r.u>.85?'Nära gränsen':'OK'));}
