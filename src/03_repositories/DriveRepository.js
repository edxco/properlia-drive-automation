/**
 * Acceso a Drive mediante Drive API v3 (servicio avanzado) con scope drive.file:
 * el script solo ve y edita archivos que él mismo creó.
 * Este módulo NO borra, NO mueve y NO cambia permisos. No existen funciones para ello.
 */
var DriveRepository = (function () {
  var META_FIELDS = 'id,name,mimeType,parents,appProperties,webViewLink,createdTime';

  function envProperties_(env) {
    return { properliaApp: CONSTANTS.APP_TAG, properliaEnv: env };
  }

  function create_(name, mimeType, parentId, env) {
    var resource = { name: name, mimeType: mimeType, appProperties: envProperties_(env) };
    if (parentId) resource.parents = [parentId];
    var created = Drive.Files.create(resource);
    return getMeta(created.id);
  }

  function createFolder(name, parentId, env) {
    return create_(name, CONSTANTS.MIME.FOLDER, parentId, env);
  }

  function createSpreadsheet(name, parentId, env) {
    return create_(name, CONSTANTS.MIME.SHEET, parentId, env);
  }

  function getMeta(fileId) {
    return Drive.Files.get(fileId, { fields: META_FIELDS });
  }

  /** true si el archivo existe, es accesible y no está en la papelera. */
  function exists(fileId) {
    if (!fileId) return false;
    try {
      var f = Drive.Files.get(fileId, { fields: 'id,trashed' });
      return !f.trashed;
    } catch (e) {
      return false;
    }
  }

  return { createFolder: createFolder, createSpreadsheet: createSpreadsheet, getMeta: getMeta, exists: exists };
})();
