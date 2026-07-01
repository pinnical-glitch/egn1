/**
 * Battery / SOC Simulation Module - Phase 2 Enhanced
 * 
 * Implements hour-by-hour state-of-charge simulation for blackout scenarios.
 * All calculations use standard battery engineering conventions.
 * 
 * Phase 2 enhancements:
 * - Peukert's Law for capacity derating under high discharge rates
 * - C-rate limits for charge/discharge
 * - Calendar aging (capacity fade even when idle)
 * - Temperature effects on battery performance
 * - Enhanced degradation model with both cycle and calendar aging
 */

/**
 * Battery Chemistry Defaults - Phase 2 Enhanced
 * 
 * Based on standard manufacturer specifications:
 * - LFP (Lithium Iron Phosphate): Deep cycle, high DoD tolerance, low rate sensitivity
 * - Lead-Acid: Traditional, limited DoD, high rate sensitivity (Peukert effect)
 * 
 * Phase 2 additions:
 * - peukertExponent: Controls rate-dependent capacity loss
 * - defaultChargeRate: Max C-rate for charging
 * - defaultDischargeRate: Max C-rate for discharging
 * - calendarFadePerYear: Capacity loss per year when idle
 * - tempDerateSlope: Linear capacity vs temperature slope
 */
export const BATTERY_CHEMISTRY = {
  LFP: {
    id: 'lfp',
    name: 'Lithium (LFP)',
    defaultMaxDoD: 0.92,
    defaultRoundTripEfficiency: 0.95,
    cycleLifeAt80DoD: 4500,
    cycleLifeAt50DoD: 6000,
    minVoltage: 2.5,
    maxVoltage: 3.65,
    // Phase 2 additions
    peukertExponent: 1.05,  // LFP: near-ideal, low rate sensitivity
    defaultChargeRate: 0.5,  // 0.5C max charge (10kWh battery = 5kW max)
    defaultDischargeRate: 0.5, // 0.5C max discharge
    calendarFadePerYear: 0.02, // ~2% capacity loss per year (calendar aging)
    tempDerateSlope: 0.008, // 0.8% capacity loss per °C below 25°C
    tempRef: 25, // Reference temperature in °C
  },
  LEAD_ACID: {
    id: 'lead_acid',
    name: 'Lead-Acid',
    defaultMaxDoD: 0.50,
    defaultRoundTripEfficiency: 0.82,
    cycleLifeAt80DoD: 200,
    cycleLifeAt50DoD: 400,
    minVoltage: 1.75,
    maxVoltage: 2.1,
    // Phase 2 additions
    peukertExponent: 1.25, // Lead-acid: high rate sensitivity
    defaultChargeRate: 0.2, // 0.2C max charge (conservative for plate life)
    defaultDischargeRate: 0.2, // 0.2C max discharge
    calendarFadePerYear: 0.05, // ~5% capacity loss per year (faster calendar aging)
    tempDerateSlope: 0.012, // 1.2% capacity loss per °C below 25°C
    tempRef: 25,
  },
};

/**
 * Get battery chemistry defaults
 * 
 * @param {string} chemistryId - 'lfp' or 'lead_acid'
 * @returns {Object} Chemistry defaults
 */
