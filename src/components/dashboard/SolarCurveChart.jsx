import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
  if (!active || !payload || !payload[0]) return null;

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
      <p className="text-sm font-medium text-gray-900 mb-1">
        {formatHour(label)}
      </p>
      <p className="text-sm text-yellow-600">
        Solar Output: {payload[0].value?.toFixed(0)} W
      </p>
    </div>
  );
}

export default function SolarCurveChart({ results }) {
  if (!results) return null;

  const { hourlySolarOutput, effectiveArrayPower } = results;

  // Prepare 24-hour data for a single representative day
  const chartData = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    output: hourlySolarOutput[hour] || 0,
  }));

  const maxOutput = Math.max(...chartData.map(d => d.output));

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Solar Output Curve</h3>
        <p className="text-sm text-gray-600">
          Idealized clear-sky solar production across a representative day. 
          Actual output varies with cloud cover and weather conditions.
        </p>
      </div>

      <div className="h-64" role="img" aria-label="Solar output curve chart showing 24-hour clear-sky production profile">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="solarCurveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.colors.chart.solar} stopOpacity={0.9}/>
                <stop offset="95%" stopColor={theme.colors.chart.solar} stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="hour"
              tickFormatter={formatHour}
              tick={{ fontSize: 12 }}
              interval={3}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}`}
              domain={[0, maxOutput * 1.1]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="output"
              stroke={theme.colors.chart.solar}
              fill="url(#solarCurveGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Peak Output:</span>{' '}
          <span className="font-medium text-yellow-600">
            {maxOutput.toFixed(0)} W
          </span>
        </div>
        <div>
          <span className="text-gray-600">Daily Total:</span>{' '}
          <span className="font-medium text-yellow-600">
            {results.dailySolarEnergy?.toFixed(0)} Wh
          </span>
        </div>
      </div>

      <div className="mt-3 p-2 bg-amber-50 rounded text-xs text-amber-800">
        <strong>Note:</strong> This is a sine-squared curve representing ideal clear-sky conditions. 
        Real output depends on cloud cover, temperature, and seasonal variation.
      </div>
    </div>
  );
}
