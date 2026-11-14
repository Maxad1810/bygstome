/* ---------- Live-priser från Byggmax (kräver server.js) ---------- */
(function(){
  const box=document.createElement('div');box.className='note';box.id='liveBox';box.hidden=true;
  box.innerHTML='<button id="liveBtn" type="button">Hämta live-priser från Byggmax</button> <span id="liveMsg"></span>';
  const tbl=$('res').closest('.scroll');tbl.parentNode.insertBefore(box,tbl);
  const msg=t=>{$('liveMsg').textContent=t;};
  let busy=false;
  const lenOf=n=>{
    let m=n.match(/(\d{3,5})\s*mm/i);if(m&&+m[1]>=1000)return +m[1]/1000;
    m=n.match(/(\d+(?:[.,]\d+)?)\s*m\b/i);if(m&&+m[1]>=1&&+m[1]<=8)return parseFloat(m[1].replace(',','.'));
    m=n.match(/x\d+\s*[x×]\s*(\d{3,5})/i);if(m&&+m[1]>=1000)return +m[1]/1000;
    return 0;
  };
  const dimOf=n=>(n.match(/(\d+)\s*[x×]\s*(\d+)/)||[]);
  async function one(r){
    if(r.mode!=='lm'&&r.mode!=='m')return null;
    const dim=(r.name.match(/\d+x\d+/)||[''])[0];if(!dim)return null;
    const j=await (await fetch('/api/pris?q='+encodeURIComponent(bmQ(r.name)))).json();
    if(j.fel)throw new Error(j.fel);
    const [a,b]=dim.split('x'),best=(j.produkter||[]).map(p=>{
      const d=dimOf(p.name),L=lenOf(p.name);
      const ok=d.length&&((d[1]===a&&d[2]===b)||(d[1]===b&&d[2]===a));
      return ok&&L?{kr:p.price/L,p}:null;
    }).filter(Boolean).sort((x,y)=>x.kr-y.kr)[0];
    return best?Math.round(best.kr*100)/100:null;
  }
  async function run(){
    if(busy)return;busy=true;$('liveBtn').disabled=true;msg('Hämtar …');
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
