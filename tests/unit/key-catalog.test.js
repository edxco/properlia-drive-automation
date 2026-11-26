// T1 — Integridad del catálogo institucional de claves (KeyCatalog.js).
// Los valores esperados son los aprobados en el reporte de la Fase 2.1 (sección A, D-01 a D-13).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGas } = require('../helpers/gas-loader');

const { KEY_CATALOG: C } = loadGas(['00_config/KeyCatalog.js']);

// Los objetos vienen de otro contexto vm: se comparan por JSON.
const json = (v) => JSON.stringify(v);
const pairs = (list) => json(list.map((x) => [x.code, x.name]));
const codes = (list) => list.map((x) => x.code);

test('versión y fecha de aprobación', () => {
  assert.equal(C.version, '2026.2');
  assert.equal(C.approvedOn, '2026-11-26');
});

test('formato: 4 segmentos separados por guion; sufijo desde -02, con autorización', () => {
  assert.equal(json(C.format.segments), json(['origin', 'operation', 'type', 'zone']));
  assert.equal(C.format.separator, '-');
  assert.equal(C.format.suffix.firstDuplicate, 2);
  assert.equal(C.format.suffix.digits, 2);
  assert.equal(C.format.suffix.max, 99);
  assert.equal(C.format.suffix.requiresAuthorization, true);
});

test('orígenes aprobados: PR, KW, AE', () => {
  assert.equal(pairs(C.origins), json([
    ['PR', 'Properlia'], ['KW', 'Keller Williams'], ['AE', 'Asesor externo']
  ]));
});

test('operaciones de clave: solo LV y LA; LC y CR excluidas', () => {
  assert.equal(json(codes(C.operations)), json(['LV', 'LA']));
  assert.equal(json(C.excludedOperations), json(['LC', 'CR']));
  for (const x of C.excludedOperations) assert.ok(!codes(C.operations).includes(x));
});

test('Preventa no es código: Preventa y Venta producen LV, Renta produce LA', () => {
  const m = Object.fromEntries(C.modalities.map((x) => [x.name, x.operation]));
  assert.equal(json(m), json({ Preventa: 'LV', Venta: 'LV', Renta: 'LA' }));
  assert.ok(!codes(C.operations).includes('PRE'));
  for (const x of C.modalities) assert.ok(codes(C.operations).includes(x.operation), x.name);
});

test('tipos aprobados, incluidos BONA y CMED nuevos', () => {
  assert.equal(pairs(C.types), json([
    ['DEP', 'Departamento'], ['CASA', 'Casa'], ['TER', 'Terreno'], ['LOC', 'Local comercial'],
    ['BONA', 'Bodega o nave'], ['CMED', 'Consultorio'], ['OF', 'Oficina']
  ]));
  const nuevos = C.types.filter((t) => t.since === '2026.1').map((t) => t.code);
  assert.equal(json(nuevos), json(['BONA', 'CMED']));
});

test('IND reservado para Industrial y no asignado a ninguna opción', () => {
  assert.ok(!codes(C.types).includes('IND'));
  assert.equal(json(codes(C.reservedTypeCodes)), json(['IND']));
  const bona = C.types.find((t) => t.name === 'Bodega o nave');
  assert.equal(bona.code, 'BONA');
});

test('las 13 zonas del Manual, sin agregados', () => {
  assert.equal(pairs(C.zones), json([
    ['ZAV', 'Zavaleta'], ['ATL', 'Atlixco'], ['BAR', 'El Barreal'], ['TLAX', 'Tlaxcalancingo'],
    ['UDL', 'Zona UDLAP'], ['CHL', 'Cholula'], ['SACH', 'San Andrés Cholula'],
    ['CUAU', 'Cuautlancingo'], ['SON', 'Sonata'], ['LMS', 'Lomas de Angelópolis'],
    ['ANG', 'Angelópolis'], ['CEN', 'Centro'], ['SJO', 'San José']
  ]));
});

test('códigos y valores de formulario únicos dentro de cada catálogo', () => {
  for (const name of ['origins', 'operations', 'types', 'zones']) {
    const cs = codes(C[name]);
    assert.equal(new Set(cs).size, cs.length, `códigos repetidos en ${name}`);
  }
  for (const name of ['origins', 'modalities', 'types', 'zones']) {
    const vs = C[name].map((x) => x.formValue.toLowerCase());
    assert.equal(new Set(vs).size, vs.length, `formValue repetido en ${name}`);
  }
});

