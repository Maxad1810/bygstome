/* ---------- Alternativ, inköp per butik och offert ---------- */
let ALTS=[],SHOP={},OFFER={},BASE=null,PBOOK={},PBREMOTE=null;
const CMP={html:'',apply:false,best:{}},CSTORES=['Byggmax','Beijer','XL-BYGG Kiruna'];
const STORES=['Byggmax','Beijer','XL-BYGG Kiruna','Bauhaus','Optimera','Hornbach','Annan'];
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* spara alternativ, butiker och offertuppgifter tillsammans med ritningen */
(function(){
  const s0=snap,r0=restore,rr0=renderRes;
  snap=function(){const s=s0();s.alts=ALTS;s.shop=SHOP;s.offer=OFFER;s.base=BASE;return JSON.parse(JSON.stringify(s));};
  restore=function(s){ALTS=(s&&s.alts)||[];SHOP=(s&&s.shop)||{};OFFER=(s&&s.offer)||{};BASE=(s&&s.base)||null;r0(s);offerFill();};
  renderRes=function(sec){rr0(sec);try{markOwn();renderShop();renderAlts();renderPB();}catch(e){console.error(e);}};
})();

/* ===== Jämför alternativ ===== */
function secTotals(){const t={};ROWS.forEach(r=>{t[r.sec]=(t[r.sec]||0)+rowCost(r);});const tot=Object.values(t).reduce((a,b)=>a+b,0);return {sec:t,tot};}
function renderAlts(){
  const box=$('altBox');if(!box)return;
  const cur=secTotals(),cols=[{n:'Nu',t:cur}].concat(ALTS.map(a=>({n:a.name,t:a.tot})));
  const secs=[];cols.forEach(c=>Object.keys(c.t.sec).forEach(k=>{if(!secs.includes(k))secs.push(k);}));
  let h='<div class="tools" style="margin:6px 0"><input id="altName" maxlength="30" placeholder="Namn, t.ex. Med altan" style="width:auto;flex:1;min-width:130px"><button id="altSave" type="button" class="primary">Spara nuvarande som alternativ</button></div>';
  if(!ALTS.length)h+='<p class="note">Ändra ritningen, tryck på knappen och ändra igen. Då ser du här vad skillnaden kostar. Alternativen sparas tillsammans med ritningen när du trycker Spara.</p>';
  else{
    h+='<div class="scroll"><table><thead><tr><th>Del</th>'+cols.map((c,i)=>'<th style="text-align:right">'+esc(c.n)+(i?' <button type="button" class="altOpen" data-i="'+(i-1)+'" style="padding:2px 6px;font-size:12px">Öppna</button><button type="button" class="altDel" data-i="'+(i-1)+'" style="padding:2px 6px;font-size:12px" aria-label="Ta bort alternativ">×</button>':'')+'</th>').join('')+'</tr></thead><tbody>';
    secs.forEach(k=>{h+='<tr><td>'+esc(k)+'</td>'+cols.map(c=>'<td class="n">'+nf(c.t.sec[k]||0)+'</td>').join('')+'</tr>';});
    h+='<tr class="sec"><td>Totalt (kr)</td>'+cols.map(c=>'<td class="n">'+nf(c.t.tot)+'</td>').join('')+'</tr>';
    h+='<tr><td>Skillnad mot nu</td><td class="n">–</td>'+cols.slice(1).map(c=>{const d=c.t.tot-cur.tot;return '<td class="n" style="color:'+(d>0?'#b3261e':d<0?'#1b7a3a':'inherit')+'">'+(d>0?'+':'')+nf(d)+'</td>';}).join('')+'</tr></tbody></table></div>';
  }
  box.innerHTML=h;
  $('altSave').onclick=()=>{
    if(ALTS.length>=4){pMsg('Max 4 alternativ. Ta bort något först.');return;}
    const n=($('altName').value.trim()||'Alternativ '+(ALTS.length+1)).slice(0,30),s=snap();delete s.alts;
    ALTS.push({name:n,snap:s,tot:secTotals()});renderAlts();pMsg('Sparade alternativet ”'+n+'”. Tryck Spara för att behålla det med ritningen.');
  };
  box.querySelectorAll('.altOpen').forEach(b=>b.onclick=()=>{const a=ALTS[+b.dataset.i],keep=ALTS;const s=JSON.parse(JSON.stringify(a.snap));s.alts=keep;s.shop=SHOP;s.offer=OFFER;s.base=BASE;restore(s);pMsg('Öppnade alternativet ”'+a.name+'”.');});
  box.querySelectorAll('.altDel').forEach(b=>b.onclick=()=>{ALTS.splice(+b.dataset.i,1);renderAlts();});
}

