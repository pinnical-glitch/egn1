const SolarCurveChart = ({ results }) => {
  if (!results?.sc) return null;
  const solar = results.sc;
  const total = results.ds || 0;
  const season = results.season || 'summer';
  const cloud = results.cloud || 'typical';

  const pad = { t: 15, r: 15, b: 25, l: 40 };
  const w = 500, h = 180;
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const mx = Math.max(...solar) * 1.1 || 1;

  const pts = solar.map((v, i) => ({
    x: pad.l + (i / (solar.length - 1)) * cw,
    y: pad.t + ch - (v / mx) * ch,
  }));
  const line = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ');
  const area = line + ' L' + pts[pts.length - 1].x + ',' + pad.t + 'h L' + pts[0].x + ',' + pad.t + ' Z';

  return (
    <div className="bg-white dm-surface rounded-xl shadow-card border border-slate-100 dm-border p-4 animate-fade-up">
      <h3 className="font-bold text-slate-900 dm-text mb-1">Solar Output Curve</h3>
      <p className="text-xs text-slate-500 dm-text-muted mb-3">Season: {season} · Weather: {cloud}</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        <defs>
          <linearGradient id="sc-lg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#sc-lg)" />
        <path d={line} fill="none" stroke="#fbbf24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <g>
          {[0, 6, 12, 18, 24].map(hour => (
            <text key={hour} x={pad.l + (hour / 24) * cw} y={h - 5} fontSize={9} fill="#94a3b8" textAnchor="middle" fontFamily="Inter">{hour}h</text>
          ))}
        </g>
      </svg>
      <div className="mt-2 text-xs text-slate-500 dm-text-muted tabular">
        Peak: {Math.max(...solar).toFixed(0)}W · Total: {total.toFixed(0)} Wh/day
      </div>
    </div>
  );
};

export default SolarCurveChart;
