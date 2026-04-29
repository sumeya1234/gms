-- Migration to add missing columns to Garages table
-- Run this if you are getting "Unknown column" errors for Timezone or EmergencyDepositPercentage

ALTER TABLE Garages ADD COLUMN IF NOT EXISTS Timezone VARCHAR(64) DEFAULT 'Africa/Addis_Ababa' AFTER WorkingHours;
ALTER TABLE Garages ADD COLUMN IF NOT EXISTS EmergencyDepositPercentage DECIMAL(5,2) DEFAULT 10.00 AFTER Timezone;
