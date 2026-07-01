/**
 * Energy Resilience Engine - Main Export
 * 
 * Pure, UI-agnostic calculation modules for home energy resilience planning.
 * This module can be imported and used independently of any UI framework.
 */

export * as loads from './loads.js';
export * as solar from './solar.js';
export * as battery from './battery.js';
export * as appliances from './appliances.js';
export * as climateZones from './climateZones.js';

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
  const totalConnectedLoad = loads.calculateTotalConnectedLoad(selectedAppliances);
  const peakLoad = loads.calculatePeakLoad(selectedAppliances);
  const dailyEnergyDemand = loads.calculateDailyEnergyDemand(selectedAppliances);
  const energyDemandByPriority = loads.calculateEnergyDemandByPriority(selectedAppliances);
  const loadBreakdownByCategory = loads.calculateLoadBreakdownByCategory(selectedAppliances);
  
  // 2. Solar calculations
  const tempDerate = solar.calculateTempDerate(climateZone.avgAmbientTempC);
  const tiltOrientationDerate = solar.getTiltOrientationDerate(
    solarConfig.orientation,
    solarConfig.tiltDegrees
  );
  const effectiveArrayPower = solar.calculateEffectiveArrayPower(
    solarConfig.panelCount,
    solarConfig.panelWattageSTC,
    tempDerate,
    tiltOrientationDerate
  );
  const dailySolarEnergy = solar.calculateDailySolarEnergy(
    effectiveArrayPower,
    climateZone.peakSunHours
  );
  const hourlySolarOutput = solar.generateHourlySolarCurve(dailySolarEnergy);
  
  // 3. Battery configuration
  const chemistry = battery.getBatteryChemistry(batteryConfig.chemistry);
  const usableCapacityKwh = battery.calculateUsableCapacity(
    batteryConfig.capacityKwh,
    batteryConfig.maxDoD
  );
  
  // 4. Create hourly load profile (simplified)
  const hourlyLoadProfile = new Array(24).fill(dailyEnergyDemand / 24);
  
  // 5. Run SOC simulation for all loads
  const allLoadsResult = battery.simulateSOC({
    usableCapacityKwh,
    maxDoD: batteryConfig.maxDoD,
    roundTripEfficiency: batteryConfig.roundTripEfficiency,
    hourlySolarOutput,
    hourlyLoadDemand: hourlyLoadProfile,
    blackoutHours,
  });
  
  // 6. Run SOC simulation for critical loads only
  const criticalAppliances = selectedAppliances.filter(a => a.priority === 'Critical');
  const criticalDailyDemand = loads.calculateDailyEnergyDemand(criticalAppliances);
  const criticalHourlyLoad = new Array(24).fill(criticalDailyDemand / 24);
  
  const criticalLoadsResult = battery.simulateSOC({
    usableCapacityKwh,
    maxDoD: batteryConfig.maxDoD,
    roundTripEfficiency: batteryConfig.roundTripEfficiency,
    hourlySolarOutput,
    hourlyLoadDemand: criticalHourlyLoad,
    blackoutHours,
  });
  
  // 7. Degradation estimate
  const degradation = battery.calculateDegradation({
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
