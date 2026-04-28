-- MySQL dump 10.13  Distrib 8.4.8, for Win64 (x86_64)
--
-- Host: localhost    Database: gms
-- ------------------------------------------------------
-- Server version	5.7.24

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `accountants`
--

DROP TABLE IF EXISTS `accountants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accountants` (
  `UserID` int(11) NOT NULL,
  `GarageID` int(11) DEFAULT NULL,
  PRIMARY KEY (`UserID`),
  KEY `GarageID` (`GarageID`),
  CONSTRAINT `accountants_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`),
  CONSTRAINT `accountants_ibfk_2` FOREIGN KEY (`GarageID`) REFERENCES `garages` (`GarageID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accountants`
--

LOCK TABLES `accountants` WRITE;
/*!40000 ALTER TABLE `accountants` DISABLE KEYS */;
INSERT INTO `accountants` VALUES (47,1),(41,2),(54,2);
/*!40000 ALTER TABLE `accountants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaintmessages`
--

DROP TABLE IF EXISTS `complaintmessages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaintmessages` (
  `MessageID` int(11) NOT NULL AUTO_INCREMENT,
  `ComplaintID` int(11) NOT NULL,
  `SenderID` int(11) NOT NULL,
  `Message` text NOT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MessageID`),
  KEY `ComplaintID` (`ComplaintID`),
  KEY `SenderID` (`SenderID`),
  CONSTRAINT `complaintmessages_ibfk_1` FOREIGN KEY (`ComplaintID`) REFERENCES `complaints` (`ComplaintID`) ON DELETE CASCADE,
  CONSTRAINT `complaintmessages_ibfk_2` FOREIGN KEY (`SenderID`) REFERENCES `users` (`UserID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaintmessages`
--

LOCK TABLES `complaintmessages` WRITE;
/*!40000 ALTER TABLE `complaintmessages` DISABLE KEYS */;
INSERT INTO `complaintmessages` VALUES (1,7,23,'Sorry for that.','2026-04-13 14:29:02');
/*!40000 ALTER TABLE `complaintmessages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaints`
--

DROP TABLE IF EXISTS `complaints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaints` (
  `ComplaintID` int(11) NOT NULL AUTO_INCREMENT,
  `CustomerID` int(11) DEFAULT NULL,
  `GarageID` int(11) DEFAULT NULL,
  `Description` text,
  `Status` enum('Pending','Reviewed','Resolved') DEFAULT 'Pending',
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ResolvedBy` int(11) DEFAULT NULL,
  `IsEscalated` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`ComplaintID`),
  KEY `CustomerID` (`CustomerID`),
  KEY `GarageID` (`GarageID`),
  KEY `ResolvedBy` (`ResolvedBy`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaints`
--

LOCK TABLES `complaints` WRITE;
/*!40000 ALTER TABLE `complaints` DISABLE KEYS */;
INSERT INTO `complaints` VALUES (1,4,1,'The mechanic arrived late and missed some issues.','Resolved','2026-04-04 15:09:52',3,0),(2,13,4,'Hjnvgjnvhmkvg','Resolved','2026-04-05 14:24:14',25,0),(3,13,5,'Ztbjncghiikv','Pending','2026-04-05 14:27:34',NULL,0),(4,13,5,'The mechanic arrived late','Pending','2026-04-05 14:29:55',NULL,0),(5,13,1,'Cybcgjcthji','Resolved','2026-04-05 14:36:10',2,0),(7,31,6,'Bad service','Resolved','2026-04-13 14:28:26',23,0);
/*!40000 ALTER TABLE `complaints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `UserID` int(11) NOT NULL,
  PRIMARY KEY (`UserID`),
  CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (4),(5),(6),(7),(8),(11),(12),(13),(14),(31);
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `garagemanagers`
--

DROP TABLE IF EXISTS `garagemanagers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `garagemanagers` (
  `UserID` int(11) NOT NULL,
  `GarageID` int(11) DEFAULT NULL,
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `GarageID` (`GarageID`),
  CONSTRAINT `garagemanagers_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`),
  CONSTRAINT `garagemanagers_ibfk_2` FOREIGN KEY (`GarageID`) REFERENCES `garages` (`GarageID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `garagemanagers`
--

LOCK TABLES `garagemanagers` WRITE;
/*!40000 ALTER TABLE `garagemanagers` DISABLE KEYS */;
INSERT INTO `garagemanagers` VALUES (3,NULL),(2,1),(5,2),(25,4),(24,5),(23,6),(20,7),(21,8);
/*!40000 ALTER TABLE `garagemanagers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `garageowners`
--

DROP TABLE IF EXISTS `garageowners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `garageowners` (
  `UserID` int(11) NOT NULL,
  `GarageID` int(11) DEFAULT NULL,
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `GarageID` (`GarageID`),
  CONSTRAINT `garageowners_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`),
  CONSTRAINT `garageowners_ibfk_2` FOREIGN KEY (`GarageID`) REFERENCES `garages` (`GarageID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `garageowners`
--

LOCK TABLES `garageowners` WRITE;
/*!40000 ALTER TABLE `garageowners` DISABLE KEYS */;
INSERT INTO `garageowners` VALUES (56,2),(55,5),(23,6),(38,7),(39,8);
/*!40000 ALTER TABLE `garageowners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `garages`
--

DROP TABLE IF EXISTS `garages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `garages` (
  `GarageID` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) DEFAULT NULL,
  `Location` varchar(255) DEFAULT NULL,
  `ContactNumber` varchar(20) DEFAULT NULL,
  `Status` enum('Active','Inactive') DEFAULT NULL,
  `ManagerID` int(11) DEFAULT NULL,
  `BankCode` varchar(50) DEFAULT NULL,
  `BankAccountNumber` varchar(50) DEFAULT NULL,
  `BankAccountName` varchar(100) DEFAULT NULL,
  `ChapaSubaccountID` varchar(150) DEFAULT NULL,
  `WorkingHours` json DEFAULT NULL,
  `PreserviceDepositPercentage` decimal(5,2) NOT NULL DEFAULT '0.00',
  `OwnerID` int(11) DEFAULT NULL,
  `EmergencyDepositPercentage` decimal(5,2) DEFAULT '10.00',
  PRIMARY KEY (`GarageID`),
  UNIQUE KEY `ManagerID` (`ManagerID`),
  KEY `OwnerID` (`OwnerID`),
  CONSTRAINT `garages_ibfk_1` FOREIGN KEY (`ManagerID`) REFERENCES `garagemanagers` (`UserID`),
  CONSTRAINT `garages_ibfk_2` FOREIGN KEY (`OwnerID`) REFERENCES `users` (`UserID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `garages`
--

LOCK TABLES `garages` WRITE;
/*!40000 ALTER TABLE `garages` DISABLE KEYS */;
INSERT INTO `garages` VALUES (1,'Garage A','Uptown','0123456789',NULL,2,'128','0900123456','Test Account','test-sub-1776782253266-y85nm3',NULL,0.00,38,10.00),(2,'Garage G ','Gerji','0900123456',NULL,5,'128','10000676676767','Garage G','test-sub-1776916514217-3w6v54','{\"friday\": {\"open\": \"08:00\", \"close\": \"18:00\", \"isOpen\": true}, \"monday\": {\"open\": \"08:00\", \"close\": \"18:00\", \"isOpen\": true}, \"sunday\": {\"open\": null, \"close\": null, \"isOpen\": false}, \"tuesday\": {\"open\": \"08:00\", \"close\": \"18:00\", \"isOpen\": true}, \"saturday\": {\"open\": \"09:00\", \"close\": \"14:00\", \"isOpen\": true}, \"thursday\": {\"open\": \"08:00\", \"close\": \"18:00\", \"isOpen\": true}, \"wednesday\": {\"open\": \"08:00\", \"close\": \"18:00\", \"isOpen\": true}}',5.00,39,10.00),(4,'AutoFix Hub','Downtown','0911223344',NULL,25,NULL,NULL,NULL,NULL,NULL,0.00,NULL,10.00),(5,'Speedy Garage','Boole','0922334455',NULL,24,NULL,NULL,NULL,NULL,NULL,0.00,NULL,10.00),(6,'Prime Motors Service','Kazanchis','0933445566',NULL,23,'301','0900112233','Prime Motors Service','test-sub-1776796928864-nnmbeo','{\"sunday\": \"Closed\", \"saturday\": \"10:00 AM - 02:00 PM\", \"monday_friday\": \"08:00 AM - 06:00 PM\"}',0.00,12,10.00),(7,'City Auto Care','Piassa','0944556677',NULL,20,NULL,NULL,NULL,NULL,NULL,0.00,NULL,10.00),(8,'Elite Car Repair','Ayer Tena','0955667788',NULL,21,NULL,NULL,NULL,NULL,NULL,0.00,NULL,10.00);
/*!40000 ALTER TABLE `garages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `garageservices`
--

DROP TABLE IF EXISTS `garageservices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `garageservices` (
  `ServiceID` int(11) NOT NULL AUTO_INCREMENT,
  `ServiceName` varchar(100) DEFAULT NULL,
  `Price` decimal(10,2) DEFAULT NULL,
  `GarageID` int(11) DEFAULT NULL,
  PRIMARY KEY (`ServiceID`),
  KEY `GarageID` (`GarageID`),
  CONSTRAINT `garageservices_ibfk_1` FOREIGN KEY (`GarageID`) REFERENCES `garages` (`GarageID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `garageservices`
--

LOCK TABLES `garageservices` WRITE;
/*!40000 ALTER TABLE `garageservices` DISABLE KEYS */;
INSERT INTO `garageservices` VALUES (1,'Battery Replacement',7000.00,7),(2,'Full Synthetic Oil Change',3500.00,7),(3,'Brake Fluid Flush',2000.00,7),(4,'Tire Rotation & Balance',1000.00,7),(5,'Brake pad replacement',2000.00,6),(6,'Towing',1300.00,1),(7,'Diagnostics',700.00,1),(8,'Tires',1700.00,1),(9,'Oil Change',1000.00,1),(10,'Repair',2550.00,1),(11,'Battery',2150.00,1),(12,'Electrical',1550.00,1),(13,'Towing',1350.00,2),(14,'Diagnostics',700.00,2),(15,'Tires',1800.00,2),(16,'Oil Change',1100.00,2),(17,'Repair',2700.00,2),(18,'Battery',2250.00,2),(19,'Electrical',1600.00,2),(20,'Towing',1650.00,4),(21,'Diagnostics',900.00,4),(22,'Tires',2200.00,4),(23,'Oil Change',1300.00,4),(24,'Repair',3300.00,4),(25,'Battery',2750.00,4),(26,'Electrical',2000.00,4),(27,'Towing',1450.00,5),(28,'Diagnostics',750.00,5),(29,'Tires',1900.00,5),(30,'Oil Change',1150.00,5),(31,'Repair',2850.00,5),(32,'Battery',2400.00,5),(33,'Electrical',1700.00,5),(34,'Towing',1800.00,6),(35,'Diagnostics',950.00,6),(36,'Tires',2400.00,6),(37,'Oil Change',1450.00,6),(38,'Repair',3600.00,6),(39,'Battery',3000.00,6),(40,'Electrical',2150.00,6),(41,'Towing',1700.00,7),(42,'Diagnostics',900.00,7),(43,'Tires',2300.00,7),(44,'Oil Change',1400.00,7),(45,'Repair',3450.00,7),(46,'Battery',2900.00,7),(47,'Electrical',2050.00,7),(48,'Towing',1950.00,8),(49,'Diagnostics',1050.00,8),(50,'Tires',2600.00,8),(51,'Oil Change',1550.00,8),(52,'Repair',3900.00,8),(53,'Battery',3250.00,8),(54,'Electrical',2350.00,8);
/*!40000 ALTER TABLE `garageservices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory` (
  `ItemID` int(11) NOT NULL AUTO_INCREMENT,
  `ItemName` varchar(100) DEFAULT NULL,
  `Quantity` int(11) DEFAULT NULL,
  `UnitPrice` decimal(10,2) DEFAULT NULL,
  `SupplierName` varchar(100) DEFAULT NULL,
  `SupplierContact` varchar(20) DEFAULT NULL,
  `SupplierEmail` varchar(100) DEFAULT NULL,
  `GarageID` int(11) DEFAULT NULL,
  `SupplierPhone` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`ItemID`),
  KEY `GarageID` (`GarageID`)
) ENGINE=InnoDB AUTO_INCREMENT=197 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
INSERT INTO `inventory` VALUES (1,'Engine Oil',261,15.50,NULL,NULL,NULL,1,NULL),(3,'Brake Pads',114,45.00,'Ahmed Yusuf',NULL,'ahmedyusuf@outlook.com',2,'0918212321'),(4,'Air Filter',160,12.75,NULL,NULL,NULL,3,NULL),(5,'Spark Plug',400,5.50,NULL,NULL,NULL,1,NULL),(7,'Engine Oil',120,15.50,NULL,NULL,NULL,2,NULL),(8,'Engine Oil',180,15.50,NULL,NULL,NULL,3,NULL),(10,'Brake Pads',75,45.00,NULL,NULL,NULL,4,NULL),(12,'Air Filter',105,12.75,NULL,NULL,NULL,5,NULL),(14,'Spark Plug',235,5.50,NULL,NULL,NULL,6,NULL),(15,'Clutch Kit',36,120.00,NULL,NULL,NULL,4,NULL),(16,'Clutch Kit',30,120.00,NULL,NULL,NULL,7,NULL),(17,'Battery 12V',60,85.99,NULL,NULL,NULL,5,NULL),(18,'Battery 12V',54,85.99,NULL,NULL,NULL,8,NULL),(19,'Radiator Coolant',177,10.00,NULL,NULL,NULL,6,NULL),(20,'Radiator Coolant',165,10.00,NULL,NULL,NULL,2,NULL),(21,'Fuel Pump',30,150.00,NULL,NULL,NULL,7,NULL),(22,'Fuel Pump',24,150.00,NULL,NULL,NULL,3,NULL),(23,'Oil Filter',240,8.25,NULL,NULL,NULL,2,NULL),(24,'Oil Filter',200,8.25,NULL,NULL,NULL,1,NULL),(25,'Timing Belt',75,60.00,NULL,NULL,NULL,3,NULL),(26,'Timing Belt',60,60.00,NULL,NULL,NULL,6,NULL),(27,'Headlight Bulb',210,6.00,NULL,NULL,NULL,8,NULL),(28,'Headlight Bulb',195,6.00,NULL,NULL,NULL,4,NULL),(29,'Alternator',36,200.00,NULL,NULL,NULL,1,NULL),(30,'Alternator',30,200.00,NULL,NULL,NULL,5,NULL),(31,'Shock Absorber',47,75.00,NULL,NULL,NULL,4,NULL),(32,'Shock Absorber',45,75.00,NULL,NULL,NULL,7,NULL),(33,'Windshield Wiper',146,9.50,NULL,NULL,NULL,6,NULL),(34,'Windshield Wiper',135,9.50,NULL,NULL,NULL,2,NULL),(35,'Starter Motor',27,180.00,NULL,NULL,NULL,5,NULL),(36,'Starter Motor',21,180.00,NULL,NULL,NULL,8,NULL),(37,'Transmission Fluid',134,14.00,NULL,NULL,NULL,7,NULL),(38,'Transmission Fluid',120,14.00,NULL,NULL,NULL,3,NULL),(39,'Brake Fluid',165,7.50,NULL,NULL,NULL,8,NULL),(40,'Brake Fluid',150,7.50,NULL,NULL,NULL,1,NULL),(41,'Exhaust Pipe',36,95.00,NULL,NULL,NULL,2,NULL),(42,'Exhaust Pipe',27,95.00,NULL,NULL,NULL,6,NULL),(43,'Wheel Bearing',84,22.00,NULL,NULL,NULL,3,NULL),(44,'Wheel Bearing',72,22.00,NULL,NULL,NULL,5,NULL),(45,'Car Tire',93,110.00,NULL,NULL,NULL,1,NULL),(46,'Car Tire',86,110.00,NULL,NULL,NULL,4,NULL),(47,'Side Mirror',40,30.00,NULL,NULL,NULL,4,NULL),(48,'Side Mirror',37,30.00,NULL,NULL,NULL,7,NULL),(49,'Horn',66,18.00,NULL,NULL,NULL,5,NULL),(50,'Horn',60,18.00,NULL,NULL,NULL,2,NULL),(51,'Fuse Set',262,4.00,NULL,NULL,NULL,6,NULL),(52,'Fuse Set',255,4.00,NULL,NULL,NULL,8,NULL),(53,'Radiator',33,140.00,NULL,NULL,NULL,7,NULL),(54,'Radiator',27,140.00,NULL,NULL,NULL,3,NULL),(55,'Drive Shaft',21,210.00,NULL,NULL,NULL,8,NULL),(56,'Drive Shaft',5,210.00,NULL,NULL,NULL,1,NULL),(57,'Door Handle',76,16.00,NULL,NULL,NULL,2,NULL),(58,'Door Handle',66,16.00,NULL,NULL,NULL,5,NULL),(59,'Fuel Injector',42,75.00,NULL,NULL,NULL,3,NULL),(60,'Fuel Injector',34,75.00,NULL,NULL,NULL,6,NULL),(61,'Camshaft Sensor',55,28.00,NULL,NULL,NULL,4,NULL),(62,'Camshaft Sensor',51,28.00,NULL,NULL,NULL,7,NULL),(63,'Oxygen Sensor',63,32.00,NULL,NULL,NULL,5,NULL),(64,'Oxygen Sensor',54,32.00,NULL,NULL,NULL,8,NULL),(65,'Steering Rack',18,250.00,NULL,NULL,NULL,6,NULL),(66,'Steering Rack',24,250.00,NULL,NULL,NULL,2,NULL),(67,'AC Compressor',21,300.00,NULL,NULL,NULL,7,NULL),(68,'AC Compressor',19,300.00,NULL,NULL,NULL,4,NULL),(192,'Pedal',5,250.00,NULL,NULL,NULL,2,NULL),(195,'Premium ENgine Diesel',200,650.00,NULL,NULL,NULL,2,NULL),(196,'Side Mirrors',1050,20100.00,'Beta Parts','011-223344','beta@example.com',1,'0918899767');
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventoryrequests`
--

DROP TABLE IF EXISTS `inventoryrequests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventoryrequests` (
  `RequestID` int(11) NOT NULL AUTO_INCREMENT,
  `MechanicID` int(11) DEFAULT NULL,
  `ItemID` int(11) DEFAULT NULL,
  `QuantityRequested` int(11) DEFAULT NULL,
  `Status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  PRIMARY KEY (`RequestID`),
  KEY `MechanicID` (`MechanicID`),
  KEY `ItemID` (`ItemID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventoryrequests`
--

LOCK TABLES `inventoryrequests` WRITE;
/*!40000 ALTER TABLE `inventoryrequests` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventoryrequests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mechanicassignments`
--

DROP TABLE IF EXISTS `mechanicassignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mechanicassignments` (
  `AssignmentID` int(11) NOT NULL AUTO_INCREMENT,
  `RequestID` int(11) DEFAULT NULL,
  `MechanicID` int(11) DEFAULT NULL,
  `AssignedDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `CompletionDate` timestamp NULL DEFAULT NULL,
  `Status` enum('Assigned','InProgress','Completed') DEFAULT 'Assigned',
  PRIMARY KEY (`AssignmentID`),
  KEY `RequestID` (`RequestID`),
  KEY `MechanicID` (`MechanicID`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mechanicassignments`
--

LOCK TABLES `mechanicassignments` WRITE;
/*!40000 ALTER TABLE `mechanicassignments` DISABLE KEYS */;
INSERT INTO `mechanicassignments` VALUES (1,1,1,'2026-04-04 12:40:14',NULL,'Completed'),(2,3,19,'2026-04-08 14:54:51',NULL,'Completed'),(3,9,19,'2026-04-08 14:55:07',NULL,'Completed'),(4,3,1,'2026-04-08 14:57:26',NULL,'InProgress'),(5,8,17,'2026-04-09 08:33:49',NULL,'Assigned'),(6,11,22,'2026-04-09 14:02:51',NULL,'Completed'),(7,7,22,'2026-04-10 15:50:53',NULL,'Completed'),(8,12,27,'2026-04-11 06:24:23',NULL,'Completed'),(9,16,27,'2026-04-11 06:43:42','2026-04-11 07:16:28','Completed'),(10,17,27,'2026-04-11 07:04:47','2026-04-11 07:05:58','Completed'),(11,18,27,'2026-04-11 07:42:06','2026-04-11 07:42:59','Completed'),(12,19,30,'2026-04-12 07:55:30','2026-04-12 07:56:31','Completed'),(13,20,30,'2026-04-12 10:50:31','2026-04-12 10:51:41','Completed'),(14,22,30,'2026-04-12 11:48:15','2026-04-12 11:49:00','Completed'),(15,21,30,'2026-04-12 11:48:21','2026-04-12 11:49:28','Completed'),(16,23,30,'2026-04-12 12:58:07','2026-04-12 12:58:54','Completed'),(17,24,30,'2026-04-12 13:05:42',NULL,'Assigned'),(18,25,30,'2026-04-12 13:06:28',NULL,'InProgress'),(19,28,30,'2026-04-12 13:08:40',NULL,'InProgress'),(20,29,30,'2026-04-12 13:08:49','2026-04-12 13:10:33','Completed'),(21,26,30,'2026-04-12 13:08:57','2026-04-12 13:10:23','Completed'),(22,27,30,'2026-04-13 08:51:45',NULL,'InProgress'),(23,35,19,'2026-04-14 11:54:34',NULL,'Assigned'),(24,32,19,'2026-04-14 12:46:53',NULL,'Assigned'),(25,36,1,'2026-04-14 14:26:41','2026-04-14 14:31:11','Completed'),(26,30,1,'2026-04-15 06:56:44',NULL,'InProgress'),(27,3,1,'2026-04-15 07:16:56','2026-04-15 07:33:51','Completed'),(33,38,17,'2026-04-19 11:38:38','2026-04-19 11:50:10','Completed'),(34,6,17,'2026-04-19 12:12:03',NULL,'Assigned'),(35,39,17,'2026-04-19 12:15:29',NULL,'Assigned'),(38,43,53,'2026-04-23 02:33:56','2026-04-23 02:37:01','Completed'),(39,45,32,'2026-04-23 04:54:35',NULL,'Assigned'),(40,40,1,'2026-04-26 08:38:17','2026-04-26 08:41:49','Completed'),(42,54,1,'2026-04-27 08:34:11','2026-04-27 08:37:50','Completed'),(43,53,1,'2026-04-27 08:35:01','2026-04-27 09:32:53','Completed'),(44,55,1,'2026-04-27 09:39:45','2026-04-27 10:19:32','Completed'),(45,56,1,'2026-04-27 11:12:16','2026-04-27 11:16:27','Completed'),(46,57,1,'2026-04-27 11:53:54','2026-04-27 11:58:28','Completed');
/*!40000 ALTER TABLE `mechanicassignments` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `limit_mechanic_jobs` BEFORE INSERT ON `mechanicassignments` FOR EACH ROW BEGIN
    DECLARE active_jobs INT;

    SELECT COUNT(*) INTO active_jobs
    FROM MechanicAssignments
    WHERE MechanicID = NEW.MechanicID
    AND Status IN ('Assigned','InProgress');

    IF active_jobs >= 5 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Mechanic cannot have more than 5 active jobs';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `mechanics`
--

DROP TABLE IF EXISTS `mechanics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mechanics` (
  `UserID` int(11) NOT NULL,
  `GarageID` int(11) DEFAULT NULL,
  PRIMARY KEY (`UserID`),
  KEY `GarageID` (`GarageID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mechanics`
--

LOCK TABLES `mechanics` WRITE;
/*!40000 ALTER TABLE `mechanics` DISABLE KEYS */;
INSERT INTO `mechanics` VALUES (48,NULL),(1,1),(19,1),(32,1),(33,1),(34,1),(35,1),(36,1),(37,1),(49,1),(50,1),(51,1),(52,1),(17,2),(18,2),(38,2),(40,2),(53,2),(27,4),(30,6),(22,7),(26,7);
/*!40000 ALTER TABLE `mechanics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mechanicskills`
--

DROP TABLE IF EXISTS `mechanicskills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mechanicskills` (
  `SkillID` int(11) NOT NULL AUTO_INCREMENT,
  `MechanicID` int(11) DEFAULT NULL,
  `SkillName` varchar(100) NOT NULL,
  PRIMARY KEY (`SkillID`),
  UNIQUE KEY `unique_skill` (`MechanicID`,`SkillName`),
  CONSTRAINT `mechanicskills_ibfk_1` FOREIGN KEY (`MechanicID`) REFERENCES `mechanics` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mechanicskills`
--

LOCK TABLES `mechanicskills` WRITE;
/*!40000 ALTER TABLE `mechanicskills` DISABLE KEYS */;
INSERT INTO `mechanicskills` VALUES (8,1,'Diagnostics'),(13,1,'Electrical/Wiring'),(9,1,'Oil Change'),(10,1,'Suspension'),(12,1,'Tire Service'),(11,1,'Transmission'),(18,17,'Battery'),(16,17,'Suspension'),(17,17,'Transmission'),(20,18,'Brake Service'),(22,18,'Electrical/Wiring'),(21,18,'Suspension'),(19,18,'Tire Service'),(7,19,'Towing'),(42,32,'AC/Heating'),(43,32,'Body Work'),(40,32,'Electrical/Wiring'),(41,32,'Oil Change'),(39,32,'Transmission'),(37,33,'AC/Heating'),(36,33,'Diagnostics'),(38,33,'Tire Service'),(26,38,'Body Work'),(23,38,'Brake Service'),(28,38,'Diagnostics'),(25,38,'Electrical/Wiring'),(27,38,'Suspension'),(24,38,'Transmission'),(31,40,'AC/Heating'),(29,40,'Brake Service'),(33,40,'Electrical/Wiring'),(34,40,'Engine Repair'),(35,40,'Repair'),(30,40,'Suspension'),(32,40,'Transmission'),(44,50,'Engine Repair'),(45,51,'Engine Repair'),(46,52,'Engine Repair'),(50,53,'AC/Heating'),(47,53,'Brake Service'),(49,53,'Tire Service'),(48,53,'Transmission');
/*!40000 ALTER TABLE `mechanicskills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `NotificationID` int(11) NOT NULL AUTO_INCREMENT,
  `UserID` int(11) DEFAULT NULL,
  `Title` varchar(255) DEFAULT NULL,
  `Message` text,
  `Type` varchar(50) DEFAULT NULL,
  `IsRead` tinyint(1) DEFAULT '0',
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`NotificationID`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=196 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (3,1,'New Job Assignment','You have been assigned to service request #1.',NULL,1,'2026-04-04 12:40:14'),(6,13,'Request Rejected','ads','REJECTED',0,'2026-04-06 14:40:47'),(7,13,'Request Approved','Your car has been approved for service','APPROVED',0,'2026-04-06 15:07:43'),(8,12,'Service Update','Repair started','REPAIR_STARTED',1,'2026-04-06 15:35:52'),(10,19,'New Job Assignment','You have been assigned to service request #3.',NULL,0,'2026-04-08 14:54:51'),(11,19,'New Job Assignment','You have been assigned to service request #9.',NULL,0,'2026-04-08 14:55:07'),(12,1,'New Job Assignment','You have been assigned to service request #3.',NULL,1,'2026-04-08 14:57:26'),(13,17,'New Job Assignment','You have been assigned to service request #8.',NULL,1,'2026-04-09 08:33:49'),(14,12,'Request Approved','Your car has been approved for service','APPROVED',1,'2026-04-09 14:01:24'),(15,22,'New Job Assignment','You have been assigned to service request #11.',NULL,0,'2026-04-09 14:02:51'),(16,11,'Service Update','Repair started','REPAIR_STARTED',0,'2026-04-10 15:50:46'),(17,22,'New Job Assignment','You have been assigned to service request #7.',NULL,0,'2026-04-10 15:50:53'),(18,11,'Request Approved','Your car has been approved for service','APPROVED',0,'2026-04-11 06:17:50'),(19,27,'New Job Assignment','You have been assigned to service request #12.',NULL,0,'2026-04-11 06:24:23'),(20,11,'Service Update','Repair started','REPAIR_STARTED',0,'2026-04-11 06:24:31'),(21,11,'Request Approved','Your car has been approved for service','APPROVED',0,'2026-04-11 06:26:00'),(22,11,'Service Update','Repair started','REPAIR_STARTED',0,'2026-04-11 06:26:12'),(23,11,'Request Approved','Your car has been approved for service','APPROVED',0,'2026-04-11 06:29:51'),(24,11,'Request Approved','Your car has been approved for service','APPROVED',0,'2026-04-11 06:43:24'),(25,27,'New Job Assignment','You have been assigned to service request #16.',NULL,0,'2026-04-11 06:43:42'),(26,11,'Request Approved','Your car has been approved for service','APPROVED',0,'2026-04-11 07:04:13'),(27,27,'New Job Assignment','You have been assigned to service request #17.',NULL,0,'2026-04-11 07:04:47'),(28,11,'Repair Started','Your vehicle is now being worked on by the assigned mechanic.','REPAIR_STARTED',0,'2026-04-11 07:05:04'),(29,11,'Request Approved','Your car has been approved for service','APPROVED',0,'2026-04-11 07:40:12'),(30,11,'Service Update','Repair started','REPAIR_STARTED',0,'2026-04-11 07:40:37'),(31,11,'Request Approved','Your car has been approved for service','APPROVED',0,'2026-04-11 07:41:49'),(32,27,'New Job Assignment','You have been assigned to service request #18.',NULL,0,'2026-04-11 07:42:06'),(33,11,'Repair Started','Your vehicle is now being worked on by the assigned mechanic.','REPAIR_STARTED',0,'2026-04-11 07:42:36'),(34,11,'Service Ready','Your vehicle service has been completed and is ready for pickup!','CAR_READY',0,'2026-04-11 07:42:59'),(36,30,'New Job Assignment','You have been assigned to service request #19.',NULL,1,'2026-04-12 07:55:30'),(37,31,'Repair Started','Your vehicle is now being worked on by the assigned mechanic.','REPAIR_STARTED',1,'2026-04-12 07:55:49'),(38,31,'Service Ready','Your vehicle service has been completed and is ready for pickup!','CAR_READY',1,'2026-04-12 07:56:31'),(39,31,'Request Approved','Your car has been approved for service','APPROVED',1,'2026-04-12 10:43:11'),(40,30,'New Job Assignment','You have been assigned to service request #20.',NULL,1,'2026-04-12 10:50:32'),(41,31,'Repair Started','Your vehicle is now being worked on by the assigned mechanic.','REPAIR_STARTED',1,'2026-04-12 10:50:50'),(42,31,'Service Ready','Your vehicle service has been completed and is ready for pickup!','CAR_READY',1,'2026-04-12 10:51:41'),(43,23,'Payment Received','Payment of 170.00 ETB received for Service Request #20.',NULL,1,'2026-04-12 10:55:27'),(44,30,'New Job Assignment','You have been assigned to service request #22.',NULL,1,'2026-04-12 11:48:15'),(45,30,'New Job Assignment','You have been assigned to service request #21.',NULL,1,'2026-04-12 11:48:21'),(46,31,'Request Approved','Your car has been approved for service','APPROVED',1,'2026-04-12 11:48:28'),(47,31,'Request Approved','Your car has been approved for service','APPROVED',1,'2026-04-12 11:48:33'),(48,31,'Repair Started','Your vehicle is now being worked on by the assigned mechanic.','REPAIR_STARTED',1,'2026-04-12 11:48:53'),(49,31,'Service Ready','Your vehicle service has been completed and is ready for pickup!','CAR_READY',1,'2026-04-12 11:49:00'),(50,31,'Repair Started','Your vehicle is now being worked on by the assigned mechanic.','REPAIR_STARTED',1,'2026-04-12 11:49:07'),(51,31,'Service Ready','Your vehicle service has been completed and is ready for pickup!','CAR_READY',1,'2026-04-12 11:49:29'),(52,23,'Cash Payment Pending','Customer chose to pay 5000 ETB in cash for Service Request #22. Please confirm when received.',NULL,1,'2026-04-12 12:04:59'),(53,31,'Cash Payment Confirmed','Your cash payment of 5000.00 ETB for Service Request #22 has been confirmed.',NULL,1,'2026-04-12 12:24:08'),(54,31,'Payment Confirmed','Your online payment of 4251.50 ETB for Service Request #21 has been confirmed.',NULL,1,'2026-04-12 12:45:46'),(55,31,'Request Approved','Your car has been approved for service','APPROVED',1,'2026-04-12 12:57:36'),(56,30,'New Job Assignment','You have been assigned to service request #23.',NULL,1,'2026-04-12 12:58:07'),(57,31,'Repair Started','Your vehicle is now being worked on by the assigned mechanic.','REPAIR_STARTED',1,'2026-04-12 12:58:20'),(58,31,'Service Ready','Your vehicle service has been completed and is ready for pickup!','CAR_READY',1,'2026-04-12 12:58:54'),(59,23,'Payment Received','Payment of 5401.00 ETB received for Service Request #23.',NULL,1,'2026-04-12 12:59:58'),(60,31,'Request Approved','Your car has been approved for service','APPROVED',1,'2026-04-12 13:05:29'),(61,30,'New Job Assignment','You have been assigned to service request #24.',NULL,1,'2026-04-12 13:05:42'),(62,30,'New Job Assignment','You have been assigned to service request #25.',NULL,1,'2026-04-12 13:06:28'),(63,31,'Request Approved','Your car has been approved for service','APPROVED',1,'2026-04-12 13:06:36'),(64,30,'New Job Assignment','You have been assigned to service request #28.',NULL,1,'2026-04-12 13:08:40'),(65,30,'New Job Assignment','You have been assigned to service request #29.',NULL,1,'2026-04-12 13:08:49'),(66,30,'New Job Assignment','You have been assigned to service request #26.',NULL,1,'2026-04-12 13:08:58'),(67,31,'Repair Started','Your vehicle is now being worked on by the assigned mechanic.','REPAIR_STARTED',1,'2026-04-12 13:10:17'),(68,31,'Service Ready','Your vehicle service has been completed and is ready for pickup!','CAR_READY',1,'2026-04-12 13:10:23'),(69,31,'Repair Started','Your vehicle is now being worked on by the assigned mechanic.','REPAIR_STARTED',1,'2026-04-12 13:10:29'),(71,23,'Cash Payment Pending','Customer chose to pay 7800 ETB in cash for Service Request #29. Please confirm when received.',NULL,1,'2026-04-12 13:16:46'),(72,31,'Cash Payment Confirmed','Your cash payment of 7800.00 ETB for Service Request #29 has been confirmed.',NULL,1,'2026-04-12 13:30:56'),(73,30,'New Job Assignment','You have been assigned to service request #27.',NULL,1,'2026-04-13 08:51:45'),(74,23,'Payment Received','Payment of 6100.00 ETB received for Service Request #26.',NULL,1,'2026-04-13 13:18:50'),(75,31,'Request Rejected','Item not available to repair your car.','REJECTED',1,'2026-04-13 13:38:38'),(76,31,'Service Update','Your service request for Towing has been marked as Pending.','PENDING',0,'2026-04-14 08:15:07'),(77,31,'Repair Started','Your vehicle is now being worked on by the assigned mechanic.','REPAIR_STARTED',0,'2026-04-14 08:25:59'),(78,31,'Request Approved','Your car has been approved for service','APPROVED',0,'2026-04-14 11:35:56'),(79,19,'New Job Assignment','You have been assigned to service request #35.','ASSIGNMENT',0,'2026-04-14 11:54:34'),(80,31,'Request Approved','Your car has been approved for service','APPROVED',0,'2026-04-14 12:46:44'),(81,19,'New Job Assignment','You have been assigned to service request #32.','ASSIGNMENT',0,'2026-04-14 12:46:54'),(82,31,'Request Approved','Your car has been approved for service','APPROVED',0,'2026-04-14 13:48:59'),(83,12,'Request Approved','Your car has been approved for service','APPROVED',0,'2026-04-14 14:26:17'),(84,1,'New Job Assignment','You have been assigned to service request #36.','ASSIGNMENT',1,'2026-04-14 14:26:41'),(85,12,'Repair Started','Your vehicle is now being worked on by the assigned mechanic.','REPAIR_STARTED',0,'2026-04-14 14:30:44'),(86,12,'Service Ready','Your vehicle service has been completed and is ready for pickup!','CAR_READY',0,'2026-04-14 14:31:12'),(87,2,'Payment Received','Payment of 4564.75 ETB received for Service Request #36.',NULL,1,'2026-04-14 14:34:03'),(88,2,'Payment Received','Payment of 4564.75 ETB received for Service Request #36.',NULL,1,'2026-04-14 14:37:11'),(89,12,'Cash Payment Confirmed','Your cash payment of 4564.75 ETB for Service Request #36 has been confirmed.',NULL,0,'2026-04-14 14:40:30'),(90,31,'Request Approved','Your car has been approved for service','APPROVED',0,'2026-04-15 06:56:33'),(91,1,'New Job Assignment','You have been assigned to service request #30.','ASSIGNMENT',0,'2026-04-15 06:56:44'),(93,1,'New Job Assignment','You have been assigned to service request #3.','ASSIGNMENT',0,'2026-04-15 07:16:56'),(95,4,'Service Ready','Your vehicle service has been completed and is ready for pickup!','CAR_READY',1,'2026-04-15 07:33:52'),(96,31,'Repair Started','Your vehicle is now being worked on by the assigned mechanic.','REPAIR_STARTED',0,'2026-04-17 14:21:47'),(97,12,'Request Approved','Your car has been approved for service','APPROVED',0,'2026-04-17 14:23:31'),(98,18,'New Job Assignment','You have been assigned to service request #38.','ASSIGNMENT',0,'2026-04-17 14:23:59'),(99,17,'New Job Assignment','You have been assigned to service request #38.','ASSIGNMENT',1,'2026-04-17 14:25:41'),(100,17,'New Job Assignment','You have been assigned to service request #38.','ASSIGNMENT',1,'2026-04-19 11:24:34'),(101,17,'New Job Assignment','You have been assigned to service request #38.','ASSIGNMENT',1,'2026-04-19 11:25:38'),(102,17,'New Job Assignment','You have been assigned to service request #38.','ASSIGNMENT',1,'2026-04-19 11:25:47'),(103,17,'New Job Assignment','You have been assigned to service request #38.','ASSIGNMENT',1,'2026-04-19 11:38:39'),(104,12,'Repair Started','Your vehicle is now being worked on by the assigned mechanic.','REPAIR_STARTED',0,'2026-04-19 11:41:58'),(105,12,'Service Ready','Your vehicle service has been completed and is ready for pickup!','CAR_READY',0,'2026-04-19 11:50:11'),(106,5,'Payment Received','Payment of 2298.00 ETB received for Service Request #38.',NULL,1,'2026-04-19 11:52:10'),(107,17,'New Job Assignment','You have been assigned to service request #6.','ASSIGNMENT',0,'2026-04-19 12:12:03'),(108,12,'Request Approved','Your car has been approved for service','APPROVED',0,'2026-04-19 12:15:06'),(109,17,'New Job Assignment','You have been assigned to service request #39.','ASSIGNMENT',0,'2026-04-19 12:15:29'),(110,4,'Request Approved','Your car has been approved for service','APPROVED',1,'2026-04-23 01:34:50'),(111,40,'New Job Assignment','You have been assigned to service request #43.','ASSIGNMENT',0,'2026-04-23 01:39:05'),(112,17,'New Job Assignment','You have been assigned to service request #43.','ASSIGNMENT',0,'2026-04-23 02:06:28'),(113,53,'New Job Assignment','You have been assigned to service request #43.','ASSIGNMENT',1,'2026-04-23 02:33:57'),(114,4,'Repair Started','Your vehicle is now being worked on by the assigned mechanic.','REPAIR_STARTED',1,'2026-04-23 02:34:19'),(115,4,'Service Ready','Your vehicle service has been completed and is ready for pickup!','CAR_READY',1,'2026-04-23 02:37:02'),(116,5,'Payment Received','Payment of 985.00 ETB received for Service Request #43.',NULL,0,'2026-04-23 03:44:08'),(117,2,'New Service Request','A new EMERGENCY request for Towing has been received at Garage A.','NEW_REQUEST',0,'2026-04-23 04:13:29'),(118,4,'Request Approved','Your car has been approved for service','APPROVED',1,'2026-04-23 04:14:51'),(119,2,'New Service Request','A new EMERGENCY request for Towing has been received at Garage A.','NEW_REQUEST',0,'2026-04-23 04:25:45'),(120,4,'Estimate Ready — Action Required','Your garage has sent an estimate of 6880 ETB for your emergency request. A pre-service deposit of 2064 ETB (30%) is required. Please review and approve in the app.','ESTIMATE_READY',1,'2026-04-23 04:29:10'),(121,32,'New Job Assignment','You have been assigned to service request #45.','ASSIGNMENT',0,'2026-04-23 04:54:35'),(122,4,'Service Update','Repair started','REPAIR_STARTED',0,'2026-04-23 05:09:42'),(123,4,'Request Rejected','Customer rejected estimate','REJECTED',0,'2026-04-23 05:10:04'),(124,31,'Repair Started','Your vehicle is now being worked on by the assigned mechanic.','REPAIR_STARTED',0,'2026-04-23 05:56:47'),(125,2,'New Service Request','A new request for Electrical has been received at Garage A.','NEW_REQUEST',0,'2026-04-25 03:02:52'),(126,2,'New Service Request','A new request for Repair has been received at Garage A.','NEW_REQUEST',0,'2026-04-25 03:08:25'),(127,21,'New Service Request','A new request for Diagnostics has been received at Elite Car Repair.','NEW_REQUEST',0,'2026-04-25 03:12:36'),(128,20,'New Service Request','A new request for Battery Replacement has been received at City Auto Care.','NEW_REQUEST',0,'2026-04-26 08:11:34'),(129,2,'Payment Received','Payment of 1388.75 ETB received for Service Request #3.',NULL,0,'2026-04-26 08:19:15'),(130,4,'Estimate Ready — Action Required','Your garage has sent an estimate of 4000 ETB for your emergency request. A pre-service deposit of 200 ETB (5%) is required. Please review and approve in the app.','ESTIMATE_READY',0,'2026-04-26 08:36:34'),(131,1,'New Job Assignment','You have been assigned to service request #40.','ASSIGNMENT',0,'2026-04-26 08:38:17'),(132,4,'Repair Started','Your vehicle is now being worked on by the assigned mechanic.','REPAIR_STARTED',0,'2026-04-26 08:41:12'),(133,2,'Low Stock Alert','Drive Shaft is running low (5 remaining). Please restock soon.','LOW_STOCK',0,'2026-04-26 08:41:22'),(134,4,'Service Ready','Your vehicle service has been completed and is ready for pickup!','CAR_READY',0,'2026-04-26 08:41:50'),(135,2,'Cash Payment Pending','Customer chose to pay 3180 ETB in cash for Service Request #40. Please confirm when received.',NULL,0,'2026-04-26 08:42:54'),(136,4,'Cash Payment Confirmed','Your cash payment of 3180.00 ETB for Service Request #40 has been confirmed.',NULL,0,'2026-04-26 08:43:15'),(137,2,'New Service Request','A new EMERGENCY request for Repair has been received at Garage A.','NEW_REQUEST',1,'2026-04-26 09:00:18'),(138,4,'Estimate Ready — Action Required','Your garage has sent an estimate of 2000 ETB for your emergency request. A pre-service deposit of 120 ETB (6%) is required. Please review and approve in the app.','ESTIMATE_READY',1,'2026-04-26 09:03:06'),(139,31,'Repair Started','Your vehicle is now being worked on by the assigned mechanic.','REPAIR_STARTED',0,'2026-04-26 13:11:51'),(140,24,'New Service Request','A new EMERGENCY request for Towing has been received at Speedy Garage.','NEW_REQUEST',0,'2026-04-27 07:48:32'),(141,4,'Request Rejected','No available mechanics','REJECTED',1,'2026-04-27 07:54:11'),(142,24,'New Service Request','A new EMERGENCY request for Towing has been received at Speedy Garage.','NEW_REQUEST',0,'2026-04-27 07:54:47'),(143,4,'Repair Started','Your vehicle is now being worked on by the assigned mechanic.','REPAIR_STARTED',0,'2026-04-27 07:58:47'),(144,2,'New Service Request','A new EMERGENCY request for Towing has been received at Garage A.','NEW_REQUEST',0,'2026-04-27 07:59:43'),(145,4,'Estimate Ready — Action Required','Your garage has sent an estimate of 5000 ETB for your emergency request. A pre-service deposit of 1100 ETB (22%) is required. Please review and approve in the app.','ESTIMATE_READY',0,'2026-04-27 08:00:28'),(146,1,'New Job Assignment','You have been assigned to service request #53.','ASSIGNMENT',0,'2026-04-27 08:00:56'),(147,2,'New Service Request','A new EMERGENCY request for Repair has been received at Garage A.','NEW_REQUEST',0,'2026-04-27 08:33:10'),(148,4,'Estimate Ready — Action Required','Your garage has sent an estimate of 7000 ETB for your emergency request. A pre-service deposit of 2310 ETB (33%) is required. Please review and approve in the app.','ESTIMATE_READY',1,'2026-04-27 08:33:47'),(149,1,'New Job Assignment','You have been assigned to service request #54.','ASSIGNMENT',0,'2026-04-27 08:34:11'),(150,1,'New Job Assignment','You have been assigned to service request #53.','ASSIGNMENT',1,'2026-04-27 08:35:01'),(151,4,'Repair Started','Your vehicle is now being worked on by the assigned mechanic.','REPAIR_STARTED',0,'2026-04-27 08:37:39'),(152,4,'Service Ready','Your vehicle service has been completed and is ready for pickup!','CAR_READY',0,'2026-04-27 08:37:50'),(153,2,'Payment Received','Payment of 2310.00 ETB received for Service Request #54.',NULL,0,'2026-04-27 08:38:04'),(154,2,'Payment Received','Payment of 240.00 ETB received for Service Request #54.',NULL,0,'2026-04-27 08:50:13'),(155,2,'Payment Received','Payment of 240.00 ETB received for Service Request #54.',NULL,0,'2026-04-27 09:05:24'),(156,4,'Payment Confirmed','Your online payment of 240.00 ETB for Service Request #54 has been confirmed.',NULL,0,'2026-04-27 09:05:51'),(157,4,'Repair Started','Your vehicle is now being worked on by the assigned mechanic.','REPAIR_STARTED',0,'2026-04-27 09:14:06'),(158,4,'Service Ready','Your vehicle service has been completed and is ready for pickup!','CAR_READY',0,'2026-04-27 09:32:53'),(159,2,'New Service Request','A new EMERGENCY request for Towing has been received at Garage A.','NEW_REQUEST',0,'2026-04-27 09:38:06'),(160,4,'Estimate Ready — Action Required','Your garage has sent an estimate of 9900 ETB for your emergency request. A pre-service deposit of 1485 ETB (15%) is required. Please review and approve in the app.','ESTIMATE_READY',1,'2026-04-27 09:38:38'),(161,1,'New Job Assignment','You have been assigned to service request #55.','ASSIGNMENT',0,'2026-04-27 09:39:45'),(162,4,'Repair Started','Your vehicle is now being worked on by the assigned mechanic.','REPAIR_STARTED',0,'2026-04-27 10:18:32'),(163,4,'Service Ready','Your vehicle service has been completed and is ready for pickup!','CAR_READY',0,'2026-04-27 10:19:32'),(164,2,'Payment Received','Payment of 2310.00 ETB (Final) received for Service Request #54.',NULL,0,'2026-04-27 10:33:28'),(165,47,'Payment Received','Payment of 2310.00 ETB (Final) received for Service Request #54.',NULL,0,'2026-04-27 10:33:28'),(166,4,'Payment Confirmed','Your online payment of 120.00 ETB for Service Request #50 has been confirmed.',NULL,0,'2026-04-27 10:34:24'),(167,4,'Payment Confirmed','Your online payment of 1100.00 ETB for Service Request #53 has been confirmed.',NULL,0,'2026-04-27 10:34:27'),(168,2,'Payment Received','Payment of 365.00 ETB (Final) received for Service Request #55.',NULL,0,'2026-04-27 10:35:08'),(169,47,'Payment Received','Payment of 365.00 ETB (Final) received for Service Request #55.',NULL,0,'2026-04-27 10:35:08'),(170,2,'Payment Received','Payment of 530.00 ETB (Final) received for Service Request #53.',NULL,0,'2026-04-27 10:35:50'),(171,47,'Payment Received','Payment of 530.00 ETB (Final) received for Service Request #53.',NULL,0,'2026-04-27 10:35:50'),(172,2,'Payment Received','Payment of 1100.00 ETB (Final) received for Service Request #53.',NULL,0,'2026-04-27 10:36:40'),(173,47,'Payment Received','Payment of 1100.00 ETB (Final) received for Service Request #53.',NULL,0,'2026-04-27 10:36:41'),(174,2,'Payment Received','Payment of 530.00 ETB (Final) received for Service Request #53.',NULL,0,'2026-04-27 10:38:47'),(175,47,'Payment Received','Payment of 530.00 ETB (Final) received for Service Request #53.',NULL,0,'2026-04-27 10:38:47'),(176,2,'New Service Request','A new EMERGENCY request for Repair has been received at Garage A.','NEW_REQUEST',0,'2026-04-27 11:10:59'),(177,4,'Estimate Ready — Action Required','Your garage has sent an estimate of 6000 ETB for your emergency request. A pre-service deposit of 1500 ETB (25%) is required. Please review and approve in the app.','ESTIMATE_READY',0,'2026-04-27 11:12:03'),(178,1,'New Job Assignment','You have been assigned to service request #56.','ASSIGNMENT',0,'2026-04-27 11:12:16'),(179,4,'Payment Confirmed','Your online payment of 1500.00 ETB for Service Request #56 has been confirmed.',NULL,0,'2026-04-27 11:14:32'),(180,4,'Repair Started','Your vehicle is now being worked on by the assigned mechanic.','REPAIR_STARTED',0,'2026-04-27 11:16:24'),(181,4,'Service Ready','Your vehicle service has been completed and is ready for pickup!','CAR_READY',0,'2026-04-27 11:16:27'),(182,2,'Payment Received','Payment of 1050.00 ETB (Final) received for Service Request #56.',NULL,0,'2026-04-27 11:35:12'),(183,47,'Payment Received','Payment of 1050.00 ETB (Final) received for Service Request #56.',NULL,0,'2026-04-27 11:35:12'),(184,4,'Payment Confirmed','Your online payment of 1500.00 ETB for Service Request #56 has been confirmed.',NULL,0,'2026-04-27 11:38:35'),(185,4,'Payment Confirmed','Your online payment of 1050.00 ETB for Service Request #56 has been confirmed.',NULL,0,'2026-04-27 11:38:42'),(186,2,'Payment Received','Payment of 1100.00 ETB (Final) received for Service Request #53.',NULL,0,'2026-04-27 11:43:04'),(187,47,'Payment Received','Payment of 1100.00 ETB (Final) received for Service Request #53.',NULL,0,'2026-04-27 11:43:04'),(188,2,'New Service Request','A new EMERGENCY request for Towing has been received at Garage A.','NEW_REQUEST',0,'2026-04-27 11:45:14'),(189,4,'Estimate Ready — Action Required','Your garage has sent an estimate of 1300.00 ETB for your emergency request. A pre-service deposit of 130 ETB (10.00%) is required. Please review and approve in the app.','ESTIMATE_READY',0,'2026-04-27 11:53:22'),(190,1,'New Job Assignment','You have been assigned to service request #57.','ASSIGNMENT',0,'2026-04-27 11:53:54'),(191,4,'Repair Started','Your vehicle is now being worked on by the assigned mechanic.','REPAIR_STARTED',0,'2026-04-27 11:55:46'),(192,4,'Payment Confirmed','Your online payment of 130.00 ETB for Service Request #57 has been confirmed.',NULL,0,'2026-04-27 11:57:02'),(193,4,'Service Ready','Your vehicle service has been completed and is ready for pickup!','CAR_READY',0,'2026-04-27 11:58:28'),(194,2,'Payment Received','Payment of 1170.00 ETB (Final) received for Service Request #57.',NULL,0,'2026-04-27 11:59:06'),(195,47,'Payment Received','Payment of 1170.00 ETB (Final) received for Service Request #57.',NULL,0,'2026-04-27 11:59:06');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `passwordresets`
--

DROP TABLE IF EXISTS `passwordresets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `passwordresets` (
  `ResetID` int(11) NOT NULL AUTO_INCREMENT,
  `Email` varchar(100) NOT NULL,
  `OTP` varchar(10) NOT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ExpiresAt` datetime NOT NULL,
  PRIMARY KEY (`ResetID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `passwordresets`
--

LOCK TABLES `passwordresets` WRITE;
/*!40000 ALTER TABLE `passwordresets` DISABLE KEYS */;
/*!40000 ALTER TABLE `passwordresets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,150.00,'Cash','Final','Completed','2026-04-04 14:19:34',1,NULL),(2,401.00,'Chapa','Final','Pending','2026-04-11 12:40:22',18,'tx-18-1775911221629'),(3,65.50,'Chapa','Final','Completed','2026-04-12 10:57:09',19,'tx-19-1775982005507'),(4,170.00,'Chapa','Final','Completed','2026-04-12 10:55:27',20,'tx-20-1775991148115'),(5,5000.00,'Cash','Final','Completed','2026-04-12 12:24:08',22,'tx-22-1775995499454'),(6,4251.50,'Chapa','Final','Completed','2026-04-12 12:45:46',21,'tx-21-1775996063050'),(7,5401.00,'Chapa','Final','Completed','2026-04-12 12:59:57',23,'tx-23-1775998771174'),(8,7800.00,'Cash','Final','Completed','2026-04-12 13:30:56',29,'tx-29-1775999805804'),(9,6100.00,'Chapa','Final','Completed','2026-04-13 13:18:50',26,'tx-26-1776086192963'),(10,4564.75,'Cash','Final','Completed','2026-04-14 14:40:29',36,'tx-36-1776177199911'),(11,2298.00,'Chapa','Final','Completed','2026-04-19 11:52:09',38,'tx-38-1776599485233'),(12,985.00,'Chapa','Final','Completed','2026-04-23 03:44:08',43,'tx-43-1776913772475'),(13,2064.00,'Chapa','Final','Completed','2026-04-23 04:53:56',45,'tx-45-1776919796172'),(14,1388.75,'Chapa','Final','Completed','2026-04-26 08:19:15',3,'tx-3-1777191280896'),(15,3180.00,'Cash','Final','Completed','2026-04-26 08:43:15',40,'tx-40-1777192974526'),(16,120.00,'Chapa','Final','Completed','2026-04-27 10:34:24',50,'tx-50-1777196531166'),(17,1100.00,'Chapa','Final','Completed','2026-04-27 11:43:04',53,'tx-53-1777289997690'),(21,2310.00,'Chapa','Final','Completed','2026-04-27 10:33:28',54,'tx-54-1777285983110'),(22,1485.00,'Chapa','Deposit','Completed','2026-04-27 10:20:04',55,'tx-55-1777285045964'),(24,365.00,'Chapa','Final','Completed','2026-04-27 10:35:08',55,'tx-55-1777286087176'),(28,1500.00,'Chapa','Deposit','Completed','2026-04-27 11:38:35',56,'tx-56-1777288353992'),(29,1050.00,'Chapa','Final','Completed','2026-04-27 11:38:42',56,'tx-56-1777289691484'),(31,130.00,'Chapa','Deposit','Completed','2026-04-27 11:57:01',57,'tx-57-1777290966716'),(32,1170.00,'Chapa','Final','Completed','2026-04-27 11:59:06',57,'tx-57-1777291127683');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pushtokens`
--

DROP TABLE IF EXISTS `pushtokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pushtokens` (
  `TokenID` int(11) NOT NULL AUTO_INCREMENT,
  `UserID` int(11) DEFAULT NULL,
  `Token` varchar(255) DEFAULT NULL,
  `DeviceType` varchar(50) DEFAULT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`TokenID`),
  UNIQUE KEY `UserID` (`UserID`),
  UNIQUE KEY `Token` (`Token`),
  CONSTRAINT `pushtokens_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pushtokens`
--

LOCK TABLES `pushtokens` WRITE;
/*!40000 ALTER TABLE `pushtokens` DISABLE KEYS */;
INSERT INTO `pushtokens` VALUES (1,3,'ExponentPushToken[AbC...]','Android','2026-04-04 11:36:29');
/*!40000 ALTER TABLE `pushtokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `ReviewID` int(11) NOT NULL AUTO_INCREMENT,
  `Rating` int(11) DEFAULT NULL,
  `Comment` text,
  `ReviewDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `CustomerID` int(11) DEFAULT NULL,
  `GarageID` int(11) DEFAULT NULL,
  `RequestID` int(11) DEFAULT NULL,
  PRIMARY KEY (`ReviewID`),
  UNIQUE KEY `unique_request_review` (`RequestID`),
  KEY `CustomerID` (`CustomerID`),
  KEY `GarageID` (`GarageID`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (2,5,'Great!','2026-04-04 14:55:43',4,1,NULL),(3,5,'I got a great service','2026-04-12 10:41:49',31,6,NULL),(4,3,'Vgnffg','2026-04-13 12:25:21',31,6,20),(5,3,'Cmvn','2026-04-14 08:23:04',31,6,29),(6,4,'Very great service','2026-04-26 09:44:00',4,1,1);
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `review_after_completion` BEFORE INSERT ON `reviews` FOR EACH ROW BEGIN
    DECLARE completed_count INT;

    SELECT COUNT(*) INTO completed_count
    FROM ServiceRequests SR
    JOIN Vehicles V ON SR.VehicleID = V.VehicleID
    WHERE V.CustomerID = NEW.CustomerID
    AND SR.Status = 'Completed';

    IF completed_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Review allowed only after service completion';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `serviceitems`
--

DROP TABLE IF EXISTS `serviceitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `serviceitems` (
  `ServiceItemID` int(11) NOT NULL AUTO_INCREMENT,
  `RequestID` int(11) DEFAULT NULL,
  `ItemID` int(11) DEFAULT NULL,
  `QuantityUsed` int(11) NOT NULL,
  PRIMARY KEY (`ServiceItemID`),
  KEY `RequestID` (`RequestID`),
  KEY `ItemID` (`ItemID`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `serviceitems`
--

LOCK TABLES `serviceitems` WRITE;
/*!40000 ALTER TABLE `serviceitems` DISABLE KEYS */;
INSERT INTO `serviceitems` VALUES (1,1,3,1),(2,1,3,1),(3,3,1,2),(4,3,24,7),(5,11,37,1),(6,7,48,1),(7,7,48,4),(8,7,67,3),(9,12,15,2),(10,12,15,3),(11,12,15,4),(12,12,68,1),(13,16,47,2),(14,16,31,4),(15,17,47,2),(16,17,46,4),(17,17,68,1),(18,18,31,3),(19,18,47,4),(20,18,61,2),(21,19,33,3),(22,19,51,4),(23,19,14,2),(24,19,19,1),(25,20,60,2),(26,20,19,2),(27,21,42,3),(28,21,14,3),(29,23,42,3),(30,23,51,4),(31,36,24,3),(32,36,45,4),(33,28,33,1),(34,38,57,3),(35,43,41,3),(36,40,56,3),(37,53,45,3),(38,55,45,5);
/*!40000 ALTER TABLE `serviceitems` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `servicerequests`
--

DROP TABLE IF EXISTS `servicerequests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  PRIMARY KEY (`RequestID`),
  KEY `VehicleID` (`VehicleID`),
  KEY `GarageID` (`GarageID`)
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `servicerequests`
--

LOCK TABLES `servicerequests` WRITE;
/*!40000 ALTER TABLE `servicerequests` DISABLE KEYS */;
INSERT INTO `servicerequests` VALUES (1,'Oil Change','Need oil replacement','2026-04-04 11:59:55','Completed',0,NULL,NULL,1,1,'Full capacity',NULL,NULL,1.00,0,0.00,0,NULL,NULL),(2,'Repair','','2026-04-05 10:11:26','pending',0,NULL,NULL,1,5,NULL,NULL,NULL,1.00,0,0.00,0,NULL,NULL),(3,'Towing','Oil change','2026-04-05 10:12:10','InProgress',1,NULL,NULL,2,1,'',NULL,NULL,1.00,0,0.00,1,NULL,NULL),(4,'Towing, Repair, Diagnostics','','2026-04-05 13:00:47','pending',0,NULL,NULL,8,5,NULL,NULL,NULL,1.00,0,0.00,0,NULL,NULL),(5,'Diagnostics, Battery','','2026-04-05 14:12:49','Rejected',0,NULL,NULL,8,2,'ads',NULL,NULL,1.00,0,0.00,0,NULL,NULL),(6,'Repair','','2026-04-05 14:12:57','Approved',0,NULL,NULL,8,2,'',NULL,NULL,1.00,0,0.00,0,NULL,NULL),(7,'Towing','','2026-04-06 05:51:14','InProgress',0,NULL,NULL,6,7,'',NULL,NULL,1.00,0,0.00,0,NULL,NULL),(8,'Battery','','2026-04-06 06:32:00','InProgress',0,NULL,NULL,9,2,'',NULL,NULL,1.00,0,0.00,0,NULL,NULL),(9,'Towing, Diagnostics','','2026-04-06 15:04:28','InProgress',0,NULL,NULL,2,1,'',NULL,NULL,1.00,0,0.00,0,NULL,NULL),(10,'Battery','','2026-04-09 09:16:20','pending',1,NULL,NULL,1,5,NULL,NULL,NULL,1.00,0,0.00,0,NULL,NULL),(11,'Electrical, Diagnostics','There is cery loud noise.','2026-04-09 14:00:55','Approved',1,NULL,NULL,9,7,'',NULL,NULL,1.00,0,0.00,0,NULL,NULL),(12,'Diagnostics, Electrical, Towing','The engine has sound\n[Preferred Drop-off: 5:00]','2026-04-11 06:00:20','Approved',0,NULL,NULL,6,4,'',NULL,NULL,1.00,0,0.00,0,NULL,NULL),(13,'Towing','','2026-04-11 06:40:14','pending',1,NULL,NULL,6,7,NULL,NULL,NULL,1.00,0,0.00,0,NULL,NULL),(14,'Towing','','2026-04-11 06:40:36','pending',1,NULL,NULL,6,7,NULL,NULL,NULL,1.00,0,0.00,0,NULL,NULL),(15,'Diagnostics, Electrical','','2026-04-11 06:42:31','pending',1,NULL,NULL,6,7,NULL,NULL,NULL,1.00,0,0.00,0,NULL,NULL),(16,'Repair, Electrical','','2026-04-11 06:43:08','InProgress',1,NULL,NULL,6,4,'',NULL,NULL,1.00,0,0.00,0,NULL,NULL),(17,'Diagnostics','','2026-04-11 07:03:54','InProgress',0,NULL,NULL,6,4,'',NULL,NULL,1.00,0,0.00,0,NULL,NULL),(18,'Towing, Diagnostics, Repair, Electrical','','2026-04-11 07:41:28','Completed',1,NULL,NULL,6,4,'',NULL,NULL,1.00,0,0.00,0,NULL,NULL),(19,'Oil Change, Tires','Engine has noise\n[Preferred Drop-off: 3:00]','2026-04-12 07:52:59','Completed',1,NULL,NULL,10,6,'',NULL,NULL,1.00,0,0.00,0,NULL,NULL),(20,'Tires','','2026-04-12 10:42:56','Completed',0,NULL,NULL,10,6,'',NULL,NULL,1.00,0,0.00,0,NULL,NULL),(21,'Towing, Electrical','','2026-04-12 11:36:04','Completed',0,NULL,NULL,10,6,'',NULL,NULL,1.00,0,0.00,0,NULL,NULL),(22,'Brake pad replacement, Battery','','2026-04-12 11:43:54','Completed',0,NULL,NULL,10,6,'',NULL,NULL,1.00,0,0.00,0,NULL,NULL),(23,'Brake pad replacement, Diagnostics, Electrical','','2026-04-12 12:57:13','Completed',1,NULL,NULL,10,6,'',NULL,NULL,1.00,0,0.00,0,NULL,NULL),(24,'Battery','','2026-04-12 13:05:00','Approved',0,NULL,NULL,10,6,'',NULL,NULL,1.00,0,0.00,0,NULL,NULL),(25,'Battery','','2026-04-12 13:06:16','InProgress',0,NULL,NULL,10,6,'',NULL,NULL,1.00,0,0.00,0,NULL,NULL),(26,'Battery, Diagnostics, Electrical','','2026-04-12 13:06:27','Completed',1,NULL,NULL,10,6,NULL,NULL,NULL,1.00,0,0.00,0,NULL,NULL),(27,'Oil Change, Brake pad replacement','','2026-04-12 13:06:39','InProgress',1,NULL,NULL,10,6,NULL,'2026-04-19',NULL,1.00,0,0.00,0,NULL,NULL),(28,'Brake pad replacement, Tires, Repair','','2026-04-12 13:06:48','InProgress',0,NULL,NULL,10,6,'Item not available to repair your car.',NULL,NULL,1.00,0,0.00,0,NULL,NULL),(29,'Tires, Repair, Towing','','2026-04-12 13:06:59','Completed',0,NULL,NULL,10,6,NULL,NULL,NULL,1.00,0,0.00,0,NULL,NULL),(30,'Repair','[SOS EMERGENCY REQUEST]\nUser requested immediate On-site Mechanic assistance.','2026-04-13 11:46:13','InProgress',1,NULL,NULL,10,1,'',NULL,NULL,1.00,0,0.00,0,NULL,NULL),(31,'Towing','[SOS EMERGENCY REQUEST]\nUser requested immediate Towing assistance.','2026-04-13 12:22:53','Approved',1,NULL,NULL,10,1,'',NULL,NULL,2.00,0,0.00,0,NULL,NULL),(32,'Repair','[SOS EMERGENCY REQUEST]\nUser requested immediate On-site Mechanic assistance.','2026-04-13 12:23:00','Approved',1,NULL,NULL,10,1,'',NULL,NULL,3.00,0,0.00,0,NULL,NULL),(33,'Battery','','2026-04-14 07:46:44','pending',0,NULL,NULL,9,5,NULL,'2026-04-14','12:00:00',0.50,0,0.00,0,NULL,NULL),(34,'Battery','','2026-04-14 07:51:22','pending',0,NULL,NULL,9,6,NULL,'2026-04-15','08:00:00',0.50,0,0.00,0,NULL,NULL),(35,'Towing','[SOS EMERGENCY REQUEST]\nUser requested immediate Towing assistance.','2026-04-14 08:13:55','Approved',1,NULL,NULL,10,1,'',NULL,NULL,2.00,0,0.00,0,NULL,NULL),(36,'Repair, Electrical','','2026-04-14 14:02:17','Completed',0,NULL,NULL,9,1,'','2026-04-18','12:00:00',5.00,0,0.00,0,NULL,NULL),(37,'Electrical, Repair','','2026-04-17 14:19:46','pending',0,NULL,NULL,9,1,NULL,'2026-04-17','12:00:00',5.00,0,0.00,0,NULL,NULL),(38,'Battery','','2026-04-17 14:23:14','Completed',0,NULL,NULL,9,2,'','2026-04-17','12:00:00',0.50,0,0.00,0,NULL,NULL),(39,'Tires, Oil Change, Battery','','2026-04-19 12:14:39','Approved',1,NULL,NULL,9,2,'','2026-04-19','13:00:00',2.00,0,0.00,0,NULL,NULL),(40,'Repair','[SOS EMERGENCY REQUEST]\nUser requested immediate On-site Mechanic assistance.','2026-04-21 19:10:25','Completed',1,4000.00,NULL,1,1,'',NULL,NULL,3.00,0,0.00,1,5,NULL),(41,'Repair','','2026-04-21 19:15:50','pending',0,NULL,NULL,2,1,NULL,'2026-04-21','12:00:00',3.00,0,0.00,0,NULL,NULL),(42,'Oil Change','','2026-04-22 10:20:44','pending',0,NULL,NULL,1,1,NULL,'2026-04-26','16:00:00',0.50,0,0.00,0,NULL,NULL),(43,'Diagnostics','','2026-04-23 01:27:11','Completed',0,NULL,NULL,2,2,'','2026-04-23','16:00:00',1.50,0,0.00,0,NULL,NULL),(44,'Towing','[SOS EMERGENCY REQUEST]\nUser requested immediate Towing assistance.','2026-04-23 04:13:29','Rejected',1,NULL,NULL,1,1,'Customer rejected estimate',NULL,NULL,2.00,0,0.00,0,NULL,'I am stuck'),(45,'Towing','[SOS EMERGENCY REQUEST]\nUser requested immediate Towing assistance.','2026-04-23 04:25:44','InProgress',1,NULL,NULL,1,1,'',NULL,NULL,2.00,0,0.00,1,NULL,'I am stuck'),(46,'Electrical','','2026-04-25 03:02:52','pending',0,NULL,NULL,1,1,NULL,'2026-04-25','12:00:00',2.00,0,0.00,0,NULL,NULL),(47,'Repair','','2026-04-25 03:08:25','pending',0,NULL,NULL,1,1,NULL,'2026-04-25','09:00:00',3.00,0,0.00,0,NULL,NULL),(48,'Diagnostics','','2026-04-25 03:12:36','pending',0,NULL,NULL,1,8,NULL,'2026-04-25','09:00:00',1.50,0,0.00,0,NULL,NULL),(49,'Battery Replacement','','2026-04-26 08:11:34','pending',0,NULL,NULL,1,7,NULL,'2026-04-27','12:00:00',0.50,1,0.00,0,NULL,NULL),(50,'Repair','[SOS EMERGENCY REQUEST]\nUser requested immediate On-site Mechanic assistance.','2026-04-26 09:00:17','Approved',1,2000.00,NULL,1,1,'',NULL,NULL,3.00,0,0.00,1,6,'I am stuck at the main road'),(51,'Towing','[SOS EMERGENCY REQUEST]\nUser requested immediate Towing assistance.','2026-04-27 07:48:32','Rejected',1,NULL,NULL,1,5,'No available mechanics',NULL,NULL,2.00,0,0.00,0,NULL,'I am stuck'),(52,'Towing','[SOS EMERGENCY REQUEST]\nUser requested immediate Towing assistance.','2026-04-27 07:54:47','pending',1,NULL,NULL,1,5,NULL,NULL,NULL,2.00,0,0.00,0,NULL,'I am stuck'),(53,'Towing','[SOS EMERGENCY REQUEST]\nUser requested immediate Towing assistance.','2026-04-27 07:59:43','Completed',1,5000.00,NULL,1,1,'',NULL,NULL,2.00,0,0.00,1,22,'I am stuckk'),(54,'Repair','[SOS EMERGENCY REQUEST]\nUser requested immediate On-site Mechanic assistance.','2026-04-27 08:33:09','Completed',1,7000.00,NULL,2,1,'',NULL,NULL,3.00,0,0.00,1,33,'On the right of the main road'),(55,'Towing','[SOS EMERGENCY REQUEST]\nUser requested immediate Towing assistance.','2026-04-27 09:38:06','Completed',1,9900.00,NULL,11,1,'',NULL,NULL,2.00,0,0.00,1,15,'I am stuckI'),(56,'Repair','[SOS EMERGENCY REQUEST]\nUser requested immediate On-site Mechanic assistance.','2026-04-27 11:10:59','Completed',1,6000.00,NULL,11,1,'',NULL,NULL,3.00,0,0.00,1,25,'At the  main road'),(57,'Towing','[SOS EMERGENCY REQUEST]\nUser requested immediate Towing assistance.','2026-04-27 11:45:14','Completed',1,1300.00,NULL,11,1,'',NULL,NULL,2.00,0,0.00,1,10,NULL);
/*!40000 ALTER TABLE `servicerequests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `superadmins`
--

DROP TABLE IF EXISTS `superadmins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `superadmins` (
  `UserID` int(11) NOT NULL,
  PRIMARY KEY (`UserID`),
  CONSTRAINT `superadmins_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `superadmins`
--

LOCK TABLES `superadmins` WRITE;
/*!40000 ALTER TABLE `superadmins` DISABLE KEYS */;
INSERT INTO `superadmins` VALUES (10);
/*!40000 ALTER TABLE `superadmins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `systemconfigs`
--

DROP TABLE IF EXISTS `systemconfigs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `systemconfigs` (
  `ConfigKey` varchar(100) NOT NULL,
  `ConfigValue` json NOT NULL,
  `Description` text,
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ConfigKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `systemconfigs`
--

LOCK TABLES `systemconfigs` WRITE;
/*!40000 ALTER TABLE `systemconfigs` DISABLE KEYS */;
INSERT INTO `systemconfigs` VALUES ('garage_capacity_settings','{\"max_dropoff_per_hour\": 2, \"daily_labor_hours_per_mechanic\": 8}','Global settings for garage availability and capacity','2026-04-25 01:17:14'),('service_duration_baselines','{\"tires\": 1, \"repair\": 3, \"towing\": 2, \"battery\": 0.5, \"default\": 1, \"electrical\": 2, \"oil change\": 0.5, \"diagnostics\": 1.5}','Calculated duration in hours for various service types','2026-04-25 01:17:13');
/*!40000 ALTER TABLE `systemconfigs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `UserID` int(11) NOT NULL AUTO_INCREMENT,
  `FullName` varchar(100) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `PhoneNumber` varchar(20) NOT NULL,
  `PasswordHash` varchar(255) NOT NULL,
  `Role` enum('Customer','Mechanic','GarageManager','GarageOwner','SuperAdmin','Accountant') NOT NULL,
  `Status` enum('Active','Inactive','Suspended','Archived') DEFAULT 'Active',
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `Email` (`Email`),
  UNIQUE KEY `PhoneNumber` (`PhoneNumber`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Garage A mechanic','garageAmechanic@test.com','0165986789','$2b$10$eR/ef.T0.8pSaQbVOBKcwOyVTNhecTvqwsZ8xFlvwivb/s.V3tkta','Mechanic','Active','2026-04-01 09:00:18'),(2,'Garage A Manager','garageAadmin@gms.com','0900000000','$2b$10$lI.yyIXzaYoOoYop9.CdSekk/xpbKWlpp1rhN634bMYaCk2FiO3C6','GarageManager','Active','2026-04-02 04:02:16'),(3,'Super Admin','Superadmin@gms.com','0165980789','$2b$10$3kJUvb.iUb1Pf0J8Glyuou2YoeQOMGEWD6XzHRcSlYbfVXb20ilSy','SuperAdmin','Active','2026-04-03 10:07:04'),(4,'Amina Hassan','amina.hassan92@gmail.com','0912345678','$2b$10$Cp1Ok3hDhAJ3qToMrom.vet39bhy81RGm9c10JeDQ.NJ0AXXCg2V.','Customer','Active','2026-04-04 08:34:56'),(5,'Garage G manager','garageGadmin@yahoo.com','0987654328','$2b$10$FCV4irqxdryB/GPr15GwhulvN0b4spQ3lyg.ytUKU4b8Ng.yhoiIG','GarageManager','Active','2026-04-04 08:35:19'),(6,'Liya Bekele','liya.bekele01@outlook.com','0945678123','$2b$10$E66pT1EaVcuYMtrJMAqgF.CVF2BxIVeZWRyiAaXgf.as7VnZXGBBi','Customer','Active','2026-04-04 08:35:34'),(7,'Abel Mohammed','abel.mohammed77@gmail.com','0971122334','$2b$10$KeAnkPCVGqub54R.mBEPFushMG8Qge9WVA0y9RSHb7TkpeZJWaeLW','Customer','Active','2026-04-04 08:36:19'),(8,'Garage G Mechanic','garageGmechanic@test.com','0933344455','$2b$10$CJCIe7fnCxv30g3Z7kI/c.VjADe064adLMpO9VZPAfJu.AFQWks1m','Mechanic','Active','2026-04-04 08:36:48'),(10,'Super Admin','admin@gms.com','0914567689','$2b$10$1p3ERR.MZXWofdx1g1MQC.bg7E/H4wae/SzpIyzpqd8YN15e367yu','SuperAdmin','Active','2026-04-05 08:04:31'),(11,'sumeya muhidin','sumsum8336@gmail.com','0983369806','$2b$10$rZA6pzYpAW3yRQaRKMMgAO.S35ZAAaqYN7HUUoL.lCSoUj8nSEN7C','Customer','Active','2026-04-05 09:04:53'),(12,'entisar kasim','entisarkasim23@gmail.com','0961905415','$2b$10$60E62ytbjkuL1z.yBAitiunXI5BrcKDHmkJ51V.SaCg/OxDPiLpPa','Customer','Active','2026-04-05 10:15:39'),(13,'sumeya muhammed','sumenaweya@gmail.com','0993639070','$2b$10$uvXEKFlRUoalL/ctcEFAUu27ZMOZpveMWfe8TYGh2ozOd75I3E2o6','Customer','Active','2026-04-05 11:59:01'),(14,'Ahmed Mohammed','sumeya9806@gmail.com','0916342580','$2b$10$kJ8H11/SqdPl9W7pIwfDouMei2fAHhWtUPpzWx8G2FJZjIc3LLz66','Customer','Active','2026-04-06 05:46:43'),(16,'Ahmed Kasim','sumeya9@gmail.com','0987124356','$2b$10$6RkAa9VT8S.0hQi1/WNEwuNN0Nn3b9.40okc1J7JarsruasUsTX2W','Mechanic','Active','2026-04-06 15:33:02'),(17,'Sumeya Ahmed','sumeyaahmed@gmail.com','0914235679','$2b$10$pkwHnDO9yGpy/jyLZML1P.V5R9K3CHMMS8GYaeyxRPj8.448f64WK','Mechanic','Active','2026-04-06 15:42:14'),(18,'Ahmed Ahmed','ahmed@mechanic.com','0913245678','$2b$10$TPDDsb7UcJR7lDzicMbg/uK.e5iLzTlYqqNsnjdpIXuh4sBZXqWse','Mechanic','Active','2026-04-06 17:29:08'),(19,'Abebe Bikila','abebebikila@gmail.com','0911112222','$2b$10$lDhQxYqID1Llqx3LgwKDt.kze3Sf8DODgJX2hC6E4hi9uds1xCWwa','Mechanic','Active','2026-04-08 14:49:45'),(20,'Abebe Kebede','abekebe@gmail.com','0987134256','$2b$10$reCVPABZAr488uFx26eQuu3uYZgWowtRD0AMFnN/bsGzC.9WRiecu','GarageManager','Active','2026-04-09 12:31:41'),(21,'Sultan Kedir','sultankedir@gmail.com','0987878787','$2b$10$oTBUSDjGFRkeU88hum6WTuzAnPXOLqXbbeV0x4m8uMEagBKGxQn4m','GarageManager','Active','2026-04-09 12:56:24'),(22,'Solomon Kebede','solkeb@gmail.com','0915161616','$2b$10$alxgh6VkNqa6ZSSmRB4s/uasWWBMYEbNsFNSI9.WyhCfz1O39QeqS','Mechanic','Active','2026-04-09 13:54:31'),(23,'Terefe Temesgen','terefetemesgen@gmail.com','0918273645','$2b$10$IuMsuA5xN96C7FqDtlvXVOf2pMAtBx/dY1blAM6ppMcCwTP//ZnwS','GarageOwner','Active','2026-04-10 14:29:30'),(24,'Selamawit Mesfin','selamawit@gmail.com','0918276821','$2b$10$PYg.mSenm4ZbaTbaDxB5ku0NQDFimWA8B5hkRTpt00GK8AXjLezca','GarageManager','Active','2026-04-10 14:31:03'),(25,'Kebede Abebe','kebedeabebe@gmail.com','0918272727','$2b$10$OOf15CfAvnPWPmBqWz2/J.J73xafJaLQIIxZH4YdLRVE6aeIpwoiG','GarageManager','Active','2026-04-10 14:33:30'),(26,'Jemal Ahmed','jemalahmed@gmail.com','0912323232','$2b$10$25ziXFGJaX6JVuFFai9jEuAGkplwQCVBR.FCnVz9h6npCO/raMTba','Mechanic','Active','2026-04-11 06:02:52'),(27,'Semira Jemal ','semirajemal@gmail.com','0912125656','$2b$10$QUCNMhK64sD2QU9omexhsefb27wKuaB42HI.lNFCfwE9aovrjbfHq','Mechanic','Active','2026-04-11 06:14:20'),(30,'Tilahun Zinab','tilahunzinab@gmail.com','0987868584','$2b$10$kVv9Vg9THCKsEY3.LZ9xr.Z/JKA39xVpqPqS88iYmt3Nig.oHtalq','Mechanic','Active','2026-04-12 07:47:08'),(31,'Semira Akmel','semirakmel@gmail.com','0946464646','$2b$10$veutlvLsmFbnjsvk9SbSyuL6MXz0rNV7PrGifcENy8kci.Jqu7eNC','Customer','Active','2026-04-12 07:51:15'),(32,'Ahmed Muhammed','summuh39@gmail.com','0710447572','$2b$10$l/OSoqp5cQzWN1rFlEGIA.wZQV5cbywbQlmu3N9ErqW4X8m0xAHC6','Mechanic','Active','2026-04-15 07:38:05'),(33,'Selam Biruh','summuh88@gmail.com','0716161616','$2b$10$t33tbt4uVR/koEp40reDEuaJMhUI3CrzpZOnetZ3t4ncTpjBKDDBC','Mechanic','Active','2026-04-15 08:02:49'),(34,'Kemal Kedir','summuh446@gmail.com','0918273666','$2b$10$2fPqiXsT6gXTBnST.due7uG5I6sywJ29oCP6IHHD0MpGis5sb5Wsi','Mechanic','Active','2026-04-15 08:05:36'),(35,'Sumeya Kemal','sumeya3633@gmail.com','0987876565','$2b$10$EufCePVl5EjdjNpvpyK05.KIqFaucx.NmtIXeC73Xa.ouuTy815i.','Mechanic','Active','2026-04-15 08:09:31'),(36,'Husna Kheyru','husskheyr@gmail.com','0991576824','$2b$10$SlFgJPdHu/nX4bqEsHYTqejqH5RwGMIIe/qF3s9tvrJnhYW7ngGd2','Mechanic','Active','2026-04-15 08:23:46'),(37,'Sultan Ahmed','h26879945@gmail.com','0934563456','$2b$10$3QU6NZgO.o.JylJOuUUZfOsVjLwC1aZvc2MVIIy2Xj5i2Xed4QG1y','Mechanic','Active','2026-04-15 08:34:59'),(38,'Beshir Ahmed','beshirahmed@gmail.com','0987162534','$2b$10$J94loMIRz/tuAG1pOfwh3uzHvumq29ETuUFTeBTMSNrqUhi5SBzCO','GarageOwner','Active','2026-04-19 13:01:29'),(39,'Verified Owner 2','verified2@example.com','+251911911911','$2b$10$VnNkWS/ENW7k2YsEj9zf6eK0ABOannf8Ucyf.AL.batuOJAW1CrTm','GarageOwner','Active','2026-04-21 17:16:35'),(40,'Chala Kebede','chalakebede@outlook.com','0913134565','$2b$10$YLAAcuelUIDdz.5btIGJtOOiROyXnIONTU7t4n3j8mYTCEdmJK1NO','Mechanic','Active','2026-04-22 12:59:08'),(41,'Fewzan Ahmed ','shehidah0544@gmail.com','0717776787','$2b$10$BqDkp2TjADmJEfgjOq1dwOz5TmxktgxLdWxOIW79On//sd/E6QnMy','Accountant','Active','2026-04-22 13:29:00'),(47,'Salim Bedr','sum70208@gmail.com','0978877667','$2b$10$ahsiYzfHF7dwomYeUIArtuCjT.OUzmiKivyprEzj.5uKSLxoIryyq','Accountant','Active','2026-04-22 14:18:11'),(48,'Test Mechanic','testmech1776910721216@test.com','+251911000000','$2b$10$ImytxDGk5Zz2zFs5OnuaFuHl3IX5ji8DiVQis3cRzb7cY7c74SXDm','Mechanic','Active','2026-04-23 02:18:41'),(49,'Test Mechanic UI 1776910768790','uimech1776910768790@test.com','+2519112380','$2b$10$xdv0LABeD6LEr3M03Jasy.rzfXWxeF/faPj04ZzBiI93VxZK5Sney','Mechanic','Active','2026-04-23 02:19:29'),(50,'Test Mechanic UI 1776910802279','uimech1776910802279@test.com','+2519119473','$2b$10$YD93KwmNwyhjQ355ZMetu.OGBKd15s3vUyh4aFoAoqNv7hVikWMOW','Mechanic','Archived','2026-04-23 02:20:02'),(51,'Test Mechanic UI 1776910822681','uimech1776910822681@test.com','+2519113453','$2b$10$QE/SAh3ePaQeRkZrHZGmL.Wjvywq4sA3Ea9Sl/Z./DR8ADadRGS/C','Mechanic','Archived','2026-04-23 02:20:23'),(52,'Test Mechanic UI 1776911045048','uimech1776911045048@test.com','+2519116222','$2b$10$S34f5MRKHef14EQoQ2E3rea2vj3Zk2W4CKM6bLint6/Mb.3Mfulsu','Mechanic','Archived','2026-04-23 02:24:05'),(53,'Beza Girma','pixelphotography63@gmail.com','0976677887','$2b$10$nqAGYlgP/eqi0.5RlVJruubiq5H4zYHpETzih4fHGmY4xAOgeFJdi','Mechanic','Active','2026-04-23 02:29:49'),(54,'Zelalem Kibru','entisarkaism44@gmail.com','0954455665','$2b$10$qhvytegYDMrpdKtWtH/o7.YI.xxVmoMwJfOI/r3MqD7H.gsv2jKvm','Accountant','Active','2026-04-23 02:32:42'),(55,'Adiss Alemayehu','adiss11@gmail.com','0912211132','$2b$10$fKzl4RjwVvkCeCKrFgorOOd.Sp.6JkeXEYhMpDjcQIQzqOYhx./Dq','GarageOwner','Active','2026-04-23 03:15:11'),(56,'Bekele Nega','bekele22@gmail.com','0915262267','$2b$10$QIuGmfUoK2xFK0iMUK6lruT9fXv.s3lPeheI8.ts3uLj.3OPr9vQG','GarageOwner','Active','2026-04-23 03:18:06');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicles`
--

DROP TABLE IF EXISTS `vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicles` (
  `VehicleID` int(11) NOT NULL AUTO_INCREMENT,
  `PlateNumber` varchar(20) DEFAULT NULL,
  `Type` varchar(50) DEFAULT NULL,
  `Model` varchar(50) DEFAULT NULL,
  `CustomerID` int(11) DEFAULT NULL,
  PRIMARY KEY (`VehicleID`),
  UNIQUE KEY `PlateNumber` (`PlateNumber`),
  KEY `CustomerID` (`CustomerID`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicles`
--

LOCK TABLES `vehicles` WRITE;
/*!40000 ALTER TABLE `vehicles` DISABLE KEYS */;
INSERT INTO `vehicles` VALUES (1,'ABC-123','Car','Honda Civic',4),(2,'XYZ-789','Car','Toyota Corolla',4),(4,'ET-4567','Truck','Isuzu NPR',6),(5,'AA-9081','SUV','Hyundai Tucson',6),(6,'BB-46282','Sedan','Toyota',11),(8,'AA-74794','SUV','Corolla',13),(9,'AA-68913','Sedan','Toyota',12),(10,'CB-76890','SUV','Toyota',31),(11,'AD-14841','Sedan','Corolla',4);
/*!40000 ALTER TABLE `vehicles` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-27 16:56:32
