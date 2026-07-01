import { describe, it, expect } from 'vitest';
import {
  calculateTotalConnectedLoad,
  calculatePeakLoad,
  calculateDailyEnergyDemand,
  calculateEnergyDemandByPriority,
  validateAppliance,
} from '../../src/engine/loads.js';

describe('Load Calculations', () => {
  const mockAppliances = [
    {
      id: 'fridge',
      name: 'Refrigerator',
      ratedWatts: 150,
      surgeWatts: 450,
      defaultHoursPerDay: 8.4,
      priority: 'Critical',
      isMotorDriven: true,
    },
    {
      id: 'lights',
      name: 'LED Lights',
      ratedWatts: 50,
      surgeWatts: 50,
      defaultHoursPerDay: 6,
      priority: 'Critical',
      isMotorDriven: false,
    },
    {
      id: 'tv',
      name: 'Television',
      ratedWatts: 100,
      surgeWatts: 100,
      defaultHoursPerDay: 5,
      priority: 'Important',
      isMotorDriven: false,
    },
  ];

  describe('calculateTotalConnectedLoad', () => {
    it('should sum all rated watts', () => {
      const result = calculateTotalConnectedLoad(mockAppliances);
      expect(result).toBe(300); // 150 + 50 + 100
    });

    it('should return 0 for empty array', () => {
      const result = calculateTotalConnectedLoad([]);
      expect(result).toBe(0);
    });
  });

  describe('calculatePeakLoad', () => {
    it('should add single largest surge to running total', () => {
      const result = calculatePeakLoad(mockAppliances);
      // Running: 300W, Fridge surge: 450-150 = 300W additional
      expect(result).toBe(600); // 300 + 300
    });

    it('should handle no motor-driven appliances', () => {
      const nonMotor = [
        { ...mockAppliances[1], isMotorDriven: false },
        { ...mockAppliances[2], isMotorDriven: false },
      ];
      const result = calculatePeakLoad(nonMotor);
      expect(result).toBe(150); // Just running total, no surge
    });
  });

  describe('calculateDailyEnergyDemand', () => {
    it('should calculate Wh/day correctly', () => {
      const result = calculateDailyEnergyDemand(mockAppliances);
      // Fridge: 150 * 8.4 = 1260
      // Lights: 50 * 6 = 300
      // TV: 100 * 5 = 500
      expect(result).toBe(2060);
    });
  });

  describe('calculateEnergyDemandByPriority', () => {
    it('should group by priority', () => {
      const result = calculateEnergyDemandByPriority(mockAppliances);
      expect(result.Critical).toBe(1560); // 1260 + 300
      expect(result.Important).toBe(500);
      expect(result.Optional).toBe(0);
    });
  });

  describe('validateAppliance', () => {
    it('should validate correct appliance', () => {
      const result = validateAppliance(mockAppliances[0]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing name', () => {
      const result = validateAppliance({ ratedWatts: 100, defaultHoursPerDay: 5 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Appliance name is required');
    });

    it('should reject zero watts', () => {
      const result = validateAppliance({ name: 'Test', ratedWatts: 0, defaultHoursPerDay: 5 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Rated watts must be greater than 0');
    });

    it('should reject hours > 24', () => {
      const result = validateAppliance({ name: 'Test', ratedWatts: 100, defaultHoursPerDay: 25 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Hours per day must be between 0 and 24');
    });
  });
});
