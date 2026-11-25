/** Error con código, para distinguir fallas de configuración, acceso y entorno. */
function ProperliaError(code, message) {
  this.name = 'ProperliaError';
  this.code = code;
  this.message = '[' + code + '] ' + message;
  this.stack = (new Error(this.message)).stack;
}
ProperliaError.prototype = Object.create(Error.prototype);
ProperliaError.prototype.constructor = ProperliaError;