export function getBatteryChemistry(chemistryId) {
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
 * Calculate Peukert-adjusted capacity
 * 
 * Peukert's Law accounts for the fact that batteries deliver less usable
 * capacity at higher discharge rates. The effect is more pronounced in
 * lead-acid batteries (k=1.2-1.3) than in LFP (k=1.05).
 * 
 * Formula: C_actual = C_rated × (I_rated / I_actual)^(k-1)
 * 
 * Where:
 * - C_actual = Actual usable capacity at given discharge rate
 * - C_rated = Rated capacity at reference discharge rate
 * - I_rated = Reference current (typically C/20 or 20-hour rate)
 * - I_actual = Actual discharge current
 * - k = Peukert exponent (1.0 for ideal, >1 for real batteries)
 * 
 * Source: Peukert's original paper (1897), Battery University
 * 
 * @param {number} ratedCapacityKwh - Rated capacity at reference rate
 * @param {number} dischargeRateW - Current discharge rate in watts
 * @param {number} nominalVoltageV - Nominal system voltage (e.g., 48V for LFP, 12V for lead-acid)
 * @param {number} peukertExponent - Peukert exponent (chemistry-specific)
 * @returns {number} Peukert-adjusted capacity in kWh
 */
export function calculatePeukertAdjustedCapacity(
  ratedCapacityKwh,
  dischargeRateW,
  nominalVoltageV = 48,
  peukertExponent = 1.05
) {
  // Reference current: C/20 rate (20-hour discharge)
  const referenceCurrentA = (ratedCapacityKwh * 1000) / (nominalVoltageV * 20);
  const actualCurrentA = dischargeRateW / nominalVoltageV;
  
  // Avoid division by zero
  if (actualCurrentA <= 0 || referenceCurrentA <= 0) {
    return ratedCapacityKwh;
  }
  
  // Peukert adjustment factor
  const peukertFactor = Math.pow(referenceCurrentA / actualCurrentA, peukertExponent - 1);
  
  // Cap the factor to prevent unrealistic values
  const clampedFactor = Math.max(0.5, Math.min(1.5, peukertFactor));
  
  return ratedCapacityKwh * clampedFactor;
}

/**
 * Calculate C-rate limits
 * 
 * C-rate defines the maximum charge/discharge rate relative to capacity.
 * - 1C = full charge/discharge in 1 hour
 * - 0.5C = 2-hour charge/discharge
 * - 0.2C = 5-hour charge/discharge (conservative for lead-acid)
 * 
 * @param {number} capacityKwh - Battery capacity in kWh
 * @param {number} cRate - C-rate limit (e.g., 0.5 for 0.5C)
 * @param {number} nominalVoltageV - Nominal system voltage
 * @returns {number} Maximum power in watts
 */
export function calculateCRateLimit(capacityKwh, cRate, nominalVoltageV = 48) {
  // Power = C-rate × Capacity × Voltage / 1000 (convert to kW then W)
  // Actually: Power = C-rate × Capacity (kWh) × 1000 (to Wh) / 1 hour
  // Simplified: Power (W) = C-rate × Capacity (kWh) × 1000
  return cRate * capacityKwh * 1000;
}

/**
 * Calculate temperature derate for battery capacity
 * 
 * Battery capacity decreases linearly at low temperatures.
 * - LFP: ~0.8% per °C below 25°C (gradual decline)
 * - Lead-Acid: ~1.2% per °C below 25°C (steeper decline)
 * - At -10°C: LFP retains ~72% capacity, Lead-Acid retains ~58%
 * 
 * Source: Battery University, manufacturer datasheets
 * 
 * @param {number} ambientTempC - Ambient temperature in Celsius
 * @param {number} tempDerateSlope - Capacity loss per °C (chemistry-specific)
 * @param {number} tempRef - Reference temperature (default 25°C)
 * @returns {number} Temperature derate factor (0-1)
 */
export function calculateBatteryTempDerate(ambientTempC, tempDerateSlope = 0.008, tempRef = 25) {
  if (ambientTempC >= tempRef) {
    return 1.0; // No derate at or above reference temperature
  }
  
  const tempDiff = tempRef - ambientTempC;
  const derate = 1 - (tempDerateSlope * tempDiff);
  
  // Minimum capacity at extreme cold (don't go below 50%)
  return Math.max(0.5, derate);
}

/**
 * Calculate calendar aging (capacity fade over time)
 * 
 * Batteries lose capacity even when not actively cycled. This "calendar aging"
 * is due to chemical degradation of the electrode materials.
 * - LFP: ~2% per year (slow, stable chemistry)
 * - Lead-Acid: ~5% per year (faster degradation)
 * 
 * @param {number} yearsInService - Years of service
 * @param {number} calendarFadePerYear - Annual fade rate (e.g., 0.02 for 2%)
 * @returns {number} Capacity retention factor (0-1)
 */
export function calculateCalendarAging(yearsInService, calendarFadePerYear = 0.02) {
  // Exponential decay model: capacity = e^(-λt)
  // For small fade rates, this approximates to: 1 - (fade × years)
  return Math.max(0.3, 1 - (calendarFadePerYear * yearsInService));
}

/**
 * Calculate combined degradation from cycling and calendar aging
 * 
 * @param {number} cycleDegradation - Capacity loss from cycling (0-1)
 * @param {number} calendarDegradation - Capacity loss from calendar aging (0-1)
 * @returns {number} Combined capacity retention (0-1)
 */
export function calculateCombinedDegradation(cycleDegradation, calendarDegradation) {
  // Combined degradation: multiplicative model
  // If cycle degradation = 0.1 (10% loss) and calendar = 0.05 (5% loss)
  // Combined retention = 0.9 × 0.95 = 0.855 (14.5% total loss)
  return cycleDegradation * calendarDegradation;
}

/**
 * Run hour-by-hour SOC simulation for a blackout scenario - Phase 2 Enhanced
 * 
 * This is the core simulation engine. Phase 2 enhancements:
 * - Peukert-adjusted capacity at each hour based on instantaneous discharge rate
 * - C-rate limits that clip charge/discharge when limits exceeded
 * - Temperature derating applied to capacity
 * - Unmet energy tracking when C-rate limits are hit
 * 
 * @param {Object} params - Simulation parameters
 * @param {number} params.usableCapacityKwh - Usable battery capacity in kWh
 * @param {number} params.nameplateCapacityKwh - Nameplate capacity (for Peukert calc)
 * @param {number} params.maxDoD - Maximum depth of discharge (0-1)
 * @param {number} params.roundTripEfficiency - Round-trip efficiency (0-1)
 * @param {Array} params.hourlySolarOutput - 24-hour solar output array (watts)
 * @param {Array} params.hourlyLoadDemand - 24-hour load demand array (watts)
 * @param {number} params.blackoutHours - Duration of blackout in hours
 * @param {number} params.initialSocKwh - Starting SOC in kWh (default: usable capacity)
 * @param {number} params.nominalVoltageV - Nominal system voltage (default 48V)
 * @param {number} params.peukertExponent - Peukert exponent (chemistry-specific)
 * @param {number} params.chargeRateLimit - Max charge C-rate (e.g., 0.5)
 * @param {number} params.dischargeRateLimit - Max discharge C-rate (e.g., 0.5)
 * @param {number} params.ambientTempC - Ambient temperature for battery derating
 * @param {boolean} params.applyPeukert - Whether to apply Peukert derating (default true)
 * @param {boolean} params.applyCRateLimits - Whether to apply C-rate limits (default true)
 * @param {boolean} params.applyTempDerate - Whether to apply temperature derating (default true)
 * @returns {Object} Simulation results
 */
export function simulateSOC({
  usableCapacityKwh,
  nameplateCapacityKwh = null,
  maxDoD,
  roundTripEfficiency,
  hourlySolarOutput,
  hourlyLoadDemand,
  blackoutHours,
  initialSocKwh = null,
  // Phase 2 physics parameters (all optional with sensible defaults)
  nominalVoltageV = 48,
  peukertExponent = 1.05,
  chargeRateLimit = 0.5,
  dischargeRateLimit = 0.5,
  ambientTempC = 25,
  tempDerateSlope = 0.008,
  applyPeukert = true,
  applyCRateLimits = true,
  applyTempDerate = true,
}) {
  const nameplateKwh = nameplateCapacityKwh || usableCapacityKwh / (maxDoD || 0.92);
  
  const results = {
    hourlySoc: [],
    hourlyNetPower: [],
    hourlySolarCharging: [],
    hourlyLoadDischarging: [],
    hourlyPeukertCapacity: [],  // Track Peukert-adjusted capacity
    hourlyUnmetEnergy: [],      // Track unmet energy from C-rate clipping
    hoursUntilDepletion: null,
    totalEnergyChargedWh: 0,
    totalEnergyDischargedWh: 0,
    totalUnmetEnergyWh: 0,
    minSocKwh: usableCapacityKwh,
    maxSocKwh: 0,
  };
  
  // Apply temperature derating to usable capacity
  let tempDerate = 1.0;
  if (applyTempDerate) {
    tempDerate = calculateBatteryTempDerate(ambientTempC, tempDerateSlope);
  }
  
  const effectiveCapacityKwh = usableCapacityKwh * tempDerate;
  
  // Initialize SOC
  let socKwh = initialSocKwh !== null ? initialSocKwh : effectiveCapacityKwh;
  const minSocKwh = effectiveCapacityKwh * (1 - maxDoD);
  
  // Calculate C-rate limits in watts
  const maxChargeW = applyCRateLimits ? calculateCRateLimit(nameplateKwh, chargeRateLimit, nominalVoltageV) : Infinity;
  const maxDischargeW = applyCRateLimits ? calculateCRateLimit(nameplateKwh, dischargeRateLimit, nominalVoltageV) : Infinity;
  
  for (let hour = 0; hour < blackoutHours; hour++) {
    const hourOfDay = hour % 24;
    
    // Get solar and load for this hour
    const solarWatts = hourlySolarOutput[hourOfDay] || 0;
    const loadWatts = hourlyLoadDemand[hourOfDay] || 0;
    
    // Calculate net power (positive = surplus, negative = deficit)
    const netPowerWatts = solarWatts - loadWatts;
    
    let energyChargedWh = 0;
    let energyDischargedWh = 0;
    let unmetEnergyWh = 0;
    
    // Calculate Peukert-adjusted capacity for this hour
    let currentCapacityKwh = effectiveCapacityKwh;
    if (applyPeukert && loadWatts > 0) {
      currentCapacityKwh = calculatePeukertAdjustedCapacity(
        nameplateKwh,
        loadWatts,
        nominalVoltageV,
        peukertExponent
      ) * tempDerate;
    }
    
    // Update DoD floor based on current Peukert-adjusted capacity
    const currentMinSoc = currentCapacityKwh * (1 - maxDoD);
    
    if (netPowerWatts > 0) {
      // Surplus: charge battery
      const energyIntoBatteryWh = netPowerWatts * roundTripEfficiency;
      
      // Apply C-rate limit
      const maxChargeThisHourW = Math.min(maxChargeW, energyIntoBatteryWh);
      const maxChargeKwh = Math.min(maxChargeThisHourW / 1000, currentCapacityKwh - socKwh);
      
      const chargeKwh = Math.max(0, maxChargeKwh);
      socKwh += chargeKwh;
      energyChargedWh = chargeKwh * 1000;
      
      // Track unmet energy if C-rate clipped
      if (energyIntoBatteryWh > maxChargeThisHourW) {
        unmetEnergyWh = energyIntoBatteryWh - maxChargeThisHourW;
      }
    } else {
      // Deficit: discharge battery
      const deficitWh = Math.abs(netPowerWatts);
      
      // Apply C-rate limit
      const maxDischargeThisHourW = Math.min(maxDischargeW, deficitWh);
      const maxDischargeKwh = Math.min(maxDischargeThisHourW / 1000, socKwh - currentMinSoc);
      
      const dischargeKwh = Math.max(0, maxDischargeKwh);
      socKwh -= dischargeKwh;
      energyDischargedWh = dischargeKwh * 1000;
      
      // Track unmet energy if C-rate clipped
      if (deficitWh > maxDischargeThisHourW) {
        unmetEnergyWh = deficitWh - maxDischargeThisHourW;
      }
    }
    
    // Clamp SOC to valid range
    socKwh = Math.max(currentMinSoc, Math.min(currentCapacityKwh, socKwh));
    
    // Record results
    results.hourlySoc.push(socKwh);
    results.hourlyNetPower.push(netPowerWatts);
    results.hourlySolarCharging.push(energyChargedWh);
    results.hourlyLoadDischarging.push(energyDischargedWh);
    results.hourlyPeukertCapacity.push(currentCapacityKwh);
    results.hourlyUnmetEnergy.push(unmetEnergyWh);
    results.totalEnergyChargedWh += energyChargedWh;
    results.totalEnergyDischargedWh += energyDischargedWh;
    results.totalUnmetEnergyWh += unmetEnergyWh;
    results.minSocKwh = Math.min(results.minSocKwh, socKwh);
    results.maxSocKwh = Math.max(results.maxSocKwh, socKwh);
    
    // Check for depletion
    if (socKwh <= currentMinSoc + 0.01 && results.hoursUntilDepletion === null) {
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
  
  if (results.hoursUntilDepletion === null) {
    results.hoursUntilDepletion = blackoutHours;
  }
  
  // Store physics parameters in results for assumptions panel
  results.physics = {
    tempDerate,
    effectiveCapacityKwh,
    maxChargeW: maxChargeW === Infinity ? null : maxChargeW,
    maxDischargeW: maxDischargeW === Infinity ? null : maxDischargeW,
    peukertExponent,
    nominalVoltageV,
    ambientTempC,
  };
  
  return results;
}

/**
 * Calculate battery degradation estimate - Phase 2 Enhanced
 * 
 * Now includes:
 * - Cycle-based degradation (from actual simulated cycles)
 * - Calendar aging (capacity fade over ownership period)
 * - Combined degradation model
 * 
 * @param {Object} params - Degradation parameters
 * @param {number} params.totalEnergyDischargedWh - Total energy discharged during event
 * @param {number} params.usableCapacityKwh - Usable battery capacity
 * @param {string} params.chemistryId - Battery chemistry ('lfp' or 'lead_acid')
 * @param {number} params.maxDoD - Maximum depth of discharge used
 * @param {number} params.blackoutsPerYear - Expected blackouts per year
 * @param {number} params.yearsOfOwnership - Expected ownership period (default 10)
 * @returns {Object} Degradation estimate with year-by-year projection
 */
export function calculateDegradation({
  totalEnergyDischargedWh,
  usableCapacityKwh,
  chemistryId,
  maxDoD,
  blackoutsPerYear = 4,
  yearsOfOwnership = 10,
}) {
  const chemistry = getBatteryChemistry(chemistryId);
  
  // Calculate fractional cycles used per event
  const usableCapacityWh = usableCapacityKwh * 1000;
  const cyclesPerEvent = totalEnergyDischargedWh / usableCapacityWh;
  
  // Estimate cycle life based on DoD (interpolate between 80% and 50% values)
  let cycleLife;
  if (maxDoD >= 0.8) {
    cycleLife = chemistry.cycleLifeAt80DoD;
  } else if (maxDoD <= 0.5) {
    cycleLife = chemistry.cycleLifeAt50DoD;
  } else {
    const t = (maxDoD - 0.5) / 0.3;
    cycleLife = chemistry.cycleLifeAt50DoD + t * (chemistry.cycleLifeAt80DoD - chemistry.cycleLifeAt50DoD);
  }
  
  // Calculate cycle-based degradation
  const cyclesPerYear = cyclesPerEvent * blackoutsPerYear;
  const yearsFromCycling = cycleLife / cyclesPerYear;
  
  // Generate year-by-year capacity projection
  const yearlyProjection = [];
  let capacityRetention = 1.0;
  
  for (let year = 0; year <= yearsOfOwnership; year++) {
    // Cycle degradation for this year
    const cyclesThisYear = cyclesPerYear;
    const cycleFadeThisYear = cyclesThisYear / cycleLife;
    
    // Calendar aging for this year
    const calendarFadeThisYear = chemistry.calendarFadePerYear;
    
    // Combined degradation (multiplicative)
    const yearlyRetention = (1 - cycleFadeThisYear) * (1 - calendarFadeThisYear);
    capacityRetention *= yearlyRetention;
    
    yearlyProjection.push({
      year,
      capacityRetention: Math.max(0.3, capacityRetention), // Floor at 30%
      usableCapacityKwh: usableCapacityKwh * Math.max(0.3, capacityRetention),
    });
  }
  
  // Calculate when battery reaches 80% and 50% capacity
  const yearAt80 = yearlyProjection.find(p => p.capacityRetention <= 0.8)?.year || yearsOfOwnership;
  const yearAt50 = yearlyProjection.find(p => p.capacityRetention <= 0.5)?.year || yearsOfOwnership;
  
  return {
    cyclesPerEvent,
    estimatedCycleLife: cycleLife,
    cyclesPerYear,
    yearsFromCycling,
    blackoutsPerYear,
    // Phase 2 additions
    calendarFadePerYear: chemistry.calendarFadePerYear,
    yearAt80Capacity: yearAt80,
    yearAt50Capacity: yearAt50,
    yearlyProjection,
    disclaimer: 'This is a rough estimate combining cycle and calendar aging. Actual lifespan depends on temperature, depth of discharge patterns, and manufacturing quality.',
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