import db from "../config/db.js";
import bcrypt from "bcryptjs";

let garageOwnersTableChecked = false;
let mechanicSkillsTableChecked = false;

const ensureMechanicSkillsTable = async () => {
  if (mechanicSkillsTableChecked) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS mechanicskills (
      SkillID INT AUTO_INCREMENT PRIMARY KEY,
      MechanicID INT NOT NULL,
      SkillName VARCHAR(100) NOT NULL,
      FOREIGN KEY (MechanicID) REFERENCES users(UserID) ON DELETE CASCADE
    )
  `);
  mechanicSkillsTableChecked = true;
};

const ensureGarageOwnersTable = async () => {
  if (garageOwnersTableChecked) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS garageowners (
      UserID INT PRIMARY KEY,
      GarageID INT UNIQUE,
      FOREIGN KEY (UserID) REFERENCES users(UserID),
      FOREIGN KEY (GarageID) REFERENCES garages(GarageID)
    )
  `);
  garageOwnersTableChecked = true;
};
export const getUserProfile = async (userId) => {
  const [rows] = await db.query(
    "SELECT UserID, FullName, Email, PhoneNumber, Role, Status FROM users WHERE UserID = ?",
    [userId]
  );
  if (rows.length === 0) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const user = rows[0];

  
  if (user.Role === "GarageManager") {
    const [rows] = await db.query(
      `SELECT gm.GarageID, g.Name AS GarageName
       FROM garagemanagers gm
       LEFT JOIN garages g ON gm.GarageID = g.GarageID
       WHERE gm.UserID = ?`,
      [userId]
    );
    if (rows.length > 0) {
      user.GarageID = rows[0].GarageID;
      user.GarageName = rows[0].GarageName;
    }
  } else if (user.Role === "GarageOwner") {
    await ensureGarageOwnersTable();
    const [rows] = await db.query(
      `SELECT go.GarageID, g.Name AS GarageName
       FROM garageowners go
       LEFT JOIN garages g ON go.GarageID = g.GarageID
       WHERE go.UserID = ?`,
      [userId]
    );
    if (rows.length > 0) {
      user.GarageID = rows[0].GarageID;
      user.GarageName = rows[0].GarageName;
    }
  } else if (user.Role === "Accountant") {
    const [rows] = await db.query(
      `SELECT a.GarageID, g.Name AS GarageName
       FROM accountants a
       LEFT JOIN garages g ON a.GarageID = g.GarageID
       WHERE a.UserID = ?`,
      [userId]
    );
    if (rows.length > 0) {
      user.GarageID = rows[0].GarageID;
      user.GarageName = rows[0].GarageName;
    }
  }

  return user;
};

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
    await db.query(`UPDATE users SET ${updates.join(", ")} WHERE UserID = ?`, values);
  }
};

