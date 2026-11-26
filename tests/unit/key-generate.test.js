// T2 — generatePropertyKey: generación y validación de entradas. Solo datos ficticios.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGas } = require('../helpers/gas-loader');

const ctx = loadGas(['00_config/KeyCatalog.js', '04_services/PropertyKey.js']);
const gen = ctx.generatePropertyKey;
const C = ctx.KEY_CATALOG;

const base = { origen: 'Properlia', modalidad: 'Venta', tipo: 'Casa', zona: 'Zavaleta' };
const errCodes = (r) => r.errors.map((e) => e.code);
const json = (v) => JSON.stringify(v);
const KEY_RE = /^(PR|KW|AE)-(LV|LA)-(DEP|CASA|TER|LOC|BONA|CMED|OF)-(ZAV|ATL|BAR|TLAX|UDL|CHL|SACH|CUAU|SON|LMS|ANG|CEN|SJO)$/;

function assertRejected(r, code, field) {
  assert.equal(r.ok, false);
  assert.equal(r.key, null, 'no debe haber clave parcial');
  assert.equal(r.components, null);
  assert.ok(errCodes(r).includes(code), `esperaba ${code}, obtuvo ${errCodes(r)}`);
  if (field) assert.ok(r.errors.some((e) => e.code === code && e.field === field));
}

// ---------- Casos válidos ----------

test('cada origen (por nombre y por código)', () => {
  for (const o of C.origins) {
    assert.equal(gen({ ...base, origen: o.formValue }).key, `${o.code}-LV-CASA-ZAV`);
    assert.equal(gen({ ...base, origen: o.code }).key, `${o.code}-LV-CASA-ZAV`);
  }
});

test('cada modalidad: Preventa y Venta producen LV, Renta produce LA', () => {
  assert.equal(gen({ ...base, modalidad: 'Preventa' }).key, 'PR-LV-CASA-ZAV');
  assert.equal(gen({ ...base, modalidad: 'Venta' }).key, 'PR-LV-CASA-ZAV');
  assert.equal(gen({ ...base, modalidad: 'Renta' }).key, 'PR-LA-CASA-ZAV');
  assert.equal(gen({ ...base, modalidad: 'Preventa' }).modality, 'Preventa');
});

test('cada operación institucional por código (LV, LA)', () => {
  assert.equal(gen({ ...base, modalidad: 'LV' }).key, 'PR-LV-CASA-ZAV');
  assert.equal(gen({ ...base, modalidad: 'LA' }).key, 'PR-LA-CASA-ZAV');
  assert.equal(gen({ ...base, modalidad: 'LA' }).modality, null);
});

test('cada tipo de propiedad aprobado', () => {
  const esperado = {
    Departamento: 'DEP', Casa: 'CASA', Terreno: 'TER', 'Local comercial': 'LOC',
    'Bodega o nave': 'BONA', Consultorio: 'CMED', Oficina: 'OF'
  };
  for (const [tipo, code] of Object.entries(esperado)) {
    const r = gen({ ...base, tipo });
    assert.equal(r.ok, true, tipo);
    assert.equal(r.key, `PR-LV-${code}-ZAV`);
  }
});

test('cada una de las 13 zonas del Manual', () => {
  for (const z of C.zones) {
    assert.equal(gen({ ...base, zona: z.formValue }).key, `PR-LV-CASA-${z.code}`, z.name);
    assert.equal(gen({ ...base, zona: z.code }).key, `PR-LV-CASA-${z.code}`, z.code);
  }
});

