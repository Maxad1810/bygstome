/* ---------- Inloggning och sparade ritningar på servern ---------- */
(async function(){
  let me,adm=false;
  try{
    if((await (await fetch('/api/ping')).text())!=='ok')return;
    const j0=await (await fetch('/api/me')).json();me=j0.user;adm=!!j0.admin;
  }catch(e){return;}                       // ingen server: fortsätt som vanligt
  let skip=false;try{skip=sessionStorage.getItem('sk-skip')==='1';}catch(e){}
  if(!me){if(!skip)location.href='/login.html';return;}
  let SRV={};
  try{const r=await fetch('/api/ritningar');if(!r.ok)throw 0;SRV=await r.json();}catch(e){pMsg('Kunde inte hämta sparade ritningar från servern.');return;}
  const url=n=>'/api/ritningar/'+encodeURIComponent(n);
  pAll=()=>Object.assign({},SRV);
  pPut=o=>{
    const old=SRV;SRV=o;
    for(const n of Object.keys(o))if(JSON.stringify(o[n])!==JSON.stringify(old[n]))
      fetch(url(n),{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(o[n])}).then(r=>{if(!r.ok)pMsg('Servern kunde inte spara ”'+n+'”.');}).catch(()=>pMsg('Servern svarar inte. ”'+n+'” sparades inte.'));
    for(const n of Object.keys(old))if(!(n in o))fetch(url(n),{method:'DELETE'}).catch(()=>pMsg('Servern svarar inte. ”'+n+'” togs inte bort.'));
    return true;
  };
  const bar=document.createElement('div');bar.className='note';bar.style.cssText='display:flex;gap:8px;align-items:center;justify-content:space-between;margin:0 0 8px';
  bar.innerHTML='<span>Inloggad som <b></b>'+(adm?' (admin)':'')+'. Ritningar sparas på servern.'+(adm?' Andras ritningar visas som <i>namn/ritning</i>.':'')+'</span><span>'+(adm?'<a href="/admin.html">Admin</a> ':'')+'<button type="button">Logga ut</button></span>';
  bar.querySelector('b').textContent=me;
  bar.querySelector('button').onclick=async()=>{try{await fetch('/api/logout',{method:'POST'});}catch(e){}try{sessionStorage.removeItem('sk-skip');}catch(e){}location.href='/login.html';};
  const first=$('pjName').closest('label');first.parentNode.insertBefore(bar,first);
  pList();
})();
