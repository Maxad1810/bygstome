/* Stomkalkyl – liten server utan beroenden. Starta: node server.js  (Node 18+)
   Serverar appen och hämtar riktiga priser från byggmax.se via /api/pris?q=sökord.
   Svaren sparas i 1 timme. */
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = +process.env.PORT || 8080, TTL = 60 * 60 * 1000;
const ROOT = __dirname, CACHE = new Map();
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.md': 'text/plain; charset=utf-8' };
const SEARCH = q => 'https://www.byggmax.se/sok?q=' + encodeURIComponent(q);

const num = v => { const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.')); return isFinite(n) && n > 0 ? n : null; };

/* Plockar ut produkter ur en sökresultatsida: JSON-LD, inbäddad JSON och enkel HTML. */
function parse(html) {
  const out = [], seen = new Set();
  const add = (name, price, url) => {
    price = num(price); if (!name || !price) return;
    name = String(name).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
    const k = name + '|' + price; if (seen.has(k)) return; seen.add(k);
    if (url && url.startsWith('/')) url = 'https://www.byggmax.se' + url;
    out.push({ name, price, url: url || '' });
  };
  const walk = o => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) return o.forEach(walk);
    if (o.name && (o.offers || o.price != null || o.lowPrice != null)) {
      const of = Array.isArray(o.offers) ? o.offers[0] : o.offers;
      add(o.name, (of && (of.price ?? of.lowPrice)) ?? o.price ?? o.lowPrice, o.url || (of && of.url));
    }
    Object.values(o).forEach(walk);
  };
  for (const m of html.matchAll(/<script[^>]*type="application\/(?:ld\+)?json"[^>]*>([\s\S]*?)<\/script>/gi)) { try { walk(JSON.parse(m[1])); } catch (e) {} }
  const nd = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (nd) { try { walk(JSON.parse(nd[1])); } catch (e) {} }
  if (!out.length) {
    for (const m of html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]{0,600}?)<\/a>/gi)) {
      const txt = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const pr = txt.match(/(\d[\d\s]*[.,]?\d*)\s*(?:kr|:-)/i);
      if (pr && txt.length > 8) add(txt.replace(pr[0], '').trim().slice(0, 120), pr[1], m[1]);
    }
  }
  return out.slice(0, 12);
}

async function pris(q) {
  const hit = CACHE.get(q);
  if (hit && Date.now() - hit.t < TTL) return { ...hit.d, cached: true };
  const r = await fetch(SEARCH(q), { headers: { 'user-agent': 'Mozilla/5.0 Stomkalkyl', 'accept-language': 'sv-SE,sv;q=0.9' }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error('Byggmax svarade ' + r.status);
  const d = { q, hamtad: new Date().toISOString(), produkter: parse(await r.text()) };
  CACHE.set(q, { t: Date.now(), d });
  return d;
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/api/pris') {
    const q = (u.searchParams.get('q') || '').trim().slice(0, 100);
    res.setHeader('content-type', 'application/json; charset=utf-8');
    if (!q) { res.statusCode = 400; return res.end('{"fel":"saknar q"}'); }
    try { res.end(JSON.stringify(await pris(q))); }
    catch (e) { res.statusCode = 502; res.end(JSON.stringify({ fel: String(e.message || e) })); }
    return;
  }
  if (u.pathname === '/api/ping') return res.end('ok');
  let f = path.normalize(decodeURIComponent(u.pathname)).replace(/^(\.\.[\/\\])+/, '');
  if (f === '/' || f === '\\') f = '/index.html';
  const full = path.join(ROOT, f);
  if (!full.startsWith(ROOT) || /server\.js$|\.git/.test(full)) { res.statusCode = 404; return res.end('404'); }
  fs.readFile(full, (e, b) => {
    if (e) { res.statusCode = 404; return res.end('404'); }
    res.setHeader('content-type', TYPES[path.extname(full)] || 'application/octet-stream'); res.end(b);
  });
}).listen(PORT, () => console.log('Stomkalkyl körs på http://localhost:' + PORT + '  (Ctrl+C avslutar)'));
module.exports = { parse };
