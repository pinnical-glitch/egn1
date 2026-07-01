/**
 * Battery / SOC Simulation Module
 * 
 * Implements hour-by-hour state-of-charge simulation for blackout scenarios.
 * All calculations use standard battery engineering conventions.
 */

/**
 * Battery Chemistry Defaults
 * 
 * Based on standard manufacturer specifications:
 * - LFP (Lithium Iron Phosphate): Deep cycle, high DoD tolerance
 * - Lead-Acid: Traditional, limited DoD for battery longevity
 */
export const BATTERY_CHEMISTRY = {
  LFP: {
    id: 'lfp',
    name: 'Lithium (LFP)',
    defaultMaxDoD: 0.92, // 92% - LFP can handle deep discharge
    defaultRoundTripEfficiency: 0.95, // 95% - High efficiency
    cycleLifeAt80DoD: 4500, // ~4500 cycles to 80% capacity at 80% DoD
    cycleLifeAt50DoD: 6000, // ~6000 cycles at 50% DoD
    minVoltage: 2.5, // Per cell nominal
    maxVoltage: 3.65, // Per cell nominal
  },
  LEAD_ACID: {
    id: 'lead_acid',
    name: 'Lead-Acid',
    defaultMaxDoD: 0.50, // 50% - Limited to protect battery life
    defaultRoundTripEfficiency: 0.82, // 82% - Lower efficiency
    cycleLifeAt80DoD: 200, // ~200 cycles at 80% DoD (very short life)
    cycleLifeAt50DoD: 400, // ~400 cycles at 50% DoD
    minVoltage: 1.75, // Per cell nominal
    maxVoltage: 2.1, // Per cell nominal
  },
};

/**
 * Get battery chemistry defaults
 * 
 * @param {string} chemistryId - 'lfp' or 'lead_acid'
 * @returns {Object} Chemistry defaults
 */
export function getBatteryChemistry(chemistryId) {
  // Support both lowercase IDs and uppercase keys
  const normalizedId = chemistryId?.toLowerCase();
  if (normalizedId === 'lfp') return BATTERY_CHEMISTRY.LFP;
  if (normalizedId === 'lead_acid') return BATTERY_CHEMISTRY.LEAD_ACID;
  return BATTERY_CHEMISTRY.LFP;
}

/**
 * Calculate usable capacity from nameplate and max DoD
 * 
 * @param {number} nameplateCapacityKwh - Nameplate capacity in kWh
 * @param {number} maxDoD - Maximum depth of discharge (0-1)
 * @returns {number} Usable capacity in kWh
 */
export function calculateUsableCapacity(nameplateCapacityKwh, maxDoD) {
  return nameplateCapacityKwh * maxDoD;
}

/**
 * Run hour-by-hour SOC simulation for a blackout scenario
 * 
 * This is the core simulation engine. It models:
 * - Solar charging (with round-trip efficiency applied at charge)
 * - Load discharging
 * - Battery state of charge (SOC) limits based on max DoD
 * - Partial recovery during daylight hours in multi-day blackouts
 * 
 * Convention: Round-trip efficiency is applied entirely at the charge step
 * (energy in × efficiency reaches battery). This is the standard convention
 * for battery simulation; the alternative (split sqrt on each direction)
 * would double-count losses.
 * 
 * @param {Object} params - Simulation parameters
 * @param {number} params.usableCapacityKwh - Usable battery capacity in kWh
 * @param {number} params.maxDoD - Maximum depth of discharge (0-1)
 * @param {number} params.roundTripEfficiency - Round-trip efficiency (0-1)
 * @param {Array} params.hourlySolarOutput - 24-hour solar output array (watts)
 * @param {Array} params.hourlyLoadDemand - 24-hour load demand array (watts)
 * @param {number} params.blackoutHours - Duration of blackout in hours
 * @param {number} params.initialSocKwh - Starting SOC in kWh (default: usable capacity)
 * @returns {Object} Simulation results
 */
