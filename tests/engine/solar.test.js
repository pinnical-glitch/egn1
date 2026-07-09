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
      const result = calculateTempDerate(5);
      expect(result).toBeCloseTo(0.981, 2);
    });

    it('should decrease at higher temperatures', () => {
      const result = calculateTempDerate(35);
      expect(result).toBeLessThan(0.95);
    });

    it('should not increase above 1.0 at very cold temperatures', () => {
      const result = calculateTempDerate(-10);
      expect(result).toBe(1.0);
    });
  });

  describe('calculateEffectiveArrayPowerLegacy', () => {
    it('should apply all derate factors', () => {
      const result = calculateEffectiveArrayPowerLegacy(10, 400, 0.95, 0.90, 0.86);
      expect(result).toBeCloseTo(2941.2, 0);
    });
  });

  describe('calculateDailySolarEnergy', () => {
    it('should multiply power by PSH', () => {
      const result = calculateDailySolarEnergy(3000, 5);
      expect(result).toBe(15000);
    });
  });

  describe('generateHourlySolarCurve', () => {
    it('should generate 24-hour array', () => {
      const result = generateHourlySolarCurve(15000, 6, 20);
      expect(result).toHaveLength(24);
    });

    it('should have zero output at night', () => {
      const result = generateHourlySolarCurve(15000, 6, 20);
      expect(result[0]).toBe(0);
      expect(result[3]).toBe(0);
      expect(result[23]).toBe(0);
    });

    it('should peak around midday', () => {
      const result = generateHourlySolarCurve(15000, 6, 20);
      const middayOutput = result[13];
      const morningOutput = result[8];
      expect(middayOutput).toBeGreaterThan(morningOutput);
    });

    it('should sum approximately to daily total', () => {
      const dailyTotal = 15000;
      const result = generateHourlySolarCurve(dailyTotal, 6, 20);
      const sum = result.reduce((a, b) => a + b, 0);
      expect(sum).toBeGreaterThan(0);
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
