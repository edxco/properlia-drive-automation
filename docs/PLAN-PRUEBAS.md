# Plan de pruebas

## 1. Unitarias (local, sin Google) — `npm test`

| Prueba | Verifica |
|---|---|
| Sintaxis y manifiesto | Todos los `.js` compilan; no hay scopes `auth/drive` ni `auth/spreadsheets`; Web App con `MYSELF` |
| `utils.test.js` | Nombres con prefijo `[TEST]`, validación de ENV, comparación de correos y de datos |
| `guards.test.js` | PROD rechazado; `ENV` no editable desde código; marca de entorno; recursos fuera de la raíz rechazados |

## 2. Integración (Apps Script, cuenta autorizada)

Ejecutar en orden desde el editor. Ver `tests/integration/CHECKLIST.md`.

| # | Función | Resultado esperado |
|---|---|---|
| I-1 | `showStatus` (sin Script Properties) | Error claro: falta `ENV` |
| I-2 | `showStatus` (con `ENV=TEST`) | "Entorno sin inicializar" |
| I-3 | `setupTestEnvironment` | Crea `[TEST] Properlia` y `[TEST] Properlia - Registro`; guarda los IDs |
| I-4 | `setupTestEnvironment` (2.ª vez) | "Sin cambios": no duplica recursos |
| I-5 | `runIntegrationTest` | 7/7 pasos OK; fila en pestaña Pruebas y Auditoria |
| I-6 | `showStatus` | Conexión OK con enlaces a carpeta y hoja |

Pasos de `runIntegrationTest`: identidad del usuario · ejecución de Apps Script · lectura de configuración · creación de carpeta · creación de hoja · escritura y lectura de datos ficticios · recursos marcados como TEST y dentro de la raíz.

## 3. Pruebas negativas (seguridad)

| # | Escenario | Esperado |
|---|---|---|
| N-1 | Cambiar `ENV` a `PROD` y ejecutar `runIntegrationTest` | Falla en "Lectura de configuración" (`ENV_INVALID`); no crea nada |
| N-2 | `ALLOWED_USER_EMAIL` con otra cuenta | `ACCESS_DENIED`; Web App muestra "Acceso no autorizado" |
| N-3 | Agregar `auth/drive` al manifiesto y `npm test` | `check-syntax` bloquea el push |
| N-4 | `node scripts/use-env.js prod` | Rechazado |

Tras N-1 y N-2, restaurar los valores correctos.

## 4. Web App (implementación de prueba `/dev`)

| # | Verifica |
|---|---|
| W-1 | Muestra "Properlia", insignia TEST, usuario ejecutor |
| W-2 | Estado de conexión OK con enlaces |
| W-3 | Botón "Ejecutar prueba" muestra 7/7 pasos y enlaces a los recursos creados |
| W-4 | Abrir la URL con otra cuenta → sin acceso |

## Criterio de aceptación de la Fase 2.0

Unitarias 11/11, integración I-1…I-6, negativas N-1…N-4 y Web App W-1…W-4 correctas. Ningún archivo fuera de `[TEST] Properlia` creado o modificado.
