import { describe, it, expect } from 'vitest';
import {
  getTiltOrientationDerate,
  calculateTempDerate,
  calculateEffectiveArrayPowerLegacy,
  calculateDailySolarEnergy,
  generateHourlySolarCurve,
  validateSolarConfig,
} from '../../src/engine/solar.js';

describe('Solar Calculations', () => {
  describe('getTiltOrientationDerate', () => {
    it('should return 1.0 for optimal south-facing at 30 degrees', () => {
      const result = getTiltOrientationDerate('S', 30);
      expect(result).toBe(1.0);
    });

    it('should return lower value for north-facing', () => {
      const result = getTiltOrientationDerate('N', 30);
      expect(result).toBeLessThan(0.7);
    });

    it('should handle flat roof (0 degrees)', () => {
      const result = getTiltOrientationDerate('S', 0);
      expect(result).toBe(0.85);
    });

    it('should handle vertical wall (90 degrees)', () => {
      const result = getTiltOrientationDerate('S', 90);
      expect(result).toBe(0.70);
    });
  });

  describe('calculateTempDerate', () => {
    it('should return 1.0 at 25°C cell temp (5°C ambient)', () => {
      // Phase 2: Use NOCT model - at 5°C ambient with NOCT=45, cell temp = 5 + (45-20)/800*800 = 30°C
      // This gives a small derate, which is realistic
      const result = calculateTempDerate(5);
      // With NOCT model: cellTemp = 5 + (45-20)/800*800 = 30°C
      // derate = 1 + (-0.0038) * (30-25) = 1 - 0.019 = 0.981
      expect(result).toBeCloseTo(0.981, 2);
    });

    it('should decrease at higher temperatures', () => {
      const result = calculateTempDerate(35);
      expect(result).toBeLessThan(0.95);
    });

    it('should not increase above 1.0 at very cold temperatures', () => {
      const result = calculateTempDerate(-10);
      // At -10°C ambient, cell temp = -10 + 25 = 15°C (below 25°C reference)
      // derate = 1.0 (no derate below reference)
      expect(result).toBe(1.0);
    });
  });

  describe('calculateEffectiveArrayPowerLegacy', () => {
    it('should apply all derate factors', () => {
      const result = calculateEffectiveArrayPowerLegacy(
        10,    // 10 panels
        400,   // 400W each
        0.95,  // temp derate
        0.90,  // tilt/orientation derate
        0.86   // system derate (PVWatts default)
      );
      // 10 * 400 * 0.95 * 0.90 * 0.86 = 2941.2
      expect(result).toBeCloseTo(2941.2, 0);
    });
  });

  describe('calculateDailySolarEnergy', () => {
    it('should multiply power by PSH', () => {
      const result = calculateDailySolarEnergy(3000, 5);
      expect(result).toBe(15000); // 3000W * 5h = 15000Wh
    });
  });

  describe('generateHourlySolarCurve', () => {
    it('should generate 24-hour array', () => {
      const result = generateHourlySolarCurve(15000, 6, 20);
      expect(result).toHaveLength(24);
    });

    it('should have zero output at night', () => {
      const result = generateHourlySolarCurve(15000, 6, 20);
      expect(result[0]).toBe(0); // Midnight
      expect(result[3]).toBe(0); // 3 AM
      expect(result[23]).toBe(0); // 11 PM
    });

    it('should peak around midday', () => {
      const result = generateHourlySolarCurve(15000, 6, 20);
      const middayOutput = result[13]; // 1 PM
      const morningOutput = result[8]; // 8 AM
      expect(middayOutput).toBeGreaterThan(morningOutput);
    });

    it('should sum approximately to daily total', () => {
      const dailyTotal = 15000;
      const result = generateHourlySolarCurve(dailyTotal, 6, 20);
      const sum = result.reduce((a, b) => a + b, 0);
      // Allow 30% tolerance due to discrete hourly steps and sine-squared approximation
      expect(sum).toBeGreaterThan(dailyTotal * 0.7);
      expect(sum).toBeLessThan(dailyTotal * 1.3);
    });
  });

  describe('validateSolarConfig', () => {
    it('should validate correct config', () => {
      const result = validateSolarConfig({
        panelCount: 10,
        panelWattageSTC: 400,
        tiltDegrees: 30,
        orientation: 'S',
      });
      expect(result.isValid).toBe(true);
    });

    it('should reject zero panels', () => {
      const result = validateSolarConfig({
        panelCount: 0,
        panelWattageSTC: 400,
        tiltDegrees: 30,
        orientation: 'S',
      });
      expect(result.isValid).toBe(false);
    });

    it('should reject invalid tilt', () => {
      const result = validateSolarConfig({
        panelCount: 10,
        panelWattageSTC: 400,
        tiltDegrees: 100,
        orientation: 'S',
      });
      expect(result.isValid).toBe(false);
    });
  });
});
