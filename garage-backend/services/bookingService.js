import db from "../config/db.js";
import { createNotification, deleteNotificationByType } from "./notificationService.js";
import { calculateDuration } from "../utils/serviceUtils.js";
import { getConfig } from "./configService.js";

export const createServiceRequest = async ({ serviceType, vehicleId, garageId, description, isEmergency, bookingDate, dropOffTime, customerStatus, latitude, longitude, address, issueImage }) => {
    const [garage] = await db.query("SELECT 1 FROM garages WHERE GarageID = ?", [garageId]);
    if (garage.length === 0) {
        const error = new Error("Garage not found");
        error.status = 404;
        throw error;
    }

    const [vehicleRows] = await db.query("SELECT 1 FROM vehicles WHERE VehicleID = ?", [vehicleId]);
    if (vehicleRows.length === 0) {
        const error = new Error("Vehicle not found");
        error.status = 404;
        throw error;
    }

    const baselines = await getConfig('service_duration_baselines');
    const estimatedDuration = calculateDuration(serviceType, baselines);

    if (bookingDate) {
        const availability = await fetchGarageAvailability(garageId, bookingDate);
        if (availability.isClosedDay) {
            const error = new Error("Garage is closed on the selected date.");
            error.status = 400;
            throw error;
        }
        if (availability.isFullyBooked) {
            const error = new Error("Garage daily limit exceeded. Please pick another date.");
            error.status = 400;
            throw error;
        }
        if (dropOffTime) {
            const formattedDropOff = dropOffTime.slice(0, 5);
            const slotAllowed = (availability.availableSlots || []).includes(formattedDropOff);
            if (!slotAllowed) {
                const error = new Error("Selected drop-off time is outside garage working hours.");
                error.status = 400;
                throw error;
            }
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

    const [activeBookings] = await db.query(
        "SELECT 1 FROM servicerequests WHERE VehicleID = ? AND Status NOT IN ('Completed', 'Rejected', 'Cancelled')",
        [vehicleId]
    );
    if (activeBookings.length > 0) {
        const error = new Error("This vehicle already has an active service request.");
        error.status = 400;
        throw error;
    }

    const finalIssueImage = Array.isArray(issueImage) ? JSON.stringify(issueImage) : issueImage;

    await db.query(
        `INSERT INTO servicerequests (ServiceType, VehicleID, GarageID, Description, IsEmergency, BookingDate, DropOffTime, EstimatedDuration, CustomerStatus, Latitude, Longitude, Address, IssueImage)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [serviceType, vehicleId, garageId, description || '', isEmergency ? 1 : 0, bookingDate || null, dropOffTime || null, estimatedDuration, customerStatus || null, latitude || null, longitude || null, address || null, finalIssueImage || null]
    );

    // Notify Garage Manager
    try {
        const [garageInfo] = await db.query("SELECT ManagerID, Name FROM garages WHERE GarageID = ?", [garageId]);
        if (garageInfo.length > 0 && garageInfo[0].ManagerID) {
            await createNotification(
                garageInfo[0].ManagerID,
                "New Service Request",
                `A new ${isEmergency ? "EMERGENCY " : ""}request for ${serviceType} has been received at ${garageInfo[0].Name}.`,
                "NEW_REQUEST"
            );
        }

        // If emergency, notify all mechanics in this garage
        if (isEmergency) {
            const { getMechanicsByGarage } = await import("./userService.js");
            const mechanics = await getMechanicsByGarage(garageId);
            for (const mechanic of mechanics) {
                await createNotification(
                    mechanic.UserID,
                    "EMERGENCY Request Received",
                    `An emergency ${serviceType} request was just posted at your garage! Check tasks.`,
                    "EMERGENCY_BROADCAST"
                );
            }
        }
    } catch (err) {
        console.error("Failed to notify staff of new request:", err.message);
    }
};

export const fetchCustomerRequests = async (customerId) => {
    const [rows] = await db.query(
        `SELECT 
        sr.*,
        v.Type as Brand,
        v.Model,
        v.PlateNumber,
        g.Name as GarageName,
        (SELECT PaymentStatus FROM payments p WHERE p.RequestID = sr.RequestID ORDER BY PaymentDate DESC LIMIT 1) as PaymentStatus,
        (SELECT PaymentMethod FROM payments p WHERE p.RequestID = sr.RequestID ORDER BY PaymentDate DESC LIMIT 1) as PaymentMethod,
        (SELECT COALESCE(SUM(Amount), 0) FROM payments p WHERE p.RequestID = sr.RequestID AND p.PaymentStatus = 'Completed') as TotalPaid,
        (SELECT TransactionRef FROM payments p WHERE p.RequestID = sr.RequestID ORDER BY PaymentDate DESC LIMIT 1) as TransactionRef,
        u.FullName as AssignedMechanicName,
        u.PhoneNumber as AssignedMechanicPhone,
        (SELECT COALESCE(SUM(gs.Price), 0) 
         FROM garageservices gs 
         WHERE gs.GarageID = sr.GarageID 
         AND FIND_IN_SET(gs.ServiceName, REPLACE(sr.ServiceType, ', ', ','))) as BaseServicePrice,
        (SELECT COALESCE(SUM(si.QuantityUsed * i.SellingPrice), 0) 
         FROM serviceitems si 
         JOIN inventory i ON si.ItemID = i.ItemID 
         WHERE si.RequestID = sr.RequestID) as PartsCost,
        (sr.ReviewSkipped OR (SELECT COUNT(*) FROM reviews r WHERE r.RequestID = sr.RequestID) > 0) as HasReviewed,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('Amount', p.Amount, 'PaymentMethod', p.PaymentMethod, 'PaymentStatus', p.PaymentStatus, 'PaymentCategory', p.PaymentCategory, 'TransactionRef', p.TransactionRef)) FROM payments p WHERE p.RequestID = sr.RequestID) as PaymentDetailsJson
     FROM servicerequests sr
     JOIN vehicles v ON sr.VehicleID = v.VehicleID
     LEFT JOIN garages g ON sr.GarageID = g.GarageID
     LEFT JOIN (
        SELECT ma1.RequestID, ma1.MechanicID 
        FROM mechanicassignments ma1
        JOIN (
           SELECT RequestID, MAX(AssignmentID) as MaxAssignmentID
           FROM mechanicassignments
           GROUP BY RequestID
        ) ma2 ON ma1.AssignmentID = ma2.MaxAssignmentID
     ) ma ON sr.RequestID = ma.RequestID
     LEFT JOIN users u ON ma.MechanicID = u.UserID
     WHERE v.CustomerID = ? AND sr.CustomerHidden = 0
     ORDER BY sr.RequestDate DESC`,
        [customerId]
    );
    return rows;
};

export const hideCustomerRequest = async (requestId, customerId) => {

    const [rows] = await db.query(
        `SELECT sr.RequestID FROM servicerequests sr 
     JOIN vehicles v ON sr.VehicleID = v.VehicleID 
     WHERE sr.RequestID = ? AND v.CustomerID = ?`,
        [requestId, customerId]
    );
    if (rows.length === 0) {
        const error = new Error("Request not found or unauthorized");
        error.status = 404;
        throw error;
    }
    await db.query("UPDATE servicerequests SET CustomerHidden = 1 WHERE RequestID = ?", [requestId]);
};

export const fetchGarageRequests = async (garageId, options, admin) => {
    const { status, page = 1, limit = 10, search = '', date = '', sort = 'desc', isEmergency } = options;
    const offset = (page - 1) * limit;


    if (admin.role === "GarageManager") {
        const [manager] = await db.query(
            "SELECT 1 FROM garagemanagers WHERE UserID = ? AND GarageID = ?",
            [admin.id, garageId]
        );
        if (manager.length === 0) {
            const error = new Error("Unauthorized: You do not manage this garage");
            error.status = 403;
            throw error;
        }
    }

    let baseQuery = `
    FROM servicerequests sr
    LEFT JOIN vehicles v ON sr.VehicleID = v.VehicleID
    LEFT JOIN (
      SELECT ma1.RequestID, ma1.MechanicID 
      FROM mechanicassignments ma1
      JOIN (
         SELECT RequestID, MAX(AssignmentID) as MaxAssignmentID
         FROM mechanicassignments
         GROUP BY RequestID
      ) ma2 ON ma1.AssignmentID = ma2.MaxAssignmentID
    ) ma ON sr.RequestID = ma.RequestID
    LEFT JOIN users u ON ma.MechanicID = u.UserID
    WHERE sr.GarageID = ?
  `;

    const params = [garageId];

    if (status && status !== 'All') {
        baseQuery += " AND sr.Status = ?";
        params.push(status);
    }

    if (isEmergency !== undefined && isEmergency !== null && isEmergency !== '') {
        const isEmergencyBool = String(isEmergency).toLowerCase() === 'true' || isEmergency === true || isEmergency === 1 || isEmergency === '1';
        baseQuery += " AND sr.IsEmergency = ?";
        params.push(isEmergencyBool ? 1 : 0);
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


    const [countResult] = await db.query(`SELECT COUNT(*) as total ${baseQuery}`, params);
    const total = countResult[0].total;


    let dataQuery = `
    SELECT sr.*, u.FullName as AssignedMechanicName, ma.MechanicID as AssignedMechanicID,
        v.Type as VehicleType, v.Model as VehicleModel, v.PlateNumber as VehiclePlateNumber,
        (SELECT PaymentStatus FROM payments p WHERE p.RequestID = sr.RequestID ORDER BY PaymentDate DESC LIMIT 1) as PaymentStatus,
        (SELECT PaymentMethod FROM payments p WHERE p.RequestID = sr.RequestID ORDER BY PaymentDate DESC LIMIT 1) as PaymentMethod,
        (SELECT COALESCE(SUM(Amount), 0) FROM payments p WHERE p.RequestID = sr.RequestID AND p.PaymentStatus = 'Completed') as PaymentAmount,
        (SELECT TransactionRef FROM payments p WHERE p.RequestID = sr.RequestID ORDER BY PaymentDate DESC LIMIT 1) as TransactionRef,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('Amount', p.Amount, 'PaymentMethod', p.PaymentMethod, 'PaymentStatus', p.PaymentStatus, 'PaymentCategory', p.PaymentCategory, 'TransactionRef', p.TransactionRef)) FROM payments p WHERE p.RequestID = sr.RequestID) as PaymentDetailsJson
    ${baseQuery}
    ORDER BY sr.RequestDate ${sort === 'asc' ? 'ASC' : 'DESC'}
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