test('todos los códigos son mayúsculas A-Z de 2 a 4 letras, sin el separador', () => {
  const all = ['origins', 'operations', 'types', 'zones'].flatMap((n) => codes(C[n]));
  for (const c of all) assert.match(c, /^[A-Z]{2,4}$/, c);
});

test('cada modalidad, tipo, origen y zona tiene valor de formulario no vacío', () => {
  for (const name of ['origins', 'modalities', 'types', 'zones']) {
    for (const x of C[name]) assert.ok(x.formValue && x.formValue.trim() === x.formValue, `${name}: ${x.name}`);
  }
});

test('campos que nunca participan en la clave', () => {
  for (const f of ['precio', 'fecha', 'anio', 'estatus', 'asesor', 'comision', 'prioridad', 'etapa', 'modalidad']) {
    assert.ok(C.keyIgnoredFields.includes(f), f);
  }
});

test('el catálogo es inmutable en tiempo de ejecución', () => {
  assert.ok(Object.isFrozen(C));
  assert.ok(Object.isFrozen(C.types));
  assert.ok(Object.isFrozen(C.types[0]));
  assert.ok(Object.isFrozen(C.format.suffix));
});

// ---------- T6: versión 2026.2 — IDs del formulario (G-4) y comercialización simultánea (G-6) ----------

const ids = (list) => json(list.map((x) => [x.code || x.name, x.formOptionId]));

test('historial de versiones: 2026.1 y 2026.2, la última coincide con la versión', () => {
  assert.equal(json(C.changelog.map((c) => c.version)), json(['2026.1', '2026.2']));
  assert.equal(C.changelog[C.changelog.length - 1].version, C.version);
});

test('IDs de tipos según la especificación (G-4)', () => {
  assert.equal(ids(C.types), json([
    ['DEP', '0221da24-d7df-4052-a63d-2d16501ec360'], ['CASA', '6431658b-1ebc-4805-ac61-97bf39699353'],
    ['TER', '23d3905f-a5c1-4372-995e-362b2c10f77f'], ['LOC', '044af3c1-7cea-4ec5-86e7-07b10afdb147'],
    ['BONA', '37beb05a-ff6a-4138-8959-c2c9be60e6f5'], ['CMED', '7f91886c-4822-4a9d-9f44-867c8702951b'],
    ['OF', '1b89a6d4-83e3-4c55-9852-64f33060d034']
  ]));
});

test('IDs de modalidades confirmados por el usuario (G-4)', () => {
  assert.equal(ids(C.modalities), json([
    ['Preventa', 'a7f8e2d1-3c4b-5a6e-9f8d-7c1b2a3e4f5d'],
    ['Venta', 'b8e9f3d2-4c5a-6b7e-0f9e-8d2c3b4e5f6a'],
    ['Renta', 'c9f0e4d3-5c6b-7a8e-1f0e-9d3c4b5e6f7b']
  ]));
});

test('IDs consecutivos de origen y zona, en el orden del catálogo', () => {
  C.origins.forEach((o, i) => assert.equal(o.formOptionId, `origen-${String(i + 1).padStart(2, '0')}`));
  C.zones.forEach((z, i) => assert.equal(z.formOptionId, `zona-${String(i + 1).padStart(2, '0')}`));
  assert.equal(C.zones.find((z) => z.code === 'SJO').formOptionId, 'zona-13');
});

test('todos los IDs de formulario existen y son únicos en todo el catálogo', () => {
  const all = ['origins', 'modalities', 'types', 'zones'].flatMap((n) => C[n].map((x) => x.formOptionId));
  assert.ok(all.every((x) => typeof x === 'string' && x.length > 0));
  assert.equal(new Set(all.map((x) => x.toLowerCase())).size, all.length);
});

test('regla de comercialización simultánea: se registra como Venta (LV)', () => {
  assert.equal(C.simultaneousOffer.registerAs, 'Venta');
  assert.equal(C.simultaneousOffer.operation, 'LV');
  const venta = C.modalities.find((m) => m.name === C.simultaneousOffer.registerAs);
  assert.equal(venta.operation, C.simultaneousOffer.operation);
});
