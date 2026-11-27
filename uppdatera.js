/* Hämtar nya filer från GitHub varje gång appen startas. Kräver Node 18+ och att repot är publikt.
   Ändrar bara filer som skiljer sig, rör inte data, node_modules eller startskripten. Misslyckas tyst om det inte går. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const REPO='Maxad1810/bygstome',BRANCH='main',ROOT=__dirname;
const SKIP=/^(node_modules|\.git|data|saknas)\/|^(doman\.txt|\.env|package-lock\.json)$|^(start|setup)[\w-]*\.(bat|sh)$/;
const gitSha=b=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');
async function get(url,asJson){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),10000);
  try{const r=await fetch(url,{signal:c.signal,headers:{'user-agent':'stomkalkyl-uppdatering'}});
    if(!r.ok)throw new Error('HTTP '+r.status);return asJson?await r.json():Buffer.from(await r.arrayBuffer());}
  finally{clearTimeout(t);}
}
(async()=>{
  if(typeof fetch!=='function'){console.log('Uppdatering hoppades över (Node 18 eller nyare behövs).');return;}
  try{
    const tree=await get('https://api.github.com/repos/'+REPO+'/git/trees/'+BRANCH+'?recursive=1',true);
    const files=(tree.tree||[]).filter(f=>f.type==='blob'&&!SKIP.test(f.path));
    let n=0;
    for(const f of files){
      const dest=path.join(ROOT,f.path);
      let have=null;try{have=gitSha(fs.readFileSync(dest));}catch(e){}
      if(have===f.sha)continue;
      const buf=await get('https://raw.githubusercontent.com/'+REPO+'/'+BRANCH+'/'+f.path.split('/').map(encodeURIComponent).join('/'));
      fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,buf);n++;
      console.log('  uppdaterade '+f.path);
    }
    console.log(n?('Uppdaterade '+n+' fil'+(n>1?'er':'')+' från GitHub.'):'Appen är redan den senaste versionen.');
  }catch(e){console.log('Kunde inte kolla efter uppdatering ('+e.message+'). Startar ändå.');}
})();
