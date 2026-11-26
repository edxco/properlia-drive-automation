/**
 * Catálogo institucional de claves de propiedades — FUENTE ÚNICA DE VERDAD.
 *
 * Formato: [ORIGEN]-[OPERACIÓN]-[TIPO]-[ZONA], con sufijo -NN solo para duplicados autorizados.
 *
 * Reglas de este archivo:
 * - Solo datos, sin lógica. El generador y el validador lo leen; ningún otro archivo define códigos.
 * - Cada cambio aumenta `version` y requiere autorización explícita del usuario.
 * - Decisiones aprobadas: ver docs (D-01 a D-13), aprobadas el 2026-11-26.
 */
var KEY_CATALOG = (function () {
  function deepFreeze(obj) {
    Object.getOwnPropertyNames(obj).forEach(function (k) {
      var v = obj[k];
      if (v && typeof v === 'object') deepFreeze(v);
    });
    return Object.freeze(obj);
  }

  return deepFreeze({
    version: '2026.1',
    approvedOn: '2026-11-26',

    format: {
      segments: ['origin', 'operation', 'type', 'zone'],
      separator: '-',
      // D-09 y D-13: la primera propiedad no lleva sufijo; las siguientes usan -02, -03…
      // siempre el mayor existente + 1, sin reutilizar números; requiere autorización (D-10).
      suffix: { digits: 2, firstDuplicate: 2, max: 99, requiresAuthorization: true }
    },

    // D-07: campo obligatorio y explícito del formulario; nunca se infiere.
    origins: [
      { code: 'PR', name: 'Properlia', formValue: 'Properlia' },
      { code: 'KW', name: 'Keller Williams', formValue: 'Keller Williams' },
      { code: 'AE', name: 'Asesor externo', formValue: 'Asesor externo' }
    ],

    operations: [
      { code: 'LV', name: 'Lado vendedor / venta' },
      { code: 'LA', name: 'Lado arrendador / renta' }
    ],

    // D-05, D-06, D-12: la modalidad es un campo comercial independiente.
    // Solo determina la operación al registrar; después la clave no cambia.
    modalities: [
      { name: 'Preventa', formValue: 'Preventa', operation: 'LV' },
      { name: 'Venta', formValue: 'Venta', operation: 'LV' },
      { name: 'Renta', formValue: 'Renta', operation: 'LA' }
    ],

    // Fuera del registro de propiedades.
    excludedOperations: ['LC', 'CR'],

    // formOptionId: IDs actuales del formulario, se conservan sin cambios (pendiente G-4).
    types: [
      { code: 'DEP', name: 'Departamento', formValue: 'Departamento', formOptionId: null },
      { code: 'CASA', name: 'Casa', formValue: 'Casa', formOptionId: null },
      { code: 'TER', name: 'Terreno', formValue: 'Terreno', formOptionId: null },
      { code: 'LOC', name: 'Local comercial', formValue: 'Local comercial', formOptionId: null },
      { code: 'BONA', name: 'Bodega o nave', formValue: 'Bodega o nave', formOptionId: null, since: '2026.1' },
      { code: 'CMED', name: 'Consultorio', formValue: 'Consultorio', formOptionId: null, since: '2026.1' },
      { code: 'OF', name: 'Oficina', formValue: 'Oficina', formOptionId: null }
    ],

    // D-03: reservado para Industrial según el Manual; ninguna opción del formulario lo produce.
    reservedTypeCodes: [
      { code: 'IND', name: 'Industrial', note: 'Reservado; no asignado a opciones del formulario' }
    ],

    // D-08: solo zonas del Manual; una zona no catalogada bloquea la generación.
    zones: [
      { code: 'ZAV', name: 'Zavaleta', formValue: 'Zavaleta' },
      { code: 'ATL', name: 'Atlixco', formValue: 'Atlixco' },
      { code: 'BAR', name: 'El Barreal', formValue: 'El Barreal' },
      { code: 'TLAX', name: 'Tlaxcalancingo', formValue: 'Tlaxcalancingo' },
      { code: 'UDL', name: 'Zona UDLAP', formValue: 'Zona UDLAP' },
      { code: 'CHL', name: 'Cholula', formValue: 'Cholula' },
      { code: 'SACH', name: 'San Andrés Cholula', formValue: 'San Andrés Cholula' },
      { code: 'CUAU', name: 'Cuautlancingo', formValue: 'Cuautlancingo' },
      { code: 'SON', name: 'Sonata', formValue: 'Sonata' },
      { code: 'LMS', name: 'Lomas de Angelópolis', formValue: 'Lomas de Angelópolis' },
      { code: 'ANG', name: 'Angelópolis', formValue: 'Angelópolis' },
      { code: 'CEN', name: 'Centro', formValue: 'Centro' },
      { code: 'SJO', name: 'San José', formValue: 'San José' }
    ],

    // D-01: estos campos nunca participan en la clave; cambiarlos no la reconstruye.
    keyIgnoredFields: [
      'precio', 'fecha', 'anio', 'estatus', 'asesor', 'comision', 'prioridad',
      'etapa', 'modalidad', 'exclusividad', 'propietario', 'informacionComercial'
    ]
  });
})();
