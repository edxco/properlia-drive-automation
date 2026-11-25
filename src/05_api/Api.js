/**
 * Endpoints para la interfaz (google.script.run). Todos validan acceso.
 * Devuelven objetos simples (serializables). Los errores se convierten en {error}.
 */
function api_getStatus() {
  return safe_(function () {
    Identity.assertAuthorized();
    return EnvironmentService.getStatus();
  });
}

function api_runIntegrationTest() {
  return safe_(function () {
    Identity.assertAuthorized();
    return IntegrationTestService.run();
  });
}

function safe_(fn) {
  try {
    return fn();
  } catch (e) {
    Logger.log('[API] ' + e.message);
    return { error: e.message, code: e.code || 'UNEXPECTED' };
  }
}
