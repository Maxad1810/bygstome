/* Service worker: nät först, lagrad kopia när nätet saknas. API-anrop lagras aldrig. */
const V='stomkalkyl-v3',CORE=['./','./index.html','./styles.css','./login.html','./icon-192.png','./icon-512.png','./js/kalkyl.js','./js/priser.js','./js/3d.js','./js/el.js','./js/ritningar.js','./js/hallfast.js','./js/extra.js','./js/lager.js','./js/pdf.js','./js/pdf2.js','./js/extra2.js','./js/live.js','./js/konto.js','./js/byggritning.js','./js/innervaggar.js','./js/kapplista.js','./js/stomritning.js','./js/bygge.js','./js/importera.js','./lib/three.min.js','./lib/OrbitControls.js','./lib/jspdf.umd.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(CORE.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin||u.pathname.startsWith('/api/'))return;
  e.respondWith(fetch(r,{cache:'no-cache'}).then(res=>{if(res.ok){const c=res.clone();caches.open(V).then(x=>x.put(r,c));}return res;}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('./index.html'))));
});
