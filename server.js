/* Stomkalkyl – liten server. Starta: node server.js  (Node 18+, kräver Playwright för live-priser)
   Serverar appen och hämtar riktiga priser från byggmax.se via /api/pris?q=sökord.
   Svaren sparas i 1 timme. */
const http = require('http'), fs = require('fs'), path = require('path');
const crypto = require('crypto');
const PUBLIC = process.env.PUBLIC === '1';   // true när appen nås utifrån via tunnel/proxy
const PORT = +process.env.PORT || 8080, HOST = process.env.HOST || '127.0.0.1', TTL = 60 * 60 * 1000;
const ROOT = __dirname, CACHE = new Map();
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.md': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const STORE_URL = Object.assign({ Byggmax: process.env.BYGGMAX_URL || 'https://www.byggmax.se', Beijer: 'https://www.beijerbygg.se/privat', 'XL-BYGG Kiruna': 'https://www.xlbyggstenvalls.se/kiruna' }, JSON.parse(process.env.STORE_URLS || '{}'));
const lenOf = n => { let m = n.match(/(\d{3,5})\s*mm/i); if (m && +m[1] >= 1000) return +m[1] / 1000; m = n.match(/(\d+(?:[.,]\d+)?)\s*m\b/i); if (m) { const v = parseFloat(m[1].replace(',', '.')); if (v >= 1 && v <= 8) return v; } return 0; };

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

async function hamta(q, BASE) {
  const b = await browser(), ctx = await b.newContext({ locale: 'sv-SE', userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/120 Safari/537.36' }), page = await ctx.newPage();
  try {
    page.setDefaultTimeout(15000);
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    try { await page.getByRole('button', { name: /godkänn|acceptera|tillåt alla|ok/i }).first().click({ timeout: 3000 }); } catch (e) {}
    const SEL = 'input[type="search"], input[placeholder*="Sök" i], input[name="q"], input[name="search"], input[aria-label*="Sök" i]';
    if (!(await page.locator(SEL).first().isVisible().catch(() => false))) { try { await page.locator('button[aria-label*="Sök" i], [data-testid*="search" i]').first().click({ timeout: 3000 }); } catch (e) {} }
    const box = page.locator(SEL).first();
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
    if (!m) return [];
    let price = toNum(m[1]), unit = unitOf(m[2]);
    if (unit !== 'm') { const L = lenOf(name); if (L && (unit === 'st' || !unit)) { price = Math.round(price / L * 100) / 100; unit = 'm'; } }
    return [{ name, price, unit, url: page.url() }];
  } finally { await ctx.close(); }
}

/* XL-BYGG Kiruna: priserna står i sidans text på kategorisidorna, så vi läser dem därifrån. */
const XL_CATS = ['/sortiment/tra/plank-reglar', '/sortiment/tra/virke-ovrigt'];
const XLP = /(\d[\d\s ]*(?:[.,]\d+)?)\s*:-\s*\/\s*([a-zA-ZåäöÅÄÖ²0-9]+)/;
async function xlKategori(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  try { await page.getByRole('button', { name: /godkänn|acceptera|tillåt alla|ok/i }).first().click({ timeout: 2500 }); } catch (e) {}
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  for (let i = 0; i < 12; i++) {                          // "visa fler" / ladda fler
    const b = page.getByRole('button', { name: /visa fler|ladda fler|visa mer/i }).first();
    if (!(await b.isVisible().catch(() => false))) break;
    await b.click().catch(() => {}); await page.waitForTimeout(1200);
  }
  const items = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('a[href*="/sortiment/"]').forEach(a => { const t = (a.innerText || '').replace(/\s+/g, ' ').trim(); if (t) out.push({ href: a.href, text: t }); });
    return { items: out, body: document.body.innerText };
  });
  const res = [];
  const unit = u => { u = (u || '').toLowerCase(); return u === 'm2' ? 'm²' : u === 'lpm' || u === 'lm' ? 'm' : u; };
  for (const it of items.items) {
    const m = it.text.match(XLP); if (!m) continue;
    const name = it.text.slice(0, m.index).replace(/\s+/g, ' ').trim(); if (name.length < 3) continue;
    res.push({ name, price: toNum(m[1]), unit: unit(m[2]), url: it.href });
  }
  if (!res.length) {                                      // reserv: radbaserad läsning av sidtexten
    const L = items.body.split('\n').map(x => x.trim()).filter(Boolean); let last = '';
    for (const l of L) { const m = l.match(XLP); if (m) { const nm = (l.slice(0, m.index).trim() || last); if (nm.length > 2) res.push({ name: nm, price: toNum(m[1]), unit: unit(m[2]), url: url }); } else if (/[a-zåäö]{3}/i.test(l)) last = l; }
  }
  return res;
}
const XLC = {};
async function hamtaXL(q, BASE) {
  const b = await browser(), ctx = await b.newContext({ locale: 'sv-SE' }), page = await ctx.newPage();
  try {
    page.setDefaultTimeout(15000);
    let all;
    if (XLC.d && XLC.b === BASE && Date.now() - XLC.t < TTL) all = XLC.d;       // alla kategorier hämtas en gång per timme
    else { all = []; for (const c of XL_CATS) { try { all = all.concat(await xlKategori(page, BASE + c)); } catch (e) {} } if (all.length) Object.assign(XLC, { d: all, t: Date.now(), b: BASE }); }
    const dim = (q.match(/(\d+)\s*x\s*(\d+)/) || []);
    if (!dim.length) return [];
    const re = new RegExp('(^|\\D)(' + dim[1] + '\\s*[x×]\\s*' + dim[2] + '|' + dim[2] + '\\s*[x×]\\s*' + dim[1] + ')(\\D|$)', 'i');
    return all.filter(p => re.test(p.name)).map(p => {
      let { price, unit } = p;
      if (unit !== 'm') { const L = lenOf(p.name); if (L && (unit === 'st' || unit === 'styck')) { price = Math.round(price / L * 100) / 100; unit = 'm'; } }
      return { name: p.name, price, unit, url: p.url };
    });
  } finally { await ctx.close(); }
}

