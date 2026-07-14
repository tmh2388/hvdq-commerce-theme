function buildProductSyncContext_(sku) {
  const products = readTable_(HVDQ.SHEETS.PRODUCTS);
  const pricing = readTable_(HVDQ.SHEETS.PRICING);
  const variants = readTable_(HVDQ.SHEETS.VARIANTS);
  const media = readTable_(HVDQ.SHEETS.MEDIA);

  requireHeaders_(products, [
    'SKU', 'Workflow Status', 'Product Name VI', 'Product Model', 'Category',
    'Validation Status', 'Founder Approval', 'Shopify Product GID', 'Shopify Handle',
    'Shopify Sync Status'
  ]);
  requireHeaders_(pricing, ['SKU', 'Market', 'Currency', 'Price', 'Approval Status']);
  requireHeaders_(variants, ['Product SKU', 'Variant SKU', 'Option 1 Name', 'Option 1 Value']);
  requireHeaders_(media, ['Media ID', 'SKU', 'Drive File / Folder URL', 'Approved', 'Sort Order']);

  const productRows = findBySku_(products, 'SKU', sku);
  if (productRows.length !== 1) {
    throw new Error('Expected exactly one PRODUCTS row for SKU ' + sku + ', found ' + productRows.length + '.');
  }

  const vietnamPrices = findBySku_(pricing, 'SKU', sku).filter(function (row) {
    return String(row.Market).toUpperCase() === 'VIETNAM' && String(row.Currency).toUpperCase() === 'VND';
  });
  if (vietnamPrices.length !== 1) {
    throw new Error('Expected exactly one VIETNAM/VND price for SKU ' + sku + '.');
  }

  return {
    productsTable: products,
    pricingTable: pricing,
    variantsTable: variants,
    mediaTable: media,
    product: productRows[0],
    price: vietnamPrices[0],
    variants: findBySku_(variants, 'Product SKU', sku),
    media: findBySku_(media, 'SKU', sku)
      .filter(function (row) { return asBoolean_(row.Approved); })
      .sort(function (a, b) { return (asNumber_(a['Sort Order']) || 0) - (asNumber_(b['Sort Order']) || 0); })
  };
}

function validateSyncGates_(context) {
  const errors = [];
  const product = context.product;
  const price = context.price;

  if (String(product['Workflow Status']).toUpperCase() !== HVDQ.STATUS.APPROVED) {
    errors.push('Workflow Status must be APPROVED.');
  }
  if (String(product['Validation Status']).toUpperCase() !== HVDQ.STATUS.VALID) {
    errors.push('Validation Status must be VALID.');
  }
  if (String(product['Founder Approval']).toUpperCase() !== HVDQ.STATUS.APPROVED) {
    errors.push('Founder Approval must be APPROVED.');
  }
  if (String(price['Approval Status']).toUpperCase() !== HVDQ.STATUS.APPROVED) {
    errors.push('Vietnam price must be APPROVED.');
  }
  if (asNumber_(price.Price) === null || asNumber_(price.Price) < 0) {
    errors.push('Vietnam price must be a valid non-negative number.');
  }
  if (!normalizeSku_(product.SKU)) errors.push('SKU is required.');
  if (!String(product['Product Name VI'] || '').trim()) errors.push('Product Name VI is required.');

  if (errors.length) throw new Error('Sync gates failed: ' + errors.join(' '));
}

function buildProductSetRequest_(context, uploadedFiles) {
  const product = context.product;
  const sku = normalizeSku_(product.SKU);
  const handle = String(product['Shopify Handle'] || '').trim() || slugify_(product['Product Name VI'] + '-' + sku);
  const productGid = String(product['Shopify Product GID'] || '').trim();
  const input = {
    title: String(product['Product Name VI']).trim(),
    handle,
    descriptionHtml: buildDescriptionHtml_(product),
    productType: String(product.Category || '').trim(),
    vendor: 'HVDQ',
    status: 'DRAFT',
    tags: uniqueStrings_([
      'HVDQ',
      product['Product Model'],
      product.Category,
      product.Technique,
      product.Edition
    ]),
    seo: {
      title: String(product['SEO Title VI'] || product['Product Name VI']).trim(),
      description: String(product['SEO Description VI'] || '').trim()
    }
  };

  if (uploadedFiles && uploadedFiles.length) {
    input.files = uploadedFiles.map(function (file) { return { id: file.id }; });
  }

  const variantPayload = buildVariants_(context);
  input.productOptions = variantPayload.productOptions;
  input.variants = variantPayload.variants;

  return {
    identifier: productGid ? { id: productGid } : { handle },
    input,
    synchronous: true
  };
}