export const fetchFilteredBookings = async (filters, admin) => {
    const {
        status = "All",
        page = 1,
        limit = 10,
        search = "",
        date = "",
        garageId,
        location = "",
        arrivalTime = "",
        sort = "desc",
        isEmergency
    } = filters;
    const offset = (Number(page) - 1) * Number(limit);

    let effectiveGarageId = garageId;
    if (admin.role === "GarageManager") {
        const [manager] = await db.query("SELECT GarageID FROM garagemanagers WHERE UserID = ?", [admin.id]);
        if (!manager.length) {
            const error = new Error("Garage Manager is not assigned to a garage");
            error.status = 403;
            throw error;
        }
        effectiveGarageId = manager[0].GarageID;
    } else if (admin.role === "Accountant") {
        const [accountant] = await db.query("SELECT GarageID FROM accountants WHERE UserID = ?", [admin.id]);
        if (!accountant.length) {
            const error = new Error("Accountant is not assigned to a garage");
            error.status = 403;
            throw error;
        }
        effectiveGarageId = accountant[0].GarageID;
    }

    let baseQuery = `
    FROM servicerequests sr
    JOIN garages g ON sr.GarageID = g.GarageID
    LEFT JOIN vehicles v ON sr.VehicleID = v.VehicleID
    LEFT JOIN users cu ON v.CustomerID = cu.UserID
    LEFT JOIN(
            SELECT ma1.RequestID, ma1.MechanicID
      FROM mechanicassignments ma1
      JOIN(
                SELECT RequestID, MAX(AssignmentID) as MaxAssignmentID
         FROM mechanicassignments
         GROUP BY RequestID
            ) ma2 ON ma1.AssignmentID = ma2.MaxAssignmentID
        ) ma ON sr.RequestID = ma.RequestID
    LEFT JOIN users u ON ma.MechanicID = u.UserID
    WHERE 1 = 1
        `;
    const params = [];

    if (effectiveGarageId) {
        baseQuery += " AND sr.GarageID = ?";
        params.push(effectiveGarageId);
    }
    if (status && status !== "All") {
        baseQuery += " AND sr.Status = ?";
        params.push(status);
    }
    if (search) {
        baseQuery += " AND (sr.RequestID = ? OR sr.ServiceType LIKE ?)";
        params.push(search, `%${search}%`);
    }
    if (date) {
        baseQuery += " AND DATE(sr.BookingDate) = ?";
        params.push(date);
    }
    if (location) {
        baseQuery += " AND g.Location LIKE ?";
        params.push(`%${location}%`);
    }
    if (arrivalTime) {
        baseQuery += " AND TIME_FORMAT(sr.DropOffTime, '%H:%i') = ?";
        params.push(arrivalTime);
    }
    if (isEmergency !== undefined && isEmergency !== null && isEmergency !== '') {
        const isEmergencyBool = String(isEmergency).toLowerCase() === 'true' || isEmergency === true || isEmergency === 1 || isEmergency === '1';
        baseQuery += " AND sr.IsEmergency = ?";
        params.push(isEmergencyBool ? 1 : 0);
    }

    const [countResult] = await db.query(`SELECT COUNT(*) as total ${baseQuery} `, params);
    const total = countResult[0].total;

    const dataQuery = `
    SELECT sr.*, g.Name as GarageName, g.Location as GarageLocation,
           v.Model as VehicleModel, v.PlateNumber as VehiclePlateNumber, v.Type as VehicleType,
           cu.FullName as CustomerName,
           u.FullName as AssignedMechanicName, ma.MechanicID as AssignedMechanicID,
           (SELECT PaymentStatus FROM payments p WHERE p.RequestID = sr.RequestID ORDER BY PaymentDate DESC LIMIT 1) as PaymentStatus,
           (SELECT PaymentMethod FROM payments p WHERE p.RequestID = sr.RequestID ORDER BY PaymentDate DESC LIMIT 1) as PaymentMethod,
           (SELECT COALESCE(SUM(Amount), 0) FROM payments p WHERE p.RequestID = sr.RequestID AND p.PaymentStatus = 'Completed') as PaymentAmount,
           (SELECT TransactionRef FROM payments p WHERE p.RequestID = sr.RequestID ORDER BY PaymentDate DESC LIMIT 1) as TransactionRef,
           (SELECT JSON_ARRAYAGG(JSON_OBJECT('Amount', p.Amount, 'PaymentMethod', p.PaymentMethod, 'PaymentStatus', p.PaymentStatus, 'PaymentCategory', p.PaymentCategory, 'TransactionRef', p.TransactionRef)) FROM payments p WHERE p.RequestID = sr.RequestID) as PaymentDetailsJson
    ${baseQuery}
    ORDER BY sr.RequestDate ${sort === 'asc' ? 'ASC' : 'DESC'}
    LIMIT ? OFFSET ?
  `;
    const [rows] = await db.query(dataQuery, [...params, Number(limit), Number(offset)]);

    return {
        data: rows,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
    };
};

