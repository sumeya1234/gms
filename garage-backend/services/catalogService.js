import db from "../config/db.js";

export const createServiceItem = async (serviceName, price, garageId, isEmergency = false) => {
  await db.query(
    "INSERT INTO garageservices (ServiceName, Price, GarageID, IsEmergency) VALUES (?, ?, ?, ?)",
    [serviceName, price, garageId, isEmergency ? 1 : 0]
  );
};

export const updateServiceItem = async (serviceId, serviceName, price, isEmergency = false) => {
  const [result] = await db.query(
    "UPDATE garageservices SET ServiceName = ?, Price = ?, IsEmergency = ? WHERE ServiceID = ?",
    [serviceName, price, isEmergency ? 1 : 0, serviceId]
  );
  if (result.affectedRows === 0) {
    const error = new Error("Service not found");
    error.status = 404;
    throw error;
  }
};

export const deleteServiceItem = async (serviceId) => {
  const [result] = await db.query("DELETE FROM garageservices WHERE ServiceID = ?", [serviceId]);
  if (result.affectedRows === 0) {
    const error = new Error("Service not found");
    error.status = 404;
    throw error;
  }
};

export const fetchGarageServices = async (garageId) => {
  const [rows] = await db.query("SELECT * FROM garageservices WHERE GarageID = ?", [garageId]);
  return rows;
};
