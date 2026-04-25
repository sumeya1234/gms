import db from "./db.js";

const parseEnumValues = (columnType = "") => {
  const match = columnType.match(/^enum\((.*)\)$/i);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((v) => v.trim().replace(/^'/, "").replace(/'$/, ""))
    .filter(Boolean);
};

const ensureUsersRoleSupportsAccountant = async () => {
  const [rows] = await db.query(
    `SELECT COLUMN_TYPE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'Users'
       AND COLUMN_NAME = 'Role'`
  );

  if (!rows.length) return;

  const currentValues = parseEnumValues(rows[0].COLUMN_TYPE);
  const requiredValues = ["Customer", "Mechanic", "GarageManager", "GarageOwner", "Accountant", "SuperAdmin"];
  const missing = requiredValues.filter((role) => !currentValues.includes(role));

  if (missing.length === 0) return;

  const mergedValues = [...new Set([...currentValues, ...requiredValues])];
  const enumSql = mergedValues.map((v) => `'${v}'`).join(", ");
  await db.query(`ALTER TABLE Users MODIFY COLUMN Role ENUM(${enumSql}) NOT NULL`);
};

export const ensureAccountantsTableExists = async () => {
  await ensureUsersRoleSupportsAccountant();
  await db.query(`
    CREATE TABLE IF NOT EXISTS Accountants (
      UserID INT PRIMARY KEY,
      GarageID INT,
      FOREIGN KEY (UserID) REFERENCES Users(UserID),
      FOREIGN KEY (GarageID) REFERENCES Garages(GarageID)
    )
  `);
};
