/* ---------- Priser ---------- */
let PRICE_OV={},ROWS=[],TITLE='';
const LUM={45:17,70:26,95:31,120:40,145:52,170:60,195:66,220:77,225:160,315:230,405:300};
const INS={95:55,120:68,145:80,170:95,195:110,220:125};
const hOf=n=>{const m=n.match(/x(\d+)/);return m?+m[1]:145;};
const mmOf=n=>{const m=n.match(/(\d+) mm/);return m?+m[1]:145;};
const RULES=[
 [/^Takstolar /,'st',()=>1500],
 [/^(Limträsparrar|Limträ nockbalk)/,'lm',n=>LUM[hOf(n)]||230],
 [/^(Reglar|Syll och|Bärlinor|Fönsterbröstregel|Bjälkar|Randbjälkar|Däcksbjälkar|Randbjälke|Handledare|Trappvangar|Balkongbjälkar|Stödstolpar|Bärbalk|Takbjälkar|Ledger|Stolpar|Limträbalk)/,'lm',n=>LUM[hOf(n)]||52],
 [/^Plintar/,'st',()=>129],[/^Plintpapp/,'st',()=>15],
 [/^(Takstolsbeslag|Sparrbeslag)/,'st',()=>20],[/^Bjälkskor/,'st',()=>25],
 [/^Vindskydd under/,'m²',()=>18],[/^Isolering/,'m²',n=>INS[mmOf(n)]||80],[/^Ångspärr/,'m²',()=>8],
 [/^Golvskiva/,'st',()=>189],[/^Golvskruv/,'st',()=>.35],[/^Underlagsmatta/,'m²',()=>25],
 [/^Golvbeläggning/,'m²',()=>249],[/^Golvlist/,'st',()=>49],
 [/^Syllpapp/,'m',()=>6],[/^Syllbultar/,'st',()=>22],[/^Vindavstyvning/,'m',()=>12],[/^Spik/,'st',()=>.1],
 [/^Vindskyddsskiva/,'st',()=>179],[/^Gipsskiva/,'st',()=>89],[/^Installationsläkt/,'m',()=>17],
 [/^Fönster\s\d/,'st',()=>2500],[/^Dörr\s\d/,'st',()=>4500],
 [/^Fönsterfoder/,'m',()=>25],[/^Fönsterbleck/,'m',()=>85],
 [/^Ströläkt fasad/,'m',()=>14],[/^Insektsnät/,'m',()=>35],[/^Fasadpanel/,'m',()=>27],[/^Hörnbrädor/,'st',()=>120],
 [/^Underlagstak\/råspont/,'m²',()=>130],[/^Underlagspapp/,'rull',()=>349],
 [/^Ströläkt 25/,'m',()=>10],[/^Tvärläkt/,'m',()=>14],
 [/^Takplåt$/,'plat',()=>189],[/^Takplåt \(/,'m²',()=>189],[/^Lameller/,'m',()=>14],[/^Ränndalsbräda/,'m',()=>40],[/^Ränndals/,'m',()=>95],[/^Takskruv/,'st',()=>1.2],
 [/^Vindskiva \(trä\)/,'lm',()=>32],[/^Vindskiveplåt/,'st',()=>119],[/^Takfotsplåt/,'st',()=>99],[/^Nockplåt/,'st',()=>149],
 [/^Snörasskydd, rör/,'st',()=>149],[/^Snörasskyddskonsoler/,'st',()=>59],[/^Ändlock/,'st',()=>15],
 [/^Hängrännor/,'st',()=>129],[/^Rännkrokar/,'st',()=>22],[/^Stuprör/,'st',()=>149],[/^Utlopp/,'st',()=>79],
 [/^Eluttag/,'st',()=>69],[/^Strömbrytare/,'st',()=>59],[/^Taklamputtag/,'st',()=>39],[/^Lamputtag/,'st',()=>39],[/^Elcentral/,'st',()=>1490],[/^Matarkabel/,'m',()=>85],
 [/^Ankarbult/,'st',()=>22],[/^Garageport/,'st',()=>9900],[/^Dränerande/,'m3',()=>450],[/^Cellplast/,'m²',()=>120],[/^Armeringsnät/,'m²',()=>35],[/^Betong/,'m3',()=>1800],[/^Kantelement/,'m',()=>25],[/^Däcksplank/,'m',()=>28],[/^Däckskruv/,'st',()=>.5],[/^Räckesstolpar/,'st',()=>99],[/^Trappsteg/,'m',()=>28],[/^Apparatdosa/,'st',()=>12],
 [/^Kabel 3G2/,'m',()=>17],[/^Kabel 3G1/,'m',()=>11],[/^Installationsrör/,'m',()=>9],[/^Kabelklammor/,'st',()=>.6]
];
function bmUrl(name){
  const dim=(name.match(/\d+x\d+/)||[''])[0];
  let q=name.replace(/\(.*?\)/g,'').replace(/×/g,'x').replace(/\b(ytterväggar|innerväggar)\b/g,'').replace(/\s+/g,' ').trim();
  if(/^(Reglar|Syll och|Fönsterbröstregel)/.test(name)&&dim)q='regel '+dim;
  else if(/^Bärlinor/.test(name)&&dim)q='regel '+dim;
  else if(/^(Bjälkar|Randbjälkar)/.test(name)&&dim)q='konstruktionsvirke '+dim;
  else if(/^Limträ/.test(name)&&dim)q='limträbalk '+dim;
  else if(/^Fönster\s\d/.test(name))q='fönster';
  else if(/^Dörr\s\d/.test(name))q='ytterdörr';
  return 'https://www.google.com/search?q='+encodeURIComponent('site:byggmax.se '+q);
}
const UNIT={lm:'kr/m',plat:'kr/m²','st':'kr/st','m':'kr/m','m²':'kr/m²','m3':'kr/m³',rull:'kr/rulle'};
function rowCost(r){return r.mode?r.p*r.q*((r.mode==='lm'||r.mode==='plat')?r.len:1):0;}
function totals(){
  let g=0;const s={};
  ROWS.forEach((r,i)=>{const c=rowCost(r);g+=c;s[r.si]=(s[r.si]||0)+c;const e=$('rt'+i);if(e)e.textContent=r.mode?nf(c)+' kr':'';});
  Object.keys(s).forEach(k=>{const e=$('st'+k);if(e)e.textContent=nf(s[k])+' kr';});
  const gt=$('gt');if(gt)gt.textContent=nf(g)+' kr';
  let cur=-1,t=TITLE+'\n';
  ROWS.forEach(r=>{if(r.si!==cur){cur=r.si;t+='\n'+r.sec+'\n';}t+='  '+r.name+': '+r.qty+' ('+r.note+')'+(r.mode?' – '+nf(rowCost(r))+' kr':'')+'\n';});
  lastText=t+'\nTotalt ca '+nf(g)+' kr inkl. moms (riktpriser)';
}
function renderRes(sec){
  ROWS=[];
  let h='<thead><tr><th>Material</th><th style="text-align:right">Mängd</th><th>Pris</th><th style="text-align:right">Summa</th></tr></thead><tbody>';
  sec.forEach(([title,rows],si)=>{
    h+=`<tr class="sec"><td colspan="3">${title}</td><td class="n" id="st${si}"></td></tr>`;
    rows.forEach(r=>{
      const rule=RULES.find(x=>x[0].test(r[0])),idx=ROWS.length,key=si+'|'+r[0];
      const q=parseFloat(String(r[1]).replace(/[^\d,]/g,'').replace(',','.'))||0;
      const lm=String(r[2]).match(/(?:längd|à)\s*(\d+(?:,\d+)?)\s*m/);
      const len=lm?parseFloat(lm[1].replace(',','.')):4.8;
      let p=rule?rule[2](r[0]):0;if(PRICE_OV[key]!=null)p=PRICE_OV[key];
      ROWS.push({si,sec:title,name:r[0],qty:r[1],note:r[2],q,len,mode:rule?rule[1]:null,key,p});
      h+=`<tr><td>${r[0]}<small>${r[2]}</small></td><td class="n">${r[1]}</td><td>${rule?`<input class="pr" type="number" step="any" min="0" data-r="${idx}" value="${p}" aria-label="Pris för ${r[0]}"><small class="u">${UNIT[rule[1]]}</small><a class="bl" href="${bmUrl(r[0])}" target="_blank" rel="noopener" title="Sök på byggmax.se" aria-label="Sök ${r[0]} på byggmax.se">↗</a>`:''}</td><td class="n" id="rt${idx}"></td></tr>`;
    });
  });
  h+='<tr class="sec gt"><td colspan="3">Totalt (inkl. moms)</td><td class="n" id="gt"></td></tr></tbody>';
  $('res').innerHTML=h;totals();
  try{renderCut();renderCats();renderBygg();renderStruct();}catch(e){console.error(e);}
}
$('res').addEventListener('input',e=>{const t=e.target,i=t.dataset.r;if(i==null)return;const r=ROWS[+i];r.p=parseFloat(t.value)||0;PRICE_OV[r.key]=r.p;totals();try{renderCats();}catch(e){}});
