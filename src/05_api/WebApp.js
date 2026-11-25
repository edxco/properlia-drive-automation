/** Punto de entrada de la Web App. Acceso: MYSELF (manifiesto) + verificación de ALLOWED_USER_EMAIL. */
function doGet() {
  try {
    Identity.assertAuthorized();
  } catch (e) {
    return HtmlService.createHtmlOutput('<p>Acceso no autorizado.</p>').setTitle('Properlia');
  }
  var t = HtmlService.createTemplateFromFile('06_ui/Index');
  t.env = Config.get(CONSTANTS.PROP.ENV) || 'SIN ENV';
  return t.evaluate()
    .setTitle(CONSTANTS.PROJECT_NAME + ' [' + t.env + ']')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Incluye parciales HTML: <?!= include('06_ui/Styles') ?> */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
