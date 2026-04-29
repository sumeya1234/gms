-- Performance Index Optimizations for GMS
-- Run this in MySQL Workbench twice: 
-- once for the main database and once for any specific schema if needed.

-- Service Requests Indexing (Critical for Dashboard)
CREATE INDEX idx_servicerequests_garage ON servicerequests(GarageID);
CREATE INDEX idx_servicerequests_status ON servicerequests(Status);
CREATE INDEX idx_servicerequests_customer ON servicerequests(VehicleID);

-- notifications Indexing (Speeds up bell icon loading)
CREATE INDEX idx_notifications_user ON notifications(UserID);
CREATE INDEX idx_notifications_isread ON notifications(IsRead);

-- inventory Indexing (Speeds up stock management)
CREATE INDEX idx_inventory_garage ON inventory(GarageID);

-- Assignments Indexing (Speeds up mechanic dashboard)
CREATE INDEX idx_mechanicassignments_mechanic ON mechanicassignments(MechanicID);
CREATE INDEX idx_mechanicassignments_status ON mechanicassignments(Status);

-- Service Items (Speeds up job details retrieval)
CREATE INDEX idx_serviceitems_request ON serviceitems(RequestID);