function buildVariants_(context) {
  const rows = context.variants;
  const approvedPrice = asNumber_(context.price.Price);
  const compareAtPrice = asNumber_(context.price['Compare-at Price']);

  if (!rows.length) {
    return {
      productOptions: [{ name: 'Title', position: 1, values: [{ name: 'Default Title' }] }],
      variants: [{
        optionValues: [{ optionName: 'Title', name: 'Default Title' }],
        sku: normalizeSku_(context.product.SKU),
        price: String(approvedPrice),
        compareAtPrice: compareAtPrice === null ? null : String(compareAtPrice),
        inventoryPolicy: 'DENY',
        taxable: asBoolean_(context.price.Taxable),
        inventoryItem: { requiresShipping: true }
      }]
    };
  }

  const optionNames = [];
  rows.forEach(function (row) {
    ['Option 1 Name', 'Option 2 Name'].forEach(function (header) {
      const name = String(row[header] || '').trim();
      if (name && optionNames.indexOf(name) === -1) optionNames.push(name);
    });
  });

  const productOptions = optionNames.map(function (name, index) {
    const valueHeader = index === 0 ? 'Option 1 Value' : 'Option 2 Value';
    return {
      name,
      position: index + 1,
      values: uniqueStrings_(rows.map(function (row) { return row[valueHeader]; }))
        .map(function (value) { return { name: value }; })
    };
  });

  const variants = rows.map(function (row) {
    const optionValues = optionNames.map(function (name, index) {
      const valueHeader = index === 0 ? 'Option 1 Value' : 'Option 2 Value';
      return { optionName: name, name: String(row[valueHeader] || '').trim() };
    }).filter(function (item) { return item.name; });

    const variant = {
      optionValues,
      sku: normalizeSku_(row['Variant SKU'] || context.product.SKU),
      barcode: String(row.Barcode || '').trim() || null,
      price: String(approvedPrice),
      compareAtPrice: compareAtPrice === null ? null : String(compareAtPrice),
      inventoryPolicy: String(row['Inventory Policy'] || 'DENY').toUpperCase(),
      taxable: asBoolean_(row.Taxable),
      inventoryItem: {
        requiresShipping: asBoolean_(row['Requires Shipping'])
      }
    };

    const weight = asNumber_(row.Weight);
    if (weight !== null) {
      variant.inventoryItem.measurement = {
        weight: {
          value: weight,
          unit: String(row['Weight Unit'] || 'g').toUpperCase() === 'KG' ? 'KILOGRAMS' : 'GRAMS'
        }
      };
    }
    return variant;
  });

  return { productOptions, variants };
}

function buildProductMetafields_(product) {
  const definitions = [
    ['commerce_mode', product['Product Model'], 'single_line_text_field'],
    ['technique', product.Technique, 'single_line_text_field'],
    ['material', product.Material, 'multi_line_text_field'],
    ['dimensions', product.Dimensions, 'single_line_text_field'],
    ['edition', product.Edition, 'single_line_text_field'],
    ['artisan', product.Artisan, 'single_line_text_field'],
    ['lead_time_days', asNumber_(product['Lead Time (days)']), 'number_integer'],
    ['personalization', product.Personalization, 'multi_line_text_field'],
    ['care', product['Care VI'], 'multi_line_text_field'],
    ['warranty', product['Warranty VI'], 'multi_line_text_field']
  ];

  return definitions.filter(function (item) {
    return item[1] !== '' && item[1] !== null && typeof item[1] !== 'undefined';
  }).map(function (item) {
    return {
      namespace: 'hvdq',
      key: item[0],
      value: String(item[1]),
      type: item[2]
    };
  });
}

function buildDescriptionHtml_(product) {
  const story = String(product['Story VI'] || '').trim();
  if (!story) return '';
  return '<div class="hvdq-product-story"><p>' + escapeHtml_(story).replace(/\n+/g, '</p><p>') + '</p></div>';
}

function slugify_(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 255);
}

function uniqueStrings_(values) {
  const result = [];
  (values || []).forEach(function (value) {
    const normalized = String(value || '').trim();
    if (normalized && result.indexOf(normalized) === -1) result.push(normalized);
  });
  return result;
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
