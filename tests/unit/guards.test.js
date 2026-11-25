const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGas } = require('../helpers/gas-loader');

function ctxWith(props, files = {}) {
  const store = { ...props };
  const PropertiesService = { getScriptProperties: () => ({
    getProperty: (k) => (k in store ? store[k] : null),
    setProperty: (k, v) => { store[k] = v; }
  }) };
  const Drive = { Files: { get: (id) => files[id] } };
  const ctx = loadGas([
    '00_config/Constants.js', '01_utils/Errors.js', '01_utils/Utils.js', '00_config/Config.js',
    '03_repositories/DriveRepository.js', '04_services/EnvironmentGuard.js'
  ], { PropertiesService, Drive });
  return { ctx, store };
}

test('Config.getEnv rechaza PROD en este proyecto', () => {
  const { ctx } = ctxWith({ ENV: 'PROD' });
  assert.throws(() => ctx.Config.getEnv(), /ENV_INVALID/);
});

test('Config.set solo permite propiedades generadas por el setup', () => {
  const { ctx, store } = ctxWith({ ENV: 'TEST' });
  assert.throws(() => ctx.Config.set('ENV', 'PROD'), /CONFIG_READONLY/);
  ctx.Config.set('ROOT_FOLDER_ID', 'abc');
  assert.equal(store.ROOT_FOLDER_ID, 'abc');
});

test('assertBelongsToEnv exige marca y prefijo TEST', () => {
  const { ctx } = ctxWith({ ENV: 'TEST' });
  const good = { id: '1', name: '[TEST] X', appProperties: { properliaEnv: 'TEST', properliaApp: 'properlia' } };
  ctx.EnvironmentGuard.assertBelongsToEnv(good, 'TEST');
  assert.throws(() => ctx.EnvironmentGuard.assertBelongsToEnv({ ...good, name: 'X' }, 'TEST'), /RESOURCE_NAME_MISMATCH/);
  assert.throws(() => ctx.EnvironmentGuard.assertBelongsToEnv({ ...good, appProperties: {} }, 'TEST'), /RESOURCE_ENV_MISMATCH/);
});

test('assertInsideRoot detecta recursos fuera de la raíz', () => {
  const files = {
    root: { id: 'root', parents: ['mydrive'] },
    child: { id: 'child', parents: ['root'] },
    other: { id: 'other', parents: ['mydrive'] },
    mydrive: { id: 'mydrive', parents: [] }
  };
  const { ctx } = ctxWith({ ENV: 'TEST', ROOT_FOLDER_ID: 'root' }, files);
  assert.equal(ctx.EnvironmentGuard.assertInsideRoot('child'), true);
  assert.throws(() => ctx.EnvironmentGuard.assertInsideRoot('other'), /OUTSIDE_ROOT/);
});
