/** Fecha/hora en la zona del proyecto (depende de Utilities, por eso separado de Utils). */
var Clock = (function () {
  function nowStamp() {
    return Utilities.formatDate(new Date(), CONSTANTS.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  }
  return { nowStamp: nowStamp };
})();
