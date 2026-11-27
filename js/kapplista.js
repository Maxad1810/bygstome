/* Kapplista: alla bräder och reglar i 3D-modellen grupperade per dimension och kapad längd. */
function klCollect(){
  const R=(typeof R3!=="undefined")?R3:null;if(!R||!R.root)return null;
  const pm=new Set(Object.values(R.pmat||{})),std=$('pd')&&$('pd').value==='s',map=new Map(),hz=new Map();
  const add=(dim,len,n)=>{len=Math.round(len*1000/5)*5;if(len<50)return;const k=dim+'|'+len;map.set(k,(map.get(k)||0)+n);};
  R.root.traverse(m=>{
    if(!m.isMesh||!m.material)return;
    if(m.material.userData&&m.material.userData.timber){
      const d=[m.scale.x,m.scale.y,m.scale.z].sort((a,b)=>a-b);
      if(d[2]<.1||d[0]<.02)return;
      add(Math.round(d[0]*1000)+'x'+Math.round(d[1]*1000),d[2],1);
    }else if(pm.has(m.material)){
      const w=m.scale.x,h=m.scale.y;
      if(std)add('22x145 fasadpanel',h,Math.ceil(w/.12));
      else{const key=m.parent.id,ylo=m.position.y-h/2,n=Math.ceil(h/.12-.01);for(let k=0;k<n;k++){const lv=Math.round((ylo+k*.12)/.12),kk=key+'|'+lv;if(!hz.has(kk))hz.set(kk,[]);hz.get(kk).push([m.position.x-w/2,m.position.x+w/2]);}}
    }
  });
  hz.forEach(iv=>{iv.sort((a,b)=>a[0]-b[0]);let cur=null;iv.forEach(q=>{if(cur&&q[0]<=cur[1]+.02)cur[1]=Math.max(cur[1],q[1]);else{if(cur)add('22x145 fasadpanel',cur[1]-cur[0],1);cur=[q[0],q[1]];}});if(cur)add('22x145 fasadpanel',cur[1]-cur[0],1);});
  const rows=[...map.entries()].map(([k,n])=>{const [dim,len]=k.split('|');return {dim,len:+len,n};});
  rows.sort((a,b)=>a.dim===b.dim?b.len-a.len:(a.dim<b.dim?-1:1));
  return rows;
}
function klUse(dim){
  const v=id=>{const e=$(id);return e?String(e.value||'').replace(/\s/g,''):'';},u=[];
  if(/fasadpanel/.test(dim))return 'Fasadpanel (utvändig träpanel)';
  const d=dim.replace(/\s.*/,'');
  if(d===v('dim'))u.push('väggreglar, syll, ovanregel, bärlinor över öppningar, fönsterbröstregel');
  if(d===v('jd'))u.push('golvbjälkar och randbjälkar');
  if(d===v('rd'))u.push('takstolar/sparrar, takbjälkar');
  if(!u.length){
    const w=+d.split('x')[0],h=+d.split('x')[1];
    if(w<=28&&h<=70)u.push('ströläkt och tvärläkt (tak och fasad), läkt');
    else if(w<=28)u.push('bräder: vindskiva, foder, knutar, golvlist');
    else if(w<=70&&h<=100)u.push('reglar i innerväggar, kortlingar, stödregel, takåsar');
    else if(w<=70)u.push('konstruktionsvirke: innerväggsreglar, bärbalk, räcke, takåsar');
    else u.push('limträ/stolpar: bärande balkar och stolpar (carport, altan, takbalk)');
  }
  return u.join('; ');
}
function klRender(){
  const rows=klCollect(),out=$('klOut');if(!out)return null;
  if(!rows||!rows.length){out.innerHTML='<p class="note">Ingen modell att lista än.</p>';return rows;}
  let html='<table class="kl"><thead><tr><th>Dimension (mm)</th><th>Används till</th><th>Längd (mm)</th><th>Antal</th><th>Summa (m)</th></tr></thead><tbody>',cur='',tot=0,totN=0;
  const sub={};rows.forEach(r=>{sub[r.dim]=(sub[r.dim]||0)+r.len*r.n/1000;});
  rows.forEach(r=>{html+='<tr><td>'+(r.dim===cur?'':r.dim)+'</td><td>'+(r.dim===cur?'':klUse(r.dim))+'</td><td>'+r.len+'</td><td>'+r.n+'</td><td>'+nf(r.len*r.n/1000,1)+'</td></tr>';cur=r.dim;tot+=r.len*r.n/1000;totN+=r.n;});
  html+='</tbody></table><p class="note">'+totN+' delar, '+nf(tot,0)+' m virke totalt. '+Object.entries(sub).map(([k,v])=>k+': '+nf(v,0)+' m').join(' · ')+'</p>';
  out.innerHTML=html;return rows;
}
function klCsv(){
  const rows=klCollect();if(!rows||!rows.length)return;
  const csv='Dimension (mm);Längd (mm);Antal;Summa (m)\n'+rows.map(r=>[r.dim,r.len,r.n,(r.len*r.n/1000).toFixed(2).replace('.',',')].join(';')).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+csv],{type:'text/csv'}));a.download='kapplista.csv';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
}
(function(){const b=$('klBtn'),c=$('klCsv');if(b)b.onclick=klRender;if(c)c.onclick=klCsv;})();
