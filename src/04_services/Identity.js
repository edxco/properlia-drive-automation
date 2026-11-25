/** Identidad del usuario que ejecuta y control de acceso. */
var Identity = (function () {
  function activeEmail() {
    try { return Session.getActiveUser().getEmail(); } catch (e) { return ''; }
  }
  function effectiveEmail() {
    try { return Session.getEffectiveUser().getEmail(); } catch (e) { return ''; }
  }
  /** Solo el usuario de ALLOWED_USER_EMAIL puede usar la Web App y las funciones de escritura. */
  function assertAuthorized() {
    var allowed = Config.require(CONSTANTS.PROP.ALLOWED_USER_EMAIL);
    var active = activeEmail();
    if (!Utils.sameEmail(active, allowed)) {
      throw new ProperliaError('ACCESS_DENIED', 'Usuario no autorizado para este entorno.');
    }
    return active;
  }
  return { activeEmail: activeEmail, effectiveEmail: effectiveEmail, assertAuthorized: assertAuthorized };
})();
