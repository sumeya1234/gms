import "../config/env.js";
import db from "../config/db.js";

async function migrate() {
  const queries = [
    // Issue 1: Add RequestID to Reviews for per-request review tracking
    `ALTER TABLE Reviews ADD COLUMN RequestID INT NULL`,
    `ALTER TABLE Reviews ADD UNIQUE KEY unique_request_review (RequestID)`,

    // Issue 4: Create ComplaintMessages table for customer-manager messaging
    `CREATE TABLE IF NOT EXISTS ComplaintMessages (
      MessageID INT AUTO_INCREMENT PRIMARY KEY,
      ComplaintID INT NOT NULL,
      SenderID INT NOT NULL,
      Message TEXT NOT NULL,
      CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ComplaintID) REFERENCES Complaints(ComplaintID) ON DELETE CASCADE,
      FOREIGN KEY (SenderID) REFERENCES Users(UserID)
    )`
  ];

  for (const sql of queries) {
    try {
      await db.query(sql);
      console.log("✅", sql.slice(0, 60) + "...");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME" || err.code === "ER_DUP_KEYNAME" || err.code === "ER_TABLE_EXISTS_ERROR") {
        console.log("⏩ Skipped (already exists):", sql.slice(0, 60) + "...");
      } else {
        console.error("❌ Failed:", err.message);
      }
    }
  }

  console.log("\n🎉 Migration complete!");
  process.exit(0);
}

migrate();
