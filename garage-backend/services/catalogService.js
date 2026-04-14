import db from "../config/db.js";

export const createServiceItem = async (serviceName, price, garageId) => {
  await db.query(
    "INSERT INTO GarageServices (ServiceName, Price, GarageID) VALUES (?, ?, ?)",
    [serviceName, price, garageId]
  );
};

export const updateServiceItem = async (serviceId, serviceName, price) => {
  const [result] = await db.query(
    "UPDATE GarageServices SET ServiceName = ?, Price = ? WHERE ServiceID = ?",
    [serviceName, price, serviceId]
  );
  if (result.affectedRows === 0) {
    const error = new Error("Service not found");
    error.status = 404;
    throw error;
  }
};

export const deleteServiceItem = async (serviceId) => {
  const [result] = await db.query("DELETE FROM GarageServices WHERE ServiceID = ?", [serviceId]);
  if (result.affectedRows === 0) {
    const error = new Error("Service not found");
    error.status = 404;
    throw error;
  }
};

export const fetchGarageServices = async (garageId) => {
  const [rows] = await db.query("SELECT * FROM GarageServices WHERE GarageID = ?", [garageId]);
  return rows;
};
