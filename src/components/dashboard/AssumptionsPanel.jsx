import { useState } from 'react';

/**
 * Assumptions & Methodology Panel - Phase 2 Enhanced
 * 
 * Expanded methodology appendix documenting:
 * - Every formula added in Phase 2
 * - Every default constant and its typical real-world range
 * - Sources/rationale in plain language
 * - Progressive disclosure with expandable sub-sections
 */

const FORMULA_SECTIONS = [
  {
    id: 'solar',
    title: 'Solar Irradiance & Derating',
    icon: '☀️',
    formulas: [
      {
        name: 'Cell Temperature Model (NOCT)',
        formula: 'T_cell = T_ambient + (NOCT - 20) / 800 × Irradiance_W_m2',
        description: 'Calculates actual cell temperature using Nominal Operating Cell Temperature (NOCT). Higher irradiance and ambient temperature increase cell temperature, reducing output.',
        defaults: [
          { param: 'NOCT', value: '45°C', range: '40-50°C typical', source: 'IEC 61215 standard, manufacturer datasheets' },
          { param: 'Irradiance', value: '800 W/m²', range: 'Standard test condition', source: 'STC (Standard Test Conditions)' },
        ],
      },
      {
        name: 'Temperature Power Derate',
        formula: 'P_derated = P_STC × [1 + temp_coeff × (T_cell - 25)]',
        description: 'Silicon solar cells lose power as temperature rises. The temperature coefficient quantifies this loss.',
        defaults: [
          { param: 'temp_coeff', value: '-0.0038/°C', range: '-0.003 to -0.005/°C', source: 'Typical monocrystalline silicon datasheet' },
          { param: 'Reference temp', value: '25°C', range: 'STC reference', source: 'IEC 61215' },
        ],
      },
      {
        name: 'Seasonal PSH Adjustment',
        formula: 'PSH_adjusted = PSH_base × seasonal_multiplier',
        description: 'Peak Sun Hours vary by season. Multipliers based on typical temperate zone variation.',
        defaults: [
          { param: 'Winter', value: '0.65', range: '0.55-0.75', source: 'NREL seasonal data' },
          { param: 'Spring/Fall', value: '0.80-0.85', range: '0.75-0.90', source: 'NREL seasonal data' },
          { param: 'Summer', value: '1.00', range: 'Peak baseline', source: 'NREL seasonal data' },
        ],
      },
      {
        name: 'Cloud Attenuation (Stochastic)',
        formula: 'Irradiance_actual = I_clearsky × (1 - Beta(α, β))',
        description: 'Daily cloud attenuation drawn from Beta distribution. Different climates have different distribution parameters.',
        defaults: [
          { param: 'Clear scenario', value: 'α=2, β=8', range: '~20% mean attenuation', source: 'Sunny desert-like conditions' },
          { param: 'Typical scenario', value: 'α=3, β=6', range: '~33% mean attenuation', source: 'Average US conditions' },
          { param: 'Poor scenario', value: 'α=3, β=3', range: '~50% mean attenuation', source: 'Cloudy Pacific NW-like' },
        ],
      },
      {
        name: 'Inverter Efficiency',
        formula: 'P_AC = P_DC × η_inverter',
        description: 'DC to AC conversion loss. Modern string/hybrid inverters achieve 95-98% efficiency.',
        defaults: [
          { param: 'η_inverter', value: '0.95', range: '0.85-0.98', source: 'Modern string inverter datasheets' },
        ],
      },
      {
        name: 'Sub-Derates (Named Components)',
        formula: 'P_effective = P_STC × T_derate × Tilt_derate × ∏(sub_derates)',
        description: 'NREL PVWatts 0.86 blanket derate decomposed into named, adjustable components.',
        defaults: [
          { param: 'Wiring losses', value: '0.98', range: '0.97-0.99', source: 'NREL PVWatts documentation' },
          { param: 'Soiling losses', value: '0.98', range: '0.95-0.99', source: 'Climate-dependent' },
          { param: 'Mismatch losses', value: '0.98', range: '0.97-0.99', source: 'Panel manufacturing variation' },
          { param: 'Availability', value: '0.97', range: '0.95-0.99', source: 'Downtime for maintenance' },
          { param: 'Annual degradation', value: '0.9985', range: '0.997-0.999', source: '~0.15%/year panel aging' },
        ],
      },
    ],
  },
  {
    id: 'battery',
    title: 'Battery Physics',
    icon: '🔋',
    formulas: [
      {
        name: "Peukert's Law",
        formula: 'C_actual = C_rated × (I_rated / I_actual)^(k-1)',
        description: 'Real batteries deliver less usable capacity at higher discharge rates. Effect is minor for LFP (k=1.05) but significant for lead-acid (k=1.25).',
        defaults: [
          { param: 'k (LFP)', value: '1.05', range: '1.03-1.08', source: 'LFP manufacturer data, Battery University' },
          { param: 'k (Lead-acid)', value: '1.25', range: '1.15-1.35', source: "Peukert's original paper (1897)" },
          { param: 'Reference rate', value: 'C/20', range: '20-hour discharge rate', source: 'Industry standard reference' },
        ],
      },
      {
        name: 'C-Rate Limits',
        formula: 'P_max = C_rate × Capacity_kWh × 1000',
        description: 'Maximum charge/discharge power limited by battery chemistry to protect cell life.',
        defaults: [
          { param: 'Charge rate (LFP)', value: '0.5C', range: '0.5-1.0C', source: 'LFP BMS specifications' },
          { param: 'Discharge rate (LFP)', value: '0.5C', range: '0.5-1.0C', source: 'LFP BMS specifications' },
          { param: 'Charge rate (Lead-acid)', value: '0.2C', range: '0.1-0.3C', source: 'Conservative for plate life' },
          { param: 'Discharge rate (Lead-acid)', value: '0.2C', range: '0.1-0.3C', source: 'Conservative for plate life' },
        ],
      },
      {
        name: 'Temperature Capacity Derate',
        formula: 'C_actual = C_25°C × [1 - slope × max(0, 25 - T_ambient)]',
        description: 'Battery capacity decreases linearly at low temperatures. More pronounced for lead-acid.',
        defaults: [
          { param: 'Slope (LFP)', value: '0.008/°C', range: '0.006-0.010/°C', source: 'Battery University, LFP datasheets' },
          { param: 'Slope (Lead-acid)', value: '0.012/°C', range: '0.008-0.015/°C', source: 'Battery University, lead-acid datasheets' },
          { param: 'Minimum capacity', value: '50%', range: 'Floor at extreme cold', source: 'Practical limit' },
        ],
      },
      {
        name: 'Calendar Aging',
        formula: 'Capacity_retention = 1 - (fade_rate × years)',
        description: 'Batteries lose capacity even when idle due to chemical degradation.',
        defaults: [
          { param: 'Fade rate (LFP)', value: '2%/year', range: '1-3%/year', source: 'LFP cycle life data' },
          { param: 'Fade rate (Lead-acid)', value: '5%/year', range: '3-7%/year', source: 'Lead-acid cycle life data' },
        ],
      },
      {
        name: 'Cycle + Calendar Combined',
        formula: 'Retention = (1 - cycle_fade) × (1 - calendar_fade)',
        description: 'Combined degradation model: multiplicative combination of cycle-based and calendar aging.',
        defaults: [
          { param: 'Model', value: 'Multiplicative', range: 'Conservative approach', source: 'Standard battery engineering' },
        ],
      },
    ],
  },
  {
    id: 'load',
    title: 'Load Profile',
    icon: '⚡',
    formulas: [
      {
        name: 'Load Distribution',
        formula: 'Hourly_load = Daily_demand / 24',
        description: 'Simplified uniform load distribution. Real profiles vary by time of day and appliance duty cycles.',
        defaults: [
          { param: 'Distribution', value: 'Uniform', range: 'Conservative for worst-case', source: 'Phase 1 simplification' },
        ],
      },
      {
        name: 'Priority Filtering',
        formula: 'Critical_only = Σ(Critical appliances)',
        description: 'Separate simulation for critical-only loads to show minimum guaranteed backup duration.',
        defaults: [
          { param: 'Priority levels', value: 'Critical/Important/Optional', range: 'User-selectable', source: 'Standard resilience planning' },
        ],
      },
    ],
  },
  {
    id: 'degradation',
    title: 'Degradation Model',
    icon: '📉',
    formulas: [
      {
        name: 'Cycle Life Estimation',
        formula: 'Life = f(DoD) interpolated between 50% and 80% DoD values',
        description: 'Battery cycle life depends on depth of discharge. Deeper cycles reduce total cycle count.',
        defaults: [
          { param: 'LFP @ 80% DoD', value: '4,500 cycles', range: '3,000-6,000', source: 'LFP manufacturer specs' },
          { param: 'LFP @ 50% DoD', value: '6,000 cycles', range: '4,000-8,000', source: 'LFP manufacturer specs' },
          { param: 'Lead-acid @ 50% DoD', value: '400 cycles', range: '200-600', source: 'Lead-acid manufacturer specs' },
        ],
      },
      {
        name: 'Yearly Capacity Projection',
        formula: 'Capacity_year = Capacity_year-1 × (1 - cycle_fade) × (1 - calendar_fade)',
        description: 'Year-by-year capacity projection combining both cycle-based and calendar aging.',
        defaults: [
          { param: 'Projection period', value: '10 years', range: '5-15 years', source: 'Typical ownership period' },
        ],
      },
    ],
  },
];

