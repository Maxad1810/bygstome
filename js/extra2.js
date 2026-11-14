/* ---------- Alternativ, inköp per butik och offert ---------- */
let ALTS=[],SHOP={},OFFER={};
const STORES=['Byggmax','Bauhaus','Beijer','Optimera','Hornbach','Annan'];
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* spara alternativ, butiker och offertuppgifter tillsammans med ritningen */
(function(){
  const s0=snap,r0=restore,rr0=renderRes;
  snap=function(){const s=s0();s.alts=ALTS;s.shop=SHOP;s.offer=OFFER;return JSON.parse(JSON.stringify(s));};
  restore=function(s){ALTS=(s&&s.alts)||[];SHOP=(s&&s.shop)||{};OFFER=(s&&s.offer)||{};r0(s);offerFill();};
  renderRes=function(sec){rr0(sec);try{renderShop();renderAlts();}catch(e){console.error(e);}};
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
  box.querySelectorAll('.altOpen').forEach(b=>b.onclick=()=>{const a=ALTS[+b.dataset.i],keep=ALTS;const s=JSON.parse(JSON.stringify(a.snap));s.alts=keep;s.shop=SHOP;s.offer=OFFER;restore(s);pMsg('Öppnade alternativet ”'+a.name+'”.');});
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
  h+='<p class="note">Kryssa av medan du handlar. Avprickningen och butiksvalen sparas med ritningen när du trycker Spara.</p>';
  box.innerHTML=h;
  $('shopDef').onchange=e=>{SHOP._def=e.target.value;renderShop();};
  box.querySelectorAll('.shopC').forEach(c=>c.onchange=()=>{(SHOP[c.dataset.k]=SHOP[c.dataset.k]||{}).c=c.checked;renderShop();});
  box.querySelectorAll('.shopS').forEach(c=>c.onchange=()=>{(SHOP[c.dataset.k]=SHOP[c.dataset.k]||{}).s=c.value;renderShop();});
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
