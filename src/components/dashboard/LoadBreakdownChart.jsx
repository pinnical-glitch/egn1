import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { theme } from '../../theme/tokens.js';

const PRIORITY_COLORS = {
  Critical: theme.colors.chart.critical,
  Important: theme.colors.chart.important,
  Optional: theme.colors.chart.optional,
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0];
  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
      <p className="text-sm font-medium text-gray-900 mb-1">{data.name}</p>
      <p className="text-sm" style={{ color: data.payload.fill }}>
        {data.value?.toFixed(0)} Wh/day ({((data.value / payload[0].payload.total) * 100).toFixed(1)}%)
      </p>
    </div>
  );
}

function CustomLegend({ payload }) {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-2">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function LoadBreakdownChart({ results }) {
  if (!results) return null;

  const { energyDemandByPriority, loadBreakdownByCategory } = results;

  // Prepare data for priority breakdown pie chart
  const priorityData = Object.entries(energyDemandByPriority || {})
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name,
      value,
      fill: PRIORITY_COLORS[name],
    }));

  // Calculate total for percentage display
  const totalDemand = priorityData.reduce((sum, d) => sum + d.value, 0);
  priorityData.forEach(d => d.total = totalDemand);

  // Prepare data for category breakdown
  const categoryData = Object.entries(loadBreakdownByCategory || {})
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  const CATEGORY_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'
  ];

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Load Breakdown</h3>
        <p className="text-sm text-gray-600">
          Energy consumption by priority tier and appliance category.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">By Priority Tier</h4>
          <div className="h-56" role="img" aria-label="Pie chart showing energy consumption by priority tier: critical, important, and optional">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center text-sm text-gray-600">
            Total: {totalDemand.toFixed(0)} Wh/day
          </div>
        </div>

        {/* Category Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">By Category</h4>
          <div className="space-y-2">
            {categoryData.map((category, index) => {
              const percentage = (category.value / totalDemand) * 100;
              return (
                <div key={category.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{category.name}</span>
                    <span className="text-gray-600">
                      {category.value.toFixed(0)} Wh ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Priority Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Priority Summary</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          {Object.entries(energyDemandByPriority || {}).map(([priority, demand]) => (
            <div key={priority} className="text-center">
              <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-1 ${
                priority === 'Critical'
                  ? 'bg-red-100 text-red-800'
                  : priority === 'Important'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {priority}
              </div>
              <div className="font-medium text-gray-900">{demand.toFixed(0)} Wh</div>
              <div className="text-gray-500">
                {((demand / totalDemand) * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
