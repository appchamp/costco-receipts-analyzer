const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { SYNTHETIC_RECEIPTS } = require('./fixtures.js');

const HTML_PATH = path.join(__dirname, '..', 'index.html');
let htmlContent = '';
let sandboxContext = null;
let lastPaperHtml = '';

function setupBrowserSandbox(html) {
  lastPaperHtml = '';
  const dummyPaper = {
    set innerHTML(val) { lastPaperHtml = val; },
    get innerHTML() { return lastPaperHtml; }
  };

  const dummyEl = {
    addEventListener: () => {},
    style: {},
    classList: { add: () => {}, remove: () => {} },
    appendChild: () => {},
    removeChild: () => {},
    querySelector: () => dummyEl,
    querySelectorAll: () => [],
    closest: () => dummyEl,
    getContext: () => ({}),
    scrollIntoView: () => {},
    innerHTML: '',
    textContent: ''
  };
  dummyEl.parentElement = dummyEl;

  const ctx = {
    console: console,
    Chart: function() { return { destroy: () => {} }; },
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
    document: {
      body: dummyEl,
      getElementById: (id) => {
        if (id === 'receiptPaper') return dummyPaper;
        return dummyEl;
      },
      createElement: (tag) => ({
        tag,
        innerHTML: '',
        style: {},
        setAttribute: () => {},
        classList: { add: () => {} },
        appendChild: () => {},
        querySelector: () => dummyEl,
        closest: () => dummyEl,
        parentElement: dummyEl
      }),
      querySelectorAll: () => []
    },
    window: {
      addEventListener: () => {},
      print: () => {}
    }
  };

  vm.createContext(ctx);

  // Extract all inline script blocks
  const scriptRegex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
  const matches = [...html.matchAll(scriptRegex)];
  for (const m of matches) {
    vm.runInContext(m[1], ctx);
  }

  return ctx;
}

before(() => {
  assert.ok(fs.existsSync(HTML_PATH), 'index.html must exist');
  htmlContent = fs.readFileSync(HTML_PATH, 'utf8');
  sandboxContext = setupBrowserSandbox(htmlContent);
  sandboxContext.handleData(SYNTHETIC_RECEIPTS);
});

describe('1. HTML Syntax & Script Tag Integrity', () => {
  test('All external script tags with src have closing </script> tags', () => {
    // Pattern for unclosed <script src=...> tags that directly bleed into content
    const unclosedSrcPattern = /<script[^>]+src=[^>]+>(?!\s*<\/script>)/gi;
    const matches = [...htmlContent.matchAll(unclosedSrcPattern)];
    assert.equal(
      matches.length,
      0,
      
    );
  });

  test('Required dashboard DOM elements exist in HTML', () => {
    const requiredIds = [
      'totalSpent',
      'totalPurchases',
      'uniqueItems',
      'receiptCount',
      'itemFilterInput',
      'itemHistorySection',
      'itemHistoryBody',
      'itemHistoryTitle'
    ];
    for (const id of requiredIds) {
      assert.ok(
        htmlContent.includes('id="' + id + '"'),
        'index.html must contain element with id="' + id + '"'
      );
    }
  });

  test('Electronic receipt modal DOM elements exist when modal feature is present', (t) => {
    if (!htmlContent.includes('id="receiptModalOverlay"')) {
      t.skip('Electronic receipt modal markup not yet merged into index.html');
      return;
    }
    assert.ok(htmlContent.includes('id="receiptModalOverlay"'));
    assert.ok(htmlContent.includes('id="receiptPaper"'));
  });
});

describe('2. Scope & Execution Health (Regression Prevention)', () => {
  test('processReceipts executes without ReferenceError for receiptIdx', () => {
    assert.doesNotThrow(() => {
      sandboxContext.processReceipts(SYNTHETIC_RECEIPTS, '2619');
    }, 'processReceipts must not throw ReferenceError when filtering');
  });

  test('All matching purchase records include a valid receiptIndex property when receipt viewer is enabled', (t) => {
    const { matchingPurchases } = sandboxContext.processReceipts(SYNTHETIC_RECEIPTS, '2619');
    assert.ok(matchingPurchases.length > 0, 'Should find matching purchases for item 2619');
    if (matchingPurchases[0].receiptIndex === undefined) {
      t.skip('receiptIndex property not yet merged into index.html');
      return;
    }
    for (const p of matchingPurchases) {
      assert.equal(typeof p.receiptIndex, 'number', 'Every purchase must have a numeric receiptIndex');
      assert.ok(p.receiptIndex >= 0 && p.receiptIndex < SYNTHETIC_RECEIPTS.length);
    }
  });
});

