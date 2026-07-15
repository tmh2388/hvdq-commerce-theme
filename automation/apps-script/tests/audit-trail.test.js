const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const writes = [];
const context = vm.createContext({
  console,
  Session: { getActiveUser: () => ({ getEmail: () => '' }) }
});
const sourceRoot = path.resolve(__dirname, '..', 'src');
['AuditTrail.gs', 'SheetStore.gs', 'PimSetup.gs'].forEach((filename) => {
  vm.runInContext(fs.readFileSync(path.join(sourceRoot, filename), 'utf8'), context, { filename });
});

context.table = {
  headers: ['SKU', 'Shopify Sync Status', 'Last Updated', 'Updated By'],
  sheet: {
    getRange: (row, column) => ({ setValue: (value) => writes.push({ row, column, value }) })
  }
};
vm.runInContext(`updateRecord_(table, 2, { 'Shopify Sync Status': 'SYNCED' })`, context);
assert.equal(writes.length, 3);
assert.equal(writes[0].column, 2);
assert.equal(writes[1].column, 3);
assert.equal(Object.prototype.toString.call(writes[1].value), '[object Date]');
assert.equal(writes[2].column, 4);
assert.equal(writes[2].value, 'APPS_SCRIPT');

context.lookupTable = {
  rows: [
    { Group: 'CATEGORY', Code: 'B', Active: true, 'Sort Order': 20 },
    { Group: 'CATEGORY', Code: 'A', Active: true, 'Sort Order': 10 },
    { Group: 'CATEGORY', Code: 'X', Active: false, 'Sort Order': 5 }
  ]
};
context.asBoolean_ = (value) => value === true;
context.asNumber_ = Number;
const codes = vm.runInContext(`activeLookupCodes_(lookupTable, 'CATEGORY')`, context);
assert.deepEqual(Array.from(codes), ['A', 'B']);

console.log('HVDQ audit trail tests: 7 passed');
