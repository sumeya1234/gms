
import 'dotenv/config';
import { modifyGarage } from "./services/garageService.js";

async function testModify() {
    try {
        const user = { id: 5, role: 'GarageManager' };
        const id = 2;
        const updateData = {
            name: 'Garage G Updated',
            location: 'Updated Location',
            contact: '0912345678',
            workingHours: {
                monday: { isOpen: true, open: '08:00', close: '18:00' },
                tuesday: { isOpen: true, open: '08:00', close: '18:00' },
                wednesday: { isOpen: true, open: '08:00', close: '18:00' },
                thursday: { isOpen: true, open: '08:00', close: '18:00' },
                friday: { isOpen: true, open: '08:00', close: '18:00' },
                saturday: { isOpen: true, open: '09:00', close: '14:00' },
                sunday: { isOpen: false, open: null, close: null }
            }
        };

        console.log("Starting modifyGarage simulation...");
        await modifyGarage(id, updateData, user);
        console.log("modifyGarage simulation finished successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Simulation failed:", err);
        process.exit(1);
    }
}

testModify();
