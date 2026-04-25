import dotenv from 'dotenv';
dotenv.config();

import { getGarageOwnerOverview, getGarageRevenueByPeriod, generateGarageOperationalReport } from './services/dashboardService.js';
import db from './config/db.js';

async function test() {
    try {
        const [[garage]] = await db.query('SELECT GarageID FROM Garages LIMIT 1');
        if (!garage) {
            console.log('No garages found');
            return;
        }
        const garageId = garage.GarageID;
        console.log(`Testing with GarageID: ${garageId}`);

        console.log('--- getGarageOwnerOverview ---');
        const overview = await getGarageOwnerOverview(garageId);
        console.log(overview);

        console.log('--- getGarageRevenueByPeriod ---');
        const revenue = await getGarageRevenueByPeriod(garageId, 'weekly');
        console.log(revenue);

        console.log('--- generateGarageOperationalReport ---');
        const report = await generateGarageOperationalReport(garageId, 'monthly');
        console.log(report);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

test();
