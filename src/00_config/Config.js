/**
 * Acceso centralizado a la configuración (Script Properties).
 * - Ningún otro módulo lee PropertiesService directamente.
 * - Solo las claves de CONSTANTS.WRITABLE_PROPS pueden escribirse desde código.
 */
var Config = (function () {
  function props_() {
    return PropertiesService.getScriptProperties();
  }

  function get(key) {
    return props_().getProperty(key);
  }

  function require(key) {
    var value = get(key);
    if (value === null || value === '') {
      throw new ProperliaError('CONFIG_MISSING', 'Falta la Script Property "' + key + '".');
    }
    return value;
  }

  function set(key, value) {
    if (CONSTANTS.WRITABLE_PROPS.indexOf(key) === -1) {
      throw new ProperliaError('CONFIG_READONLY', 'La propiedad "' + key + '" solo se puede editar manualmente.');
    }
    props_().setProperty(key, value);
  }

  /** Entorno actual. Falla si no está entre los habilitados para este proyecto. */
  function getEnv() {
    var env = require(CONSTANTS.PROP.ENV);
    var errors = Utils.validateEnv(env, CONSTANTS.ALLOWED_ENVS);
    if (errors.length) throw new ProperliaError('ENV_INVALID', errors.join(' '));
    return env;
  }

  /** Copia sin datos sensibles, para mostrar en la Web App o en registros. */
  function snapshot() {
    return {
      env: get(CONSTANTS.PROP.ENV),
      allowedUser: Utils.maskEmail(get(CONSTANTS.PROP.ALLOWED_USER_EMAIL)),
      rootFolderConfigured: !!get(CONSTANTS.PROP.ROOT_FOLDER_ID),
      registryConfigured: !!get(CONSTANTS.PROP.REGISTRY_SHEET_ID)
    };
  }

  return { get: get, require: require, set: set, getEnv: getEnv, snapshot: snapshot };
})();
