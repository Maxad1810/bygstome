/* Stomkalkyl – liten server. Starta: node server.js  (Node 18+, kräver Playwright för live-priser)
   Serverar appen och hämtar riktiga priser från byggmax.se via /api/pris?q=sökord.
   Svaren sparas i 1 timme. */
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = +process.env.PORT || 8080, TTL = 60 * 60 * 1000;
const ROOT = __dirname, CACHE = new Map();
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.md': 'text/plain; charset=utf-8' };
const BASE = process.env.BYGGMAX_URL || 'https://www.byggmax.se';

/* Osynlig webbläsare (Playwright): Byggmax laddar priserna med JavaScript, så sidan måste "köras". */
let BR = null, QUEUE = Promise.resolve();
async function browser() {
  if (BR) return BR;
  let pw; try { pw = require('playwright'); } catch (e) { throw new Error('Playwright saknas. Kör: npm install  och sedan  npx playwright install chromium'); }
  BR = await pw.chromium.launch();
  return BR;
}
const PRICE = /(\d[\d\s]*[.,]\d{1,2}|\d{2,5})\s*(?:kr|:-)\s*\/?\s*(m²|m2|m|st)?\b/i;
const toNum = s => parseFloat(String(s).replace(/\s/g, '').replace(',', '.'));
const unitOf = u => !u ? '' : u.toLowerCase() === 'm2' ? 'm²' : u.toLowerCase();

async function hamta(q) {
  const b = await browser(), ctx = await b.newContext({ locale: 'sv-SE', userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/120 Safari/537.36' }), page = await ctx.newPage();
  try {
    page.setDefaultTimeout(15000);
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    try { await page.getByRole('button', { name: /godkänn|acceptera|tillåt alla|ok/i }).first().click({ timeout: 3000 }); } catch (e) {}
    const box = page.locator('input[type="search"], input[placeholder*="Sök"], input[name="q"]').first();
    await box.fill(q); await box.press('Enter');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    if (!/-p\d{5,}/.test(page.url())) {
      const dim = (q.match(/\d+x\d+/) || [''])[0];
      const links = await page.$$eval('a[href*="-p0"]', as => as.map(a => ({ href: a.href, text: (a.innerText || a.getAttribute('aria-label') || a.title || '').replace(/\s+/g, ' ').trim() })));
      const pick = links.find(l => dim && l.text.toLowerCase().includes(dim)) || links.find(l => dim && l.href.includes(dim.replace('x', 'x'))) || links[0];
      if (!pick) return [];
      await page.goto(pick.href, { waitUntil: 'domcontentloaded' });
    }
    await page.waitForFunction(() => /\d\s*(kr|:-)\s*\/?\s*(m|st|m²|m2)?\b/i.test(document.body.innerText), null, { timeout: 15000 }).catch(() => {});
    const name = (await page.locator('h1').first().innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
    const txt = await page.evaluate(() => document.body.innerText);
    const m = txt.match(PRICE);
    return m ? [{ name, price: toNum(m[1]), unit: unitOf(m[2]), url: page.url() }] : [];
  } finally { await ctx.close(); }
}

async function pris(q) {
  const hit = CACHE.get(q);
  if (hit && Date.now() - hit.t < TTL) return { ...hit.d, cached: true };
  const job = QUEUE.then(() => hamta(q));          // en sökning i taget
  QUEUE = job.catch(() => {});
  const d = { q, hamtad: new Date().toISOString(), produkter: await job };
  if (d.produkter.length) CACHE.set(q, { t: Date.now(), d });
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
module.exports = {};
