/* ---------- Inloggning och sparade ritningar på servern ---------- */
(async function(){
  const SHT=new URLSearchParams(location.search).get('delad');
  if(SHT){                                     // skrivskyddad delad vy, ingen inloggning
    try{
      const r=await fetch('/api/delad/'+encodeURIComponent(SHT)),j=await r.json();
      if(!r.ok)throw new Error(j.fel||'Länken fungerar inte.');
      restore(j.data);$('pjName').value='';
      ['pjSave','pjNew','pjOpen','pjDel','pjImp'].forEach(id=>{const e=$(id);if(e)e.style.display='none';});
      const l=$('pjList');if(l&&l.closest('label'))l.closest('label').style.display='none';
      const nm=$('pjName');if(nm&&nm.closest('label'))nm.closest('label').style.display='none';
      pPut=()=>false;
      const b=document.createElement('div');b.style.cssText='position:sticky;top:0;z-index:1000;padding:8px 14px;background:var(--accent);color:var(--accent-ink);font-size:14px';
      b.textContent='Delad ritning: '+j.name+'. Du tittar på en skrivskyddad kopia, så dina ändringar sparas inte hos ägaren.';
      document.body.insertBefore(b,document.body.firstChild);
    }catch(e){document.body.insertBefore(Object.assign(document.createElement('div'),{textContent:e.message,style:'padding:12px;background:#b3261e;color:#fff'}),document.body.firstChild);}
    return;
  }
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
  try{                                          // egna priser följer kontot
    const r=await fetch('/api/priser');if(r.ok){const rem=await r.json();
      if(Object.keys(rem).length){PBOOK=rem;try{localStorage.setItem('sk-pbook',JSON.stringify(PBOOK));}catch(e){}}
      else if(Object.keys(PBOOK).length)fetch('/api/priser',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(PBOOK)});
      PBREMOTE=o=>fetch('/api/priser',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(o)}).catch(()=>{});
      calc();}
  }catch(e){}
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
  const sb=document.createElement('div');sb.className='tools';sb.style.margin='4px 0 8px';
  sb.innerHTML='<button type="button" id="pjShareLnk">Dela länk</button><button type="button" id="pjUnshare">Stoppa delning</button>';
  first.parentNode.insertBefore(note,first);first.parentNode.insertBefore(sb,first);
  const cur=()=>($('pjList').value||$('pjName').value||'').trim();
  $('pjShareLnk').onclick=async()=>{
    const n=cur();if(!n){pMsg('Välj eller skriv namnet på en sparad ritning.');return;}
    try{const r=await fetch('/api/dela',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:n})}),j=await r.json();
      if(!r.ok)throw new Error(j.fel||'Kunde inte dela.');
      const u=location.origin+'/?delad='+j.token;
      try{await navigator.clipboard.writeText(u);pMsg('Länk kopierad: '+u);}catch(e){pMsg('Länk: '+u);}
      const c=$('pjCode');if(c){c.style.display='block';c.value=u;}
    }catch(e){pMsg(e.message);}
  };
  $('pjUnshare').onclick=async()=>{
    const n=cur();if(!n){pMsg('Välj en ritning.');return;}
    try{const l=await (await fetch('/api/dela')).json();
      const own=n.includes('/')?n.split('/'):[me,n];
      const x=l.find(v=>v.owner===own[0]&&v.name===own.slice(1).join('/'));
      if(!x){pMsg('Ritningen delas inte.');return;}
      await fetch('/api/dela/'+x.token,{method:'DELETE'});pMsg('Delningen är stoppad. Länken fungerar inte längre.');
    }catch(e){pMsg('Kunde inte stoppa delningen.');}
  };
  topBar(me,adm);
  if(adm){const hp=$('histPanel');if(hp)hp.hidden=false;}
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
