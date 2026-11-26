/**
 * Generador (T2), validador (T3) y resolución de duplicados (T4) de claves institucionales (Fase 2.1).
 *
 * Función pura: no usa Drive, Sheets, Apps Script ni servicios externos.
 * Única fuente de códigos: KEY_CATALOG (src/00_config/KeyCatalog.js).
 *
 * Entrada (valores del formulario o códigos del catálogo):
 *   { origen, modalidad, tipo, zona, ...otros }
 *   - origen:    'Properlia' | 'Keller Williams' | 'Asesor externo' (o PR, KW, AE). Obligatorio; nunca se infiere.
 *   - modalidad: 'Preventa' | 'Venta' | 'Renta' (o LV, LA), o una lista si se ofrece en varias a la vez.
 *                Solo determina la operación AL REGISTRAR. Venta y Renta a la vez → Venta (LV), regla G-6.
 *   - tipo:      opción del formulario (o su código).
 *   - zona:      zona del Manual (o su código). Texto libre no catalogado se rechaza.
 *   Los cuatro campos aceptan también el ID de la opción del formulario (formOptionId).
 *   Cualquier otro campo (precio, fecha, asesor, estatus…) se ignora y nunca altera la clave.
 *
 * Salida:
 *   { ok, key, components, modality, modalities, errors, warnings, catalogVersion }
 *   modality = modalidad con la que se registra; modalities = todas las ofrecidas.
 *   Si hay cualquier error: ok=false, key=null, components=null. Nunca hay claves parciales.
 *
 * Permanencia (D-01, D-12): esta función se usa solo al registrar. Una clave existente no se
 * vuelve a generar cuando cambian campos comerciales, incluida la modalidad.
 */
