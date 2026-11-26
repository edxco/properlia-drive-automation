// T4 — resolveDuplicate: detección de duplicados y sufijo secuencial autorizado. Solo datos ficticios.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGas } = require('../helpers/gas-loader');

const ctx = loadGas(['00_config/KeyCatalog.js', '04_services/PropertyKey.js']);
const resolve = ctx.resolveDuplicate;
const val = ctx.validatePropertyKey;
const gen = ctx.generatePropertyKey;
const json = (v) => JSON.stringify(v);
const errCodes = (r) => r.errors.map((e) => e.code);
const warnCodes = (r) => r.warnings.map((w) => w.code);

const BASE = 'KW-LV-CASA-ZAV';
const auth = (ack, extra = {}) => ({ authorized: true, by: 'usuario.ficticio@example.com', baseKey: BASE, acknowledgedKeys: ack, ...extra });

// ---------- Sin duplicado ----------

test('combinación nueva: se usa la clave base sin sufijo', () => {
  const r = resolve(BASE, []);
  assert.equal(r.status, 'AVAILABLE');
  assert.equal(r.ok, true);
  assert.equal(r.key, BASE);
  assert.equal(r.suffix, null);
  assert.equal(r.existing.length, 0);
});

test('claves de otras combinaciones no cuentan como duplicado', () => {
  const otras = ['KW-LV-CASA-ATL', 'KW-LA-CASA-ZAV', 'PR-LV-CASA-ZAV', 'KW-LV-DEP-ZAV', 'KW-LV-CASA-ZAVX', 'AKW-LV-CASA-ZAV'];
  const r = resolve(BASE, otras);
  assert.equal(r.status, 'AVAILABLE');
  assert.equal(r.key, BASE);
});

test('una autorización sin duplicado no se aplica y se avisa', () => {
  const r = resolve(BASE, [], auth([]));
  assert.equal(r.status, 'AVAILABLE');
  assert.equal(r.key, BASE);
  assert.ok(warnCodes(r).includes('AUTHORIZATION_NOT_NEEDED'));
});

// ---------- Duplicado sin autorización: bloqueo ----------

test('duplicado sin autorización: bloquea, muestra la propiedad existente y no devuelve clave', () => {
  const existente = { key: BASE, propertyId: 'TEST-001', nombre: 'Casa ficticia de prueba' };
  const r = resolve(BASE, [existente]);
  assert.equal(r.status, 'DUPLICATE_BLOCKED');
  assert.equal(r.ok, false);
  assert.equal(r.key, null);
  assert.equal(r.suffix, null);
  assert.equal(json(r.existing), json([existente]));
  assert.ok(errCodes(r).includes('DUPLICATE_KEY'));
  assert.equal(r.proposedKey, 'KW-LV-CASA-ZAV-02', 'informa cuál sería la clave si se autoriza');
});

test('nunca agrega sufijo automáticamente', () => {
  for (const existentes of [[BASE], [BASE, `${BASE}-02`], [`${BASE}-05`]]) {
    const r = resolve(BASE, existentes);
    assert.equal(r.key, null);
    assert.equal(r.status, 'DUPLICATE_BLOCKED');
  }
});

// ---------- Duplicado autorizado: sufijo secuencial ----------

test('segunda propiedad autorizada: -02', () => {
  const r = resolve(BASE, [BASE], auth([BASE]));
  assert.equal(r.status, 'DUPLICATE_AUTHORIZED');
  assert.equal(r.ok, true);
  assert.equal(r.key, 'KW-LV-CASA-ZAV-02');
  assert.equal(r.suffix, 2);
  assert.equal(r.authorizedBy, 'usuario.ficticio@example.com');
});

test('tercera y cuarta: -03 y -04', () => {
  assert.equal(resolve(BASE, [BASE, `${BASE}-02`], auth([BASE, `${BASE}-02`])).key, `${BASE}-03`);
  const tres = [BASE, `${BASE}-02`, `${BASE}-03`];
  assert.equal(resolve(BASE, tres, auth(tres)).key, `${BASE}-04`);
});

test('huecos: siempre el mayor existente + 1, sin reutilizar números (D-13)', () => {
  const conHueco = [BASE, `${BASE}-02`, `${BASE}-04`];
  assert.equal(resolve(BASE, conHueco, auth(conHueco)).key, `${BASE}-05`);
  const soloSufijo = [`${BASE}-03`];
  assert.equal(resolve(BASE, soloSufijo, auth(soloSufijo)).key, `${BASE}-04`);
});

test('el orden de los registros existentes no cambia el resultado', () => {
  const a = [BASE, `${BASE}-04`, `${BASE}-02`];
  const b = [`${BASE}-04`, `${BASE}-02`, BASE];
  assert.equal(resolve(BASE, a, auth(a)).key, resolve(BASE, b, auth(b)).key);
});

test('la clave resultante es válida y conserva la base', () => {
  const r = resolve(BASE, [BASE], auth([BASE]));
  const v = val(r.key);
  assert.equal(v.ok, true);
  assert.equal(v.baseKey, BASE);
  assert.equal(v.suffix, 2);
});