/* ===== Inköp per butik ===== */
function renderShop(){
  const box=$('shopBox');if(!box)return;
  const def=SHOP._def||'Byggmax',by={};
  ROWS.forEach((r,i)=>{const s=(SHOP[r.key]&&SHOP[r.key].s)||def;(by[s]=by[s]||[]).push({r,i});});
  let h='<label style="display:block;margin:6px 0">Standardbutik<select id="shopDef">'+STORES.map(s=>'<option'+(s===def?' selected':'')+'>'+s+'</option>').join('')+'</select></label>';
  Object.keys(by).sort().forEach(st=>{
    const rows=by[st],sum=rows.reduce((a,x)=>a+rowCost(x.r),0),left=rows.filter(x=>!(SHOP[x.r.key]&&SHOP[x.r.key].c)).reduce((a,x)=>a+rowCost(x.r),0),done=rows.filter(x=>SHOP[x.r.key]&&SHOP[x.r.key].c).length;
    h+='<div class="catg"><div class="catn"><b>'+esc(st)+'</b><span>'+done+'/'+rows.length+' klara · kvar '+nf(left)+' av '+nf(sum)+' kr</span></div>';
    rows.forEach(x=>{
      const c=SHOP[x.r.key]&&SHOP[x.r.key].c;
      h+='<div class="catr" style="grid-template-columns:auto 1fr auto auto"><input type="checkbox" class="shopC" data-k="'+esc(x.r.key)+'"'+(c?' checked':'')+' style="width:auto;margin:0" aria-label="Klar: '+esc(x.r.name)+'"><span style="'+(c?'text-decoration:line-through;opacity:.6':'')+'">'+esc(x.r.name)+' <small>'+esc(x.r.qty)+'</small></span><span>'+(x.r.mode?nf(rowCost(x.r))+' kr':'')+'</span><select class="shopS" data-k="'+esc(x.r.key)+'" style="width:auto;margin:0;padding:3px" aria-label="Butik för '+esc(x.r.name)+'">'+STORES.map(s=>'<option'+(s===st?' selected':'')+'>'+s+'</option>').join('')+'</select></div>';
    });
    h+='</div>';
  });
  h+='<div class="tools" style="margin:10px 0"><button type="button" id="cmpBtn">Jämför priser mellan butiker</button><span id="cmpMsg" class="note"></span></div><div id="cmpOut">'+(CMP.html||'')+'</div>';
  h+='<p class="note">Kryssa av medan du handlar. Avprickningen och butiksvalen sparas med ritningen när du trycker Spara.</p>';
  box.innerHTML=h;
  $('cmpBtn').onclick=cmpRun;if(CMP.apply)$('cmpApply').onclick=cmpApply;
  $('shopDef').onchange=e=>{SHOP._def=e.target.value;calc();};
  box.querySelectorAll('.shopC').forEach(c=>c.onchange=()=>{(SHOP[c.dataset.k]=SHOP[c.dataset.k]||{}).c=c.checked;renderShop();});
  box.querySelectorAll('.shopS').forEach(c=>c.onchange=()=>{(SHOP[c.dataset.k]=SHOP[c.dataset.k]||{}).s=c.value;calc();});
}

