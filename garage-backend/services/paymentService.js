import db from "../config/db.js";

export const createPayment = async (requestId, amount, method) => {
  const [service] = await db.query("SELECT 1 FROM ServiceRequests WHERE RequestID = ?", [requestId]);
  
  if (service.length === 0) {
    const error = new Error("Service request not found");
    error.status = 404;
    throw error;
  }

  await db.query(
    `INSERT INTO Payments (RequestID, Amount, PaymentMethod, PaymentStatus, PaymentDate)
     VALUES (?, ?, ?, 'Completed', NOW())`,
    [requestId, amount, method]
  );
};
