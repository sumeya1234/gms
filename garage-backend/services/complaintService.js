import db from "../config/db.js";

export const addComplaint = async (customerId, garageId, description, isEscalated = false) => {
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
    const error = new Error("You can only file a complaint against a garage after a completed service");
    error.status = 403;
    throw error;
  }

  await db.query(
    `INSERT INTO complaints (CustomerID, GarageID, Description, IsEscalated)
     VALUES (?, ?, ?, ?)`,
    [customerId, garageId, description, isEscalated ? 1 : 0]
  );
};

export const updateComplaintStatus = async (complaintId, status, resolvedBy) => {
  const [complaint] = await db.query("SELECT 1 FROM complaints WHERE ComplaintID = ?", [complaintId]);
  if (complaint.length === 0) {
    const error = new Error("Complaint not found");
    error.status = 404;
    throw error;
  }

  await db.query(
    "UPDATE complaints SET Status = ?, ResolvedBy = ? WHERE ComplaintID = ?",
    [status, resolvedBy, complaintId]
  );
};

export const fetchCustomerComplaints = async (customerId) => {
  const [rows] = await db.query(
    "SELECT * FROM complaints WHERE CustomerID = ? ORDER BY CreatedAt DESC",
    [customerId]
  );
  return rows;
};

export const fetchGarageComplaints = async (garageId) => {
  const [rows] = await db.query(
    `SELECT c.*, u.FullName as CustomerName, u.Email as CustomerEmail 
     FROM complaints c 
     JOIN users u ON c.CustomerID = u.UserID 
     WHERE c.GarageID = ? AND c.IsEscalated = 0 ORDER BY c.CreatedAt DESC`,
    [garageId]
  );
  return rows;
};

export const fetchAllComplaints = async () => {
  const [rows] = await db.query(
    `SELECT c.*, u.FullName as CustomerName, u.Email as CustomerEmail, g.Name as GarageName
     FROM complaints c
     JOIN users u ON c.CustomerID = u.UserID
     LEFT JOIN garages g ON c.GarageID = g.GarageID
     ORDER BY c.CreatedAt DESC`
  );
  return rows;
};

export const addComplaintMessage = async (complaintId, senderId, message) => {
  
  const [complaint] = await db.query("SELECT 1 FROM complaints WHERE ComplaintID = ?", [complaintId]);
  if (complaint.length === 0) {
    const error = new Error("Complaint not found");
    error.status = 404;
    throw error;
  }

  await db.query(
    "INSERT INTO complaintmessages (ComplaintID, SenderID, Message) VALUES (?, ?, ?)",
    [complaintId, senderId, message]
  );
};

export const fetchComplaintMessages = async (complaintId) => {
  const [rows] = await db.query(
    `SELECT cm.*, u.FullName as SenderName, u.Role as SenderRole 
     FROM complaintmessages cm
     JOIN users u ON cm.SenderID = u.UserID
     WHERE cm.ComplaintID = ? 
     ORDER BY cm.CreatedAt ASC`,
    [complaintId]
  );
  return rows;
};
