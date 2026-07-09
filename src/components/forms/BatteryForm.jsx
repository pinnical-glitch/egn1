import { CHEM } from '../../engine/battery.js';

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

export default function BatteryForm({ cfg, set }) {
  const ch = CHEM[cfg.chem] || CHEM.lfp;
  const us = (cfg.cap || 0) * (cfg.dod || 0.92);

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h3 className="text-xl font-bold text-slate-900 dm-text">Battery Configuration</h3>
        <p className="text-sm text-slate-500 dm-text-muted mt-1">RTE applied at charge step.</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 dm-text mb-2">Chemistry</label>
        <div className="grid grid-cols-2 gap-3">
          {Object.values(CHEM).map(c => (
            <label key={c.id} className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 ${cfg.chem === c.id ? 'border-brand-400 bg-brand-50 shadow-card' : 'border-slate-100 dm-border bg-white dm-surface hover:border-slate-200 hover:shadow-card'}`}>
              <input type="radio" name="chem" value={c.id} checked={cfg.chem === c.id} onChange={e => set({ ...cfg, chem: e.target.value })} className="sr-only" />
              <span className="font-semibold text-slate-900 dm-text text-sm">{c.name}</span>
              <div className="text-[11px] text-slate-500 dm-text-muted mt-1.5 space-y-0.5">
                <div>DoD {c.dod * 100}% · Eff {c.rte * 100}%</div>
                <div>Cycles: {c.l80.toLocaleString()} @80%</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 dm-text mb-1.5">Capacity (kWh)</label>
        <input type="number" value={cfg.cap || ''} onChange={e => set({ ...cfg, cap: parseFloat(e.target.value) || 0 })} min={0.1} step={0.1}
          className="w-full px-3 py-2.5 border border-slate-200 dm-border rounded-lg bg-white dm-surface text-sm tabular focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow duration-150 ease-out" />
        <p className="text-xs text-slate-400 dm-text-muted mt-1.5">Typical 5-15 kWh</p>
      </div>

      {cfg.cap > 0 && (
        <div className="p-3 bg-bat-50 border border-bat-200 rounded-lg text-sm text-bat-700 font-medium">
          <b>Usable: </b>{us.toFixed(2)} kWh
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-slate-700 dm-text mb-2">Max DoD: {((cfg.dod || 0.92) * 100).toFixed(0)}%</label>
        <HeatSlider value={(cfg.dod || 0.92) * 100} min={10} max={100} onChange={e => set({ ...cfg, dod: +e.target.value / 100 })} ariaLabel="Max depth of discharge" />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 dm-text mb-2">Round-Trip Eff: {((cfg.rte || 0.95) * 100).toFixed(0)}%</label>
        <HeatSlider value={(cfg.rte || 0.95) * 100} min={70} max={100} onChange={e => set({ ...cfg, rte: +e.target.value / 100 })} ariaLabel="Round-trip efficiency" />
      </div>
    </div>
  );
}
