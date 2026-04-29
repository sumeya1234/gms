import '../config/env.js';
import db from '../config/db.js';

const run = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS MechanicSkills (
      SkillID INT AUTO_INCREMENT PRIMARY KEY,
      MechanicID INT,
      SkillName VARCHAR(100) NOT NULL,
      FOREIGN KEY (MechanicID) REFERENCES mechanics(UserID) ON DELETE CASCADE,
      UNIQUE KEY unique_skill (MechanicID, SkillName)
    )
  `);
  console.log('MechanicSkills table created successfully');
  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });
