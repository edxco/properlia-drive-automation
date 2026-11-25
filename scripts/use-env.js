#!/usr/bin/env node
// Activa un entorno copiando config/clasp.<env>.json -> .clasp.json
// En esta fase solo existe TEST. PROD queda bloqueado por diseño.
const fs = require('fs');
const path = require('path');

const env = (process.argv[2] || '').toLowerCase();
const ALLOWED = ['test'];

if (!ALLOWED.includes(env)) {
  console.error(`[use-env] Entorno "${env}" no permitido. Entornos habilitados: ${ALLOWED.join(', ')}.`);
  process.exit(1);
}

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'config', `clasp.${env}.json`);
const dest = path.join(root, '.clasp.json');

if (!fs.existsSync(src)) {
  console.error(`[use-env] No existe ${path.relative(root, src)}.`);
  process.exit(1);
}

const cfg = JSON.parse(fs.readFileSync(src, 'utf8'));
if (!cfg.scriptId || /REEMPLAZAR|NO_CONFIGURADO/.test(cfg.scriptId)) {
  console.error('[use-env] scriptId sin configurar en ' + path.relative(root, src) + '. Ver docs/FLUJO-CLASP.md.');
  process.exit(1);
}
if (cfg.rootDir !== 'src') {
  console.error('[use-env] rootDir debe ser "src".');
  process.exit(1);
}

fs.writeFileSync(dest, JSON.stringify({ scriptId: cfg.scriptId, rootDir: 'src' }, null, 2) + '\n');
console.log(`[use-env] Entorno activo: ${env.toUpperCase()} (scriptId ${cfg.scriptId.slice(0, 8)}...)`);
