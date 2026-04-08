import db from "../config/db.js";

export const getAllGarages = async (location) => {
  let query = `
    SELECT g.*, 
           COUNT(r.ReviewID) as TotalReviews, 
           IFNULL(AVG(r.Rating), 0) as AverageRating
    FROM Garages g
    LEFT JOIN Reviews r ON g.GarageID = r.GarageID
  `;
  const params = [];

  if (location) {
    query += " WHERE g.Location LIKE ?";
    params.push(`%${location}%`);
  }
  
  query += " GROUP BY g.GarageID";

  const [rows] = await db.query(query, params);
  return rows;
};

export const addGarage = async (name, location, contact) => {
  const [result] = await db.query(
    `INSERT INTO Garages (Name, Location, ContactNumber)
     VALUES (?, ?, ?)`,
    [name, location, contact]
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

  for (const [key, value] of Object.entries(updateData)) {
    if (value !== undefined) {
      // Mapping fields based on the input payload
      const fieldMap = {
        name: 'Name',
        location: 'Location',
        contact: 'ContactNumber',
        status: 'Status'
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
