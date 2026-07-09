/**
 * Load Calculations Module - Matching all.html
 */

export function calculateTotalConnectedLoad(appliances) {
  return appliances.reduce((total, a) => total + a.w, 0);
}

export function calculatePeakLoad(appliances) {
  const r = calculateTotalConnectedLoad(appliances);
  const mt = appliances.filter(a => a.m);
  return r + (mt.length ? Math.max(...mt.map(a => a.s - a.w)) : 0);
}

export function calculateDailyEnergyDemand(appliances) {
  return appliances.reduce((total, a) => total + a.w * a.h, 0);
}

export function calculateEnergyDemandByPriority(appliances) {
  const d = { Critical: 0, Important: 0, Optional: 0 };
  appliances.forEach(a => { d[a.p] = (d[a.p] || 0) + a.w * a.h; });
  return d;
}

export function calculateLoadBreakdownByCategory(appliances) {
  const b = {};
  appliances.forEach(a => { b[a.cat] = (b[a.cat] || 0) + a.w * a.h; });
  return b;
}

export function validateAppliance(appliance) {
  const errors = [];
  if (!appliance.name || appliance.name.trim() === '') errors.push('Appliance name is required');
  if (!appliance.w || appliance.w <= 0) errors.push('Rated watts must be greater than 0');
  if (appliance.s !== undefined && appliance.s < appliance.w) errors.push('Surge watts cannot be less than rated watts');
  if (!appliance.h || appliance.h < 0 || appliance.h > 24) errors.push('Hours per day must be between 0 and 24');
  return { isValid: errors.length === 0, errors };
}
