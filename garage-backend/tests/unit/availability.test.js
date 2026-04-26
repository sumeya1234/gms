import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchGarageAvailability } from '../../services/bookingService.js';
import db from '../../config/db.js';
import { getConfig } from '../../services/configService.js';

vi.mock('../../config/db.js', () => ({
    default: {
        query: vi.fn(),
        getConnection: vi.fn()
    }
}));

vi.mock('../../services/configService.js', () => ({
    getConfig: vi.fn()
}));

describe('Booking Service - fetchGarageAvailability', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default configs
        getConfig.mockImplementation(async (key) => {
            if (key === 'garage_capacity_settings') {
                return { daily_labor_hours_per_mechanic: 8.0, max_dropoff_per_hour: 2 };
            }
            if (key === 'service_duration_baselines') {
                return { default: 1.0 };
            }
            return null;
        });
    });

    it('should correctly identify a closed day based on working hours', async () => {
        const garageId = 1;
        const date = '2026-04-26'; // Sunday (closed in default hours)

        db.query.mockResolvedValueOnce([[{ WorkingHours: null }]]); // default hours used
        db.query.mockResolvedValueOnce([[{ count: 2 }]]); // mechanics count
        db.query.mockResolvedValueOnce([[{ totalHours: 0 }]]); // active bookings
        db.query.mockResolvedValueOnce([[]]); // drop off counts

        const result = await fetchGarageAvailability(garageId, date);
        expect(result.isClosedDay).toBe(true);
        expect(result.availableSlots).toEqual([]);
    });

    it('should return available hourly slots for an open day', async () => {
        const garageId = 1;
        const date = '2026-04-27'; // Monday

        // Mock default hours (8-18)
        db.query.mockResolvedValueOnce([[{ WorkingHours: null }]]);
        db.query.mockResolvedValueOnce([[{ count: 2 }]]);
        db.query.mockResolvedValueOnce([[{ totalHours: 0 }]]);
        db.query.mockResolvedValueOnce([[]]);

        const result = await fetchGarageAvailability(garageId, date);
        expect(result.isClosedDay).toBe(false);
        expect(result.availableSlots.length).toBeGreaterThan(0);
        expect(result.availableSlots[0]).toBe('08:00');
    });

    it('should identify fully booked days when capacity is reached', async () => {
        const garageId = 1;
        const date = '2026-04-27'; // Monday

        db.query.mockResolvedValueOnce([[{ WorkingHours: null }]]);
        db.query.mockResolvedValueOnce([[{ count: 1 }]]); // 1 mechanic = 8 hours limit
        db.query.mockResolvedValueOnce([[{ totalHours: 8.5 }]]); // already 8.5 hours booked
        db.query.mockResolvedValueOnce([[]]);

        const result = await fetchGarageAvailability(garageId, date);
        expect(result.isFullyBooked).toBe(true);
        expect(result.bookedHours).toBe(8.5);
        expect(result.capacity).toBe(8);
    });

    it('should identify congested time slots', async () => {
        const garageId = 1;
        const date = '2026-04-27';

        db.query.mockResolvedValueOnce([[{ WorkingHours: null }]]);
        db.query.mockResolvedValueOnce([[{ count: 2 }]]);
        db.query.mockResolvedValueOnce([[{ totalHours: 2 }]]);
        db.query.mockResolvedValueOnce([[
            { DropOffTime: '09:00:00', count: 2 }, // Limit is 2
            { DropOffTime: '10:00:00', count: 1 }
        ]]);

        const result = await fetchGarageAvailability(garageId, date);
        expect(result.congestedTimes).toContain('09:00');
        expect(result.congestedTimes).not.toContain('10:00');
    });
});
