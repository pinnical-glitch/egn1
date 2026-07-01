import { useState } from 'react';
import { CLIMATE_ZONES } from '../../engine/climateZones.js';

const HOUSE_TYPES = [
  { id: 'single_family', name: 'Single-Family Detached' },
  { id: 'townhouse', name: 'Townhouse' },
  { id: 'condo', name: 'Apartment/Condo' },
  { id: 'mobile', name: 'Mobile Home' },
];

export default function HomeForm({ config, onChange }) {
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    const newConfig = { ...config, [field]: value };
    onChange(newConfig);
    
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!config.climateZone) {
      newErrors.climateZone = 'Climate zone is required';
    }
    if (!config.houseType) {
      newErrors.houseType = 'House type is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Home Information</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select your climate zone and home type. Climate zone affects solar irradiance 
          and temperature assumptions for the simulation.
        </p>
      </div>

      {/* Climate Zone */}
      <div>
        <label htmlFor="climateZone" className="block text-sm font-medium text-gray-700 mb-2">
          Climate Zone / Location
        </label>
        <select
          id="climateZone"
          value={config.climateZone || ''}
          onChange={(e) => handleChange('climateZone', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150 ${
            errors.climateZone ? 'border-red-500' : 'border-gray-300'
          }`}
          aria-describedby={errors.climateZone ? 'climateZone-error' : undefined}
        >
          <option value="">Select a climate zone</option>
          {CLIMATE_ZONES.map(zone => (
            <option key={zone.id} value={zone.id}>
              {zone.name} - {zone.description}
            </option>
          ))}
        </select>
        {errors.climateZone && (
          <p id="climateZone-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.climateZone}
          </p>
        )}
        {config.climateZone && (
          <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
            <strong>Solar Resource:</strong> {CLIMATE_ZONES.find(z => z.id === config.climateZone)?.peakSunHours} peak sun hours/day (annual average)
            <br />
            <strong>Temperature Range:</strong> {CLIMATE_ZONES.find(z => z.id === config.climateZone)?.tempRangeC[0]}°C to {CLIMATE_ZONES.find(z => z.id === config.climateZone)?.tempRangeC[1]}°C
          </div>
        )}
      </div>

      {/* House Type */}
      <div>
        <label htmlFor="houseType" className="block text-sm font-medium text-gray-700 mb-2">
          House Type
        </label>
        <select
          id="houseType"
          value={config.houseType || ''}
          onChange={(e) => handleChange('houseType', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150 ${
            errors.houseType ? 'border-red-500' : 'border-gray-300'
          }`}
          aria-describedby={errors.houseType ? 'houseType-error' : undefined}
        >
          <option value="">Select house type</option>
          {HOUSE_TYPES.map(type => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
        {errors.houseType && (
          <p id="houseType-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.houseType}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          House type is captured for Phase 2+ insulation and cost modeling.
        </p>
      </div>

      {/* Blackout Duration */}
      <div>
        <label htmlFor="blackoutHours" className="block text-sm font-medium text-gray-700 mb-2">
          Blackout Duration (hours)
        </label>
        <input
          type="number"
          id="blackoutHours"
          value={config.blackoutHours || 72}
          onChange={(e) => handleChange('blackoutHours', parseInt(e.target.value) || 72)}
          min="1"
          max="168"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
          aria-describedby="blackoutHours-help"
        />
        <p id="blackoutHours-help" className="mt-1 text-xs text-gray-500">
          Default: 72 hours (3 days). Range: 1-168 hours (1 week).
        </p>
      </div>

      {/* Blackouts Per Year */}
      <div>
        <label htmlFor="blackoutsPerYear" className="block text-sm font-medium text-gray-700 mb-2">
          Expected Blackouts Per Year
        </label>
        <input
          type="number"
          id="blackoutsPerYear"
          value={config.blackoutsPerYear || 4}
          onChange={(e) => handleChange('blackoutsPerYear', parseInt(e.target.value) || 4)}
          min="1"
          max="52"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
          aria-describedby="blackoutsPerYear-help"
        />
        <p id="blackoutsPerYear-help" className="mt-1 text-xs text-gray-500">
          Used for battery degradation estimate. Default: 4 (monthly).
        </p>
      </div>
    </div>
  );
}
