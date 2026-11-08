/* ---------- Skala av lager ---------- */
const PEEL=['l14','l6','l5','l7','l12','l8','l9','l10','l11','l3','l2','l13','l1'];
const PEELN=['Altan','Rännor och stuprör','Plåtdetaljer och vindskivor','Fasad','Luftspalt','Vindskydd','Takplåt','Takpapp','Råspont','Takstolar','Väggar','El invändigt','Golv'];
function applyVis(){
  const R=R3;if(!R||!R.layers)return;
  Object.keys(R.layers).forEach(id=>R.layers[id].forEach(gr=>{gr.visible=$(id).checked;}));
  R.draw();
}
function peelUpdate(){
  let n=0;while(n<PEEL.length&&!$(PEEL[n]).checked)n++;
  $('lpeel').value=n;
  $('peelTxt').textContent=n===0?'hela huset':(n>=PEEL.length?'inga lager':'ytterst: '+PEELN[n].toLowerCase());
}
PEEL.forEach(id=>$(id).addEventListener('change',()=>{applyVis();peelUpdate();}));
function lockUi(){
  const R=R3;
  if(R){R.ren.domElement.style.touchAction=LOCK3?'pan-y':'none';if(R.ctl)R.ctl.enabled=!LOCK3;}
  $('lk3').textContent=LOCK3?'Rotera 3D: av':'Rotera 3D: på';
}
$('lk3').onclick=()=>{LOCK3=!LOCK3;lockUi();};
$('lpeel').oninput=()=>{const n=+$('lpeel').value;PEEL.forEach((id,i)=>{$(id).checked=i>=n;});applyVis();peelUpdate();};
$('lAll').onclick=()=>{PEEL.forEach(id=>{$(id).checked=true;});applyVis();peelUpdate();};
$('lNone').onclick=()=>{PEEL.forEach(id=>{$(id).checked=false;});applyVis();peelUpdate();};
document.querySelectorAll('.panel input[id]:not([id^=pj]):not([id^=l]),.panel select[id]:not([id^=pj])').forEach(el=>el.addEventListener('input',calc));
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(lastText);$('toast').textContent='Listan är kopierad.';}catch(e){$('toast').textContent='Kunde inte kopiera. Markera listan och kopiera manuellt.';}};
$('print').onclick=()=>window.print();
drawOps();drawEls();calc();DEF=snap();pList();peelUpdate();lockUi();
