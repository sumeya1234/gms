import db from "../config/db.js";

export const getAllGarages = async (location) => {
  let query = "SELECT * FROM Garages";
  const params = [];

  if (location) {
    query += " WHERE Location LIKE ?";
    params.push(`%${location}%`);
  }

  const [rows] = await db.query(query, params);
  return rows;
};

export const addGarage = async (name, location, contact) => {
  await db.query(
    `INSERT INTO Garages (Name, Location, ContactNumber)
     VALUES (?, ?, ?)`,
    [name, location, contact]
  );
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

export const modifyGarage = async (id, updateData) => {
  // Check if garage exists
  await fetchGarageById(id);

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
