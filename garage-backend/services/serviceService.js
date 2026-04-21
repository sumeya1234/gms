import db from "../config/db.js";
import { createNotification } from "./notificationService.js";

export const createServiceRequest = async (serviceType, vehicleId, garageId, description, isEmergency, bookingDate, dropOffTime) => {
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

  const calculateDuration = (types) => {
    let duration = 0;
    const typeStr = (types || '').toLowerCase();
    if (typeStr.includes('oil change')) duration += 0.5;
    if (typeStr.includes('diagnostics')) duration += 1.5;
    if (typeStr.includes('tires')) duration += 1.0;
    if (typeStr.includes('battery')) duration += 0.5;
    if (typeStr.includes('electrical')) duration += 2.0;
    if (typeStr.includes('repair')) duration += 3.0; // General repair
    if (typeStr.includes('towing')) duration += 2.0;
    return duration > 0 ? duration : 1.0; 
  };
  const estimatedDuration = calculateDuration(serviceType);

  if (bookingDate) {
    const availability = await fetchGarageAvailability(garageId, bookingDate);
    if (availability.isFullyBooked) {
      const error = new Error("Garage daily limit exceeded. Please pick another date.");
      error.status = 400;
      throw error;
    }
    if (dropOffTime) {
      const formattedDropOff = dropOffTime.slice(0, 5); // "HH:mm"
      const isCongested = availability.congestedTimes.some(t => {
        const timeStr = typeof t === 'string' ? t.slice(0, 5) : t;
        return timeStr === formattedDropOff;
      });
      if (isCongested) {
        const error = new Error("This drop-off time is congested. Please select another time.");
        error.status = 400;
        throw error;
      }
    }
  }

  await db.query(
    `INSERT INTO ServiceRequests (ServiceType, VehicleID, GarageID, Description, IsEmergency, BookingDate, DropOffTime, EstimatedDuration)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [serviceType, vehicleId, garageId, description || '', isEmergency ? 1 : 0, bookingDate || null, dropOffTime || null, estimatedDuration]
  );

  // Notify Garage Manager
  try {
    const [garageInfo] = await db.query("SELECT ManagerID, GarageName FROM Garages WHERE GarageID = ?", [garageId]);
    if (garageInfo.length > 0 && garageInfo[0].ManagerID) {
      await createNotification(
        garageInfo[0].ManagerID,
        "New Service Request",
        `A new ${isEmergency ? "EMERGENCY " : ""}request for ${serviceType} has been received at ${garageInfo[0].GarageName}.`,
        "NEW_REQUEST"
      );
    }
  } catch (err) {
    console.error("Failed to notify manager of new request:", err.message);
  }
};

export const assignServiceMechanic = async (requestId, mechanicId) => {
  // Check request exists and is in a valid state for assignment
  const [request] = await db.query("SELECT * FROM ServiceRequests WHERE RequestID = ?", [requestId]);
  if (request.length === 0) {
    const error = new Error("Service request not found");
    error.status = 404;
    throw error;
  }

  // Issue 6: Only allow assignment after Approval
  if (request[0].Status !== 'Approved' && request[0].Status !== 'InProgress') {
    const error = new Error(`Cannot assign mechanic to a '${request[0].Status}' request. The request must be Approved first.`);
    error.status = 400;
    throw error;
  }

  const [mechanic] = await db.query(
    "SELECT * FROM Mechanics WHERE UserID = ?",
    [mechanicId]
  );

  if (mechanic.length === 0) {
    const error = new Error("Mechanic not found");
    error.status = 404;
    throw error;
  }

  // Delete previous assignments for this request to cleanly re-assign
  await db.query("DELETE FROM MechanicAssignments WHERE RequestID = ?", [requestId]);

  await db.query(
    `INSERT INTO MechanicAssignments (RequestID, MechanicID)
     VALUES (?, ?)`,
    [requestId, mechanicId]
  );

  // Notify Mechanic
  await createNotification(
    mechanicId,
    "New Job Assignment",
    `You have been assigned to service request #${requestId}.`,
    "ASSIGNMENT"
  );
};

