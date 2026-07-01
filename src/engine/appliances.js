/**
 * Appliance Library - Preset household appliances with typical power ratings
 * 
 * Each appliance includes:
 * - ratedWatts: Typical running power consumption
 * - surgeWatts: Startup/surge power for motor-driven loads (2-3x rated)
 * - defaultHoursPerDay: Typical daily runtime (duty-cycle adjusted)
 * - priority: Critical, Important, or Optional
 * - category: For grouping in the UI
 */

export const PRIORITIES = {
  CRITICAL: 'Critical',
  IMPORTANT: 'Important',
  OPTIONAL: 'Optional',
};

export const CATEGORIES = {
  KITCHEN: 'Kitchen',
  CLIMATE: 'Climate',
  WATER: 'Water',
  LIGHTING: 'Lighting',
  ELECTRONICS: 'Electronics',
  MEDICAL: 'Medical',
  OTHER: 'Other',
};

export const DEFAULT_APPLIANCES = [
  // Kitchen
  {
    id: 'fridge',
    name: 'Refrigerator',
    ratedWatts: 150,
    surgeWatts: 450,
    defaultHoursPerDay: 8.4, // ~35% duty cycle of 24h
    priority: PRIORITIES.CRITICAL,
    category: CATEGORIES.KITCHEN,
    isMotorDriven: true,
  },
  {
    id: 'freezer',
    name: 'Chest Freezer',
    ratedWatts: 100,
    surgeWatts: 300,
    defaultHoursPerDay: 6, // ~25% duty cycle
    priority: PRIORITIES.IMPORTANT,
    category: CATEGORIES.KITCHEN,
    isMotorDriven: true,
  },
  {
    id: 'microwave',
    name: 'Microwave',
    ratedWatts: 1000,
    surgeWatts: 1000,
    defaultHoursPerDay: 0.25, // 15 minutes
    priority: PRIORITIES.IMPORTANT,
    category: CATEGORIES.KITCHEN,
    isMotorDriven: false,
  },
  {
    id: 'dishwasher',
    name: 'Dishwasher',
    ratedWatts: 1800,
    surgeWatts: 1800,
    defaultHoursPerDay: 1,
    priority: PRIORITIES.OPTIONAL,
    category: CATEGORIES.KITCHEN,
    isMotorDriven: false,
  },
  {
    id: 'oven',
    name: 'Electric Oven',
    ratedWatts: 2500,
    surgeWatts: 2500,
    defaultHoursPerDay: 1,
    priority: PRIORITIES.OPTIONAL,
    category: CATEGORIES.KITCHEN,
    isMotorDriven: false,
  },
  {
    id: 'coffeemaker',
    name: 'Coffee Maker',
    ratedWatts: 900,
    surgeWatts: 900,
    defaultHoursPerDay: 0.5,
    priority: PRIORITIES.OPTIONAL,
    category: CATEGORIES.KITCHEN,
    isMotorDriven: false,
  },

  // Climate
  {
    id: 'furnace_fan',
    name: 'Furnace Fan',
    ratedWatts: 750,
    surgeWatts: 1500,
    defaultHoursPerDay: 8,
    priority: PRIORITIES.CRITICAL,
    category: CATEGORIES.CLIMATE,
    isMotorDriven: true,
  },
  {
    id: 'ac_window',
    name: 'Window AC Unit',
    ratedWatts: 1200,
    surgeWatts: 3600,
    defaultHoursPerDay: 8,
    priority: PRIORITIES.IMPORTANT,
    category: CATEGORIES.CLIMATE,
    isMotorDriven: true,
  },
  {
    id: 'portable_heater',
    name: 'Portable Space Heater',
    ratedWatts: 1500,
    surgeWatts: 1500,
    defaultHoursPerDay: 6,
    priority: PRIORITIES.IMPORTANT,
    category: CATEGORIES.CLIMATE,
    isMotorDriven: false,
  },
  {
    id: 'ceiling_fan',
    name: 'Ceiling Fan',
    ratedWatts: 75,
    surgeWatts: 150,
    defaultHoursPerDay: 10,
    priority: PRIORITIES.OPTIONAL,
    category: CATEGORIES.CLIMATE,
    isMotorDriven: true,
  },

  // Water
  {
    id: 'well_pump',
    name: 'Well Pump',
    ratedWatts: 1000,
    surgeWatts: 2000,
    defaultHoursPerDay: 2,
    priority: PRIORITIES.CRITICAL,
    category: CATEGORIES.WATER,
    isMotorDriven: true,
  },
  {
    id: 'sump_pump',
    name: 'Sump Pump',
    ratedWatts: 400,
    surgeWatts: 1200,
    defaultHoursPerDay: 1,
    priority: PRIORITIES.CRITICAL,
    category: CATEGORIES.WATER,
    isMotorDriven: true,
  },
  {
    id: 'water_heater',
    name: 'Electric Water Heater',
    ratedWatts: 4500,
    surgeWatts: 4500,
    defaultHoursPerDay: 3,
    priority: PRIORITIES.IMPORTANT,
    category: CATEGORIES.WATER,
    isMotorDriven: false,
  },

  // Lighting
  {
    id: 'led_lights',
    name: 'LED Lighting (whole house)',
    ratedWatts: 50,
    surgeWatts: 50,
    defaultHoursPerDay: 6,
    priority: PRIORITIES.CRITICAL,
    category: CATEGORIES.LIGHTING,
    isMotorDriven: false,
  },
  {
    id: 'exterior_lights',
    name: 'Exterior/Security Lights',
    ratedWatts: 30,
    surgeWatts: 30,
    defaultHoursPerDay: 12,
    priority: PRIORITIES.IMPORTANT,
    category: CATEGORIES.LIGHTING,
    isMotorDriven: false,
  },

  // Electronics
  {
    id: 'wifi_router',
    name: 'WiFi Router',
    ratedWatts: 12,
    surgeWatts: 12,
    defaultHoursPerDay: 24,
    priority: PRIORITIES.CRITICAL,
    category: CATEGORIES.ELECTRONICS,
    isMotorDriven: false,
  },
  {
    id: 'tv',
    name: 'Television',
    ratedWatts: 100,
    surgeWatts: 100,
    defaultHoursPerDay: 5,
    priority: PRIORITIES.IMPORTANT,
    category: CATEGORIES.ELECTRONICS,
    isMotorDriven: false,
  },
  {
    id: 'laptop',
    name: 'Laptop Charger',
    ratedWatts: 50,
    surgeWatts: 50,
    defaultHoursPerDay: 8,
    priority: PRIORITIES.IMPORTANT,
    category: CATEGORIES.ELECTRONICS,
    isMotorDriven: false,
  },
  {
    id: 'phone_charger',
    name: 'Phone Charger',
    ratedWatts: 10,
    surgeWatts: 10,
    defaultHoursPerDay: 4,
    priority: PRIORITIES.IMPORTANT,
    category: CATEGORIES.ELECTRONICS,
    isMotorDriven: false,
  },
  {
    id: 'desktop_computer',
    name: 'Desktop Computer',
    ratedWatts: 200,
    surgeWatts: 200,
    defaultHoursPerDay: 6,
    priority: PRIORITIES.OPTIONAL,
    category: CATEGORIES.ELECTRONICS,
    isMotorDriven: false,
  },

  // Medical
  {
    id: 'cpap',
    name: 'CPAP Machine',
    ratedWatts: 30,
    surgeWatts: 30,
    defaultHoursPerDay: 8,
    priority: PRIORITIES.CRITICAL,
    category: CATEGORIES.MEDICAL,
    isMotorDriven: false,
  },
  {
    id: 'oxygen_concentrator',
    name: 'Oxygen Concentrator',
    ratedWatts: 350,
    surgeWatts: 500,
    defaultHoursPerDay: 12,
    priority: PRIORITIES.CRITICAL,
    category: CATEGORIES.MEDICAL,
    isMotorDriven: true,
  },
  {
    id: 'medical_fridge',
    name: 'Medical Supply Fridge',
    ratedWatts: 100,
    surgeWatts: 300,
    defaultHoursPerDay: 8,
    priority: PRIORITIES.CRITICAL,
    category: CATEGORIES.MEDICAL,
    isMotorDriven: true,
  },

  // Other
  {
    id: 'garage_door',
    name: 'Garage Door Opener',
    ratedWatts: 350,
    surgeWatts: 1050,
    defaultHoursPerDay: 0.25, // 15 minutes
    priority: PRIORITIES.OPTIONAL,
    category: CATEGORIES.OTHER,
    isMotorDriven: true,
  },
  {
    id: 'washer',
    name: 'Washing Machine',
    ratedWatts: 500,
    surgeWatts: 1000,
    defaultHoursPerDay: 1,
    priority: PRIORITIES.OPTIONAL,
    category: CATEGORIES.OTHER,
    isMotorDriven: true,
  },
  {
    id: 'dryer',
    name: 'Clothes Dryer',
    ratedWatts: 2500,
    surgeWatts: 2500,
    defaultHoursPerDay: 1,
    priority: PRIORITIES.OPTIONAL,
    category: CATEGORIES.OTHER,
    isMotorDriven: false,
  },
];

/**
 * Create a new appliance with user-provided values
 */
export function createAppliance({ name, ratedWatts, surgeWatts, hoursPerDay, priority, category }) {
  return {
    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    ratedWatts,
    surgeWatts: surgeWatts || ratedWatts, // Default to rated if not specified
    defaultHoursPerDay: hoursPerDay,
    priority: priority || PRIORITIES.OPTIONAL,
    category: category || CATEGORIES.OTHER,
    isMotorDriven: surgeWatts > ratedWatts * 1.5, // Auto-detect if surge is significantly higher
    isCustom: true,
  };
}