export const fetchRequestById = async (requestId) => {
    const [rows] = await db.query(
        `SELECT sr.*, u.FullName as AssignedMechanicName, u.PhoneNumber as AssignedMechanicPhone, 
                ma.MechanicID as AssignedMechanicID,
                v.PlateNumber, v.Model, v.Type as VehicleType
      FROM servicerequests sr
      JOIN vehicles v ON sr.VehicleID = v.VehicleID
      LEFT JOIN (
         SELECT ma1.RequestID, ma1.MechanicID 
         FROM mechanicassignments ma1
         JOIN (
            SELECT RequestID, MAX(AssignmentID) as MaxAssignmentID
            FROM mechanicassignments
            GROUP BY RequestID
         ) ma2 ON ma1.AssignmentID = ma2.MaxAssignmentID
      ) ma ON sr.RequestID = ma.RequestID
      LEFT JOIN users u ON ma.MechanicID = u.UserID
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

export const fetchGarageAvailability = async (garageId, date) => {
    const [garageRows] = await db.query("SELECT WorkingHours FROM garages WHERE GarageID = ?", [garageId]);
    const garageHoursRaw = garageRows[0]?.WorkingHours;
    const defaultHours = {
        monday: { isOpen: true, open: "08:00", close: "18:00" },
        tuesday: { isOpen: true, open: "08:00", close: "18:00" },
        wednesday: { isOpen: true, open: "08:00", close: "18:00" },
        thursday: { isOpen: true, open: "08:00", close: "18:00" },
        friday: { isOpen: true, open: "08:00", close: "18:00" },
        saturday: { isOpen: true, open: "09:00", close: "14:00" },
        sunday: { isOpen: false, open: null, close: null }
    };
    let workingHours = defaultHours;
    if (garageHoursRaw) {
        try {
            workingHours = typeof garageHoursRaw === "string" ? JSON.parse(garageHoursRaw) : garageHoursRaw;
        } catch {
            workingHours = defaultHours;
        }
    }
    const selectedDate = new Date(`${date}T00:00:00`);
    const dayKey = selectedDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const dayHours = workingHours[dayKey] || { isOpen: false, open: null, close: null };

    const availableSlots = [];
    if (dayHours.isOpen && dayHours.open && dayHours.close) {
        const [openH, openM] = dayHours.open.split(":").map(Number);
        const [closeH, closeM] = dayHours.close.split(":").map(Number);
        const start = new Date(selectedDate);
        start.setHours(openH, openM, 0, 0);
        const end = new Date(selectedDate);
        end.setHours(closeH, closeM, 0, 0);
        while (start < end) {
            availableSlots.push(start.toTimeString().slice(0, 5));
            start.setHours(start.getHours() + 1);
        }
    }

    const [mechanicsCount] = await db.query(
        "SELECT COUNT(*) as count FROM mechanics WHERE GarageID = ?",
        [garageId]
    );
    const capacitySettings = await getConfig('garage_capacity_settings');
    const hoursPerMechanic = capacitySettings?.daily_labor_hours_per_mechanic || 8.0;
    const maxDropOff = capacitySettings?.max_dropoff_per_hour || 2;

    const activeMechanics = mechanicsCount[0].count || 1;
    const DAILY_LABOR_HOURS_LIMIT = activeMechanics * hoursPerMechanic;

    const [activeBookings] = await db.query(
        `SELECT SUM(EstimatedDuration) as totalHours 
     FROM servicerequests 
     WHERE GarageID = ? AND BookingDate = ? AND Status NOT IN ('Completed', 'Rejected')`,
        [garageId, date]
    );

    const bookedHours = parseFloat(activeBookings[0]?.totalHours || 0);
    const isDayFull = bookedHours >= DAILY_LABOR_HOURS_LIMIT;

    const [dropOffCounts] = await db.query(
        `SELECT DropOffTime, COUNT(*) as count 
     FROM servicerequests 
     WHERE GarageID = ? AND BookingDate = ? AND Status NOT IN ('Completed', 'Rejected') 
     GROUP BY DropOffTime`,
        [garageId, date]
    );

    const congestedTimes = dropOffCounts
        .filter(row => row.count >= maxDropOff)
        .map(row => (typeof row.DropOffTime === "string" ? row.DropOffTime.slice(0, 5) : row.DropOffTime));

    return {
        date,
        isClosedDay: !dayHours.isOpen,
        isFullyBooked: isDayFull,
        bookedHours,
        capacity: DAILY_LABOR_HOURS_LIMIT,
        mechanicsCount: activeMechanics,
        congestedTimes,
        availableSlots
    };
};

export const cancelServiceRequest = async (requestId, customerId) => {
    const [request] = await db.query(
        `SELECT sr.*, v.CustomerID 
     FROM servicerequests sr
     JOIN vehicles v ON sr.VehicleID = v.VehicleID
     WHERE sr.RequestID = ?`,
        [requestId]
    );

    if (request.length === 0) {
        const error = new Error("Service request not found");
        error.status = 404;
        throw error;
    }

    if (request[0].CustomerID !== customerId) {
        const error = new Error("Unauthorized: You do not own this service request");
        error.status = 403;
        throw error;
    }

    const currentStatus = request[0].Status || 'pending';
    const currentStatusLowerCase = currentStatus.toLowerCase();
    const cancellableStatuses = ["pending", "approved"];

    if (!cancellableStatuses.includes(currentStatusLowerCase)) {
        const error = new Error(`Cannot cancel a service request in '${currentStatus}' status. Only Pending or Approved requests can be cancelled.`);
        error.status = 400;
        throw error;
    }

    const [assignments] = await db.query(
        "SELECT 1 FROM mechanicassignments WHERE RequestID = ? AND Status IN ('InProgress', 'Completed')",
        [requestId]
    );
    if (assignments.length > 0) {
        const error = new Error("Cannot cancel: Work has already started on this vehicle.");
        error.status = 400;
        throw error;
    }

    await db.query("UPDATE servicerequests SET Status = 'Cancelled' WHERE RequestID = ?", [requestId]);

    try {
        const [garageInfo] = await db.query("SELECT ManagerID, Name FROM garages WHERE GarageID = ?", [request[0].GarageID]);
        if (garageInfo.length > 0 && garageInfo[0].ManagerID) {
            await createNotification(
                garageInfo[0].ManagerID,
                "Service Request Cancelled",
                `Service request #${requestId} for ${request[0].ServiceType} has been cancelled by the customer.`,
                "REQUEST_CANCELLED"
            );
        }
    } catch (err) {
        console.error("Failed to notify manager of cancellation:", err.message);
    }

    try {
        await deleteNotificationByType(customerId, "ESTIMATE_READY");
    } catch (err) {
        console.error("Failed to cleanup notifications:", err.message);
    }
};

