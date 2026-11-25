# Flujo de desarrollo con clasp

## Configuración inicial (una sola vez, requiere autorización — ver AUTORIZACIONES.md)

1. **Activar la API de Apps Script** para la cuenta que usará clasp:
   https://script.google.com/home/usersettings → "API de Google Apps Script" → Activado.
2. **Iniciar sesión** en clasp con esa cuenta:
   ```bash
   clasp login
   ```
   El token queda en `~/.clasprc.json` (nunca en el repositorio).
3. **Crear el proyecto TEST** (independiente) desde la raíz del repositorio:
   ```bash
   # clasp 2.x
   clasp create --type standalone --title "Properlia [TEST]" --rootDir src
   # clasp 3.x
   clasp create-script --type standalone --title "Properlia [TEST]" --rootDir src
   ```
   clasp genera `.clasp.json`. Copiar su `scriptId` a `config/clasp.test.json` y hacer commit de ese archivo.
   Si clasp sobrescribió `src/appsscript.json`, restaurarlo con `git checkout src/appsscript.json`.
4. **Subir el código**:
   ```bash
   npm run push:test
   ```
5. **Configurar Script Properties** en el editor web (`ENV=TEST`, `ALLOWED_USER_EMAIL=...`).
6. **Ejecutar `setupTestEnvironment`** desde el editor (autoriza los scopes la primera vez).

## Comandos diarios

| Acción | Comando |
|---|---|
| Pruebas locales | `npm test` |
| Activar TEST (genera `.clasp.json`) | `npm run env:test` |
| Ver qué archivos se subirían | `npm run status:test` |
| Subir código a TEST | `npm run push:test` |
| Traer cambios hechos en el editor web | `npm run pull:test` |
| Abrir el editor | `clasp open` (2.x) / `clasp open-script` (3.x) |
| Ver registros | Editor → Ejecuciones |

## Sincronización

- **La fuente de verdad es Git**, no el editor web. Se edita localmente y se sube con `push:test`.
- `clasp push` **reemplaza** todos los archivos del proyecto remoto por los de `src/`. Si alguien editó en el web, hacer `pull:test` y commit antes de volver a subir.
- `push:test` corre `npm test` primero; si falla, no sube nada.

## Git

- Rama `main`: siempre estable y desplegable en TEST.
- Ramas `feature/<tema>` para cada cambio; merge a `main` cuando pasan las pruebas de integración.
- Commit antes de cada `push:test`, para que lo que hay en Apps Script corresponda a un commit.
- Al crear una versión de Apps Script (implementación), etiquetar el commit: `git tag test-v<N>`.
- No se versionan: `.clasp.json`, `.clasprc.json`, `config/*.local.json`.

## Web App en TEST

Se usa la **implementación de prueba** (Implementar → Implementaciones de prueba → URL terminada en `/dev`):
siempre ejecuta el último código subido y solo la pueden abrir usuarios con acceso de edición al proyecto. No crea versiones ni requiere publicar.

Una implementación versionada (`clasp deploy`) solo se hará con autorización, con `access: MYSELF`.

## Separación de entornos

- Un `scriptId` por entorno, en `config/clasp.<env>.json`. `.clasp.json` es temporal y lo genera `use-env.js`.
- `use-env.js` solo acepta `test`. Habilitar `prod` requiere cambiar el script deliberadamente en una fase autorizada.
- Script Properties distintas por proyecto: no hay forma de que TEST lea la configuración de PROD.