export const changePassword = async (userId, oldPassword, newPassword) => {
  const [rows] = await db.query("SELECT PasswordHash FROM users WHERE UserID = ?", [userId]);
  const user = rows[0];

  const isMatch = await bcrypt.compare(oldPassword, user.PasswordHash);
  if (!isMatch) {
    const error = new Error("Invalid current password");
    error.status = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db.query("UPDATE users SET PasswordHash = ? WHERE UserID = ?", [hashedPassword, userId]);
};


export const updateRole = async (userId, newRole) => {
  const [userRows] = await db.query("SELECT Role FROM users WHERE UserID = ?", [userId]);
  if (userRows.length === 0) throw new Error("User not found");
  const oldRole = userRows[0].Role;

  if (oldRole === newRole) return;

  await db.query("UPDATE users SET Role = ? WHERE UserID = ?", [newRole, userId]);

  
  await db.query("DELETE FROM customers WHERE UserID = ?", [userId]);
  await db.query("DELETE FROM superadmins WHERE UserID = ?", [userId]);
  await db.query("DELETE FROM accountants WHERE UserID = ?", [userId]);
  await db.query("DELETE FROM mechanics WHERE UserID = ?", [userId]);
  await db.query("DELETE FROM garageowners WHERE UserID = ?", [userId]);
  
  

  if (newRole === "Customer") {
    await db.query("INSERT IGNORE INTO customers (UserID) VALUES (?)", [userId]);
  } else if (newRole === "SuperAdmin") {
    await db.query("INSERT IGNORE INTO superadmins (UserID) VALUES (?)", [userId]);
  } else if (newRole === "GarageManager") {
    
    
    await db.query("INSERT IGNORE INTO garagemanagers (UserID) VALUES (?)", [userId]);
  } else if (newRole === "Accountant") {
    await db.query("INSERT IGNORE INTO accountants (UserID, GarageID) VALUES (?, NULL)", [userId]);
  } else if (newRole === "GarageOwner") {
    await db.query("INSERT IGNORE INTO garageowners (UserID, GarageID) VALUES (?, NULL)", [userId]);
  }
};

export const assignUserToGarage = async (userId, targetGarageId, assigner) => {
  const { id: assignerId, role: assignerRole } = assigner;

  
  if (assignerRole === "SuperAdmin") {
    const [targetUserRows] = await db.query("SELECT Role FROM users WHERE UserID = ?", [userId]);
    if (targetUserRows.length === 0) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }
    const targetRole = targetUserRows[0].Role;

    
    if (targetRole === "GarageOwner") {
      const [garage] = await db.query("SELECT GarageID FROM garages WHERE GarageID = ?", [targetGarageId]);
      if (garage.length === 0) throw new Error("Garage not found");
      await db.query("DELETE FROM garageowners WHERE UserID = ? OR GarageID = ?", [userId, targetGarageId]);
      await db.query("INSERT INTO garageowners (UserID, GarageID) VALUES (?, ?)", [userId, targetGarageId]);
      return;
    }

    
    if (targetRole === "GarageManager") {
      const [garage] = await db.query("SELECT ManagerID FROM garages WHERE GarageID = ?", [targetGarageId]);
      if (garage.length === 0) throw new Error("Garage not found");

      
      if (garage[0].ManagerID && Number(garage[0].ManagerID) !== Number(userId)) {
        console.log(`[assignUserToGarage] Garage ${targetGarageId} has another manager ${garage[0].ManagerID}. Unassigning current mapping.`);
        
        await db.query("UPDATE garages SET ManagerID = NULL WHERE GarageID = ?", [targetGarageId]);
        await db.query("DELETE FROM garagemanagers WHERE UserID = ? AND GarageID = ?", [garage[0].ManagerID, targetGarageId]);
      }

      
      const [oldMapping] = await db.query("SELECT GarageID FROM garagemanagers WHERE UserID = ?", [userId]);
      if (oldMapping.length > 0) {
        console.log(`[assignUserToGarage] User ${userId} was managing garage ${oldMapping[0].GarageID}. NULLing old reference.`);
        await db.query("UPDATE garages SET ManagerID = NULL WHERE GarageID = ?", [oldMapping[0].GarageID]);
        await db.query("DELETE FROM garagemanagers WHERE UserID = ?", [userId]);
      }

      
      await db.query("INSERT INTO garagemanagers (UserID, GarageID) VALUES (?, ?)", [userId, targetGarageId]);
      await db.query("UPDATE garages SET ManagerID = ? WHERE GarageID = ?", [userId, targetGarageId]);
      return;
    }
  }

  
  else if (assignerRole === "GarageManager") {
    
    const [managerRecord] = await db.query("SELECT GarageID FROM garagemanagers WHERE UserID = ?", [assignerId]);
    if (!managerRecord.length) throw new Error("Assigner is not linked to a garage");

    const assignerGarageId = managerRecord[0].GarageID;

    
    if (Number(targetGarageId) !== Number(assignerGarageId)) {
      const error = new Error("Garage Managers can only assign mechanics to their own garage");
      error.status = 403;
      throw error;
    }

    
    await db.query("DELETE FROM mechanics WHERE UserID = ?", [userId]);
    await db.query("INSERT INTO mechanics (UserID, GarageID) VALUES (?, ?)", [userId, assignerGarageId]);
    await db.query("UPDATE users SET Role = 'Mechanic' WHERE UserID = ?", [userId]);
  }

  else {
    const error = new Error("Unauthorized to assign users to garages");
    error.status = 403;
    throw error;
  }
};

export const unassignManagerFromGarage = async (garageId) => {
  await db.query("DELETE FROM garagemanagers WHERE GarageID = ?", [garageId]);
  await db.query("UPDATE garages SET ManagerID = NULL WHERE GarageID = ?", [garageId]);
};

export const getAllUsers = async () => {
  const [rows] = await db.query(
    "SELECT UserID, FullName, Email, PhoneNumber, Role, Status, CreatedAt FROM users ORDER BY CreatedAt DESC"
  );
  return rows;
};

export const getAllManagers = async () => {
  const [rows] = await db.query(`
    SELECT u.UserID, u.FullName, u.Email, u.PhoneNumber, u.Status, u.CreatedAt,
           g.GarageID, g.Name AS GarageName
    FROM users u
    LEFT JOIN garagemanagers gm ON u.UserID = gm.UserID
    LEFT JOIN garages g ON gm.GarageID = g.GarageID
    WHERE u.Role = 'GarageManager'
    ORDER BY u.CreatedAt DESC
  `);
  return rows;
};

export const getAllOwners = async () => {
  await ensureGarageOwnersTable();
  const [rows] = await db.query(`
    SELECT u.UserID, u.FullName, u.Email, u.PhoneNumber, u.Status, u.CreatedAt,
           go.GarageID, g.Name AS GarageName
    FROM users u
    LEFT JOIN garageowners go ON u.UserID = go.UserID
    LEFT JOIN garages g ON go.GarageID = g.GarageID
    WHERE u.Role = 'GarageOwner'
    ORDER BY u.CreatedAt DESC
  `);
  return rows;
};

