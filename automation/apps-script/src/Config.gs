/**
 * HVDQ Product Operations configuration.
 * Secrets belong in Apps Script Properties, never in Google Sheets or source.
 */
const HVDQ = Object.freeze({
  VERSION: '1.0.0',
  API_VERSION: '2026-07',
  SHEETS: Object.freeze({
    PRODUCTS: 'PRODUCTS',
    VARIANTS: 'VARIANTS',
    MEDIA: 'MEDIA',
    PRICING: 'PRICING',
    APPROVAL_QUEUE: 'APPROVAL_QUEUE',
    SYNC_LOG: 'SYNC_LOG',
    ERROR_QUEUE: 'ERROR_QUEUE',
    APP_CONFIG: 'APP_CONFIG'
  }),
  PROPERTIES: Object.freeze({
    SPREADSHEET_ID: 'PIM_SPREADSHEET_ID',
    SHOP_DOMAIN: 'SHOPIFY_SHOP_DOMAIN',
    ACCESS_TOKEN: 'SHOPIFY_ADMIN_ACCESS_TOKEN',
    API_VERSION: 'SHOPIFY_API_VERSION',
    LIVE_SYNC: 'LIVE_SYNC_ENABLED'
  }),
  STATUS: Object.freeze({
    APPROVED: 'APPROVED',
    DRAFT: 'DRAFT',
    QUEUED: 'QUEUED',
    SYNCING: 'SYNCING',
    SYNCED: 'SYNCED',
    ERROR: 'ERROR',
    VALID: 'VALID'
  })
});

function getHvdqRuntimeConfig_() {
  const properties = PropertiesService.getScriptProperties();
  const shopDomain = normalizeShopDomain_(properties.getProperty(HVDQ.PROPERTIES.SHOP_DOMAIN));
  const apiVersion = properties.getProperty(HVDQ.PROPERTIES.API_VERSION) || HVDQ.API_VERSION;
  const liveSyncEnabled = String(properties.getProperty(HVDQ.PROPERTIES.LIVE_SYNC)).toLowerCase() === 'true';

  return {
    spreadsheetId: properties.getProperty(HVDQ.PROPERTIES.SPREADSHEET_ID) || '',
    shopDomain,
    apiVersion,
    accessToken: properties.getProperty(HVDQ.PROPERTIES.ACCESS_TOKEN) || '',
    liveSyncEnabled
  };
}

function normalizeShopDomain_(value) {
  return String(value || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '');
}

function assertRuntimeConfigured_(config, requireLiveSync) {
  if (!config.shopDomain || !/\.myshopify\.com$/i.test(config.shopDomain)) {
    throw new Error('SHOPIFY_SHOP_DOMAIN must be a valid *.myshopify.com domain.');
  }
  if (!config.accessToken) {
    throw new Error('SHOPIFY_ADMIN_ACCESS_TOKEN is missing from Script Properties.');
  }
  if (requireLiveSync && !config.liveSyncEnabled) {
    throw new Error('Live sync is disabled. Set LIVE_SYNC_ENABLED=true only after dry-run approval.');
  }
}
