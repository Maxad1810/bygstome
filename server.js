/* Stomkalkyl – liten server. Starta: node server.js  (Node 18+, kräver Playwright för live-priser)
   Serverar appen och hämtar riktiga priser från byggmax.se via /api/pris?q=sökord.
   Svaren sparas i 1 timme. */
const http = require('http'), fs = require('fs'), path = require('path');
const crypto = require('crypto');
const PORT = +process.env.PORT || 8080, HOST = process.env.HOST || '127.0.0.1', TTL = 60 * 60 * 1000;
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


/* ---------- Konton och sparade ritningar (filer i data/) ---------- */
const DATA = path.join(ROOT, 'data'); fs.mkdirSync(path.join(DATA, 'ritningar'), { recursive: true });
const UF = path.join(DATA, 'users.json'), SF = path.join(DATA, 'sessions.json');
const readJ = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return d; } };
const writeJ = (f, o) => { fs.writeFileSync(f + '.tmp', JSON.stringify(o)); fs.renameSync(f + '.tmp', f); };
let USERS = readJ(UF, {}), SESS = readJ(SF, {});
const NAME_RE = /^[a-z0-9_-]{3,30}$/, WEEK = 30 * 24 * 3600 * 1000, TRIES = new Map();
const hash = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString('hex');
const dfile = u => path.join(DATA, 'ritningar', u + '.json');
const loadD = u => { const o = readJ(dfile(u), {}); return Object.assign(Object.create(null), o); };
function newSession(u, res) {
  const t = crypto.randomBytes(32).toString('hex'); SESS[t] = { u, exp: Date.now() + WEEK }; writeJ(SF, SESS);
  res.setHeader('set-cookie', 'sk=' + t + '; HttpOnly; SameSite=Strict; Path=/; Max-Age=' + WEEK / 1000);
}
function who(req) {
  const m = (req.headers.cookie || '').match(/(?:^|;\s*)sk=([a-f0-9]{64})/); if (!m) return null;
  const s = SESS[m[1]]; if (!s || s.exp < Date.now()) return null; return s.u;
}
function body(req) {
  return new Promise((ok, no) => { let n = 0, b = []; req.on('data', c => { n += c.length; if (n > 6e6) { no(new Error('för stor')); req.destroy(); } else b.push(c); });
    req.on('end', () => { try { ok(JSON.parse(Buffer.concat(b).toString() || '{}')); } catch (e) { no(new Error('ogiltig JSON')); } }); });
}
const send = (res, code, o) => { res.statusCode = code; res.setHeader('content-type', 'application/json; charset=utf-8'); res.end(JSON.stringify(o)); };
function limited(ip) { const now = Date.now(), a = (TRIES.get(ip) || []).filter(t => now - t < 600000); TRIES.set(ip, a); return a.length >= 10; }

async function konto(req, res, u) {
  const p = u.pathname, ip = req.socket.remoteAddress || '';
  if (p === '/api/me') { const w = who(req); return send(res, 200, { user: w }); }
  if (p === '/api/logout' && req.method === 'POST') {
    const m = (req.headers.cookie || '').match(/sk=([a-f0-9]{64})/); if (m) { delete SESS[m[1]]; writeJ(SF, SESS); }
    res.setHeader('set-cookie', 'sk=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); return send(res, 200, { ok: 1 });
  }
  if ((p === '/api/login' || p === '/api/register') && req.method === 'POST') {
    if (limited(ip)) return send(res, 429, { fel: 'För många försök. Vänta 10 minuter.' });
    const b = await body(req), n = String(b.user || '').trim().toLowerCase(), pw = String(b.pw || '');
    if (p === '/api/register') {
      if (!NAME_RE.test(n)) return send(res, 400, { fel: 'Användarnamn: 3–30 tecken, a–z, 0–9, _ och -.' });
      if (pw.length < 6 || pw.length > 200) return send(res, 400, { fel: 'Lösenordet måste vara minst 6 tecken.' });
      if (USERS[n]) return send(res, 409, { fel: 'Användarnamnet är upptaget.' });
      const salt = crypto.randomBytes(16).toString('hex'); USERS[n] = { salt, hash: hash(pw, salt) }; writeJ(UF, USERS);
      newSession(n, res); return send(res, 200, { user: n });
    }
    const us = NAME_RE.test(n) && USERS[n], h = hash(pw, us ? us.salt : '00'.repeat(16));
    if (!us || !crypto.timingSafeEqual(Buffer.from(h), Buffer.from(us.hash))) { TRIES.get(ip).push(Date.now()); return send(res, 401, { fel: 'Fel användarnamn eller lösenord.' }); }
    newSession(n, res); return send(res, 200, { user: n });
  }
  const w = who(req); if (!w) return send(res, 401, { fel: 'Inte inloggad.' });
  if (p === '/api/ritningar' && req.method === 'GET') return send(res, 200, loadD(w));
  const m = p.match(/^\/api\/ritningar\/(.+)$/);
  if (m) {
    const name = decodeURIComponent(m[1]).slice(0, 60), d = loadD(w);
    if (!name.trim()) return send(res, 400, { fel: 'Namn saknas.' });
    if (req.method === 'PUT') { const b = await body(req); if (!b || typeof b !== 'object' || !b.f) return send(res, 400, { fel: 'Ogiltig ritning.' });
      if (Object.keys(d).length >= 200 && !(name in d)) return send(res, 400, { fel: 'För många sparade ritningar.' });
      d[name] = b; writeJ(dfile(w), d); return send(res, 200, { ok: 1 }); }
    if (req.method === 'DELETE') { delete d[name]; writeJ(dfile(w), d); return send(res, 200, { ok: 1 }); }
  }
  return send(res, 404, { fel: 'Okänd adress.' });
}

const srv = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname.startsWith('/api/') && u.pathname !== '/api/pris' && u.pathname !== '/api/ping') {
    try { return await konto(req, res, u); } catch (e) { return send(res, 400, { fel: String(e.message || e) }); }
  }
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
  if (!full.startsWith(ROOT) || /server\.js$|package(-lock)?\.json$|\.git|[\/\\](data|node_modules)[\/\\]/.test(full)) { res.statusCode = 404; return res.end('404'); }
  fs.readFile(full, (e, b) => {
    if (e) { res.statusCode = 404; return res.end('404'); }
    res.setHeader('content-type', TYPES[path.extname(full)] || 'application/octet-stream'); res.end(b);
  });
});
srv.on('listening', () => {
  const url = 'http://localhost:' + srv.address().port;
  console.log('\nStomkalkyl körs på ' + url + '  (Ctrl+C eller stäng fönstret avslutar)\n');
  if (!process.env.NO_OPEN) {
    const { exec } = require('child_process');
    exec(process.platform === 'win32' ? 'start "" ' + url : process.platform === 'darwin' ? 'open ' + url : 'xdg-open ' + url, () => {});
  }
});
function start(port, left) {
  srv.once('error', e => {
    if (e.code === 'EADDRINUSE' && left > 0) { console.log('Port ' + port + ' används redan (en äldre Stomkalkyl-server är troligen igång). Provar ' + (port + 1) + ' …'); start(port + 1, left - 1); }
    else { console.error('Kunde inte starta:', e.message); process.exit(1); }
  });
  srv.listen(port, HOST);
}
start(PORT, 10);
module.exports = {};