export const getMechanicsByGarage = async (garageId) => {
  const [rows] = await db.query(
    `SELECT u.UserID, u.FullName, u.Email, u.PhoneNumber, u.Status 
     FROM users u 
     JOIN mechanics m ON u.UserID = m.UserID 
     WHERE m.GarageID = ? AND u.Status != 'Archived'`,
    [garageId]
  );

  
  if (rows.length > 0) {
    const mechanicIds = rows.map(r => r.UserID);
    const [skills] = await db.query(
      `SELECT MechanicID, SkillName FROM mechanicskills WHERE MechanicID IN (?)`,
      [mechanicIds]
    );

    
    const skillMap = {};
    skills.forEach(s => {
      if (!skillMap[s.MechanicID]) skillMap[s.MechanicID] = [];
      skillMap[s.MechanicID].push(s.SkillName);
    });

    rows.forEach(r => {
      r.Skills = skillMap[r.UserID] || [];
    });
  }

  return rows;
};

export const getAccountantsByGarage = async (garageId, user) => {
  if (user.role === "GarageManager") {
    const [managerRecord] = await db.query("SELECT GarageID FROM garagemanagers WHERE UserID = ?", [user.id]);
    if (!managerRecord.length || Number(managerRecord[0].GarageID) !== Number(garageId)) {
      const error = new Error("Garage Managers can only view accountants in their own garage");
      error.status = 403;
      throw error;
    }
  }

  const [rows] = await db.query(
    `SELECT u.UserID, u.FullName, u.Email, u.PhoneNumber, u.Status
     FROM users u
     JOIN accountants a ON u.UserID = a.UserID
     WHERE a.GarageID = ? AND u.Status != 'Archived'
     ORDER BY u.CreatedAt DESC`,
    [garageId]
  );

  return rows;
};

export const createGarageAccountant = async (garageId, accountantUserId, user) => {
  if (user.role !== "GarageManager") {
    const error = new Error("Only Garage Managers can create accountants for a garage");
    error.status = 403;
    throw error;
  }

  const [managerRecord] = await db.query("SELECT GarageID FROM garagemanagers WHERE UserID = ?", [user.id]);
  if (!managerRecord.length || Number(managerRecord[0].GarageID) !== Number(garageId)) {
    const error = new Error("Garage Managers can only create accountants in their own garage");
    error.status = 403;
    throw error;
  }

  await db.query("DELETE FROM mechanics WHERE UserID = ?", [accountantUserId]);
  await db.query("DELETE FROM accountants WHERE UserID = ?", [accountantUserId]);
  await db.query("INSERT INTO accountants (UserID, GarageID) VALUES (?, ?)", [accountantUserId, garageId]);
  await db.query("UPDATE users SET Role = 'Accountant' WHERE UserID = ?", [accountantUserId]);
};

export const changeMechanicStatus = async (garageId, mechanicId, newStatus, user) => {
  if (user.role === "GarageManager") {
    const [managerRecord] = await db.query("SELECT GarageID FROM garagemanagers WHERE UserID = ?", [user.id]);
    if (!managerRecord.length || Number(managerRecord[0].GarageID) !== Number(garageId)) {
      const error = new Error("Garage Managers can only modify mechanics in their own garage");
      error.status = 403;
      throw error;
    }
  }

  
  const [mechanic] = await db.query("SELECT * FROM mechanics WHERE UserID = ? AND GarageID = ?", [mechanicId, garageId]);
  if (!mechanic.length) {
    const error = new Error("Mechanic not found in this garage");
    error.status = 404;
    throw error;
  }

  
  await db.query("UPDATE users SET Status = ? WHERE UserID = ?", [newStatus, mechanicId]);
};

export const getMechanicSkills = async (mechanicId) => {
  await ensureMechanicSkillsTable();
  const [rows] = await db.query(
    "SELECT SkillName FROM mechanicskills WHERE MechanicID = ? ORDER BY SkillName",
    [mechanicId]
  );
  return rows.map(r => r.SkillName);
};

export const setMechanicSkills = async (garageId, mechanicId, skills, user) => {
  await ensureMechanicSkillsTable();
  
  const [mechanic] = await db.query("SELECT * FROM mechanics WHERE UserID = ? AND GarageID = ?", [mechanicId, garageId]);
  if (!mechanic.length) {
    const error = new Error("Mechanic not found in this garage");
    error.status = 404;
    throw error;
  }

  
  await db.query("DELETE FROM mechanicskills WHERE MechanicID = ?", [mechanicId]);

  if (skills && skills.length > 0) {
    const values = skills.map(skill => [mechanicId, skill.trim()]);
    await db.query(
      "INSERT INTO mechanicskills (MechanicID, SkillName) VALUES ?",
      [values]
    );
  }

  return skills;
};

