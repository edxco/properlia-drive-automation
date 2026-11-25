/**
 * Barreras del entorno TEST. Se llaman antes de cualquier escritura.
 * 1) ENV debe ser TEST (y estar habilitado en este proyecto).
 * 2) Todo recurso debe tener appProperties.properliaEnv = ENV y nombre con prefijo [ENV].
 * 3) Todo recurso hijo debe estar dentro de la carpeta raíz del entorno.
 * Además, el scope drive.file impide por diseño ver carpetas que el script no creó.
 */
var EnvironmentGuard = (function () {
  function assertTestEnv() {
    var env = Config.getEnv();
    if (env !== 'TEST') throw new ProperliaError('ENV_NOT_TEST', 'Esta operación solo se permite en TEST. ENV actual: ' + env);
    return env;
  }

  function assertBelongsToEnv(meta, env) {
    var props = meta.appProperties || {};
    if (props.properliaEnv !== env || props.properliaApp !== CONSTANTS.APP_TAG) {
      throw new ProperliaError('RESOURCE_ENV_MISMATCH', 'El recurso ' + meta.id + ' no está marcado como ' + env + '.');
    }
    if (!Utils.hasEnvTag(meta.name, env)) {
      throw new ProperliaError('RESOURCE_NAME_MISMATCH', 'El recurso ' + meta.id + ' no tiene el prefijo [' + env + '].');
    }
  }

  /** Verifica que fileId esté dentro de la carpeta raíz del entorno (máx. 10 niveles). */
  function assertInsideRoot(fileId) {
    var rootId = Config.require(CONSTANTS.PROP.ROOT_FOLDER_ID);
    var current = fileId;
    for (var depth = 0; depth < 10; depth++) {
      if (current === rootId) return true;
      var meta = DriveRepository.getMeta(current);
      if (!meta.parents || !meta.parents.length) break;
      current = meta.parents[0];
    }
    throw new ProperliaError('OUTSIDE_ROOT', 'El recurso ' + fileId + ' está fuera de la carpeta raíz del entorno.');
  }

  return { assertTestEnv: assertTestEnv, assertBelongsToEnv: assertBelongsToEnv, assertInsideRoot: assertInsideRoot };
})();