export const updateServiceStatus = async (requestId, status, admin, rejectionReason = "") => {
  const [request] = await db.query("SELECT * FROM ServiceRequests WHERE RequestID = ?", [requestId]);
  
  if (request.length === 0) {
    const error = new Error("Service request not found");
    error.status = 404;
    throw error;
  }

  // Prevent changing terminal statuses
  if (request[0].Status === 'Rejected' || request[0].Status === 'Completed') {
    const error = new Error(`Cannot update status of a ${request[0].Status} service request`);
    error.status = 400;
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

  // Issue 6: Enforce valid status transitions
  const currentStatus = request[0].Status;
  
  if (currentStatus === status) {
    return; // Ignore if status is not changing
  }

  const allowedTransitions = {
    'Pending': ['Approved', 'Rejected'],
    'Approved': ['InProgress', 'Completed', 'Rejected'],
    'InProgress': ['Completed']
  };
  const allowed = allowedTransitions[currentStatus];
  if (allowed && !allowed.includes(status)) {
    const error = new Error(`Cannot transition from '${currentStatus}' to '${status}'. Allowed: ${allowed.join(', ')}`);
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

  const requestId = assignment[0].RequestID;

  let updateAssignmentQuery = "UPDATE MechanicAssignments SET Status = ? WHERE AssignmentID = ?";
  if (status === 'Completed') {
    updateAssignmentQuery = "UPDATE MechanicAssignments SET Status = ?, CompletionDate = CURRENT_TIMESTAMP WHERE AssignmentID = ?";
  }
  await db.query(updateAssignmentQuery, [status, assignmentId]);

  // Sync the status upward to ServiceRequests so the customer and manager see it
  await db.query("UPDATE ServiceRequests SET Status = ? WHERE RequestID = ?", [status, requestId]);

  // Send notifications to the Customer
  const [vehicle] = await db.query(
    "SELECT v.CustomerID FROM ServiceRequests sr JOIN Vehicles v ON sr.VehicleID = v.VehicleID WHERE sr.RequestID = ?",
    [requestId]
  );

  if (vehicle.length > 0) {
    const customerId = vehicle[0].CustomerID;
    if (status === 'InProgress') {
      await createNotification(
        customerId,
        "Repair Started",
        "Your vehicle is now being worked on by the assigned mechanic.",
        "REPAIR_STARTED"
      );
    } else if (status === 'Completed') {
      await createNotification(
        customerId,
        "Service Ready",
        "Your vehicle service has been completed and is ready for pickup!",
        "CAR_READY"
      );
    }
  }
};

export const documentAssignmentItems = async (assignmentId, itemsUsed, mechanicId) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const [assignment] = await connection.query(
      "SELECT RequestID FROM MechanicAssignments WHERE AssignmentID = ? AND MechanicID = ?",
      [assignmentId, mechanicId]
    );

    if (assignment.length === 0) {
      const error = new Error("Assignment not found or unauthorized");
      error.status = 404;
      throw error;
    }

    const requestId = assignment[0].RequestID;

    for (const item of itemsUsed) {
      const { itemId, quantity } = item;
      
      const [inventory] = await connection.query(
        "SELECT Quantity, ItemName, GarageID FROM Inventory WHERE ItemID = ? FOR UPDATE",
        [itemId]
      );

      if (inventory.length === 0 || inventory[0].Quantity < quantity) {
        throw new Error(`Insufficient stock for item ID ${itemId}`);
      }

      const newQuantity = inventory[0].Quantity - quantity;

      await connection.query(
        "UPDATE Inventory SET Quantity = ? WHERE ItemID = ?",
        [newQuantity, itemId]
      );

      await connection.query(
        "INSERT INTO ServiceItems (RequestID, ItemID, QuantityUsed) VALUES (?, ?, ?)",
        [requestId, itemId, quantity]
      );

      // Low Stock Alert
      if (newQuantity < 10) {
        const [garage] = await connection.query("SELECT ManagerID FROM Garages WHERE GarageID = ?", [inventory[0].GarageID]);
        if (garage.length > 0 && garage[0].ManagerID) {
          await createNotification(
            garage[0].ManagerID,
            "Low Stock Alert",
            `${inventory[0].ItemName} is running low (${newQuantity} remaining). Please restock soon.`,
            "LOW_STOCK"
          );
        }
      }
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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

    if (service[0].Status === 'Rejected' || service[0].Status === 'Completed') {
      const error = new Error(`Cannot complete a ${service[0].Status} service request`);
      error.status = 400;
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
        "SELECT Quantity, ItemName, GarageID FROM Inventory WHERE ItemID = ? FOR UPDATE",
        [itemId]
      );

      if (inventory.length === 0 || inventory[0].Quantity < quantity) {
        throw new Error(`Insufficient stock for item ID ${itemId}`);
      }

      const newQuantity = inventory[0].Quantity - quantity;

      // Deduct stock
      await connection.query(
        "UPDATE Inventory SET Quantity = ? WHERE ItemID = ?",
        [newQuantity, itemId]
      );

      // Record in ServiceItems
      await connection.query(
        "INSERT INTO ServiceItems (RequestID, ItemID, QuantityUsed) VALUES (?, ?, ?)",
        [requestId, itemId, quantity]
      );

      // Low Stock Alert
      if (newQuantity < 10) {
        const [garage] = await connection.query("SELECT ManagerID FROM Garages WHERE GarageID = ?", [inventory[0].GarageID]);
        if (garage.length > 0 && garage[0].ManagerID) {
          await createNotification(
            garage[0].ManagerID,
            "Low Stock Alert",
            `${inventory[0].ItemName} is running low (${newQuantity} remaining). Please restock soon.`,
            "LOW_STOCK"
          );
        }
      }
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
        "Your vehicle service has been completed and is ready for pickup!",
        "CAR_READY"
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
    `SELECT 
        sr.*,
        g.Name as GarageName,
        p.PaymentStatus,
        p.PaymentMethod,
        p.Amount as TotalPaid,
        p.TransactionRef,
        u.FullName as AssignedMechanicName,
        u.PhoneNumber as AssignedMechanicPhone,
        (SELECT COALESCE(SUM(gs.Price), 0) 
         FROM GarageServices gs 
         WHERE gs.GarageID = sr.GarageID 
         AND FIND_IN_SET(gs.ServiceName, REPLACE(sr.ServiceType, ', ', ','))) as BaseServicePrice,
        (SELECT COALESCE(SUM(si.QuantityUsed * i.UnitPrice), 0) 
         FROM ServiceItems si 
         JOIN Inventory i ON si.ItemID = i.ItemID 
         WHERE si.RequestID = sr.RequestID) as PartsCost,
        (SELECT COUNT(*) FROM Reviews r 
         WHERE r.RequestID = sr.RequestID) as HasReviewed
     FROM ServiceRequests sr
     JOIN Vehicles v ON sr.VehicleID = v.VehicleID
     LEFT JOIN Garages g ON sr.GarageID = g.GarageID
     LEFT JOIN Payments p ON sr.RequestID = p.RequestID
     LEFT JOIN (
        SELECT ma1.RequestID, ma1.MechanicID 
        FROM MechanicAssignments ma1
        JOIN (
           SELECT RequestID, MAX(AssignmentID) as MaxAssignmentID
           FROM MechanicAssignments
           GROUP BY RequestID
        ) ma2 ON ma1.AssignmentID = ma2.MaxAssignmentID
     ) ma ON sr.RequestID = ma.RequestID
     LEFT JOIN Users u ON ma.MechanicID = u.UserID
     WHERE v.CustomerID = ? AND sr.CustomerHidden = 0
     ORDER BY sr.RequestDate DESC`,
    [customerId]
  );
  return rows;
};

export const hideCustomerRequest = async (requestId, customerId) => {
  // Verify the request belongs to this customer
  const [rows] = await db.query(
    `SELECT sr.RequestID FROM ServiceRequests sr 
     JOIN Vehicles v ON sr.VehicleID = v.VehicleID 
     WHERE sr.RequestID = ? AND v.CustomerID = ?`,
    [requestId, customerId]
  );
  if (rows.length === 0) {
    const error = new Error("Request not found or unauthorized");
    error.status = 404;
    throw error;
  }
  await db.query("UPDATE ServiceRequests SET CustomerHidden = 1 WHERE RequestID = ?", [requestId]);
};

export const fetchGarageRequests = async (garageId, { status, page = 1, limit = 10, search = '', date = '' }, admin) => {
  const offset = (page - 1) * limit;

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

  let baseQuery = `
    FROM ServiceRequests sr
    LEFT JOIN (
      SELECT ma1.RequestID, ma1.MechanicID 
      FROM MechanicAssignments ma1
      JOIN (
         SELECT RequestID, MAX(AssignmentID) as MaxAssignmentID
         FROM MechanicAssignments
         GROUP BY RequestID
      ) ma2 ON ma1.AssignmentID = ma2.MaxAssignmentID
    ) ma ON sr.RequestID = ma.RequestID
    LEFT JOIN Users u ON ma.MechanicID = u.UserID
    LEFT JOIN Payments p ON sr.RequestID = p.RequestID
    WHERE sr.GarageID = ?
  `;
  
  const params = [garageId];

  if (status && status !== 'All') {
    baseQuery += " AND sr.Status = ?";
    params.push(status);
  }

  if (search) {
    baseQuery += " AND (sr.RequestID = ? OR sr.ServiceType LIKE ?)";
    params.push(search, `%${search}%`);
  }

  if (date) {
    if (date === 'today') {
      baseQuery += " AND DATE(sr.BookingDate) = CURDATE()";
    } else if (date === 'week') {
      baseQuery += " AND YEARWEEK(sr.BookingDate, 1) = YEARWEEK(CURDATE(), 1)";
    } else {
      baseQuery += " AND DATE(sr.BookingDate) = ?";
      params.push(date);
    }
  }

  // Count query
  const [countResult] = await db.query(`SELECT COUNT(*) as total ${baseQuery}`, params);
  const total = countResult[0].total;

  // Data query
  let dataQuery = `
    SELECT sr.*, u.FullName as AssignedMechanicName, ma.MechanicID as AssignedMechanicID,
           p.PaymentStatus, p.PaymentMethod, p.Amount as PaymentAmount, p.TransactionRef
    ${baseQuery}
    ORDER BY sr.IsEmergency DESC, sr.RequestDate DESC
    LIMIT ? OFFSET ?
  `;
  
  const queryParams = [...params, parseInt(limit), parseInt(offset)];
  const [rows] = await db.query(dataQuery, queryParams);

  return {
    data: rows,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / limit)
  };
};

