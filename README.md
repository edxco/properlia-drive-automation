# Properlia · Automatización documental (Google Apps Script)

Herramienta interna de Properlia para organizar expedientes de propiedades en Google Drive / Sheets.

**Estado:** Fase 2.0 — entorno de desarrollo. Solo existe el entorno **TEST**, con datos ficticios.

## Inicio rápido

```bash
npm test               # sintaxis + manifiesto + pruebas unitarias (Node, sin Google)
npm run push:test      # pruebas + activa TEST + clasp push
npm run pull:test      # trae cambios hechos en el editor web
```

Antes del primer `push:test` hay que completar `config/clasp.test.json` (ver `docs/FLUJO-CLASP.md`).

## Documentación

| Documento | Contenido |
|---|---|
| `docs/ARQUITECTURA.md` | Estructura del repositorio y capas |
| `docs/ENTORNOS.md` | Entorno TEST, aislamiento y Script Properties |
| `docs/FLUJO-CLASP.md` | Conexión con Apps Script, sincronización y Git |
| `docs/PLAN-PRUEBAS.md` | Pruebas unitarias, integración y Web App |
| `docs/AUTORIZACIONES.md` | Acciones que requieren autorización, riesgos y decisiones pendientes |

## Reglas del proyecto

- No se usan propiedades reales ni datos de clientes en TEST.
- El código no borra, no mueve archivos y no cambia permisos (no existen funciones para ello).
- Scope de Drive: `drive.file` (solo archivos creados por la app). Ampliarlo requiere justificación y autorización.
- La Web App se ejecuta con acceso `MYSELF`. Nunca se publica para "Cualquiera".
