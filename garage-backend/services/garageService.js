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
    SELECT 
      g.*,
      MAX(go.UserID) AS OwnerID,
      MAX(ou.FullName) AS OwnerName,
      mu.FullName AS ManagerName,
      COUNT(DISTINCT r.ReviewID) as TotalReviews, 
      IFNULL(AVG(r.Rating), 0) as AverageRating,
      MIN(gs.Price) as MinPrice
    FROM garages g
    LEFT JOIN garageowners go ON g.GarageID = go.GarageID
    LEFT JOIN users ou ON go.UserID = ou.UserID
    LEFT JOIN users mu ON g.ManagerID = mu.UserID
    LEFT JOIN reviews r ON g.GarageID = r.GarageID
    LEFT JOIN garageservices gs ON g.GarageID = gs.GarageID
  `;
  const params = [];

  if (location) {
    query += " WHERE g.Location LIKE ? AND g.Status = 'Active'";
    params.push(`%${location}%`);
  } else {
    query += " WHERE g.Status = 'Active'";
  }

  // Ensure consistent filtering: Garage must have at least one service and one inventory item
  query += ` AND EXISTS (SELECT 1 FROM garageservices gs WHERE gs.GarageID = g.GarageID)
             AND EXISTS (SELECT 1 FROM inventory i WHERE i.GarageID = g.GarageID)`;

  query += " GROUP BY g.GarageID, mu.FullName";

  try {
    const [rows] = await db.query(query, params);

    for (const garage of rows) {
      const [services] = await db.query(
        "SELECT ServiceName, Price, IsEmergency FROM garageservices WHERE GarageID = ? ORDER BY ServiceName",
        [garage.GarageID]
      );
      garage.Services = services;
    }

    return rows.map((g) => ({
      ...g,
      Availability: getGarageAvailabilityLabel(g),
      WorkingHours: g.WorkingHours || JSON.stringify(defaultWorkingHours),
      Images: g.Images || JSON.stringify([]),
      LogoUrl: g.LogoUrl || "",
      Timezone: g.Timezone || "Africa/Addis_Ababa"
    }));
  } catch (error) {
    console.error("[getAllGarages] Query Error:", error.message);
    console.error("[getAllGarages] SQL State:", query);
    throw error;
  }
};

import { createChapaSubaccount } from "./paymentService.js";

export const addGarage = async (name, location, contact, bankCode, bankAccountNumber, bankAccountName, timezone = "Africa/Addis_Ababa", workingHours = defaultWorkingHours, emergencyMechanicSlots = 1) => {
  let subaccountId = null;
  if (bankCode && bankAccountNumber && bankAccountName) {
    subaccountId = await createChapaSubaccount(name, bankAccountName, bankCode, bankAccountNumber);
  }

  const [existing] = await db.query("SELECT Name FROM garages WHERE BankAccountNumber = ?", [bankAccountNumber]);
  if (existing.length > 0) {
    const error = new Error(`Bank account number is already in use by another garage: ${existing[0].Name}`);
    error.status = 409;
    throw error;
  }

  console.log(`[addGarage] Creating garage: ${name}`);
  const [result] = await db.query(
    `INSERT INTO garages(Name, Location, ContactNumber, BankCode, BankAccountNumber, BankAccountName, ChapaSubaccountID, Timezone, WorkingHours, EmergencyMechanicSlots, Status)
     VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Inactive')`,
    [name, location, contact, bankCode, bankAccountNumber, bankAccountName, subaccountId, timezone, JSON.stringify(workingHours), emergencyMechanicSlots]
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
     WHERE g.GarageID = ? `,
    [id]
  );
  if (rows.length === 0) {
    const error = new Error("Garage not found");
    error.status = 404;
    throw error;
  }
  const garage = rows[0];

  // Fetch services for this garage
  const [services] = await db.query(
    "SELECT ServiceName, Price, IsEmergency FROM garageservices WHERE GarageID = ? ORDER BY ServiceName",
    [garage.GarageID]
  );
  garage.Services = services;

  garage.WorkingHours = garage.WorkingHours || JSON.stringify(defaultWorkingHours);
  garage.Images = garage.Images || JSON.stringify([]);
  garage.LogoUrl = garage.LogoUrl || "";
  garage.Timezone = garage.Timezone || "Africa/Addis_Ababa";
  return garage;
};

export const modifyGarage = async (id, updateData, user) => {
  console.log(`[modifyGarage] ID: ${id}, UpdateData:`, JSON.stringify(updateData));

  await fetchGarageById(id);

  if (user && user.role === "GarageManager") {
    const [managerRecord] = await db.query("SELECT GarageID FROM garagemanagers WHERE UserID = ?", [user.id]);
    if (!managerRecord.length || Number(managerRecord[0].GarageID) !== Number(id)) {
      const error = new Error("Garage Managers can only update their own garage details or the garage ID mismatch");
      error.status = 403;
      throw error;
    }
  }

  if (updateData.bankCode || updateData.bankAccountNumber || updateData.bankAccountName) {
    const existingGarage = await fetchGarageById(id);
    const bCode = updateData.bankCode || existingGarage.BankCode;
    const bAcc = updateData.bankAccountNumber || existingGarage.BankAccountNumber;
    const bName = updateData.bankAccountName || existingGarage.BankAccountName;
    const gName = updateData.name || existingGarage.Name;

    if (bCode && bAcc && bName) {
      const [conflict] = await db.query("SELECT Name FROM garages WHERE BankAccountNumber = ? AND GarageID != ?", [bAcc, id]);
      if (conflict.length > 0) {
        const error = new Error(`Bank account number is already in use by another garage: ${conflict[0].Name}`);
        error.status = 409;
        throw error;
      }
      const newSubaccountId = await createChapaSubaccount(gName, bName, bCode, bAcc);
      updateData.ChapaSubaccountID = newSubaccountId;
    }
  }

  // Validate emergencyMechanicSlots does not exceed current mechanic count
  if (updateData.emergencyMechanicSlots !== undefined) {
    const requestedSlots = parseInt(updateData.emergencyMechanicSlots, 10);
    const [mechanicCountRows] = await db.query(
      "SELECT COUNT(*) as count FROM mechanics WHERE GarageID = ?",
      [id]
    );
    const totalMechanics = mechanicCountRows[0].count;
    if (requestedSlots > totalMechanics) {
      const error = new Error(
        `You cannot set more emergency slots than the total number of mechanics you have (${totalMechanics}).`
      );
      error.status = 400;
      throw error;
    }
  }

  const updates = {};
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
    emergencyDepositPercentage: 'EmergencyDepositPercentage',
    emergencyMechanicSlots: 'EmergencyMechanicSlots',
    images: 'Images',
    logoUrl: 'LogoUrl',
    latitude: 'Latitude',
    longitude: 'Longitude'
  };

  for (const [key, value] of Object.entries(updateData)) {
    if (value !== undefined && fieldMap[key]) {
      let val = value;
      if (key === "images" && Array.isArray(value)) {
        val = JSON.stringify(value.filter(url => url && url.trim() !== ""));
      } else if (key === "workingHours") {
        val = JSON.stringify(value);
      } else if (key === "emergencyMechanicSlots") {
        val = parseInt(value, 10);
      }
      updates[fieldMap[key]] = val;
    }
  }

  if (Object.keys(updates).length === 0) {
    console.log(`[modifyGarage] No fields to update for ID ${id}`);
    return;
  }

  console.log(`[modifyGarage] Updating garage ${id} with:`, JSON.stringify(updates));
  const [res] = await db.query(`UPDATE garages SET ? WHERE GarageID = ?`, [updates, id]);
  console.log(`[modifyGarage] DB Response:`, JSON.stringify(res));

  if (res.affectedRows === 0) {
    console.log(`[modifyGarage] WARNING: No rows affected for ID ${id}`);
    const error = new Error("No changes were made. Please ensure the garage exists and you are providing new information.");
    error.status = 404;
    throw error;
  }
  console.log(`[modifyGarage] Successfully updated garage ${id}`);
};

export const removeGarage = async (id) => {
  await fetchGarageById(id);
  await db.query("DELETE FROM garages WHERE GarageID = ?", [id]);
};

export const getGarageVehicles = async (garageId) => {
  const [rows] = await db.query(
    `SELECT DISTINCT 
        v.VehicleID, v.PlateNumber, v.Type, v.Model,
        u.UserID, u.FullName AS OwnerName, u.PhoneNumber AS OwnerPhone,
        MAX(sr.RequestDate) AS LastVisit,
        COUNT(sr.RequestID) AS TotalServices
     FROM vehicles v
     JOIN servicerequests sr ON v.VehicleID = sr.VehicleID
     JOIN users u ON v.CustomerID = u.UserID
     WHERE sr.GarageID = ?
     GROUP BY v.VehicleID, u.UserID
     ORDER BY LastVisit DESC`,
    [garageId]
  );
  return rows;
};