export const fetchRequestById = async (requestId) => {
  const [rows] = await db.query(
    `SELECT sr.*, u.FullName as AssignedMechanicName, u.PhoneNumber as AssignedMechanicPhone 
     FROM ServiceRequests sr
     LEFT JOIN (
        SELECT ma1.RequestID, ma1.MechanicID 
        FROM MechanicAssignments ma1
        JOIN (
           SELECT RequestID, MAX(AssignmentID) as MaxAssignmentID
           FROM MechanicAssignments
           GROUP BY RequestID
        ) ma2 ON ma1.AssignmentID = ma2.MaxAssignmentID
     ) ma ON sr.RequestID = ma.RequestID
     LEFT JOIN Users u ON ma.MechanicID = u.UserID
     WHERE sr.RequestID = ?`, 
    [requestId]
  );
  if (rows.length === 0) {
    const error = new Error("Service request not found");
    error.status = 404;
    throw error;
  }
  return rows[0];
};

export const fetchMechanicAssignments = async (mechanicId, status) => {
  let query = `
    SELECT 
      ma.AssignmentID, ma.AssignedDate, ma.CompletionDate, ma.Status as AssignmentStatus,
      sr.RequestID, sr.ServiceType, sr.Description, sr.Status as RequestStatus, sr.IsEmergency, sr.GarageID,
      v.PlateNumber, v.Model, v.Type
    FROM MechanicAssignments ma
    JOIN ServiceRequests sr ON ma.RequestID = sr.RequestID
    LEFT JOIN Vehicles v ON sr.VehicleID = v.VehicleID
    WHERE ma.MechanicID = ?
  `;
  const params = [mechanicId];

  if (status) {
    query += " AND ma.Status = ?";
    params.push(status);
  }

  query += " ORDER BY ma.AssignedDate DESC";

  const [rows] = await db.query(query, params);
  return rows;
};

