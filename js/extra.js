/* ---------- Kapningslista, kategorier, delning och bygglovskoll ---------- */
const STOCK=[2.4,2.7,3.0,3.3,3.6,3.9,4.2,4.5,4.8,5.1,5.4,6.0];
function cutPlan(){
  const dims={};
  ROWS.forEach(r=>{
    if(r.mode!=='lm'||!(r.q>0))return;
    const m=r.name.match(/(\d+)x(\d+)/);if(!m)return;
    const d=m[0],ex=(r.note||'').match(/exakt (\d+(?:,\d+)?) m/),len=ex?parseFloat(ex[1].replace(',','.')):(r.len||4.8);
    (dims[d]=dims[d]||{items:[],naive:0}).items.push(...Array(Math.round(r.q)).fill(len));
    dims[d].naive+=r.q*len;
  });
  return Object.keys(dims).sort().map(d=>{
    const items=dims[d].items.slice().sort((a,b)=>b-a),bins=[];
    items.forEach((len,idx)=>{
      let best=null;
      bins.forEach(b=>{if(b.rem>=len+.004&&(!best||b.rem<best.rem))best=b;});
      if(best){best.rem-=len+.004;best.used+=len;best.items.push(len);return;}
      const rest=items.slice(idx+1);let bestS=null,bestU=-1;
      (len>STOCK[STOCK.length-1]?[len]:STOCK.filter(S=>S>=len-1e-9)).forEach(S=>{
        let rem=S-len-.004,used=len;
        rest.forEach(x=>{if(rem>=x+.004){rem-=x+.004;used+=x;}});
        const u=used/S;if(u>bestU+1e-9){bestU=u;bestS=S;}
      });
      bins.push({S:bestS,rem:bestS-len-.004,used:len,items:[len]});
    });
    const buys={};let stockM=0,usedM=0;
    bins.forEach(b=>{buys[b.S]=(buys[b.S]||0)+1;stockM+=b.S;usedM+=b.used;});
    const pat={};bins.forEach(b=>{const k=b.S+': '+b.items.map(x=>nf(x,2)).join(' + ');pat[k]=(pat[k]||0)+1;});
    return {dim:d,buys,stockM,usedM,waste:stockM?1-usedM/stockM:0,naive:dims[d].naive,pat,n:items.length};
  });
}
function renderCut(){
  const box=$('cutBox');if(!box)return;
  const plan=cutPlan();
  if(!plan.length){box.innerHTML='<p class="note">Inga virkesrader att optimera.</p>';return;}
  const PM={45:17,70:26,95:31,120:40,145:52,170:60,195:66,220:77};
  let sav=0;
  box.innerHTML='<div class="scroll"><table><thead><tr><th>Dimension</th><th>K\u00f6p</th><th style="text-align:right">\u00c5tg\u00e5ng</th><th style="text-align:right">Spill</th></tr></thead><tbody>'+plan.map(p=>{
    const buy=Object.keys(p.buys).map(Number).sort((a,b)=>b-a).map(S=>p.buys[S]+' \u00d7 '+nf(S,1)+' m').join(', ');
    const h=+p.dim.split('x')[1],diff=p.naive-p.stockM;if(diff>0)sav+=diff*(PM[h]||52);
    const pats=Object.entries(p.pat).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,c])=>c+' \u00d7 '+k.replace(': ',' m: ')).join('<br>');
    return '<tr><td>'+p.dim+'<small>'+p.n+' delar</small></td><td>'+buy+'<small>'+pats+'</small></td><td class="n">'+nf(p.usedM,1)+' m</td><td class="n">'+nf(p.waste*100,1)+' %</td></tr>';
  }).join('')+'</tbody></table></div>'+'<p class="note">K\u00f6plistan packar delarna i standardl\u00e4ngder (2,4\u20136,0 m, s\u00e5gkapning 4 mm) f\u00f6r minst spill. Listan under \u201dInk\u00f6pslista\u201d r\u00e4knar full l\u00e4ngd per del.'+(sav>50?' Uppskattad besparing mot att k\u00f6pa varje del f\u00f6r sig: ca '+nf(sav)+' kr.':'')+'</p>';
}
const CATS=[
 ['Takstolar',/^Takstolar|^Limtr\u00e4sparrar|^Limtr\u00e4 nockbalk/],
 ['F\u00f6nster, d\u00f6rrar och portar',/^F\u00f6nster\s\d|^D\u00f6rr\s\d|^Garageport/],
 ['El',/^Eluttag|^Str\u00f6mbrytare|^Lamputtag|^Taklamputtag|^Elcentral|^Apparatdosa|^Kabel |^Installationsr\u00f6r|^Matarkabel|^Kabelklammor/],
 ['Betong, grus och grund',/^Plintar|^Plintpapp|^Dr\u00e4nerande|^Betong|^Armeringsn\u00e4t|^Kantelement|^Cellplast/],
 ['Pl\u00e5t, tak och r\u00e4nnor',/^Takpl\u00e5t|^Takskruv|^Nockpl\u00e5t|^Vindskivepl\u00e5t|^Takfotspl\u00e5t|^Sn\u00f6rassk|^H\u00e4ngr\u00e4nnor|^R\u00e4nnkrokar|^Stupr\u00f6r|^Utlopp|^R\u00e4nndal|^\u00c4ndlock/],
 ['Skivor, isolering och papp',/^Vindskyddsskiva|^Gipsskiva|^Isolering|^\u00c5ngsp\u00e4rr|^Vindskydd under|^Underlagspapp|^Underlagstak|^Underlagsmatta|^Golvskiva|^Golvskruv/],
 ['Fasad, trall och ytskikt',/^Fasadpanel|^H\u00f6rnbr\u00e4dor|^F\u00f6nsterfoder|^F\u00f6nsterbleck|^D\u00e4cksplank|^Insektsn\u00e4t|^Golvbel\u00e4ggning|^Golvlist|^Trappsteg|^D\u00e4ckskruv/],
 ['Beslag och f\u00e4stdon',/^Spik|^Syllbultar|^Ankarbult|^Bj\u00e4lkskor|^Takstolsbeslag|^Sparrbeslag|^Syllpapp|^Vindavstyvning|^Balkskor/],
 ['Virke och reglar',/^(Reglar|Syll och|B\u00e4rlinor|F\u00f6nsterbr\u00f6stregel|Bj\u00e4lkar|Randbj\u00e4lk|Balkongbj\u00e4lkar|D\u00e4cksbj\u00e4lkar|Handledare|Trappvangar|St\u00f6dstolpar|Str\u00f6l\u00e4kt|Tv\u00e4rl\u00e4kt|Vindskiva|Installationsl\u00e4kt|R\u00e4ckesstolpar|Stolpar|Bj\u00e4lklag)/]
];
function catOf(n){const c=CATS.find(x=>x[1].test(n));return c?c[0]:'\u00d6vrigt';}
function catData(){
  const g={};
  ROWS.forEach(r=>{const c=catOf(r.name);(g[c]=g[c]||{rows:[],sum:0});g[c].rows.push(r);g[c].sum+=rowCost(r);});
  return Object.keys(g).sort().map(k=>({cat:k,rows:g[k].rows,sum:g[k].sum}));
}
function renderCats(){
  const box=$('catBox');if(!box)return;
  box.innerHTML=catData().map(c=>'<div class="catg"><div class="catn"><b>'+c.cat+'</b><span>'+nf(c.sum)+' kr</span></div>'+c.rows.map(r=>'<div class="catr"><span>'+r.name+'</span><span>'+r.qty+'</span><span>'+(r.mode?nf(rowCost(r))+' kr':'')+'</span></div>').join('')+'</div>').join('');
}
/* ----- dela som kod ----- */
function b64u(buf){let s='';const b=new Uint8Array(buf);for(let i=0;i<b.length;i+=8192)s+=String.fromCharCode.apply(null,b.subarray(i,i+8192));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function unb64u(t){t=t.replace(/-/g,'+').replace(/_/g,'/');while(t.length%4)t+='=';const s=atob(t),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return b;}
async function makeCode(){
  const raw=new TextEncoder().encode(JSON.stringify({app:'stomkalkyl',v:1,name:$('pjName').value.trim(),data:snap()}));
  if(window.CompressionStream){
    const cs=new CompressionStream('deflate-raw'),w=cs.writable.getWriter();w.write(raw);w.close();
    const buf=await new Response(cs.readable).arrayBuffer();return 'SK2.'+b64u(buf);
  }
  return 'SK1.'+b64u(raw);
}
async function readCode(t){
  t=(t||'').trim();
  let bytes;
  if(t.startsWith('SK2.')){
    const ds=new DecompressionStream('deflate-raw'),w=ds.writable.getWriter();w.write(unb64u(t.slice(4)));w.close();
    bytes=new Uint8Array(await new Response(ds.readable).arrayBuffer());
  }else if(t.startsWith('SK1.'))bytes=unb64u(t.slice(4));
  else throw new Error('Koden b\u00f6rjar inte med SK1. eller SK2.');
  const j=JSON.parse(new TextDecoder().decode(bytes));
  if(!j||j.app!=='stomkalkyl'||!j.data||!j.data.f)throw new Error('Koden \u00e4r ingen ritning');
  return j;
}
$('pjShare').onclick=async()=>{
  try{
    const code=await makeCode();$('pjCode').style.display='block';$('pjCode').value=code;$('pjCode').select();
    let ok=false;try{await navigator.clipboard.writeText(code);ok=true;}catch(e){}
    pMsg(ok?'Koden ('+code.length+' tecken) \u00e4r kopierad. Skicka den till mottagaren, som v\u00e4ljer \u201dKlistra in kod\u201d.':'Koden ('+code.length+' tecken) visas i rutan \u2013 markera och kopiera den.');
  }catch(e){pMsg('Kunde inte skapa koden: '+(e&&e.message||e));}
};
$('pjLoad').onclick=async()=>{
  const box=$('pjCode');
  if(box.style.display!=='block'||!box.value.trim()){box.style.display='block';box.value='';box.focus();pMsg('Klistra in koden i rutan och tryck \u201dKlistra in kod\u201d igen.');return;}
  try{const j=await readCode(box.value);restore(j.data);if(j.name)$('pjName').value=j.name;pMsg('Ritningen \u00e4r inl\u00e4st fr\u00e5n koden.');box.style.display='none';box.value='';}
  catch(e){pMsg('Kunde inte l\u00e4sa koden: '+(e&&e.message||e));}
};
/* ----- bygglovskoll (vägledning) ----- */
function renderBygg(){
  const box=$('byggBox');if(!box)return;
  const L=[],hus=$('bHus').checked,gi=garageInfo(),P=g0('P'),tn=Math.tan(P*Math.PI/180);
  if(hus)L.push(['Huset','Ett nytt bostadshus kr\u00e4ver bygglov. Ans\u00f6k hos kommunens byggnadsn\u00e4mnd innan du b\u00f6rjar.']);
  if(gi){
    const A=gi.L*gi.B,ridge=(.15+gi.H+tn*gi.B/2),nm=GN();
    L.push([nm,'Byggnadsarea ca '+nf(A,1)+' m\u00b2, nockh\u00f6jd ca '+nf(ridge,1)+' m. '+(A>45?'Arean \u00e4r st\u00f6rre \u00e4n 45 m\u00b2, vilket sannolikt kr\u00e4ver bygglov.':'Kan vara bygglovsfri komplementbyggnad om m\u00e5tt och placering f\u00f6ljer reglerna.')+' Placering, h\u00f6jd och avst\u00e5nd till tomtgr\u00e4ns och andra byggnader avg\u00f6rs av detaljplan och kommun.']);
  }
  if($('dk').checked&&hus){const D=deckSegs();L.push(['Altan','Altan '+nf(D.leff*D.dp,1)+' m\u00b2 p\u00e5 '+nf(g0('dkH'),2)+' m h\u00f6jd'+($('dkRoof')&&$('dkRoof').value!=='n'?' med tak':'')+'. Regler f\u00f6r altan, uteplats och tak \u00f6ver altan beror bland annat p\u00e5 h\u00f6jd och om det blir en tillbyggnad. Se Boverkets sida \u201dMur, plank, altan och annat\u201d och fr\u00e5ga kommunen.']);}
  if($('bk').checked&&hus)L.push(['Balkong','Balkong p\u00e5 en byggnad kan p\u00e5verka fasaden och kr\u00e4va bygglov eller anm\u00e4lan beroende p\u00e5 detaljplan och omfattning. Kontrollera med kommunen.']);
  if(!L.length){box.innerHTML='<p class="note">Inget valt.</p>';return;}
  box.innerHTML=L.map(([h,t])=>'<p><b>'+h+':</b> '+t+'</p>').join('')+'<p class="note"><b>Vad jag har kontrollerat:</b> Boverket (sida \u201dBygga en ny byggnad\u201d, h\u00e4mtad 2026) uppger att det sedan nya regler fr\u00e5n 1 december 2025 inte kr\u00e4vs bygglov eller anm\u00e4lan f\u00f6r en komplementbyggnad inom givna m\u00e5tt och avst\u00e5nd. Inom detaljplan r\u00e4knas lovfria byggnader ihop \u2013 Boverkets exempel \u00e4r 30 m\u00b2 + 15 m\u00b2, d\u00e5 g\u00e5r det inte att bygga mer utan bygglov. De exakta m\u00e5tten, h\u00f6jderna och avst\u00e5nden har jag inte kunnat l\u00e4sa ut, och de skiljer sig mellan detaljplan och utanf\u00f6r detaljplan. Det h\u00e4r \u00e4r en grov v\u00e4gledning. Kolla alltid <a href="https://www.boverket.se/sv/byggande/bygglov-rivningslov-marklov-och-anmalan/vad-far-jag-bygga-utan-bygglov/" target="_blank" rel="noopener">Boverkets sida</a> och din kommun innan du bygger.</p>';
}
