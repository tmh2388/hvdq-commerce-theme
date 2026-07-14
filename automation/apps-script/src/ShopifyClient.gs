const PRODUCT_SET_MUTATION_ = [
  'mutation HvdqProductSet($identifier: ProductSetIdentifiers, $input: ProductSetInput!, $synchronous: Boolean!) {',
  '  productSet(identifier: $identifier, input: $input, synchronous: $synchronous) {',
  '    product {',
  '      id',
  '      handle',
  '      status',
  '      variants(first: 100) { nodes { id sku } }',
  '    }',
  '    userErrors { field message code }',
  '  }',
  '}'
].join('\n');

const STAGED_UPLOADS_MUTATION_ = [
  'mutation HvdqStagedUploads($input: [StagedUploadInput!]!) {',
  '  stagedUploadsCreate(input: $input) {',
  '    stagedTargets { url resourceUrl parameters { name value } }',
  '    userErrors { field message }',
  '  }',
  '}'
].join('\n');

const FILE_CREATE_MUTATION_ = [
  'mutation HvdqFileCreate($files: [FileCreateInput!]!) {',
  '  fileCreate(files: $files) {',
  '    files { id alt fileStatus preview { image { url } } }',
  '    userErrors { field message code }',
  '  }',
  '}'
].join('\n');

const METAFIELDS_SET_MUTATION_ = [
  'mutation HvdqMetafieldsSet($metafields: [MetafieldsSetInput!]!) {',
  '  metafieldsSet(metafields: $metafields) {',
  '    metafields { id namespace key value }',
  '    userErrors { field message code }',
  '  }',
  '}'
].join('\n');

function shopifyGraphql_(query, variables) {
  const config = getHvdqRuntimeConfig_();
  assertRuntimeConfigured_(config, true);

  const endpoint = 'https://' + config.shopDomain + '/admin/api/' + config.apiVersion + '/graphql.json';
  const response = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'X-Shopify-Access-Token': config.accessToken },
    payload: JSON.stringify({ query, variables: variables || {} }),
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  const responseText = response.getContentText();
  let payload;
  try {
    payload = JSON.parse(responseText);
  } catch (error) {
    throw new Error('Shopify returned non-JSON response (' + statusCode + '): ' + responseText.slice(0, 500));
  }

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('Shopify HTTP ' + statusCode + ': ' + JSON.stringify(payload));
  }
  if (payload.errors && payload.errors.length) {
    throw new Error('Shopify GraphQL errors: ' + JSON.stringify(payload.errors));
  }
  return payload.data;
}

function throwOnUserErrors_(operationName, userErrors) {
  if (!userErrors || !userErrors.length) return;
  const message = userErrors.map(function (item) {
    const field = item.field ? item.field.join('.') + ': ' : '';
    return field + item.message + (item.code ? ' [' + item.code + ']' : '');
  }).join('; ');
  throw new Error(operationName + ' failed: ' + message);
}
