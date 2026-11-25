/**
 * Auditoría: toda acción que crea o escribe recursos deja rastro.
 * - Siempre en Logger (registro de ejecución de Apps Script).
 * - Además en la pestaña "Auditoria" de la hoja de registro, si ya existe.
 * Un fallo al auditar nunca oculta el resultado de la acción original.
 */
var AuditLog = (function () {
  function record(action, resourceId, result, detail) {
    var env = Config.get(CONSTANTS.PROP.ENV) || 'SIN_ENV';
    var user = Identity.activeEmail() || 'desconocido';
    var row = [Clock.nowStamp(), env, user, action, resourceId || '', result, detail ? String(detail).slice(0, 500) : ''];
    Logger.log('[AUDIT] ' + row.join(' | '));

    var registryId = Config.get(CONSTANTS.PROP.REGISTRY_SHEET_ID);
    if (!registryId) return;
    try {
      SheetRepository.appendRow(registryId, CONSTANTS.TABS.AUDITORIA, row);
    } catch (e) {
      Logger.log('[AUDIT] No se pudo escribir en la hoja de auditoría: ' + e.message);
    }
  }
  return { record: record };
})();
