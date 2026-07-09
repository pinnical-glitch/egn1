const fv = (v, u, compact = true) => v == null ? '—' : u === 'hrs' ? (v >= 999 ? '999+' : v.toFixed(1)) : (compact && v >= 1000) ? (v / 1000).toFixed(1) + 'k' : Math.round(v).toLocaleString();

const CARDS = [
  {
    l: 'Total Load', bg: 'bg-brand-50 text-brand-700', accent: 'border-l-brand-500',
    v: r => r?.tL, u: 'W',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>,
  },
  {
    l: 'Peak Load', bg: 'bg-imp-50 text-imp-600', accent: 'border-l-imp-400',
    v: r => r?.pL, u: 'W',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /></svg>,
  },
  {
    l: 'Daily Demand', bg: 'bg-crit-50 text-crit-600', accent: 'border-l-crit-400',
    v: r => r?.dD, u: 'Wh',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 16V9m4 7V5m4 11V7" /></svg>,
  },
  {
    l: 'Daily Solar', bg: 'bg-solar-50 text-solar-600', accent: 'border-l-solar-400',
    v: r => r?.ds, u: 'Wh',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  },
  {
    l: 'Depletion (All)', bg: 'bg-orange-50 text-orange-600', accent: 'border-l-orange-400',
    v: r => r?.al?.dep, u: 'hrs',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    l: 'Depletion (Crit)', bg: 'bg-bat-50 text-bat-600', accent: 'border-l-bat-500',
    v: r => r?.cl?.dep, u: 'hrs',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  },
];

export default function ScorecardRow({ results, compact = true }) {
  if (!results) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {CARDS.map((c, i) => (
        <div
          key={i}
          style={{ animationDelay: (i * 45) + 'ms' }}
          className={`bg-white dm-surface rounded-xl border border-slate-100 dm-border border-l-4 ${c.accent} p-3 shadow-card transition-shadow duration-200 ease opacity-0 animate-fade-up`}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className={`p-1 rounded-lg text-sm ${c.bg}`}>{c.icon}</span>
            <span className="text-[10px] text-slate-500 dm-text-muted leading-tight font-medium">{c.l}</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dm-text font-mono tabular">
            {fv(c.v(results), c.u, compact)}
            <span className="text-xs font-normal text-slate-400 dm-text-muted ml-0.5">{c.u}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