export const fetchRequestItems = async (requestId) => {
  const [rows] = await db.query(
    `SELECT si.ItemID, SUM(si.QuantityUsed) AS QuantityUsed, i.ItemName, i.UnitPrice AS SellingPrice
     FROM ServiceItems si
     JOIN Inventory i ON si.ItemID = i.ItemID
     WHERE si.RequestID = ?
     GROUP BY si.ItemID, i.ItemName, i.UnitPrice`,
    [requestId]
  );
  return rows;
};

export const fetchGarageAvailability = async (garageId, date) => {
  // Baseline Capacity 
  // We'll set a default Garage Daily Limit of 32 Labor Hours (e.g. 4 mechanics * 8 hrs)
  // To make it dynamic, we could count the active Mechanics for this garage.
  const [mechanicsCount] = await db.query(
    "SELECT COUNT(*) as count FROM Mechanics WHERE GarageID = ?",
    [garageId]
  );
  const activeMechanics = mechanicsCount[0].count || 1; // Default to 1 if none found
  const DAILY_LABOR_HOURS_LIMIT = activeMechanics * 8.0;

  // 1. Get the total EstimatedDuration of all active bookings for this date and garage
  const [activeBookings] = await db.query(
    `SELECT SUM(EstimatedDuration) as totalHours 
     FROM ServiceRequests 
     WHERE GarageID = ? AND BookingDate = ? AND Status NOT IN ('Completed', 'Rejected')`,
    [garageId, date]
  );

  const bookedHours = parseFloat(activeBookings[0]?.totalHours || 0);
  const isDayFull = bookedHours >= DAILY_LABOR_HOURS_LIMIT;

  // 2. To prevent intake congestion, we count how many current bookings share the same DropOffTime
  const [dropOffCounts] = await db.query(
    `SELECT DropOffTime, COUNT(*) as count 
     FROM ServiceRequests 
     WHERE GarageID = ? AND BookingDate = ? AND Status NOT IN ('Completed', 'Rejected') 
     GROUP BY DropOffTime`,
    [garageId, date]
  );

  const congestedTimes = dropOffCounts
     .filter(row => row.count >= 2) // Limit: Max 2 cars can drop off at the exact same hour
     .map(row => row.DropOffTime);

  return {
    date,
    isFullyBooked: isDayFull,
    bookedHours,
    capacity: DAILY_LABOR_HOURS_LIMIT,
    mechanicsCount: activeMechanics,
    congestedTimes
  };
};
