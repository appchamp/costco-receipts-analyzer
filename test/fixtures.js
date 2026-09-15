// Synthetic, privacy-safe mock receipts for automated testing.
// Contains ZERO personal or raw transaction data.

const SYNTHETIC_RECEIPTS = [
  {
    transactionDate: '2026-08-10',
    transactionDateTime: '2026-08-10T10:15:00',
    warehouseName: 'TEST WAREHOUSE 1',
    warehouseNumber: '101',
    warehouseAddress1: '123 SAMPLE ST',
    warehouseCity: 'SAN FRANCISCO',
    warehouseState: 'CA',
    warehousePostalCode: '94105',
    transactionBarcode: '1011234567890123456789',
    total: 82.48,
    transactionType: 'Sale',
    itemArray: [
      {
        itemNumber: '2619',
        itemDescription01: 'ORG BANANAS',
        unit: 1,
        amount: 2.49,
        taxFlag: 'N'
      },
      {
        itemNumber: '1726198',
        itemDescription01: 'SIMILAR SUBSTRING ITEM',
        unit: 1,
        amount: 19.99,
        taxFlag: 'A'
      },
      {
        itemNumber: '99901',
        itemDescription01: 'SAMPLE COFFEE 2PK',
        unit: 1,
        amount: 20.00,
        taxFlag: 'A'
      },
      {
        itemNumber: '99901',
        itemDescription01: '/ 99901 SAMPLE COFFEE DISC',
        unit: 1,
        amount: -4.00,
        taxFlag: 'A'
      },
      {
        itemNumber: '1846287',
        itemDescription01: 'WIRELESS HEADPHONES',
        unit: 1,
        amount: 44.00,
        taxFlag: 'A'
      }
    ]
  },
  {
    transactionDate: '2026-08-20',
    transactionDateTime: '2026-08-20T14:30:00',
    warehouseName: 'TEST WAREHOUSE 2',
    warehouseNumber: '102',
    warehouseAddress1: '456 MOCK AVE',
    warehouseCity: 'SAN JOSE',
    warehouseState: 'CA',
    warehousePostalCode: '95113',
    transactionBarcode: '1029876543210987654321',
    total: -44.00,
    transactionType: 'Refund',
    itemArray: [
      {
        itemNumber: '1846287',
        itemDescription01: 'WIRELESS HEADPHONES',
        unit: -1,
        amount: -44.00,
        taxFlag: 'A'
      }
    ]
  },
  {
    transactionDate: '2026-09-01',
    transactionDateTime: '2026-09-01T16:00:00',
    warehouseName: 'TEST WAREHOUSE 1',
    warehouseNumber: '101',
    warehouseAddress1: '123 SAMPLE ST',
    warehouseCity: 'SAN FRANCISCO',
    warehouseState: 'CA',
    warehousePostalCode: '94105',
    transactionBarcode: '1015555555555555555555',
    total: 2.49,
    transactionType: 'Sale',
    itemArray: [
      {
        itemNumber: '2619',
        itemDescription01: 'ORG BANANAS',
        unit: 1,
        amount: 2.49,
        taxFlag: 'N'
      },
      {
        itemNumber: 'VOID99',
        itemDescription01: 'VOIDED ITEM ENTRY',
        unit: 1,
        amount: 15.00,
        taxFlag: 'A',
        itemIdentifier: 'V'
      }
    ]
  }
];

module.exports = {
  SYNTHETIC_RECEIPTS
};