/* ===== Offert ===== */
const OF=['ofFirma','ofKund','ofProj','ofArbete','ofPaslag','ofDagar','ofNot'];
function offerFill(){OF.forEach(id=>{const e=$(id);if(e)e.value=OFFER[id]!=null?OFFER[id]:(id==='ofDagar'?'30':'');});if($('ofProj')&&!$('ofProj').value)$('ofProj').value=($('pjName').value||'').trim();}
function offerRead(){OF.forEach(id=>{const e=$(id);if(e)OFFER[id]=e.value;});}
function logoGet(){try{return localStorage.getItem('sk-logo')||'';}catch(e){return '';}}
function offerUi(){
  const d=document.createElement('details');d.className='dd';
  d.innerHTML='<summary>Offert (PDF till kund)</summary><div id="ofBox"><div class="grid2" style="display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">'
   +'<label>Ditt namn / företag<input id="ofFirma" maxlength="60"></label><label>Kund<input id="ofKund" maxlength="60"></label>'
   +'<label>Projekt<input id="ofProj" maxlength="60"></label><label>Arbetskostnad (kr inkl. moms)<input id="ofArbete" type="number" min="0" step="any"></label>'
   +'<label>Påslag på material (%)<input id="ofPaslag" type="number" min="0" step="any"></label><label>Giltig i (dagar)<input id="ofDagar" type="number" min="1" step="1"></label></div>'
   +'<label style="display:block;margin-top:8px">Anteckning på offerten<textarea id="ofNot" rows="2" maxlength="400" style="width:100%;margin-top:3px;padding:8px;font:inherit;color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:4px"></textarea></label>'
   +'<div class="tools" style="margin:8px 0"><label style="margin:0">Logga (valfri)<input id="ofLogo" type="file" accept="image/png,image/jpeg"></label><button type="button" id="ofLogoDel">Ta bort logga</button></div>'
   +'<div class="tools"><button class="primary" type="button" id="ofPdf">Skapa offert-PDF</button></div><div id="ofMsg" class="note" role="status"></div></div>';
  $('catBox').closest('details').after(d);
  offerFill();
  OF.forEach(id=>$(id).addEventListener('input',offerRead));
  $('ofLogo').onchange=()=>{
    const f=$('ofLogo').files[0];if(!f)return;const im=new Image(),u=URL.createObjectURL(f);
    im.onload=()=>{const k=Math.min(1,400/im.width),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);
      c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);
      try{localStorage.setItem('sk-logo',c.toDataURL('image/png'));$('ofMsg').textContent='Loggan är sparad i den här webbläsaren.';}catch(e){$('ofMsg').textContent='Kunde inte spara loggan.';}};
    im.onerror=()=>{$('ofMsg').textContent='Bilden kunde inte läsas.';};im.src=u;
  };
  $('ofLogoDel').onclick=()=>{try{localStorage.removeItem('sk-logo');}catch(e){}$('ofMsg').textContent='Loggan är borttagen.';};
  $('ofPdf').onclick=()=>{$('ofMsg').textContent='Skapar offert …';setTimeout(()=>offerPdf().catch(e=>{$('ofMsg').textContent='Kunde inte skapa offerten: '+(e&&e.message||e);}),30);};
}
function logoDims(u){return new Promise(ok=>{if(!u)return ok(null);const im=new Image();im.onload=()=>ok({w:im.width,h:im.height});im.onerror=()=>ok(null);im.src=u;});}
async function offerPdf(){
  offerRead();
  const JS=window.jspdf&&window.jspdf.jsPDF;if(!JS)throw new Error('PDF-biblioteket saknas');
  const doc=new JS({unit:'mm',format:'a4'}),PW=210,PH=297,M=16,R=PW-M,S=pdfSan;
  const mat=ROWS.reduce((a,r)=>a+rowCost(r),0),pm=parseFloat(OFFER.ofPaslag)||0,ar=parseFloat(OFFER.ofArbete)||0;
  const matP=mat*pm/100,tot=mat+matP+ar,mom=tot*0.2,datum=new Date(),dagar=parseInt(OFFER.ofDagar)||30,till=new Date(+datum+dagar*864e5);
  const fd=d=>d.toLocaleDateString('sv-SE');
  let y=M;
  const logo=logoGet(),ld=await logoDims(logo);
  if(ld){const h=Math.min(18,40*ld.h/ld.w),w=h*ld.w/ld.h;try{doc.addImage(logo,'PNG',M,y,w,h);}catch(e){}}
  doc.setFont('helvetica','bold');doc.setFontSize(22);doc.setTextColor(30);doc.text('OFFERT',R,y+7,{align:'right'});
  doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(90);doc.text(S('Datum '+fd(datum)),R,y+13,{align:'right'});doc.text(S('Giltig till '+fd(till)),R,y+18,{align:'right'});
  y+=26;doc.setDrawColor(190);doc.line(M,y,R,y);y+=7;
  doc.setTextColor(30);doc.setFontSize(10);
  const blk=(t,v,x)=>{doc.setFont('helvetica','bold');doc.text(t,x,y);doc.setFont('helvetica','normal');doc.text(S(v||'-'),x,y+5);};
  blk('Från',OFFER.ofFirma,M);blk('Kund',OFFER.ofKund,M+62);blk('Projekt',OFFER.ofProj||($('pjName').value||'').trim(),M+124);y+=14;
  const colQ=R-52,colS=R;
  const head=()=>{doc.setFillColor(238,240,238);doc.rect(M,y-4.5,R-M,7,'F');doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(30);doc.text('Material',M+2,y);doc.text('Mängd',colQ,y,{align:'right'});doc.text('Summa kr',colS-2,y,{align:'right'});y+=7;};
  head();
  let cur=-1;
  ROWS.forEach(r=>{
    if(y>PH-46){doc.addPage();y=M+6;head();}
    if(r.si!==cur){cur=r.si;doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(30);doc.text(S(r.sec),M+2,y);
      const ss=ROWS.filter(x=>x.si===cur).reduce((a,x)=>a+rowCost(x),0);doc.text(S(nf(ss)),colS-2,y,{align:'right'});y+=5;}
    doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(60);
    doc.text(S(String(r.name).slice(0,70)),M+6,y);doc.text(S(String(r.qty)),colQ,y,{align:'right'});doc.text(r.mode?S(nf(rowCost(r))):'',colS-2,y,{align:'right'});y+=4.4;
  });
  y+=4;if(y>PH-60){doc.addPage();y=M+6;}
  doc.setDrawColor(150);doc.line(R-90,y-3,R,y-3);doc.setFontSize(10);doc.setTextColor(30);
  const ln=(t,v,b)=>{doc.setFont('helvetica',b?'bold':'normal');doc.setFontSize(b?12:10);doc.text(S(t),R-90,y);doc.text(S(v),R-2,y,{align:'right'});y+=b?7:5.5;};
  ln('Material',nf(mat)+' kr');if(pm)ln('Paslag material '+nf(pm,1)+' %',nf(matP)+' kr');if(ar)ln('Arbete',nf(ar)+' kr');
  doc.line(R-90,y-3.5,R,y-3.5);ln('Totalt inkl. moms',nf(tot)+' kr',true);
  doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(90);doc.text(S('varav moms (25 %) ca '+nf(mom)+' kr'),R-2,y-1,{align:'right'});y+=7;
  if(OFFER.ofNot&&OFFER.ofNot.trim()){doc.setTextColor(30);doc.setFontSize(10);doc.setFont('helvetica','bold');doc.text('Anteckning',M,y);y+=5;doc.setFont('helvetica','normal');doc.text(doc.splitTextToSize(S(OFFER.ofNot),R-M),M,y);y+=12;}
  doc.setFontSize(8);doc.setTextColor(120);doc.text(doc.splitTextToSize(S('Materialpriserna ar riktpriser och kan andras. Mangder ar ungefarliga och ska kontrolleras mot ritningar. Offerten galler till '+fd(till)+'.'),R-M),M,PH-14);
  const nm=((OFFER.ofProj||$('pjName').value||'offert').replace(/[^\wåäöÅÄÖ\- ]+/g,'').trim().replace(/\s+/g,'-')||'offert'),fn=nm+'-offert.pdf',buf=doc.output('arraybuffer');
  let dl=null;try{if(window.claude&&claude.use)dl=await claude.use('downloads');}catch(e){}
  if(dl){try{await dl.save({filename:fn,data:new Blob([buf],{type:'application/pdf'})});$('ofMsg').textContent='Offerten är klar: '+fn;}catch(e){$('ofMsg').textContent='Sparandet avbröts.';}return;}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([buf],{type:'application/pdf'}));a.download=fn;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},800);$('ofMsg').textContent='Offerten skapades: '+fn;
}

