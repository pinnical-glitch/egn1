/**
 * Battery / SOC Simulation Module - Matching all.html
 */

export const CHEM = {
  lfp: { id: 'lfp', name: 'Lithium (LFP)', dod: 0.92, rte: 0.95, l80: 4500, l50: 6000, peukert: 1.05, cr: 0.5, calFade: 0.02, tempSlope: 0.008 },
  lead: { id: 'lead', name: 'Lead-Acid', dod: 0.50, rte: 0.82, l80: 200, l50: 400, peukert: 1.25, cr: 0.2, calFade: 0.05, tempSlope: 0.012 }
};

export function getBatteryChemistry(chemistryId) {
  const normalizedId = chemistryId?.toLowerCase();
  if (normalizedId === 'lfp') return CHEM.lfp;
  if (normalizedId === 'lead' || normalizedId === 'lead_acid') return CHEM.lead;
  return CHEM.lfp;
}

export function calculateUsableCapacity(nameplateCapacityKwh, maxDoD) {
  return nameplateCapacityKwh * maxDoD;
}

export function calculatePeukertAdjustedCapacity(ratedCapacityKwh, dischargeRateW, nominalVoltageV = 48, peukertExponent = 1.05) {
  const referenceCurrentA = (ratedCapacityKwh * 1000) / (nominalVoltageV * 20);
  const actualCurrentA = dischargeRateW / nominalVoltageV;
  if (actualCurrentA <= 0 || referenceCurrentA <= 0) return ratedCapacityKwh;
  const peukertFactor = Math.pow(referenceCurrentA / actualCurrentA, peukertExponent - 1);
  const clampedFactor = Math.max(0.5, Math.min(1.5, peukertFactor));
  return ratedCapacityKwh * clampedFactor;
}

export function calculateCRateLimit(capacityKwh, cRate) {
  return cRate * capacityKwh * 1000;
}

export function calculateBatteryTempDerate(ambientTempC, tempDerateSlope = 0.008, tempRef = 25) {
  if (ambientTempC >= tempRef) return 1.0;
  const tempDiff = tempRef - ambientTempC;
  const derate = 1 - (tempDerateSlope * tempDiff);
  return Math.max(0.5, derate);
}

export function calculateCalendarAging(yearsInService, calendarFadePerYear = 0.02) {
  return Math.max(0.3, 1 - (calendarFadePerYear * yearsInService));
}

export function calculateCombinedDegradation(cycleDegradation, calendarDegradation) {
  return cycleDegradation * calendarDegradation;
}

export function simulateSOC({
  usableCapacityKwh, nameplateCapacityKwh = null, maxDoD, roundTripEfficiency,
  hourlySolarOutput, hourlyLoadDemand, blackoutHours, initialSocKwh = null,
  nominalVoltageV = 48, peukertExponent = 1.05, chargeRateLimit = 0.5, dischargeRateLimit = 0.5,
  ambientTempC = 25, tempDerateSlope = 0.008,
  applyPeukert = true, applyCRateLimits = true, applyTempDerate = true,
}) {
  const nameplateKwh = nameplateCapacityKwh || usableCapacityKwh / (maxDoD || 0.92);
  const results = {
    hourlySoc: [], hourlyNetPower: [], hourlySolarCharging: [], hourlyLoadDischarging: [],
    hourlyPeukertCapacity: [], hourlyUnmetEnergy: [],
    hoursUntilDepletion: null, totalEnergyChargedWh: 0, totalEnergyDischargedWh: 0,
    totalUnmetEnergyWh: 0, minSocKwh: usableCapacityKwh, maxSocKwh: 0,
  };
  let tempDerate = 1.0;
  if (applyTempDerate) tempDerate = calculateBatteryTempDerate(ambientTempC, tempDerateSlope);
  const effectiveCapacityKwh = usableCapacityKwh * tempDerate;
  let socKwh = initialSocKwh !== null ? initialSocKwh : effectiveCapacityKwh;
  const maxChargeW = applyCRateLimits ? calculateCRateLimit(nameplateKwh, chargeRateLimit) : Infinity;
  const maxDischargeW = applyCRateLimits ? calculateCRateLimit(nameplateKwh, dischargeRateLimit) : Infinity;

  for (let hour = 0; hour < blackoutHours; hour++) {
    const hourOfDay = hour % 24;
    const solarWatts = hourlySolarOutput[hourOfDay] || 0;
    const loadWatts = hourlyLoadDemand[hourOfDay] || 0;
    const netPowerWatts = solarWatts - loadWatts;
    let energyChargedWh = 0, energyDischargedWh = 0, unmetEnergyWh = 0;
    let currentCapacityKwh = effectiveCapacityKwh;
    if (applyPeukert && loadWatts > 0) {
      currentCapacityKwh = calculatePeukertAdjustedCapacity(nameplateKwh, loadWatts, nominalVoltageV, peukertExponent) * tempDerate;
    }
    const currentMinSoc = currentCapacityKwh * (1 - maxDoD);

    if (netPowerWatts > 0) {
      const energyIntoBatteryWh = netPowerWatts * roundTripEfficiency;
      const maxChargeThisHourW = Math.min(maxChargeW, energyIntoBatteryWh);
      const maxChargeKwh = Math.min(maxChargeThisHourW / 1000, currentCapacityKwh - socKwh);
      const chargeKwh = Math.max(0, maxChargeKwh);
      socKwh += chargeKwh;
      energyChargedWh = chargeKwh * 1000;
      if (energyIntoBatteryWh > maxChargeThisHourW) unmetEnergyWh = energyIntoBatteryWh - maxChargeThisHourW;
    } else {
      const deficitWh = Math.abs(netPowerWatts);
      const maxDischargeThisHourW = Math.min(maxDischargeW, deficitWh);
      const maxDischargeKwh = Math.min(maxDischargeThisHourW / 1000, socKwh - currentMinSoc);
      const dischargeKwh = Math.max(0, maxDischargeKwh);
      socKwh -= dischargeKwh;
      energyDischargedWh = dischargeKwh * 1000;
      if (deficitWh > maxDischargeThisHourW) unmetEnergyWh = deficitWh - maxDischargeThisHourW;
    }

    socKwh = Math.max(currentMinSoc, Math.min(currentCapacityKwh, socKwh));
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

    if (socKwh <= currentMinSoc + 0.01 && results.hoursUntilDepletion === null) {
      let sustainedDepletion = true;
      for (let futureHour = hour + 1; futureHour < Math.min(hour + 24, blackoutHours); futureHour++) {
        const futureHourOfDay = futureHour % 24;
        if ((hourlySolarOutput[futureHourOfDay] || 0) >= (hourlyLoadDemand[futureHourOfDay] || 0)) { sustainedDepletion = false; break; }
      }
      if (sustainedDepletion) results.hoursUntilDepletion = hour + 1;
    }
  }
  if (results.hoursUntilDepletion === null) results.hoursUntilDepletion = blackoutHours;
  results.physics = { tempDerate, effectiveCapacityKwh, maxChargeW: maxChargeW === Infinity ? null : maxChargeW, maxDischargeW: maxDischargeW === Infinity ? null : maxDischargeW, peukertExponent, nominalVoltageV, ambientTempC };
  return results;
}