export function simulateSOC({
  usableCapacityKwh,
  maxDoD,
  roundTripEfficiency,
  hourlySolarOutput,
  hourlyLoadDemand,
  blackoutHours,
  initialSocKwh = null,
}) {
  const results = {
    hourlySoc: [],
    hourlyNetPower: [],
    hourlySolarCharging: [],
    hourlyLoadDischarging: [],
    hoursUntilDepletion: null,
    totalEnergyChargedWh: 0,
    totalEnergyDischargedWh: 0,
    minSocKwh: usableCapacityKwh,
    maxSocKwh: 0,
  };
  
  // Initialize SOC
  let socKwh = initialSocKwh !== null ? initialSocKwh : usableCapacityKwh;
  const minSocKwh = usableCapacityKwh * (1 - maxDoD); // DoD floor
  
  for (let hour = 0; hour < blackoutHours; hour++) {
    const hourOfDay = hour % 24;
    
    // Get solar and load for this hour
    const solarWatts = hourlySolarOutput[hourOfDay] || 0;
    const loadWatts = hourlyLoadDemand[hourOfDay] || 0;
    
    // Calculate net power (positive = surplus, negative = deficit)
    const netPowerWatts = solarWatts - loadWatts;
    
    let energyChargedWh = 0;
    let energyDischargedWh = 0;
    
    if (netPowerWatts > 0) {
      // Surplus: charge battery
      // Apply round-trip efficiency at charge step (standard convention)
      const energyIntoBatteryWh = netPowerWatts * roundTripEfficiency;
      const maxChargeKwh = usableCapacityKwh - socKwh;
      const chargeKwh = Math.min(energyIntoBatteryWh / 1000, maxChargeKwh);
      
      socKwh += chargeKwh;
      energyChargedWh = chargeKwh * 1000;
    } else {
      // Deficit: discharge battery
      const deficitWh = Math.abs(netPowerWatts);
      const maxDischargeKwh = socKwh - minSocKwh;
      const dischargeKwh = Math.min(deficitWh / 1000, maxDischargeKwh);
      
      socKwh -= dischargeKwh;
      energyDischargedWh = dischargeKwh * 1000;
    }
    
    // Clamp SOC to valid range
    socKwh = Math.max(minSocKwh, Math.min(usableCapacityKwh, socKwh));
    
    // Record results
    results.hourlySoc.push(socKwh);
    results.hourlyNetPower.push(netPowerWatts);
    results.hourlySolarCharging.push(energyChargedWh);
    results.hourlyLoadDischarging.push(energyDischargedWh);
    results.totalEnergyChargedWh += energyChargedWh;
    results.totalEnergyDischargedWh += energyDischargedWh;
    results.minSocKwh = Math.min(results.minSocKwh, socKwh);
    results.maxSocKwh = Math.max(results.maxSocKwh, socKwh);
    
    // Check for depletion
    if (socKwh <= minSocKwh + 0.01 && results.hoursUntilDepletion === null) {
      // Check if future net power stays negative (sustained depletion)
      let sustainedDepletion = true;
      for (let futureHour = hour + 1; futureHour < Math.min(hour + 24, blackoutHours); futureHour++) {
        const futureHourOfDay = futureHour % 24;
        const futureSolar = hourlySolarOutput[futureHourOfDay] || 0;
        const futureLoad = hourlyLoadDemand[futureHourOfDay] || 0;
        if (futureSolar >= futureLoad) {
          sustainedDepletion = false;
          break;
        }
      }
      
      if (sustainedDepletion) {
        results.hoursUntilDepletion = hour + 1;
      }
    }
  }
  
  // If we never hit sustained depletion, battery survives the entire blackout
  if (results.hoursUntilDepletion === null) {
    results.hoursUntilDepletion = blackoutHours;
  }
  
  return results;
}

/**
 * Calculate battery degradation estimate
 * 
 * Uses a simplified cycle-based model (not full electrochemical aging).
 * This is appropriate for Phase 1 planning purposes.
 * 
 * @param {Object} params - Degradation parameters
 * @param {number} params.totalEnergyDischargedWh - Total energy discharged during event
 * @param {number} params.usableCapacityKwh - Usable battery capacity
 * @param {string} params.chemistryId - Battery chemistry ('lfp' or 'lead_acid')
 * @param {number} params.maxDoD - Maximum depth of discharge used
 * @param {number} params.blackoutsPerYear - Expected blackouts per year
 * @returns {Object} Degradation estimate
 */
export function calculateDegradation({
  totalEnergyDischargedWh,
  usableCapacityKwh,
  chemistryId,
  maxDoD,
  blackoutsPerYear = 4,
}) {
  const chemistry = getBatteryChemistry(chemistryId);
  
  // Calculate fractional cycles used per event
  const usableCapacityWh = usableCapacityKwh * 1000;
  const cyclesPerEvent = totalEnergyDischargedWh / usableCapacityWh;
  
  // Estimate cycle life based on DoD
  // Interpolate between 80% and 50% DoD cycle life values
  let cycleLife;
  if (maxDoD >= 0.8) {
    cycleLife = chemistry.cycleLifeAt80DoD;
  } else if (maxDoD <= 0.5) {
    cycleLife = chemistry.cycleLifeAt50DoD;
  } else {
    // Linear interpolation between 50% and 80% DoD
    const t = (maxDoD - 0.5) / 0.3;
    cycleLife = chemistry.cycleLifeAt50DoD + t * (chemistry.cycleLifeAt80DoD - chemistry.cycleLifeAt50DoD);
  }
  
  // Calculate remaining life
  const cyclesPerYear = cyclesPerEvent * blackoutsPerYear;
  const yearsRemaining = cycleLife / cyclesPerYear;
  const totalEventsRemaining = cycleLife;
  
  return {
    cyclesPerEvent: cyclesPerEvent,
    estimatedCycleLife: cycleLife,
    cyclesPerYear: cyclesPerYear,
    estimatedYearsRemaining: yearsRemaining,
    estimatedEventsRemaining: totalEventsRemaining,
    blackoutsPerYear: blackoutsPerYear,
    disclaimer: 'This is a rough estimate for planning purposes, not a warranty-grade prediction.',
  };
}

/**
 * Validate battery configuration
 * 
 * @param {Object} config - Battery configuration object
 * @returns {Object} Validation result { isValid: boolean, errors: string[] }
 */
export function validateBatteryConfig(config) {
  const errors = [];
  
  if (!config.capacityKwh || config.capacityKwh <= 0) {
    errors.push('Battery capacity must be greater than 0');
  }
  
  if (!config.chemistry) {
    errors.push('Battery chemistry is required');
  }
  
  if (config.maxDoD === undefined || config.maxDoD <= 0 || config.maxDoD > 1) {
    errors.push('Max depth of discharge must be between 0 and 1');
  }
  
  if (config.roundTripEfficiency === undefined || config.roundTripEfficiency <= 0 || config.roundTripEfficiency > 1) {
    errors.push('Round-trip efficiency must be between 0 and 1');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