(function(){
  const mk=(id,title)=>{const d=document.createElement('details');d.className='dd';d.innerHTML='<summary>'+title+'</summary><div id="'+id+'"></div>';return d;};
  const anchor=$('catBox').closest('details'),a=mk('altBox','Jämför alternativ'),s=mk('shopBox','Inköpslista per butik (kryssa av)');
  anchor.after(s);anchor.after(a);   // ordning: kategori, alternativ, butik, offert
  offerUi();renderAlts();renderShop();
})();

/* ===== Jämför priser mellan butiker ===== */
async function cmpRun(){
  const rows=ROWS.map(r=>({r,sp:liveSpec(r)})).filter(x=>x.sp);
  const specs=new Map();rows.forEach(x=>specs.set(specKey(x.sp),x.sp));
  const tot=specs.size*CSTORES.length;let n=0;const out={};$('cmpBtn').disabled=true;
  try{
    for(const [k,sp] of specs)for(const st of CSTORES){
      $('cmpMsg').textContent=' Hämtar '+(++n)+' av '+tot+' … (kan ta flera minuter)';
      try{(out[k]=out[k]||{})[st]=await fetchPris(sp,st);}
      catch(e){if(/Inte inloggad|Playwright|Failed to fetch/.test(e.message))throw e;(out[k]=out[k]||{})[st]=[];}
    }
  }catch(e){$('cmpMsg').textContent=' '+e.message+(/Failed to fetch/.test(e.message)?' Servern behövs för jämförelsen.':'');$('cmpBtn').disabled=false;return;}
  const best={},log=[],sum={};CSTORES.forEach(s=>sum[s]=0);let cheap=0,covered=0;
  let h='<div class="scroll"><table><thead><tr><th>Material</th>'+CSTORES.map(s=>'<th style="text-align:right">'+s+'</th>').join('')+'</tr></thead><tbody>';
  const mult=r=>r.q*((r.mode==='lm'||r.mode==='plat')?r.len:1);
  rows.forEach(({r,sp})=>{
    const pr={},own={};
    CSTORES.forEach(s=>{
      const o=ownPrice(r,s);
      if(o!=null){pr[s]=o;own[s]=1;return;}
      const v=sp.price(((out[specKey(sp)]||{})[s])||[]);
      if(v!=null&&guardOk(r,v)){pr[s]=Math.round(v*100)/100;log.push({butik:s,namn:r.name,pris:pr[s],status:'live'});}
      else log.push({butik:s,namn:r.name,status:'saknas'});
    });
    const vals=Object.entries(pr);if(!vals.length)return;
    const mn=vals.reduce((x,y)=>y[1]<x[1]?y:x);
    best[r.key]={s:mn[0],p:mn[1]};
    h+='<tr><td>'+esc(r.name)+'</td>'+CSTORES.map(s=>'<td class="n"'+(s===mn[0]?' style="font-weight:700;color:#1b7a3a"':'')+'>'+(pr[s]!=null?nf(pr[s],2)+(own[s]?' ★':''):'–')+'</td>').join('')+'</tr>';
    covered++;cheap+=mn[1]*mult(r);CSTORES.forEach(s=>{sum[s]+=(pr[s]!=null?pr[s]:r.p)*mult(r);});
  });
  histLog(log);
  if(!covered){CMP.html='<p class="note">Hittade inga jämförbara priser. Kontrollera att servern är igång och försök igen.</p>';CMP.apply=false;}
  else{
    h+='<tr class="sec"><td>Kostnad för dessa rader om allt köps hos</td>'+CSTORES.map(s=>'<td class="n">'+nf(sum[s])+'</td>').join('')+'</tr></tbody></table></div>';
    h+='<p class="note">Pris i radens enhet (kr/m, kr/m², kr/st eller kr/rulle). Grönt är billigast, ★ är ditt egna pris. Rader som en butik saknar räknas med radens nuvarande pris. Köper du varje rad där den är billigast kostar dessa '+covered+' rader <b>'+nf(cheap)+' kr</b>.</p><div class="tools"><button type="button" class="primary" id="cmpApply">Välj billigaste butik och pris per rad</button></div>';
    CMP.html=h;CMP.apply=true;CMP.best=best;
  }
  renderShop();
}
function cmpApply(){
  Object.entries(CMP.best).forEach(([k,v])=>{(SHOP[k]=SHOP[k]||{}).s=v.s;const r=ROWS.find(x=>x.key===k);if(r&&ownPrice(r,v.s)!=null)delete PRICE_OV[k];else PRICE_OV[k]=v.p;});
  calc();pMsg('Valde billigaste butik och pris för '+Object.keys(CMP.best).length+' rader.');
}