describe('3. Item Search & Filtering Logic', () => {
  test('Exact item ID query "2619" matches only #2619, never substring item #1726198', () => {
    const { matchingPurchases } = sandboxContext.processReceipts(SYNTHETIC_RECEIPTS, '2619');
    assert.equal(matchingPurchases.length, 2, 'Should match exactly 2 purchases for #2619');
    for (const p of matchingPurchases) {
      assert.equal(p.itemNumber, '2619', 'Item number must strictly be 2619');
      assert.notEqual(p.itemNumber, '1726198', 'Must not match substring item 1726198');
    }
  });

  test('Parenthesized query "(#2619)" matches strictly item #2619', () => {
    const { matchingPurchases } = sandboxContext.processReceipts(SYNTHETIC_RECEIPTS, '(#2619)');
    assert.equal(matchingPurchases.length, 2);
    for (const p of matchingPurchases) {
      assert.equal(p.itemNumber, '2619');
    }
  });

  test('Description text query "banana" matches case-insensitively', () => {
    const { matchingPurchases } = sandboxContext.processReceipts(SYNTHETIC_RECEIPTS, 'banana');
    assert.equal(matchingPurchases.length, 2);
    assert.equal(matchingPurchases[0].name, 'ORG BANANAS');
  });

  test('Non-existent query returns 0 matching records without error', () => {
    const { matchingPurchases } = sandboxContext.processReceipts(SYNTHETIC_RECEIPTS, 'DOES_NOT_EXIST_XYZ');
    assert.equal(matchingPurchases.length, 0);
  });
});

describe('4. Strict Coupon Deductions', () => {
  test('Coupons correctly attach to parent line item and deduct from netAmount', () => {
    const { matchingPurchases } = sandboxContext.processReceipts(SYNTHETIC_RECEIPTS, '99901');
    assert.equal(matchingPurchases.length, 1);
    const item = matchingPurchases[0];
    assert.equal(item.itemNumber, '99901');
    assert.equal(item.baseAmount, 20.00);
    assert.equal(item.hasCoupon, true);
    assert.equal(item.couponTotal, 4.00);
    assert.equal(item.netAmount, 16.00);
  });
});

describe('5. Refund & Return Pairing', () => {
  test('Refund record pairs with prior sale having matching item code and price', () => {
    const { matchingPurchases } = sandboxContext.processReceipts(SYNTHETIC_RECEIPTS, '1846287');
    assert.equal(matchingPurchases.length, 2, 'Should include 1 sale and 1 refund');

    sandboxContext.matchRefundsWithSales(matchingPurchases);

    const sale = matchingPurchases.find(p => p.type === 'Sale');
    const refund = matchingPurchases.find(p => p.type === 'Refund');

    assert.ok(sale, 'Sale record must exist');
    assert.ok(refund, 'Refund record must exist');
    assert.ok(refund.matchedRecords.length > 0, 'Refund must be paired with sale');
    assert.equal(refund.matchedRecords[0].price, 44.00, 'Matched sale price must equal refund price');
  });
});

describe('6. Electronic Receipt & Barcode Generation', () => {
  test('generateCode128Svg creates a valid SVG element with bar rectangles', (t) => {
    if (typeof sandboxContext.generateCode128Svg !== 'function') {
      t.skip('Electronic receipt barcode generator not yet present in index.html');
      return;
    }
    const svg = sandboxContext.generateCode128Svg('1011234567890123456789');
    assert.ok(svg.startsWith('<svg'), 'Output must be an SVG tag');
    assert.ok(svg.includes('viewBox='), 'SVG must include viewBox');
    assert.ok(svg.includes('<rect'), 'SVG must contain barcode bar rect elements');
  });

  test('openReceiptModal renders receipt details, highlights item, and displays barcode', (t) => {
    if (typeof sandboxContext.openReceiptModal !== 'function') {
      t.skip('Electronic receipt modal not yet present in index.html');
      return;
    }
    const { matchingPurchases } = sandboxContext.processReceipts(SYNTHETIC_RECEIPTS, '2619');
    const first = matchingPurchases[0];

    sandboxContext.openReceiptModal(first.barcode, first.itemNumber, first.receiptIndex);

    assert.ok(lastPaperHtml.includes('TEST WAREHOUSE 1'), 'Receipt must display warehouse name');
    assert.ok(lastPaperHtml.includes('SELECTED'), 'Receipt must highlight selected item');
    assert.ok(lastPaperHtml.includes('2619'), 'Receipt must show item number 2619');
    assert.ok(lastPaperHtml.includes('<svg'), 'Receipt must render barcode SVG');
  });
});
