/* ---------- Inloggning och sparade ritningar på servern ---------- */
(async function(){
  let me,adm=false;
  try{
    if((await (await fetch('/api/ping')).text())!=='ok')return;
    const j0=await (await fetch('/api/me')).json();me=j0.user;adm=!!j0.admin;
  }catch(e){return;}                       // ingen server: fortsätt som vanligt
  let skip=false;try{skip=sessionStorage.getItem('sk-skip')==='1';}catch(e){}
  if(!me){if(!skip)location.href='/login.html';else topBar(null,false);return;}
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
  const first=$('pjName').closest('label');
  const note=document.createElement('div');note.className='note';note.style.margin='0 0 8px';
  note.textContent='Ritningar sparas på servern.'+(adm?' Andras ritningar visas som namn/ritning.':'');
  first.parentNode.insertBefore(note,first);
  topBar(me,adm);
  pList();
})();

function topBar(me,adm){
  const b=document.createElement('div');
  b.style.cssText='position:sticky;top:0;z-index:1000;display:flex;justify-content:flex-end;align-items:center;gap:10px;padding:6px 14px;background:var(--surface);border-bottom:1px solid var(--line);font-size:14px';
  const t=document.createElement('span');t.style.marginRight='auto';
  t.textContent=me?'Inloggad som '+me+(adm?' (admin)':''):'Inte inloggad – ritningar sparas bara i den här webbläsaren';
  b.appendChild(t);
  if(adm){const a=document.createElement('a');a.href='/admin.html';a.textContent='Admin';b.appendChild(a);}
  const btn=document.createElement('button');btn.type='button';btn.style.padding='5px 12px';
  btn.textContent=me?'Logga ut':'Logga in';
  btn.onclick=async()=>{
    if(me){try{await fetch('/api/logout',{method:'POST'});}catch(e){}}
    try{sessionStorage.removeItem('sk-skip');}catch(e){}
    location.href='/login.html';
  };
  b.appendChild(btn);document.body.insertBefore(b,document.body.firstChild);
}