export const createWalkInRequest = async (garageId, { phone, plateNumber, model, type, serviceType, description, isEmergency, latitude, longitude, address, issueImage, fullName }) => {
    // 1. Find or create user
    let [user] = await db.query("SELECT UserID FROM users WHERE PhoneNumber = ?", [phone]);
    let customerId;

    if (user.length === 0) {
        const placeholderEmail = `walkin_${phone}@gms.example.com`;
        const randomPass = Math.random().toString(36).slice(-8);
        const [result] = await db.query(
            "INSERT INTO users (PhoneNumber, Email, FullName, PasswordHash, Role) VALUES (?, ?, ?, ?, ?)",
            [phone, placeholderEmail, fullName || `Walk-in (${phone})`, randomPass, 'Customer']
        );
        customerId = result.insertId;
    } else {
        customerId = user[0].UserID;
    }

    // 2. Find or create vehicle
    let [vehicle] = await db.query("SELECT VehicleID FROM vehicles WHERE PlateNumber = ?", [plateNumber]);
    let vehicleId;

    if (vehicle.length === 0) {
        const [result] = await db.query(
            "INSERT INTO vehicles (PlateNumber, Model, Type, CustomerID) VALUES (?, ?, ?, ?)",
            [plateNumber, model || 'Unknown', type || 'Car', customerId]
        );
        vehicleId = result.insertId;
    } else {
        vehicleId = vehicle[0].VehicleID;
        // Optionally update customer ID if it was null
        await db.query("UPDATE vehicles SET CustomerID = ? WHERE VehicleID = ? AND CustomerID IS NULL", [customerId, vehicleId]);

        // Check for active bookings
        const [activeBookings] = await db.query(
            "SELECT 1 FROM servicerequests WHERE VehicleID = ? AND Status NOT IN ('Completed', 'Rejected', 'Cancelled')",
            [vehicleId]
        );
        if (activeBookings.length > 0) {
            const error = new Error("This vehicle already has an active service request.");
            error.status = 400;
            throw error;
        }
    }

    // 3. Create service request
    const baselines = await getConfig('service_duration_baselines');
    const estimatedDuration = calculateDuration(serviceType, baselines);
    const bookingDate = new Date().toISOString().split('T')[0];
    const dropOffTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const finalIssueImage = Array.isArray(issueImage) ? JSON.stringify(issueImage) : issueImage;

    const [result] = await db.query(
        `INSERT INTO servicerequests (ServiceType, VehicleID, GarageID, Description, IsEmergency, BookingDate, DropOffTime, EstimatedDuration, Status, Latitude, Longitude, Address, IssueImage)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [serviceType, vehicleId, garageId, description || 'Walk-in arrival', isEmergency ? 1 : 0, bookingDate, dropOffTime, estimatedDuration, 'Approved', latitude || null, longitude || null, address || null, finalIssueImage || null]
    );

    return result.insertId;
};

export const updateServiceRequest = async (requestId, { serviceType, description, plateNumber, model, type, garageId, user }) => {
    // 1. Check if request exists
    const [requestRows] = await db.query(
        "SELECT sr.*, v.CustomerID FROM servicerequests sr JOIN vehicles v ON sr.VehicleID = v.VehicleID WHERE sr.RequestID = ?",
        [requestId]
    );

    if (requestRows.length === 0) {
        const error = new Error("Service request not found");
        error.status = 404;
        throw error;
    }

    const request = requestRows[0];
    const vehicleId = request.VehicleID;

    // Authorization Check
    if (user.Role === "Customer" && request.CustomerID !== user.id) {
        const error = new Error("Unauthorized: You do not own this service request");
        error.status = 403;
        throw error;
    }

    // 2. Update Vehicle if plate/model changed
    if (plateNumber || model || type) {
        const [existingVehicle] = await db.query("SELECT 1 FROM vehicles WHERE PlateNumber = ? AND VehicleID != ?", [plateNumber, vehicleId]);
        if (existingVehicle.length > 0) {
            const error = new Error("Another vehicle already has this plate number");
            error.status = 400;
            throw error;
        }

        const updates = [];
        const params = [];
        if (plateNumber) { updates.push("PlateNumber = ?"); params.push(plateNumber); }
        if (model) { updates.push("Model = ?"); params.push(model); }
        if (type) { updates.push("Type = ?"); params.push(type); }
        params.push(vehicleId);

        await db.query(`UPDATE vehicles SET ${updates.join(', ')} WHERE VehicleID = ?`, params);
    }

    // 3. Update Service Request
    const updates = [];
    const params = [];
    let isServiceTypeUpdated = false;

    if (serviceType) {
        const baselines = await getConfig('service_duration_baselines');
        const duration = calculateDuration(serviceType, baselines);
        updates.push("ServiceType = ?, EstimatedDuration = ?");
        params.push(serviceType, duration);
        isServiceTypeUpdated = true;
    }
    if (description !== undefined) { updates.push("Description = ?"); params.push(description); }

    if (updates.length > 0) {
        params.push(requestId);
        await db.query(`UPDATE servicerequests SET ${updates.join(', ')} WHERE RequestID = ?`, params);
    }

    // 4. Notify Garage Manager if customer updated the booking
    if (user.Role === "Customer") {
        try {
            const [garageInfo] = await db.query("SELECT ManagerID FROM garages WHERE GarageID = ?", [request.GarageID]);
            if (garageInfo.length > 0 && garageInfo[0].ManagerID) {
                await createNotification(
                    garageInfo[0].ManagerID,
                    "Booking Updated",
                    `Customer has updated Request #${requestId}. New services: ${serviceType || request.ServiceType}`,
                    "REQUEST_UPDATED"
                );
            }
        } catch (err) {
            console.error("Failed to notify manager of booking update:", err.message);
        }
    }
};

