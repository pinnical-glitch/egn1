/**
 * Solar Output Calculation Module
 * 
 * Implements PVWatts-based derating model for residential solar estimation.
 * All calculations use standard industry assumptions with clear citations.
 */

/**
 * Tilt/Orientation Derate Lookup Table
 * 
 * Based on NREL PVWatts documentation and standard solar industry data.
 * Values represent efficiency relative to optimal tilt/orientation.
 * 
 * Optimal = latitude tilt, true south in Northern Hemisphere = 1.0
 * Source: NREL PVWatts Calculator documentation
 */
const TILT_ORIENTATION_DERATE = {
  // Orientation (Azimuth) x Tilt combinations
  // Tilt: 0 = flat, 30 = moderate, 45 = steep, 90 = vertical
  // Orientation: S = South, SE/SW = Southeast/Southwest, E/W = East/West, N = North
  
  'S_30': 1.00,   // Optimal: South-facing, tilt ~latitude
  'S_0': 0.85,    // Flat roof, south-facing
  'S_45': 0.95,   // Steeper tilt than optimal
  'S_90': 0.70,   // Vertical wall, south-facing
  
  'SE_30': 0.92,  // Slight east of south
  'SE_0': 0.82,
  'SE_45': 0.88,
  
  'SW_30': 0.92,  // Slight west of south
  'SW_0': 0.82,
  'SW_45': 0.88,
  
  'E_30': 0.85,   // East-facing
  'E_0': 0.78,
  'E_45': 0.80,
  'E_90': 0.65,   // Vertical wall, east-facing
  
  'W_30': 0.85,   // West-facing
  'W_0': 0.78,
  'W_45': 0.80,
  'W_90': 0.65,   // Vertical wall, west-facing
  
  'N_30': 0.65,   // North-facing (poor in Northern Hemisphere)
  'N_0': 0.60,
  'N_45': 0.55,
  'N_90': 0.50,   // Vertical wall, north-facing
};

/**
 * Get tilt/orientation derate factor from lookup table
 * 
 * @param {string} orientation - Compass direction (S, SE, SW, E, W, N)
 * @param {number} tiltDegrees - Panel tilt in degrees (0-90)
 * @returns {number} Derate factor (0-1)
 */
export function getTiltOrientationDerate(orientation, tiltDegrees) {
  // Categorize tilt into buckets
  let tiltKey;
  if (tiltDegrees <= 10) tiltKey = '0';
  else if (tiltDegrees <= 37) tiltKey = '30';
  else if (tiltDegrees <= 67) tiltKey = '45';
  else tiltKey = '90';
  
  const key = `${orientation}_${tiltKey}`;
  return TILT_ORIENTATION_DERATE[key] || 0.85; // Default to moderate derate
}

/**
 * Calculate temperature derate factor
 * 
 * Real panels lose ~0.3-0.4% per °C above 25°C cell temperature.
 * This simplified model uses:
 *   Temp_Derate = 1 - (0.004 × max(0, CellTemp - 25))
 *   where CellTemp ≈ AmbientTemp + 20 (standard approximation)
 * 
 * Source: Standard temperature coefficient for crystalline silicon panels
 * Note: The +20°C cell-above-ambient approximation is a standard simplification
 * for consumer-facing solar estimators.
 * 
 * @param {number} avgAmbientTempC - Average ambient temperature in Celsius
 * @returns {number} Temperature derate factor (0-1)
 */
export function calculateTempDerate(avgAmbientTempC) {
  const cellTemp = avgAmbientTempC + 20; // Standard approximation
  const tempAbove25 = Math.max(0, cellTemp - 25);
  return 1 - (0.004 * tempAbove25);
}

/**
 * Calculate effective array power with derating
 * 
 * Uses the industry-standard NREL PVWatts default derate factor of 0.86,
 * which accounts for inverter losses, wiring, soiling, and module mismatch.
 * 
 * @param {number} panelCount - Number of solar panels
 * @param {number} panelWattageSTC - Per-panel STC rating in watts
 * @param {number} tempDerate - Temperature derate factor
 * @param {number} tiltOrientationDerate - Tilt/orientation derate factor
 * @param {number} systemDerate - System derate (default 0.86 per PVWatts)
 * @returns {number} Effective array power in watts
 */
