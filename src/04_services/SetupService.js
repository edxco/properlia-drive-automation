/**
 * Crea (una sola vez) la estructura base del entorno TEST:
 *   [TEST] Properlia                      (carpeta raíz, en Mi unidad)
 *   └── [TEST] Properlia - Registro       (hoja: Registro, Auditoria, Pruebas)
 * Es idempotente: si los IDs ya existen y son válidos, los reutiliza.
 */
var SetupService = (function () {
  function run() {
    var user = Identity.assertAuthorized();
    var env = EnvironmentGuard.assertTestEnv();
    var created = [];

    var rootId = Config.get(CONSTANTS.PROP.ROOT_FOLDER_ID);
    if (!DriveRepository.exists(rootId)) {
      var root = DriveRepository.createFolder(Utils.buildResourceName(env, CONSTANTS.PROJECT_NAME), null, env);
      rootId = root.id;
      Config.set(CONSTANTS.PROP.ROOT_FOLDER_ID, rootId);
      created.push('carpeta raíz');
    }
    EnvironmentGuard.assertBelongsToEnv(DriveRepository.getMeta(rootId), env);

    var registryId = Config.get(CONSTANTS.PROP.REGISTRY_SHEET_ID);
    if (!DriveRepository.exists(registryId)) {
      var sheet = DriveRepository.createSpreadsheet(Utils.buildResourceName(env, CONSTANTS.PROJECT_NAME + ' - Registro'), rootId, env);
      registryId = sheet.id;
      var tabs = [CONSTANTS.TABS.REGISTRO, CONSTANTS.TABS.AUDITORIA, CONSTANTS.TABS.PRUEBAS];
      SheetRepository.setupTabs(registryId, tabs);
      tabs.forEach(function (t) { SheetRepository.writeHeaders(registryId, t, CONSTANTS.HEADERS[t]); });
      Config.set(CONSTANTS.PROP.REGISTRY_SHEET_ID, registryId);
      created.push('hoja de registro');
    }
    var registryMeta = DriveRepository.getMeta(registryId);
    EnvironmentGuard.assertBelongsToEnv(registryMeta, env);
    EnvironmentGuard.assertInsideRoot(registryId);

    AuditLog.record('SETUP', rootId, 'OK', created.length ? 'Creado: ' + created.join(', ') : 'Sin cambios (ya existía)');
    return {
      env: env,
      user: user,
      created: created,
      rootFolderUrl: DriveRepository.getMeta(rootId).webViewLink,
      registryUrl: registryMeta.webViewLink
    };
  }
  return { run: run };
})();
