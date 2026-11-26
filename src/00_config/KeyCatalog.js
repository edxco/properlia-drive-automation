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
    version: '2026.2',
    approvedOn: '2026-11-26',

    // Historial de versiones del catálogo (la más reciente al final).
    changelog: [
      { version: '2026.1', date: '2026-11-26', summary: 'Catálogo inicial: decisiones D-01 a D-13 de la Fase 2.1.' },
      { version: '2026.2', date: '2026-11-26', summary: 'IDs de opciones del formulario (G-4) y regla de comercialización simultánea (G-6).' }
    ],

    format: {
      segments: ['origin', 'operation', 'type', 'zone'],
      separator: '-',
      // D-09 y D-13: la primera propiedad no lleva sufijo; las siguientes usan -02, -03…
      // siempre el mayor existente + 1, sin reutilizar números; requiere autorización (D-10).
      suffix: { digits: 2, firstDuplicate: 2, max: 99, requiresAuthorization: true }
    },

    // D-07: campo obligatorio y explícito del formulario; nunca se infiere.
    origins: [
      // formOptionId: IDs consecutivos definidos para el campo Origen (no existía en el formulario).
      { code: 'PR', name: 'Properlia', formValue: 'Properlia', formOptionId: 'origen-01' },
      { code: 'KW', name: 'Keller Williams', formValue: 'Keller Williams', formOptionId: 'origen-02' },
      { code: 'AE', name: 'Asesor externo', formValue: 'Asesor externo', formOptionId: 'origen-03' }
    ],

    operations: [
      { code: 'LV', name: 'Lado vendedor / venta' },
      { code: 'LA', name: 'Lado arrendador / renta' }
    ],

    // D-05, D-06, D-12: la modalidad es un campo comercial independiente.
    // Solo determina la operación al registrar; después la clave no cambia.
    modalities: [
      // formOptionId confirmados por el usuario (G-4); no siguen la variante RFC de UUID, se conservan tal cual.
      { name: 'Preventa', formValue: 'Preventa', operation: 'LV', formOptionId: 'a7f8e2d1-3c4b-5a6e-9f8d-7c1b2a3e4f5d' },
      { name: 'Venta', formValue: 'Venta', operation: 'LV', formOptionId: 'b8e9f3d2-4c5a-6b7e-0f9e-8d2c3b4e5f6a' },
      { name: 'Renta', formValue: 'Renta', operation: 'LA', formOptionId: 'c9f0e4d3-5c6b-7a8e-1f0e-9d3c4b5e6f7b' }
    ],

    // G-6: una propiedad ofrecida en venta y renta a la vez se registra una sola vez, como Venta.
    simultaneousOffer: { registerAs: 'Venta', operation: 'LV' },

    // Fuera del registro de propiedades.
    excludedOperations: ['LC', 'CR'],

    // formOptionId: IDs actuales del formulario (especificación, G-4). No se modifican.
    types: [
      { code: 'DEP', name: 'Departamento', formValue: 'Departamento', formOptionId: '0221da24-d7df-4052-a63d-2d16501ec360' },
      { code: 'CASA', name: 'Casa', formValue: 'Casa', formOptionId: '6431658b-1ebc-4805-ac61-97bf39699353' },
      { code: 'TER', name: 'Terreno', formValue: 'Terreno', formOptionId: '23d3905f-a5c1-4372-995e-362b2c10f77f' },
      { code: 'LOC', name: 'Local comercial', formValue: 'Local comercial', formOptionId: '044af3c1-7cea-4ec5-86e7-07b10afdb147' },
      { code: 'BONA', name: 'Bodega o nave', formValue: 'Bodega o nave', formOptionId: '37beb05a-ff6a-4138-8959-c2c9be60e6f5', since: '2026.1' },
      { code: 'CMED', name: 'Consultorio', formValue: 'Consultorio', formOptionId: '7f91886c-4822-4a9d-9f44-867c8702951b', since: '2026.1' },
      { code: 'OF', name: 'Oficina', formValue: 'Oficina', formOptionId: '1b89a6d4-83e3-4c55-9852-64f33060d034' }
    ],

    // D-03: reservado para Industrial según el Manual; ninguna opción del formulario lo produce.
    reservedTypeCodes: [
      { code: 'IND', name: 'Industrial', note: 'Reservado; no asignado a opciones del formulario' }
    ],

    // D-08: solo zonas del Manual; una zona no catalogada bloquea la generación.
    // formOptionId: IDs consecutivos definidos para el campo Zona; una zona nueva recibe el siguiente número.
    zones: [
      { code: 'ZAV', name: 'Zavaleta', formValue: 'Zavaleta', formOptionId: 'zona-01' },
      { code: 'ATL', name: 'Atlixco', formValue: 'Atlixco', formOptionId: 'zona-02' },
      { code: 'BAR', name: 'El Barreal', formValue: 'El Barreal', formOptionId: 'zona-03' },
      { code: 'TLAX', name: 'Tlaxcalancingo', formValue: 'Tlaxcalancingo', formOptionId: 'zona-04' },
      { code: 'UDL', name: 'Zona UDLAP', formValue: 'Zona UDLAP', formOptionId: 'zona-05' },
      { code: 'CHL', name: 'Cholula', formValue: 'Cholula', formOptionId: 'zona-06' },
      { code: 'SACH', name: 'San Andrés Cholula', formValue: 'San Andrés Cholula', formOptionId: 'zona-07' },
      { code: 'CUAU', name: 'Cuautlancingo', formValue: 'Cuautlancingo', formOptionId: 'zona-08' },
      { code: 'SON', name: 'Sonata', formValue: 'Sonata', formOptionId: 'zona-09' },
      { code: 'LMS', name: 'Lomas de Angelópolis', formValue: 'Lomas de Angelópolis', formOptionId: 'zona-10' },
      { code: 'ANG', name: 'Angelópolis', formValue: 'Angelópolis', formOptionId: 'zona-11' },
      { code: 'CEN', name: 'Centro', formValue: 'Centro', formOptionId: 'zona-12' },
      { code: 'SJO', name: 'San José', formValue: 'San José', formOptionId: 'zona-13' }
    ],

    // D-01: estos campos nunca participan en la clave; cambiarlos no la reconstruye.
    keyIgnoredFields: [
      'precio', 'fecha', 'anio', 'estatus', 'asesor', 'comision', 'prioridad',
      'etapa', 'modalidad', 'exclusividad', 'propietario', 'informacionComercial'
    ]
  });
})();
