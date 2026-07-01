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
  calculateCellTemperature,
  getTiltOrientationDerate,
  calculateEffectiveArrayPower,
  calculateEffectiveArrayPowerLegacy,
  calculateDailySolarEnergy,
  generateHourlySolarCurve,
  applySeasonalMultiplier,
  applyCloudAttenuation,
  getSeasonalDaylightHours,
  SEASONAL_MULTIPLIERS,
  CLOUD_SCENARIOS,
  DEFAULT_SUB_DERATES,
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
  calculateCellTemperature,
  getTiltOrientationDerate,
  calculateEffectiveArrayPower,
  calculateEffectiveArrayPowerLegacy,
  calculateDailySolarEnergy,
  generateHourlySolarCurve,
  applySeasonalMultiplier,
  applyCloudAttenuation,
  getSeasonalDaylightHours,
  SEASONAL_MULTIPLIERS,
  CLOUD_SCENARIOS,
  DEFAULT_SUB_DERATES,
  getBatteryChemistry,
  calculateUsableCapacity,
  simulateSOC,
  calculateDegradation,
};

export { DEFAULT_APPLIANCES, PRIORITIES, CATEGORIES, createAppliance } from './appliances.js';
export { CLIMATE_ZONES, getClimateZone, getDefaultClimateZone } from './climateZones.js';

/**
 * Run complete resilience simulation (Phase 2 Enhanced)
 * 
 * Convenience function that orchestrates the full simulation pipeline:
 * 1. Calculate load metrics
 * 2. Calculate solar output with advanced derating
 * 3. Run SOC simulation for all-loads and critical-loads scenarios
 * 4. Calculate degradation estimate
 * 
 * Phase 2 enhancements:
 * - Seasonal PSH adjustment
 * - NOCT-based cell temperature model
 * - Stochastic cloud cover
 * - Named sub-derates
 * - Inverter efficiency
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
    // Phase 2 advanced physics options (all optional with sensible defaults)
    advancedPhysics = {},
  } = config;
  
  // Extract advanced physics options with defaults
  const {
    season = 'summer',  // Default to summer (peak production)
    cloudScenario = 'typical',
    useAdvancedMode = false,
    subDerates = null,
    noct = 45,
    tempCoeff = -0.0038,
    inverterEfficiency = 0.95,
    systemDerate = 0.86,  // Legacy mode default
  } = advancedPhysics;
  
  // 1. Load calculations
  const totalConnectedLoad = calculateTotalConnectedLoad(selectedAppliances);
  const peakLoad = calculatePeakLoad(selectedAppliances);
  const dailyEnergyDemand = calculateDailyEnergyDemand(selectedAppliances);
  const energyDemandByPriority = calculateEnergyDemandByPriority(selectedAppliances);
  const loadBreakdownByCategory = calculateLoadBreakdownByCategory(selectedAppliances);
  
  // 2. Solar calculations (Phase 2 enhanced)
  const tempDerate = calculateTempDerate(
    climateZone.avgAmbientTempC,
    800,  // Standard test irradiance
    noct,
    tempCoeff
  );
  
  const tiltOrientationDerate = getTiltOrientationDerate(
    solarConfig.orientation,
    solarConfig.tiltDegrees
  );
  
  // Calculate effective array power (advanced or legacy mode)
  let effectiveArrayPower;
  if (useAdvancedMode && subDerates) {
    effectiveArrayPower = calculateEffectiveArrayPower(
      solarConfig.panelCount,
      solarConfig.panelWattageSTC,
      tempDerate,
      tiltOrientationDerate,
      subDerates
    );
  } else {
    effectiveArrayPower = calculateEffectiveArrayPowerLegacy(
      solarConfig.panelCount,
      solarConfig.panelWattageSTC,
      tempDerate,
      tiltOrientationDerate,
      systemDerate
    );
  }
  
  // Apply seasonal adjustment to PSH
  const adjustedPSH = applySeasonalMultiplier(
    climateZone.peakSunHours,
    season
  );
  
  // Calculate daily solar energy
  const dailySolarEnergy = calculateDailySolarEnergy(
    effectiveArrayPower,
    adjustedPSH
  );
  
  // Apply cloud attenuation
  const cloudAdjustedEnergy = applyCloudAttenuation(dailySolarEnergy, cloudScenario);
  
  // Get seasonal daylight hours for solar curve
  const daylightHours = getSeasonalDaylightHours(40, season); // Approximate US latitude
  
  // Generate hourly solar curve
  const hourlySolarOutput = generateHourlySolarCurve(
    cloudAdjustedEnergy,
    daylightHours.sunrise,
    daylightHours.sunset
  );
  
  // Apply inverter efficiency (DC to AC conversion)
  const hourlySolarAC = hourlySolarOutput.map(w => w * inverterEfficiency);
  
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
    hourlySolarOutput: hourlySolarAC,
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
    hourlySolarOutput: hourlySolarAC,
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
    dailySolarEnergy: cloudAdjustedEnergy,  // Return cloud-adjusted value
    hourlySolarOutput: hourlySolarAC,
    tempDerate,
    tiltOrientationDerate,
    adjustedPSH,
    cloudScenario,
    season,
    
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
      advancedPhysics: {
        season,
        cloudScenario,
        useAdvancedMode,
        noct,
        tempCoeff,
        inverterEfficiency,
        systemDerate,
      },
    },
  };
}