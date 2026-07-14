function prepareApprovedMedia_(context) {
  if (!context.media.length) return [];
  const candidates = [];

  context.media.forEach(function (record) {
    const driveUrl = String(record['Drive File / Folder URL'] || '').trim();
    if (!driveUrl) return;
    const driveId = extractDriveId_(driveUrl);
    if (!driveId) throw new Error('Cannot parse Drive ID from MEDIA row ' + record._rowNumber + '.');

    const files = resolveDriveFiles_(driveId);
    files.forEach(function (file) {
      const mimeType = file.getMimeType();
      if (mimeType.indexOf('image/') !== 0) return;
      candidates.push({
        record,
        blob: file.getBlob().setName(file.getName()),
        filename: buildShopifyFilename_(context.product.SKU, record['Media ID'], record.Filename || file.getName()),
        mimeType,
        alt: String(record['Alt VI'] || context.product['Alt Text VI'] || context.product['Product Name VI']).trim()
      });
    });
  });

  return candidates;
}

function uploadMediaToShopify_(candidates) {
  if (!candidates.length) return [];
  const stagedInput = candidates.map(function (candidate) {
    return {
      filename: candidate.filename,
      mimeType: candidate.mimeType,
      resource: 'IMAGE',
      httpMethod: 'POST'
    };
  });

  const stagedData = shopifyGraphql_(STAGED_UPLOADS_MUTATION_, { input: stagedInput });
  throwOnUserErrors_('stagedUploadsCreate', stagedData.stagedUploadsCreate.userErrors);
  const targets = stagedData.stagedUploadsCreate.stagedTargets || [];
  if (targets.length !== candidates.length) {
    throw new Error('Shopify returned ' + targets.length + ' staged targets for ' + candidates.length + ' files.');
  }

  targets.forEach(function (target, index) {
    uploadBlobToStagedTarget_(target, candidates[index].blob);
  });

  const fileInputs = targets.map(function (target, index) {
    return {
      originalSource: target.resourceUrl,
      contentType: 'IMAGE',
      filename: candidates[index].filename,
      alt: candidates[index].alt,
      duplicateResolutionMode: 'REPLACE'
    };
  });
  const fileData = shopifyGraphql_(FILE_CREATE_MUTATION_, { files: fileInputs });
  throwOnUserErrors_('fileCreate', fileData.fileCreate.userErrors);

  const files = fileData.fileCreate.files || [];
  files.forEach(function (file, index) {
    file._candidate = candidates[index];
  });
  return files;
}

function uploadBlobToStagedTarget_(target, blob) {
  const payload = {};
  (target.parameters || []).forEach(function (parameter) {
    payload[parameter.name] = parameter.value;
  });
  payload.file = blob;

  const response = UrlFetchApp.fetch(target.url, {
    method: 'post',
    payload,
    muteHttpExceptions: true
  });
  const statusCode = response.getResponseCode();
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('Staged upload failed (' + statusCode + '): ' + response.getContentText().slice(0, 500));
  }
}

function writeBackMedia_(mediaTable, uploadedFiles) {
  uploadedFiles.forEach(function (file) {
    const candidate = file._candidate;
    if (!candidate || !candidate.record) return;
    updateRecord_(mediaTable, candidate.record._rowNumber, {
      'Shopify File GID': file.id,
      'Shopify CDN URL': file.preview && file.preview.image ? file.preview.image.url : '',
      'Sync Status': 'SYNCED',
      'Error': ''
    });
  });
}

function buildShopifyFilename_(sku, mediaId, filename) {
  const original = String(filename || 'image').trim().replace(/[^A-Za-z0-9._-]+/g, '-');
  const prefix = [normalizeSku_(sku), String(mediaId || '').trim()].filter(Boolean).join('-');
  return (prefix ? prefix + '-' : '') + original;
}

function extractDriveId_(value) {
  const match = String(value || '').match(/[-\w]{20,}/);
  return match ? match[0] : '';
}

function resolveDriveFiles_(driveId) {
  try {
    return [DriveApp.getFileById(driveId)];
  } catch (fileError) {
    const folder = DriveApp.getFolderById(driveId);
    const iterator = folder.getFiles();
    const files = [];
    while (iterator.hasNext()) files.push(iterator.next());
    return files;
  }
}
