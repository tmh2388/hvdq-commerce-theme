function runHvdqUnitTests() {
  const tests = [
    function () { assertEqual_('slugify Vietnamese', 'dong-ho-phap-lam-sku-01', slugify_('Đồng hồ Pháp Lam SKU 01')); },
    function () { assertEqual_('normalize SKU', 'HVDQ-001', normalizeSku_(' hvdq-001 ')); },
    function () { assertEqual_('boolean TRUE', true, asBoolean_('TRUE')); },
    function () { assertEqual_('boolean false', false, asBoolean_('no')); },
    function () { assertEqual_('number', 25000000, asNumber_('25000000')); },
    function () { assertEqual_('unique strings', 'A|B', uniqueStrings_(['A', 'A', '', 'B']).join('|')); },
    function () { assertEqual_('shop domain', 'hvdq.myshopify.com', normalizeShopDomain_('https://hvdq.myshopify.com/')); },
    function () { assertEqual_('schema contract version', '1.2.0', HVDQ_SCHEMA_CONTRACT_VERSION); },
    function () { assertEqual_('schema contract fields', 20, HVDQ_SCHEMA_CONTRACT_FIELDS.length); },
    function () { assertEqual_('schema contract rows', 210, HVDQ_SCHEMA_CONTRACT.length); },
    function () { assertEqual_('workflow action count', 6, HVDQ_PRODUCT_WORKFLOW_ACTIONS.length); }
  ];

  const results = [];
  tests.forEach(function (test) {
    try {
      test();
      results.push({ status: 'PASS' });
    } catch (error) {
      results.push({ status: 'FAIL', message: error.message });
    }
  });
  const failed = results.filter(function (result) { return result.status === 'FAIL'; });
  if (failed.length) throw new Error(JSON.stringify(failed));
  return { passed: results.length, failed: 0 };
}

function assertEqual_(name, expected, actual) {
  if (expected !== actual) {
    throw new Error(name + ': expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
  }
}
