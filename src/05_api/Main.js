/**
 * Funciones para ejecutar manualmente desde el editor de Apps Script (menú "Ejecutar").
 */
function setupTestEnvironment() {
  var r = SetupService.run();
  Logger.log(JSON.stringify(r, null, 2));
  return r;
}

function runIntegrationTest() {
  return IntegrationTestService.run();
}

function showStatus() {
  var s = EnvironmentService.getStatus();
  Logger.log(JSON.stringify(s, null, 2));
  return s;
}
