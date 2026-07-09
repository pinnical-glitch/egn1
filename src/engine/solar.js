/**
 * Solar Output Calculation Module - Matching all.html
 */

export const SEASONAL_MULTIPLIERS = { winter: 0.65, spring: 0.85, summer: 1.0, fall: 0.80 };

export const CLOUD_SCENARIOS = {
  clear: { name: 'Clear', alpha: 2, beta: 8, meanAttenuation: 0.20, description: 'Sunny, minimal clouds' },
  typical: { name: 'Typical', alpha: 3, beta: 6, meanAttenuation: 0.33, description: 'Average cloud conditions' },
  poor: { name: 'Poor', alpha: 3, beta: 3, meanAttenuation: 0.50, description: 'Frequent clouds, overcast days' }
};

export const DEFAULT_SUB_DERATES = {
  wiringLosses: 0.98, soilingLosses: 0.98, mismatchLosses: 0.98,
  availabilityLosses: 0.97, degradationLosses: 0.9985,
};

const TILT_ORIENTATION_DERATE = {
  'S_0':0.85,'S_15':0.93,'S_30':1.0,'S_45':0.98,'S_60':0.93,'S_75':0.86,'S_90':0.70,
  'SE_0':0.82,'SE_15':0.87,'SE_30':0.92,'SE_45':0.90,'SE_60':0.85,'SE_75':0.78,'SE_90':0.65,
  'SW_0':0.82,'SW_15':0.87,'SW_30':0.92,'SW_45':0.90,'SW_60':0.85,'SW_75':0.78,'SW_90':0.65,
  'E_0':0.78,'E_15':0.82,'E_30':0.85,'E_45':0.80,'E_60':0.74,'E_75':0.68,'E_90':0.65,
  'W_0':0.78,'W_15':0.82,'W_30':0.85,'W_45':0.80,'W_60':0.74,'W_75':0.68,'W_90':0.65,
  'N_0':0.60,'N_15':0.58,'N_30':0.65,'N_45':0.55,'N_60':0.48,'N_75':0.42,'N_90':0.50
};

export function getTiltOrientationDerate(orientation, tiltDegrees) {
  const bp = [0, 15, 30, 45, 60, 75, 90];
  let li = 0, hi = bp.length - 1;
  for (let i = 0; i < bp.length - 1; i++) {
    if (tiltDegrees >= bp[i] && tiltDegrees <= bp[i + 1]) { li = i; hi = i + 1; break; }
  }
  const t0 = bp[li], t1 = bp[hi];
  const d0 = TILT_ORIENTATION_DERATE[orientation + '_' + t0] || 0.85;
  const d1 = TILT_ORIENTATION_DERATE[orientation + '_' + t1] || 0.85;
  return t0 === t1 ? d0 : d0 + (d1 - d0) * (tiltDegrees - t0) / (t1 - t0);
}

export function calculateCellTemperature(ambientTempC, irradianceWm2 = 800, noct = 45) {
  return ambientTempC + (noct - 20) / 800 * irradianceWm2;
}

export function calculateTempDerate(ambientTempC, irradianceWm2 = 800, noct = 45, tempCoeff = -0.0038) {
  const ct = calculateCellTemperature(ambientTempC, irradianceWm2, noct);
  return Math.max(0, 1 + tempCoeff * Math.max(0, ct - 25));
}

export function calculateEffectiveArrayPower(panelCount, panelWattageSTC, tempDerate, tiltOrientationDerate, subDerates = null) {
  const sd = subDerates || DEFAULT_SUB_DERATES;
  const total = Object.values(sd).reduce((a, v) => a * v, 1);
  return panelCount * panelWattageSTC * tempDerate * tiltOrientationDerate * total;
}

export function calculateEffectiveArrayPowerLegacy(panelCount, panelWattageSTC, tempDerate, tiltOrientationDerate, systemDerate = 0.86) {
  return panelCount * panelWattageSTC * tempDerate * tiltOrientationDerate * systemDerate;
}

export function calculateDailySolarEnergy(effectiveArrayPower, peakSunHours) {
  return effectiveArrayPower * peakSunHours;
}

export function applySeasonalMultiplier(basePSH, season) {
  return basePSH * (SEASONAL_MULTIPLIERS[season] || 1);
}

function sampleBeta(alpha, beta) {
  let x, y;
  do { x = Math.pow(Math.random(), 1 / alpha); y = Math.pow(Math.random(), 1 / beta); } while (x + y > 1);
  return x / (x + y);
}

export function applyCloudAttenuation(clearSkyIrradiance, scenario = 'typical') {
  const params = CLOUD_SCENARIOS[scenario] || CLOUD_SCENARIOS.typical;
  return clearSkyIrradiance * (1 - sampleBeta(params.alpha, params.beta));
}

export function generateHourlySolarCurve(dailySolarEnergyWh, sunriseHour = 6, sunsetHour = 20) {
  const o = new Array(24).fill(0);
  const dl = sunsetHour - sunriseHour;
  if (dl <= 0 || dailySolarEnergyWh <= 0) return o;
  const pk = dailySolarEnergyWh / (dl * Math.PI / 2);
  for (let h = 0; h < 24; h++) {
    if (h >= sunriseHour && h <= sunsetHour) {
      const t = (h - sunriseHour) / dl;
      o[h] = pk * Math.pow(Math.sin(Math.PI * t), 2);
    }
  }
  return o;
}

export function getSeasonalDaylightHours(latitude, season) {
  const adj = { winter: -1.5, spring: 0, summer: 1.5, fall: 0 };
  const a = adj[season] || 0;
  return { sunrise: Math.max(4, Math.min(8, 6 - a)), sunset: Math.max(16, Math.min(20, 18 + a)) };
}

export function validateSolarConfig(config) {
  const errors = [];
  if (!config.panelCount || config.panelCount <= 0) errors.push('Panel count must be greater than 0');
  if (!config.panelWattageSTC || config.panelWattageSTC <= 0) errors.push('Panel wattage must be greater than 0');
  if (config.tiltDegrees === undefined || config.tiltDegrees < 0 || config.tiltDegrees > 90) errors.push('Tilt angle must be between 0 and 90 degrees');
  if (!config.orientation) errors.push('Orientation is required');
  return { isValid: errors.length === 0, errors };
}
