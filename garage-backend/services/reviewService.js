import db from "../config/db.js";

export const createReview = async (rating, comment, customerId, garageId, requestId = null) => {
  const [garage] = await db.query("SELECT 1 FROM garages WHERE GarageID = ?", [garageId]);
  
  if (garage.length === 0) {
    const error = new Error("Garage not found");
    error.status = 404;
    throw error;
  }

  
  const [completedService] = await db.query(
    `SELECT 1 FROM servicerequests sr 
     JOIN vehicles v ON sr.VehicleID = v.VehicleID 
     WHERE v.CustomerID = ? AND sr.GarageID = ? AND sr.Status = 'Completed'`,
    [customerId, garageId]
  );

  if (completedService.length === 0) {
    const error = new Error("You can only review a garage after a completed service");
    error.status = 403;
    throw error;
  }

  
  if (requestId) {
    const [existing] = await db.query(
      "SELECT 1 FROM reviews WHERE RequestID = ?", [requestId]
    );
    if (existing.length > 0) {
      const error = new Error("This service request has already been reviewed");
      error.status = 400;
      throw error;
    }
  }

  await db.query(
    `INSERT INTO reviews (Rating, Comment, CustomerID, GarageID, RequestID)
     VALUES (?, ?, ?, ?, ?)`,
    [rating, comment, customerId, garageId, requestId]
  );
};

export const fetchGarageReviews = async (garageId) => {
  const [rows] = await db.query(
    "SELECT * FROM reviews WHERE GarageID = ? ORDER BY ReviewDate DESC",
    [garageId]
  );
  return rows;
};

export const fetchCustomerReviews = async (customerId) => {
  const [rows] = await db.query(
    "SELECT * FROM reviews WHERE CustomerID = ? ORDER BY ReviewDate DESC",
    [customerId]
  );
  return rows;
};

export const removeReview = async (reviewId, customerId) => {
  const [rows] = await db.query("SELECT * FROM reviews WHERE ReviewID = ? AND CustomerID = ?", [reviewId, customerId]);
  if (rows.length === 0) {
    const error = new Error("Review not found or unauthorized");
    error.status = 404;
    throw error;
  }
  await db.query("DELETE FROM reviews WHERE ReviewID = ? AND CustomerID = ?", [reviewId, customerId]);
};