export function calculateDegradation({ totalEnergyDischargedWh, usableCapacityKwh, chemistryId, maxDoD, blackoutsPerYear = 4, yearsOfOwnership = 10 }) {
  const chemistry = getBatteryChemistry(chemistryId);
  const usableCapacityWh = usableCapacityKwh * 1000;
  const cyclesPerEvent = totalEnergyDischargedWh / usableCapacityWh;
  let cycleLife;
  if (maxDoD >= 0.8) cycleLife = chemistry.l80;
  else if (maxDoD <= 0.5) cycleLife = chemistry.l50;
  else { const t = (maxDoD - 0.5) / 0.3; cycleLife = chemistry.l50 + t * (chemistry.l80 - chemistry.l50); }
  const cyclesPerYear = cyclesPerEvent * blackoutsPerYear;
  const yearlyProjection = [];
  let capacityRetention = 1.0;
  for (let year = 0; year <= yearsOfOwnership; year++) {
    const cycleFadeThisYear = cyclesPerYear / cycleLife;
    const calendarFadeThisYear = chemistry.calFade;
    const yearlyRetention = (1 - cycleFadeThisYear) * (1 - calendarFadeThisYear);
    capacityRetention *= yearlyRetention;
    yearlyProjection.push({ year, capacityRetention: Math.max(0.3, capacityRetention), usableCapacityKwh: usableCapacityKwh * Math.max(0.3, capacityRetention) });
  }
  const yearAt80 = yearlyProjection.find(p => p.capacityRetention <= 0.8)?.year || yearsOfOwnership;
  const yearAt50 = yearlyProjection.find(p => p.capacityRetention <= 0.5)?.year || yearsOfOwnership;
  return { cyclesPerEvent, estimatedCycleLife: cycleLife, cyclesPerYear, yearsFromCycling: cycleLife / cyclesPerYear, blackoutsPerYear, calendarFadePerYear: chemistry.calFade, yearAt80Capacity: yearAt80, yearAt50Capacity: yearAt50, yearlyProjection, disclaimer: 'Estimates for planning only.' };
}

export function validateBatteryConfig(config) {
  const errors = [];
  if (!config.capacityKwh || config.capacityKwh <= 0) errors.push('Battery capacity must be greater than 0');
  if (!config.chemistry) errors.push('Battery chemistry is required');
  if (config.maxDoD === undefined || config.maxDoD <= 0 || config.maxDoD > 1) errors.push('Max depth of discharge must be between 0 and 1');
  return { isValid: errors.length === 0, errors };
}
