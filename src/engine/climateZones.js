/**
 * Climate Zone Presets - Egypt Regions
 */

export const CLIMATE_ZONES = [
  { id: 'egypt_cairo', name: 'Cairo & Giza', desc: 'Nile Valley urban', psh: 5.7, tmp: 23, rng: [10, 35], gridCarbon: 0.56 },
  { id: 'egypt_alex', name: 'Alexandria & Coast', desc: 'Mediterranean coast', psh: 5.0, tmp: 20, rng: [8, 33], gridCarbon: 0.56 },
  { id: 'egypt_delta', name: 'Nile Delta', desc: 'Lower Egypt farmland', psh: 5.2, tmp: 22, rng: [8, 35], gridCarbon: 0.56 },
  { id: 'egypt_south', name: 'Upper Egypt', desc: 'Asyut to Aswan', psh: 6.5, tmp: 28, rng: [12, 43], gridCarbon: 0.56 },
  { id: 'egypt_redsea', name: 'Red Sea Coast', desc: 'Hurghada & Safaga', psh: 6.6, tmp: 26, rng: [14, 40], gridCarbon: 0.56 },
  { id: 'egypt_sinai', name: 'Sinai Peninsula', desc: 'Desert & coast', psh: 6.2, tmp: 22, rng: [8, 38], gridCarbon: 0.56 }
];

export function getClimateZone(id) {
  return CLIMATE_ZONES.find(z => z.id === id) || CLIMATE_ZONES[0];
}

export function getDefaultClimateZone() {
  return CLIMATE_ZONES[0];
}
