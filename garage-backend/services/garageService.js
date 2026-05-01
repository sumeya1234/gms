import db from "../config/db.js";

const defaultWorkingHours = {
  monday: { isOpen: true, open: "08:00", close: "18:00" },
  tuesday: { isOpen: true, open: "08:00", close: "18:00" },
  wednesday: { isOpen: true, open: "08:00", close: "18:00" },
  thursday: { isOpen: true, open: "08:00", close: "18:00" },
  friday: { isOpen: true, open: "08:00", close: "18:00" },
  saturday: { isOpen: true, open: "09:00", close: "14:00" },
  sunday: { isOpen: false, open: null, close: null }
};

const getCurrentDayKey = (timezone) => {
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: timezone || "Africa/Addis_Ababa" }).format(new Date());
  return weekday.toLowerCase();
};

const getCurrentTimeHHMM = (timezone) => {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone || "Africa/Addis_Ababa"
  }).format(new Date());
};

const ensureGarageOwnersTable = async () => {
  
  return true;
};

const getGarageAvailabilityLabel = (garage) => {
  let hours = defaultWorkingHours;
  if (garage.WorkingHours) {
    try {
      hours = typeof garage.WorkingHours === "string" ? JSON.parse(garage.WorkingHours) : garage.WorkingHours;
    } catch {
      hours = defaultWorkingHours;
    }
  }
  const dayKey = getCurrentDayKey(garage.Timezone);
  const dayHours = hours?.[dayKey];
  if (!dayHours || !dayHours.isOpen || !dayHours.open || !dayHours.close) {
    return "Closed";
  }
  const nowHHMM = getCurrentTimeHHMM(garage.Timezone);
  return nowHHMM >= dayHours.open && nowHHMM < dayHours.close ? "Open Now" : "Closed";
};

export const getAllGarages = async (location) => {
  let query = `
    SELECT g.*,
           MAX(go.UserID) AS OwnerID,
           MAX(ou.FullName) AS OwnerName,
           COUNT(DISTINCT r.ReviewID) as TotalReviews, 
           IFNULL(AVG(r.Rating), 0) as AverageRating,
           MIN(gs.Price) as MinPrice
    FROM garages g
    LEFT JOIN garageowners go ON g.GarageID = go.GarageID
    LEFT JOIN users ou ON go.UserID = ou.UserID
    LEFT JOIN reviews r ON g.GarageID = r.GarageID
    LEFT JOIN garageservices gs ON g.GarageID = gs.GarageID
  `;
  const params = [];

  if (location) {
    query += " WHERE g.Location LIKE ?";
    params.push(`%${location}%`);
  }

  query += " GROUP BY g.GarageID";

  const [rows] = await db.query(query, params);

  
  for (const garage of rows) {
    const [services] = await db.query(
      "SELECT ServiceName, Price FROM garageservices WHERE GarageID = ? ORDER BY ServiceName",
      [garage.GarageID]
    );
    garage.Services = services;
  }

  return rows.map((g) => ({
    ...g,
    Availability: getGarageAvailabilityLabel(g),
    WorkingHours: g.WorkingHours || JSON.stringify(defaultWorkingHours),
    Timezone: g.Timezone || "Africa/Addis_Ababa"
  }));
};

import { createChapaSubaccount } from "./paymentService.js";

export const addGarage = async (name, location, contact, bankCode, bankAccountNumber, bankAccountName, timezone = "Africa/Addis_Ababa", workingHours = defaultWorkingHours) => {
  let subaccountId = null;
  if (bankCode && bankAccountNumber && bankAccountName) {
    subaccountId = await createChapaSubaccount(name, bankAccountName, bankCode, bankAccountNumber);
  }

  console.log(`[addGarage] Creating garage: ${name}`);
  const [result] = await db.query(
    `INSERT INTO garages (Name, Location, ContactNumber, BankCode, BankAccountNumber, BankAccountName, ChapaSubaccountID, Timezone, WorkingHours)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, location, contact, bankCode, bankAccountNumber, bankAccountName, subaccountId, timezone, JSON.stringify(workingHours)]
  );
  console.log(`[addGarage] Created garage ID: ${result.insertId}`);
  return result.insertId;
};

export const fetchGarageById = async (id) => {
  const [rows] = await db.query(
    `SELECT g.*, go.UserID AS OwnerID, ou.FullName AS OwnerName
     FROM garages g
     LEFT JOIN garageowners go ON g.GarageID = go.GarageID
     LEFT JOIN users ou ON go.UserID = ou.UserID
     WHERE g.GarageID = ?`,
    [id]
  );
  if (rows.length === 0) {
    const error = new Error("Garage not found");
    error.status = 404;
    throw error;
  }
  const garage = rows[0];
  garage.WorkingHours = garage.WorkingHours || JSON.stringify(defaultWorkingHours);
  garage.Timezone = garage.Timezone || "Africa/Addis_Ababa";
  return garage;
};

export const modifyGarage = async (id, updateData, user) => {
  
  await fetchGarageById(id);

  if (user && user.role === "GarageManager") {
    const [managerRecord] = await db.query("SELECT GarageID FROM garagemanagers WHERE UserID = ?", [user.id]);
    if (!managerRecord.length || Number(managerRecord[0].GarageID) !== Number(id)) {
      const error = new Error("Garage Managers can only update their own garage details or the garage ID mismatch");
      error.status = 403;
      throw error;
    }
  }

  const updates = [];
  const values = [];

  
  if (updateData.bankCode || updateData.bankAccountNumber || updateData.bankAccountName) {
    
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
      
      const fieldMap = {
        name: 'Name',
        location: 'Location',
        contact: 'ContactNumber',
        status: 'Status',
        bankCode: 'BankCode',
        bankAccountNumber: 'BankAccountNumber',
        bankAccountName: 'BankAccountName',
        ChapaSubaccountID: 'ChapaSubaccountID',
        timezone: 'Timezone',
        workingHours: 'WorkingHours',
        emergencyDepositPercentage: 'EmergencyDepositPercentage'
      };

      if (fieldMap[key]) {
        updates.push(`${fieldMap[key]} = ?`);
        values.push(key === "workingHours" ? JSON.stringify(value) : value);
      }
    }
  }

  if (updates.length === 0) return;

  values.push(id);

  await db.query(
    `UPDATE garages SET ${updates.join(', ')} WHERE GarageID = ?`,
    values
  );
};

export const removeGarage = async (id) => {
  
  await fetchGarageById(id);

  await db.query("DELETE FROM garages WHERE GarageID = ?", [id]);
};
