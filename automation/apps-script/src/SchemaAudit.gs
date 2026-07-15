/**
 * Read-only audit for the PIM source and the canonical AppSheet schema contract.
 * This module never calls Shopify and never mutates the spreadsheet.
 */
function runPimSchemaAudit() {
  const spreadsheet = getPimSpreadsheet_();
  const contract = getHvdqSchemaContract_();
  const findings = [];

  auditContractStructure_(contract, findings);
  const physicalRows = contract.filter(function (row) {
    return row['Source type'] !== 'VIRTUAL';
  });
  const tables = loadAuditTables_(spreadsheet, physicalRows, findings);

  auditKeysAndRequiredData_(tables, physicalRows, findings);
  auditSkuRules_(tables, findings);
  auditReferenceIntegrity_(tables, findings);
  auditLookups_(tables, findings);
  auditSpreadsheetFormulas_(tables, findings);
  auditLookupValidationRules_(tables, findings);
  auditContractDefaults_(contract, findings);
  auditSafetyConfig_(tables, findings);

  const summary = summarizeAuditFindings_(findings);
  const result = {
    contractVersion: HVDQ_SCHEMA_CONTRACT_VERSION,
    generatedAt: new Date().toISOString(),
    readOnly: true,
    passed: summary.ERROR === 0,
    summary,
    findings
  };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function auditContractStructure_(contract, findings) {
  if (!Array.isArray(contract) || !contract.length) {
    addAuditFinding_(findings, 'ERROR', 'CONTRACT_EMPTY', '', '', 0, 'Schema contract is empty.');
    return;
  }

  const requiredFields = HVDQ_SCHEMA_CONTRACT_FIELDS || [];
  const identities = {};
  contract.forEach(function (row, index) {
    requiredFields.forEach(function (field) {
      if (!Object.prototype.hasOwnProperty.call(row, field)) {
        addAuditFinding_(findings, 'ERROR', 'CONTRACT_FIELD_MISSING', row.Table || '', row.Column || '', index + 1, 'Missing contract field: ' + field);
      }
    });
    if (!row.Table || !row.Column) {
      addAuditFinding_(findings, 'ERROR', 'CONTRACT_IDENTITY_MISSING', row.Table || '', row.Column || '', index + 1, 'Table and Column are required.');
      return;
    }
    const identity = row.Table + '|' + row.Column;
    if (identities[identity]) {
      addAuditFinding_(findings, 'ERROR', 'CONTRACT_DUPLICATE_COLUMN', row.Table, row.Column, index + 1, 'Duplicate Table/Column contract row.');
    }
    identities[identity] = true;
    if (row.Key === 'TRUE' && row['Source type'] === 'VIRTUAL') {
      addAuditFinding_(findings, 'ERROR', 'VIRTUAL_KEY_FORBIDDEN', row.Table, row.Column, index + 1, 'A virtual column cannot be the physical row key.');
    }
    if (row['AppSheet type'] === 'Ref' && !row['Ref table']) {
      addAuditFinding_(findings, 'ERROR', 'REF_TARGET_MISSING', row.Table, row.Column, index + 1, 'Ref table is required for Ref columns.');
    }
  });
}

function loadAuditTables_(spreadsheet, physicalRows, findings) {
  const rowsByTable = groupContractRowsByTable_(physicalRows);
  const result = {};
  Object.keys(rowsByTable).forEach(function (tableName) {
    const sheet = spreadsheet.getSheetByName(tableName);
    if (!sheet) {
      addAuditFinding_(findings, 'ERROR', 'TABLE_MISSING', tableName, '', 0, 'Required PIM sheet is missing.');
      return;
    }
    const headerRow = tableName === 'START_HERE' ? 3 : 1;
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    const auditLastRow = Math.max(lastRow, headerRow + 1);
    const range = lastColumn > 0 && auditLastRow >= headerRow
      ? sheet.getRange(headerRow, 1, auditLastRow - headerRow + 1, lastColumn)
      : null;
    const values = range ? range.getValues() : [];
    const formulas = range ? range.getFormulas() : [];
    const validations = range ? range.getDataValidations() : [];
    const headers = values.length ? values[0].map(function (value) { return String(value).trim(); }) : [];
    const records = [];
    for (let index = 1; index < values.length; index += 1) {
      const raw = values[index];
      if (raw.every(function (cell) { return cell === '' || cell === null; })) continue;
      const record = { _rowNumber: headerRow + index };
      headers.forEach(function (header, columnIndex) { record[header] = raw[columnIndex]; });
      records.push(record);
    }
    const expectedHeaders = rowsByTable[tableName].map(function (row) { return row.Column; });
    expectedHeaders.forEach(function (header) {
      if (headers.indexOf(header) === -1) {
        addAuditFinding_(findings, 'ERROR', 'COLUMN_MISSING', tableName, header, headerRow, 'Required source column is missing.');
      }
    });
    headers.forEach(function (header) {
      if (header && expectedHeaders.indexOf(header) === -1) {
        addAuditFinding_(findings, 'WARNING', 'COLUMN_UNCONTRACTED', tableName, header, headerRow, 'Source column is not present in the canonical contract.');
      }
    });
    result[tableName] = { sheet, headers, rows: records, formulas, validations, headerRow, contractRows: rowsByTable[tableName] };
  });
  return result;
}

function auditKeysAndRequiredData_(tables, contract, findings) {
  const rowsByTable = groupContractRowsByTable_(contract);
  Object.keys(rowsByTable).forEach(function (tableName) {
    const table = tables[tableName];
    if (!table) return;
    const keyRows = rowsByTable[tableName].filter(function (row) { return row.Key === 'TRUE'; });
    const keyRequired = tableName !== 'DATA_DICTIONARY';
    if (keyRequired && keyRows.length !== 1) {
      addAuditFinding_(findings, 'ERROR', 'KEY_COUNT_INVALID', tableName, '', 0, 'Expected exactly one physical key, found ' + keyRows.length + '.');
    }
    keyRows.forEach(function (keyRow) {
      auditUniqueColumn_(table, keyRow.Column, true, findings, 'KEY');
    });
    const requiredColumns = rowsByTable[tableName].filter(function (row) { return row.Required === 'TRUE'; });
    table.rows.forEach(function (record) {
      requiredColumns.forEach(function (contractRow) {
        if (isBlankAuditValue_(record[contractRow.Column])) {
          addAuditFinding_(findings, 'ERROR', 'REQUIRED_VALUE_BLANK', tableName, contractRow.Column, record._rowNumber, 'Required value is blank.');
        }
      });
    });
  });
}

function auditSkuRules_(tables, findings) {
  if (tables.PRODUCTS) auditUniqueColumn_(tables.PRODUCTS, 'SKU', true, findings, 'PRODUCT_SKU');
  if (tables.VARIANTS) auditUniqueColumn_(tables.VARIANTS, 'Variant SKU', true, findings, 'VARIANT_SKU');
  if (tables.PRICING) {
    auditUniqueComposite_(tables.PRICING, ['SKU', 'Market', 'Currency'], findings, 'PRICE_MARKET_CURRENCY');
  }
  if (tables.LOOKUPS) {
    auditUniqueComposite_(tables.LOOKUPS, ['Group', 'Code'], findings, 'LOOKUP_GROUP_CODE');
  }
}

function auditReferenceIntegrity_(tables, findings) {
  const productSkus = valueSetFromTable_(tables.PRODUCTS, 'SKU', normalizeSku_);
  const productIds = valueSetFromTable_(tables.PRODUCTS, 'Product ID', normalizeAuditText_);
  const collectionIds = valueSetFromTable_(tables.COLLECTIONS, 'Collection ID', normalizeAuditText_);
  const variantSkus = valueSetFromTable_(tables.VARIANTS, 'Variant SKU', normalizeSku_);

  auditForeignKey_(tables.PRODUCTS, 'Collection', collectionIds, normalizeAuditText_, findings, 'COLLECTION_REF_ORPHAN', false);
  auditForeignKey_(tables.VARIANTS, 'Product SKU', productSkus, normalizeSku_, findings, 'PRODUCT_SKU_ORPHAN', true);
  ['MEDIA', 'PRICING', 'APPROVAL_QUEUE'].forEach(function (tableName) {
    auditForeignKey_(tables[tableName], 'SKU', productSkus, normalizeSku_, findings, 'PRODUCT_SKU_ORPHAN', true);
  });
  ['SYNC_LOG', 'ERROR_QUEUE'].forEach(function (tableName) {
    auditForeignKey_(tables[tableName], 'SKU', productSkus, normalizeSku_, findings, 'HISTORICAL_SKU_ORPHAN', false, 'WARNING');
  });

  if (tables.INVENTORY) {
    tables.INVENTORY.rows.forEach(function (record) {
      const sku = normalizeSku_(record.SKU);
      if (!sku) return;
      const inProducts = Boolean(productSkus[sku]);
      const inVariants = Boolean(variantSkus[sku]);
      if (!inProducts && !inVariants) {
        addAuditFinding_(findings, 'ERROR', 'INVENTORY_SKU_ORPHAN', 'INVENTORY', 'SKU', record._rowNumber, 'SKU matches neither PRODUCTS[SKU] nor VARIANTS[Variant SKU].');
      } else if (inProducts && inVariants) {
        addAuditFinding_(findings, 'WARNING', 'INVENTORY_SKU_AMBIGUOUS', 'INVENTORY', 'SKU', record._rowNumber, 'SKU matches both product and variant namespaces; Ref target remains unresolved.');
      }
    });
  }

  if (tables.TRANSLATIONS) {
    tables.TRANSLATIONS.rows.forEach(function (record) {
      const resourceType = normalizeAuditText_(record['Resource Type']).toUpperCase();
      const resourceId = normalizeAuditText_(record['SKU / Resource ID']);
      if (!resourceId) return;
      if (resourceType === 'PRODUCT' && !productSkus[normalizeSku_(resourceId)] && !productIds[resourceId]) {
        addAuditFinding_(findings, 'ERROR', 'TRANSLATION_PRODUCT_ORPHAN', 'TRANSLATIONS', 'SKU / Resource ID', record._rowNumber, 'Product translation target does not exist.');
      } else if (resourceType === 'COLLECTION' && !collectionIds[resourceId]) {
        addAuditFinding_(findings, 'ERROR', 'TRANSLATION_COLLECTION_ORPHAN', 'TRANSLATIONS', 'SKU / Resource ID', record._rowNumber, 'Collection translation target does not exist.');
      } else if (['PRODUCT', 'COLLECTION'].indexOf(resourceType) === -1) {
        addAuditFinding_(findings, 'WARNING', 'TRANSLATION_REF_UNVERIFIED', 'TRANSLATIONS', 'Resource Type', record._rowNumber, 'No verified Ref rule exists for Resource Type: ' + resourceType + '.');
      }
    });
  }
}

function auditLookups_(tables, findings) {
  const table = tables.LOOKUPS;
  if (!table) return;
  const activeGroups = {};
  table.rows.forEach(function (record) {
    const active = asBoolean_(record.Active);
    const group = normalizeAuditText_(record.Group).toUpperCase();
    const code = normalizeAuditText_(record.Code).toUpperCase();
    if (!active) return;
    if (!group || !code || !normalizeAuditText_(record['Label VI'])) {
      addAuditFinding_(findings, 'ERROR', 'ACTIVE_LOOKUP_INCOMPLETE', 'LOOKUPS', '', record._rowNumber, 'Active lookup requires Group, Code, and Label VI.');
      return;
    }
    activeGroups[group] = true;
  });
  ['PRODUCT_MODEL', 'CATEGORY', 'TECHNIQUE', 'MARKET'].forEach(function (group) {
    if (!activeGroups[group]) {
      addAuditFinding_(findings, 'ERROR', 'LOOKUP_GROUP_MISSING', 'LOOKUPS', 'Group', 0, 'No active lookup found for required group ' + group + '.');
    }
  });
}

function auditSafetyConfig_(tables, findings) {
  const table = tables.APP_CONFIG;
  if (!table) return;
  const map = {};
  table.rows.forEach(function (record) { map[normalizeAuditText_(record.Key)] = normalizeAuditText_(record.Value); });
  if (String(map.AUTO_PUBLISH).toUpperCase() !== 'FALSE') {
    addAuditFinding_(findings, 'ERROR', 'AUTO_PUBLISH_UNSAFE', 'APP_CONFIG', 'AUTO_PUBLISH', 0, 'AUTO_PUBLISH must remain FALSE.');
  }
  if (String(map.SHOPIFY_CREATE_STATUS).toUpperCase() !== 'DRAFT') {
    addAuditFinding_(findings, 'ERROR', 'SHOPIFY_STATUS_UNSAFE', 'APP_CONFIG', 'SHOPIFY_CREATE_STATUS', 0, 'SHOPIFY_CREATE_STATUS must remain DRAFT.');
  }
}

function auditSpreadsheetFormulas_(tables, findings) {
  const expected = [
    { table: 'PRODUCTS', column: 'Validation Status', formula: '=ARRAYFORMULA(IF(B2:B="";"";IF((D2:D<>"")*(E2:E<>"")*(F2:F<>"")*(O2:O<>"")*(R2:R<>"")*(S2:S<>"");"VALID";"MISSING REQUIRED")))' },
    { table: 'PRODUCTS', column: 'Validation Errors', formula: '=ARRAYFORMULA(IF(B2:B="";"";TRIM(IF(D2:D="";"Tên VI; ";"")&IF(E2:E="";"Mô hình; ";"")&IF(F2:F="";"Danh mục; ";"")&IF(O2:O="";"Câu chuyện VI; ";"")&IF(R2:R="";"Lead time; ";"")&IF(S2:S="";"Ảnh hero; ";""))))' },
    { table: 'INVENTORY', column: 'Available', formula: '=ARRAYFORMULA(IF(B2:B="";"";N(D2:D)-N(E2:E)))' }
  ];
  expected.forEach(function (rule) {
    const table = tables[rule.table];
    if (!table) return;
    const columnIndex = table.headers.indexOf(rule.column);
    const actual = columnIndex >= 0 && table.formulas[1] ? table.formulas[1][columnIndex] : '';
    if (normalizeFormula_(actual) !== normalizeFormula_(rule.formula)) {
      addAuditFinding_(findings, 'ERROR', 'SOURCE_FORMULA_MISMATCH', rule.table, rule.column, 2, 'Expected protected ARRAYFORMULA does not match the source sheet.');
    }
  });
}

function auditLookupValidationRules_(tables, findings) {
  const mappings = [
    { table: 'PRODUCTS', column: 'Product Model', group: 'PRODUCT_MODEL' },
    { table: 'PRODUCTS', column: 'Category', group: 'CATEGORY' },
    { table: 'PRODUCTS', column: 'Technique', group: 'TECHNIQUE' },
    { table: 'PRICING', column: 'Market', group: 'MARKET' }
  ];
  mappings.forEach(function (mapping) {
    const table = tables[mapping.table];
    if (!table || !tables.LOOKUPS) return;
    const expected = activeLookupCodes_(tables.LOOKUPS, mapping.group).sort();
    const columnIndex = table.headers.indexOf(mapping.column);
    const validation = columnIndex >= 0 && table.validations[1] ? table.validations[1][columnIndex] : null;
    const actual = validation ? validation.getCriteriaValues()[0].map(String).sort() : [];
    if (!validation || String(validation.getCriteriaType()) !== String(SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST)) {
      addAuditFinding_(findings, 'ERROR', 'LOOKUP_VALIDATION_MISSING', mapping.table, mapping.column, 2, 'Expected strict list validation sourced from active LOOKUPS group ' + mapping.group + '.');
    } else if (actual.join('|') !== expected.join('|') || validation.getAllowInvalid()) {
      addAuditFinding_(findings, 'ERROR', 'LOOKUP_VALIDATION_DRIFT', mapping.table, mapping.column, 2, 'Sheet validation values differ from active LOOKUPS or allow invalid values.');
    }
  });
}

function auditContractDefaults_(contract, findings) {
  const expected = {
    'PRODUCTS|Product ID': 'UNIQUEID()',
    'PRODUCTS|Workflow Status': 'DRAFT',
    'PRODUCTS|Submit for Review': 'FALSE',
    'PRODUCTS|Shopify Sync Status': 'NOT_SYNCED',
    'PRODUCTS|Created At': 'NOW()',
    'PRODUCTS|Created By': 'USEREMAIL()'
  };
  contract.forEach(function (row) {
    const identity = row.Table + '|' + row.Column;
    if (Object.prototype.hasOwnProperty.call(expected, identity) && row['Initial value'] !== expected[identity]) {
      addAuditFinding_(findings, 'ERROR', 'CONTRACT_DEFAULT_MISMATCH', row.Table, row.Column, 0, 'Contract Initial value must be ' + expected[identity] + '.');
    }
    if (HVDQ_LOOKUP_ENUM_COLUMNS_[identity]) {
      if (row['Base type'] !== 'Text' || row['Allow other values'] !== 'FALSE') {
        addAuditFinding_(findings, 'ERROR', 'LOOKUP_ENUM_TYPE_UNSAFE', row.Table, row.Column, 0, 'Lookup-backed Enum requires Base type Text and Allow other values FALSE.');
      }
    }
  });
}

function auditUniqueColumn_(table, column, blankIsError, findings, codePrefix) {
  if (!table || table.headers.indexOf(column) === -1) return;
  const seen = {};
  table.rows.forEach(function (record) {
    const value = normalizeAuditText_(record[column]).toUpperCase();
    if (!value) {
      if (blankIsError) addAuditFinding_(findings, 'ERROR', codePrefix + '_BLANK', table.sheet.getName(), column, record._rowNumber, 'Value is blank.');
      return;
    }
    if (seen[value]) {
      addAuditFinding_(findings, 'ERROR', codePrefix + '_DUPLICATE', table.sheet.getName(), column, record._rowNumber, 'Duplicate value; first seen at row ' + seen[value] + ': ' + value);
    } else {
      seen[value] = record._rowNumber;
    }
  });
}

function auditUniqueComposite_(table, columns, findings, codePrefix) {
  if (!table || columns.some(function (column) { return table.headers.indexOf(column) === -1; })) return;
  const seen = {};
  table.rows.forEach(function (record) {
    const value = columns.map(function (column) { return normalizeAuditText_(record[column]).toUpperCase(); }).join('|');
    if (value.replace(/\|/g, '') === '') return;
    if (seen[value]) {
      addAuditFinding_(findings, 'ERROR', codePrefix + '_DUPLICATE', table.sheet.getName(), columns.join('+'), record._rowNumber, 'Duplicate composite value; first seen at row ' + seen[value] + ': ' + value);
    } else {
      seen[value] = record._rowNumber;
    }
  });
}

function auditForeignKey_(table, column, targetSet, normalizer, findings, code, required, severity) {
  if (!table || table.headers.indexOf(column) === -1) return;
  table.rows.forEach(function (record) {
    const value = normalizer(record[column]);
    if (!value) {
      if (required) addAuditFinding_(findings, 'ERROR', code + '_BLANK', table.sheet.getName(), column, record._rowNumber, 'Required reference is blank.');
      return;
    }
    if (!targetSet[value]) {
      addAuditFinding_(findings, severity || 'ERROR', code, table.sheet.getName(), column, record._rowNumber, 'Reference target not found: ' + value);
    }
  });
}

function valueSetFromTable_(table, column, normalizer) {
  const result = {};
  if (!table || table.headers.indexOf(column) === -1) return result;
  table.rows.forEach(function (record) {
    const value = normalizer(record[column]);
    if (value) result[value] = true;
  });
  return result;
}

function groupContractRowsByTable_(contract) {
  const result = {};
  contract.forEach(function (row) {
    if (!result[row.Table]) result[row.Table] = [];
    result[row.Table].push(row);
  });
  return result;
}

function addAuditFinding_(findings, severity, code, table, column, rowNumber, message) {
  findings.push({ severity, code, table, column, rowNumber, message });
}

function summarizeAuditFindings_(findings) {
  return findings.reduce(function (summary, finding) {
    summary[finding.severity] = (summary[finding.severity] || 0) + 1;
    return summary;
  }, { ERROR: 0, WARNING: 0, INFO: 0 });
}

function normalizeAuditText_(value) {
  return String(value === null || typeof value === 'undefined' ? '' : value).trim();
}

function isBlankAuditValue_(value) {
  return value === '' || value === null || typeof value === 'undefined';
}

function normalizeFormula_(value) {
  return String(value || '').replace(/\s+/g, '').toUpperCase();
}
