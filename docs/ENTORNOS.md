# Entornos

## Principio

Cada entorno es **un proyecto Apps Script distinto**, con su propio `scriptId`, sus propias Script Properties y su propio proyecto de Google Cloud predeterminado. El código es el mismo; la configuración no se comparte.

| | TEST | PROD (futuro) |
|---|---|---|
| Proyecto Apps Script | `Properlia [TEST]` | No existe. Requiere autorización. |
| Config local | `config/clasp.test.json` | `config/clasp.prod.json` (no creado) |
| `ENV` | `TEST` | `PROD` |
| Carpeta raíz | `[TEST] Properlia` (creada por el script) | Por definir |
| Datos | Ficticios | Reales |

## Aislamiento del entorno TEST (capas)

1. **Scope `drive.file`**: el proyecto TEST solo puede ver archivos que él mismo creó. No puede leer ni modificar carpetas de producción ni expedientes existentes, aunque el código lo intentara. Como cada proyecto Apps Script usa su propio cliente OAuth, el proyecto TEST tampoco ve archivos creados por otros proyectos (incluido el proyecto de prueba de la Fase 1.1).
2. **`ENV` validado**: `CONSTANTS.ALLOWED_ENVS = ['TEST']`. Si `ENV` falta o es otro valor, toda operación falla.
3. **Marca en cada recurso**: todo archivo creado lleva `appProperties` `{properliaApp: 'properlia', properliaEnv: 'TEST'}` y el prefijo `[TEST]` en el nombre. `EnvironmentGuard.assertBelongsToEnv()` lo verifica.
4. **Dentro de la raíz**: `EnvironmentGuard.assertInsideRoot()` comprueba que cada recurso esté bajo la carpeta raíz TEST.
5. **Usuario autorizado**: `ALLOWED_USER_EMAIL` — cualquier otro usuario recibe "Acceso no autorizado".
6. **Herramientas locales**: `scripts/use-env.js` solo acepta `test`; `check-syntax.js` impide subir con scopes `auth/drive` o `auth/spreadsheets` o con acceso distinto a `MYSELF`.

## Script Properties (proyecto TEST)

| Clave | Quién la define | Valor |
|---|---|---|
| `ENV` | Manual (editor web) | `TEST` |
| `ALLOWED_USER_EMAIL` | Manual (editor web) | Cuenta autorizada |
| `ROOT_FOLDER_ID` | `setupTestEnvironment()` | ID de `[TEST] Properlia` |
| `REGISTRY_SHEET_ID` | `setupTestEnvironment()` | ID de `[TEST] Properlia - Registro` |

`ENV` y `ALLOWED_USER_EMAIL` solo se editan a mano en *Configuración del proyecto → Propiedades de la secuencia de comandos*. El código no puede modificarlas (`Config.set` las rechaza).

## Estructura de recursos TEST

```
Mi unidad/
└── [TEST] Properlia/
    ├── [TEST] Properlia - Registro        (pestañas: Registro, Auditoria, Pruebas)
    └── [TEST] Prueba de integración <fecha>/
        └── [TEST] Prueba de integración <fecha> - Hoja
```