test('los 14 ejemplos aprobados en el reporte (sección D)', () => {
  const casos = [
    ['Properlia', 'Venta', 'Casa', 'Zavaleta', 'PR-LV-CASA-ZAV'],
    ['Properlia', 'Renta', 'Casa', 'Zona UDLAP', 'PR-LA-CASA-UDL'],
    ['Keller Williams', 'Venta', 'Terreno', 'Atlixco', 'KW-LV-TER-ATL'],
    ['Asesor externo', 'Renta', 'Local comercial', 'Sonata', 'AE-LA-LOC-SON'],
    ['Properlia', 'Preventa', 'Bodega o nave', 'Cuautlancingo', 'PR-LV-BONA-CUAU'],
    ['Keller Williams', 'Venta', 'Consultorio', 'Zavaleta', 'KW-LV-CMED-ZAV'],
    ['Properlia', 'Preventa', 'Departamento', 'Lomas de Angelópolis', 'PR-LV-DEP-LMS'],
    ['Asesor externo', 'Venta', 'Oficina', 'Centro', 'AE-LV-OF-CEN'],
    ['Keller Williams', 'Renta', 'Departamento', 'Angelópolis', 'KW-LA-DEP-ANG'],
    ['Asesor externo', 'Venta', 'Terreno', 'San Andrés Cholula', 'AE-LV-TER-SACH'],
    ['Properlia', 'Renta', 'Oficina', 'Cholula', 'PR-LA-OF-CHL'],
    ['Keller Williams', 'Venta', 'Local comercial', 'Tlaxcalancingo', 'KW-LV-LOC-TLAX'],
    ['Asesor externo', 'Renta', 'Consultorio', 'El Barreal', 'AE-LA-CMED-BAR'],
    ['Properlia', 'Venta', 'Casa', 'San José', 'PR-LV-CASA-SJO']
  ];
  for (const [origen, modalidad, tipo, zona, clave] of casos) {
    const r = gen({ origen, modalidad, tipo, zona });
    assert.equal(r.key, clave);
    assert.equal(r.warnings.length, 0, `sin avisos con valores exactos: ${clave}`);
  }
});

test('todas las combinaciones válidas (3 × 3 × 7 × 13 = 819) generan claves con formato correcto', () => {
  let n = 0;
  for (const o of C.origins) for (const m of C.modalities) for (const t of C.types) for (const z of C.zones) {
    const r = gen({ origen: o.formValue, modalidad: m.formValue, tipo: t.formValue, zona: z.formValue });
    assert.equal(r.ok, true);
    assert.match(r.key, KEY_RE);
    // Consistencia: los componentes reconstruyen exactamente la clave.
    const c = r.components;
    assert.equal([c.origin.code, c.operation.code, c.type.code, c.zone.code].join('-'), r.key);
    n++;
  }
  assert.equal(n, 819);
});

test('resultado completo: componentes con código y nombre, versión del catálogo', () => {
  const r = gen({ origen: 'Keller Williams', modalidad: 'Preventa', tipo: 'Bodega o nave', zona: 'Cuautlancingo' });
  assert.equal(r.ok, true);
  assert.equal(r.key, 'KW-LV-BONA-CUAU');
  assert.equal(JSON.stringify(r.components), JSON.stringify({
    origin: { code: 'KW', name: 'Keller Williams' },
    operation: { code: 'LV', name: 'Lado vendedor / venta' },
    type: { code: 'BONA', name: 'Bodega o nave' },
    zone: { code: 'CUAU', name: 'Cuautlancingo' }
  }));
  assert.equal(r.modality, 'Preventa');
  assert.equal(r.errors.length, 0);
  assert.equal(r.catalogVersion, C.version);
});

// ---------- Permanencia: campos ajenos no alteran la clave ----------

test('cambiar precio, fecha, año, asesor, estatus, comisión, prioridad o exclusividad no altera la clave', () => {
  const k = gen(base).key;
  const variantes = [
    { precio: 2500000 }, { precio: 9900000 }, { fecha: '2026-01-01' }, { fecha: '2027-12-31' },
    { anio: 2030 }, { asesor: 'Asesor Ficticio Uno' }, { asesor: 'Otro Asesor' },
    { estatus: 'Activa' }, { estatus: 'Vendida' }, { comision: '5%' }, { prioridad: 'Alta' },
    { exclusividad: true }, { propietario: 'Persona Ficticia' }, { etapa: 'Cierre' }
  ];
  for (const v of variantes) assert.equal(gen({ ...base, ...v }).key, k, JSON.stringify(v));
});

test('cambiar la modalidad de Preventa a Venta no altera la clave', () => {
  const preventa = gen({ ...base, tipo: 'Departamento', zona: 'Lomas de Angelópolis', modalidad: 'Preventa' });
  const venta = gen({ ...base, tipo: 'Departamento', zona: 'Lomas de Angelópolis', modalidad: 'Venta' });
  assert.equal(preventa.key, 'PR-LV-DEP-LMS');
  assert.equal(venta.key, preventa.key);
});

test('el origen nunca se infiere de otros campos', () => {
  const r = gen({ modalidad: 'Venta', tipo: 'Casa', zona: 'Zavaleta', asesor: 'KW', correo: 'x@kwmexico.mx', exclusividad: 'Keller Williams' });
  assertRejected(r, 'MISSING_FIELD', 'origen');
});

test('es determinista y no modifica la entrada', () => {
  const input = { ...base, precio: 1 };
  const copia = JSON.stringify(input);
  assert.equal(gen(input).key, gen(input).key);
  assert.equal(JSON.stringify(input), copia);
});

