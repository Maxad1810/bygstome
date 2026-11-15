/* ---------- Live-priser (kräver server.js) ---------- */
/* Gemensam prismappning: vilken sökning, vilken träff som duger och hur priset räknas om till radens enhet. */
const mnum=s=>parseFloat(String(s).replace(',','.'));
function lenOfName(n){
  let m=n.match(/(\d{3,5})\s*mm/i);if(m&&+m[1]>=1000)return +m[1]/1000;
  m=n.match(/(\d+(?:[.,]\d+)?)\s*m\b/i);if(m){const v=mnum(m[1]);if(v>=1&&v<=8)return v;}
  return 0;
}
function areaOfName(n){
  let m=n.match(/(\d+(?:[.,]\d+)?)\s*m²/i);if(m){const v=mnum(m[1]);if(v>0&&v<=300)return v;}
  m=n.match(/(\d{3,4})\s*[x×]\s*(\d{3,4})\s*mm/i);if(m)return m[1]*m[2]/1e6;
  m=n.match(/(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*m\b/i);if(m){const a=mnum(m[1])*mnum(m[2]);if(a>0&&a<=300)return a;}
  return 0;
}
const perM=p=>{if(p.unit==='m')return p.price;const L=lenOfName(p.name);return L&&(p.unit==='st'||!p.unit)?p.price/L:null;};
const perM2=p=>{if(p.unit==='m²')return p.price;if(p.unit&&!['st','pkt','rulle','förp'].includes(p.unit))return null;const A=areaOfName(p.name);return A?p.price/A:null;};
const cheapest=(ps,f)=>{const v=ps.map(f).filter(x=>x!=null&&isFinite(x)&&x>0);return v.length?Math.min(...v):null;};
function liveSpec(r){
  const n=r.name;let m;
  if((r.mode==='lm'||r.mode==='m')&&(m=n.match(/\d+x\d+/))){
    const [a,b]=m[0].split('x'),re=new RegExp('(^|\\D)('+a+'\\s*[x×]\\s*'+b+'|'+b+'\\s*[x×]\\s*'+a+')(\\D|$)','i');
    return {q:bmQ(n),must:a+'\\s*[x×]\\s*'+b+'|'+b+'\\s*[x×]\\s*'+a,enhet:'m',price:ps=>cheapest(ps.filter(p=>re.test(p.name)),perM)};
  }
  if(m=n.match(/^Fasadpanel (\d+)×(\d+)/)){
    const [a,b]=[m[1],m[2]],re=new RegExp('(^|\\D)'+a+'\\s*[x×]\\s*'+b+'(\\D|$)','i');
    return {q:'fasadpanel '+a+'x'+b,must:a+'\\s*[x×]\\s*'+b,enhet:'m',price:ps=>cheapest(ps.filter(p=>re.test(p.name)),perM)};
  }
  if(m=n.match(/^Isolering (\d+) mm/)){
    const re=new RegExp('(^|\\D)'+m[1]+'\\s*mm','i');
    return {q:'isolering '+m[1]+' mm',must:m[1]+'\\s*mm',price:ps=>cheapest(ps.filter(p=>re.test(p.name)),perM2)};
  }
  if(/^Ångspärr/.test(n))return {q:'ångspärr plastfolie',must:'ångspärr|plastfolie',price:ps=>cheapest(ps,perM2)};
  if(/^Vindskydd under/.test(n))return {q:'vindpapp',must:'vindpapp|vindskydd',price:ps=>cheapest(ps,perM2)};
  if(m=n.match(/^(Golvskiva|Vindskyddsskiva|Gipsskiva) (\d+) mm/)){
    const d=String(r.note).match(/(\d+)×(\d+)/),A=d?d[1]*d[2]/1e6:0;if(!A)return null;
    const q={Golvskiva:'golvskiva spont ',Vindskyddsskiva:'vindskyddsskiva ',Gipsskiva:'gipsskiva '}[m[1]]+m[2]+' mm',re=new RegExp('(^|\\D)'+m[2]+'\\s*mm','i');
    return {q,must:m[2]+'\\s*mm',price:ps=>{const v=cheapest(ps.filter(p=>re.test(p.name)),perM2);return v==null?null:v*A;}};
  }
  if(/^Underlagspapp/.test(n)){
    const a=String(r.note).match(/à\s*(\d+)\s*m²/),A=a?+a[1]:15;
    return {q:'takpapp',must:'takpapp|underlagspapp',price:ps=>{const v=cheapest(ps,perM2);return v==null?null:v*A;}};
  }
  if(/^Takplåt$/.test(n))return {q:'takplåt',must:'takplåt|plåt',price:ps=>cheapest(ps,perM2)};
  return null;
}
const specKey=sp=>sp.q+'|'+sp.must+'|'+(sp.enhet||'');
const ownP=(r,st)=>typeof ownPrice==='function'?ownPrice(r,st):null;
const guardOk=(r,p)=>{const ru=RULES.find(x=>x[0].test(r.name));if(!ru)return true;const d=ru[2](r.name);return !d||(p/d>0.2&&p/d<5);};   // avvisa uppenbara feltolkningar
async function fetchPris(sp,butik){
  const r=await fetch('/api/pris?q='+encodeURIComponent(sp.q)+'&butik='+encodeURIComponent(butik)+'&must='+encodeURIComponent(sp.must||'')+(sp.enhet?'&enhet='+sp.enhet:''));
  const j=await r.json();if(!r.ok)throw new Error(j.fel||('Fel '+r.status));return j.produkter||[];
}
async function histLog(items){if(!items.length)return;try{await fetch('/api/prishistorik',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(items)});}catch(e){}}

