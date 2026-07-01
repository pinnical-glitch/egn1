import { useState, useEffect } from 'react';
import { BATTERY_CHEMISTRY } from '../../engine/battery.js';

export default function BatteryForm({ config, onChange }) {
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    const newConfig = { ...config, [field]: value };
    onChange(newConfig);
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Update defaults when chemistry changes
  useEffect(() => {
    if (config.chemistry) {
      const chemistry = BATTERY_CHEMISTRY[config.chemistry.toUpperCase()];
      if (chemistry) {
        // Only update if values haven't been manually changed
        if (config.maxDoD === undefined || config.maxDoD === BATTERY_CHEMISTRY.LFP.defaultMaxDoD) {
          handleChange('maxDoD', chemistry.defaultMaxDoD);
        }
        if (config.roundTripEfficiency === undefined || config.roundTripEfficiency === BATTERY_CHEMISTRY.LFP.defaultRoundTripEfficiency) {
          handleChange('roundTripEfficiency', chemistry.defaultRoundTripEfficiency);
        }
      }
    }
  }, [config.chemistry]);

  const chemistry = config.chemistry ? BATTERY_CHEMISTRY[config.chemistry.toUpperCase()] : BATTERY_CHEMISTRY.LFP;
  const usableCapacityKwh = (config.capacityKwh || 0) * (config.maxDoD || 0.92);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Battery Configuration</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure your battery storage system. The simulation applies round-trip 
          efficiency losses at the charge step (standard convention).
        </p>
      </div>

      {/* Chemistry Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Battery Chemistry
        </label>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(BATTERY_CHEMISTRY).map(([key, chem]) => (
            <label
              key={key}
              className={`flex flex-col p-4 rounded-lg border cursor-pointer transition-colors duration-150 ${
                config.chemistry === chem.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="chemistry"
                value={chem.id}
                checked={config.chemistry === chem.id}
                onChange={(e) => handleChange('chemistry', e.target.value)}
                className="sr-only"
              />
              <span className="text-sm font-medium text-gray-900">{chem.name}</span>
              <span className="text-xs text-gray-500 mt-1">
                {chem.id === 'lfp' ? 'Deep cycle, long life' : 'Traditional, lower cost'}
              </span>
              <div className="mt-2 text-xs text-gray-600">
                <div>Max DoD: {chem.defaultMaxDoD * 100}%</div>
                <div>Efficiency: {chem.defaultRoundTripEfficiency * 100}%</div>
                <div>~{chem.cycleLifeAt50DoD.toLocaleString()} cycles at 50% DoD</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Capacity */}
      <div>
        <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-2">
          Usable Capacity (kWh)
        </label>
        <input
          type="number"
          id="capacity"
          value={config.capacityKwh || ''}
          onChange={(e) => handleChange('capacityKwh', parseFloat(e.target.value) || 0)}
          min="0.1"
          max="100"
          step="0.1"
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150 ${
            errors.capacityKwh ? 'border-red-500' : 'border-gray-300'
          }`}
          aria-describedby={errors.capacityKwh ? 'capacity-error' : 'capacity-help'}
        />
        {errors.capacityKwh && (
          <p id="capacity-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.capacityKwh}
          </p>
        )}
        <p id="capacity-help" className="mt-1 text-xs text-gray-500">
          Enter the usable capacity (nameplate × max DoD). Typical home batteries: 5-15 kWh.
        </p>
      </div>

      {/* Nameplate vs Usable Explanation */}
      {config.capacityKwh > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg text-sm">
          <div className="text-gray-700">
            <strong>Nameplate Capacity:</strong>{' '}
            {(config.capacityKwh / (config.maxDoD || 0.92)).toFixed(2)} kWh
          </div>
          <div className="text-gray-700">
            <strong>Max DoD:</strong> {((config.maxDoD || 0.92) * 100).toFixed(0)}%
          </div>
          <div className="text-gray-900 font-medium">
            <strong>Usable Capacity:</strong> {usableCapacityKwh.toFixed(2)} kWh
          </div>
        </div>
      )}

      {/* Max Depth of Discharge */}
      <div>
        <label htmlFor="maxDoD" className="block text-sm font-medium text-gray-700 mb-2">
          Max Depth of Discharge (DoD)
        </label>
        <input
          type="range"
          id="maxDoD"
          value={(config.maxDoD || 0.92) * 100}
          onChange={(e) => handleChange('maxDoD', parseInt(e.target.value) / 100)}
          min="10"
          max="100"
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          aria-describedby="maxDoD-help"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>10%</span>
          <span className="font-medium text-gray-700">{((config.maxDoD || 0.92) * 100).toFixed(0)}%</span>
          <span>100%</span>
        </div>
        <p id="maxDoD-help" className="mt-2 text-xs text-gray-500">
          Maximum discharge depth. Lower values extend battery life but reduce usable capacity.
          {config.chemistry === 'lead_acid' && (
            <span className="text-amber-600"> Lead-acid batteries should not exceed 50% DoD for longevity.</span>
          )}
        </p>
      </div>

      {/* Round-Trip Efficiency */}
      <div>
        <label htmlFor="rte" className="block text-sm font-medium text-gray-700 mb-2">
          Round-Trip Efficiency (%)
        </label>
        <input
          type="range"
          id="rte"
          value={(config.roundTripEfficiency || 0.95) * 100}
          onChange={(e) => handleChange('roundTripEfficiency', parseInt(e.target.value) / 100)}
          min="70"
          max="100"
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          aria-describedby="rte-help"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>70%</span>
          <span className="font-medium text-gray-700">{((config.roundTripEfficiency || 0.95) * 100).toFixed(0)}%</span>
          <span>100%</span>
        </div>
        <p id="rte-help" className="mt-2 text-xs text-gray-500">
          Efficiency of charge → discharge cycle. Losses occur as heat during conversion.
          LFP typically 95%, Lead-Acid typically 80-85%.
        </p>
      </div>

      {/* Battery Info Summary */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Battery Summary</h4>
        <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
          <div>
            <span className="text-blue-600">Chemistry:</span>{' '}
            {chemistry?.name || 'Not selected'}
          </div>
          <div>
            <span className="text-blue-600">Usable Capacity:</span>{' '}
            {usableCapacityKwh.toFixed(2)} kWh
          </div>
          <div>
            <span className="text-blue-600">Max Discharge:</span>{' '}
            {(usableCapacityKwh * (config.maxDoD || 0.92)).toFixed(2)} kWh
          </div>
          <div>
            <span className="text-blue-600">Cycle Life:</span>{' '}
            ~{(chemistry?.cycleLifeAt50DoD || 6000).toLocaleString()} cycles
          </div>
        </div>
      </div>
    </div>
  );
}
