/**
 * Acceso a Hojas mediante Sheets API v4 (servicio avanzado).
 * Funciona con drive.file sobre hojas creadas por el propio script.
 * No borra hojas ni filas.
 */
var SheetRepository = (function () {
  function quote_(tab) { return "'" + tab.replace(/'/g, "''") + "'"; }

  /** Renombra la primera pestaña y agrega las demás. Solo para hojas recién creadas. */
  function setupTabs(spreadsheetId, tabNames) {
    var requests = [{
      updateSheetProperties: { properties: { sheetId: 0, title: tabNames[0] }, fields: 'title' }
    }];
    for (var i = 1; i < tabNames.length; i++) {
      requests.push({ addSheet: { properties: { title: tabNames[i] } } });
    }
    Sheets.Spreadsheets.batchUpdate({ requests: requests }, spreadsheetId);
  }

  function writeValues(spreadsheetId, rangeA1, values) {
    return Sheets.Spreadsheets.Values.update({ values: values }, spreadsheetId, rangeA1, { valueInputOption: 'RAW' });
  }

  function readValues(spreadsheetId, rangeA1) {
    var res = Sheets.Spreadsheets.Values.get(spreadsheetId, rangeA1);
    return res.values || [];
  }

  function appendRow(spreadsheetId, tab, row) {
    return Sheets.Spreadsheets.Values.append({ values: [row] }, spreadsheetId, quote_(tab) + '!A1',
      { valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS' });
  }

  function writeHeaders(spreadsheetId, tab, headers) {
    return writeValues(spreadsheetId, quote_(tab) + '!A1', [headers]);
  }

  return { setupTabs: setupTabs, writeValues: writeValues, readValues: readValues, appendRow: appendRow, writeHeaders: writeHeaders, quote: quote_ };
})();
