const LoadBreakdownChart = ({ results }) => {
  if (!results?.cfg?.apps || results.cfg.apps.length === 0) return null;
  const apps = results.cfg.apps;
  const bP = results.bP || {};
  const bC = results.bC || {};

  const prio = Object.entries(bP)
    .filter(([_, v]) => v > 0)
    .map(([n, v]) => ({ name: n, value: v, color: n === 'Critical' ? '#e11d48' : n === 'Important' ? '#f59e0b' : '#64748b' }));

  const cats = Object.entries(bC)
    .filter(([_, v]) => v > 0)
    .map(([n, v]) => ({ name: n, value: v }))
    .sort((a, b) => b.value - a.value);

  const barColors = ['#0d9488', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#64748b'];

  const pieSegs = (() => {
    const total = prio.reduce((s, d) => s + d.value, 0);
    if (!total) return [];
    let cum = 0;
    return prio.filter(s => s.value > 0).map(s => {
      const start = cum / total * Math.PI * 2 - Math.PI / 2;
      cum += s.value;
      const end = cum / total * Math.PI * 2 - Math.PI / 2;
      const cx = 70, cy = 70, r = 55;
      const large = end - start > Math.PI ? 1 : 0;
      const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
      return { path: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`, color: s.color };
    });
  })();

  return (
    <div className="bg-white dm-surface rounded-xl shadow-card border border-slate-100 dm-border p-4 animate-fade-up">
      <h3 className="font-bold text-slate-900 dm-text mb-1">Load Breakdown</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] text-slate-500 dm-text-muted mb-1 text-center font-semibold">Priority</div>
          <svg viewBox="0 0 140 140" className="w-full h-auto max-w-[160px] mx-auto">
            {pieSegs.map((s, i) => (
              <path key={i} d={s.path} fill={s.color} stroke="white" className="dm-stroke" strokeWidth={2.5} />
            ))}
          </svg>
          {prio.map((p, i) => (
            <div key={i} className="flex items-center gap-1 text-[10px] mt-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="dm-text">{p.name}</span>
              <span className="text-slate-500 dm-text-muted ml-auto tabular">{p.value.toFixed(0)} Wh</span>
            </div>
          ))}
        </div>
        <div>
          <div className="text-[10px] text-slate-500 dm-text-muted mb-1 font-semibold">Category</div>
          <svg viewBox={`0 0 280 ${Math.max(100, cats.length * 28)}`} className="w-full h-auto">
            {cats.map((d, i) => {
              const mx = Math.max(...cats.map(c => c.value)) * 1.1 || 1;
              const bh = Math.min(24, (Math.max(100, cats.length * 28) - 10) / cats.length - 3);
              const y = 5 + i * (bh + 3);
              const bw = (d.value / mx) * 180;
              return (
                <g key={i}>
                  <text x={85} y={y + bh / 2 + 4} textAnchor="end" fontSize={11} fill="#94a3b8" fontFamily="Inter" fontWeight="500">{d.name}</text>
                  <rect x={90} y={y} width={bw} height={bh} fill={barColors[i % barColors.length]} rx={4} />
                  <text x={95 + bw} y={y + bh / 2 + 4} fontSize={10} fill="#94a3b8" fontFamily="JetBrains Mono">{d.value >= 1000 ? (d.value / 1000).toFixed(1) + 'k' : Math.round(d.value) + ' Wh'}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-slate-100 dm-border">
        <div className="text-[10px] text-slate-400 dm-text-muted">
          {apps.slice(0, 8).map(a => {
            const dailyWh = (a.w || 0) * (a.h || 0);
            return (
              <span key={a.id || a.name} className="mr-3">
                <span className="font-medium text-slate-600 dm-text">{a.name || a.n}</span>: {(dailyWh / 1000).toFixed(1)}kWh
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LoadBreakdownChart;
