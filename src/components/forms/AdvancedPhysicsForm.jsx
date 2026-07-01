import { useState } from 'react';

/**
 * Advanced Physics Form - Phase 2
 * 
 * Optional 6th step in the wizard for fine-tuning solar and battery physics.
 * All parameters have sensible defaults so novice users never need to touch this.
 */

const SEASONS = [
  { id: 'winter', name: 'Winter', description: '~65% of summer PSH' },
  { id: 'spring', name: 'Spring', description: '~85% of summer PSH' },
  { id: 'summer', name: 'Summer', description: 'Peak production' },
  { id: 'fall', name: 'Fall', description: '~80% of summer PSH' },
];

const CLOUD_SCENARIOS = [
  { id: 'clear', name: 'Clear', description: 'Sunny, minimal clouds (~20% attenuation)' },
  { id: 'typical', name: 'Typical', description: 'Average conditions (~33% attenuation)' },
  { id: 'poor', name: 'Poor', description: 'Frequent clouds (~50% attenuation)' },
];

export default function AdvancedPhysicsForm({ config, onChange }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (key, value) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Advanced Physics</h3>
        <p className="text-sm text-gray-600 mt-1">
          Fine-tune simulation parameters. All values have sensible defaults.
        </p>
      </div>

      {/* Collapsible section for novices */}
      <div className="bg-gray-50 rounded-lg p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-left"
          aria-expanded={isExpanded}
        >
          <div>
            <span className="font-medium text-gray-900">
              {isExpanded ? 'Hide' : 'Show'} Advanced Options
            </span>
            <p className="text-xs text-gray-500 mt-0.5">
              Optional: leave defaults for standard simulation
            </p>
          </div>
          <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* Quick settings (always visible) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Season
          </label>
          <select
            value={config.season || 'summer'}
            onChange={(e) => handleChange('season', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {SEASONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} - {s.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Weather Scenario
          </label>
          <select
            value={config.cloudScenario || 'typical'}
            onChange={(e) => handleChange('cloudScenario', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {CLOUD_SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} - {s.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced options (collapsible) */}
      {isExpanded && (
        <div className="space-y-4 border-t border-gray-200 pt-4">
          {/* Solar Physics */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Solar Panel Physics</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NOCT (°C)
                </label>
                <input
                  type="number"
                  value={config.noct || 45}
                  onChange={(e) => handleChange('noct', parseFloat(e.target.value) || 45)}
                  min={35}
                  max={55}
                  step={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nominal Operating Cell Temp (40-50 typical)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temp Coefficient (%/°C)
                </label>
                <input
                  type="number"
                  value={((config.tempCoeff || -0.0038) * 100).toFixed(2)}
                  onChange={(e) => handleChange('tempCoeff', parseFloat(e.target.value) / 100 || -0.0038)}
                  min={-0.5}
                  max={0}
                  step={0.01}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Power loss per °C above 25°C (-0.3 to -0.5 typical)
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inverter Efficiency: {((config.inverterEfficiency || 0.95) * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                value={(config.inverterEfficiency || 0.95) * 100}
                onChange={(e) => handleChange('inverterEfficiency', parseFloat(e.target.value) / 100)}
                min={85}
                max={98}
                step={0.5}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>85% (older)</span>
                <span>98% (premium)</span>
              </div>
            </div>
          </div>

          {/* System Derate Mode */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">System Losses</h4>
            
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="useAdvancedMode"
                checked={config.useAdvancedMode || false}
                onChange={(e) => handleChange('useAdvancedMode', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="useAdvancedMode" className="text-sm text-gray-700">
                Use individual sub-derates (advanced)
              </label>
            </div>

            {!config.useAdvancedMode ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  System Derate: {(config.systemDerate || 0.86).toFixed(2)}
                </label>
                <input
                  type="range"
                  value={(config.systemDerate || 0.86) * 100}
                  onChange={(e) => handleChange('systemDerate', parseFloat(e.target.value) / 100)}
                  min={80}
                  max={90}
                  step={0.5}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>0.80 (conservative)</span>
                  <span>0.90 (optimistic)</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  NREL PVWatts default: 0.86
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { key: 'wiringLosses', label: 'Wiring Losses', default: 0.98, description: '~2% DC wiring' },
                  { key: 'soilingLosses', label: 'Soiling Losses', default: 0.98, description: '~2% dust/dirt' },
                  { key: 'mismatchLosses', label: 'Mismatch Losses', default: 0.98, description: '~2% panel variation' },
                  { key: 'availabilityLosses', label: 'Availability', default: 0.97, description: '~3% downtime' },
                  { key: 'degradationLosses', label: 'Annual Degradation', default: 0.9985, description: '~0.15%/year' },
                ].map((item) => (
                  <div key={item.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {item.label}: {((config.subDerates?.[item.key] || item.default) * 100).toFixed(1)}%
                    </label>
                    <input
                      type="range"
                      value={(config.subDerates?.[item.key] || item.default) * 100}
                      onChange={(e) => {
                        const newSubDerates = { ...config.subDerates, [item.key]: parseFloat(e.target.value) / 100 };
                        handleChange('subDerates', newSubDerates);
                      }}
                      min={90}
                      max={100}
                      step={0.1}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                ))}
                <p className="text-xs text-gray-500 italic">
                  Combined: {(
                    Object.values(config.subDerates || {
                      wiringLosses: 0.98,
                      soilingLosses: 0.98,
                      mismatchLosses: 0.98,
                      availabilityLosses: 0.97,
                      degradationLosses: 0.9985,
                    }).reduce((acc, val) => acc * val, 1) * 100
                  ).toFixed(1)}%
                </p>
              </div>
            )}
          </div>

          {/* Info box */}
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-medium">About these settings</p>
            <p className="text-xs mt-1">
              These parameters control the physics engine. Default values are based on
              industry standards (NREL PVWatts, IEC 61215). Only adjust if you have
              specific panel or system specifications.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}