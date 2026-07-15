const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = vm.createContext({ console });
const sourceRoot = path.resolve(__dirname, '..', 'src');
['SchemaContract.gs', 'SchemaAudit.gs'].forEach((filename) => {
  vm.runInContext(fs.readFileSync(path.join(sourceRoot, filename), 'utf8'), context, { filename });
});

const evaluate = (expression) => vm.runInContext(expression, context);

assert.equal(evaluate('HVDQ_SCHEMA_CONTRACT_VERSION'), '1.1.0');
assert.equal(evaluate('HVDQ_SCHEMA_CONTRACT_FIELDS.length'), 18);
assert.equal(evaluate('HVDQ_SCHEMA_CONTRACT.length'), 210);
assert.equal(evaluate(`HVDQ_SCHEMA_CONTRACT.filter((row) => row['Source type'] === 'VIRTUAL').length`), 6);
assert.equal(evaluate(`new Set(HVDQ_SCHEMA_CONTRACT.map((row) => row.Table + '|' + row.Column)).size`), 210);
assert.equal(evaluate(`HVDQ_SCHEMA_CONTRACT.filter((row) => row.Key === 'TRUE').length`), 15);
assert.equal(evaluate(`HVDQ_SCHEMA_CONTRACT.find((row) => row.Table === 'INVENTORY' && row.Column === 'SKU').Classification`), 'INSUFFICIENT_EVIDENCE');
assert.equal(evaluate(`HVDQ_SCHEMA_CONTRACT.find((row) => row.Table === 'TRANSLATIONS' && row.Column === 'SKU / Resource ID').Classification`), 'INSUFFICIENT_EVIDENCE');

const findings = evaluate(`(() => {
  const result = [];
  auditContractStructure_(HVDQ_SCHEMA_CONTRACT, result);
  return result;
})()`);
assert.equal(findings.length, 0);

const duplicateFindings = evaluate(`(() => {
  const result = [];
  const table = {
    headers: ['SKU'],
    rows: [
      { _rowNumber: 2, SKU: 'HVDQ-001' },
      { _rowNumber: 3, SKU: ' hvdq-001 ' },
      { _rowNumber: 4, SKU: '' }
    ],
    sheet: { getName: () => 'PRODUCTS' }
  };
  auditUniqueColumn_(table, 'SKU', true, result, 'PRODUCT_SKU');
  return result;
})()`);
assert.equal(duplicateFindings.length, 2);
assert.equal(duplicateFindings[0].code, 'PRODUCT_SKU_DUPLICATE');
assert.equal(duplicateFindings[1].code, 'PRODUCT_SKU_BLANK');

const summary = evaluate(`summarizeAuditFindings_([
  { severity: 'ERROR' },
  { severity: 'WARNING' },
  { severity: 'ERROR' }
])`);
assert.equal(summary.ERROR, 2);
assert.equal(summary.WARNING, 1);

console.log('HVDQ schema contract tests: 14 passed');