/* ===== Egna priser per butik (prisbok) ===== */
const rowStore=r=>(SHOP[r.key]&&SHOP[r.key].s)||SHOP._def||'Byggmax';
function ownPrice(r,st){const b=PBOOK[st||rowStore(r)];return b&&b[r.name]?b[r.name].p:null;}
priceFor=function(name,key,p){
  if(PRICE_OV[key]!=null)return PRICE_OV[key];
  const st=(SHOP[key]&&SHOP[key].s)||SHOP._def||'Byggmax',b=PBOOK[st];
  return b&&b[name]?b[name].p:p;
};
function pbLoad(){try{PBOOK=JSON.parse(localStorage.getItem('sk-pbook')||'{}')||{};}catch(e){PBOOK={};}}
function pbSave(){try{localStorage.setItem('sk-pbook',JSON.stringify(PBOOK));}catch(e){}if(PBREMOTE)PBREMOTE(PBOOK);}
function markOwn(){ROWS.forEach((r,i)=>{const inp=document.querySelector('input.pr[data-r="'+i+'"]');if(inp&&PRICE_OV[r.key]==null&&ownPrice(r)!=null){inp.classList.add('ownp');inp.title='Ditt eget pris hos '+rowStore(r);}});}
function renderPB(){
  const box=$('pbBox');if(!box)return;
  const rows=[];Object.keys(PBOOK).sort().forEach(st=>Object.keys(PBOOK[st]).sort().forEach(n=>rows.push([st,n,PBOOK[st][n]])));
  box.innerHTML=rows.length?'<div class="scroll"><table><thead><tr><th>Butik</th><th>Material</th><th style="text-align:right">Pris</th><th>Datum</th><th></th></tr></thead><tbody>'
    +rows.map((x,i)=>'<tr><td>'+esc(x[0])+'</td><td>'+esc(x[1])+'</td><td class="n">'+nf(x[2].p,2)+'</td><td>'+esc(x[2].d||'')+'</td><td><button type="button" class="pbDel" data-i="'+i+'" style="padding:2px 8px">×</button></td></tr>').join('')+'</tbody></table></div>'
    :'<p class="note">Inga egna priser än. Skriv in ett pris på en rad och tryck på ★ bredvid det, så kommer appen ihåg det för butiken som raden är kopplad till.</p>';
  box.insertAdjacentHTML('beforeend','<p class="note">Egna priser används före riktpriser och live-priser. Ändrar du priset direkt på en rad gäller det bara den ritningen.</p>');
  box.querySelectorAll('.pbDel').forEach(b=>b.onclick=()=>{const x=rows[+b.dataset.i];delete PBOOK[x[0]][x[1]];if(!Object.keys(PBOOK[x[0]]).length)delete PBOOK[x[0]];pbSave();calc();});
}
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('button.own');if(!b||!$('res').contains(b))return;
  const r=ROWS[+b.dataset.r];if(!r)return;const st=rowStore(r);
  (PBOOK[st]=PBOOK[st]||{})[r.name]={p:r.p,d:new Date().toISOString().slice(0,10)};
  delete PRICE_OV[r.key];pbSave();calc();pMsg('Kom ihåg: '+r.name+' kostar '+nf(r.p,2)+' hos '+st+'.');
});
pbLoad();

