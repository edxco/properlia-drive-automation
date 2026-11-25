/**
 * Constantes del proyecto. Sin lógica ni dependencias.
 * Los valores que cambian por entorno NO van aquí: van en Script Properties (ver Config.js).
 */
var CONSTANTS = Object.freeze({
  PROJECT_NAME: 'Properlia',
  APP_TAG: 'properlia',
  TIMEZONE: 'America/Mexico_City',
  // Entornos habilitados en ESTE proyecto Apps Script. PROD vivirá en un proyecto distinto.
  ALLOWED_ENVS: ['TEST'],
  // Claves de Script Properties
  PROP: Object.freeze({
    ENV: 'ENV',
    ALLOWED_USER_EMAIL: 'ALLOWED_USER_EMAIL',
    ROOT_FOLDER_ID: 'ROOT_FOLDER_ID',
    REGISTRY_SHEET_ID: 'REGISTRY_SHEET_ID'
  }),
  // Únicas propiedades que el código puede escribir (las genera el setup)
  WRITABLE_PROPS: ['ROOT_FOLDER_ID', 'REGISTRY_SHEET_ID'],
  MIME: Object.freeze({
    FOLDER: 'application/vnd.google-apps.folder',
    SHEET: 'application/vnd.google-apps.spreadsheet'
  }),
  TABS: Object.freeze({
    REGISTRO: 'Registro',
    AUDITORIA: 'Auditoria',
    PRUEBAS: 'Pruebas'
  }),
  HEADERS: Object.freeze({
    Registro: ['ID', 'Propiedad', 'Colonia', 'Estatus', 'Creado'],
    Auditoria: ['Fecha', 'Entorno', 'Usuario', 'Accion', 'Recurso', 'Resultado', 'Detalle'],
    Pruebas: ['Fecha', 'Entorno', 'Usuario', 'Resultado', 'Pasos OK', 'Pasos totales', 'Carpeta', 'Hoja']
  })
});
