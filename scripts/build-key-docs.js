#!/usr/bin/env node
// Genera docs/CLAVES.md a partir de src/00_config/KeyCatalog.js (fuente única de verdad).
//   node scripts/build-key-docs.js          → escribe docs/CLAVES.md
//   node scripts/build-key-docs.js --check  → falla si docs/CLAVES.md no coincide con el catálogo
// La salida es determinista: solo depende del catálogo.
const fs = require('fs');
const path = require('path');
const { loadGas } = require('../tests/helpers/gas-loader');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'CLAVES.md');

function table(headers, rows) {
  const line = (cells) => '| ' + cells.join(' | ') + ' |';
  return [line(headers), line(headers.map(() => '---')), ...rows.map(line)].join('\n');
}

function code(s) { return '`' + s + '`'; }

function buildMarkdown(C) {
  const sep = C.format.separator;
  const sfx = C.format.suffix;
  const pad = (n) => String(n).padStart(sfx.digits, '0');
  const opName = Object.fromEntries(C.operations.map((o) => [o.code, o.name]));

  return [
    '# Claves institucionales de propiedades',
    '',
    '> Documento generado automáticamente desde `src/00_config/KeyCatalog.js`. **No editar a mano.**',
    '> Para cambiar un código: modificar el catálogo (con autorización), aumentar su versión y ejecutar `npm run docs:keys`.',
    '',
    `Versión del catálogo: **${C.version}** · Aprobado: ${C.approvedOn}`,
    '',
    '## Formato',
    '',
    code(['ORIGEN', 'OPERACIÓN', 'TIPO', 'ZONA'].map((s) => `[${s}]`).join(sep)),
    '',
    `- Separador: ${code(sep)}. Solo mayúsculas, sin espacios.`,
    `- Sufijo de duplicado: ${code(sep + 'NN')}, de ${code(sep + pad(sfx.firstDuplicate))} a ${code(sep + pad(sfx.max))}, solo con autorización explícita.`,
    '- La primera propiedad de una combinación usa la clave base sin sufijo; no se renombran claves históricas.',
    '- Los sufijos se asignan siempre como el mayor existente más uno; un número usado nunca se reutiliza.',
    '- La clave se asigna al registrar y es permanente: no se reconstruye cuando cambian campos comerciales.',
    '',
    '## Origen',
    '',
    'Campo obligatorio y explícito del formulario; nunca se infiere de otros datos.',
    '',
    table(['Código', 'Origen', 'Valor del formulario', 'ID de opción'], C.origins.map((o) => [code(o.code), o.name, o.formValue, code(o.formOptionId)])),
    '',
    '## Operación',
    '',
    table(['Código', 'Significado'], C.operations.map((o) => [code(o.code), o.name])),
    '',
    `Excluidas del registro de propiedades: ${C.excludedOperations.map(code).join(', ')}.`,
    '',
    '### Modalidad comercial',
    '',
    'Campo independiente de la clave. Solo determina la operación al registrar; si después cambia, la clave se conserva.',
    '',
    table(['Modalidad', 'Operación de la clave', 'ID de opción'], C.modalities.map((m) => [m.formValue, `${code(m.operation)} (${opName[m.operation]})`, code(m.formOptionId)])),
    '',
    `Comercialización simultánea: una propiedad ofrecida en venta y renta a la vez se registra una sola vez como ${C.simultaneousOffer.registerAs} (${code(C.simultaneousOffer.operation)}).`,
    '',
    '## Tipo de propiedad',
    '',
    table(['Código', 'Tipo', 'Valor del formulario', 'ID de opción', 'Nota'],
      C.types.map((t) => [code(t.code), t.name, t.formValue, code(t.formOptionId), t.since ? `Nuevo en ${t.since}` : ''])),
    '',
    'Códigos reservados (no asignables desde el formulario):',
    '',
    table(['Código', 'Categoría', 'Nota'], C.reservedTypeCodes.map((r) => [code(r.code), r.name, r.note])),
    '',
    '## Zona',
    '',
    'Solo zonas del Manual institucional. Una zona no catalogada bloquea la generación y requiere su incorporación formal al catálogo.',
    '',
    table(['Código', 'Zona', 'ID de opción'], C.zones.map((z) => [code(z.code), z.name, code(z.formOptionId)])),
    '',
    '## Campos que no forman parte de la clave',
    '',
    C.keyIgnoredFields.map(code).join(', ') + '.',
    '',
    '## Validaciones y errores',
    '',
    table(['Código de error', 'Cuándo'], [
      [code('MISSING_FIELD'), 'Falta origen, modalidad, tipo o zona'],
      [code('INVALID_VALUE'), 'Un campo no es texto'],
      [code('INVALID_INPUT'), 'La entrada no tiene la forma esperada'],
      [code('INVALID_ORIGIN'), 'Origen fuera del catálogo'],
      [code('INVALID_OPERATION'), 'Modalidad u operación fuera del catálogo (incluye `PRE`)'],
      [code('EXCLUDED_OPERATION'), 'Operación excluida del registro de propiedades'],
      [code('INVALID_TYPE'), 'Tipo fuera del catálogo (incluye códigos reservados)'],
      [code('ZONE_NOT_CATALOGED'), 'Zona fuera del catálogo'],
      [code('INVALID_FORMAT'), 'La clave no cumple el formato (mayúsculas, separador, segmentos)'],
      [code('INVALID_SUFFIX'), `Sufijo fuera de ${code(sep + pad(sfx.firstDuplicate))} a ${code(sep + pad(sfx.max))}`],
      [code('DUPLICATE_KEY'), 'La combinación ya existe y no hay autorización'],
      [code('AUTHORIZATION_INVALID'), 'Autorización incompleta o que no reconoce todas las claves existentes'],
      [code('SUFFIX_EXHAUSTED'), `La combinación ya llegó a ${code(sep + pad(sfx.max))}`],
      [code('INVALID_BASE_KEY'), 'La clave base para revisar duplicados no es válida o ya tiene sufijo']
    ]),
    '',
    '## Funciones',
    '',
    '- `generatePropertyKey({ origen, modalidad, tipo, zona })`: genera la clave base.',
    '- `validatePropertyKey(clave)`: valida una clave escrita y la descompone.',
    '- `resolveDuplicate(claveBase, existentes, autorizacion)`: decide la clave final frente a las existentes.',
    '',
    'Las cuatro entradas del generador aceptan el texto de la opción, su código o su ID de opción.',
    '',
    '## Historial de versiones',
    '',
    table(['Versión', 'Fecha', 'Cambio'], C.changelog.map((c) => [c.version, c.date, c.summary])),
    ''
  ].join('\n');
}

function loadCatalog() {
  return loadGas(['00_config/KeyCatalog.js']).KEY_CATALOG;
}

module.exports = { buildMarkdown, loadCatalog, OUT };

if (require.main === module) {
  const md = buildMarkdown(loadCatalog());
  if (process.argv.includes('--check')) {
    const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (current !== md) {
      console.error('[docs:keys] docs/CLAVES.md no coincide con el catálogo. Ejecuta: npm run docs:keys');
      process.exit(1);
    }
    console.log('[docs:keys] docs/CLAVES.md está sincronizado con el catálogo.');
  } else {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, md);
    console.log(`[docs:keys] Generado ${path.relative(ROOT, OUT)} (catálogo ${loadCatalog().version}).`);
  }
}
