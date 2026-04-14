import 'dotenv/config';
import db from '../config/db.js';

const DEFAULT_SERVICES = [
  { name: 'Towing', price: 1500 },
  { name: 'Diagnostics', price: 800 },
  { name: 'Tires', price: 2000 },
  { name: 'Oil Change', price: 1200 },
  { name: 'Repair', price: 3000 },
  { name: 'Battery', price: 2500 },
  { name: 'Electrical', price: 1800 },
];

async function seedServices() {
  const [garages] = await db.query('SELECT GarageID, Name FROM Garages');
  console.log(`Found ${garages.length} garages.`);

  let inserted = 0;
  for (const garage of garages) {
    for (const svc of DEFAULT_SERVICES) {
      // Check if this service already exists for this garage
      const [existing] = await db.query(
        'SELECT 1 FROM GarageServices WHERE GarageID = ? AND ServiceName = ?',
        [garage.GarageID, svc.name]
      );
      if (existing.length === 0) {
        await db.query(
          'INSERT INTO GarageServices (ServiceName, Price, GarageID) VALUES (?, ?, ?)',
          [svc.name, svc.price, garage.GarageID]
        );
        inserted++;
        console.log(`  + ${svc.name} (${svc.price} ETB) → ${garage.Name}`);
      }
    }
  }

  console.log(`\nDone! Inserted ${inserted} new service entries.`);
  process.exit(0);
}

seedServices().catch(e => { console.error(e); process.exit(1); });
