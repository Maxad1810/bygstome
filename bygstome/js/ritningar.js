/* ---------- Spara ritningar ---------- */
let DEF=null,delArm=null;
const PKEY='stomkalkyl-ritningar',pSel='.panel input[id]:not([id^=pj]),.panel select[id]:not([id^=pj])';
function snap(){
  const f={};document.querySelectorAll(pSel).forEach(el=>{f[el.id]=el.type==='checkbox'?el.checked:el.value;});
  return JSON.parse(JSON.stringify({f,ops,inst,uid,wings:WINGS,wsh:WSH,po:PRICE_OV,els:ELS}));
}
function restore(s0){
  const s=JSON.parse(JSON.stringify(s0));
  Object.entries(s.f||{}).forEach(([id,v])=>{const el=$(id);if(!el||id==='rd')return;if(el.type==='checkbox')el.checked=!!v;else el.value=v;});
  ops=s.ops||[];ELS=s.els||[];inst=s.inst||[];uid=s.uid||0;WINGS=s.wings||[];WSH=s.wsh||$('hs').value;PRICE_OV=s.po||{};
  sync();if(s.f&&s.f.rd)$('rd').value=s.f.rd;
  drawOps();drawEls();if(R3)R3.fresh=true;calc();peelUpdate();
}
function pAll(){try{return JSON.parse(localStorage.getItem(PKEY)||'{}')||{};}catch(e){return {};}}
function pPut(o){try{localStorage.setItem(PKEY,JSON.stringify(o));return true;}catch(e){return false;}}
function pMsg(t){$('pjMsg').textContent=t;}
function pList(sel){
  const names=Object.keys(pAll()).sort(),L=$('pjList');L.innerHTML='';
  const o0=document.createElement('option');o0.value='';o0.textContent='Sparade ritningar ('+names.length+')';L.appendChild(o0);
  names.forEach(n=>{const o=document.createElement('option');o.value=n;o.textContent=n;L.appendChild(o);});
  if(sel&&names.includes(sel))L.value=sel;
}
$('pjList').onchange=()=>{if($('pjList').value)$('pjName').value=$('pjList').value;};
$('pjSave').onclick=()=>{
  const n=$('pjName').value.trim();if(!n){pMsg('Skriv ett namn först.');return;}
  const all=pAll(),had=n in all;all[n]=snap();
  if(pPut(all)){pList(n);pMsg((had?'Uppdaterade ”':'Sparade ”')+n+'”.');}else pMsg('Det går inte att spara i den här webbläsaren.');
};
$('pjOpen').onclick=()=>{
  const n=$('pjList').value;if(!n){pMsg('Välj en sparad ritning.');return;}
  const s=pAll()[n];if(!s){pMsg('Hittar inte ritningen.');return;}
  $('pjName').value=n;restore(s);pMsg('Öppnade ”'+n+'”.');
};
$('pjDel').onclick=()=>{
  const n=$('pjList').value;if(!n){pMsg('Välj en ritning att ta bort.');return;}
  if(delArm!==n){delArm=n;$('pjDel').textContent='Klicka igen för att ta bort';setTimeout(()=>{delArm=null;$('pjDel').textContent='Ta bort';},4000);return;}
  const all=pAll();delete all[n];pPut(all);pList();delArm=null;$('pjDel').textContent='Ta bort';pMsg('Tog bort ”'+n+'”.');
};
$('pjNew').onclick=()=>{if(DEF){restore(DEF);$('pjName').value='';$('pjList').value='';pMsg('Ny ritning med grundvärden.');}};

/* ---------- Exportera / importera ritning som fil ---------- */
$('pjExp').onclick=()=>{
  const nm=$('pjName').value.trim();
  const fn=(nm||'ritning').replace(/[^\wåäöÅÄÖ\- ]+/g,'').trim().replace(/\s+/g,'-')||'ritning';
  const blob=new Blob([JSON.stringify({app:'stomkalkyl',v:1,name:nm,data:snap()})],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fn+'.json';
  document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
  pMsg('Exporterade '+fn+'.json');
};
$('pjImp').onclick=()=>$('pjFile').click();
$('pjFile').onchange=()=>{
  const f=$('pjFile').files[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const j=JSON.parse(r.result);
      if(!j||j.app!=='stomkalkyl'||!j.data||!j.data.f)throw new Error('ogiltig');
      restore(j.data);if(j.name)$('pjName').value=j.name;
      pMsg('Importerade '+f.name+'. Tryck Spara f\u00f6r att beh\u00e5lla den i listan.');
    }catch(e){pMsg('Filen \u00e4r ingen giltig ritning.');}
    $('pjFile').value='';
  };
  r.readAsText(f);
};
