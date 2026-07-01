/**
 * Climate Zone Presets - Representative US climate zones
 * 
 * Each zone includes:
 * - peakSunHours (PSH): Equivalent full-sun hours per day (solar industry standard)
 * - avgAmbientTempC: Average ambient temperature in Celsius
 * - tempRangeC: Seasonal temperature range [low, high]
 * - description: Human-readable description
 * 
 * PSH values are based on NREL PVWatts data for representative locations.
 * These are annual averages; actual values vary by season.
 */

export const CLIMATE_ZONES = [
  {
    id: 'us_temperate',
    name: 'US Temperate (Mid-Latitude)',
    description: 'Ohio Valley-like climate with moderate solar and seasonal temperature swing',
    peakSunHours: 4.5,
    avgAmbientTempC: 12,
    tempRangeC: [-5, 30],
    region: 'US',
  },
  {
    id: 'us_southwest',
    name: 'US Southwest (Desert)',
    description: 'Arizona/Nevada-like climate with high solar irradiance and hot summers',
    peakSunHours: 6.5,
    avgAmbientTempC: 24,
    tempRangeC: [5, 42],
    region: 'US',
  },
  {
    id: 'us_northeast',
    name: 'US Northeast',
    description: 'New England-like climate with lower solar and cold winters',
    peakSunHours: 4.0,
    avgAmbientTempC: 10,
    tempRangeC: [-10, 28],
    region: 'US',
  },
  {
    id: 'us_southeast',
    name: 'US Southeast',
    description: 'Florida/Georgia-like climate with good solar and mild winters',
    peakSunHours: 5.0,
    avgAmbientTempC: 19,
    tempRangeC: [5, 35],
    region: 'US',
  },
  {
    id: 'us_northwest',
    name: 'US Northwest',
    description: 'Pacific Northwest-like climate with lower solar and mild temperatures',
    peakSunHours: 3.5,
    avgAmbientTempC: 11,
    tempRangeC: [0, 25],
    region: 'US',
  },
  {
    id: 'us_mountain',
    name: 'US Mountain West',
    description: 'Colorado/Utah-like climate with high solar and large temperature swings',
    peakSunHours: 5.5,
    avgAmbientTempC: 8,
    tempRangeC: [-15, 32],
    region: 'US',
  },
];

/**
 * Get a climate zone by ID
 */
export function getClimateZone(id) {
  return CLIMATE_ZONES.find(zone => zone.id === id) || CLIMATE_ZONES[0];
}

/**
 * Get the default climate zone (US Temperate)
 */
export function getDefaultClimateZone() {
  return CLIMATE_ZONES[0];
}
