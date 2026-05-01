import db from "../config/db.js";

export const createVehicle = async (plateNumber, type, model, customerId) => {
  await db.query(
    `INSERT INTO vehicles (PlateNumber, Type, Model, CustomerID)
     VALUES (?, ?, ?, ?)`,
    [plateNumber, type, model, customerId]
  );
};

export const fetchMyVehicles = async (customerId) => {
  const [rows] = await db.query(
    "SELECT * FROM vehicles WHERE CustomerID = ?",
    [customerId]
  );
  return rows;
};

export const fetchVehicleById = async (id, customerId) => {
  const [rows] = await db.query("SELECT * FROM vehicles WHERE VehicleID = ? AND CustomerID = ?", [id, customerId]);
  if (rows.length === 0) {
    const error = new Error("Vehicle not found or unauthorized");
    error.status = 404;
    throw error;
  }
  return rows[0];
};

export const modifyVehicle = async (id, customerId, updateData) => {
  
  await fetchVehicleById(id, customerId);

  const updates = [];
  const values = [];

  for (const [key, value] of Object.entries(updateData)) {
    if (value !== undefined) {
      const fieldMap = {
        plateNumber: 'PlateNumber',
        type: 'Type',
        model: 'Model'
      };
      
      if(fieldMap[key]) {
        updates.push(`${fieldMap[key]} = ?`);
        values.push(value);
      }
    }
  }

  if (updates.length === 0) return;

  values.push(id, customerId);

  await db.query(
    `UPDATE vehicles SET ${updates.join(', ')} WHERE VehicleID = ? AND CustomerID = ?`,
    values
  );
};

export const removeVehicle = async (id, customerId) => {
  
  await fetchVehicleById(id, customerId);
  
  await db.query("DELETE FROM vehicles WHERE VehicleID = ? AND CustomerID = ?", [id, customerId]);
};
