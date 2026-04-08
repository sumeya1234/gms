SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS Complaints;
DROP TABLE IF EXISTS Reviews;
DROP TABLE IF EXISTS Payments;
DROP TABLE IF EXISTS InventoryRequests;
DROP TABLE IF EXISTS Inventory;
DROP TABLE IF EXISTS MechanicAssignments;
DROP TABLE IF EXISTS ServiceRequests;
DROP TABLE IF EXISTS Vehicles;
DROP TABLE IF EXISTS Mechanics;
DROP TABLE IF EXISTS GarageManagers;
DROP TABLE IF EXISTS SuperAdmins;
DROP TABLE IF EXISTS Customers;
DROP TABLE IF EXISTS Garages;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Notifications;
DROP TABLE IF EXISTS PushTokens;

SET FOREIGN_KEY_CHECKS = 1;


CREATE TABLE Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    PhoneNumber VARCHAR(20) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Role ENUM('Customer','Mechanic','GarageManager','SuperAdmin') NOT NULL,
    Status ENUM('Active','Inactive') DEFAULT 'Active',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Customers (
    UserID INT PRIMARY KEY,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

CREATE TABLE SuperAdmins (
    UserID INT PRIMARY KEY,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE Garages (
    GarageID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100),
    Location VARCHAR(255),
    ContactNumber VARCHAR(20),
    Status ENUM('Active','Inactive'),
    ManagerID INT UNIQUE
);

CREATE TABLE GarageManagers (
    UserID INT PRIMARY KEY,
    GarageID INT UNIQUE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (GarageID) REFERENCES Garages(GarageID)
);

ALTER TABLE Garages
ADD FOREIGN KEY (ManagerID) REFERENCES GarageManagers(UserID);

CREATE TABLE Mechanics (
    UserID INT PRIMARY KEY,
    GarageID INT,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (GarageID) REFERENCES Garages(GarageID)
);

CREATE TABLE Vehicles (
    VehicleID INT AUTO_INCREMENT PRIMARY KEY,
    PlateNumber VARCHAR(20) UNIQUE,
    Type VARCHAR(50),
    Model VARCHAR(50),
    CustomerID INT,
    FOREIGN KEY (CustomerID) REFERENCES Customers(UserID)
);

CREATE TABLE ServiceRequests (
    RequestID INT AUTO_INCREMENT PRIMARY KEY,
    ServiceType VARCHAR(100),
    Description TEXT,
    RejectionReason TEXT,
    RequestDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('Pending','Approved','Rejected','InProgress','Completed') DEFAULT 'Pending',
    IsEmergency BOOLEAN DEFAULT FALSE,
    VehicleID INT,
    GarageID INT,
    FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID),
    FOREIGN KEY (GarageID) REFERENCES Garages(GarageID)
);

CREATE TABLE MechanicAssignments (
    AssignmentID INT AUTO_INCREMENT PRIMARY KEY,
    RequestID INT,
    MechanicID INT,
    AssignedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CompletionDate TIMESTAMP NULL,
    Status ENUM('Assigned','InProgress','Completed') DEFAULT 'Assigned',
    FOREIGN KEY (RequestID) REFERENCES ServiceRequests(RequestID),
    FOREIGN KEY (MechanicID) REFERENCES Mechanics(UserID)
);


CREATE TABLE Inventory (
    ItemID INT AUTO_INCREMENT PRIMARY KEY,
    ItemName VARCHAR(100),
    Quantity INT CHECK (Quantity >= 0),
    UnitPrice DECIMAL(10,2),
    GarageID INT,
    FOREIGN KEY (GarageID) REFERENCES Garages(GarageID)
);

CREATE TABLE InventoryRequests (
    RequestID INT AUTO_INCREMENT PRIMARY KEY,
    MechanicID INT,
    ItemID INT,
    QuantityRequested INT,
    Status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
    FOREIGN KEY (MechanicID) REFERENCES Mechanics(UserID),
    FOREIGN KEY (ItemID) REFERENCES Inventory(ItemID)
);


CREATE TABLE Payments (
    PaymentID INT AUTO_INCREMENT PRIMARY KEY,
    Amount DECIMAL(10,2),
    PaymentMethod ENUM('Cash','Chapa'),
    PaymentStatus ENUM('Pending','Completed') DEFAULT 'Pending',
    PaymentDate TIMESTAMP,
    RequestID INT UNIQUE,
    FOREIGN KEY (RequestID) REFERENCES ServiceRequests(RequestID)
);


