import db from "../config/db.js";

export const getAllGarages = async (location) => {
  let query = `
    SELECT g.*, 
           COUNT(DISTINCT r.ReviewID) as TotalReviews, 
           IFNULL(AVG(r.Rating), 0) as AverageRating,
           MIN(gs.Price) as MinPrice
    FROM Garages g
    LEFT JOIN Reviews r ON g.GarageID = r.GarageID
    LEFT JOIN GarageServices gs ON g.GarageID = gs.GarageID
  `;
  const params = [];

  if (location) {
    query += " WHERE g.Location LIKE ?";
    params.push(`%${location}%`);
  }
  
  query += " GROUP BY g.GarageID";

  const [rows] = await db.query(query, params);

  // Fetch services for each garage
  for (const garage of rows) {
    const [services] = await db.query(
      "SELECT ServiceName, Price FROM GarageServices WHERE GarageID = ? ORDER BY ServiceName",
      [garage.GarageID]
    );
    garage.Services = services;
  }

  return rows;
};

import { createChapaSubaccount } from "./paymentService.js";

export const addGarage = async (name, location, contact, bankCode, bankAccountNumber, bankAccountName) => {
  let subaccountId = null;
  if (bankCode && bankAccountNumber && bankAccountName) {
    subaccountId = await createChapaSubaccount(name, bankAccountName, bankCode, bankAccountNumber);
  }

  const [result] = await db.query(
    `INSERT INTO Garages (Name, Location, ContactNumber, BankCode, BankAccountNumber, BankAccountName, ChapaSubaccountID)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, location, contact, bankCode, bankAccountNumber, bankAccountName, subaccountId]
  );
  return result.insertId;
};

export const fetchGarageById = async (id) => {
  const [rows] = await db.query("SELECT * FROM Garages WHERE GarageID = ?", [id]);
  if (rows.length === 0) {
    const error = new Error("Garage not found");
    error.status = 404;
    throw error;
  }
  return rows[0];
};

export const modifyGarage = async (id, updateData, user) => {
  // Check if garage exists
  await fetchGarageById(id);

  if (user && user.role === "GarageManager") {
    // Check if user's garage matches id
    const [managerRecord] = await db.query("SELECT GarageID FROM GarageManagers WHERE UserID = ?", [user.id]);
    if (!managerRecord.length || Number(managerRecord[0].GarageID) !== Number(id)) {
      const error = new Error("Garage Managers can only update their own garage details");
      error.status = 403;
      throw error;
    }
  }

  const updates = [];
  const values = [];

  // Check if bank details are being updated
  if (updateData.bankCode || updateData.bankAccountNumber || updateData.bankAccountName) {
    // We need all three to create a subaccount
    const existingGarage = await fetchGarageById(id);
    const bCode = updateData.bankCode || existingGarage.BankCode;
    const bAcc = updateData.bankAccountNumber || existingGarage.BankAccountNumber;
    const bName = updateData.bankAccountName || existingGarage.BankAccountName;
    const gName = updateData.name || existingGarage.Name;

    if (bCode && bAcc && bName) {
      const newSubaccountId = await createChapaSubaccount(gName, bName, bCode, bAcc);
      updateData.ChapaSubaccountID = newSubaccountId;
    }
  }

  for (const [key, value] of Object.entries(updateData)) {
    if (value !== undefined) {
      // Mapping fields based on the input payload
      const fieldMap = {
        name: 'Name',
        location: 'Location',
        contact: 'ContactNumber',
        status: 'Status',
        bankCode: 'BankCode',
        bankAccountNumber: 'BankAccountNumber',
        bankAccountName: 'BankAccountName',
        ChapaSubaccountID: 'ChapaSubaccountID'
      };
      
      if(fieldMap[key]) {
        updates.push(`${fieldMap[key]} = ?`);
        values.push(value);
      }
    }
  }

  if (updates.length === 0) return;

  values.push(id);

  await db.query(
    `UPDATE Garages SET ${updates.join(', ')} WHERE GarageID = ?`,
    values
  );
};

export const removeGarage = async (id) => {
  // Check if garage exists
  await fetchGarageById(id);
  
  await db.query("DELETE FROM Garages WHERE GarageID = ?", [id]);
};
