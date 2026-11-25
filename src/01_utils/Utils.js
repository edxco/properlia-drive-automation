/**
 * Funciones puras (sin servicios de Google) para poder probarlas localmente con Node.
 */
var Utils = (function () {
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /** 'YYYY-MM-DD HH:mm:ss' a partir de las partes ya calculadas en la zona horaria. */
  function formatStamp(parts) {
    return parts.y + '-' + pad2(parts.m) + '-' + pad2(parts.d) + ' ' +
      pad2(parts.h) + ':' + pad2(parts.min) + ':' + pad2(parts.s);
  }

  /** Nombre de recurso marcado con el entorno: "[TEST] Etiqueta 2026-11-25 13-29-58". */
  function buildResourceName(env, label, stamp) {
    if (!env || !label) throw new Error('buildResourceName requiere env y label.');
    var name = '[' + env + '] ' + label;
    return stamp ? name + ' ' + String(stamp).replace(/:/g, '-') : name;
  }

  function hasEnvTag(name, env) {
    return typeof name === 'string' && name.indexOf('[' + env + '] ') === 0;
  }

  function sameEmail(a, b) {
    if (!a || !b) return false;
    return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
  }

  function maskEmail(email) {
    if (!email || email.indexOf('@') < 1) return null;
    var parts = email.split('@');
    return parts[0].charAt(0) + '***@' + parts[1];
  }

  function validateEnv(env, allowed) {
    var errors = [];
    if (!env) errors.push('ENV no está definido.');
    else if (allowed.indexOf(env) === -1) errors.push('ENV "' + env + '" no está habilitado en este proyecto (permitidos: ' + allowed.join(', ') + ').');
    return errors;
  }

  /** Compara dos matrices de valores (lo escrito vs. lo leído). */
  function valuesEqual(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (!Array.isArray(a[i]) || !Array.isArray(b[i]) || a[i].length !== b[i].length) return false;
      for (var j = 0; j < a[i].length; j++) {
        if (String(a[i][j]) !== String(b[i][j])) return false;
      }
    }
    return true;
  }

  /** Resume una lista de pasos {name, ok, detail}. */
  function summarizeSteps(steps) {
    var ok = steps.filter(function (s) { return s.ok; }).length;
    return { total: steps.length, ok: ok, passed: steps.length > 0 && ok === steps.length };
  }

  return {
    formatStamp: formatStamp,
    buildResourceName: buildResourceName,
    hasEnvTag: hasEnvTag,
    sameEmail: sameEmail,
    maskEmail: maskEmail,
    validateEnv: validateEnv,
    valuesEqual: valuesEqual,
    summarizeSteps: summarizeSteps
  };
})();