// ---------- Normalización ----------

test('normaliza mayúsculas, acentos y espacios, y lo avisa', () => {
  const r = gen({ origen: '  keller   williams ', modalidad: 'renta', tipo: 'LOCAL COMERCIAL', zona: 'san andres cholula' });
  assert.equal(r.ok, true);
  assert.equal(r.key, 'KW-LA-LOC-SACH');
  assert.equal(r.warnings.length, 4);
  assert.ok(r.warnings.every((w) => w.code === 'NORMALIZED_VALUE'));
  assert.equal(gen({ ...base, tipo: 'bodega o nave' }).key, 'PR-LV-BONA-ZAV');
  assert.equal(gen({ ...base, zona: 'zav' }).key, 'PR-LV-CASA-ZAV');
});

test('la normalización no acepta sinónimos ni variantes', () => {
  assertRejected(gen({ ...base, tipo: 'Local' }), 'INVALID_TYPE');
  assertRejected(gen({ ...base, tipo: 'Casas' }), 'INVALID_TYPE');
  assertRejected(gen({ ...base, zona: 'UDLAP' }), 'ZONE_NOT_CATALOGED');
  assertRejected(gen({ ...base, origen: 'KW Mexico' }), 'INVALID_ORIGIN');
});

// ---------- Casos inválidos ----------

test('campos faltantes, vacíos o solo espacios', () => {
  for (const f of ['origen', 'modalidad', 'tipo', 'zona']) {
    const sin = { ...base }; delete sin[f];
    assertRejected(gen(sin), 'MISSING_FIELD', f);
    assertRejected(gen({ ...base, [f]: '' }), 'MISSING_FIELD', f);
    assertRejected(gen({ ...base, [f]: '   ' }), 'MISSING_FIELD', f);
    assertRejected(gen({ ...base, [f]: null }), 'MISSING_FIELD', f);
  }
});

test('valores que no son texto', () => {
  assertRejected(gen({ ...base, zona: 7 }), 'INVALID_VALUE', 'zona');
  assertRejected(gen({ ...base, tipo: ['Casa'] }), 'INVALID_VALUE', 'tipo');
});

test('entrada que no es un objeto', () => {
  for (const x of [undefined, null, 'PR-LV-CASA-ZAV', 42, ['Properlia']]) assertRejected(gen(x), 'INVALID_INPUT');
});

test('orígenes inválidos', () => {
  for (const o of ['XX', 'Century 21', 'P R', 'PR-']) assertRejected(gen({ ...base, origen: o }), 'INVALID_ORIGIN', 'origen');
});

test('operaciones no permitidas: LC y CR excluidas; PRE no es código', () => {
  assertRejected(gen({ ...base, modalidad: 'LC' }), 'EXCLUDED_OPERATION', 'modalidad');
  assertRejected(gen({ ...base, modalidad: 'cr' }), 'EXCLUDED_OPERATION', 'modalidad');
  const pre = gen({ ...base, modalidad: 'PRE' });
  assertRejected(pre, 'INVALID_OPERATION', 'modalidad');
  assert.match(pre.errors[0].message, /Preventa no es código/);
  for (const m of ['Compra', 'Traspaso', 'XX']) assertRejected(gen({ ...base, modalidad: m }), 'INVALID_OPERATION');
});

test('tipos desconocidos, incluido IND reservado', () => {
  for (const t of ['Bodega', 'Nave', 'Industrial', 'Penthouse', 'XX']) assertRejected(gen({ ...base, tipo: t }), 'INVALID_TYPE', 'tipo');
  const ind = gen({ ...base, tipo: 'IND' });
  assertRejected(ind, 'INVALID_TYPE', 'tipo');
  assert.match(ind.errors[0].message, /reservado/);
});

test('zonas inexistentes: bloquea y pide incorporación formal', () => {
  for (const z of ['Puebla', 'Centro Histórico', 'XYZ', 'ZAVA', 'ZV']) {
    const r = gen({ ...base, zona: z });
    assertRejected(r, 'ZONE_NOT_CATALOGED', 'zona');
    assert.match(r.errors[0].message, /no está catalogada/);
  }
});

test('reporta todos los errores a la vez, sin clave parcial', () => {
  const r = gen({ origen: 'XX', modalidad: 'LC', tipo: 'IND' });
  assert.equal(r.key, null);
  assert.equal(JSON.stringify(errCodes(r)), JSON.stringify(['INVALID_ORIGIN', 'EXCLUDED_OPERATION', 'INVALID_TYPE', 'MISSING_FIELD']));
});

