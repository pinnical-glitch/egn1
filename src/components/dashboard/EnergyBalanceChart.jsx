const EnergyBalanceChart = ({ results }) => {
  if (!results) return null;

  const solar = results.sc || [];
  const loadH = new Array(24).fill((results.dD || 0) / 24);

  const totalSolar = (results.ds || 0) / 1000;
  const totalDischarged = (results.al?.dis || 0) / 1000;
  const totalCharged = (results.al?.chg || 0) / 1000;
  const totalUnmet = (results.al?.unmet || 0) / 1000;
  const totalLoad = results.tL || 0;

  const pad = { t: 15, r: 15, b: 25, l: 40 };
  const w = 600, h = 220;
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const mx = Math.max(...solar, ...loadH) * 1.1 || 1;

  const mkA = (vals) => {
    const pts = vals.map((v, i) => ({ x: pad.l + (i / (vals.length - 1)) * cw, y: pad.t + ch - (v / mx) * ch }));
    const line = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ');
    return { line, area: line + ' L' + pts[pts.length - 1].x + ',' + pad.t + 'h L' + pts[0].x + ',' + pad.t + ' Z' };
  };
  const sa = mkA(solar);
  const la = mkA(loadH);

  const items = [
    { label: 'Solar', value: totalSolar, color: 'bg-solar-500' },
    { label: 'Battery Out', value: totalDischarged, color: 'bg-bat-500' },
    { label: 'Battery In', value: totalCharged, color: 'bg-brand-500' },
    { label: 'Unmet', value: totalUnmet, color: 'bg-crit-500' },
  ];
  const maxVal = Math.max(...items.map(i => i.value), 1);

  return (
    <div className="bg-white dm-surface rounded-xl shadow-card border border-slate-100 dm-border p-4 animate-fade-up">
      <h3 className="font-bold text-slate-900 dm-text mb-1">Hourly Energy Balance</h3>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        <defs>
          <linearGradient id="eb-sg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="eb-lg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <path d={la.area} fill="url(#eb-lg)" />
        <path d={sa.area} fill="url(#eb-sg)" />
        <path d={la.line} fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={sa.line} fill="none" stroke="#fbbf24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <g transform={`translate(${w - 95},${pad.t})`}>
          <rect x={0} y={0} width={90} height={34} fill="white" stroke="#e2e8f0" rx={8} />
          <line x1={8} y1={11} x2={20} y2={11} stroke="#fbbf24" strokeWidth={2} strokeLinecap="round" />
          <text x={25} y={15} fontSize={10} fill="#94a3b8" fontWeight="500" fontFamily="Inter">Solar</text>
          <line x1={8} y1={24} x2={20} y2={24} stroke="#ef4444" strokeWidth={2} strokeLinecap="round" />
          <text x={25} y={28} fontSize={10} fill="#94a3b8" fontWeight="500" fontFamily="Inter">Load</text>
        </g>
        <g>
          {[0, 6, 12, 18, 24].map(hour => (
            <text key={hour} x={pad.l + (hour / 24) * cw} y={h - 5} fontSize={9} fill="#94a3b8" textAnchor="middle" fontFamily="Inter">{hour}h</text>
          ))}
        </g>
      </svg>
      <div className="grid grid-cols-3 gap-4 mt-3 text-center text-sm">
        <div><span className="text-slate-500 dm-text-muted">Solar</span><div className="font-semibold text-solar-600 tabular">{(results.ds || 0).toFixed(0)} Wh</div></div>
        <div><span className="text-slate-500 dm-text-muted">Load</span><div className="font-semibold text-crit-600 tabular">{(results.dD || 0).toFixed(0)} Wh</div></div>
        <div><span className="text-slate-500 dm-text-muted">Balance</span><div className={`font-semibold ${((results.ds || 0) - (results.dD || 0)) >= 0 ? 'text-bat-600' : 'text-crit-600'} tabular`}>{((results.ds || 0) - (results.dD || 0)) >= 0 ? '+' : ''}{((results.ds || 0) - (results.dD || 0)).toFixed(0)} Wh</div></div>
      </div>
      <div className="space-y-2.5 mt-3 pt-2 border-t border-slate-100 dm-border">
        {items.map(item => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 dm-text w-20 text-right">{item.label}</span>
            <div className="flex-1 h-5 bg-slate-100 dm-surface-dim rounded-full overflow-hidden">
              <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${(item.value / maxVal) * 100}%` }} />
            </div>
            <span className="text-xs font-mono font-bold text-slate-900 dm-text tabular w-20 text-right">{item.value.toFixed(1)} kWh</span>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-slate-400 dm-text-muted mt-2">
        Total load: {totalLoad.toLocaleString()}W | Peak load: {(results.pL || 0).toLocaleString()}W
      </div>
    </div>
  );
};

export default EnergyBalanceChart;
