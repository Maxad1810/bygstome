/* ---------- Live-priser från Byggmax (kräver server.js) ---------- */
(function(){
  const box=document.createElement('div');box.className='note';box.id='liveBox';box.hidden=true;
  box.innerHTML='<button id="liveBtn" type="button">Hämta live-priser från Byggmax</button> <span id="liveMsg"></span>';
  const tbl=$('res').closest('.scroll');tbl.parentNode.insertBefore(box,tbl);
  const msg=t=>{$('liveMsg').textContent=t;};
  let busy=false;
  const MEMO={};
  async function one(r){
    if(r.mode!=='lm'&&r.mode!=='m')return null;
    const dim=(r.name.match(/\d+x\d+/)||[''])[0];if(!dim)return null;
    const q=bmQ(r.name);
    if(!(q in MEMO))MEMO[q]=await (await fetch('/api/pris?q='+encodeURIComponent(q))).json();
    const j=MEMO[q];if(j.fel)throw new Error(j.fel);
    const [a,b]=dim.split('x'),re=new RegExp('(^|\\D)('+a+'\\s*[x×]\\s*'+b+'|'+b+'\\s*[x×]\\s*'+a+')(\\D|$)','i');
    const p=(j.produkter||[]).find(p=>p.unit==='m'&&re.test(p.name));
    return p?p.price:null;
  }
  async function run(){
    if(busy)return;busy=true;$('liveBtn').disabled=true;msg('Hämtar … (det kan ta någon minut)');for(const k in MEMO)delete MEMO[k];
    let ok=0,miss=0,err='';
    for(const [i,r] of ROWS.entries()){
      try{
        const p=await one(r);
        if(p){r.p=p;PRICE_OV[r.key]=p;const inp=document.querySelector('input.pr[data-r="'+i+'"]');if(inp)inp.value=p;ok++;}
        else if(r.mode==='lm'||r.mode==='m')miss++;
      }catch(e){err=e.message;break;}
    }
    totals();try{renderCats();}catch(e){}
    $('liveBtn').disabled=false;busy=false;
    msg(err?'Fel: '+err:'Uppdaterade '+ok+' priser kl. '+new Date().toLocaleTimeString('sv-SE',{hour:'2-digit',minute:'2-digit'})+(miss?' ('+miss+' rader hittades inte, riktpris kvar)':'')+'. Övriga rader har riktpriser.');
  }
  $('liveBtn').onclick=run;
  fetch('/api/ping').then(r=>r.text()).then(t=>{
    if(t!=='ok')return;box.hidden=false;
    setInterval(()=>{if(!document.hidden)run();},3600000);
  }).catch(()=>{});
})();
