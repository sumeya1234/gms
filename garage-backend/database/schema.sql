SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS serviceitems;
DROP TABLE IF EXISTS complaintmessages;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS garageservices;
DROP TABLE IF EXISTS inventoryrequests;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS mechanicassignments;
DROP TABLE IF EXISTS servicerequests;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS mechanics;
DROP TABLE IF EXISTS accountants;
DROP TABLE IF EXISTS garagemanagers;
DROP TABLE IF EXISTS garageowners;
DROP TABLE IF EXISTS superadmins;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS garages;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS pushtokens;
DROP TABLE IF EXISTS passwordresets;
DROP TABLE IF EXISTS systemconfigs;

SET FOREIGN_KEY_CHECKS = 1;


CREATE TABLE users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    PhoneNumber VARCHAR(20) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Role ENUM('Customer','Mechanic','GarageManager','GarageOwner','Accountant','SuperAdmin') NOT NULL,
    Status ENUM('Active','Inactive','Suspended','Archived') DEFAULT 'Active',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customers (
    UserID INT PRIMARY KEY,
    FOREIGN KEY (UserID) REFERENCES users(UserID) ON DELETE CASCADE
);

CREATE TABLE superadmins (
    UserID INT PRIMARY KEY,
    FOREIGN KEY (UserID) REFERENCES users(UserID)
);

CREATE TABLE garages (
    GarageID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100),
    Location VARCHAR(255),
    ContactNumber VARCHAR(20),
    BankCode VARCHAR(50) NULL,
    BankAccountNumber VARCHAR(50) NULL,
    BankAccountName VARCHAR(100) NULL,
    ChapaSubaccountID VARCHAR(100) NULL,
    WorkingHours JSON NULL,
    Timezone VARCHAR(64) DEFAULT 'Africa/Addis_Ababa',
    EmergencyDepositPercentage DECIMAL(5,2) DEFAULT 10.00,
    Status ENUM('Active','Inactive') DEFAULT 'Active',
    ManagerID INT UNIQUE
);

CREATE TABLE garagemanagers (
    UserID INT PRIMARY KEY,
    GarageID INT UNIQUE,
    FOREIGN KEY (UserID) REFERENCES users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (GarageID) REFERENCES garages(GarageID) ON DELETE CASCADE
);

CREATE TABLE garageowners (
    UserID INT PRIMARY KEY,
    GarageID INT UNIQUE,
    FOREIGN KEY (UserID) REFERENCES users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (GarageID) REFERENCES garages(GarageID) ON DELETE CASCADE
);

ALTER TABLE garages
ADD FOREIGN KEY (ManagerID) REFERENCES garagemanagers(UserID);

CREATE TABLE mechanics (
    UserID INT PRIMARY KEY,
    GarageID INT,
    FOREIGN KEY (UserID) REFERENCES users(UserID),
    FOREIGN KEY (GarageID) REFERENCES garages(GarageID)
);

CREATE TABLE accountants (
    UserID INT PRIMARY KEY,
    GarageID INT,
    FOREIGN KEY (UserID) REFERENCES users(UserID),
    FOREIGN KEY (GarageID) REFERENCES garages(GarageID)
);

CREATE TABLE vehicles (
    VehicleID INT AUTO_INCREMENT PRIMARY KEY,
    PlateNumber VARCHAR(20) UNIQUE,
    Type VARCHAR(50),
    Model VARCHAR(50),
    CustomerID INT,
    FOREIGN KEY (CustomerID) REFERENCES customers(UserID)
);

CREATE TABLE servicerequests (
    RequestID INT AUTO_INCREMENT PRIMARY KEY,
    ServiceType VARCHAR(100),
    Description TEXT,
    RejectionReason TEXT,
    RequestDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    BookingDate DATE,
    DropOffTime TIME,
    EstimatedDuration DECIMAL(5,2),
    Status ENUM('Pending','Approved','Rejected','InProgress','Completed') DEFAULT 'Pending',
    IsEmergency BOOLEAN DEFAULT FALSE,
    VehicleID INT,
    GarageID INT,
    CustomerHidden BOOLEAN DEFAULT FALSE,
    CustomerStatus VARCHAR(50) NULL,
    EstimatedPrice DECIMAL(10,2) NULL,
    DepositPercentage DECIMAL(5,2) NULL,
    IsDepositPaid BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (VehicleID) REFERENCES vehicles(VehicleID),
    FOREIGN KEY (GarageID) REFERENCES garages(GarageID)
);

CREATE TABLE inventory (
    ItemID INT AUTO_INCREMENT PRIMARY KEY,
    ItemName VARCHAR(100),
    Quantity INT CHECK (Quantity >= 0),
    UnitPrice DECIMAL(10,2),
    SupplierName VARCHAR(100) NULL,
    SupplierEmail VARCHAR(100) NULL,
    SupplierPhone VARCHAR(20) NULL,
    GarageID INT,
    FOREIGN KEY (GarageID) REFERENCES garages(GarageID)
);

CREATE TABLE serviceitems (
    RequestID INT,
    ItemID INT,
    QuantityUsed INT,
    PRIMARY KEY (RequestID, ItemID),
    FOREIGN KEY (RequestID) REFERENCES servicerequests(RequestID) ON DELETE CASCADE,
    FOREIGN KEY (ItemID) REFERENCES inventory(ItemID) ON DELETE CASCADE
);

