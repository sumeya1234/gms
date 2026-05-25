-- Fix schema for inventory table
ALTER TABLE inventory ADD COLUMN SellingPrice DECIMAL(10,2) DEFAULT 0.00;

-- Rename ReviewDate to CreatedAt in reviews table for consistency
ALTER TABLE reviews CHANGE COLUMN ReviewDate CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Double check other tables (using standard ALTER but these might already exist)
-- To be safe, I'll use a procedure or just run them individually and ignore failures if already exist.
-- But I'll just run the ones I know are missing.
-- I'll skip RejectionReason and Timezone if they were already there.