/* ===== Prisförändring sedan ritningen sparades ===== */
function priceBase(){const p={};ROWS.forEach(r=>{if(r.mode)p[r.name]=r.p;});return p;}
function deltaVsBase(){
  if(!BASE||!BASE.p)return null;let now=0,old=0;
  ROWS.forEach(r=>{if(!r.mode||BASE.p[r.name]==null)return;const m=r.q*((r.mode==='lm'||r.mode==='plat')?r.len:1);now+=r.p*m;old+=BASE.p[r.name]*m;});
  return old>0?{kr:now-old,pct:(now-old)/old*100,d:BASE.d}:null;
}
function showPriceDelta(){
  const b=$('prisBanner');if(!b)return;const d=deltaVsBase();
  if(!d||Math.abs(d.pct)<2){b.hidden=true;return;}
  b.hidden=false;b.textContent=(d.pct>0?'Kalkylen är ':'Kalkylen är ')+nf(Math.abs(d.pct),1)+' % '+(d.pct>0?'dyrare':'billigare')+' nu ('+(d.kr>0?'+':'')+nf(d.kr)+' kr) jämfört med när du sparade ritningen'+(d.d?' ('+d.d+')':'')+'.';
}
$('pjSave').addEventListener('click',()=>{BASE={p:priceBase(),d:new Date().toISOString().slice(0,10)};showPriceDelta();},true);   // körs före själva sparandet