CREATE TABLE mechanicassignments (
    AssignmentID INT AUTO_INCREMENT PRIMARY KEY,
    RequestID INT,
    MechanicID INT,
    AssignedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CompletionDate TIMESTAMP NULL,
    Status ENUM('Assigned','InProgress','Completed') DEFAULT 'Assigned',
    FOREIGN KEY (RequestID) REFERENCES servicerequests(RequestID),
    FOREIGN KEY (MechanicID) REFERENCES mechanics(UserID)
);

CREATE TABLE garageservices (
    ServiceID INT AUTO_INCREMENT PRIMARY KEY,
    ServiceName VARCHAR(100),
    Price DECIMAL(10,2),
    GarageID INT,
    FOREIGN KEY (GarageID) REFERENCES garages(GarageID) ON DELETE CASCADE
);

CREATE TABLE inventoryrequests (
    RequestID INT AUTO_INCREMENT PRIMARY KEY,
    MechanicID INT,
    ItemID INT,
    QuantityRequested INT,
    Status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
    FOREIGN KEY (MechanicID) REFERENCES mechanics(UserID),
    FOREIGN KEY (ItemID) REFERENCES inventory(ItemID)
);

CREATE TABLE payments (
    PaymentID INT AUTO_INCREMENT PRIMARY KEY,
    Amount DECIMAL(10,2),
    PaymentMethod ENUM('Cash','Chapa'),
    PaymentCategory ENUM('Deposit', 'Final') DEFAULT 'Final',
    PaymentStatus ENUM('Pending','Completed') DEFAULT 'Pending',
    PaymentDate TIMESTAMP,
    RequestID INT,
    TransactionRef VARCHAR(100) UNIQUE,
    FOREIGN KEY (RequestID) REFERENCES servicerequests(RequestID),
    UNIQUE (RequestID, PaymentCategory)
);

CREATE TABLE reviews (
    ReviewID INT AUTO_INCREMENT PRIMARY KEY,
    Rating INT CHECK (Rating BETWEEN 1 AND 5),
    Comment TEXT,
    ReviewDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CustomerID INT,
    GarageID INT,
    RequestID INT UNIQUE,
    FOREIGN KEY (CustomerID) REFERENCES customers(UserID),
    FOREIGN KEY (GarageID) REFERENCES garages(GarageID),
    FOREIGN KEY (RequestID) REFERENCES servicerequests(RequestID)
);

CREATE TABLE complaints (
    ComplaintID INT AUTO_INCREMENT PRIMARY KEY,
    CustomerID INT,
    GarageID INT,
    Description TEXT,
    IsEscalated BOOLEAN DEFAULT FALSE,
    Status ENUM('Pending','Reviewed','Resolved') DEFAULT 'Pending',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ResolvedBy INT,
    FOREIGN KEY (CustomerID) REFERENCES customers(UserID) ON DELETE CASCADE,
    FOREIGN KEY (GarageID) REFERENCES garages(GarageID) ON DELETE CASCADE,
    FOREIGN KEY (ResolvedBy) REFERENCES users(UserID) ON DELETE SET NULL
);

CREATE TABLE complaintmessages (
    MessageID INT AUTO_INCREMENT PRIMARY KEY,
    ComplaintID INT NOT NULL,
    SenderID INT NOT NULL,
    Message TEXT NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ComplaintID) REFERENCES complaints(ComplaintID) ON DELETE CASCADE,
    FOREIGN KEY (SenderID) REFERENCES users(UserID) ON DELETE CASCADE
);

CREATE TABLE notifications (
    NotificationID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    Title VARCHAR(255),
    Message TEXT,
    Type VARCHAR(50),
    IsRead BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES users(UserID) ON DELETE CASCADE
);

CREATE TABLE pushtokens (
    TokenID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT UNIQUE,
    Token VARCHAR(255) UNIQUE,
    DeviceType VARCHAR(50),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES users(UserID) ON DELETE CASCADE
);

CREATE TABLE passwordresets (
    ResetID INT AUTO_INCREMENT PRIMARY KEY,
    Email VARCHAR(100) NOT NULL,
    OTP VARCHAR(10) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ExpiresAt DATETIME NOT NULL
);

CREATE TRIGGER limit_mechanic_jobs
BEFORE INSERT ON mechanicassignments
FOR EACH ROW
BEGIN
    DECLARE active_jobs INT;
    SELECT COUNT(*) INTO active_jobs
    FROM mechanicassignments
    WHERE MechanicID = NEW.MechanicID
    AND Status IN ('Assigned','InProgress');

    IF active_jobs >= 5 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Mechanic cannot have more than 5 active jobs';
    END IF;
END;

CREATE TABLE systemconfigs (
    ConfigKey VARCHAR(100) PRIMARY KEY,
    ConfigValue JSON NOT NULL,
    Description TEXT,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO systemconfigs (ConfigKey, ConfigValue, Description) VALUES
('service_duration_baselines', '{
    "oil change": 0.5,
    "diagnostics": 1.5,
    "tires": 1.0,
    "battery": 0.5,
    "electrical": 2.0,
    "repair": 3.0,
    "towing": 2.0,
    "default": 1.0
}', 'Calculated duration in hours for various service types'),
('garage_capacity_settings', '{
    "daily_labor_hours_per_mechanic": 8.0,
    "max_dropoff_per_hour": 2
}', 'Global settings for garage availability and capacity');