var PropertyKey = (function () {
  var FIELDS = Object.freeze({ origin: 'origen', modality: 'modalidad', type: 'tipo', zone: 'zona' });

  /** Mayúsculas, sin acentos, espacios colapsados y recortados. */
  function normalize(value) {
    return String(value)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

  var index_ = null;
  function index() {
    if (index_) return index_;
    var C = KEY_CATALOG;
    function byKeys(list, keysOf) {
      var m = {};
      list.forEach(function (item) {
        keysOf(item).forEach(function (k) { if (k) m[normalize(k)] = item; });
      });
      return m;
    }
    var operationsByCode = byKeys(C.operations, function (o) { return [o.code]; });
    index_ = {
      origins: byKeys(C.origins, function (o) { return [o.code, o.formValue, o.name, o.formOptionId]; }),
      modalities: byKeys(C.modalities, function (m) { return [m.formValue, m.name, m.formOptionId]; }),
      operations: operationsByCode,
      excludedOperations: C.excludedOperations.map(normalize),
      types: byKeys(C.types, function (t) { return [t.code, t.formValue, t.name, t.formOptionId]; }),
      reservedTypes: byKeys(C.reservedTypeCodes, function (t) { return [t.code, t.name]; }),
      zones: byKeys(C.zones, function (z) { return [z.code, z.formValue, z.name, z.formOptionId]; }),
      keyPattern: new RegExp('^' + [
        codesAlt(C.origins), codesAlt(C.operations), codesAlt(C.types), codesAlt(C.zones)
      ].join(escapeRe(C.format.separator)) + '$')
    };
    return index_;
  }

  function codesAlt(list) {
    return '(' + list.map(function (x) { return x.code; }).join('|') + ')';
  }
  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function err(code, field, message) { return { code: code, field: field, message: message }; }

  /**
   * Lee y valida un campo de texto. Devuelve el valor normalizado o null si hay error.
   */
  function readField(data, field, errors) {
    var raw = data[field];
    if (raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '')) {
      errors.push(err('MISSING_FIELD', field, 'El campo "' + field + '" es obligatorio.'));
      return null;
    }
    if (typeof raw !== 'string') {
      errors.push(err('INVALID_VALUE', field, 'El campo "' + field + '" debe ser texto.'));
      return null;
    }
    return { raw: raw, norm: normalize(raw) };
  }

  /** Avisa si el valor se aceptó solo tras normalizar (mayúsculas, acentos o espacios). */
  function noteNormalized(field, input, item, warnings) {
    var exact = input.raw === item.code || input.raw === item.formValue ||
      (!!item.formOptionId && input.raw === item.formOptionId);
    if (!exact) {
      warnings.push(err('NORMALIZED_VALUE', field,
        '"' + input.raw + '" se interpretó como "' + (item.formValue || item.code) + '".'));
    }
  }

  function resolveOrigin(data, errors, warnings) {
    var input = readField(data, FIELDS.origin, errors);
    if (!input) return null;
    var item = index().origins[input.norm];
    if (!item) {
      errors.push(err('INVALID_ORIGIN', FIELDS.origin,
        'Origen "' + input.raw + '" no válido. Opciones: Properlia (PR), Keller Williams (KW), Asesor externo (AE).'));
      return null;
    }
    noteNormalized(FIELDS.origin, input, item, warnings);
    return item;
  }

  /** Resuelve un valor de modalidad (texto, ID o código LV/LA). Devuelve null y agrega error si no es válido. */
  function resolveOneModality(input, errors, warnings) {
    var idx = index();
    if (idx.excludedOperations.indexOf(input.norm) !== -1) {
      errors.push(err('EXCLUDED_OPERATION', FIELDS.modality,
        'La operación "' + input.raw + '" no forma parte del registro de propiedades.'));
      return null;
    }
    var modality = idx.modalities[input.norm];
    if (modality) {
      noteNormalized(FIELDS.modality, input, modality, warnings);
      return { operation: idx.operations[normalize(modality.operation)], modality: modality.name };
    }
    var operation = idx.operations[input.norm];
    if (operation) {
      noteNormalized(FIELDS.modality, input, operation, warnings);
      return { operation: operation, modality: null };
    }
    var hint = input.norm === 'PRE' ? ' Preventa no es código de clave: usar la modalidad "Preventa".' : '';
    errors.push(err('INVALID_OPERATION', FIELDS.modality,
      'Modalidad "' + input.raw + '" no válida. Opciones: Preventa, Venta, Renta.' + hint));
    return null;
  }

  /**
   * Modalidad: un valor, o una lista cuando la propiedad se ofrece en varias a la vez.
   * G-6: si la lista combina venta (LV) y renta (LA), se registra una sola vez como Venta (LV).
   * Devuelve { operation, modality, modalities } o null.
   */
  function resolveOperation(data, errors, warnings) {
    var raw = data[FIELDS.modality];
    if (!Array.isArray(raw)) {
      var input = readField(data, FIELDS.modality, errors);
      if (!input) return null;
      var one = resolveOneModality(input, errors, warnings);
      if (!one) return null;
      one.modalities = one.modality ? [one.modality] : [];
      return one;
    }

    if (raw.length === 0) {
      errors.push(err('MISSING_FIELD', FIELDS.modality, 'El campo "' + FIELDS.modality + '" es obligatorio.'));
      return null;
    }
    var resolved = [], failed = false;
    raw.forEach(function (v) {
      if (typeof v !== 'string' || v.trim() === '') {
        errors.push(err('INVALID_VALUE', FIELDS.modality, 'Cada modalidad de la lista debe ser texto no vacío.'));
        failed = true;
        return;
      }
      var r = resolveOneModality({ raw: v, norm: normalize(v) }, errors, warnings);
      if (r) resolved.push(r); else failed = true;
    });
    if (failed) return null;

    var names = [];
    resolved.forEach(function (r) { if (r.modality && names.indexOf(r.modality) === -1) names.push(r.modality); });
    var opCodes = [];
    resolved.forEach(function (r) { if (opCodes.indexOf(r.operation.code) === -1) opCodes.push(r.operation.code); });

    if (opCodes.length > 1) {
      var rule = KEY_CATALOG.simultaneousOffer;
      warnings.push(err('SIMULTANEOUS_OFFER', FIELDS.modality,
        'Se ofrece en ' + names.join(' y ') + ' a la vez: se registra una sola vez como ' + rule.registerAs +
        ' (' + rule.operation + '). La modalidad vigente se guarda en su campo.'));
      return { operation: index().operations[rule.operation], modality: rule.registerAs, modalities: names };
    }
    return { operation: resolved[0].operation, modality: resolved[0].modality, modalities: names };
  }

  function resolveType(data, errors, warnings) {
    var input = readField(data, FIELDS.type, errors);
    if (!input) return null;
    var idx = index();
    var item = idx.types[input.norm];
    if (!item) {
      var reserved = idx.reservedTypes[input.norm];
      var hint = reserved ? ' "' + reserved.code + '" está reservado (' + reserved.name + ') y no se asigna desde el formulario.' : '';
      errors.push(err('INVALID_TYPE', FIELDS.type, 'Tipo "' + input.raw + '" no válido.' + hint));
      return null;
    }
    noteNormalized(FIELDS.type, input, item, warnings);
    return item;
  }

  function resolveZone(data, errors, warnings) {
    var input = readField(data, FIELDS.zone, errors);
    if (!input) return null;
    var item = index().zones[input.norm];
    if (!item) {
      errors.push(err('ZONE_NOT_CATALOGED', FIELDS.zone,
        'La zona "' + input.raw + '" no está catalogada. No se genera clave; solicita su incorporación formal al catálogo.'));
      return null;
    }
    noteNormalized(FIELDS.zone, input, item, warnings);
    return item;
  }

  function result(ok, key, components, modality, errors, warnings, modalities) {
    return {
      ok: ok, key: key, components: components, modality: modality, modalities: modalities || [],
      errors: errors, warnings: warnings, catalogVersion: KEY_CATALOG.version
    };
  }

  function part(item) { return { code: item.code, name: item.name }; }

  function generatePropertyKey(data) {
    var errors = [], warnings = [];
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return result(false, null, null, null,
        [err('INVALID_INPUT', null, 'Se esperaba un objeto con origen, modalidad, tipo y zona.')], warnings);
    }

    // Se resuelven los cuatro campos para reportar todos los errores a la vez.
    var origin = resolveOrigin(data, errors, warnings);
    var op = resolveOperation(data, errors, warnings);
    var type = resolveType(data, errors, warnings);
    var zone = resolveZone(data, errors, warnings);

    if (errors.length) return result(false, null, null, null, errors, warnings);

    var sep = KEY_CATALOG.format.separator;
    var key = [origin.code, op.operation.code, type.code, zone.code].join(sep);
    if (!index().keyPattern.test(key)) {
      return result(false, null, null, null,
        [err('INVALID_FORMAT', null, 'La clave "' + key + '" no cumple el formato del catálogo.')], warnings);
    }

    return result(true, key, {
      origin: part(origin), operation: part(op.operation), type: part(type), zone: part(zone)
    }, op.modality, errors, warnings, op.modalities);
  }

  // ---------------------------------------------------------------------------
  // T3 — Validación de claves existentes
  // ---------------------------------------------------------------------------

  var codeIndex_ = null;
  function codeIndex() {
    if (codeIndex_) return codeIndex_;
    var C = KEY_CATALOG;
    function byCode(list) {
      var m = {};
      list.forEach(function (x) { m[x.code] = x; });
      return m;
    }
    codeIndex_ = {
      origins: byCode(C.origins),
      operations: byCode(C.operations),
      excluded: C.excludedOperations,
      types: byCode(C.types),
      reserved: byCode(C.reservedTypeCodes),
      zones: byCode(C.zones)
    };
    return codeIndex_;
  }

  function invalidKey(key, errors, warnings) {
    return {
      ok: false, key: null, baseKey: null, suffix: null, components: null,
      input: key, errors: errors, warnings: warnings, catalogVersion: KEY_CATALOG.version
    };
  }

  /** Reconstruye una clave a partir de componentes y sufijo opcional. */
  function composeKey(components, suffix) {
    var sep = KEY_CATALOG.format.separator;
    var base = [components.origin.code, components.operation.code, components.type.code, components.zone.code].join(sep);
    if (suffix === null || suffix === undefined) return base;
    var digits = KEY_CATALOG.format.suffix.digits;
    return base + sep + String(suffix).padStart(digits, '0');
  }

  /**
   * Valida una clave escrita: estructura, códigos del catálogo y sufijo opcional.
   * Salida: { ok, key, baseKey, suffix, components, input, errors, warnings, catalogVersion }
   *   - key:     la clave reconstruida desde sus componentes (idéntica a la entrada si es válida).
   *   - baseKey: la clave sin sufijo.
   *   - suffix:  número del duplicado (2..99) o null.
   * No corrige claves: las no canónicas (minúsculas, espacios, otros separadores) se rechazan
   * indicando la forma canónica sugerida cuando existe.
   * La autorización de un sufijo no se puede comprobar desde la clave: se verifica en T4.
   */
  function validatePropertyKey(key) {
    var errors = [], warnings = [];
    if (typeof key !== 'string' || key.trim() === '') {
      return invalidKey(key, [err('INVALID_INPUT', null, 'Se esperaba una clave en texto.')], warnings);
    }

    var F = KEY_CATALOG.format;
    var sep = F.separator;

    // Solo mayúsculas A-Z, dígitos y el separador; sin espacios ni segmentos vacíos.
    if (!/^[A-Z0-9]+(-[A-Z0-9]+)*$/.test(key)) {
      var canon = key.trim().toUpperCase().replace(/\s*[-_\s.\/]\s*/g, sep);
      var suggestion = /^[A-Z0-9]+(-[A-Z0-9]+)*$/.test(canon) && canon !== key ? ' Forma canónica sugerida: "' + canon + '".' : '';
      return invalidKey(key, [err('INVALID_FORMAT', null,
        'La clave debe usar solo mayúsculas, dígitos y "' + sep + '" como separador, sin espacios.' + suggestion)], warnings);
    }

    var parts = key.split(sep);
    var n = F.segments.length;
    if (parts.length !== n && parts.length !== n + 1) {
      return invalidKey(key, [err('INVALID_FORMAT', null,
        'La clave debe tener ' + n + ' segmentos (ORIGEN-OPERACIÓN-TIPO-ZONA) y, opcionalmente, un sufijo de duplicado. Tiene ' + parts.length + '.')], warnings);
    }

    var idx = codeIndex();
    var o = idx.origins[parts[0]];
    if (!o) errors.push(err('INVALID_ORIGIN', 'origen', 'Origen "' + parts[0] + '" no existe en el catálogo.'));

    var op = idx.operations[parts[1]];
    if (!op) {
      if (idx.excluded.indexOf(parts[1]) !== -1) {
        errors.push(err('EXCLUDED_OPERATION', 'operacion', 'La operación "' + parts[1] + '" no forma parte del registro de propiedades.'));
      } else {
        var hint = parts[1] === 'PRE' ? ' Preventa no es código de clave (usa LV).' : '';
        errors.push(err('INVALID_OPERATION', 'operacion', 'Operación "' + parts[1] + '" no existe en el catálogo.' + hint));
      }
    }

    var t = idx.types[parts[2]];
    if (!t) {
      var r = idx.reserved[parts[2]];
      errors.push(err('INVALID_TYPE', 'tipo', 'Tipo "' + parts[2] + '" no existe en el catálogo.' +
        (r ? ' "' + r.code + '" está reservado (' + r.name + ') y no se asigna a propiedades del formulario.' : '')));
    }

    var z = idx.zones[parts[3]];
    if (!z) errors.push(err('ZONE_NOT_CATALOGED', 'zona', 'La zona "' + parts[3] + '" no está catalogada.'));

    var suffix = null;
    if (parts.length === n + 1) {
      var s = parts[n];
      var re = new RegExp('^\\d{' + F.suffix.digits + '}$');
      var num = re.test(s) ? parseInt(s, 10) : NaN;
      if (isNaN(num) || num < F.suffix.firstDuplicate || num > F.suffix.max) {
        var extra = s === '01' ? ' La primera propiedad usa la clave base sin sufijo; el primer duplicado es -02.' : '';
        errors.push(err('INVALID_SUFFIX', 'sufijo', 'Sufijo "' + s + '" no válido: debe ser de ' +
          String(F.suffix.firstDuplicate).padStart(F.suffix.digits, '0') + ' a ' + F.suffix.max + '.' + extra));
      } else {
        suffix = num;
      }
    }

    if (errors.length) return invalidKey(key, errors, warnings);

    var components = { origin: part(o), operation: part(op), type: part(t), zone: part(z) };
    var rebuilt = composeKey(components, suffix);
    if (rebuilt !== key) {
      return invalidKey(key, [err('INVALID_FORMAT', null, 'La clave no coincide con su forma reconstruida "' + rebuilt + '".')], warnings);
    }
    if (suffix !== null) {
      warnings.push(err('DUPLICATE_SUFFIX', 'sufijo',
        'Clave de duplicado (registro ' + suffix + '); su autorización se verifica en el registro de propiedades.'));
    }

    return {
      ok: true, key: rebuilt, baseKey: composeKey(components, null), suffix: suffix, components: components,
      input: key, errors: errors, warnings: warnings, catalogVersion: KEY_CATALOG.version
    };
  }

  // ---------------------------------------------------------------------------
  // T4 — Duplicados y sufijo autorizado (D-09, D-10, D-13)
  // ---------------------------------------------------------------------------

  function dupResult(status, ok, key, extra) {
    var r = {
      status: status, ok: ok, key: key, baseKey: null, suffix: null,
      existing: [], proposedKey: null, errors: [], warnings: [], catalogVersion: KEY_CATALOG.version
    };
    for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) r[k] = extra[k];
    return r;
  }

  function copyRecord(rec) {
    if (typeof rec === 'string') return { key: rec };
    var c = {};
    for (var k in rec) if (Object.prototype.hasOwnProperty.call(rec, k)) c[k] = rec[k];
    return c;
  }

  /**
   * Decide la clave final de una propiedad nueva frente a las claves existentes.
   *
   * @param {string} baseKey      Clave base sin sufijo (la de generatePropertyKey).
   * @param {Array}  existing     Registros existentes: textos de clave u objetos { key, ...datos de la propiedad }.
   * @param {Object} [authorization] Solo para registrar un duplicado:
   *   { authorized: true, by: 'quien autoriza', baseKey: <la misma base>, acknowledgedKeys: [todas las claves existentes mostradas] }
   *
   * Estados:
   *   AVAILABLE            la combinación no existe: se usa la clave base.
   *   DUPLICATE_BLOCKED    ya existe: se devuelven los registros existentes y se bloquea (key = null).
   *   DUPLICATE_AUTHORIZED autorización válida: siguiente sufijo = mayor existente + 1; nunca se reutiliza.
   *   REJECTED             entrada o autorización inválida, o sufijos agotados (key = null).
   *
   * Función pura: no lee ni escribe el registro. Quien la use debe ejecutarla dentro de un bloqueo
   * (LockService) que incluya la lectura de `existing` y la escritura de la clave resultante.
   * Nunca modifica los registros existentes.
   */
  function resolveDuplicate(baseKey, existing, authorization) {
    var F = KEY_CATALOG.format;
    var sep = F.separator;

    var v = validatePropertyKey(baseKey);
    if (!v.ok || v.suffix !== null) {
      return dupResult('REJECTED', false, null, {
        errors: [err('INVALID_BASE_KEY', null, 'Se esperaba una clave base válida sin sufijo.' +
          (v.ok ? ' "' + baseKey + '" ya tiene sufijo.' : ''))].concat(v.errors || [])
      });
    }
    if (!Array.isArray(existing)) {
      return dupResult('REJECTED', false, null, {
        baseKey: baseKey,
        errors: [err('INVALID_INPUT', null, 'Se esperaba la lista de claves existentes (puede estar vacía).')]
      });
    }

    var warnings = [];
    var matches = [];          // registros de la misma combinación, copiados tal como llegaron
    var maxNumber = 0;         // la clave base cuenta como registro 1
    var escaped = escapeRe(baseKey);
    var re = new RegExp('^' + escaped + '(?:' + escapeRe(sep) + '(\\d{' + F.suffix.digits + '}))?$');

    existing.forEach(function (rec, i) {
      var key = typeof rec === 'string' ? rec : (rec && typeof rec === 'object' ? rec.key : undefined);
      if (typeof key !== 'string' || !validatePropertyKey(key).ok) {
        // Claves históricas con otro formato: se reportan, no se corrigen.
        if (typeof key === 'string' && re.test(key)) {
          // Caso histórico "-01": pertenece a la combinación aunque el formato vigente no lo acepte.
          warnings.push(err('HISTORICAL_SUFFIX', null, 'Clave histórica "' + key + '" con sufijo fuera de la regla vigente; se respeta sin modificarla.'));
        } else {
          warnings.push(err('UNRECOGNIZED_EXISTING_KEY', null, 'Registro existente #' + (i + 1) + ' sin clave válida; se ignora para esta combinación.'));
          return;
        }
      }
      var m = re.exec(key);
      if (!m) return;
      matches.push(copyRecord(rec));
      var n = m[1] === undefined ? 1 : parseInt(m[1], 10);
      if (n > maxNumber) maxNumber = n;
    });

    if (!matches.length) {
      if (authorization) {
        warnings.push(err('AUTHORIZATION_NOT_NEEDED', null, 'La combinación no existe; se usa la clave base y no se aplica la autorización.'));
      }
      return dupResult('AVAILABLE', true, baseKey, { baseKey: baseKey, warnings: warnings });
    }

    var next = Math.max(maxNumber + 1, F.suffix.firstDuplicate);
    var nextKey = next <= F.suffix.max ? composeKey(v.components, next) : null;

    if (next > F.suffix.max) {
      return dupResult('REJECTED', false, null, {
        baseKey: baseKey, existing: matches, warnings: warnings,
        errors: [err('SUFFIX_EXHAUSTED', 'sufijo', 'La combinación ' + baseKey + ' ya alcanzó el sufijo máximo -' + F.suffix.max + '.')]
      });
    }

    if (!authorization) {
      return dupResult('DUPLICATE_BLOCKED', false, null, {
        baseKey: baseKey, existing: matches, proposedKey: nextKey, warnings: warnings,
        errors: [err('DUPLICATE_KEY', null, 'Ya existe(n) ' + matches.length + ' propiedad(es) con la combinación ' + baseKey +
          '. Revisa los registros existentes; para registrar otra se requiere autorización explícita (quedaría como ' + nextKey + ').')]
      });
    }

    // La autorización debe ser explícita, nombrar a quien autoriza, referirse a esta base
    // y reconocer TODAS las claves existentes que se mostraron.
    var problems = [];
    if (authorization.authorized !== true) problems.push('falta authorized: true');
    if (typeof authorization.by !== 'string' || authorization.by.trim() === '') problems.push('falta quién autoriza (by)');
    if (authorization.baseKey !== baseKey) problems.push('la autorización corresponde a otra combinación');
    var ack = Array.isArray(authorization.acknowledgedKeys) ? authorization.acknowledgedKeys : [];
    var missing = matches.map(function (r) { return r.key; }).filter(function (k) { return ack.indexOf(k) === -1; });
    if (missing.length) problems.push('no reconoce las claves existentes: ' + missing.join(', '));

    if (problems.length) {
      return dupResult('REJECTED', false, null, {
        baseKey: baseKey, existing: matches, proposedKey: nextKey, warnings: warnings,
        errors: [err('AUTHORIZATION_INVALID', null, 'Autorización no válida: ' + problems.join('; ') + '.')]
      });
    }

    return dupResult('DUPLICATE_AUTHORIZED', true, nextKey, {
      baseKey: baseKey, suffix: next, existing: matches, warnings: warnings,
      authorizedBy: authorization.by.trim()
    });
  }

  return {
    generatePropertyKey: generatePropertyKey,
    validatePropertyKey: validatePropertyKey,
    resolveDuplicate: resolveDuplicate,
    composeKey: composeKey,
    normalize: normalize,
    FIELDS: FIELDS
  };
})();

/** Atajo global, para llamarlo como en la especificación: generatePropertyKey(data). */
function generatePropertyKey(data) {
  return PropertyKey.generatePropertyKey(data);
}

/** Atajo global: validatePropertyKey(key). */
function validatePropertyKey(key) {
  return PropertyKey.validatePropertyKey(key);
}

/** Atajo global: resolveDuplicate(baseKey, existing, authorization). */
function resolveDuplicate(baseKey, existing, authorization) {
  return PropertyKey.resolveDuplicate(baseKey, existing, authorization);
}
