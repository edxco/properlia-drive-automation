# Autorizaciones, riesgos y decisiones pendientes

## Acciones que requieren autorización (en orden)

| # | Acción | Qué cambia | Dónde | Reversible |
|---|---|---|---|---|
| A-1 | Activar "API de Google Apps Script" en la configuración del usuario | Ajuste de la cuenta (permite que clasp administre proyectos) | Cuenta que use clasp | Sí, desactivándola |
| A-2 | `clasp login` | Otorga a clasp (app oficial de Google) acceso a proyectos de Apps Script, implementaciones, metadatos de Drive y registros; guarda un token en la computadora local | Cuenta + computadora de quien desarrolla | Sí, revocando en "Apps vinculadas" y borrando `~/.clasprc.json` |
| A-3 | `clasp create` "Properlia [TEST]" | Crea un proyecto Apps Script independiente en Mi unidad | Drive de la cuenta | — (no se borra, por regla del proyecto) |
| A-4 | `clasp push` | Sube el código de `src/` al proyecto TEST | Proyecto TEST | Sí (push de otra versión) |
| A-5 | Capturar Script Properties `ENV`, `ALLOWED_USER_EMAIL` | Configuración del proyecto TEST | Proyecto TEST | Sí |
| A-6 | Primera ejecución: autorizar scopes `userinfo.email` + `drive.file` | Consentimiento OAuth del proyecto TEST | Cuenta | Sí, en "Apps vinculadas" |
| A-7 | `setupTestEnvironment` | Crea carpeta `[TEST] Properlia` y hoja de registro | Mi unidad | — |
| A-8 | `runIntegrationTest` | Crea una carpeta y una hoja de prueba por ejecución, dentro de la raíz TEST | Carpeta TEST | — |
| A-9 | Abrir la implementación de prueba `/dev` | Ninguno (no publica) | — | — |

No se pedirá: scope `auth/drive`, scope `auth/spreadsheets`, Web App pública, implementación versionada, unidad compartida.

## Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Todo vive en la cuenta de Leslie dentro del dominio de KW | Si cambia la relación con KW o la política del administrador, se pierde acceso al código y los datos | El código vive en Git (repositorio de Properlia). Decidir propiedad de datos antes de PROD |
| clasp con la cuenta de Leslie en la computadora de Lalo | El token de clasp da acceso a proyectos de Apps Script y metadatos de Drive de esa cuenta desde otra computadora | Opción B de D-1; proteger `~/.clasprc.json`; revocar al terminar |
| `clasp push` sobrescribe cambios hechos en el editor web | Pérdida de cambios | Regla: editar solo localmente; `pull:test` antes de cualquier push si hubo edición web |
| Recursos de prueba se acumulan (no se borran) | Desorden en la carpeta TEST | Todo queda dentro de `[TEST] Properlia`; limpieza manual por el usuario si lo decide |
| `drive.file` no permite trabajar con carpetas existentes | Si PROD debe usar carpetas que ya existen, habrá que ampliar el scope | Decidir en D-3 antes de PROD; preferir que el sistema cree su propia estructura |
| Comandos distintos entre clasp 2.x y 3.x | Errores en la configuración inicial | Documentados ambos en FLUJO-CLASP.md |

## Decisiones pendientes

- **D-1 · Cuenta para desarrollar con clasp.**
  - A) Lalo inicia sesión en clasp con la cuenta de Leslie (más simple; el token de su cuenta queda en la computadora de Lalo).
  - B) Leslie crea el proyecto TEST y lo comparte como editor con la cuenta de Lalo (Asymm); Lalo usa clasp con su propia cuenta. Implica compartir un archivo con un usuario externo a KW (cambio de permisos de ese archivo nuevo). Las ejecuciones de prueba las haría Leslie o se ajusta `ALLOWED_USER_EMAIL`.
- **D-2 · Usuario autorizado (`ALLOWED_USER_EMAIL`)** para TEST.
- **D-3 · Alcance de Drive para producción**: ¿el sistema solo crea su propia estructura (`drive.file`, recomendado) o debe operar sobre carpetas existentes (`auth/drive`)?
- **D-4 · Propiedad de los datos en producción**: cuenta de Leslie en KW, unidad compartida solicitada al administrador de KW, o Workspace propio de Properlia.
- **D-5 · Repositorio remoto de Git** (GitHub/GitLab de Asymm o de Properlia) y quién lo administra.
