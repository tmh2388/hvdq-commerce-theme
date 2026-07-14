/**
 * Read-only preview. Safe to run before any Shopify credentials are configured.
 */
function dryRunProductBySku(sku) {
  const context = buildProductSyncContext_(sku);
  validateSyncGates_(context);
  const request = buildProductSetRequest_(context, []);
  return {
    mode: 'DRY_RUN',
    sku: normalizeSku_(sku),
    mediaCount: context.media.length,
    mutation: 'productSet',
    variables: request,
    metafields: buildProductMetafields_(context.product),
    guarantees: {
      status: request.input.status,
      autoPublish: false,
      inventoryMutationIncluded: false
    }
  };
}

/**
 * Live Draft creation/update. It refuses to run unless LIVE_SYNC_ENABLED=true.
 */
function syncApprovedProductBySku(sku) {
  const config = getHvdqRuntimeConfig_();
  assertRuntimeConfigured_(config, true);
  assertAppConfigSafety_();

  const runId = Utilities.getUuid();
  const context = buildProductSyncContext_(sku);
  const normalizedSku = normalizeSku_(sku);

  try {
    validateSyncGates_(context);
    updateRecord_(context.productsTable, context.product._rowNumber, {
      'Shopify Sync Status': HVDQ.STATUS.SYNCING,
      'Shopify Sync Error': ''
    });

    const mediaCandidates = prepareApprovedMedia_(context);
    const uploadedFiles = uploadMediaToShopify_(mediaCandidates);
    const request = buildProductSetRequest_(context, uploadedFiles);
    const data = shopifyGraphql_(PRODUCT_SET_MUTATION_, request);
    throwOnUserErrors_('productSet', data.productSet.userErrors);

    const shopifyProduct = data.productSet.product;
    if (!shopifyProduct || shopifyProduct.status !== 'DRAFT') {
      throw new Error('Safety check failed: Shopify product was not returned as DRAFT.');
    }

    const metafields = buildProductMetafields_(context.product).map(function (metafield) {
      return Object.assign({ ownerId: shopifyProduct.id }, metafield);
    });
    if (metafields.length) {
      const metafieldData = shopifyGraphql_(METAFIELDS_SET_MUTATION_, { metafields });
      throwOnUserErrors_('metafieldsSet', metafieldData.metafieldsSet.userErrors);
    }

    updateRecord_(context.productsTable, context.product._rowNumber, {
      'Shopify Product GID': shopifyProduct.id,
      'Shopify Handle': shopifyProduct.handle,
      'Shopify Sync Status': HVDQ.STATUS.SYNCED,
      'Shopify Sync Error': '',
      'Shopify Updated At': new Date()
    });
    writeBackVariants_(context.variantsTable, context.variants, shopifyProduct.variants.nodes || []);
    writeBackMedia_(context.mediaTable, uploadedFiles);
    appendSyncLog_(runId, normalizedSku, 'PRODUCT_SET', 'SHOPIFY_DRAFT', 'SUCCESS', shopifyProduct.id, '', 'Draft synchronized.');

    return {
      runId,
      sku: normalizedSku,
      shopifyProductGid: shopifyProduct.id,
      handle: shopifyProduct.handle,
      status: shopifyProduct.status
    };
  } catch (error) {
    if (context && context.product) {
      updateRecord_(context.productsTable, context.product._rowNumber, {
        'Shopify Sync Status': HVDQ.STATUS.ERROR,
        'Shopify Sync Error': error.message
      });
    }
    appendSyncLog_(runId, normalizedSku, 'PRODUCT_SET', 'SHOPIFY_DRAFT', 'ERROR', '', 'SYNC_ERROR', error.message);
    appendError_(normalizedSku, 'SHOPIFY_SYNC', 'ERROR', 'SYNC_ERROR', error.message);
    throw error;
  }
}

function syncNextQueuedProduct() {
  const products = readTable_(HVDQ.SHEETS.PRODUCTS);
  const queued = products.rows.filter(function (row) {
    return String(row['Shopify Sync Status']).toUpperCase() === HVDQ.STATUS.QUEUED;
  });
  if (!queued.length) return { status: 'NO_QUEUED_PRODUCTS' };
  return syncApprovedProductBySku(queued[0].SKU);
}

function assertAppConfigSafety_() {
  const appConfig = readTable_(HVDQ.SHEETS.APP_CONFIG);
  const configMap = {};
  appConfig.rows.forEach(function (row) {
    configMap[String(row.Key || '').trim()] = String(row.Value || '').trim();
  });
  if (String(configMap.AUTO_PUBLISH).toUpperCase() !== 'FALSE') {
    throw new Error('Safety lock: APP_CONFIG[AUTO_PUBLISH] must remain FALSE.');
  }
  if (String(configMap.SHOPIFY_CREATE_STATUS).toUpperCase() !== 'DRAFT') {
    throw new Error('Safety lock: APP_CONFIG[SHOPIFY_CREATE_STATUS] must remain DRAFT.');
  }
}

function writeBackVariants_(variantsTable, pimVariants, shopifyVariants) {
  pimVariants.forEach(function (pimVariant) {
    const sku = normalizeSku_(pimVariant['Variant SKU']);
    const shopifyVariant = shopifyVariants.find(function (variant) {
      return normalizeSku_(variant.sku) === sku;
    });
    if (!shopifyVariant) return;
    updateRecord_(variantsTable, pimVariant._rowNumber, {
      'Shopify Variant GID': shopifyVariant.id,
      'Sync Status': 'SYNCED'
    });
  });
}

function appendSyncLog_(runId, sku, operation, target, result, shopifyGid, code, message) {
  appendRecord_(HVDQ.SHEETS.SYNC_LOG, {
    'Log ID': Utilities.getUuid(),
    'Timestamp': new Date(),
    'Run ID': runId,
    'SKU': sku,
    'Operation': operation,
    'Target': target,
    'Result': result,
    'Shopify GID': shopifyGid,
    'Code': code,
    'Message': message,
    'Initiated By': Session.getActiveUser().getEmail()
  });
}

function appendError_(sku, stage, severity, code, message) {
  appendRecord_(HVDQ.SHEETS.ERROR_QUEUE, {
    'Error ID': Utilities.getUuid(),
    'Timestamp': new Date(),
    'SKU': sku,
    'Stage': stage,
    'Severity': severity,
    'Error Code': code,
    'Error Message': message,
    'Owner': 'ADMIN',
    'Resolution Status': 'OPEN'
  });
}
