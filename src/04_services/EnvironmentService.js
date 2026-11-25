/** Estado del entorno para la Web App. Solo lectura. */
var EnvironmentService = (function () {
  function getStatus() {
    var status = {
      project: CONSTANTS.PROJECT_NAME,
      env: null,
      activeUser: Identity.activeEmail(),
      effectiveUser: Identity.effectiveEmail(),
      config: Config.snapshot(),
      connection: { ok: false, detail: '' },
      rootFolderUrl: null,
      registryUrl: null,
      timestamp: Clock.nowStamp()
    };
    try {
      status.env = Config.getEnv();
      var rootId = Config.get(CONSTANTS.PROP.ROOT_FOLDER_ID);
      var registryId = Config.get(CONSTANTS.PROP.REGISTRY_SHEET_ID);
      if (!rootId || !registryId) {
        status.connection.detail = 'Entorno sin inicializar: ejecutar setupTestEnvironment().';
        return status;
      }
      var root = DriveRepository.getMeta(rootId);
      var registry = DriveRepository.getMeta(registryId);
      EnvironmentGuard.assertBelongsToEnv(root, status.env);
      EnvironmentGuard.assertBelongsToEnv(registry, status.env);
      status.rootFolderUrl = root.webViewLink;
      status.registryUrl = registry.webViewLink;
      status.connection = { ok: true, detail: 'Drive y Sheets accesibles; recursos marcados como ' + status.env + '.' };
    } catch (e) {
      status.connection = { ok: false, detail: e.message };
    }
    return status;
  }
  return { getStatus: getStatus };
})();
