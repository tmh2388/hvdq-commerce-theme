function getPimSpreadsheet_() {
  const spreadsheetId = getHvdqRuntimeConfig_().spreadsheetId;
  if (!spreadsheetId) {
    throw new Error('PIM_SPREADSHEET_ID is missing from Script Properties.');
  }
  return SpreadsheetApp.openById(spreadsheetId);
}

function readTable_(sheetName) {
  const sheet = getPimSpreadsheet_().getSheetByName(sheetName);
  if (!sheet) throw new Error('Missing required sheet: ' + sheetName);

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow < 1 || lastColumn < 1) throw new Error('Sheet has no header: ' + sheetName);

  const values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
  const headers = values[0].map(function (header) { return String(header).trim(); });
  const rows = [];

  for (let index = 1; index < values.length; index += 1) {
    const raw = values[index];
    if (raw.every(function (cell) { return cell === '' || cell === null; })) continue;

    const record = { _rowNumber: index + 1 };
    headers.forEach(function (header, columnIndex) {
      record[header] = raw[columnIndex];
    });
    rows.push(record);
  }

  return { sheet, headers, rows };
}

function requireHeaders_(table, requiredHeaders) {
  const missing = requiredHeaders.filter(function (header) {
    return table.headers.indexOf(header) === -1;
  });
  if (missing.length) {
    throw new Error('Missing columns in ' + table.sheet.getName() + ': ' + missing.join(', '));
  }
}

function findBySku_(table, skuHeader, sku) {
  const normalizedSku = normalizeSku_(sku);
  return table.rows.filter(function (row) {
    return normalizeSku_(row[skuHeader]) === normalizedSku;
  });
}

function updateRecord_(table, rowNumber, patch) {
  const stampedPatch = Object.assign({}, patch);
  if (table.headers.indexOf('Last Updated') !== -1 && !Object.prototype.hasOwnProperty.call(stampedPatch, 'Last Updated')) {
    stampedPatch['Last Updated'] = new Date();
  }
  if (table.headers.indexOf('Updated By') !== -1 && !Object.prototype.hasOwnProperty.call(stampedPatch, 'Updated By')) {
    stampedPatch['Updated By'] = getAutomationActor_();
  }
  Object.keys(stampedPatch).forEach(function (header) {
    const columnIndex = table.headers.indexOf(header);
    if (columnIndex === -1) throw new Error('Cannot update missing column: ' + header);
    table.sheet.getRange(rowNumber, columnIndex + 1).setValue(stampedPatch[header]);
  });
}

function appendRecord_(sheetName, record) {
  const table = readTable_(sheetName);
  const row = table.headers.map(function (header) {
    return Object.prototype.hasOwnProperty.call(record, header) ? record[header] : '';
  });
  table.sheet.appendRow(row);
}

function normalizeSku_(value) {
  return String(value || '').trim().toUpperCase();
}

function asBoolean_(value) {
  if (value === true) return true;
  return ['TRUE', 'YES', '1'].indexOf(String(value || '').trim().toUpperCase()) !== -1;
}

function asNumber_(value) {
  if (value === '' || value === null || typeof value === 'undefined') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
