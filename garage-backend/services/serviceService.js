import db from "../config/db.js";

export const createServiceRequest = async (serviceType, vehicleId, garageId, description, isEmergency) => {
  const [garage] = await db.query("SELECT 1 FROM Garages WHERE GarageID = ?", [garageId]);
  if (garage.length === 0) {
    const error = new Error("Garage not found");
    error.status = 404;
    throw error;
  }

  const [vehicle] = await db.query("SELECT 1 FROM Vehicles WHERE VehicleID = ?", [vehicleId]);
  if (vehicle.length === 0) {
    const error = new Error("Vehicle not found");
    error.status = 404;
    throw error;
  }

  await db.query(
    `INSERT INTO ServiceRequests (ServiceType, VehicleID, GarageID, Description, IsEmergency)
     VALUES (?, ?, ?, ?, ?)`,
    [serviceType, vehicleId, garageId, description || '', isEmergency ? 1 : 0]
  );
};

export const assignServiceMechanic = async (requestId, mechanicId) => {
  const [mechanic] = await db.query(
    "SELECT * FROM Mechanics WHERE UserID = ?",
    [mechanicId]
  );

  if (mechanic.length === 0) {
    const error = new Error("Mechanic not found");
    error.status = 404;
    throw error;
  }

  await db.query(
    `INSERT INTO MechanicAssignments (RequestID, MechanicID)
     VALUES (?, ?)`,
    [requestId, mechanicId]
  );

  // Notify Mechanic
  await createNotification(
    mechanicId,
    "New Job Assignment",
    `You have been assigned to service request #${requestId}.`
  );
};

import { createNotification } from "./notificationService.js";

export const updateServiceStatus = async (requestId, status, admin, rejectionReason = "") => {
  const [request] = await db.query("SELECT * FROM ServiceRequests WHERE RequestID = ?", [requestId]);
  
  if (request.length === 0) {
    const error = new Error("Service request not found");
    error.status = 404;
    throw error;
  }

  // Tenant Isolation
  if (admin.role === "GarageManager") {
    const [manager] = await db.query(
      "SELECT 1 FROM GarageManagers WHERE UserID = ? AND GarageID = ?",
      [admin.id, request[0].GarageID]
    );
    if (manager.length === 0) {
      const error = new Error("Unauthorized: You do not manage the garage for this request");
      error.status = 403;
      throw error;
    }
  }

  const validStatuses = ["Pending", "Approved", "Rejected", "InProgress", "Completed"];
  if (!validStatuses.includes(status)) {
    const error = new Error("Invalid status");
    error.status = 400;
    throw error;
  }

  await db.query(
    `UPDATE ServiceRequests SET Status = ?, RejectionReason = ? WHERE RequestID = ?`,
    [status, rejectionReason, requestId]
  );

  // 5. Notify Customer
  const [vehicle] = await db.query("SELECT CustomerID FROM Vehicles WHERE VehicleID = ?", [request[0].VehicleID]);
  if (vehicle.length > 0) {
    let title = "Service Update";
    let message = `Your service request for ${request[0].ServiceType} has been marked as ${status}.`;
    let type = status.toUpperCase();

    if (status === "Approved") {
      title = "Request Approved";
      message = "Your car has been approved for service";
    } else if (status === "Rejected") {
      title = "Request Rejected";
      message = rejectionReason || "Your request was rejected.";
    } else if (status === "InProgress") {
      message = "Repair started";
      type = "REPAIR_STARTED";
    } else if (status === "Completed") {
      title = "Service Ready";
      message = "Your car is ready for pickup";
      type = "CAR_READY";
    }

    await createNotification(vehicle[0].CustomerID, title, message, type);
  }
};

export const updateAssignmentStatus = async (assignmentId, status, userId) => {
  const [assignment] = await db.query(
    "SELECT * FROM MechanicAssignments WHERE AssignmentID = ? AND MechanicID = ?",
    [assignmentId, userId]
  );

  if (assignment.length === 0) {
    const error = new Error("Assignment not found or unauthorized");
    error.status = 404;
    throw error;
  }

  await db.query(
    "UPDATE MechanicAssignments SET Status = ? WHERE AssignmentID = ?",
    [status, assignmentId]
  );
};

export const completeServiceRequest = async (requestId, itemsUsed = []) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Check if service request exists
    const [service] = await connection.query("SELECT * FROM ServiceRequests WHERE RequestID = ?", [requestId]);
    if (service.length === 0) {
      const error = new Error("Service request not found");
      error.status = 404;
      throw error;
    }

    // 2. Check for completed payment
    const [payment] = await connection.query(
      "SELECT PaymentStatus FROM Payments WHERE RequestID = ?",
      [requestId]
    );

    if (payment.length === 0 || payment[0].PaymentStatus !== "Completed") {
      const error = new Error("Cannot complete service without completed payment");
      error.status = 400;
      throw error;
    }

    // 3. Handle stock depletion
    for (const item of itemsUsed) {
      const { itemId, quantity } = item;
      
      // Check stock availability
      const [inventory] = await connection.query(
        "SELECT Quantity FROM Inventory WHERE ItemID = ? FOR UPDATE",
        [itemId]
      );

      if (inventory.length === 0 || inventory[0].Quantity < quantity) {
        throw new Error(`Insufficient stock for item ID ${itemId}`);
      }

      // Deduct stock
      await connection.query(
        "UPDATE Inventory SET Quantity = Quantity - ? WHERE ItemID = ?",
        [quantity, itemId]
      );

      // Record in ServiceItems
      await connection.query(
        "INSERT INTO ServiceItems (RequestID, ItemID, QuantityUsed) VALUES (?, ?, ?)",
        [requestId, itemId, quantity]
      );
    }

    // 4. Update status to 'Completed'
    await connection.query("UPDATE ServiceRequests SET Status = 'Completed' WHERE RequestID = ?", [requestId]);
    
    await connection.commit();

    // 5. Notify Customer
    const [vehicle] = await connection.query("SELECT CustomerID FROM Vehicles WHERE VehicleID = ?", [service[0].VehicleID]);
    if (vehicle.length > 0) {
      await createNotification(
        vehicle[0].CustomerID,
        "Service Ready",
        "Your vehicle service has been completed and is ready for pickup!"
      );
    }
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const fetchCustomerRequests = async (customerId) => {
  const [rows] = await db.query(
    "SELECT sr.* FROM ServiceRequests sr JOIN Vehicles v ON sr.VehicleID = v.VehicleID WHERE v.CustomerID = ?",
    [customerId]
  );
  return rows;
};

export const fetchGarageRequests = async (garageId, status, admin) => {
  // Tenant Isolation
  if (admin.role === "GarageManager") {
    const [manager] = await db.query(
      "SELECT 1 FROM GarageManagers WHERE UserID = ? AND GarageID = ?",
      [admin.id, garageId]
    );
    if (manager.length === 0) {
      const error = new Error("Unauthorized: You do not manage this garage");
      error.status = 403;
      throw error;
    }
  }

  let query = "SELECT * FROM ServiceRequests WHERE GarageID = ?";
  const params = [garageId];

  if (status) {
    query += " AND Status = ?";
    params.push(status);
  }

  const [rows] = await db.query(query, params);
  return rows;
};

export const fetchRequestById = async (requestId) => {
  const [rows] = await db.query("SELECT * FROM ServiceRequests WHERE RequestID = ?", [requestId]);
  if (rows.length === 0) {
    const error = new Error("Service request not found");
    error.status = 404;
    throw error;
  }
  return rows[0];
};
