/**
 * Energy Resilience Engine - Main Export
 * 
 * Pure, UI-agnostic calculation modules for home energy resilience planning.
 * This module can be imported and used independently of any UI framework.
 */

import {
  calculateTotalConnectedLoad,
  calculatePeakLoad,
  calculateDailyEnergyDemand,
  calculateEnergyDemandByPriority,
  calculateLoadBreakdownByCategory,
} from './loads.js';

import {
  calculateTempDerate,
  getTiltOrientationDerate,
  calculateEffectiveArrayPower,
  calculateDailySolarEnergy,
  generateHourlySolarCurve,
} from './solar.js';

import {
  getBatteryChemistry,
  calculateUsableCapacity,
  simulateSOC,
  calculateDegradation,
} from './battery.js';

export {
  calculateTotalConnectedLoad,
  calculatePeakLoad,
  calculateDailyEnergyDemand,
  calculateEnergyDemandByPriority,
  calculateLoadBreakdownByCategory,
  calculateTempDerate,
  getTiltOrientationDerate,
  calculateEffectiveArrayPower,
  calculateDailySolarEnergy,
  generateHourlySolarCurve,
  getBatteryChemistry,
  calculateUsableCapacity,
  simulateSOC,
  calculateDegradation,
};

export { DEFAULT_APPLIANCES, PRIORITIES, CATEGORIES, createAppliance } from './appliances.js';
export { CLIMATE_ZONES, getClimateZone, getDefaultClimateZone } from './climateZones.js';

/**
 * Run complete resilience simulation
 * 
 * Convenience function that orchestrates the full simulation pipeline:
 * 1. Calculate load metrics
 * 2. Calculate solar output
 * 3. Run SOC simulation for all-loads and critical-loads scenarios
 * 4. Calculate degradation estimate
 * 
 * @param {Object} config - Full simulation configuration
 * @returns {Object} Complete simulation results
 */
export function runSimulation(config) {
  const {
    appliances: selectedAppliances,
    solar: solarConfig,
    battery: batteryConfig,
    climateZone,
    blackoutHours = 72,
    blackoutsPerYear = 4,
  } = config;
  
  // 1. Load calculations
  const totalConnectedLoad = calculateTotalConnectedLoad(selectedAppliances);
  const peakLoad = calculatePeakLoad(selectedAppliances);
  const dailyEnergyDemand = calculateDailyEnergyDemand(selectedAppliances);
  const energyDemandByPriority = calculateEnergyDemandByPriority(selectedAppliances);
  const loadBreakdownByCategory = calculateLoadBreakdownByCategory(selectedAppliances);
  
  // 2. Solar calculations
  const tempDerate = calculateTempDerate(climateZone.avgAmbientTempC);
  const tiltOrientationDerate = getTiltOrientationDerate(
    solarConfig.orientation,
    solarConfig.tiltDegrees
  );
  const effectiveArrayPower = calculateEffectiveArrayPower(
    solarConfig.panelCount,
    solarConfig.panelWattageSTC,
    tempDerate,
    tiltOrientationDerate
  );
  const dailySolarEnergy = calculateDailySolarEnergy(
    effectiveArrayPower,
    climateZone.peakSunHours
  );
  const hourlySolarOutput = generateHourlySolarCurve(dailySolarEnergy);
  
  // 3. Battery configuration
  const chemistry = getBatteryChemistry(batteryConfig.chemistry);
  const usableCapacityKwh = calculateUsableCapacity(
    batteryConfig.capacityKwh,
    batteryConfig.maxDoD
  );
  
  // 4. Create hourly load profile (simplified)
  const hourlyLoadProfile = new Array(24).fill(dailyEnergyDemand / 24);
  
  // 5. Run SOC simulation for all loads
  const allLoadsResult = simulateSOC({
    usableCapacityKwh,
    maxDoD: batteryConfig.maxDoD,
    roundTripEfficiency: batteryConfig.roundTripEfficiency,
    hourlySolarOutput,
    hourlyLoadDemand: hourlyLoadProfile,
    blackoutHours,
  });
  
  // 6. Run SOC simulation for critical loads only
  const criticalAppliances = selectedAppliances.filter(a => a.priority === 'Critical');
  const criticalDailyDemand = calculateDailyEnergyDemand(criticalAppliances);
  const criticalHourlyLoad = new Array(24).fill(criticalDailyDemand / 24);
  
  const criticalLoadsResult = simulateSOC({
    usableCapacityKwh,
    maxDoD: batteryConfig.maxDoD,
    roundTripEfficiency: batteryConfig.roundTripEfficiency,
    hourlySolarOutput,
    hourlyLoadDemand: criticalHourlyLoad,
    blackoutHours,
  });
  
  // 7. Degradation estimate
  const degradation = calculateDegradation({
    totalEnergyDischargedWh: allLoadsResult.totalEnergyDischargedWh,
    usableCapacityKwh,
    chemistryId: batteryConfig.chemistry,
    maxDoD: batteryConfig.maxDoD,
    blackoutsPerYear,
  });
  
  return {
    // Load metrics
    totalConnectedLoad,
    peakLoad,
    dailyEnergyDemand,
    energyDemandByPriority,
    loadBreakdownByCategory,
    
    // Solar metrics
    effectiveArrayPower,
    dailySolarEnergy,
    hourlySolarOutput,
    tempDerate,
    tiltOrientationDerate,
    
    // Battery metrics
    usableCapacityKwh,
    chemistry,
    
    // Simulation results
    allLoads: allLoadsResult,
    criticalLoads: criticalLoadsResult,
    
    // Degradation
    degradation,
    
    // Configuration echo (for assumptions panel)
    config: {
      appliances: selectedAppliances,
      solar: solarConfig,
      battery: batteryConfig,
      climateZone,
      blackoutHours,
      blackoutsPerYear,
    },
  };
}
