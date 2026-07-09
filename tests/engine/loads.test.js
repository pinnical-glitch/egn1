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
    { id: 'fridge', name: 'Refrigerator', w: 150, s: 450, h: 8.4, p: 'Critical', m: true },
    { id: 'lights', name: 'LED Lights', w: 50, s: 50, h: 6, p: 'Critical', m: false },
    { id: 'tv', name: 'Television', w: 100, s: 100, h: 5, p: 'Important', m: false },
  ];

  describe('calculateTotalConnectedLoad', () => {
    it('should sum all rated watts', () => {
      const result = calculateTotalConnectedLoad(mockAppliances);
      expect(result).toBe(300);
    });

    it('should return 0 for empty array', () => {
      const result = calculateTotalConnectedLoad([]);
      expect(result).toBe(0);
    });
  });

  describe('calculatePeakLoad', () => {
    it('should add single largest surge to running total', () => {
      const result = calculatePeakLoad(mockAppliances);
      expect(result).toBe(600);
    });

    it('should handle no motor-driven appliances', () => {
      const nonMotor = [
        { ...mockAppliances[1], m: false },
        { ...mockAppliances[2], m: false },
      ];
      const result = calculatePeakLoad(nonMotor);
      expect(result).toBe(150);
    });
  });

  describe('calculateDailyEnergyDemand', () => {
    it('should calculate Wh/day correctly', () => {
      const result = calculateDailyEnergyDemand(mockAppliances);
      expect(result).toBe(2060);
    });
  });

  describe('calculateEnergyDemandByPriority', () => {
    it('should group by priority', () => {
      const result = calculateEnergyDemandByPriority(mockAppliances);
      expect(result.Critical).toBe(1560);
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
      const result = validateAppliance({ w: 100, h: 5 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Appliance name is required');
    });

    it('should reject zero watts', () => {
      const result = validateAppliance({ name: 'Test', w: 0, h: 5 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Rated watts must be greater than 0');
    });

    it('should reject hours > 24', () => {
      const result = validateAppliance({ name: 'Test', w: 100, h: 25 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Hours per day must be between 0 and 24');
    });
  });
});
