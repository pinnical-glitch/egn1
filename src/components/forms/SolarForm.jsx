function HeatSlider({ value, min, max, onChange, ariaLabel }) {
  const frac = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const pct = (frac * 100).toFixed(2) + '%';
  const lerp = (a, b, t) => Math.round(a + (b - a) * t);
  const blue = [59, 130, 246], red = [244, 63, 94];
  const r = lerp(blue[0], red[0], frac), g = lerp(blue[1], red[1], frac), b = lerp(blue[2], red[2], frac);
  const heatColor = 'rgb(' + r + ',' + g + ',' + b + ')';
  return (
    <input
      type="range" value={value} min={min} max={max} onChange={onChange} aria-label={ariaLabel}
      className="w-full heat-slider"
      style={{
        '--heat-pct': pct,
        '--heat-color': heatColor,
        background: 'linear-gradient(to right, ' + heatColor + ' 0%, ' + heatColor + ' ' + pct + ', #e2e8f0 ' + pct + ', #e2e8f0 100%)'
      }}
    />
  );
}

const ORIS = [
  { id: 'S', n: 'South', d: 'Optimal' },
  { id: 'SE', n: 'SE', d: 'Morning' },
  { id: 'SW', n: 'SW', d: 'Afternoon' },
  { id: 'E', n: 'East', d: 'Morning' },
  { id: 'W', n: 'West', d: 'Afternoon' },
  { id: 'N', n: 'North', d: 'Poor' },
];

export default function SolarForm({ cfg, set }) {
  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h3 className="text-xl font-bold text-slate-900 dm-text">Solar Configuration</h3>
        <p className="text-sm text-slate-500 dm-text-muted mt-1">PVWatts 0.86 system derate.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dm-text mb-1.5">Panels</label>
          <input type="number" value={cfg.cnt || ''} onChange={e => set({ ...cfg, cnt: parseInt(e.target.value) || 0 })} min={1}
            className="w-full px-3 py-2.5 border border-slate-200 dm-border rounded-lg bg-white dm-surface text-sm tabular focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow duration-150 ease-out" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dm-text mb-1.5">Watts/Panel</label>
          <input type="number" value={cfg.w || ''} onChange={e => set({ ...cfg, w: parseInt(e.target.value) || 0 })} min={100}
            className="w-full px-3 py-2.5 border border-slate-200 dm-border rounded-lg bg-white dm-surface text-sm tabular focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow duration-150 ease-out" />
        </div>
      </div>

      {cfg.cnt > 0 && cfg.w > 0 && (
        <div className="p-3 bg-solar-50 border border-solar-200 rounded-lg text-sm text-solar-700 font-medium">
          <b>Array: </b>{(cfg.cnt * cfg.w / 1000).toFixed(1)} kW DC
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-slate-700 dm-text mb-2">Tilt: {cfg.tilt}°</label>
        <HeatSlider value={cfg.tilt} min={0} max={90} onChange={e => set({ ...cfg, tilt: +e.target.value })} ariaLabel="Panel tilt angle" />
        <div className="flex justify-between text-[10px] text-slate-400 dm-text-muted mt-1">
          <span>0° Flat</span>
          <span>90° Vertical</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 dm-text mb-2">Orientation</label>
        <div className="grid grid-cols-3 gap-2">
          {ORIS.map(o => (
            <label key={o.id} className={`flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-150 ${cfg.ori === o.id ? 'border-brand-400 bg-brand-50 shadow-card' : 'border-slate-100 dm-border bg-white dm-surface hover:border-slate-200 hover:shadow-card'}`}>
              <input type="radio" name="ori" value={o.id} checked={cfg.ori === o.id} onChange={e => set({ ...cfg, ori: e.target.value })} className="sr-only" />
              <span className="font-bold text-slate-900 dm-text text-lg">{o.id}</span>
              <span className="text-[10px] text-slate-500 dm-text-muted mt-0.5">{o.n}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