export const findVehicleByPlate = async (plateNumber) => {
    const [rows] = await db.query(`
        SELECT v.*, u.FullName as OwnerName, u.PhoneNumber as OwnerPhone,
        (SELECT COUNT(*) FROM servicerequests sr WHERE sr.VehicleID = v.VehicleID AND sr.Status NOT IN ('Completed', 'Rejected', 'Cancelled')) as ActiveBookingCount
        FROM vehicles v
        JOIN users u ON v.CustomerID = u.UserID
        WHERE v.PlateNumber = ?
    `, [plateNumber]);
    return rows[0] || null;
};
export const skipReviewRequest = async (requestId) => {
    const [result] = await db.query(
        "UPDATE servicerequests SET ReviewSkipped = 1 WHERE RequestID = ?",
        [requestId]
    );
    return result.affectedRows > 0;
};

export const skipAllReviews = async (customerId) => {
    const [result] = await db.query(
        "UPDATE servicerequests sr JOIN vehicles v ON sr.VehicleID = v.VehicleID SET sr.ReviewSkipped = 1 WHERE v.CustomerID = ? AND sr.Status = 'Completed' AND sr.ReviewSkipped = 0",
        [customerId]
    );
    return result.affectedRows >= 0;
};

export const fetchVehicleHistory = async (vehicleId, garageId = null) => {
    let query = `
        SELECT sr.*, g.Name as GarageName,
               (SELECT COALESCE(SUM(Amount), 0) FROM payments p WHERE p.RequestID = sr.RequestID AND p.PaymentStatus = 'Completed') as PaymentAmount
        FROM servicerequests sr
        LEFT JOIN garages g ON sr.GarageID = g.GarageID
        WHERE sr.VehicleID = ?
    `;
    const params = [vehicleId];

    if (garageId) {
        query += " AND sr.GarageID = ?";
        params.push(garageId);
    }

    query += " ORDER BY sr.RequestDate DESC";

    const [rows] = await db.query(query, params);
    return rows;
};
