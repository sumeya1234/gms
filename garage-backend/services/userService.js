import db from "../config/db.js";
import bcrypt from "bcryptjs";

export const updateProfile = async (userId, data) => {
  const { fullName, phone } = data;
  const updates = [];
  const values = [];

  if (fullName) {
    updates.push("FullName = ?");
    values.push(fullName);
  }
  if (phone) {
    updates.push("PhoneNumber = ?");
    values.push(phone);
  }

  if (updates.length > 0) {
    values.push(userId);
    await db.query(`UPDATE Users SET ${updates.join(", ")} WHERE UserID = ?`, values);
  }
};

export const changePassword = async (userId, oldPassword, newPassword) => {
  const [rows] = await db.query("SELECT PasswordHash FROM Users WHERE UserID = ?", [userId]);
  const user = rows[0];

  const isMatch = await bcrypt.compare(oldPassword, user.PasswordHash);
  if (!isMatch) {
    const error = new Error("Invalid current password");
    error.status = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db.query("UPDATE Users SET PasswordHash = ? WHERE UserID = ?", [hashedPassword, userId]);
};

export const updateRole = async (userId, newRole) => {
  const [user] = await db.query("SELECT Role FROM Users WHERE UserID = ?", [userId]);
  if (user.length === 0) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  await db.query("UPDATE Users SET Role = ? WHERE UserID = ?", [newRole, userId]);

  // If user becomes customer, ensure they are in the Customers table
  if (newRole === "Customer") {
    await db.query("INSERT IGNORE INTO Customers (UserID) VALUES (?)", [userId]);
  }
};

export const assignUserToGarage = async (userId, targetGarageId, assigner) => {
  const { id: assignerId, role: assignerRole } = assigner;

  // 1. SuperAdmin Rule: Only assign GarageManagers
  if (assignerRole === "SuperAdmin") {
    // Check if garage exists
    const [garage] = await db.query("SELECT GarageID FROM Garages WHERE GarageID = ?", [targetGarageId]);
    if (garage.length === 0) throw new Error("Garage not found");

    // Assign Manager logic
    await db.query("DELETE FROM GarageManagers WHERE UserID = ? OR GarageID = ?", [userId, targetGarageId]);
    await db.query("INSERT INTO GarageManagers (UserID, GarageID) VALUES (?, ?)", [userId, targetGarageId]);
    await db.query("UPDATE Garages SET ManagerID = ? WHERE GarageID = ?", [userId, targetGarageId]);
    await db.query("UPDATE Users SET Role = 'GarageManager' WHERE UserID = ?", [userId]);
  } 
  
  // 2. GarageManager Rule: Only assign Mechanics to OWN garage
  else if (assignerRole === "GarageManager") {
    // Fetch assigner's garage
    const [managerRecord] = await db.query("SELECT GarageID FROM GarageManagers WHERE UserID = ?", [assignerId]);
    if (!managerRecord.length) throw new Error("Assigner is not linked to a garage");
    
    const assignerGarageId = managerRecord[0].GarageID;

    // A manager can only assign mechanics, and only to their OWN garage
    if (targetGarageId !== assignerGarageId) {
      const error = new Error("Garage Managers can only assign mechanics to their own garage");
      error.status = 403;
      throw error;
    }

    // Assign Mechanic logic
    await db.query("DELETE FROM Mechanics WHERE UserID = ?", [userId]);
    await db.query("INSERT INTO Mechanics (UserID, GarageID) VALUES (?, ?)", [userId, assignerGarageId]);
    await db.query("UPDATE Users SET Role = 'Mechanic' WHERE UserID = ?", [userId]);
  } 
  
  else {
    const error = new Error("Unauthorized to assign users to garages");
    error.status = 403;
    throw error;
  }
};