test('flujo completo: generar → detectar → autorizar', () => {
  const g = gen({ origen: 'Keller Williams', modalidad: 'Venta', tipo: 'Casa', zona: 'Zavaleta', precio: 4100000 });
  const registro = [{ key: 'KW-LV-CASA-ZAV', propertyId: 'TEST-001' }];
  const bloqueado = resolve(g.key, registro);
  assert.equal(bloqueado.status, 'DUPLICATE_BLOCKED');
  const permitido = resolve(g.key, registro, auth(bloqueado.existing.map((x) => x.key)));
  assert.equal(permitido.key, 'KW-LV-CASA-ZAV-02');
});

// ---------- Autorizaciones inválidas ----------

test('autorización que no reconoce todas las claves existentes', () => {
  const existentes = [BASE, `${BASE}-02`];
  const r = resolve(BASE, existentes, auth([BASE]));
  assert.equal(r.status, 'REJECTED');
  assert.equal(r.key, null);
  assert.ok(errCodes(r).includes('AUTHORIZATION_INVALID'));
  assert.match(r.errors[0].message, /KW-LV-CASA-ZAV-02/);
});

test('autorización sin authorized: true, sin responsable o para otra combinación', () => {
  const casos = [
    auth([BASE], { authorized: false }),
    auth([BASE], { authorized: 'si' }),
    auth([BASE], { by: '' }),
    auth([BASE], { by: undefined }),
    auth([BASE], { baseKey: 'KW-LV-CASA-ATL' }),
    { authorized: true, by: 'x@example.com', baseKey: BASE }
  ];
  for (const a of casos) {
    const r = resolve(BASE, [BASE], a);
    assert.equal(r.key, null, json(a));
    assert.ok(errCodes(r).includes('AUTHORIZATION_INVALID'), json(a));
  }
});

test('sufijos agotados: con -99 existente se rechaza', () => {
  const r = resolve(BASE, [BASE, `${BASE}-99`], auth([BASE, `${BASE}-99`]));
  assert.equal(r.status, 'REJECTED');
  assert.equal(r.key, null);
  assert.ok(errCodes(r).includes('SUFFIX_EXHAUSTED'));
});

// ---------- Entradas inválidas y registros históricos ----------

test('la clave base debe ser válida y sin sufijo', () => {
  for (const k of [`${BASE}-02`, 'XX-LV-CASA-ZAV', 'kw-lv-casa-zav', '', null]) {
    const r = resolve(k, []);
    assert.equal(r.status, 'REJECTED');
    assert.equal(r.key, null);
    assert.ok(errCodes(r).includes('INVALID_BASE_KEY'), String(k));
  }
});

test('la lista de existentes es obligatoria (puede estar vacía)', () => {
  for (const x of [undefined, null, BASE, { key: BASE }]) {
    const r = resolve(BASE, x);
    assert.ok(errCodes(r).includes('INVALID_INPUT'));
    assert.equal(r.key, null);
  }
});

test('claves existentes no reconocidas se reportan y se ignoran', () => {
  const r = resolve(BASE, ['basura', null, { sinClave: true }, 'kw-lv-casa-zav']);
  assert.equal(r.status, 'AVAILABLE');
  assert.equal(r.warnings.filter((w) => w.code === 'UNRECOGNIZED_EXISTING_KEY').length, 4);
});

test('una clave histórica con -01 se respeta y cuenta en la secuencia', () => {
  const existentes = [BASE, `${BASE}-01`];
  const bloqueado = resolve(BASE, existentes);
  assert.equal(bloqueado.status, 'DUPLICATE_BLOCKED');
  assert.ok(warnCodes(bloqueado).includes('HISTORICAL_SUFFIX'));
  assert.equal(bloqueado.existing.length, 2);
  assert.equal(resolve(BASE, existentes, auth(existentes)).key, `${BASE}-02`);
});

test('no modifica los registros existentes ni la autorización', () => {
  const existentes = [{ key: BASE, propertyId: 'TEST-001', estatus: 'Activa' }, `${BASE}-02`];
  const a = auth([BASE, `${BASE}-02`]);
  const antes = json([existentes, a]);
  const r = resolve(BASE, existentes, a);
  assert.equal(r.key, `${BASE}-03`);
  assert.equal(json([existentes, a]), antes);
  r.existing[0].estatus = 'Cambiado';
  assert.equal(existentes[0].estatus, 'Activa', 'devuelve copias, no las referencias originales');
});

// ---------- T8: ejemplo confirmado por el usuario ----------

test('con base, -02, -03 y -05 el siguiente es -06 (el -04 no se usa)', () => {
  const existentes = [BASE, `${BASE}-02`, `${BASE}-03`, `${BASE}-05`];
  const r = resolve(BASE, existentes, auth(existentes));
  assert.equal(r.key, 'KW-LV-CASA-ZAV-06');
  assert.equal(r.suffix, 6);
});
