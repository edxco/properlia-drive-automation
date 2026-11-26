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
  assert.equal(C.version, '2026.1');
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