async function pris(q, butik) {
  butik = STORE_URL[butik] ? butik : 'Byggmax';
  const ck = butik + '|' + q, hit = CACHE.get(ck);
  if (hit && Date.now() - hit.t < TTL) return { ...hit.d, cached: true };
  const job = QUEUE.then(() => (butik === 'XL-BYGG Kiruna' ? hamtaXL : hamta)(q, STORE_URL[butik]));          // en sökning i taget
  QUEUE = job.catch(() => {});
  const d = { q, butik, hamtad: new Date().toISOString(), produkter: await job };
  if (d.produkter.length) CACHE.set(ck, { t: Date.now(), d });
  return d;
}


/* ---------- Konton och sparade ritningar (filer i data/) ---------- */
const DATA = path.join(ROOT, 'data'); fs.mkdirSync(path.join(DATA, 'ritningar'), { recursive: true });
const UF = path.join(DATA, 'users.json'), SF = path.join(DATA, 'sessions.json');
const readJ = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return d; } };
const writeJ = (f, o) => { fs.writeFileSync(f + '.tmp', JSON.stringify(o)); fs.renameSync(f + '.tmp', f); };
const HF = path.join(DATA, 'shares.json');
let USERS = readJ(UF, {}), SESS = readJ(SF, {}), SHARES = readJ(HF, {});
if (Object.keys(USERS).length && !Object.values(USERS).some(u => u.admin)) { USERS[Object.keys(USERS)[0]].admin = true; writeJ(UF, USERS); }
const NAME_RE = /^[a-z0-9_-]{3,30}$/, WEEK = 30 * 24 * 3600 * 1000, TRIES = new Map();
const hash = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString('hex');
const dfile = u => path.join(DATA, 'ritningar', u + '.json');
const loadD = u => { const o = readJ(dfile(u), {}); return Object.assign(Object.create(null), o); };
const isHttps = req => PUBLIC || (req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
const ipOf = req => PUBLIC ? String(req.headers['cf-connecting-ip'] || (req.headers['x-forwarded-for'] || '').split(',')[0] || req.socket.remoteAddress || '').trim() : (req.socket.remoteAddress || '');
function newSession(u, res, req) {
  const t = crypto.randomBytes(32).toString('hex'); SESS[t] = { u, exp: Date.now() + WEEK }; writeJ(SF, SESS);
  res.setHeader('set-cookie', 'sk=' + t + '; HttpOnly; SameSite=Strict; Path=/; Max-Age=' + WEEK / 1000 + (isHttps(req) ? '; Secure' : ''));
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
  const p = u.pathname, ip = ipOf(req);
  if (p === '/api/me') { const w = who(req); return send(res, 200, { user: w, admin: !!(w && USERS[w] && USERS[w].admin) }); }
  if (p === '/api/logout' && req.method === 'POST') {
    const m = (req.headers.cookie || '').match(/sk=([a-f0-9]{64})/); if (m) { delete SESS[m[1]]; writeJ(SF, SESS); }
    res.setHeader('set-cookie', 'sk=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' + (isHttps(req) ? '; Secure' : '')); return send(res, 200, { ok: 1 });
  }
  if ((p === '/api/login' || p === '/api/register') && req.method === 'POST') {
    if (limited(ip)) return send(res, 429, { fel: 'För många försök. Vänta 10 minuter.' });
    const b = await body(req), n = String(b.user || '').trim().toLowerCase(), pw = String(b.pw || '');
    if (p === '/api/register') {
      if (PUBLIC && Object.keys(USERS).length && process.env.ALLOW_REGISTER !== '1') return send(res, 403, { fel: 'Registrering är stängd. Be administratören skapa ditt konto.' });
      if (!NAME_RE.test(n)) return send(res, 400, { fel: 'Användarnamn: 3–30 tecken, a–z, 0–9, _ och -.' });
      if (pw.length < 6 || pw.length > 200) return send(res, 400, { fel: 'Lösenordet måste vara minst 6 tecken.' });
      if (USERS[n]) return send(res, 409, { fel: 'Användarnamnet är upptaget.' });
      const salt = crypto.randomBytes(16).toString('hex'); const first = !Object.keys(USERS).length; USERS[n] = { salt, hash: hash(pw, salt) }; if (first) USERS[n].admin = true; writeJ(UF, USERS);
      newSession(n, res, req); return send(res, 200, { user: n, admin: !!USERS[n].admin });
    }
    const us = NAME_RE.test(n) && USERS[n], h = hash(pw, us ? us.salt : '00'.repeat(16));
    if (!us || !crypto.timingSafeEqual(Buffer.from(h), Buffer.from(us.hash))) { TRIES.get(ip).push(Date.now()); return send(res, 401, { fel: 'Fel användarnamn eller lösenord.' }); }
    newSession(n, res, req); return send(res, 200, { user: n, admin: !!us.admin });
  }
  let sm = p.match(/^\/api\/delad\/([a-f0-9]{24})$/);
  if (sm && req.method === 'GET') {                       // publik, skrivskyddad
    const sh = SHARES[sm[1]]; if (!sh) return send(res, 404, { fel: 'Länken finns inte eller har tagits bort.' });
    const d = loadD(sh.owner)[sh.name]; if (!d) return send(res, 404, { fel: 'Ritningen finns inte längre.' });
    return send(res, 200, { name: sh.name, data: d });
  }
  const w = who(req); if (!w) return send(res, 401, { fel: 'Inte inloggad.' });
  const adm = !!(USERS[w] && USERS[w].admin);
  if (p === '/api/ritningar' && req.method === 'GET') {
    const d = loadD(w);
    if (adm) for (const o of Object.keys(USERS)) if (o !== w) { const x = loadD(o); for (const k of Object.keys(x)) d[o + '/' + k] = x[k]; }
    return send(res, 200, d);
  }
  const m = p.match(/^\/api\/ritningar\/(.+)$/);
  if (m) {
    let name = decodeURIComponent(m[1]).slice(0, 80), owner = w;
    const t = name.match(/^([a-z0-9_-]{3,30})\/(.+)$/);
    if (adm && t && USERS[t[1]] && t[1] !== w) { owner = t[1]; name = t[2].slice(0, 60); } else name = name.slice(0, 60);
    const d = loadD(owner);
    if (!name.trim()) return send(res, 400, { fel: 'Namn saknas.' });
    if (req.method === 'PUT') { const b = await body(req); if (!b || typeof b !== 'object' || !b.f) return send(res, 400, { fel: 'Ogiltig ritning.' });
      if (Object.keys(d).length >= 200 && !(name in d)) return send(res, 400, { fel: 'För många sparade ritningar.' });
      d[name] = b; writeJ(dfile(owner), d); return send(res, 200, { ok: 1 }); }
    if (req.method === 'DELETE') { delete d[name]; writeJ(dfile(owner), d); return send(res, 200, { ok: 1 }); }
  }
  if (p === '/api/dela' && req.method === 'GET') {
    return send(res, 200, Object.entries(SHARES).filter(([, v]) => adm || v.owner === w).map(([t, v]) => ({ token: t, owner: v.owner, name: v.name })));
  }
  if (p === '/api/dela' && req.method === 'POST') {
    const b = await body(req); let name = String(b.name || '').slice(0, 80), owner = w;
    const t = name.match(/^([a-z0-9_-]{3,30})\/(.+)$/);
    if (adm && t && USERS[t[1]] && t[1] !== w) { owner = t[1]; name = t[2].slice(0, 60); }
    if (!(name in loadD(owner))) return send(res, 404, { fel: 'Spara ritningen först, sedan kan du dela den.' });
    let tok = Object.keys(SHARES).find(k => SHARES[k].owner === owner && SHARES[k].name === name);
    if (!tok) { tok = crypto.randomBytes(12).toString('hex'); SHARES[tok] = { owner, name, skapad: new Date().toISOString() }; writeJ(HF, SHARES); }
    return send(res, 200, { token: tok });
  }
  sm = p.match(/^\/api\/dela\/([a-f0-9]{24})$/);
  if (sm && req.method === 'DELETE') {
    const x = SHARES[sm[1]]; if (!x) return send(res, 404, { fel: 'Länken finns inte.' });
    if (x.owner !== w && !adm) return send(res, 403, { fel: 'Inte din länk.' });
    delete SHARES[sm[1]]; writeJ(HF, SHARES); return send(res, 200, { ok: 1 });
  }
  const am = p.match(/^\/api\/admin\/([a-z]+)(?:\/([a-z0-9_-]{3,30}))?$/);
  if (am) {
    if (!adm) return send(res, 403, { fel: 'Bara administratörer.' });
    const [, act, tu] = am;
    if (act === 'create' && req.method === 'POST' && !tu) {
      const b = await body(req), n = String(b.user || '').trim().toLowerCase(), pw = String(b.pw || '');
      if (!NAME_RE.test(n)) return send(res, 400, { fel: 'Användarnamn: 3–30 tecken, a–z, 0–9, _ och -.' });
      if (pw.length < 6 || pw.length > 200) return send(res, 400, { fel: 'Lösenordet måste vara minst 6 tecken.' });
      if (USERS[n]) return send(res, 409, { fel: 'Användarnamnet är upptaget.' });
      const salt = crypto.randomBytes(16).toString('hex'); USERS[n] = { salt, hash: hash(pw, salt), admin: !!b.admin }; writeJ(UF, USERS);
      return send(res, 200, { ok: 1 });
    }
    if (act === 'users' && req.method === 'GET' && !tu)
      return send(res, 200, Object.keys(USERS).map(u => ({ user: u, admin: !!USERS[u].admin, antal: Object.keys(loadD(u)).length, namn: Object.keys(loadD(u)) })));
    if (!tu || !USERS[tu]) return send(res, 404, { fel: 'Användaren finns inte.' });
    if (act === 'admin' && req.method === 'POST') {
      const b = await body(req);
      if (tu === w && !b.admin) return send(res, 400, { fel: 'Du kan inte ta bort din egen adminrätt.' });
      USERS[tu].admin = !!b.admin; writeJ(UF, USERS); return send(res, 200, { ok: 1 });
    }
    if (act === 'pw' && req.method === 'POST') {
      const b = await body(req), pw = String(b.pw || '');
      if (pw.length < 6 || pw.length > 200) return send(res, 400, { fel: 'Lösenordet måste vara minst 6 tecken.' });
      const salt = crypto.randomBytes(16).toString('hex'); USERS[tu].salt = salt; USERS[tu].hash = hash(pw, salt); writeJ(UF, USERS);
      for (const k of Object.keys(SESS)) if (SESS[k].u === tu && tu !== w) delete SESS[k]; writeJ(SF, SESS);
      return send(res, 200, { ok: 1 });
    }
    if (act === 'delete' && req.method === 'POST') {
      if (tu === w) return send(res, 400, { fel: 'Du kan inte ta bort dig själv.' });
      delete USERS[tu]; writeJ(UF, USERS); for (const k of Object.keys(SHARES)) if (SHARES[k].owner === tu) delete SHARES[k]; writeJ(HF, SHARES); try { fs.unlinkSync(dfile(tu)); } catch (e) {}
      for (const k of Object.keys(SESS)) if (SESS[k].u === tu) delete SESS[k]; writeJ(SF, SESS);
      return send(res, 200, { ok: 1 });
    }
  }
  return send(res, 404, { fel: 'Okänd adress.' });
}

/* ---------- Säkerhetskopia: en datumstämplad kopia per dygn, 14 dagar sparas ---------- */
function backup() {
  try {
    const dir = path.join(DATA, 'backup'), day = new Date().toISOString().slice(0, 10), to = path.join(dir, day);
    if (fs.existsSync(to)) return;
    fs.mkdirSync(to, { recursive: true });
    for (const f of ['users.json', 'shares.json']) if (fs.existsSync(path.join(DATA, f))) fs.copyFileSync(path.join(DATA, f), path.join(to, f));
    fs.cpSync(path.join(DATA, 'ritningar'), path.join(to, 'ritningar'), { recursive: true });
    fs.readdirSync(dir).filter(n => /^\d{4}-\d{2}-\d{2}$/.test(n)).sort().slice(0, -14).forEach(n => fs.rmSync(path.join(dir, n), { recursive: true, force: true }));
    console.log('Säkerhetskopia sparad: data/backup/' + day);
  } catch (e) { console.error('Säkerhetskopian misslyckades:', e.message); }
}
backup(); setInterval(backup, 3600 * 1000).unref();

const srv = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname.startsWith('/api/') && u.pathname !== '/api/pris' && u.pathname !== '/api/ping') {
    try { return await konto(req, res, u); } catch (e) { return send(res, 400, { fel: String(e.message || e) }); }
  }
  if (u.pathname === '/api/pris') {
    if (PUBLIC && !who(req)) return send(res, 401, { fel: 'Logga in för att hämta priser.' });
    const q = (u.searchParams.get('q') || '').trim().slice(0, 100);
    res.setHeader('content-type', 'application/json; charset=utf-8');
    if (!q) { res.statusCode = 400; return res.end('{"fel":"saknar q"}'); }
    try { res.end(JSON.stringify(await pris(q, u.searchParams.get('butik') || 'Byggmax'))); }
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
