import { theme } from '../../theme/tokens.js';

const scorecards = [
  {
    id: 'totalLoad',
    label: 'Total Connected Load',
    unit: 'W',
    color: 'blue',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    id: 'peakLoad',
    label: 'Peak Load',
    unit: 'W',
    color: 'amber',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
      </svg>
    ),
  },
  {
    id: 'dailyDemand',
    label: 'Daily Energy Demand',
    unit: 'Wh',
    color: 'red',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
      </svg>
    ),
  },
  {
    id: 'dailySolar',
    label: 'Daily Solar Generation',
    unit: 'Wh',
    color: 'yellow',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
  },
  {
    id: 'depletionAll',
    label: 'Hours Until Depletion (All Loads)',
    unit: 'hrs',
    color: 'orange',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'depletionCritical',
    label: 'Hours Until Depletion (Critical Only)',
    unit: 'hrs',
    color: 'green',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
];

function formatValue(value, unit) {
  if (value === null || value === undefined) return '—';
  
  if (unit === 'hrs') {
    if (value >= 999) return '999+';
    return value.toFixed(1);
  }
  
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  
  return value.toLocaleString();
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  yellow: 'bg-yellow-50 text-yellow-700',
  orange: 'bg-orange-50 text-orange-700',
  green: 'bg-green-50 text-green-700',
};

export default function ScorecardRow({ results }) {
  if (!results) return null;

  const values = {
    totalLoad: results.totalConnectedLoad,
    peakLoad: results.peakLoad,
    dailyDemand: results.dailyEnergyDemand,
    dailySolar: results.dailySolarEnergy,
    depletionAll: results.allLoads?.hoursUntilDepletion,
    depletionCritical: results.criticalLoads?.hoursUntilDepletion,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 animate-fade-in">
      {scorecards.map(card => (
        <div
          key={card.id}
          className="bg-white rounded-xl shadow-md border border-gray-100 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${colorClasses[card.color]}`}>
              {card.icon}
            </div>
            <span className="text-xs text-gray-500 line-clamp-2">{card.label}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 font-mono">
            {formatValue(values[card.id], card.unit)}
            <span className="text-sm font-normal text-gray-500 ml-1">{card.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
