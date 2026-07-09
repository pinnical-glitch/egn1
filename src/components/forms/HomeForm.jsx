import { CLIMATE_ZONES } from '../../engine/climateZones.js';

export default function HomeForm({ cfg, set }) {
  const z = CLIMATE_ZONES.find(x => x.id === cfg.cz);
  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h3 className="text-xl font-bold text-slate-900 dm-text">Home Information</h3>
        <p className="text-sm text-slate-500 dm-text-muted mt-1">Select climate zone and home type.</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dm-text mb-1.5">Climate Zone</label>
          <select value={cfg.cz} onChange={e => set({ ...cfg, cz: e.target.value })}
            className="w-full px-3 py-2.5 border border-slate-200 dm-border rounded-lg bg-white dm-surface text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow duration-150 ease-out">
            <option value="">Select a climate zone</option>
            {CLIMATE_ZONES.map(z => <option key={z.id} value={z.id}>{z.name} — {z.desc}</option>)}
          </select>
          {z && (
            <div className="mt-3 p-3 bg-brand-50 border border-brand-100 rounded-lg text-sm">
              <div className="flex items-center gap-4">
                <span className="text-brand-700"><b>Solar: </b>{z.psh} peak sun hrs</span>
                <span className="text-brand-700"><b>Temp: </b>{z.rng[0]}°C to {z.rng[1]}°C</span>
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dm-text mb-1.5">House Type</label>
          <select value={cfg.ht} onChange={e => set({ ...cfg, ht: e.target.value })}
            className="w-full px-3 py-2.5 border border-slate-200 dm-border rounded-lg bg-white dm-surface text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow duration-150 ease-out">
            <option value="sf">Single-Family</option>
            <option value="th">Townhouse</option>
            <option value="co">Condo/Apt</option>
            <option value="mh">Mobile Home</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dm-text mb-1.5">Blackout Duration (hrs)</label>
            <input type="number" value={cfg.hrs} onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) set({ ...cfg, hrs: v }); }} step={0.1}
              className="w-full px-3 py-2.5 border border-slate-200 dm-border rounded-lg bg-white dm-surface text-sm tabular focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow duration-150 ease-out" />
            <p className="text-xs text-slate-400 dm-text-muted mt-1.5">Default 72h. Supports 0.1h+ increments</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dm-text mb-1.5">Blackouts/Year</label>
            <input type="number" value={cfg.bpm} onChange={e => set({ ...cfg, bpm: parseInt(e.target.value) || 4 })} min={1} max={52}
              className="w-full px-3 py-2.5 border border-slate-200 dm-border rounded-lg bg-white dm-surface text-sm tabular focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow duration-150 ease-out" />
            <p className="text-xs text-slate-400 dm-text-muted mt-1.5">For degradation est.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
