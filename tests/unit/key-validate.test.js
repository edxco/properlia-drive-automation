// T3 — validatePropertyKey: estructura, códigos, sufijo y reconstrucción. Solo datos ficticios.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGas } = require('../helpers/gas-loader');

const ctx = loadGas(['00_config/KeyCatalog.js', '04_services/PropertyKey.js']);
const val = ctx.validatePropertyKey;
const gen = ctx.generatePropertyKey;
const C = ctx.KEY_CATALOG;
const errCodes = (r) => r.errors.map((e) => e.code);
const json = (v) => JSON.stringify(v);

function assertInvalid(key, code) {
  const r = val(key);
  assert.equal(r.ok, false, `debió rechazar ${JSON.stringify(key)}`);
  assert.equal(r.key, null);
  assert.equal(r.baseKey, null);
  assert.equal(r.components, null);
  if (code) assert.ok(errCodes(r).includes(code), `${JSON.stringify(key)}: esperaba ${code}, obtuvo ${errCodes(r)}`);
  return r;
}

const EJEMPLOS = [
  'PR-LV-CASA-ZAV', 'PR-LA-CASA-UDL', 'KW-LV-TER-ATL', 'AE-LA-LOC-SON', 'PR-LV-BONA-CUAU',
  'KW-LV-CMED-ZAV', 'PR-LV-DEP-LMS', 'AE-LV-OF-CEN', 'KW-LA-DEP-ANG', 'AE-LV-TER-SACH',
  'PR-LA-OF-CHL', 'KW-LV-LOC-TLAX', 'AE-LA-CMED-BAR', 'PR-LV-CASA-SJO'
];

// ---------- Claves válidas ----------

test('los 14 ejemplos del reporte son válidos y se reconstruyen idénticos', () => {
  for (const k of EJEMPLOS) {
    const r = val(k);
    assert.equal(r.ok, true, k);
    assert.equal(r.key, k);
    assert.equal(r.baseKey, k);
    assert.equal(r.suffix, null);
    assert.equal(r.errors.length, 0);
    assert.equal(r.warnings.length, 0);
    assert.equal(r.catalogVersion, C.version);
  }
});

test('descompone en componentes con código y nombre', () => {
  const r = val('KW-LV-CMED-ZAV');
  assert.equal(json(r.components), json({
    origin: { code: 'KW', name: 'Keller Williams' },
    operation: { code: 'LV', name: 'Lado vendedor / venta' },
    type: { code: 'CMED', name: 'Consultorio' },
    zone: { code: 'ZAV', name: 'Zavaleta' }
  }));
});

test('ida y vuelta: generar → validar → reconstruir da la misma clave en las 819 combinaciones', () => {
  let n = 0;
  for (const o of C.origins) for (const m of C.modalities) for (const t of C.types) for (const z of C.zones) {
    const g = gen({ origen: o.formValue, modalidad: m.formValue, tipo: t.formValue, zona: z.formValue });
    const v = val(g.key);
    assert.equal(v.ok, true, g.key);
    assert.equal(v.key, g.key);
    assert.equal(json(v.components), json(g.components));
    assert.equal(ctx.PropertyKey.composeKey(v.components, null), g.key);
    n++;
  }
  assert.equal(n, 819);
});

test('sufijos de duplicado válidos: -02 a -99', () => {
  for (const [s, num] of [['02', 2], ['03', 3], ['10', 10], ['99', 99]]) {
    const r = val(`KW-LV-CASA-ZAV-${s}`);
    assert.equal(r.ok, true, s);
    assert.equal(r.key, `KW-LV-CASA-ZAV-${s}`);
    assert.equal(r.baseKey, 'KW-LV-CASA-ZAV');
    assert.equal(r.suffix, num);
    assert.ok(r.warnings.some((w) => w.code === 'DUPLICATE_SUFFIX'), 'avisa que es duplicado');
  }
});

test('composeKey reconstruye clave base y con sufijo de dos dígitos', () => {
  const comps = val('PR-LV-BONA-CUAU').components;
  assert.equal(ctx.PropertyKey.composeKey(comps, null), 'PR-LV-BONA-CUAU');
  assert.equal(ctx.PropertyKey.composeKey(comps, 3), 'PR-LV-BONA-CUAU-03');
  assert.equal(ctx.PropertyKey.composeKey(comps, 12), 'PR-LV-BONA-CUAU-12');
});

// ---------- Sufijos inválidos ----------