/* ===== Prishistorik ===== */
async function histShow(){
  const out=$('histOut');out.textContent='Hämtar …';
  try{
    const j=await (await fetch('/api/prishistorik')).json();if(j.fel)throw new Error(j.fel);
    const ser=(j.serier||[]).filter(s=>s.punkter.length).map(s=>{const a=s.punkter,f=a[0],l=a[a.length-1];return {s,f,l,pct:(l[1]-f[1])/f[1]*100};}).sort((x,y)=>Math.abs(y.pct)-Math.abs(x.pct));
    if(!ser.length){out.innerHTML='<p class="note">Ingen historik än. Den sparas varje gång du hämtar live-priser eller jämför butiker.</p>';return;}
    const spark=a=>{if(a.length<2)return '';const v=a.map(x=>x[1]),mn=Math.min(...v),mx=Math.max(...v),w=70,h=18;
      return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" aria-hidden="true"><polyline fill="none" stroke="currentColor" stroke-width="1.5" points="'+v.map((y,i)=>(i/(v.length-1)*w).toFixed(1)+','+(mx===mn?h/2:(h-2-(y-mn)/(mx-mn)*(h-4))).toFixed(1)).join(' ')+'"/></svg>';};
    const d=t=>new Date(t).toLocaleDateString('sv-SE');
    out.innerHTML='<div class="scroll"><table><thead><tr><th>Material</th><th>Butik</th><th style="text-align:right">Först</th><th style="text-align:right">Senast</th><th style="text-align:right">Ändring</th><th></th></tr></thead><tbody>'
      +ser.map(x=>'<tr><td>'+esc(x.s.namn)+'</td><td>'+esc(x.s.butik)+'</td><td class="n">'+nf(x.f[1],2)+'<small>'+d(x.f[0])+'</small></td><td class="n">'+nf(x.l[1],2)+'<small>'+d(x.l[0])+'</small></td><td class="n" style="color:'+(x.pct>0.5?'#b3261e':x.pct<-0.5?'#1b7a3a':'inherit')+'">'+(x.pct>0?'+':'')+nf(x.pct,1)+' %</td><td>'+spark(x.s.punkter)+'</td></tr>').join('')+'</tbody></table></div>';
  }catch(e){out.textContent='Kunde inte hämta historiken: '+e.message+(/Failed to fetch/.test(e.message)?' (servern behövs)':'');}
}
(function(){
  const mk=(id,title,inner)=>{const d=document.createElement('details');d.className='dd';d.innerHTML='<summary>'+title+'</summary>'+inner;return d;};
  const a=mk('','Mina priser (per butik)','<div id="pbBox"></div>'),h=mk('','Prishistorik','<div class="tools" style="margin:6px 0"><button type="button" id="histBtn">Visa prishistorik</button></div><div id="histOut"></div>');
  $('catBox').closest('details').after(h);$('catBox').closest('details').after(a);
  h.id='histPanel';h.hidden=true;                  // visas bara för administratören (se konto.js)
  $('histBtn').onclick=histShow;renderPB();
})();
