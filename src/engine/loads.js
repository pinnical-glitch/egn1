/**
 * Load Calculations Module
 * 
 * Pure functions for calculating electrical load metrics.
 * All functions take explicit inputs and return explicit outputs.
 */

/**
 * Calculate total connected load (sum of all running watts)
 * @param {Array} appliances - Array of appliance objects with ratedWatts
 * @returns {number} Total connected load in watts
 */
export function calculateTotalConnectedLoad(appliances) {
  return appliances.reduce((total, appliance) => total + appliance.ratedWatts, 0);
}

/**
 * Calculate peak load (running loads + single largest surge)
 * 
 * Peak load represents what the inverter must handle:
 * - Sum of all running loads (assuming concurrent operation)
 * - Plus the SINGLE LARGEST surge from motor-driven appliances
 *   (only one appliance starts at a time in reality)
 * 
 * @param {Array} appliances - Array of appliance objects
 * @returns {number} Peak load in watts
 */
export function calculatePeakLoad(appliances) {
  const totalRunning = calculateTotalConnectedLoad(appliances);
  
  // Find the single largest surge among motor-driven appliances
  const motorDriven = appliances.filter(a => a.isMotorDriven);
  const maxSurge = motorDriven.length > 0
    ? Math.max(...motorDriven.map(a => a.surgeWatts - a.ratedWatts))
    : 0;
  
  return totalRunning + maxSurge;
}

/**
 * Calculate daily energy demand (Wh/day)
 * 
 * Uses duty-cycle-adjusted hours, not 24h continuous draw.
 * For example, a fridge with 35% duty cycle runs ~8.4 hours/day, not 24.
 * 
 * @param {Array} appliances - Array of appliance objects with ratedWatts and defaultHoursPerDay
 * @returns {number} Daily energy demand in watt-hours (Wh)
 */
export function calculateDailyEnergyDemand(appliances) {
  return appliances.reduce((total, appliance) => {
    return total + (appliance.ratedWatts * appliance.defaultHoursPerDay);
  }, 0);
}

/**
 * Calculate daily energy demand by priority tier
 * 
 * @param {Array} appliances - Array of appliance objects
 * @returns {Object} Energy demand grouped by priority { Critical: Wh, Important: Wh, Optional: Wh }
 */
export function calculateEnergyDemandByPriority(appliances) {
  const demandByPriority = {
    Critical: 0,
    Important: 0,
    Optional: 0,
  };
  
  appliances.forEach(appliance => {
    const energy = appliance.ratedWatts * appliance.defaultHoursPerDay;
    demandByPriority[appliance.priority] = (demandByPriority[appliance.priority] || 0) + energy;
  });
  
  return demandByPriority;
}

/**
 * Calculate hourly load profile (24-hour array)
 * 
 * Simplified model: distributes each appliance's daily runtime evenly
 * across "typical" usage hours. This is a Phase 1 simplification;
 * real load profiles vary by time of day and user behavior.
 * 
 * @param {Array} appliances - Array of appliance objects
 * @returns {Array} 24-element array with hourly load in watts
 */
export function calculateHourlyLoadProfile(appliances) {
  const hourlyLoad = new Array(24).fill(0);
  
  appliances.forEach(appliance => {
    const hoursOn = appliance.defaultHoursPerDay;
    const dutyCycle = hoursOn / 24;
    
    // Distribute load across 24 hours based on duty cycle
    // Simplified: assume appliance runs uniformly throughout the day
    for (let hour = 0; hour < 24; hour++) {
      if (Math.random() < dutyCycle) {
        hourlyLoad[hour] += appliance.ratedWatts;
      }
    }
  });
  
  return hourlyLoad;
}

/**
 * Calculate load breakdown by category
 * 
 * @param {Array} appliances - Array of appliance objects
 * @returns {Object} Energy demand grouped by category
 */
export function calculateLoadBreakdownByCategory(appliances) {
  const breakdown = {};
  
  appliances.forEach(appliance => {
    const energy = appliance.ratedWatts * appliance.defaultHoursPerDay;
    const category = appliance.category || 'Other';
    breakdown[category] = (breakdown[category] || 0) + energy;
  });
  
  return breakdown;
}

/**
 * Validate appliance configuration
 * 
 * @param {Object} appliance - Appliance object to validate
 * @returns {Object} Validation result { isValid: boolean, errors: string[] }
 */
export function validateAppliance(appliance) {
  const errors = [];
  
  if (!appliance.name || appliance.name.trim() === '') {
    errors.push('Appliance name is required');
  }
  
  if (!appliance.ratedWatts || appliance.ratedWatts <= 0) {
    errors.push('Rated watts must be greater than 0');
  }
  
  if (appliance.surgeWatts !== undefined && appliance.surgeWatts < appliance.ratedWatts) {
    errors.push('Surge watts cannot be less than rated watts');
  }
  
  if (!appliance.defaultHoursPerDay || appliance.defaultHoursPerDay < 0 || appliance.defaultHoursPerDay > 24) {
    errors.push('Hours per day must be between 0 and 24');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
