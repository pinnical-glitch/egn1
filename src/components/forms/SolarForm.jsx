import { useState } from 'react';

const ORIENTATIONS = [
  { id: 'S', name: 'South (S)', description: 'Optimal for Northern Hemisphere' },
  { id: 'SE', name: 'Southeast (SE)', description: 'Good morning production' },
  { id: 'SW', name: 'Southwest (SW)', description: 'Good afternoon production' },
  { id: 'E', name: 'East (E)', description: 'Morning-focused production' },
  { id: 'W', name: 'West (W)', description: 'Afternoon-focused production' },
  { id: 'N', name: 'North (N)', description: 'Poor for Northern Hemisphere' },
];

export default function SolarForm({ config, onChange }) {
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    const newConfig = { ...config, [field]: value };
    onChange(newConfig);
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Solar Configuration</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure your solar panel array. Output is calculated using industry-standard 
          PVWatts derating (0.86 system derate factor) to account for inverter losses, 
          wiring, soiling, and module mismatch.
        </p>
      </div>

      {/* Panel Count and Wattage */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="panelCount" className="block text-sm font-medium text-gray-700 mb-2">
            Number of Panels
          </label>
          <input
            type="number"
            id="panelCount"
            value={config.panelCount || ''}
            onChange={(e) => handleChange('panelCount', parseInt(e.target.value) || 0)}
            min="1"
            max="100"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150 ${
              errors.panelCount ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-describedby={errors.panelCount ? 'panelCount-error' : 'panelCount-help'}
          />
          {errors.panelCount && (
            <p id="panelCount-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.panelCount}
            </p>
          )}
          <p id="panelCount-help" className="mt-1 text-xs text-gray-500">
            Typical residential: 10-20 panels
          </p>
        </div>

        <div>
          <label htmlFor="panelWattage" className="block text-sm font-medium text-gray-700 mb-2">
            Panel Wattage (STC)
          </label>
          <input
            type="number"
            id="panelWattage"
            value={config.panelWattageSTC || ''}
            onChange={(e) => handleChange('panelWattageSTC', parseInt(e.target.value) || 0)}
            min="100"
            max="600"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150 ${
              errors.panelWattageSTC ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-describedby={errors.panelWattageSTC ? 'panelWattage-error' : 'panelWattage-help'}
          />
          {errors.panelWattageSTC && (
            <p id="panelWattage-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.panelWattageSTC}
            </p>
          )}
          <p id="panelWattage-help" className="mt-1 text-xs text-gray-500">
            STC rating (e.g., 350W, 400W, 450W)
          </p>
        </div>
      </div>

      {/* Total Array Size Display */}
      {config.panelCount > 0 && config.panelWattageSTC > 0 && (
        <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
          <strong>Total Array Size:</strong>{' '}
          {((config.panelCount * config.panelWattageSTC) / 1000).toFixed(1)} kW DC (nameplate)
        </div>
      )}

      {/* Tilt Angle */}
      <div>
        <label htmlFor="tilt" className="block text-sm font-medium text-gray-700 mb-2">
          Tilt Angle (degrees)
        </label>
        <input
          type="range"
          id="tilt"
          value={config.tiltDegrees ?? 30}
          onChange={(e) => handleChange('tiltDegrees', parseInt(e.target.value))}
          min="0"
          max="90"
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          aria-describedby="tilt-help"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0° (Flat)</span>
          <span className="font-medium text-gray-700">{config.tiltDegrees ?? 30}°</span>
          <span>90° (Vertical)</span>
        </div>
        <p id="tilt-help" className="mt-2 text-xs text-gray-500">
          Optimal tilt ≈ your latitude (typically 30-40° for most US locations).
          Flat roofs (0°) lose ~15% efficiency vs optimal tilt.
        </p>
      </div>

      {/* Orientation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Orientation (Azimuth)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {ORIENTATIONS.map(orientation => (
            <label
              key={orientation.id}
              className={`flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-colors duration-150 ${
                config.orientation === orientation.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="orientation"
                value={orientation.id}
                checked={config.orientation === orientation.id}
                onChange={(e) => handleChange('orientation', e.target.value)}
                className="sr-only"
              />
              <span className="text-lg font-medium text-gray-900">{orientation.id}</span>
              <span className="text-xs text-gray-600">{orientation.name}</span>
              <span className="text-xs text-gray-500 text-center mt-1">{orientation.description}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Solar Output Preview */}
      {config.panelCount > 0 && config.panelWattageSTC > 0 && (
        <div className="p-4 bg-amber-50 rounded-lg">
          <h4 className="text-sm font-medium text-amber-900 mb-2">Estimated Daily Output</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-amber-700">Nameplate:</span>{' '}
              <span className="font-medium text-amber-900">
                {config.panelCount * config.panelWattageSTC} Wh/day
              </span>
            </div>
            <div>
              <span className="text-amber-700">After derating:</span>{' '}
              <span className="font-medium text-amber-900">
                ~{Math.round(config.panelCount * config.panelWattageSTC * 0.86)} Wh/day
              </span>
            </div>
          </div>
          <p className="text-xs text-amber-700 mt-2">
            Actual output depends on climate zone PSH, temperature, and orientation.
          </p>
        </div>
      )}
    </div>
  );
}