test('-01 se rechaza: la primera propiedad no lleva sufijo', () => {
  const r = assertInvalid('KW-LV-CASA-ZAV-01', 'INVALID_SUFFIX');
  assert.match(r.errors[0].message, /el primer duplicado es -02/);
});

test('otros sufijos inválidos', () => {
  for (const s of ['00', '1', '2', '100', '002', 'AB', 'A2']) assertInvalid(`KW-LV-CASA-ZAV-${s}`, 'INVALID_SUFFIX');
});

// ---------- Formato ----------

test('segmentos de menos o de más', () => {
  for (const k of ['PR', 'PR-LV', 'PR-LV-CASA', 'PR-LV-CASA-ZAV-02-03', 'PR-LV-CASA-ZAV-02-X']) assertInvalid(k, 'INVALID_FORMAT');
});

test('minúsculas, espacios y otros separadores se rechazan con forma canónica sugerida', () => {
  const casos = {
    'pr-lv-casa-zav': 'PR-LV-CASA-ZAV',
    ' PR-LV-CASA-ZAV ': 'PR-LV-CASA-ZAV',
    'PR LV CASA ZAV': 'PR-LV-CASA-ZAV',
    'PR_LV_CASA_ZAV': 'PR-LV-CASA-ZAV',
    'PR - LV - CASA - ZAV': 'PR-LV-CASA-ZAV'
  };
  for (const [k, canon] of Object.entries(casos)) {
    const r = assertInvalid(k, 'INVALID_FORMAT');
    assert.ok(r.errors[0].message.includes(`"${canon}"`), `${k}: ${r.errors[0].message}`);
  }
});

test('guiones al inicio, al final o dobles', () => {
  for (const k of ['-PR-LV-CASA-ZAV', 'PR-LV-CASA-ZAV-', 'PR--LV-CASA-ZAV', 'PR-LV-CASA--ZAV']) assertInvalid(k, 'INVALID_FORMAT');
});

test('entradas que no son texto o están vacías', () => {
  for (const x of [undefined, null, 42, {}, ['PR-LV-CASA-ZAV'], '', '   ']) assertInvalid(x, 'INVALID_INPUT');
});

// ---------- Códigos ----------

test('origen inexistente', () => {
  for (const k of ['XX-LV-CASA-ZAV', 'KWM-LV-CASA-ZAV', 'P-LV-CASA-ZAV']) assertInvalid(k, 'INVALID_ORIGIN');
});

test('operaciones: LC y CR excluidas; PRE no es código', () => {
  assertInvalid('PR-LC-CASA-ZAV', 'EXCLUDED_OPERATION');
  assertInvalid('PR-CR-CASA-ZAV', 'EXCLUDED_OPERATION');
  const pre = assertInvalid('PR-PRE-CASA-ZAV', 'INVALID_OPERATION');
  assert.match(pre.errors[0].message, /Preventa no es código/);
  assertInvalid('PR-LX-CASA-ZAV', 'INVALID_OPERATION');
});

test('tipos inexistentes, incluido IND reservado', () => {
  const ind = assertInvalid('PR-LV-IND-ZAV', 'INVALID_TYPE');
  assert.match(ind.errors[0].message, /reservado/);
  for (const t of ['BOD', 'NAVE', 'LOCAL', 'CMD']) assertInvalid(`PR-LV-${t}-ZAV`, 'INVALID_TYPE');
});

test('zonas no catalogadas', () => {
  for (const z of ['PUE', 'ZAVA', 'UDLA', 'XYZ']) assertInvalid(`PR-LV-CASA-${z}`, 'ZONE_NOT_CATALOGED');
});

test('el orden de los segmentos importa', () => {
  assertInvalid('LV-PR-CASA-ZAV');
  assertInvalid('PR-LV-ZAV-CASA');
});

test('reporta todos los errores de códigos a la vez', () => {
  const r = assertInvalid('XX-LC-IND-PUE-01');
  assert.equal(json(errCodes(r)), json(['INVALID_ORIGIN', 'EXCLUDED_OPERATION', 'INVALID_TYPE', 'ZONE_NOT_CATALOGED', 'INVALID_SUFFIX']));
});

test('conserva la entrada original en el resultado', () => {
  assert.equal(val('pr-lv-casa-zav').input, 'pr-lv-casa-zav');
  assert.equal(val('PR-LV-CASA-ZAV').input, 'PR-LV-CASA-ZAV');
});
