import { useState } from 'react';

export default function AssumptionsPanel({ results }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!results) return null;

  const { config: simConfig, tempDerate, tiltOrientationDerate, chemistry } = results;

  const assumptions = [
    {
      category: 'Solar Derating',
      items: [
        {
          label: 'System Derate Factor',
          value: '0.86 (PVWatts default)',
          description: 'Industry-standard NREL PVWatts default covering inverter losses, wiring, soiling, and module mismatch.',
        },
        {
          label: 'Temperature Derate',
          value: `${(tempDerate * 100).toFixed(1)}%`,
          description: 'Simplified model: panels lose ~0.4%/°C above 25°C cell temp. Cell temp approximated as ambient + 20°C.',
        },
        {
          label: 'Tilt/Orientation Derate',
          value: `${(tiltOrientationDerate * 100).toFixed(1)}%`,
          description: 'Lookup table based on NREL data. Optimal = south-facing at latitude tilt.',
        },
      ],
    },
    {
      category: 'Solar Resource',
      items: [
        {
          label: 'Peak Sun Hours (PSH)',
          value: `${simConfig.climateZone?.peakSunHours || 4.5} hours/day`,
          description: 'Equivalent hours of 1000W/m² irradiance. Standard solar industry metric, not daylight hours.',
        },
        {
          label: 'Solar Curve Model',
          value: 'Sine-squared (clear-sky)',
          description: 'Idealized clear-sky model. Real output depends on cloud cover and weather.',
        },
      ],
    },
    {
      category: 'Battery',
      items: [
        {
          label: 'Chemistry',
          value: chemistry?.name || 'LFP',
          description: 'Lithium Iron Phosphate (LFP) or Lead-Acid selected by user.',
        },
        {
          label: 'Round-Trip Efficiency',
          value: `${((simConfig.battery?.roundTripEfficiency || 0.95) * 100).toFixed(0)}%`,
          description: 'Applied entirely at charge step (standard convention). Represents charge + discharge losses.',
        },
        {
          label: 'Max Depth of Discharge',
          value: `${((simConfig.battery?.maxDoD || 0.92) * 100).toFixed(0)}%`,
          description: 'Battery cannot discharge below this floor. Lower values extend battery life.',
        },
      ],
    },
    {
      category: 'Load Profile',
      items: [
        {
          label: 'Load Distribution',
          value: 'Uniform across 24 hours',
          description: 'Simplified Phase 1 model. Real load profiles vary by time of day.',
        },
        {
          label: 'Concurrent Operation',
          value: 'All selected loads run simultaneously',
          description: 'Conservative assumption for worst-case scenario sizing.',
        },
      ],
    },
    {
      category: 'Degradation Estimate',
      items: [
        {
          label: 'Model Type',
          value: 'Simplified cycle-based',
          description: 'Not a full electrochemical aging model. Rough estimate for planning purposes.',
        },
        {
          label: 'Cycle Life Assumptions',
          value: `LFP: ~4,500 cycles at 80% DoD, Lead-Acid: ~400 cycles at 50% DoD`,
          description: 'Based on typical manufacturer specifications.',
        },
      ],
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
        aria-expanded={isExpanded}
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Assumptions & Simplifications</h3>
          <p className="text-sm text-gray-600">
            View all model assumptions, derating factors, and simplifications used in calculations.
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
          {assumptions.map((section) => (
            <div key={section.category}>
              <h4 className="text-sm font-medium text-gray-700 mb-2">{section.category}</h4>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div
                    key={item.label}
                    className="p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      <span className="text-sm text-gray-900 font-mono">{item.value}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

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
                Battery degradation estimates are rough projections, not warranty-grade predictions.
              </li>
              <li>
                This model does not account for inverter efficiency limits or peak power clipping.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