export function calculateEffectiveArrayPower(
  panelCount,
  panelWattageSTC,
  tempDerate,
  tiltOrientationDerate,
  systemDerate = 0.86
) {
  return panelCount * panelWattageSTC * tempDerate * tiltOrientationDerate * systemDerate;
}

/**
 * Calculate daily solar energy production
 * 
 * Daily Solar Energy (Wh/day) = Effective_Array_Power (W) × Peak_Sun_Hours (PSH)
 * 
 * PSH (Peak Sun Hours) is a standard solar industry unit representing
 * equivalent hours of 1000W/m² irradiance per day. This is NOT the same
 * as daylight hours - it's the solar-industry metric for solar resource.
 * 
 * @param {number} effectiveArrayPower - Effective array power in watts
 * @param {number} peakSunHours - Peak sun hours for the location
 * @returns {number} Daily solar energy in watt-hours (Wh)
 */
export function calculateDailySolarEnergy(effectiveArrayPower, peakSunHours) {
  return effectiveArrayPower * peakSunHours;
}

/**
 * Generate hourly solar output curve (24-hour profile)
 * 
 * Models solar output as a sine-squared curve across daylight hours.
 * This is a clear-sky idealized model; real output depends on cloud cover.
 * 
 * The curve is scaled so the integral equals the daily solar energy.
 * This is a standard simplification for consumer-facing solar estimators.
 * 
 * Note: A "weather variability" feature could be added in Phase 2
 * to modify this curve based on typical cloud patterns.
 * 
 * @param {number} dailySolarEnergyWh - Total daily solar energy in Wh
 * @param {number} sunriseHour - Hour of sunrise (e.g., 6 for 6 AM)
 * @param {number} sunsetHour - Hour of sunset (e.g., 20 for 8 PM)
 * @returns {Array} 24-element array with hourly solar output in watts
 */
export function generateHourlySolarCurve(dailySolarEnergyWh, sunriseHour = 6, sunsetHour = 20) {
  const hourlyOutput = new Array(24).fill(0);
  const daylightHours = sunsetHour - sunriseHour;
  
  // Calculate the integral of sin²(t) from 0 to π (normalized to 1)
  // This is π/2 ≈ 1.5708
  const sinSquaredIntegral = Math.PI / 2;
  
  // Scale factor to make the integral equal dailySolarEnergyWh
  // We need: integral of output(t) dt = dailySolarEnergyWh
  // output(t) = peakPower * sin²(π * (t - sunrise) / daylight)
  // integral = peakPower * daylightHours * sinSquaredIntegral / π
  // So: peakPower = dailySolarEnergyWh * π / (daylightHours * sinSquaredIntegral)
  // Simplified: peakPower = dailySolarEnergyWh / (daylightHours * 0.6366)
  const peakPower = dailySolarEnergyWh / (daylightHours * 0.6366);
  
  for (let hour = 0; hour < 24; hour++) {
    if (hour >= sunriseHour && hour <= sunsetHour) {
      const t = (hour - sunriseHour) / daylightHours; // Normalized time (0-1)
      const angle = Math.PI * t; // Angle from 0 to π
      hourlyOutput[hour] = peakPower * Math.pow(Math.sin(angle), 2);
    }
  }
  
  return hourlyOutput;
}

/**
 * Validate solar configuration
 * 
 * @param {Object} config - Solar configuration object
 * @returns {Object} Validation result { isValid: boolean, errors: string[] }
 */
export function validateSolarConfig(config) {
  const errors = [];
  
  if (!config.panelCount || config.panelCount <= 0) {
    errors.push('Panel count must be greater than 0');
  }
  
  if (!config.panelWattageSTC || config.panelWattageSTC <= 0) {
    errors.push('Panel wattage must be greater than 0');
  }
  
  if (config.tiltDegrees === undefined || config.tiltDegrees < 0 || config.tiltDegrees > 90) {
    errors.push('Tilt angle must be between 0 and 90 degrees');
  }
  
  if (!config.orientation) {
    errors.push('Orientation is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
