# Claves institucionales de propiedades

> Documento generado automáticamente desde `src/00_config/KeyCatalog.js`. **No editar a mano.**
> Para cambiar un código: modificar el catálogo (con autorización), aumentar su versión y ejecutar `npm run docs:keys`.

Versión del catálogo: **2026.2** · Aprobado: 2026-11-26

## Formato

`[ORIGEN]-[OPERACIÓN]-[TIPO]-[ZONA]`

- Separador: `-`. Solo mayúsculas, sin espacios.
- Sufijo de duplicado: `-NN`, de `-02` a `-99`, solo con autorización explícita.
- La primera propiedad de una combinación usa la clave base sin sufijo; no se renombran claves históricas.
- Los sufijos se asignan siempre como el mayor existente más uno; un número usado nunca se reutiliza.
- La clave se asigna al registrar y es permanente: no se reconstruye cuando cambian campos comerciales.

## Origen

Campo obligatorio y explícito del formulario; nunca se infiere de otros datos.

| Código | Origen | Valor del formulario | ID de opción |
| --- | --- | --- | --- |
| `PR` | Properlia | Properlia | `origen-01` |
| `KW` | Keller Williams | Keller Williams | `origen-02` |
| `AE` | Asesor externo | Asesor externo | `origen-03` |

## Operación

| Código | Significado |
| --- | --- |
| `LV` | Lado vendedor / venta |
| `LA` | Lado arrendador / renta |

Excluidas del registro de propiedades: `LC`, `CR`.

### Modalidad comercial

Campo independiente de la clave. Solo determina la operación al registrar; si después cambia, la clave se conserva.

| Modalidad | Operación de la clave | ID de opción |
| --- | --- | --- |
| Preventa | `LV` (Lado vendedor / venta) | `a7f8e2d1-3c4b-5a6e-9f8d-7c1b2a3e4f5d` |
| Venta | `LV` (Lado vendedor / venta) | `b8e9f3d2-4c5a-6b7e-0f9e-8d2c3b4e5f6a` |
| Renta | `LA` (Lado arrendador / renta) | `c9f0e4d3-5c6b-7a8e-1f0e-9d3c4b5e6f7b` |

Comercialización simultánea: una propiedad ofrecida en venta y renta a la vez se registra una sola vez como Venta (`LV`).

## Tipo de propiedad

| Código | Tipo | Valor del formulario | ID de opción | Nota |
| --- | --- | --- | --- | --- |
| `DEP` | Departamento | Departamento | `0221da24-d7df-4052-a63d-2d16501ec360` |  |
| `CASA` | Casa | Casa | `6431658b-1ebc-4805-ac61-97bf39699353` |  |
| `TER` | Terreno | Terreno | `23d3905f-a5c1-4372-995e-362b2c10f77f` |  |
| `LOC` | Local comercial | Local comercial | `044af3c1-7cea-4ec5-86e7-07b10afdb147` |  |
| `BONA` | Bodega o nave | Bodega o nave | `37beb05a-ff6a-4138-8959-c2c9be60e6f5` | Nuevo en 2026.1 |
| `CMED` | Consultorio | Consultorio | `7f91886c-4822-4a9d-9f44-867c8702951b` | Nuevo en 2026.1 |
| `OF` | Oficina | Oficina | `1b89a6d4-83e3-4c55-9852-64f33060d034` |  |

Códigos reservados (no asignables desde el formulario):

| Código | Categoría | Nota |
| --- | --- | --- |
| `IND` | Industrial | Reservado; no asignado a opciones del formulario |

## Zona

Solo zonas del Manual institucional. Una zona no catalogada bloquea la generación y requiere su incorporación formal al catálogo.

| Código | Zona | ID de opción |
| --- | --- | --- |
| `ZAV` | Zavaleta | `zona-01` |
| `ATL` | Atlixco | `zona-02` |
| `BAR` | El Barreal | `zona-03` |
| `TLAX` | Tlaxcalancingo | `zona-04` |
| `UDL` | Zona UDLAP | `zona-05` |
| `CHL` | Cholula | `zona-06` |
| `SACH` | San Andrés Cholula | `zona-07` |
| `CUAU` | Cuautlancingo | `zona-08` |
| `SON` | Sonata | `zona-09` |
| `LMS` | Lomas de Angelópolis | `zona-10` |
| `ANG` | Angelópolis | `zona-11` |
| `CEN` | Centro | `zona-12` |
| `SJO` | San José | `zona-13` |

## Campos que no forman parte de la clave

`precio`, `fecha`, `anio`, `estatus`, `asesor`, `comision`, `prioridad`, `etapa`, `modalidad`, `exclusividad`, `propietario`, `informacionComercial`.

## Validaciones y errores

| Código de error | Cuándo |
| --- | --- |
| `MISSING_FIELD` | Falta origen, modalidad, tipo o zona |
| `INVALID_VALUE` | Un campo no es texto |
| `INVALID_INPUT` | La entrada no tiene la forma esperada |
| `INVALID_ORIGIN` | Origen fuera del catálogo |
| `INVALID_OPERATION` | Modalidad u operación fuera del catálogo (incluye `PRE`) |
| `EXCLUDED_OPERATION` | Operación excluida del registro de propiedades |
| `INVALID_TYPE` | Tipo fuera del catálogo (incluye códigos reservados) |
| `ZONE_NOT_CATALOGED` | Zona fuera del catálogo |
| `INVALID_FORMAT` | La clave no cumple el formato (mayúsculas, separador, segmentos) |
| `INVALID_SUFFIX` | Sufijo fuera de `-02` a `-99` |
| `DUPLICATE_KEY` | La combinación ya existe y no hay autorización |
| `AUTHORIZATION_INVALID` | Autorización incompleta o que no reconoce todas las claves existentes |
| `SUFFIX_EXHAUSTED` | La combinación ya llegó a `-99` |
| `INVALID_BASE_KEY` | La clave base para revisar duplicados no es válida o ya tiene sufijo |

## Funciones

- `generatePropertyKey({ origen, modalidad, tipo, zona })`: genera la clave base.
- `validatePropertyKey(clave)`: valida una clave escrita y la descompone.
- `resolveDuplicate(claveBase, existentes, autorizacion)`: decide la clave final frente a las existentes.

Las cuatro entradas del generador aceptan el texto de la opción, su código o su ID de opción.

## Historial de versiones

| Versión | Fecha | Cambio |
| --- | --- | --- |
| 2026.1 | 2026-11-26 | Catálogo inicial: decisiones D-01 a D-13 de la Fase 2.1. |
| 2026.2 | 2026-11-26 | IDs de opciones del formulario (G-4) y regla de comercialización simultánea (G-6). |
