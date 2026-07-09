/**
 * Appliance Library - Matching all.html DEFAULT_APPS
 */

export const PRIORITIES = { CRITICAL: 'Critical', IMPORTANT: 'Important', OPTIONAL: 'Optional' };
export const CATEGORIES = { KITCHEN: 'Kitchen', CLIMATE: 'Climate', WATER: 'Water', LIGHTING: 'Lighting', ELECTRONICS: 'Electronics', MEDICAL: 'Medical', OTHER: 'Other' };

export const DEFAULT_APPLIANCES = [
  { id: 'fridge', name: 'Refrigerator', w: 150, s: 450, h: 8.4, p: 'Critical', cat: 'Kitchen', m: true },
  { id: 'freezer', name: 'Chest Freezer', w: 100, s: 300, h: 6, p: 'Important', cat: 'Kitchen', m: true },
  { id: 'microwave', name: 'Microwave', w: 1000, s: 1000, h: 0.25, p: 'Important', cat: 'Kitchen', m: false },
  { id: 'dishwasher', name: 'Dishwasher', w: 1800, s: 1800, h: 1, p: 'Optional', cat: 'Kitchen', m: false },
  { id: 'oven', name: 'Electric Oven', w: 2500, s: 2500, h: 1, p: 'Optional', cat: 'Kitchen', m: false },
  { id: 'coffeemaker', name: 'Coffee Maker', w: 900, s: 900, h: 0.5, p: 'Optional', cat: 'Kitchen', m: false },
  { id: 'furnace', name: 'Furnace Fan', w: 750, s: 1500, h: 8, p: 'Critical', cat: 'Climate', m: true },
  { id: 'ac', name: 'Window AC', w: 1200, s: 3600, h: 8, p: 'Important', cat: 'Climate', m: true },
  { id: 'heater', name: 'Space Heater', w: 1500, s: 1500, h: 6, p: 'Important', cat: 'Climate', m: false },
  { id: 'cfan', name: 'Ceiling Fan', w: 75, s: 150, h: 10, p: 'Optional', cat: 'Climate', m: true },
  { id: 'well', name: 'Well Pump', w: 1000, s: 2000, h: 2, p: 'Critical', cat: 'Water', m: true },
  { id: 'sump', name: 'Sump Pump', w: 400, s: 1200, h: 1, p: 'Critical', cat: 'Water', m: true },
  { id: 'wh', name: 'Water Heater', w: 4500, s: 4500, h: 3, p: 'Important', cat: 'Water', m: false },
  { id: 'led', name: 'LED Lighting', w: 50, s: 50, h: 6, p: 'Critical', cat: 'Lighting', m: false },
  { id: 'ext', name: 'Exterior Lights', w: 30, s: 30, h: 12, p: 'Important', cat: 'Lighting', m: false },
  { id: 'wifi', name: 'WiFi Router', w: 12, s: 12, h: 24, p: 'Critical', cat: 'Electronics', m: false },
  { id: 'tv', name: 'Television', w: 100, s: 100, h: 5, p: 'Important', cat: 'Electronics', m: false },
  { id: 'laptop', name: 'Laptop', w: 50, s: 50, h: 8, p: 'Important', cat: 'Electronics', m: false },
  { id: 'phone', name: 'Phone Charger', w: 10, s: 10, h: 4, p: 'Important', cat: 'Electronics', m: false },
  { id: 'desktop', name: 'Desktop PC', w: 200, s: 200, h: 6, p: 'Optional', cat: 'Electronics', m: false },
  { id: 'cpap', name: 'CPAP Machine', w: 30, s: 30, h: 8, p: 'Critical', cat: 'Medical', m: false },
  { id: 'o2', name: 'Oxygen Concentrator', w: 350, s: 500, h: 12, p: 'Critical', cat: 'Medical', m: true },
  { id: 'medfr', name: 'Medical Fridge', w: 100, s: 300, h: 8, p: 'Critical', cat: 'Medical', m: true },
  { id: 'garage', name: 'Garage Door', w: 350, s: 1050, h: 0.25, p: 'Optional', cat: 'Other', m: true },
  { id: 'washer', name: 'Washer', w: 500, s: 1000, h: 1, p: 'Optional', cat: 'Other', m: true },
  { id: 'dryer', name: 'Dryer', w: 2500, s: 2500, h: 1, p: 'Optional', cat: 'Other', m: false }
];

export function createAppliance({ name, ratedWatts, surgeWatts, hoursPerDay, priority, category }) {
  return {
    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name, w: ratedWatts, s: surgeWatts || ratedWatts, h: hoursPerDay,
    p: priority || 'Optional', cat: category || 'Other',
    m: (surgeWatts || ratedWatts) > ratedWatts * 1.5
  };
}
