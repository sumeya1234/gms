import db from "../config/db.js";

let supplierColumnsChecked = false;

const ensureSupplierColumns = async () => {
  if (supplierColumnsChecked) return;

  const [columns] = await db.query("SHOW COLUMNS FROM Inventory");
  const existing = new Set(columns.map((c) => c.Field));
  const alters = [];

  if (!existing.has("SupplierName")) {
    alters.push("ADD COLUMN SupplierName VARCHAR(100) NULL");
  }
  if (!existing.has("SupplierEmail")) {
    alters.push("ADD COLUMN SupplierEmail VARCHAR(100) NULL");
  }
  if (!existing.has("SupplierPhone")) {
    alters.push("ADD COLUMN SupplierPhone VARCHAR(20) NULL");
  }

  if (alters.length > 0) {
    await db.query(`ALTER TABLE Inventory ${alters.join(", ")}`);
  }

  supplierColumnsChecked = true;
};

export const createInventoryItem = async (itemName, quantity, unitPrice, supplierName, supplierEmail, supplierPhone, garageId, admin) => {
  await ensureSupplierColumns();

  const normalizedSupplierName = supplierName?.trim?.() || null;
  const normalizedSupplierEmail = supplierEmail?.trim?.() || null;
  const normalizedSupplierPhone = supplierPhone?.trim?.() || null;
  // 1. If requester is GarageManager, verify they belong to this garageId
  if (admin.role === "GarageManager") {
    const [manager] = await db.query(
      "SELECT 1 FROM GarageManagers WHERE UserID = ? AND GarageID = ?",
      [admin.id, garageId]
    );
    if (manager.length === 0) {
      const error = new Error("Unauthorized: You do not manage this garage");
      error.status = 403;
      throw error;
    }
  }

  const [garage] = await db.query("SELECT 1 FROM Garages WHERE GarageID = ?", [garageId]);
  
  if (garage.length === 0) {
    const error = new Error("Garage not found");
    error.status = 404;
    throw error;
  }

  // Case-insensitive check for existing inventory item
  const [existingItems] = await db.query(
    "SELECT ItemID, ItemName, Quantity FROM Inventory WHERE GarageID = ? AND LOWER(ItemName) = LOWER(?)",
    [garageId, itemName]
  );

  if (existingItems.length > 0) {
    const existing = existingItems[0];
    
    // Choose the best casing (if existing is all lowercase and new is CamelCase, prefer the new name)
    let bestName = existing.ItemName;
    const existingHasCaps = /[A-Z]/.test(existing.ItemName);
    const newHasCaps = /[A-Z]/.test(itemName);
    if (newHasCaps && !existingHasCaps) {
      bestName = itemName;
    }

    // Merge: retain best casing, add quantity, update unit price
    await db.query(
      `UPDATE Inventory
       SET Quantity = Quantity + ?,
           UnitPrice = ?,
           ItemName = ?,
           SupplierName = COALESCE(?, SupplierName),
           SupplierEmail = COALESCE(?, SupplierEmail),
           SupplierPhone = COALESCE(?, SupplierPhone)
       WHERE ItemID = ?`,
      [quantity, unitPrice, bestName, normalizedSupplierName, normalizedSupplierEmail, normalizedSupplierPhone, existing.ItemID]
    );
  } else {
    // Insert new logic
    await db.query(
      `INSERT INTO Inventory (ItemName, Quantity, UnitPrice, SupplierName, SupplierEmail, SupplierPhone, GarageID)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [itemName, quantity, unitPrice, normalizedSupplierName, normalizedSupplierEmail, normalizedSupplierPhone, garageId]
    );
  }
};

export const fetchInventory = async (garageId) => {
  const [rows] = await db.query(
    "SELECT * FROM Inventory WHERE GarageID = ?",
    [garageId]
  );
  return rows;
};

export const fetchInventoryItemById = async (itemId) => {
  const [rows] = await db.query("SELECT * FROM Inventory WHERE ItemID = ?", [itemId]);
  if (rows.length === 0) {
    const error = new Error("Inventory item not found");
    error.status = 404;
    throw error;
  }
  return rows[0];
};

export const modifyInventoryItem = async (itemId, updateData, admin) => {
  await ensureSupplierColumns();

  const item = await fetchInventoryItemById(itemId);

  if (admin.role === "GarageManager") {
    const [manager] = await db.query(
      "SELECT 1 FROM GarageManagers WHERE UserID = ? AND GarageID = ?",
      [admin.id, item.GarageID]
    );
    if (manager.length === 0) {
      const error = new Error("Unauthorized: You do not manage the garage for this item");
      error.status = 403;
      throw error;
    }
  }

  const updates = [];
  const values = [];

  for (const [key, value] of Object.entries(updateData)) {
    if (value !== undefined) {
      const fieldMap = {
        itemName: 'ItemName',
        quantity: 'Quantity',
        unitPrice: 'UnitPrice',
        supplierName: 'SupplierName',
        supplierEmail: 'SupplierEmail',
        supplierPhone: 'SupplierPhone'
      };
      
      if(fieldMap[key]) {
        updates.push(`${fieldMap[key]} = ?`);
        values.push(value);
      }
    }
  }

  if (updates.length === 0) return;

  values.push(itemId);

  await db.query(`UPDATE Inventory SET ${updates.join(', ')} WHERE ItemID = ?`, values);
};

export const removeInventoryItem = async (itemId, admin) => {
  const item = await fetchInventoryItemById(itemId);

  if (admin.role === "GarageManager") {
    const [manager] = await db.query(
      "SELECT 1 FROM GarageManagers WHERE UserID = ? AND GarageID = ?",
      [admin.id, item.GarageID]
    );
    if (manager.length === 0) {
      const error = new Error("Unauthorized: You do not manage the garage for this item");
      error.status = 403;
      throw error;
    }
  }
  
  await db.query("DELETE FROM Inventory WHERE ItemID = ?", [itemId]);
};
