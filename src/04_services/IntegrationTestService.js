/**
 * Prueba de integración mínima con datos ficticios. Cada ejecución crea, dentro de la carpeta raíz TEST:
 *   [TEST] Prueba de integración <fecha>/           (carpeta)
 *   └── [TEST] Prueba de integración <fecha> - Hoja (hoja con una fila ficticia)
 * No borra nada: los recursos de prueba quedan para revisión.
 */
var IntegrationTestService = (function () {
  var FAKE_ROWS = [
    ['ID', 'Propiedad', 'Colonia', 'Estatus'],
    ['TEST-001', 'Casa ficticia de prueba', 'Colonia Ejemplo', 'Borrador']
  ];

  function run() {
    var steps = [];
    var ctx = { env: null, user: null, folder: null, sheet: null };

    function step(name, fn) {
      try {
        var detail = fn();
        steps.push({ name: name, ok: true, detail: detail || '' });
        return true;
      } catch (e) {
        steps.push({ name: name, ok: false, detail: e.message });
        return false;
      }
    }

    var go = step('Identidad del usuario', function () {
      ctx.user = Identity.assertAuthorized();
      return 'Activo: ' + ctx.user + ' / Efectivo: ' + Identity.effectiveEmail();
    })
    && step('Ejecución de Apps Script', function () {
      return 'Runtime V8, zona ' + Session.getScriptTimeZone();
    })
    && step('Lectura de configuración', function () {
      ctx.env = EnvironmentGuard.assertTestEnv();
      Config.require(CONSTANTS.PROP.ROOT_FOLDER_ID);
      Config.require(CONSTANTS.PROP.REGISTRY_SHEET_ID);
      return 'ENV=' + ctx.env + ', raíz y registro configurados';
    })
    && step('Creación de carpeta de prueba', function () {
      var name = Utils.buildResourceName(ctx.env, 'Prueba de integración', Clock.nowStamp());
      ctx.folder = DriveRepository.createFolder(name, Config.require(CONSTANTS.PROP.ROOT_FOLDER_ID), ctx.env);
      return ctx.folder.name;
    })
    && step('Creación de hoja de prueba', function () {
      ctx.sheet = DriveRepository.createSpreadsheet(ctx.folder.name + ' - Hoja', ctx.folder.id, ctx.env);
      return ctx.sheet.name;
    })
    && step('Escritura y lectura de datos ficticios', function () {
      SheetRepository.writeValues(ctx.sheet.id, 'A1:D2', FAKE_ROWS);
      var read = SheetRepository.readValues(ctx.sheet.id, 'A1:D2');
      if (!Utils.valuesEqual(FAKE_ROWS, read)) throw new Error('Lo leído no coincide con lo escrito: ' + JSON.stringify(read));
      return JSON.stringify(read);
    })
    && step('Recursos pertenecen a TEST', function () {
      [ctx.folder.id, ctx.sheet.id].forEach(function (id) {
        EnvironmentGuard.assertBelongsToEnv(DriveRepository.getMeta(id), ctx.env);
        EnvironmentGuard.assertInsideRoot(id);
      });
      return 'Marcados con properliaEnv=' + ctx.env + ' y dentro de la carpeta raíz';
    });

    var summary = Utils.summarizeSteps(steps);
    var result = {
      passed: summary.passed,
      ok: summary.ok,
      total: summary.total,
      steps: steps,
      folderUrl: ctx.folder ? ctx.folder.webViewLink : null,
      sheetUrl: ctx.sheet ? ctx.sheet.webViewLink : null,
      timestamp: Clock.nowStamp()
    };

    AuditLog.record('INTEGRATION_TEST', ctx.folder ? ctx.folder.id : '', summary.passed ? 'OK' : 'FALLA',
      summary.ok + '/' + summary.total + ' pasos');
    var registryId = Config.get(CONSTANTS.PROP.REGISTRY_SHEET_ID);
    if (registryId && ctx.env) {
      try {
        SheetRepository.appendRow(registryId, CONSTANTS.TABS.PRUEBAS, [result.timestamp, ctx.env, ctx.user || '',
          summary.passed ? 'OK' : 'FALLA', summary.ok, summary.total, result.folderUrl || '', result.sheetUrl || '']);
      } catch (e) { Logger.log('No se pudo registrar la prueba: ' + e.message); }
    }
    Logger.log(JSON.stringify(result, null, 2));
    return result;
  }
  return { run: run };
})();
