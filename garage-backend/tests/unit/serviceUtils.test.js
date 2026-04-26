import { describe, it, expect } from 'vitest';
import { calculateDuration, calculateBaseServicePrice, calculateDeposit } from '../../utils/serviceUtils.js';

describe('Service Utilities - calculateDuration', () => {
    const mockBaselines = {
        "oil change": 0.5,
        "diagnostics": 1.5,
        "tires": 1.0,
        "battery": 0.5,
        "electrical": 2.0,
        "repair": 3.0,
        "towing": 2.0,
        "default": 1.0
    };

    it('should return 0.5 for purely oil change', () => {
        expect(calculateDuration('Oil Change', mockBaselines)).toBe(0.5);
    });

    it('should return 1.5 for diagnostics', () => {
        expect(calculateDuration('Diagnostics', mockBaselines)).toBe(1.5);
    });

    it('should sum multiple services correctly (Oil Change + Diagnostics)', () => {
        // 0.5 + 1.5 = 2.0
        expect(calculateDuration('Oil Change, Diagnostics', mockBaselines)).toBe(2.0);
    });

    it('should return 3.0 for general repair', () => {
        expect(calculateDuration('Engine Repair', mockBaselines)).toBe(3.0);
    });

    it('should return 2.0 for towing', () => {
        expect(calculateDuration('Towing Service', mockBaselines)).toBe(2.0);
    });

    it('should handle multiple complex services (Tires, Battery, Electrical)', () => {
        // 1.0 (Tires) + 0.5 (Battery) + 2.0 (Electrical) = 3.5
        expect(calculateDuration('Tires, Battery, Electrical', mockBaselines)).toBe(3.5);
    });

    it('should return default 1.0 for unknown services', () => {
        expect(calculateDuration('Car Wash', mockBaselines)).toBe(1.0);
    });

    it('should handle mixed case and whitespace', () => {
        expect(calculateDuration('  OIL CHANGE  , diagnostics  ', mockBaselines)).toBe(2.0);
    });

    it('should return 1.0 for empty or null input', () => {
        expect(calculateDuration('', mockBaselines)).toBe(1.0);
        expect(calculateDuration(null, mockBaselines)).toBe(1.0);
    });

    it('should use internal defaults if no baselines provided', () => {
        expect(calculateDuration('Oil Change')).toBe(0.5);
    });
});

describe('Service Utilities - calculateBaseServicePrice', () => {
    const mockCatalogue = [
        { ServiceName: 'Oil Change', Price: 500 },
        { ServiceName: 'Diagnostics', Price: 1000 },
        { ServiceName: 'Tire Rotation', Price: 300 }
    ];

    it('should calculate total for multiple valid services', () => {
        expect(calculateBaseServicePrice('Oil Change, Diagnostics', mockCatalogue)).toBe(1500);
    });

    it('should ignore case and extra whitespace', () => {
        expect(calculateBaseServicePrice('  oil change  ', mockCatalogue)).toBe(500);
    });

    it('should return 0 if no services match', () => {
        expect(calculateBaseServicePrice('Car Wash', mockCatalogue)).toBe(0);
    });

    it('should return 0 for empty inputs', () => {
        expect(calculateBaseServicePrice('', mockCatalogue)).toBe(0);
        expect(calculateBaseServicePrice('Oil Change', [])).toBe(0);
    });
});

describe('Service Utilities - calculateDeposit', () => {
    it('should calculate 10% of 1000 correctly', () => {
        expect(calculateDeposit(1000, 10)).toBe(100);
    });

    it('should round up correctly (ceil)', () => {
        // 10% of 995 = 99.5 -> 100
        expect(calculateDeposit(995, 10)).toBe(100);
    });

    it('should return 0 if percentage or price is missing', () => {
        expect(calculateDeposit(1000, 0)).toBe(0);
        expect(calculateDeposit(0, 10)).toBe(0);
    });
});
