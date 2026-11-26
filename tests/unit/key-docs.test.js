// T5 — docs/CLAVES.md debe ser idéntico a lo que genera el catálogo.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { buildMarkdown, loadCatalog, OUT } = require('../../scripts/build-key-docs');

const C = loadCatalog();
const md = buildMarkdown(C);

test('docs/CLAVES.md existe y coincide exactamente con el catálogo', () => {
  assert.ok(fs.existsSync(OUT), 'falta docs/CLAVES.md: ejecuta npm run docs:keys');
  assert.equal(fs.readFileSync(OUT, 'utf8'), md, 'docs/CLAVES.md desactualizado: ejecuta npm run docs:keys');
});

test('incluye versión y todos los códigos del catálogo', () => {
  assert.ok(md.includes(`**${C.version}**`));
  for (const list of [C.origins, C.operations, C.types, C.zones, C.reservedTypeCodes]) {
    for (const x of list) assert.ok(md.includes('`' + x.code + '`'), x.code);
  }
  for (const m of C.modalities) assert.ok(md.includes(`| ${m.formValue} | \`${m.operation}\``), m.formValue);
});

test('marca BONA y CMED como nuevos e IND como reservado', () => {
  assert.match(md, /\| `BONA` \| Bodega o nave \| Bodega o nave \| Nuevo en 2026\.1 \|/);
  assert.match(md, /\| `CMED` \| Consultorio \| Consultorio \| Nuevo en 2026\.1 \|/);
  assert.match(md, /\| `IND` \| Industrial \|/);
});

test('la generación es determinista', () => {
  assert.equal(buildMarkdown(loadCatalog()), md);
});

test('un cambio en el catálogo cambia el documento (la prueba detecta desincronización)', () => {
  const alterado = JSON.parse(JSON.stringify(C));
  alterado.zones.push({ code: 'TST', name: 'Zona de prueba', formValue: 'Zona de prueba' });
  assert.notEqual(buildMarkdown(alterado), md);
});
