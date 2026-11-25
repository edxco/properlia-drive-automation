#!/usr/bin/env node
// Verifica sintaxis de todos los .js de src/ y que appsscript.json sea JSON válido.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const srcDir = path.resolve(__dirname, '..', 'src');
let errors = 0;

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (name.endsWith('.js')) {
      try { new vm.Script(fs.readFileSync(full, 'utf8'), { filename: full }); }
      catch (e) { errors++; console.error(`[check] ${path.relative(srcDir, full)}: ${e.message}`); }
    }
  }
}
walk(srcDir);

const manifest = JSON.parse(fs.readFileSync(path.join(srcDir, 'appsscript.json'), 'utf8'));
const scopes = manifest.oauthScopes || [];
const FORBIDDEN = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets'];
for (const s of scopes) {
  if (FORBIDDEN.includes(s)) { errors++; console.error(`[check] Scope amplio no permitido en esta fase: ${s}`); }
}
if (manifest.webapp && manifest.webapp.access !== 'MYSELF') {
  errors++; console.error('[check] webapp.access debe ser MYSELF en TEST.');
}

if (errors) { console.error(`[check] ${errors} error(es).`); process.exit(1); }
console.log('[check] Sintaxis y manifiesto OK.');