CREATE TABLE Reviews (
    ReviewID INT AUTO_INCREMENT PRIMARY KEY,
    Rating INT CHECK (Rating BETWEEN 1 AND 5),
    Comment TEXT,
    ReviewDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CustomerID INT,
    GarageID INT,
    FOREIGN KEY (CustomerID) REFERENCES Customers(UserID),
    FOREIGN KEY (GarageID) REFERENCES Garages(GarageID)
);


CREATE TABLE Complaints (
    ComplaintID INT AUTO_INCREMENT PRIMARY KEY,
    CustomerID INT,
    GarageID INT,
    Description TEXT,
    Status ENUM('Pending','Reviewed','Resolved') DEFAULT 'Pending',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ResolvedBy INT,
    FOREIGN KEY (CustomerID) REFERENCES Customers(UserID),
    FOREIGN KEY (GarageID) REFERENCES Garages(GarageID),
    FOREIGN KEY (ResolvedBy) REFERENCES Users(UserID)
);

CREATE TABLE Notifications (
    NotificationID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    Title VARCHAR(255),
    Message TEXT,
    Type VARCHAR(50),
    IsRead BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

CREATE TABLE PushTokens (
    TokenID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT UNIQUE,
    Token VARCHAR(255) UNIQUE,
    DeviceType VARCHAR(50),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

CREATE TABLE PasswordResets (
    ResetID INT AUTO_INCREMENT PRIMARY KEY,
    Email VARCHAR(100) NOT NULL,
    OTP VARCHAR(10) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ExpiresAt TIMESTAMP NOT NULL
);

CREATE TRIGGER limit_mechanic_jobs
BEFORE INSERT ON MechanicAssignments
FOR EACH ROW
BEGIN
    DECLARE active_jobs INT;
    SELECT COUNT(*) INTO active_jobs
    FROM MechanicAssignments
    WHERE MechanicID = NEW.MechanicID
    AND Status IN ('Assigned','InProgress');

    IF active_jobs >= 5 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Mechanic cannot have more than 5 active jobs';
    END IF;
END;

-- DELIMITER $$

-- CREATE TRIGGER limit_mechanic_jobs
-- BEFORE INSERT ON MechanicAssignments
-- FOR EACH ROW
-- BEGIN
--     DECLARE active_jobs INT;

--     SELECT COUNT(*) INTO active_jobs
--     FROM MechanicAssignments
--     WHERE MechanicID = NEW.MechanicID
--     AND Status IN ('Assigned','InProgress');

--     IF active_jobs >= 5 THEN
--         SIGNAL SQLSTATE '45000'
--         SET MESSAGE_TEXT = 'Mechanic cannot have more than 5 active jobs';
--     END IF;
-- END$$

-- CREATE TRIGGER prevent_completion_without_payment
-- BEFORE UPDATE ON ServiceRequests
-- FOR EACH ROW
-- BEGIN
--     DECLARE payment_status VARCHAR(20);

--     IF NEW.Status = 'Completed' THEN
--         SELECT PaymentStatus INTO payment_status
--         FROM Payments
--         WHERE RequestID = NEW.RequestID;

--         IF payment_status IS NULL OR payment_status != 'Completed' THEN
--             SIGNAL SQLSTATE '45000'
--             SET MESSAGE_TEXT = 'Cannot complete service without payment';
--         END IF;
--     END IF;
-- END$$

-- -- Review only after completion
-- CREATE TRIGGER review_after_completion
-- BEFORE INSERT ON Reviews
-- FOR EACH ROW
-- BEGIN
--     DECLARE completed_count INT;

--     SELECT COUNT(*) INTO completed_count
--     FROM ServiceRequests SR
--     JOIN Vehicles V ON SR.VehicleID = V.VehicleID
--     WHERE V.CustomerID = NEW.CustomerID
--     AND SR.Status = 'Completed';

--     IF completed_count = 0 THEN
--         SIGNAL SQLSTATE '45000'
--         SET MESSAGE_TEXT = 'Review allowed only after service completion';
--     END IF;
-- END$$

-- DELIMITER ;
