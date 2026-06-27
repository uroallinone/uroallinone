/* ============================================================
   Uro All Around — backend server
   Pure Node (no external deps) + built-in node:sqlite.
   - Serves the static app from ./public
   - Persists the dataset to a real SQLite database (./uro.db)

   API:
     GET  /api/data  -> { items, txns, equipment, _updatedAt, _by }
     PUT  /api/data  <- { items, txns, equipment, _by, _updatedAt }
   Run with: node --experimental-sqlite server.js
============================================================ */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DB_PATH = path.join(__dirname, 'uro.db');

/* ---------------- database ---------------- */
const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS items     (code  TEXT PRIMARY KEY, json TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS txns      (id    TEXT PRIMARY KEY, json TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS equipment (eq_no TEXT PRIMARY KEY, json TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS po        (od_no TEXT PRIMARY KEY, json TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS meta      (key   TEXT PRIMARY KEY, value TEXT);
`);

// Each collection keeps one row per record (full JSON), in client array order
// (rowid order), so the whole-dataset round-trip is loss-free.
const COLLECTIONS = {
  items:     { table: 'items',     key: 'code'  },
  txns:      { table: 'txns',      key: 'id'    },
  equipment: { table: 'equipment', key: 'eq_no' },
  po:        { table: 'po',        key: 'od_no' },
};

function readData() {
  const out = {};
  for (const [name, c] of Object.entries(COLLECTIONS)) {
    const rows = db.prepare(`SELECT json FROM ${c.table} ORDER BY rowid`).all();
    out[name] = rows.map(r => JSON.parse(r.json));
  }
  const meta = {};
  for (const r of db.prepare('SELECT key, value FROM meta').all()) meta[r.key] = r.value;
  out._updatedAt = Number(meta._updatedAt) || 0;
  out._by = meta._by || '';
  return out;
}

const writeData = (data) => {
  // node:sqlite has no .transaction() helper; wrap the whole replace manually.
  db.exec('BEGIN');
  try {
    for (const [name, c] of Object.entries(COLLECTIONS)) {
      db.exec(`DELETE FROM ${c.table}`);
      const arr = Array.isArray(data[name]) ? data[name] : [];
      const ins = db.prepare(`INSERT OR REPLACE INTO ${c.table} (${c.key}, json) VALUES (?, ?)`);
      arr.forEach((rec, i) => {
        const id = rec[c.key] != null && rec[c.key] !== ''
          ? String(rec[c.key])
          : `${c.key}-auto-${i}`;
        ins.run(id, JSON.stringify(rec));
      });
    }
    const setMeta = db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)');
    setMeta.run('_updatedAt', String(data._updatedAt || Date.now()));
    setMeta.run('_by', String(data._by || ''));
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
};

/* ---------------- static file serving ---------------- */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.jsx':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2':'font/woff2',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
  const full = path.normalize(path.join(PUBLIC_DIR, urlPath));
  if (!full.startsWith(PUBLIC_DIR)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(full, (err, buf) => {
    if (err) {
      // SPA fallback so deep links still load the app
      fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (e2, idx) => {
        if (e2) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'content-type': MIME['.html'] });
        res.end(idx);
      });
      return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(full).toLowerCase()] || 'application/octet-stream' });
    res.end(buf);
  });
}

/* ---------------- request router ---------------- */
function sendJson(res, code, obj) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  if (url === '/api/data') {
    if (req.method === 'GET') {
      try { sendJson(res, 200, readData()); }
      catch (e) { sendJson(res, 500, { error: e.message }); }
      return;
    }
    if (req.method === 'PUT' || req.method === 'POST') {
      let body = '';
      req.on('data', c => { body += c; if (body.length > 25e6) req.destroy(); });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          writeData(data);
          sendJson(res, 200, { ok: true, _updatedAt: data._updatedAt || Date.now() });
        } catch (e) { sendJson(res, 400, { error: e.message }); }
      });
      return;
    }
    res.writeHead(405); res.end('Method Not Allowed');
    return;
  }

  if (url === '/api/health') { sendJson(res, 200, { ok: true, db: DB_PATH }); return; }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  const counts = readData();
  console.log(`Uro All Around running at http://localhost:${PORT}`);
  console.log(`Database: ${DB_PATH}  (items=${counts.items.length}, txns=${counts.txns.length}, equipment=${counts.equipment.length})`);
});
