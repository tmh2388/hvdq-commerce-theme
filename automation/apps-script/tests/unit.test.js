const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = vm.createContext({ console });
const sourceRoot = path.resolve(__dirname, '..', 'src');
['Config.gs', 'SheetStore.gs', 'ProductMapper.gs'].forEach((filename) => {
  const source = fs.readFileSync(path.join(sourceRoot, filename), 'utf8');
  vm.runInContext(source, context, { filename });
});

const evaluate = (expression) => vm.runInContext(expression, context);

assert.equal(evaluate("slugify_('Đồng hồ Pháp Lam SKU 01')"), 'dong-ho-phap-lam-sku-01');
assert.equal(evaluate("normalizeSku_(' hvdq-001 ')"), 'HVDQ-001');
assert.equal(evaluate("asBoolean_('TRUE')"), true);
assert.equal(evaluate("asBoolean_('no')"), false);
assert.equal(evaluate("asNumber_('25000000')"), 25000000);
assert.equal(evaluate("uniqueStrings_(['A', 'A', '', 'B']).join('|')"), 'A|B');
assert.equal(evaluate("normalizeShopDomain_('https://hvdq.myshopify.com/')"), 'hvdq.myshopify.com');
assert.equal(evaluate("HVDQ.PROPERTIES.SPREADSHEET_ID"), 'PIM_SPREADSHEET_ID');
assert.equal(
  evaluate("typeof buildShopifyFilename_ === 'function' ? 'loaded' : 'missing'"),
  'missing',
  'MediaService is intentionally excluded from this pure unit-test context.'
);

console.log('HVDQ Apps Script unit tests: 8 passed');
