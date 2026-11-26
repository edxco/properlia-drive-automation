# Claves institucionales de propiedades

> Documento generado automáticamente desde `src/00_config/KeyCatalog.js`. **No editar a mano.**
> Para cambiar un código: modificar el catálogo (con autorización), aumentar su versión y ejecutar `npm run docs:keys`.

Versión del catálogo: **2026.1** · Aprobado: 2026-11-26

## Formato

`[ORIGEN]-[OPERACIÓN]-[TIPO]-[ZONA]`

- Separador: `-`. Solo mayúsculas, sin espacios.
- Sufijo de duplicado: `-NN`, de `-02` a `-99`, solo con autorización explícita.
- La primera propiedad de una combinación usa la clave base sin sufijo; no se renombran claves históricas.
- Los sufijos se asignan siempre como el mayor existente más uno; un número usado nunca se reutiliza.
- La clave se asigna al registrar y es permanente: no se reconstruye cuando cambian campos comerciales.

## Origen

Campo obligatorio y explícito del formulario; nunca se infiere de otros datos.

| Código | Origen | Valor del formulario |
| --- | --- | --- |
| `PR` | Properlia | Properlia |
| `KW` | Keller Williams | Keller Williams |
| `AE` | Asesor externo | Asesor externo |

## Operación

| Código | Significado |
| --- | --- |
| `LV` | Lado vendedor / venta |
| `LA` | Lado arrendador / renta |

Excluidas del registro de propiedades: `LC`, `CR`.

### Modalidad comercial

Campo independiente de la clave. Solo determina la operación al registrar; si después cambia, la clave se conserva.

| Modalidad | Operación de la clave |
| --- | --- |
| Preventa | `LV` (Lado vendedor / venta) |
| Venta | `LV` (Lado vendedor / venta) |
| Renta | `LA` (Lado arrendador / renta) |

## Tipo de propiedad

| Código | Tipo | Valor del formulario | Nota |
| --- | --- | --- | --- |
| `DEP` | Departamento | Departamento |  |
| `CASA` | Casa | Casa |  |
| `TER` | Terreno | Terreno |  |
| `LOC` | Local comercial | Local comercial |  |
| `BONA` | Bodega o nave | Bodega o nave | Nuevo en 2026.1 |
| `CMED` | Consultorio | Consultorio | Nuevo en 2026.1 |
| `OF` | Oficina | Oficina |  |

Códigos reservados (no asignables desde el formulario):

| Código | Categoría | Nota |
| --- | --- | --- |
| `IND` | Industrial | Reservado; no asignado a opciones del formulario |

## Zona

Solo zonas del Manual institucional. Una zona no catalogada bloquea la generación y requiere su incorporación formal al catálogo.

| Código | Zona |
| --- | --- |
| `ZAV` | Zavaleta |
| `ATL` | Atlixco |
| `BAR` | El Barreal |
| `TLAX` | Tlaxcalancingo |
| `UDL` | Zona UDLAP |
| `CHL` | Cholula |
| `SACH` | San Andrés Cholula |
| `CUAU` | Cuautlancingo |
| `SON` | Sonata |
| `LMS` | Lomas de Angelópolis |
| `ANG` | Angelópolis |
| `CEN` | Centro |
| `SJO` | San José |

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
