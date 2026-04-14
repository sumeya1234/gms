-- Add RequestID column to Reviews table for per-request review tracking
ALTER TABLE Reviews ADD COLUMN RequestID INT NULL;
ALTER TABLE Reviews ADD FOREIGN KEY (RequestID) REFERENCES ServiceRequests(RequestID);
-- Add unique constraint so each request can only be reviewed once
ALTER TABLE Reviews ADD UNIQUE KEY unique_request_review (RequestID);

-- Create ComplaintMessages table for Issue 4 (complaint messaging)
CREATE TABLE IF NOT EXISTS ComplaintMessages (
    MessageID INT AUTO_INCREMENT PRIMARY KEY,
    ComplaintID INT NOT NULL,
    SenderID INT NOT NULL,
    Message TEXT NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ComplaintID) REFERENCES Complaints(ComplaintID) ON DELETE CASCADE,
    FOREIGN KEY (SenderID) REFERENCES Users(UserID)
);
