/**
 * Re-applies lookup-backed Google Sheets validations from active LOOKUPS rows.
 * Safe: it changes validation rules only, never values or table structure.
 */
function syncPimLookupValidations() {
  const spreadsheet = getPimSpreadsheet_();
  const lookups = readTable_('LOOKUPS');
  const mappings = [
    { table: 'PRODUCTS', column: 'Product Model', group: 'PRODUCT_MODEL' },
    { table: 'PRODUCTS', column: 'Category', group: 'CATEGORY' },
    { table: 'PRODUCTS', column: 'Technique', group: 'TECHNIQUE' },
    { table: 'PRICING', column: 'Market', group: 'MARKET' }
  ];

  const results = mappings.map(function (mapping) {
    const codes = activeLookupCodes_(lookups, mapping.group);
    if (!codes.length) throw new Error('No active LOOKUPS codes for group ' + mapping.group);
    const sheet = spreadsheet.getSheetByName(mapping.table);
    if (!sheet) throw new Error('Missing sheet: ' + mapping.table);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const columnIndex = headers.indexOf(mapping.column) + 1;
    if (!columnIndex) throw new Error('Missing column: ' + mapping.table + '[' + mapping.column + ']');
    const rule = SpreadsheetApp.newDataValidation().requireValueInList(codes, true).setAllowInvalid(false).build();
    sheet.getRange(2, columnIndex, sheet.getMaxRows() - 1, 1).setDataValidation(rule);
    return { table: mapping.table, column: mapping.column, group: mapping.group, values: codes };
  });
  Logger.log(JSON.stringify(results, null, 2));
  return results;
}

function activeLookupCodes_(lookups, group) {
  return lookups.rows
    .filter(function (row) {
      return String(row.Group || '').trim().toUpperCase() === group && asBoolean_(row.Active);
    })
    .sort(function (a, b) { return (asNumber_(a['Sort Order']) || 0) - (asNumber_(b['Sort Order']) || 0); })
    .map(function (row) { return String(row.Code || '').trim(); })
    .filter(Boolean);
}