(function(){
  const box=document.createElement('div');box.className='note';box.id='liveBox';box.hidden=true;
  box.innerHTML='<button id="liveBtn" type="button">Hämta live-priser från Byggmax</button> <span id="liveMsg"></span><div id="prisBanner" hidden></div>';
  const tbl=$('res').closest('.scroll');tbl.parentNode.insertBefore(box,tbl);
  const msg=t=>{$('liveMsg').textContent=t;};
  let busy=false;
  const MEMO={};
  async function run(){
    if(busy)return;busy=true;$('liveBtn').disabled=true;msg('Hämtar … (det kan ta några minuter)');for(const k in MEMO)delete MEMO[k];
    let ok=0,miss=0,own=0,err='';const log=[];
    for(const [i,r] of ROWS.entries()){
      const sp=liveSpec(r);if(!sp)continue;
      if(ownP(r,'Byggmax')!=null){own++;continue;}
      try{
        const k=specKey(sp);if(!(k in MEMO))MEMO[k]=await fetchPris(sp,'Byggmax');
        let p=sp.price(MEMO[k]);
        if(p!=null&&guardOk(r,p)){p=Math.round(p*100)/100;r.p=p;PRICE_OV[r.key]=p;const inp=document.querySelector('input.pr[data-r="'+i+'"]');if(inp)inp.value=p;ok++;log.push({butik:'Byggmax',namn:r.name,pris:p});}
        else miss++;
      }catch(e){err=e.message;break;}
    }
    totals();try{renderCats();}catch(e){}
    await histLog(log);
    $('liveBtn').disabled=false;busy=false;
    msg(err?'Fel: '+err:'Uppdaterade '+ok+' priser kl. '+new Date().toLocaleTimeString('sv-SE',{hour:'2-digit',minute:'2-digit'})+(miss?' ('+miss+' rader hittades inte, riktpris kvar)':'')+(own?' ('+own+' rader med eget pris hoppades över)':'')+'. Övriga rader har riktpriser.');
    if(typeof showPriceDelta==='function')showPriceDelta();
  }
  $('liveBtn').onclick=run;
  fetch('/api/ping').then(r=>r.text()).then(t=>{
    if(t!=='ok')return;box.hidden=false;
    setInterval(()=>{if(!document.hidden)run();},3600000);
  }).catch(()=>{});
})();
