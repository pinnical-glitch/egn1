import {
  LineChart,
  Line,
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

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
      <p className="text-sm font-medium text-gray-900 mb-1">
        Hour {label} ({formatHour(label)})
      </p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {entry.value?.toFixed(2)} kWh
        </p>
      ))}
    </div>
  );
}

export default function SocChart({ results, config }) {
  if (!results) return null;

  const { allLoads, criticalLoads, usableCapacityKwh, config: simConfig } = results;
  const dodFloor = usableCapacityKwh * (1 - (simConfig.battery?.maxDoD || 0.92));

  // Prepare chart data
  const chartData = allLoads.hourlySoc.map((soc, index) => ({
    hour: index,
    allLoads: soc,
    criticalLoads: criticalLoads?.hourlySoc[index] || soc,
    dodFloor: dodFloor,
  }));

  // Extend to show full blackout duration if > 24 hours
  const extendedData = [];
  const totalHours = simConfig.blackoutHours || 72;
  
  for (let hour = 0; hour < totalHours; hour++) {
    const hourOfDay = hour % 24;
    extendedData.push({
      hour,
      allLoads: allLoads.hourlySoc[hourOfDay] || 0,
      criticalLoads: criticalLoads?.hourlySoc[hourOfDay] || 0,
      dodFloor,
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Battery State of Charge</h3>
        <p className="text-sm text-gray-600">
          SOC over {totalHours}-hour blackout simulation. Red line shows maximum depth of discharge floor.
        </p>
      </div>

      <div className="h-80" role="img" aria-label="Battery state of charge chart showing SOC over blackout duration for all loads and critical loads">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={extendedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="hour"
              tickFormatter={formatHour}
              tick={{ fontSize: 12 }}
              interval={Math.floor(totalHours / 12)}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value.toFixed(1)}`}
              domain={[0, usableCapacityKwh]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine
              y={dodFloor}
              stroke={theme.colors.danger}
              strokeDasharray="5 5"
              label={{ value: `DoD Floor (${dodFloor.toFixed(1)} kWh)`, position: 'right' }}
            />
            <Line
              type="monotone"
              dataKey="allLoads"
              name="All Loads"
              stroke={theme.colors.chart.load}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="criticalLoads"
              name="Critical Loads Only"
              stroke={theme.colors.chart.critical}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-red-500" />
          <span className="text-gray-600">All Loads</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-red-700 border-dashed" style={{ borderTop: '2px dashed' }} />
          <span className="text-gray-600">Critical Loads Only</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-red-500" style={{ borderTop: '2px dashed' }} />
          <span className="text-gray-600">Max DoD Floor</span>
        </div>
      </div>
    </div>
  );
}
