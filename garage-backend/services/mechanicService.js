import db from "../config/db.js";

export const fetchMechanicAssignments = async (mechanicId, status) => {
    let query = `
    SELECT 
      ma.AssignmentID, ma.AssignedDate, ma.CompletionDate, ma.Status as AssignmentStatus,
      sr.RequestID, sr.ServiceType, sr.Description, sr.Status as RequestStatus, sr.IsEmergency, sr.GarageID,
      v.PlateNumber, v.Model, v.Type
    FROM mechanicassignments ma
    JOIN servicerequests sr ON ma.RequestID = sr.RequestID
    LEFT JOIN vehicles v ON sr.VehicleID = v.VehicleID
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
