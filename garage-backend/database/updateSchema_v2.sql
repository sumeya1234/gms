-- 2. Add preservice deposit percentage to Garages
ALTER TABLE Garages
  ADD COLUMN PreserviceDepositPercentage DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER WorkingHours;

-- 3. Add estimated price to ServiceRequests for emergency offers
ALTER TABLE ServiceRequests
  ADD COLUMN EstimatedPrice DECIMAL(10,2) NULL AFTER IsEmergency,
  ADD COLUMN EmergencyStatus ENUM('Pending','OfferSent','Accepted','Rejected') NULL AFTER EstimatedPrice;
