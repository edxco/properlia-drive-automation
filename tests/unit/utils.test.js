const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGas } = require('../helpers/gas-loader');

const { Utils } = loadGas(['01_utils/Utils.js']);

test('buildResourceName agrega el prefijo del entorno', () => {
  assert.equal(Utils.buildResourceName('TEST', 'Properlia'), '[TEST] Properlia');
  assert.equal(Utils.buildResourceName('TEST', 'Prueba', '2026-11-25 13:29:58'), '[TEST] Prueba 2026-11-25 13-29-58');
  assert.throws(() => Utils.buildResourceName('', 'x'));
});

test('hasEnvTag reconoce solo el entorno correcto', () => {
  assert.equal(Utils.hasEnvTag('[TEST] Properlia', 'TEST'), true);
  assert.equal(Utils.hasEnvTag('[PROD] Properlia', 'TEST'), false);
  assert.equal(Utils.hasEnvTag('Properlia', 'TEST'), false);
  assert.equal(Utils.hasEnvTag(null, 'TEST'), false);
});

test('validateEnv rechaza entornos no habilitados', () => {
  assert.equal(Utils.validateEnv('TEST', ['TEST']).length, 0);
  assert.equal(Utils.validateEnv('PROD', ['TEST']).length, 1);
  assert.equal(Utils.validateEnv(null, ['TEST']).length, 1);
});

test('sameEmail ignora mayúsculas y espacios', () => {
  assert.equal(Utils.sameEmail(' A@B.mx ', 'a@b.mx'), true);
  assert.equal(Utils.sameEmail('a@b.mx', 'c@b.mx'), false);
  assert.equal(Utils.sameEmail('', ''), false);
});

test('maskEmail oculta el usuario', () => {
  assert.equal(Utils.maskEmail('leslie@kwmexico.mx'), 'l***@kwmexico.mx');
  assert.equal(Utils.maskEmail('invalido'), null);
});

test('valuesEqual compara matrices escritas vs leídas', () => {
  assert.equal(Utils.valuesEqual([['a', 1]], [['a', '1']]), true);
  assert.equal(Utils.valuesEqual([['a']], [['b']]), false);
  assert.equal(Utils.valuesEqual([['a']], []), false);
});

test('summarizeSteps', () => {
  // Objetos creados en otro contexto vm: se comparan por JSON
  assert.equal(JSON.stringify(Utils.summarizeSteps([{ ok: true }, { ok: true }])), JSON.stringify({ total: 2, ok: 2, passed: true }));
  assert.equal(Utils.summarizeSteps([{ ok: true }, { ok: false }]).passed, false);
  assert.equal(Utils.summarizeSteps([]).passed, false);
});
