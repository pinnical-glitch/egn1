import { useState } from 'react';

/**
 * Advanced Physics Form - Phase 2 Enhanced
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

const BATTERY_CHEMISTRY_INFO = {
  lfp: {
    name: 'Lithium (LFP)',
    peukertDefault: 1.05,
    chargeRateDefault: 0.5,
    dischargeRateDefault: 0.5,
    calendarFadeDefault: 2,
    tempSlopeDefault: 0.8,
  },
  lead_acid: {
    name: 'Lead-Acid',
    peukertDefault: 1.25,
    chargeRateDefault: 0.2,
    dischargeRateDefault: 0.2,
    calendarFadeDefault: 5,
    tempSlopeDefault: 1.2,
  },
};

export default function AdvancedPhysicsForm({ config, onChange, batteryChemistry = 'lfp' }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('solar');

  const handleChange = (key, value) => {
    onChange({ ...config, [key]: value });
  };

  const chemistryInfo = BATTERY_CHEMISTRY_INFO[batteryChemistry] || BATTERY_CHEMISTRY_INFO.lfp;

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
          {/* Tab navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('solar')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'solar'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Solar Physics
            </button>
            <button
              onClick={() => setActiveTab('battery')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'battery'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Battery Physics
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'system'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              System Losses
            </button>
          </div>

          {/* Solar Physics Tab */}
          {activeTab === 'solar' && (
            <div className="space-y-4">
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

              <div>
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
          )}

          {/* Battery Physics Tab */}
          {activeTab === 'battery' && (
            <div className="space-y-4">
              {/* Peukert's Law */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="applyPeukert"
                    checked={config.applyPeukert !== false}
                    onChange={(e) => handleChange('applyPeukert', e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor="applyPeukert" className="text-sm font-medium text-gray-700">
                    Apply Peukert's Law
                  </label>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Accounts for reduced capacity at high discharge rates
                </p>
                
                {config.applyPeukert !== false && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Peukert Exponent: {(config.peukertExponent || chemistryInfo.peukertDefault).toFixed(2)}
                    </label>
                    <input
                      type="range"
                      value={(config.peukertExponent || chemistryInfo.peukertDefault) * 100}
                      onChange={(e) => handleChange('peukertExponent', parseFloat(e.target.value) / 100)}
                      min={100}
                      max={150}
                      step={1}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500">
                      <span>1.00 (ideal)</span>
                      <span>1.50 (high rate loss)</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {batteryChemistry === 'lfp' ? 'LFP default: 1.05 (near-ideal)' : 'Lead-acid default: 1.25 (significant rate loss)'}
                    </p>
                  </div>
                )}
              </div>

              {/* C-Rate Limits */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="applyCRateLimits"
                    checked={config.applyCRateLimits !== false}
                    onChange={(e) => handleChange('applyCRateLimits', e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor="applyCRateLimits" className="text-sm font-medium text-gray-700">
                    Apply C-Rate Limits
                  </label>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Maximum charge/discharge rate relative to capacity
                </p>
                
                {config.applyCRateLimits !== false && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Charge Rate: {(config.chargeRateLimit || chemistryInfo.chargeRateDefault).toFixed(1)}C
                      </label>
                      <input
                        type="range"
                        value={(config.chargeRateLimit || chemistryInfo.chargeRateDefault) * 100}
                        onChange={(e) => handleChange('chargeRateLimit', parseFloat(e.target.value) / 100)}
                        min={10}
                        max={100}
                        step={5}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <p className="text-xs text-gray-500">
                        {batteryChemistry === 'lfp' ? 'LFP default: 0.5C' : 'Lead-acid default: 0.2C'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Discharge Rate: {(config.dischargeRateLimit || chemistryInfo.dischargeRateDefault).toFixed(1)}C
                      </label>
                      <input
                        type="range"
                        value={(config.dischargeRateLimit || chemistryInfo.dischargeRateDefault) * 100}
                        onChange={(e) => handleChange('dischargeRateLimit', parseFloat(e.target.value) / 100)}
                        min={10}
                        max={100}
                        step={5}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <p className="text-xs text-gray-500">
                        {batteryChemistry === 'lfp' ? 'LFP default: 0.5C' : 'Lead-acid default: 0.2C'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Temperature Effects */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="applyTempDerate"
                    checked={config.applyTempDerate !== false}
                    onChange={(e) => handleChange('applyTempDerate', e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor="applyTempDerate" className="text-sm font-medium text-gray-700">
                    Apply Temperature Derating
                  </label>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Battery capacity decreases in cold weather
                </p>
                
                {config.applyTempDerate !== false && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ambient Temp (°C)
                      </label>
                      <input
                        type="number"
                        value={config.ambientTempC || 25}
                        onChange={(e) => handleChange('ambientTempC', parseFloat(e.target.value) || 25)}
                        min={-20}
                        max={50}
                        step={1}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        From climate zone or manual override
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Temp Slope (%/°C)
                      </label>
                      <input
                        type="number"
                        value={config.batteryTempDerateSlope ? (config.batteryTempDerateSlope * 100).toFixed(1) : chemistryInfo.tempSlopeDefault.toFixed(1)}
                        onChange={(e) => handleChange('batteryTempDerateSlope', parseFloat(e.target.value) / 100 || chemistryInfo.tempSlopeDefault / 100)}
                        min={0}
                        max={3}
                        step={0.1}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {batteryChemistry === 'lfp' ? 'LFP: ~0.8%/°C' : 'Lead-acid: ~1.2%/°C'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* System Losses Tab */}
          {activeTab === 'system' && (
            <div className="space-y-4">
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
          )}

          {/* Info box */}
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-medium">About these settings</p>
            <p className="text-xs mt-1">
              These parameters control the physics engine. Default values are based on
              industry standards (NREL PVWatts, IEC 61215, Peukert's Law). Only adjust
              if you have specific panel or system specifications.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}