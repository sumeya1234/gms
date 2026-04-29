-- Migration to add missing columns to garages table
-- Run this if you are getting "Unknown column" errors for Timezone or EmergencyDepositPercentage

ALTER TABLE garages ADD COLUMN IF NOT EXISTS Timezone VARCHAR(64) DEFAULT 'Africa/Addis_Ababa' AFTER WorkingHours;
ALTER TABLE garages ADD COLUMN IF NOT EXISTS EmergencyDepositPercentage DECIMAL(5,2) DEFAULT 10.00 AFTER Timezone;