export default function AssumptionsPanel({ results }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  if (!results) return null;

  const { 
    chemistry,
    adjustedPSH,
    cloudScenario,
    season,
    batteryPhysics,
    degradation,
  } = results;

  const toggleSection = (id) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
        aria-expanded={isExpanded}
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Assumptions & Methodology</h3>
          <p className="text-sm text-gray-600">
            Complete documentation of formulas, constants, and sources used in calculations.
          </p>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Active Configuration Summary */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Current Simulation Configuration</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Season:</span>
                <span className="ml-2 font-medium text-blue-900 capitalize">{season || 'Summer'}</span>
              </div>
              <div>
                <span className="text-blue-700">Weather:</span>
                <span className="ml-2 font-medium text-blue-900 capitalize">{cloudScenario || 'Typical'}</span>
              </div>
              <div>
                <span className="text-blue-700">Adjusted PSH:</span>
                <span className="ml-2 font-medium text-blue-900">{adjustedPSH?.toFixed(1) || 'N/A'} hrs</span>
              </div>
              <div>
                <span className="text-blue-700">Battery:</span>
                <span className="ml-2 font-medium text-blue-900">{chemistry?.name || 'LFP'}</span>
              </div>
            </div>
            {batteryPhysics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-2">
                <div>
                  <span className="text-blue-700">Temp Derate:</span>
                  <span className="ml-2 font-medium text-blue-900">{(batteryPhysics.tempDerate * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-blue-700">Effective Capacity:</span>
                  <span className="ml-2 font-medium text-blue-900">{batteryPhysics.effectiveCapacityKwh?.toFixed(1)} kWh</span>
                </div>
                <div>
                  <span className="text-blue-700">Max Charge:</span>
                  <span className="ml-2 font-medium text-blue-900">{batteryPhysics.maxChargeW?.toFixed(0) || 'N/A'} W</span>
                </div>
                <div>
                  <span className="text-blue-700">Max Discharge:</span>
                  <span className="ml-2 font-medium text-blue-900">{batteryPhysics.maxDischargeW?.toFixed(0) || 'N/A'} W</span>
                </div>
              </div>
            )}
          </div>

          {/* Formula Documentation Sections */}
          {FORMULA_SECTIONS.map((section) => (
            <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition-colors"
                aria-expanded={expandedSections[section.id]}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{section.icon}</span>
                  <span className="font-medium text-gray-900">{section.title}</span>
                  <span className="text-xs text-gray-500">({section.formulas.length} formulas)</span>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                    expandedSections[section.id] ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {expandedSections[section.id] && (
                <div className="px-4 py-3 space-y-4">
                  {section.formulas.map((formula) => (
                    <div key={formula.name} className="bg-white border border-gray-100 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">{formula.name}</h5>
                      
                      {/* Formula display */}
                      <div className="bg-gray-50 rounded p-3 mb-3 font-mono text-sm text-gray-800 overflow-x-auto">
                        {formula.formula}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{formula.description}</p>
                      
                      {/* Default values table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="px-3 py-2 text-left">Parameter</th>
                              <th className="px-3 py-2 text-left">Default</th>
                              <th className="px-3 py-2 text-left">Typical Range</th>
                              <th className="px-3 py-2 text-left">Source</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formula.defaults.map((d, i) => (
                              <tr key={i} className="border-t border-gray-200">
                                <td className="px-3 py-2 font-medium text-gray-700">{d.param}</td>
                                <td className="px-3 py-2 font-mono text-gray-900">{d.value}</td>
                                <td className="px-3 py-2 text-gray-600">{d.range}</td>
                                <td className="px-3 py-2 text-gray-500 text-xs">{d.source}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Degradation Summary */}
          {degradation && (
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="text-sm font-medium text-purple-900 mb-2">Battery Life Projection</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-purple-700">Cycles/Event:</span>
                  <span className="ml-2 font-medium text-purple-900">{degradation.cyclesPerEvent?.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-purple-700">Cycle Life:</span>
                  <span className="ml-2 font-medium text-purple-900">{degradation.estimatedCycleLife?.toLocaleString()} cycles</span>
                </div>
                <div>
                  <span className="text-purple-700">Year at 80%:</span>
                  <span className="ml-2 font-medium text-purple-900">Year {degradation.yearAt80Capacity}</span>
                </div>
                <div>
                  <span className="text-purple-700">Year at 50%:</span>
                  <span className="ml-2 font-medium text-purple-900">Year {degradation.yearAt50Capacity}</span>
                </div>
              </div>
              {degradation.yearlyProjection && (
                <div className="mt-3">
                  <p className="text-xs text-purple-700 mb-1">Capacity projection (10 years):</p>
                  <div className="flex gap-1 items-end h-16">
                    {degradation.yearlyProjection.slice(0, 11).map((point, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-purple-400 rounded-t"
                        style={{ height: `${point.capacityRetention * 100}%` }}
                        title={`Year ${point.year}: ${(point.capacityRetention * 100).toFixed(0)}%`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1 text-[8px] text-purple-600 mt-1">
                    {degradation.yearlyProjection.slice(0, 11).map((_, i) => (
                      <div key={i} className="flex-1 text-center">{i}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Important Notes */}
          <div className="p-4 bg-amber-50 rounded-lg">
            <h4 className="text-sm font-medium text-amber-900 mb-2">Important Notes</h4>
            <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
              <li>
                All calculations are estimates for planning purposes, not engineering-grade predictions.
              </li>
              <li>
                Actual performance depends on weather, usage patterns, and system maintenance.
              </li>
              <li>
                Battery degradation estimates combine simplified cycle and calendar aging models.
              </li>
              <li>
                Consult a certified installer for actual system design and performance guarantees.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}