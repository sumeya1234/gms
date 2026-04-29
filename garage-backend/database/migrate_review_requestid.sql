-- Add RequestID column to reviews table for per-request review tracking
ALTER TABLE reviews ADD COLUMN RequestID INT NULL;
ALTER TABLE reviews ADD FOREIGN KEY (RequestID) REFERENCES servicerequests(RequestID);
-- Add unique constraint so each request can only be reviewed once
ALTER TABLE reviews ADD UNIQUE KEY unique_request_review (RequestID);

-- Create complaintmessages table for Issue 4 (complaint messaging)
CREATE TABLE IF NOT EXISTS complaintmessages (
    MessageID INT AUTO_INCREMENT PRIMARY KEY,
    ComplaintID INT NOT NULL,
    SenderID INT NOT NULL,
    Message TEXT NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ComplaintID) REFERENCES complaints(ComplaintID) ON DELETE CASCADE,
    FOREIGN KEY (SenderID) REFERENCES users(UserID)
);
