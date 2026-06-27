/* Build step: unpack the Claude-design bundle into an editable static site.
   - vendor libs (React, ReactDOM, Babel) -> public/vendor/
   - app source (text/babel modules)      -> public/app/
   - fonts (woff2)                         -> public/assets/
   - rewrites the HTML template to point at those local files, and swaps the
     Firebase sync module for our own server-backed store (public/app/uro-store.js,
     written separately). */
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const SRC_HTML = 'URO All Around (deploy) (1).html';
const OUT = 'public';

// Known module roles (by bundle UUID).
const VENDOR = {
  '195b238b-822d-4b99-9220-e9f9bf612294': 'vendor/react.js',
  '5d05290a-214b-4a45-a3b0-557b114a0658': 'vendor/react-dom.js',
  '6c94fd73-a270-46ac-875d-92a09cdf48ff': 'vendor/babel.js',
};
// text/babel app modules, in load order. UroCloud is replaced by our own store.
const APP = {
  'aa465547-8774-4889-a938-d82baf73c581': 'app/tweaks-panel.jsx',
  '6d2151cd-3106-4b36-bf61-0c2d97c30756': null, // UroCloud (Firebase) -> replaced
  '3971d5c3-ad22-4224-b52c-a36dc2e748e3': 'app/data.jsx',
  '446c1819-1748-46e2-85dd-38e5a217c3b9': 'app/ui-shell.jsx',
  '813f87dc-4914-460c-9002-5bacfb26ff9f': 'app/screens.jsx',
  '4fbad666-793a-40a9-928a-3349ab67c231': 'app/main.jsx',
};
const STORE_REPLACEMENT = 'app/uro-store.js';

const html = fs.readFileSync(SRC_HTML, 'utf8');
const manifest = JSON.parse(
  html.match(/<script type="__bundler\/manifest">\s*([\s\S]*?)\s*<\/script>/)[1]
);
let template = JSON.parse(
  html.match(/<script type="__bundler\/template">\s*([\s\S]*?)\s*<\/script>/)[1]
);

function decode(info) {
  let buf = Buffer.from(info.data, 'base64');
  if (info.compressed) buf = zlib.gunzipSync(buf);
  return buf;
}
function writeOut(rel, buf) {
  const full = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, buf);
}

fs.rmSync(OUT, { recursive: true, force: true });

let fonts = 0, vendor = 0, app = 0;
for (const [id, info] of Object.entries(manifest)) {
  const buf = decode(info);
  if (VENDOR[id]) { writeOut(VENDOR[id], buf); vendor++; }
  else if (id in APP) { if (APP[id]) { writeOut(APP[id], buf); app++; } }
  else if ((info.mime || '').includes('woff')) {
    writeOut('assets/' + id + '.woff2', buf);
    // fonts are referenced in the template CSS as url("<id>")
    template = template.split('url("' + id + '")').join('url("/assets/' + id + '.woff2")');
    fonts++;
  }
}

// Rewrite vendor + app <script> tags (drop integrity/crossorigin; point at files).
function replaceScript(id, newTag) {
  const re = new RegExp('<script[^>]*src="' + id + '"[^>]*></script>');
  if (!re.test(template)) throw new Error('script tag not found for ' + id);
  template = template.replace(re, newTag);
}
for (const [id, rel] of Object.entries(VENDOR)) {
  replaceScript(id, '<script src="/' + rel + '"></script>');
}
for (const [id, rel] of Object.entries(APP)) {
  const target = rel || STORE_REPLACEMENT;
  replaceScript(id, '<script type="text/babel" src="/' + target + '"></script>');
}

// Copy our server-backed store into place (canonical source lives in store/).
writeOut(STORE_REPLACEMENT, fs.readFileSync('store/uro-store.js'));

writeOut('index.html', Buffer.from(template, 'utf8'));
console.log('Built public/ ->', { vendor, app, fonts, replacedStore: STORE_REPLACEMENT });
