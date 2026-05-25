-- GMS Full Database Schema for Integration Testing

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `accountants`;
CREATE TABLE `accountants` (
  `UserID` int(11) NOT NULL,
  `GarageID` int(11) DEFAULT NULL,
  PRIMARY KEY (`UserID`),
  KEY `GarageID` (`GarageID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `complaintmessages`;
CREATE TABLE `complaintmessages` (
  `MessageID` int(11) NOT NULL AUTO_INCREMENT,
  `ComplaintID` int(11) NOT NULL,
  `SenderID` int(11) NOT NULL,
  `Message` text NOT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MessageID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `complaints`;
CREATE TABLE `complaints` (
  `ComplaintID` int(11) NOT NULL AUTO_INCREMENT,
  `CustomerID` int(11) DEFAULT NULL,
  `GarageID` int(11) DEFAULT NULL,
  `Description` text,
  `Status` enum('Pending','Reviewed','Resolved') DEFAULT 'Pending',
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ResolvedBy` int(11) DEFAULT NULL,
  `IsEscalated` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`ComplaintID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `UserID` int(11) NOT NULL,
  PRIMARY KEY (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `garagemanagers`;
CREATE TABLE `garagemanagers` (
  `UserID` int(11) NOT NULL,
  `GarageID` int(11) DEFAULT NULL,
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `GarageID` (`GarageID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `garageowners`;
CREATE TABLE `garageowners` (
  `UserID` int(11) NOT NULL,
  `GarageID` int(11) DEFAULT NULL,
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `GarageID` (`GarageID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `garages`;
CREATE TABLE `garages` (
  `GarageID` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) DEFAULT NULL,
  `Location` varchar(255) DEFAULT NULL,
  `ContactNumber` varchar(20) DEFAULT NULL,
  `Status` enum('Active','Inactive') DEFAULT 'Active',
  `ManagerID` int(11) DEFAULT NULL,
  `OwnerID` int(11) DEFAULT NULL,
  `BankCode` varchar(50) DEFAULT NULL,
  `BankAccountNumber` varchar(50) DEFAULT NULL,
  `BankAccountName` varchar(100) DEFAULT NULL,
  `ChapaSubaccountID` varchar(150) DEFAULT NULL,
  `WorkingHours` json DEFAULT NULL,
  `Timezone` varchar(64) DEFAULT 'Africa/Addis_Ababa',
  `PreserviceDepositPercentage` decimal(5,2) NOT NULL DEFAULT '0.00',
  `EmergencyDepositPercentage` decimal(5,2) DEFAULT '10.00',
  `Images` json DEFAULT NULL,
  `LogoUrl` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`GarageID`),
  UNIQUE KEY `ManagerID` (`ManagerID`),
  UNIQUE KEY `BankAccountNumber` (`BankAccountNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `garageservices`;
CREATE TABLE `garageservices` (
  `ServiceID` int(11) NOT NULL AUTO_INCREMENT,
  `ServiceName` varchar(100) DEFAULT NULL,
  `Price` decimal(10,2) DEFAULT NULL,
  `GarageID` int(11) DEFAULT NULL,
  PRIMARY KEY (`ServiceID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `inventory`;
CREATE TABLE `inventory` (
  `ItemID` int(11) NOT NULL AUTO_INCREMENT,
  `ItemName` varchar(100) DEFAULT NULL,
  `Quantity` int(11) DEFAULT NULL,
  `UnitPrice` decimal(10,2) DEFAULT NULL,
  `SellingPrice` decimal(10,2) DEFAULT '0.00',
  `SupplierName` varchar(100) DEFAULT NULL,
  `SupplierEmail` varchar(100) DEFAULT NULL,
  `SupplierPhone` varchar(20) DEFAULT NULL,
  `GarageID` int(11) DEFAULT NULL,
  PRIMARY KEY (`ItemID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `inventoryrequests`;
CREATE TABLE `inventoryrequests` (
  `RequestID` int(11) NOT NULL AUTO_INCREMENT,
  `MechanicID` int(11) DEFAULT NULL,
  `ItemID` int(11) DEFAULT NULL,
  `QuantityRequested` int(11) DEFAULT NULL,
  `Status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  PRIMARY KEY (`RequestID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `mechanicassignments`;
CREATE TABLE `mechanicassignments` (
  `AssignmentID` int(11) NOT NULL AUTO_INCREMENT,
  `RequestID` int(11) DEFAULT NULL,
  `MechanicID` int(11) DEFAULT NULL,
  `AssignedDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `CompletionDate` timestamp NULL DEFAULT NULL,
  `Status` enum('Assigned','InProgress','Arrived','Working','Completed') DEFAULT 'Assigned',
  PRIMARY KEY (`AssignmentID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `mechanics`;
CREATE TABLE `mechanics` (
  `UserID` int(11) NOT NULL,
  `GarageID` int(11) DEFAULT NULL,
  PRIMARY KEY (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `mechanicskills`;
CREATE TABLE `mechanicskills` (
  `SkillID` int(11) NOT NULL AUTO_INCREMENT,
  `MechanicID` int(11) DEFAULT NULL,
  `SkillName` varchar(100) NOT NULL,
  PRIMARY KEY (`SkillID`),
  UNIQUE KEY `unique_skill` (`MechanicID`,`SkillName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `NotificationID` int(11) NOT NULL AUTO_INCREMENT,
  `UserID` int(11) DEFAULT NULL,
  `Title` varchar(255) DEFAULT NULL,
  `Message` text,
  `Type` varchar(50) DEFAULT NULL,
  `IsRead` tinyint(1) DEFAULT '0',
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`NotificationID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `passwordresets`;
CREATE TABLE `passwordresets` (
  `ResetID` int(11) NOT NULL AUTO_INCREMENT,
  `Email` varchar(100) NOT NULL,
  `OTP` varchar(10) NOT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ExpiresAt` datetime NOT NULL,
  PRIMARY KEY (`ResetID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `PaymentID` int(11) NOT NULL AUTO_INCREMENT,
  `Amount` decimal(10,2) DEFAULT NULL,
  `PaymentMethod` enum('Cash','Chapa') DEFAULT NULL,
  `PaymentCategory` enum('Deposit','Final') DEFAULT 'Final',
  `PaymentStatus` enum('Pending','Completed') DEFAULT 'Pending',
  `PaymentDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `RequestID` int(11) DEFAULT NULL,
  `TransactionRef` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`PaymentID`),
  UNIQUE KEY `TransactionRef` (`TransactionRef`),
  UNIQUE KEY `unique_req_cat` (`RequestID`,`PaymentCategory`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `pushtokens`;
CREATE TABLE `pushtokens` (
  `TokenID` int(11) NOT NULL AUTO_INCREMENT,
  `UserID` int(11) DEFAULT NULL,
  `Token` varchar(255) DEFAULT NULL,
  `DeviceType` varchar(50) DEFAULT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`TokenID`),
  UNIQUE KEY `UserID` (`UserID`),
  UNIQUE KEY `Token` (`Token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `registration_otps`;
CREATE TABLE `registration_otps` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Email` varchar(255) NOT NULL,
  `OTP` varchar(6) NOT NULL,
  `ExpiresAt` datetime NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `Email` (`Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `ReviewID` int(11) NOT NULL AUTO_INCREMENT,
  `Rating` int(11) DEFAULT NULL,
  `Comment` text,
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `CustomerID` int(11) DEFAULT NULL,
  `GarageID` int(11) DEFAULT NULL,
  `RequestID` int(11) DEFAULT NULL,
  PRIMARY KEY (`ReviewID`),
  UNIQUE KEY `unique_request_review` (`RequestID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `serviceitems`;
CREATE TABLE `serviceitems` (
  `ServiceItemID` int(11) NOT NULL AUTO_INCREMENT,
  `RequestID` int(11) DEFAULT NULL,
  `ItemID` int(11) DEFAULT NULL,
  `QuantityUsed` int(11) NOT NULL,
  PRIMARY KEY (`ServiceItemID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `servicerequests`;
CREATE TABLE `servicerequests` (
  `RequestID` int(11) NOT NULL AUTO_INCREMENT,
  `ServiceType` varchar(100) DEFAULT NULL,
  `Description` text,
  `RequestDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Status` varchar(50) DEFAULT 'pending',
  `IsEmergency` tinyint(1) DEFAULT '0',
  `EstimatedPrice` decimal(10,2) DEFAULT NULL,
  `EmergencyStatus` enum('Pending','OfferSent','Accepted','Rejected') DEFAULT NULL,
  `VehicleID` int(11) DEFAULT NULL,
  `GarageID` int(11) DEFAULT NULL,
  `RejectionReason` text,
  `BookingDate` date DEFAULT NULL,
  `DropOffTime` time DEFAULT NULL,
  `EstimatedDuration` decimal(5,2) DEFAULT '1.00',
  `CustomerHidden` tinyint(1) DEFAULT '0',
  `DepositAmount` decimal(10,2) DEFAULT '0.00',
  `IsDepositPaid` tinyint(1) DEFAULT '0',
  `DepositPercentage` int(11) DEFAULT NULL,
  `CustomerStatus` text,
  `Latitude` decimal(10,8) DEFAULT NULL,
  `Longitude` decimal(11,8) DEFAULT NULL,
  `Address` varchar(255) DEFAULT NULL,
  `ReviewSkipped` tinyint(1) DEFAULT '0',
  `IssueImage` longtext,
  PRIMARY KEY (`RequestID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `superadmins`;
CREATE TABLE `superadmins` (
  `UserID` int(11) NOT NULL,
  PRIMARY KEY (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `UserID` int(11) NOT NULL AUTO_INCREMENT,
  `FullName` varchar(100) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `PhoneNumber` varchar(20) NOT NULL,
  `PasswordHash` varchar(255) NOT NULL,
  `Role` enum('Customer','Mechanic','GarageManager','GarageOwner','SuperAdmin','Accountant') DEFAULT 'Customer',
  `Status` enum('Active','Suspended','Pending') DEFAULT 'Active',
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `Email` (`Email`),
  UNIQUE KEY `PhoneNumber` (`PhoneNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `vehicles`;
CREATE TABLE `vehicles` (
  `VehicleID` int(11) NOT NULL AUTO_INCREMENT,
  `CustomerID` int(11) DEFAULT NULL,
  `PlateNumber` varchar(20) NOT NULL,
  `Model` varchar(100) DEFAULT NULL,
  `Year` int(11) DEFAULT NULL,
  `ChassisNumber` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`VehicleID`),
  UNIQUE KEY `PlateNumber` (`PlateNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

SET FOREIGN_KEY_CHECKS = 1;
