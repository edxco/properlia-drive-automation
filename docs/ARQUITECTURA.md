# Arquitectura

## Estructura del repositorio

```
properlia/
├── README.md
├── package.json              # scripts npm (test, push:test, pull:test)
├── .gitignore                # excluye .clasp.json y .clasprc.json
├── .claspignore
├── config/
│   ├── clasp.test.json                     # scriptId del proyecto Apps Script TEST
│   ├── clasp.prod.example.json             # plantilla; PROD no existe todavía
│   └── script-properties.test.example.json # referencia de Script Properties (sin valores reales)
├── scripts/
│   ├── use-env.js            # genera .clasp.json para el entorno elegido (solo "test")
│   └── check-syntax.js       # valida sintaxis y bloquea scopes amplios / acceso no MYSELF
├── src/                      # rootDir de clasp: todo lo que sube a Apps Script
│   ├── appsscript.json
│   ├── 00_config/            # Constants (fijo) y Config (Script Properties)
│   ├── 01_utils/             # Errors, Utils (puras, probables en Node), Clock
│   ├── 02_audit/             # AuditLog
│   ├── 03_repositories/      # DriveRepository, SheetRepository (único acceso a APIs)
│   ├── 04_services/          # Identity, EnvironmentGuard, Setup, Environment, IntegrationTest
│   ├── 05_api/               # Api (google.script.run), Main (editor), WebApp (doGet)
│   └── 06_ui/                # Index, Styles, Client (HTML Service)
├── tests/
│   ├── helpers/gas-loader.js # carga archivos de src/ en Node (vm)
│   ├── unit/                 # node --test
│   └── integration/          # checklist manual en Apps Script
└── docs/
```

## Capas y reglas de dependencia

```
UI (06_ui) → API (05_api) → Servicios (04_services) → Repositorios (03) → Drive API / Sheets API
                                   ↓                         ↓
                              Auditoría (02)            Config (00) · Utils (01)
```

- **Config** es el único módulo que lee `PropertiesService`.
- **Repositorios** son el único lugar que llama a `Drive.*` y `Sheets.*`. No exponen borrar, mover ni compartir.
- **Servicios** contienen la lógica; siempre pasan por `Identity.assertAuthorized()` y `EnvironmentGuard` antes de escribir.
- **API** valida acceso y convierte errores en `{error, code}` para la interfaz.
- **Utils** no usa servicios de Google para poder probarse en Node.

Apps Script carga todos los archivos en un espacio global. Cada módulo es un objeto (`var Modulo = (function(){...})()`) y solo usa otros módulos dentro de sus funciones, nunca al cargar; así el orden de los archivos no importa.

## Por qué Drive API / Sheets API (servicios avanzados) y no DriveApp / SpreadsheetApp

`DriveApp` y `SpreadsheetApp` exigen los scopes completos `auth/drive` y `auth/spreadsheets` (acceso a todo el Drive y todas las hojas). Las APIs avanzadas funcionan con `drive.file`, que limita al script a los archivos que él creó. Verificado en la Fase 1.1.

## Evolución prevista (sin implementar)

Nuevas funciones (generador de claves, expedientes) se agregan como un servicio en `04_services/`, su repositorio si necesita datos nuevos, un endpoint en `05_api/Api.js` y su pantalla en `06_ui/`.
