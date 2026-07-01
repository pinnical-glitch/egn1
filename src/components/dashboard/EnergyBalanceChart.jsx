import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { theme } from '../../theme/tokens.js';

function formatHour(hour) {
  const h = hour % 24;
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  if (h < 12) return `${h}am`;
  return `${h - 12}pm`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null;

  const solar = payload.find(p => p.dataKey === 'solar')?.value || 0;
  const load = payload.find(p => p.dataKey === 'load')?.value || 0;
  const net = solar - load;

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
      <p className="text-sm font-medium text-gray-900 mb-1">
        Hour {label} ({formatHour(label)})
      </p>
      <p className="text-sm text-yellow-600">Solar: {solar.toFixed(0)} W</p>
      <p className="text-sm text-red-600">Load: {load.toFixed(0)} W</p>
      <p className={`text-sm font-medium ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        Net: {net >= 0 ? '+' : ''}{net.toFixed(0)} W
      </p>
    </div>
  );
}

export default function EnergyBalanceChart({ results }) {
  if (!results) return null;

  const { hourlySolarOutput, config: simConfig, dailyEnergyDemand } = results;
  const hourlyLoadDemand = new Array(24).fill(dailyEnergyDemand / 24);

  // Extend to show first 72 hours if blackout > 24h
  const totalHours = Math.min(simConfig.blackoutHours || 72, 72);
  const extendedData = [];
  
  for (let hour = 0; hour < totalHours; hour++) {
    const hourOfDay = hour % 24;
    extendedData.push({
      hour,
      solar: hourlySolarOutput[hourOfDay] || 0,
      load: hourlyLoadDemand[hourOfDay] || 0,
      net: (hourlySolarOutput[hourOfDay] || 0) - hourlyLoadDemand[hourOfDay],
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Hourly Energy Balance</h3>
        <p className="text-sm text-gray-600">
          Solar generation vs. load consumption. Green areas show surplus (charging), 
          red areas show deficit (discharging battery).
        </p>
      </div>

      <div className="h-80" role="img" aria-label="Hourly energy balance chart showing solar generation versus load consumption">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={extendedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.colors.chart.solar} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={theme.colors.chart.solar} stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.colors.chart.load} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={theme.colors.chart.load} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="hour"
              tickFormatter={formatHour}
              tick={{ fontSize: 12 }}
              interval={Math.floor(totalHours / 12)}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} />
            <Area
              type="monotone"
              dataKey="solar"
              name="Solar Generation"
              stroke={theme.colors.chart.solar}
              fill="url(#solarGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="load"
              name="Load Consumption"
              stroke={theme.colors.chart.load}
              fill="url(#loadGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="text-gray-600">Daily Solar</div>
          <div className="font-medium text-yellow-600">
            {results.dailySolarEnergy?.toFixed(0)} Wh
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-600">Daily Load</div>
          <div className="font-medium text-red-600">
            {dailyEnergyDemand?.toFixed(0)} Wh
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-600">Daily Balance</div>
          <div className={`font-medium ${
            (results.dailySolarEnergy - dailyEnergyDemand) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {((results.dailySolarEnergy - dailyEnergyDemand) >= 0 ? '+' : '')}
            {(results.dailySolarEnergy - dailyEnergyDemand)?.toFixed(0)} Wh
          </div>
        </div>
      </div>
    </div>
  );
}
