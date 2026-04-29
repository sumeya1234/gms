import db from "../config/db.js";
import { createNotification } from "./notificationService.js";
import { calculateDeposit } from "../utils/serviceUtils.js";

export const assignServiceMechanic = async (requestId, mechanicId) => {
    const [request] = await db.query("SELECT * FROM ServiceRequests WHERE RequestID = ?", [requestId]);
    if (request.length === 0) {
        const error = new Error("Service request not found");
        error.status = 404;
        throw error;
    }

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

    await db.query("DELETE FROM MechanicAssignments WHERE RequestID = ?", [requestId]);

    await db.query(
        `INSERT INTO MechanicAssignments (RequestID, MechanicID)
     VALUES (?, ?)`,
        [requestId, mechanicId]
    );

    await createNotification(
        mechanicId,
        "New Job Assignment",
        `You have been assigned to service request #${requestId}.`,
        "ASSIGNMENT"
    );
};

export const updateServiceStatus = async (requestId, status, admin, rejectionReason = "", estimatedPrice = null, depositPercentage = null) => {
    const [request] = await db.query("SELECT * FROM ServiceRequests WHERE RequestID = ?", [requestId]);

    if (request.length === 0) {
        const error = new Error("Service request not found");
        error.status = 404;
        throw error;
    }

    if (request[0].Status === 'Rejected' || request[0].Status === 'Completed') {
        const error = new Error(`Cannot update status of a ${request[0].Status} service request`);
        error.status = 400;
        throw error;
    }

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
    } else if (admin.role === "Customer") {
        if (status !== "Rejected") {
            const error = new Error("Unauthorized: Customers can only reject service requests in this flow");
            error.status = 403;
            throw error;
        }
        const [vehicle] = await db.query("SELECT CustomerID FROM Vehicles WHERE VehicleID = ?", [request[0].VehicleID]);
        if (vehicle.length === 0 || vehicle[0].CustomerID !== admin.id) {
            const error = new Error("Unauthorized: You do not own this service request");
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

    const currentStatus = request[0].Status;
    if (currentStatus === status) return;

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

    let finalEstimatedPrice = estimatedPrice;
    let finalDepositPercentage = depositPercentage;

    // Automation for emergency requests: Lookup fixed price and garage-specific deposit %
    if (status === 'Approved' && request[0].IsEmergency) {
        // 1. Fetch the fixed price for this service type from the garage's catalog
        const [serviceData] = await db.query(
            "SELECT Price FROM GarageServices WHERE GarageID = ? AND ServiceName = ?",
            [request[0].GarageID, request[0].ServiceType]
        );

        if (serviceData.length > 0) {
            finalEstimatedPrice = serviceData[0].Price;
        } else {
            const error = new Error(`Fixed price for '${request[0].ServiceType}' is not configured in this garage's Service Catalog. Please configure it before approving.`);
            error.status = 400;
            throw error;
        }

        // 2. Fetch the garage's default emergency deposit percentage
        const [garageData] = await db.query(
            "SELECT EmergencyDepositPercentage FROM Garages WHERE GarageID = ?",
            [request[0].GarageID]
        );
        finalDepositPercentage = garageData[0]?.EmergencyDepositPercentage || 10.00;
    }

    await db.query(
        `UPDATE ServiceRequests SET Status = ?, RejectionReason = ?, EstimatedPrice = ?, DepositPercentage = ? WHERE RequestID = ?`,
        [status, rejectionReason, finalEstimatedPrice, finalDepositPercentage, requestId]
    );

    const [vehicle] = await db.query("SELECT CustomerID FROM Vehicles WHERE VehicleID = ?", [request[0].VehicleID]);
    if (vehicle.length > 0) {
        let title = "Service Update";
        let message = `Your service request for ${request[0].ServiceType} has been marked as ${status}.`;
        let type = status.toUpperCase();

        if (status === "Approved") {
            if (finalEstimatedPrice && finalDepositPercentage) {
                const depositAmount = calculateDeposit(finalEstimatedPrice, finalDepositPercentage);
                title = "Estimate Ready — Action Required";
                message = `Your garage has sent an estimate of ${finalEstimatedPrice} ETB for your emergency request. A pre-service deposit of ${depositAmount} ETB (${finalDepositPercentage}%) is required. Please review and approve in the app.`;
                type = "ESTIMATE_READY";
            } else {
                title = "Request Approved";
                message = "Your car has been approved for service";
            }
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
    await db.query("UPDATE ServiceRequests SET Status = ? WHERE RequestID = ?", [status, requestId]);

    const [vehicle] = await db.query(
        "SELECT v.CustomerID FROM ServiceRequests sr JOIN Vehicles v ON sr.VehicleID = v.VehicleID WHERE sr.RequestID = ?",
        [requestId]
    );

    if (vehicle.length > 0) {
        const customerId = vehicle[0].CustomerID;
        if (status === 'InProgress') {
            await createNotification(customerId, "Repair Started", "Your vehicle is now being worked on by the assigned mechanic.", "REPAIR_STARTED");
        } else if (status === 'Completed') {
            await createNotification(customerId, "Service Ready", "Your vehicle service has been completed and is ready for pickup!", "CAR_READY");
        }
    }
};

export const documentAssignmentItems = async (assignmentId, itemsUsed, mechanicId) => {
    const connection = await db.getConnection();
    const notificationsToSend = [];
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
            await connection.query("UPDATE Inventory SET Quantity = ? WHERE ItemID = ?", [newQuantity, itemId]);
            await connection.query("INSERT INTO ServiceItems (RequestID, ItemID, QuantityUsed) VALUES (?, ?, ?)", [requestId, itemId, quantity]);

            if (newQuantity < 10) {
                const [garage] = await connection.query("SELECT ManagerID FROM Garages WHERE GarageID = ?", [inventory[0].GarageID]);
                if (garage.length > 0 && garage[0].ManagerID) {
                    notificationsToSend.push({
                        userId: garage[0].ManagerID,
                        title: "Low Stock Alert",
                        message: `${inventory[0].ItemName} is running low (${newQuantity} remaining). Please restock soon.`,
                        type: "LOW_STOCK"
                    });
                }
            }
        }

        await connection.commit();

        // Process notifications after successful commit
        for (const note of notificationsToSend) {
            createNotification(note.userId, note.title, note.message, note.type).catch(err =>
                console.error("Delayed notification failed:", err)
            );
        }

        return { success: true, message: "Items documented successfully" };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export const completeServiceRequest = async (requestId, itemsUsed = []) => {
    const connection = await db.getConnection();
    const notificationsToSend = [];
    await connection.beginTransaction();

    try {
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

        const [payment] = await connection.query("SELECT PaymentStatus FROM Payments WHERE RequestID = ?", [requestId]);
        if (payment.length === 0 || payment[0].PaymentStatus !== "Completed") {
            const error = new Error("Cannot complete service without completed payment");
            error.status = 400;
            throw error;
        }

        for (const item of itemsUsed) {
            const { itemId, quantity } = item;
            const [inventory] = await connection.query("SELECT Quantity, ItemName, GarageID FROM Inventory WHERE ItemID = ? FOR UPDATE", [itemId]);

            if (inventory.length === 0 || inventory[0].Quantity < quantity) {
                throw new Error(`Insufficient stock for item ID ${itemId}`);
            }

            const newQuantity = inventory[0].Quantity - quantity;
            await connection.query("UPDATE Inventory SET Quantity = ? WHERE ItemID = ?", [newQuantity, itemId]);
            await connection.query("INSERT INTO ServiceItems (RequestID, ItemID, QuantityUsed) VALUES (?, ?, ?)", [requestId, itemId, quantity]);

            if (newQuantity < 10) {
                const [garage] = await connection.query("SELECT ManagerID FROM Garages WHERE GarageID = ?", [inventory[0].GarageID]);
                if (garage.length > 0 && garage[0].ManagerID) {
                    notificationsToSend.push({
                        userId: garage[0].ManagerID,
                        title: "Low Stock Alert",
                        message: `${inventory[0].ItemName} is running low (${newQuantity} remaining). Please restock soon.`,
                        type: "LOW_STOCK"
                    });
                }
            }
        }

        await connection.query("UPDATE ServiceRequests SET Status = 'Completed' WHERE RequestID = ?", [requestId]);

        // Fetch user data for completion notification after state change
        const [vehicle] = await connection.query("SELECT CustomerID FROM Vehicles WHERE VehicleID = ?", [service[0].VehicleID]);
        if (vehicle.length > 0) {
            notificationsToSend.push({
                userId: vehicle[0].CustomerID,
                title: "Service Ready",
                message: "Your vehicle service has been completed and is ready for pickup!",
                type: "CAR_READY"
            });
        }

        await connection.commit();

        // Process all notifications after successful commit
        for (const note of notificationsToSend) {
            createNotification(note.userId, note.title, note.message, note.type).catch(err =>
                console.error("Delayed notification failed:", err)
            );
        }

        return { success: true, message: "Service request completed successfully" };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
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
