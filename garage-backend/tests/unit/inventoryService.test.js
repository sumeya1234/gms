import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createInventoryItem, fetchInventoryItemById } from '../../services/inventoryService.js';
import db from '../../config/db.js';

vi.mock('../../config/db.js', () => ({
  default: {
    query: vi.fn(),
    getConnection: vi.fn(),
  },
}));

/**
 * NOTE on mock ordering in createInventoryItem tests:
 *
 * inventoryService has a module-level `supplierColumnsChecked` flag.
 * The FIRST test that calls createInventoryItem will trigger `ensureSupplierColumns`
 * which fires a `SHOW COLUMNS` query. After that, subsequent tests in the same
 * module run (the flag stays `true`) so they do NOT fire SHOW COLUMNS.
 *
 * Mock call order per test:
 *   Test 1 (create new item):   SHOW COLUMNS → garage check → item check → INSERT
 *   Test 2 (update existing):   garage check → item check → UPDATE
 *   Test 3 (manager 403):       manager check → (throws before garage check)
 */

describe('Inventory Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createInventoryItem', () => {
    const admin = { id: 1, role: 'SuperAdmin' };

    it('[Test 1] should create a new inventory item if it does not exist', async () => {
      // 1) SHOW COLUMNS (ensureSupplierColumns — first call ever in this test file)
      vi.mocked(db.query).mockResolvedValueOnce([[
        { Field: 'ItemID' }, { Field: 'SupplierName' }, { Field: 'SupplierEmail' }, { Field: 'SupplierPhone' }
      ]]);
      // 2) SELECT 1 FROM garages (garage exists)
      vi.mocked(db.query).mockResolvedValueOnce([[{ '1': 1 }]]);
      // 3) SELECT existing item check (none found)
      vi.mocked(db.query).mockResolvedValueOnce([[]]);
      // 4) INSERT INTO inventory
      vi.mocked(db.query).mockResolvedValueOnce([{ insertId: 42 }]);

      await createInventoryItem('Oil Filter', 10, 100, 150, 'Supplier X', 's@x.com', '123', 10, admin);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO inventory'),
        expect.arrayContaining(['Oil Filter', 10, 100, 150, 'Supplier X', 's@x.com', '123', 10])
      );
    });

    it('[Test 2] should update quantity if item already exists', async () => {
      // supplierColumnsChecked is now true — NO SHOW COLUMNS call
      // 1) SELECT 1 FROM garages
      vi.mocked(db.query).mockResolvedValueOnce([[{ '1': 1 }]]);
      // 2) SELECT existing item (found)
      vi.mocked(db.query).mockResolvedValueOnce([[{ ItemID: 5, ItemName: 'oil filter', Quantity: 5 }]]);
      // 3) UPDATE inventory
      vi.mocked(db.query).mockResolvedValueOnce([{ affectedRows: 1 }]);

      await createInventoryItem('Oil Filter', 10, 110, 160, null, null, null, 10, admin);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE inventory'),
        [10, 110, 160, 'Oil Filter', null, null, null, 5]
      );
    });

    it('[Test 3] should throw 403 if GarageManager is not assigned to this garage', async () => {
      const manager = { id: 2, role: 'GarageManager' };
      // supplierColumnsChecked is true — NO SHOW COLUMNS call
      // 1) SELECT 1 FROM garagemanagers (manager NOT found → empty array)
      vi.mocked(db.query).mockResolvedValueOnce([[]]);

      await expect(
        createInventoryItem('Part', 1, 1, 1, null, null, null, 10, manager)
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('fetchInventoryItemById', () => {
    it('should return the item if found', async () => {
      vi.mocked(db.query).mockResolvedValueOnce([[{ ItemID: 1, ItemName: 'Brake Pad' }]]);
      const result = await fetchInventoryItemById(1);
      expect(result.ItemName).toBe('Brake Pad');
    });

    it('should throw 404 if item not found', async () => {
      vi.mocked(db.query).mockResolvedValueOnce([[]]);
      await expect(fetchInventoryItemById(999)).rejects.toThrow('inventory item not found');
    });
  });
});
