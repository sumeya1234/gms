import db from "../config/db.js";

export const addComplaint = async (customerId, garageId, description) => {
  const [garage] = await db.query("SELECT 1 FROM Garages WHERE GarageID = ?", [garageId]);
  
  if (garage.length === 0) {
    const error = new Error("Garage not found");
    error.status = 404;
    throw error;
  }

  await db.query(
    `INSERT INTO Complaints (CustomerID, GarageID, Description)
     VALUES (?, ?, ?)`,
    [customerId, garageId, description]
  );
};

export const updateComplaintStatus = async (complaintId, status, resolvedBy) => {
  const [complaint] = await db.query("SELECT 1 FROM Complaints WHERE ComplaintID = ?", [complaintId]);
  if (complaint.length === 0) {
    const error = new Error("Complaint not found");
    error.status = 404;
    throw error;
  }

  await db.query(
    "UPDATE Complaints SET Status = ?, ResolvedBy = ? WHERE ComplaintID = ?",
    [status, resolvedBy, complaintId]
  );
};

export const fetchCustomerComplaints = async (customerId) => {
  const [rows] = await db.query(
    "SELECT * FROM Complaints WHERE CustomerID = ? ORDER BY CreatedAt DESC",
    [customerId]
  );
  return rows;
};
