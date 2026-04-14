import 'dotenv/config';
import db from '../config/db.js';
import { modifyGarage } from '../services/garageService.js';

const fakeUser = { id: 3, role: 'SuperAdmin' };

try {
  console.log("Before update:");
  const [before] = await db.query("SELECT GarageID, Name, BankCode, BankAccountNumber, BankAccountName, ChapaSubaccountID FROM Garages WHERE GarageID = 1");
  console.log(before[0]);

  console.log("\nAttempting update with bank details...");
  await modifyGarage(1, {
    name: 'Garage A',
    location: 'Uptown',
    contact: '0123456789',
    bankCode: '128',
    bankAccountNumber: '0900123456',
    bankAccountName: 'Test Account'
  }, fakeUser);

  console.log("\nAfter update:");
  const [after] = await db.query("SELECT GarageID, Name, BankCode, BankAccountNumber, BankAccountName, ChapaSubaccountID FROM Garages WHERE GarageID = 1");
  console.log(after[0]);
} catch (e) {
  console.error("ERROR:", e.message);
}

process.exit(0);
