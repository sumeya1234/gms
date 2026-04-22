-- Add deposit tracking to ServiceRequests
ALTER TABLE ServiceRequests
  ADD COLUMN DepositAmount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IsDepositPaid BOOLEAN DEFAULT FALSE;

-- Allow multiple payments per RequestID
ALTER TABLE Payments DROP INDEX RequestID;
ALTER TABLE Payments ADD INDEX (RequestID);
