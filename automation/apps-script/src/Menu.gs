function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('HVDQ Operations')
    .addItem('Kiểm tra PIM và schema contract', 'runPimSchemaAudit')
    .addItem('Đồng bộ validation từ LOOKUPS', 'syncPimLookupValidations')
    .addItem('Kiểm tra cấu hình an toàn', 'inspectSystemSafety')
    .addItem('Dry-run sản phẩm đang chọn', 'dryRunSelectedProduct')
    .addSeparator()
    .addItem('Đồng bộ Draft tiếp theo trong hàng đợi', 'syncNextQueuedProduct')
    .addToUi();
}

function inspectSystemSafety() {
  const runtime = getHvdqRuntimeConfig_();
  const result = {
    version: HVDQ.VERSION,
    spreadsheetConfigured: Boolean(runtime.spreadsheetId),
    shopDomainConfigured: Boolean(runtime.shopDomain),
    accessTokenConfigured: Boolean(runtime.accessToken),
    apiVersion: runtime.apiVersion,
    liveSyncEnabled: runtime.liveSyncEnabled,
    expectedShopifyStatus: 'DRAFT',
    autoPublish: false
  };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function dryRunSelectedProduct() {
  const sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== HVDQ.SHEETS.PRODUCTS) {
    throw new Error('Open PRODUCTS and select a product row first.');
  }
  const row = sheet.getActiveCell().getRow();
  if (row < 2) throw new Error('Select a data row, not the header.');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const skuColumn = headers.indexOf('SKU') + 1;
  if (!skuColumn) throw new Error('PRODUCTS[SKU] column not found.');
  const sku = sheet.getRange(row, skuColumn).getValue();
  const result = dryRunProductBySku(sku);
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}
