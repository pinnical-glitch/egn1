import { useState, useMemo } from 'react';

/**
 * Cost-vs-Resilience Dashboard Component
 * 
 * Provides an interactive comparison of cost vs resilience tradeoffs
 * across different system sizes. Uses a scatter/quadrant chart to
 * visualize the relationship between cost and survival hours.
 * 
 * Features:
 * - Configurable cost parameters ($/W solar, $/kWh battery, BOS%)
 * - Preset system size comparisons
 * - Interactive scatter plot with quadrant analysis
 * - Cost-effectiveness metrics
 */

const PRESET_SYSTEMS = [
  {
    id: 'critical_minimal',
    name: 'Critical-Only Minimal',
    description: 'Essential loads only, minimal solar+battery',
    solarPanels: 5,
    batteryKwh: 5,
    color: '#ef4444',
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Good coverage for critical + important loads',
    solarPanels: 10,
    batteryKwh: 10,
    color: '#f59e0b',
  },
  {
    id: 'full_home',
    name: 'Full Home',
    description: 'Maximum coverage for all loads',
    solarPanels: 20,
    batteryKwh: 20,
    color: '#10b981',
  },
];

/**
 * Calculate system cost based on configuration
 */
function calculateSystemCost(solarPanels, panelWattage, batteryKwh, config) {
  const solarCostPerWatt = config.solarCostPerWatt || 2.75;
  const batteryCostPerKwh = config.batteryCostPerKwh || 900;
  const bosPercent = config.bosPercent || 17.5;
  
  const solarCapacityW = solarPanels * panelWattage;
  const solarCost = solarCapacityW * solarCostPerWatt;
  const batteryCost = batteryKwh * batteryCostPerKwh;
  const subtotal = solarCost + batteryCost;
  const bosCost = subtotal * (bosPercent / 100);
  
  return {
    solarCost,
    batteryCost,
    bosCost,
    totalCost: subtotal + bosCost,
  };
}

/**
 * Calculate resilience score from simulation results
 */
function calculateResilienceScore(results, blackoutHours) {
  if (!results) return { survivalHours: 0, coveragePercent: 0 };
  
  const survivalHours = results.hoursUntilDepletion || 0;
  const coveragePercent = Math.min(100, (survivalHours / blackoutHours) * 100);
  
  return {
    survivalHours,
    coveragePercent,
    totalEnergyDischarged: results.totalEnergyDischargedWh || 0,
  };
}

/**
 * Scatter/Quadrant Chart Component
 * 
 * Uses scatter plot to show cost vs resilience tradeoffs.
 * Quadrants indicate:
 * - Top-left: Low cost, low resilience (minimal)
 * - Top-right: Low cost, high resilience (optimal)
 * - Bottom-left: High cost, low resilience (avoid)
 * - Bottom-right: High cost, high resilience (premium)
 */
