import { describe, it, expect } from 'vitest';
import {
  getBatteryChemistry,
  calculateUsableCapacity,
  simulateSOC,
  calculateDegradation,
  validateBatteryConfig,
} from '../../src/engine/battery.js';

describe('Battery Calculations', () => {
  describe('getBatteryChemistry', () => {
    it('should return LFP defaults', () => {
      const result = getBatteryChemistry('lfp');
      expect(result.dod).toBe(0.92);
      expect(result.rte).toBe(0.95);
    });

    it('should return Lead-Acid defaults', () => {
      const result = getBatteryChemistry('lead_acid');
      expect(result.dod).toBe(0.50);
      expect(result.rte).toBe(0.82);
    });

    it('should default to LFP for unknown', () => {
      const result = getBatteryChemistry('unknown');
      expect(result.id).toBe('lfp');
    });
  });

  describe('calculateUsableCapacity', () => {
    it('should multiply capacity by DoD', () => {
      const result = calculateUsableCapacity(10, 0.9);
      expect(result).toBe(9);
    });
  });

  describe('simulateSOC', () => {
    const baseConfig = {
      usableCapacityKwh: 10,
      maxDoD: 0.9,
      roundTripEfficiency: 0.95,
      blackoutHours: 24,
    };

    it('should maintain SOC with zero load and zero solar', () => {
      const result = simulateSOC({
        ...baseConfig,
        hourlySolarOutput: new Array(24).fill(0),
        hourlyLoadDemand: new Array(24).fill(0),
      });
      expect(result.hourlySoc[23]).toBeCloseTo(10, 1);
    });

    it('should discharge with load and no solar', () => {
      const result = simulateSOC({
        ...baseConfig,
        hourlySolarOutput: new Array(24).fill(0),
        hourlyLoadDemand: new Array(24).fill(1000),
      });
      expect(result.hourlySoc[23]).toBeLessThan(10);
    });

    it('should charge with solar and no load', () => {
      const result = simulateSOC({
        ...baseConfig,
        initialSocKwh: 5,
        hourlySolarOutput: new Array(24).fill(1000),
        hourlyLoadDemand: new Array(24).fill(0),
      });
      expect(result.hourlySoc[23]).toBeGreaterThan(5);
    });

    it('should not discharge below DoD floor', () => {
      const result = simulateSOC({
        ...baseConfig,
        hourlySolarOutput: new Array(24).fill(0),
        hourlyLoadDemand: new Array(24).fill(5000),
      });
      const minAllowed = 10 * (1 - 0.9);
      expect(result.hourlySoc[23]).toBeGreaterThanOrEqual(minAllowed - 0.1);
    });

    it('should track depletion time correctly', () => {
      const result = simulateSOC({
        ...baseConfig,
        blackoutHours: 48,
        hourlySolarOutput: new Array(24).fill(0),
        hourlyLoadDemand: new Array(24).fill(2000),
      });
      expect(result.hoursUntilDepletion).toBeLessThan(10);
    });
  });

  describe('calculateDegradation', () => {
    it('should calculate fractional cycles correctly', () => {
      const result = calculateDegradation({
        totalEnergyDischargedWh: 5000,
        usableCapacityKwh: 10,
        chemistryId: 'lfp',
        maxDoD: 0.9,
        blackoutsPerYear: 4,
      });
      expect(result.cyclesPerEvent).toBeCloseTo(0.5, 1);
    });

    it('should estimate years remaining', () => {
      const result = calculateDegradation({
        totalEnergyDischargedWh: 5000,
        usableCapacityKwh: 10,
        chemistryId: 'lfp',
        maxDoD: 0.9,
        blackoutsPerYear: 4,
      });
      expect(result.yearsFromCycling).toBeGreaterThan(0);
    });

    it('should include disclaimer', () => {
      const result = calculateDegradation({
        totalEnergyDischargedWh: 5000,
        usableCapacityKwh: 10,
        chemistryId: 'lfp',
        maxDoD: 0.9,
        blackoutsPerYear: 4,
      });
      expect(result.disclaimer).toContain('Estimates');
    });
  });

  describe('validateBatteryConfig', () => {
    it('should validate correct config', () => {
      const result = validateBatteryConfig({
        capacityKwh: 10,
        chemistry: 'lfp',
        maxDoD: 0.9,
        roundTripEfficiency: 0.95,
      });
      expect(result.isValid).toBe(true);
    });

    it('should reject zero capacity', () => {
      const result = validateBatteryConfig({
        capacityKwh: 0,
        chemistry: 'lfp',
        maxDoD: 0.9,
        roundTripEfficiency: 0.95,
      });
      expect(result.isValid).toBe(false);
    });

    it('should reject invalid DoD', () => {
      const result = validateBatteryConfig({
        capacityKwh: 10,
        chemistry: 'lfp',
        maxDoD: 1.5,
        roundTripEfficiency: 0.95,
      });
      expect(result.isValid).toBe(false);
    });
  });
});