test('la función expuesta como global y en el módulo es la misma', () => {
  assert.equal(ctx.PropertyKey.generatePropertyKey(base).key, gen(base).key);
});

// ---------- T7: entrada por ID del formulario y comercialización simultánea (G-6) ----------

test('acepta el ID de la opción del formulario en los cuatro campos, sin avisos', () => {
  const r = gen({
    origen: 'origen-02',
    modalidad: 'b8e9f3d2-4c5a-6b7e-0f9e-8d2c3b4e5f6a',
    tipo: '37beb05a-ff6a-4138-8959-c2c9be60e6f5',
    zona: 'zona-08'
  });
  assert.equal(r.ok, true);
  assert.equal(r.key, 'KW-LV-BONA-CUAU');
  assert.equal(r.modality, 'Venta');
  assert.equal(r.warnings.length, 0);
});

test('cada ID produce el mismo resultado que su texto', () => {
  for (const t of C.types) assert.equal(gen({ ...base, tipo: t.formOptionId }).key, gen({ ...base, tipo: t.formValue }).key);
  for (const m of C.modalities) assert.equal(gen({ ...base, modalidad: m.formOptionId }).key, gen({ ...base, modalidad: m.formValue }).key);
  for (const o of C.origins) assert.equal(gen({ ...base, origen: o.formOptionId }).key, gen({ ...base, origen: o.formValue }).key);
  for (const z of C.zones) assert.equal(gen({ ...base, zona: z.formOptionId }).key, gen({ ...base, zona: z.formValue }).key);
});

test('IDs desconocidos se rechazan', () => {
  assertRejected(gen({ ...base, tipo: '00000000-0000-4000-8000-000000000000' }), 'INVALID_TYPE');
  assertRejected(gen({ ...base, zona: 'zona-14' }), 'ZONE_NOT_CATALOGED');
  assertRejected(gen({ ...base, origen: 'origen-04' }), 'INVALID_ORIGIN');
  assertRejected(gen({ ...base, modalidad: 'd0a1f5e4-6d7c-8b9f-2a1f-0e4d5c6f7a8c' }), 'INVALID_OPERATION');
});

test('G-6: venta y renta a la vez se registra una sola vez como Venta (LV)', () => {
  for (const lista of [['Venta', 'Renta'], ['Renta', 'Venta'], ['Preventa', 'Renta']]) {
    const r = gen({ ...base, modalidad: lista });
    assert.equal(r.ok, true, json(lista));
    assert.equal(r.key, 'PR-LV-CASA-ZAV');
    assert.equal(r.modality, 'Venta');
    assert.equal(json(r.modalities), json(lista));
    assert.ok(r.warnings.some((w) => w.code === 'SIMULTANEOUS_OFFER'));
  }
});

test('lista de modalidades con una sola operación no aplica la regla simultánea', () => {
  const r = gen({ ...base, modalidad: ['Renta'] });
  assert.equal(r.key, 'PR-LA-CASA-ZAV');
  assert.equal(r.modality, 'Renta');
  assert.ok(!r.warnings.some((w) => w.code === 'SIMULTANEOUS_OFFER'));
  const r2 = gen({ ...base, modalidad: ['Preventa', 'Venta'] });
  assert.equal(r2.key, 'PR-LV-CASA-ZAV');
  assert.equal(r2.modality, 'Preventa');
});

test('lista de modalidades inválida: vacía, con valores no válidos o excluidos', () => {
  assertRejected(gen({ ...base, modalidad: [] }), 'MISSING_FIELD', 'modalidad');
  assertRejected(gen({ ...base, modalidad: ['Venta', ''] }), 'INVALID_VALUE', 'modalidad');
  assertRejected(gen({ ...base, modalidad: ['Venta', 3] }), 'INVALID_VALUE', 'modalidad');
  assertRejected(gen({ ...base, modalidad: ['Venta', 'Compra'] }), 'INVALID_OPERATION', 'modalidad');
  assertRejected(gen({ ...base, modalidad: ['Venta', 'LC'] }), 'EXCLUDED_OPERATION', 'modalidad');
});

test('modalities refleja lo ofrecido en casos simples', () => {
  assert.equal(json(gen({ ...base, modalidad: 'Preventa' }).modalities), json(['Preventa']));
  assert.equal(json(gen({ ...base, modalidad: 'LA' }).modalities), json([]));
});