function ScatterChart({ data, width = 600, height = 350 }) {
  if (!data || data.length === 0) return null;
  
  const padding = { top: 30, right: 30, bottom: 50, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Find ranges
  const maxCost = Math.max(...data.map(d => d.cost)) * 1.1;
  const maxHours = Math.max(...data.map(d => d.survivalHours)) * 1.1;
  
  // Midpoints for quadrants (used for reference)
  // const midCost = maxCost / 2;
  // const midHours = maxHours / 2;
  
  // Scale functions
  const scaleX = (cost) => padding.left + (cost / maxCost) * chartWidth;
  const scaleY = (hours) => padding.top + chartHeight - (hours / maxHours) * chartHeight;
  
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Cost vs Resilience scatter plot">
      {/* Background quadrants */}
      <rect x={padding.left} y={padding.top} width={chartWidth / 2} height={chartHeight / 2} fill="#fef2f2" opacity={0.5} />
      <rect x={padding.left + chartWidth / 2} y={padding.top} width={chartWidth / 2} height={chartHeight / 2} fill="#f0fdf4" opacity={0.5} />
      <rect x={padding.left} y={padding.top + chartHeight / 2} width={chartWidth / 2} height={chartHeight / 2} fill="#fef2f2" opacity={0.3} />
      <rect x={padding.left + chartWidth / 2} y={padding.top + chartHeight / 2} width={chartWidth / 2} height={chartHeight / 2} fill="#eff6ff" opacity={0.5} />
      
      {/* Quadrant labels */}
      <text x={padding.left + chartWidth * 0.25} y={padding.top + 15} fontSize={10} fill="#9ca3af" textAnchor="middle">Low Cost / Low Resilience</text>
      <text x={padding.left + chartWidth * 0.75} y={padding.top + 15} fontSize={10} fill="#10b981" textAnchor="middle">Low Cost / High Resilience</text>
      <text x={padding.left + chartWidth * 0.25} y={padding.top + chartHeight - 5} fontSize={10} fill="#ef4444" textAnchor="middle">High Cost / Low Resilience</text>
      <text x={padding.left + chartWidth * 0.75} y={padding.top + chartHeight - 5} fontSize={10} fill="#3b82f6" textAnchor="middle">High Cost / High Resilience</text>
      
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
        <g key={`grid-${i}`}>
          <line x1={padding.left} y1={padding.top + pct * chartHeight} x2={padding.left + chartWidth} y2={padding.top + pct * chartHeight} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="4 4" />
          <line x1={padding.left + pct * chartWidth} y1={padding.top} x2={padding.left + pct * chartWidth} y2={padding.top + chartHeight} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="4 4" />
        </g>
      ))}
      
      {/* Axis labels */}
      <text x={width / 2} y={height - 8} fontSize={11} fill="#6b7280" textAnchor="middle">Total Cost ($)</text>
      <text x={15} y={height / 2} fontSize={11} fill="#6b7280" textAnchor="middle" transform={`rotate(-90, 15, ${height / 2})`}>Survival Hours</text>
      
      {/* Axis ticks */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
        <g key={`tick-${i}`}>
          <text x={padding.left + pct * chartWidth} y={padding.top + chartHeight + 18} fontSize={9} fill="#9ca3af" textAnchor="middle">
            ${Math.round(pct * maxCost / 1000)}k
          </text>
          <text x={padding.left - 8} y={padding.top + chartHeight - pct * chartHeight + 4} fontSize={9} fill="#9ca3af" textAnchor="end">
            {Math.round(pct * maxHours)}h
          </text>
        </g>
      ))}
      
      {/* Data points */}
      {data.map((point) => {
        const x = scaleX(point.cost);
        const y = scaleY(point.survivalHours);
        const isCustom = point.id === 'custom';
        
        return (
          <g key={point.id}>
            {/* Line to axis for custom config */}
            {isCustom && (
              <>
                <line x1={x} y1={y} x2={x} y2={padding.top + chartHeight} stroke={point.color} strokeWidth={1} strokeDasharray="4 4" opacity={0.5} />
                <line x1={padding.left} y1={y} x2={x} y2={y} stroke={point.color} strokeWidth={1} strokeDasharray="4 4" opacity={0.5} />
              </>
            )}
            
            {/* Point */}
            <circle
              cx={x}
              cy={y}
              r={isCustom ? 8 : 6}
              fill={point.color}
              stroke="white"
              strokeWidth={2}
            />
            
            {/* Label */}
            <text
              x={x}
              y={y - 12}
              fontSize={10}
              fill="#374151"
              textAnchor="middle"
              fontWeight={isCustom ? 'bold' : 'normal'}
            >
              {point.name}
            </text>
            
            {/* Cost label */}
            <text
              x={x}
              y={y + 16}
              fontSize={9}
              fill="#6b7280"
              textAnchor="middle"
            >
              ${(point.cost / 1000).toFixed(1)}k · {point.survivalHours.toFixed(0)}h
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Main CostVsResilience Component
 */
export default function CostVsResilience({ results, config }) {
  const [costConfig, setCostConfig] = useState({
    solarCostPerWatt: 2.75,
    batteryCostPerKwh: 900,
    bosPercent: 17.5,
  });
  
  const [selectedPreset, setSelectedPreset] = useState(null);
  
  // Calculate cost and resilience for custom config
  const customAnalysis = useMemo(() => {
    if (!results || !config) return null;
    
    const cost = calculateSystemCost(
      config.solar.panelCount,
      config.solar.panelWattageSTC,
      config.battery.capacityKwh,
      costConfig
    );
    
    const resilience = calculateResilienceScore(
      results.allLoads,
      config.home.blackoutHours
    );
    
    return {
      id: 'custom',
      name: 'Your Config',
      ...cost,
      ...resilience,
      color: '#3b82f6',
    };
  }, [results, config, costConfig]);
  
  // Calculate for presets
  const presetAnalyses = useMemo(() => {
    if (!config) return [];
    
    return PRESET_SYSTEMS.map(preset => {
      const cost = calculateSystemCost(
        preset.solarPanels,
        config.solar.panelWattageSTC,
        preset.batteryKwh,
        costConfig
      );
      
      // Quick simulation estimate (simplified for performance)
      // In production, you'd run actual simulations
      const survivalHoursEstimate = estimateSurvivalHours(
        preset.solarPanels,
        config.solar.panelWattageSTC,
        preset.batteryKwh,
        config
      );
      
      return {
        ...preset,
        ...cost,
        survivalHours: survivalHoursEstimate,
        coveragePercent: Math.min(100, (survivalHoursEstimate / config.home.blackoutHours) * 100),
      };
    });
  }, [config, costConfig]);
  
  // Combine all data for chart
  const chartData = useMemo(() => {
    const data = [...presetAnalyses];
    if (customAnalysis) {
      data.push(customAnalysis);
    }
    return data;
  }, [presetAnalyses, customAnalysis]);
  
  // Cost-effectiveness metric ($/survival hour)
  const costEffectiveness = useMemo(() => {
    if (!customAnalysis || customAnalysis.survivalHours === 0) return null;
    return customAnalysis.totalCost / customAnalysis.survivalHours;
  }, [customAnalysis]);
  
  if (!results || !config) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900">Cost vs Resilience</h3>
        <p className="text-sm text-gray-500 mt-2">Run a simulation first to see cost analysis.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Cost vs Resilience Analysis</h3>
        <p className="text-sm text-gray-600 mt-1">
          Compare system sizes and find the optimal balance of cost and backup duration.
        </p>
      </div>
      
      {/* Cost Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Solar Cost ($/W)
          </label>
          <input
            type="number"
            value={costConfig.solarCostPerWatt}
            onChange={(e) => setCostConfig(prev => ({ ...prev, solarCostPerWatt: parseFloat(e.target.value) || 2.75 }))}
            min={1.5}
            max={4}
            step={0.25}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">$2.50-3.00 typical residential</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Battery Cost ($/kWh)
          </label>
          <input
            type="number"
            value={costConfig.batteryCostPerKwh}
            onChange={(e) => setCostConfig(prev => ({ ...prev, batteryCostPerKwh: parseFloat(e.target.value) || 900 }))}
            min={500}
            max={1500}
            step={50}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">$800-1000/kWh for LFP</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            BOS Overhead (%)
          </label>
          <input
            type="number"
            value={costConfig.bosPercent}
            onChange={(e) => setCostConfig(prev => ({ ...prev, bosPercent: parseFloat(e.target.value) || 17.5 }))}
            min={10}
            max={25}
            step={2.5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Inverter, wiring, permits (~15-20%)</p>
        </div>
      </div>
      
      {/* Chart */}
      <div className="border border-gray-200 rounded-lg p-4">
        <ScatterChart data={chartData} />
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {customAnalysis && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-900">Your Configuration</h4>
            <div className="mt-2 space-y-1 text-sm">
              <p>Total Cost: <span className="font-mono font-bold">${customAnalysis.totalCost.toLocaleString()}</span></p>
              <p>Survival: <span className="font-mono font-bold">{customAnalysis.survivalHours.toFixed(1)} hours</span></p>
              <p>Coverage: <span className="font-mono font-bold">{customAnalysis.coveragePercent.toFixed(0)}%</span></p>
            </div>
          </div>
        )}
        
        {costEffectiveness && (
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-green-900">Cost Effectiveness</h4>
            <div className="mt-2 space-y-1 text-sm">
              <p className="text-2xl font-bold text-green-700">${costEffectiveness.toFixed(0)}</p>
              <p>per survival hour</p>
            </div>
          </div>
        )}
        
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <h4 className="font-semibold text-amber-900">Best Value</h4>
          <div className="mt-2 space-y-1 text-sm">
            {presetAnalyses.length > 0 && (
              <>
                <p>{presetAnalyses.reduce((best, p) => (p.totalCost / Math.max(1, p.survivalHours)) < (best.totalCost / Math.max(1, best.survivalHours)) ? p : best, presetAnalyses[0]).name}</p>
                <p className="font-mono">${(presetAnalyses.reduce((best, p) => (p.totalCost / Math.max(1, p.survivalHours)) < (best.totalCost / Math.max(1, best.survivalHours)) ? p : best, presetAnalyses[0]).totalCost / presetAnalyses.reduce((best, p) => (p.totalCost / Math.max(1, p.survivalHours)) < (best.totalCost / Math.max(1, best.survivalHours)) ? p : best, presetAnalyses[0]).survivalHours).toFixed(0)}/hr</p>
              </>
            )}
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h4 className="font-semibold text-purple-900">System Specs</h4>
          <div className="mt-2 space-y-1 text-sm">
            <p>{config.solar.panelCount} × {config.solar.panelWattageSTC}W panels</p>
            <p>{config.battery.capacityKwh} kWh battery</p>
            <p>{config.loads.appliances.length} appliances</p>
          </div>
        </div>
      </div>
      
      {/* Preset Comparison Table */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Preset System Comparison</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">System</th>
                <th className="px-4 py-2 text-right">Solar</th>
                <th className="px-4 py-2 text-right">Battery</th>
                <th className="px-4 py-2 text-right">Total Cost</th>
                <th className="px-4 py-2 text-right">Survival</th>
                <th className="px-4 py-2 text-right">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {presetAnalyses.map((preset) => (
                <tr
                  key={preset.id}
                  className={`border-t border-gray-200 ${selectedPreset === preset.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  onClick={() => setSelectedPreset(preset.id === selectedPreset ? null : preset.id)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.color }} />
                      <span className="font-medium">{preset.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 ml-5">{preset.description}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{preset.solarPanels} panels</td>
                  <td className="px-4 py-3 text-right font-mono">{preset.batteryKwh} kWh</td>
                  <td className="px-4 py-3 text-right font-mono">${preset.totalCost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono">{preset.survivalHours.toFixed(0)}h</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      preset.coveragePercent >= 90 ? 'bg-green-100 text-green-800' :
                      preset.coveragePercent >= 50 ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {preset.coveragePercent.toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
              {customAnalysis && (
                <tr className="border-t-2 border-blue-300 bg-blue-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: customAnalysis.color }} />
                      <span className="font-bold text-blue-900">{customAnalysis.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{config.solar.panelCount} panels</td>
                  <td className="px-4 py-3 text-right font-mono">{config.battery.capacityKwh} kWh</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">${customAnalysis.totalCost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{customAnalysis.survivalHours.toFixed(1)}h</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      customAnalysis.coveragePercent >= 90 ? 'bg-green-200 text-green-900' :
                      customAnalysis.coveragePercent >= 50 ? 'bg-amber-200 text-amber-900' :
                      'bg-red-200 text-red-900'
                    }`}>
                      {customAnalysis.coveragePercent.toFixed(0)}%
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Disclaimer */}
      <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-800">
        <p className="font-medium">Note:</p>
        <p className="text-xs mt-1">
          Costs are estimates based on national averages. Actual costs vary by region, installer,
          and system complexity. Consult certified installers for accurate quotes.
        </p>
      </div>
    </div>
  );
}

/**
 * Simplified survival hours estimation for presets
 * 
 * Uses a quick approximation based on:
 * - Battery capacity vs load
 * - Solar production estimate
 * - Typical depletion patterns
 */
function estimateSurvivalHours(solarPanels, panelWattage, batteryKwh, config) {
  // Get average load from appliances
  const avgLoadW = config.loads.appliances.reduce((sum, a) => sum + a.ratedWatts, 0) / 24;
  if (avgLoadW <= 0) return 0;
  
  // Estimate solar production (simplified)
  const solarProductionWh = solarPanels * panelWattage * 4.5 * 0.86; // PSH × derate
  
  // Estimate battery-only survival
  const batterySurvivalHours = (batteryKwh * 1000) / avgLoadW;
  
  // Estimate with solar contribution (daytime charging)
  const solarContributionHours = solarProductionWh / avgLoadW;
  
  // Total survival (battery + partial solar recharge)
  const totalSurvival = batterySurvivalHours + solarContributionHours * 0.3; // 30% recharge factor
  
  return Math.min(totalSurvival, 200); // Cap at 200 hours for practical purposes
}