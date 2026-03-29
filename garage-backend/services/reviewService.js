import db from "../config/db.js";

export const createReview = async (rating, comment, customerId, garageId) => {
  const [garage] = await db.query("SELECT 1 FROM Garages WHERE GarageID = ?", [garageId]);
  
  if (garage.length === 0) {
    const error = new Error("Garage not found");
    error.status = 404;
    throw error;
  }

  // Review Integrity: Check for at least one completed service at this garage
  const [completedService] = await db.query(
    `SELECT 1 FROM ServiceRequests sr 
     JOIN Vehicles v ON sr.VehicleID = v.VehicleID 
     WHERE v.CustomerID = ? AND sr.GarageID = ? AND sr.Status = 'Completed'`,
    [customerId, garageId]
  );

  if (completedService.length === 0) {
    const error = new Error("You can only review a garage after a completed service");
    error.status = 403;
    throw error;
  }

  await db.query(
    `INSERT INTO Reviews (Rating, Comment, CustomerID, GarageID)
     VALUES (?, ?, ?, ?)`,
    [rating, comment, customerId, garageId]
  );
};

export const fetchGarageReviews = async (garageId) => {
  const [rows] = await db.query(
    "SELECT * FROM Reviews WHERE GarageID = ? ORDER BY CreatedAt DESC",
    [garageId]
  );
  return rows;
};

export const fetchCustomerReviews = async (customerId) => {
  const [rows] = await db.query(
    "SELECT * FROM Reviews WHERE CustomerID = ? ORDER BY CreatedAt DESC",
    [customerId]
  );
  return rows;
};

export const removeReview = async (reviewId, customerId) => {
  const [rows] = await db.query("SELECT * FROM Reviews WHERE ReviewID = ? AND CustomerID = ?", [reviewId, customerId]);
  if (rows.length === 0) {
    const error = new Error("Review not found or unauthorized");
    error.status = 404;
    throw error;
  }
  await db.query("DELETE FROM Reviews WHERE ReviewID = ? AND CustomerID = ?", [reviewId, customerId]);
};
