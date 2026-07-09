import { useState } from 'react';
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

export default function AdvancedPhysicsForm({ cfg, set, chem }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('solar');
  const c = CHEM[chem] || CHEM.lfp;
  const h = (k, v) => set({ ...cfg, [k]: v });

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h3 className="text-xl font-bold text-slate-900 dm-text">Advanced Physics</h3>
        <p className="text-sm text-slate-500 dm-text-muted mt-1">Fine-tune simulation. All values have sensible defaults.</p>
      </div>

      <div className="bg-slate-50 dm-surface-2 border border-slate-100 dm-border rounded-xl p-4">
        <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between text-left" aria-expanded={open}>
          <div>
            <span className="font-semibold text-slate-900 dm-text">{open ? 'Hide' : 'Show'} Advanced Options</span>
            <p className="text-xs text-slate-500 dm-text-muted mt-0.5">Optional: leave defaults for standard simulation</p>
          </div>
          <span className="text-slate-400 dm-text-muted transition-transform duration-200 ease-out" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} aria-hidden>▼</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dm-text mb-1.5">Season</label>
          <select value={cfg.season || 'summer'} onChange={e => h('season', e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 dm-border rounded-lg bg-white dm-surface text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow duration-150 ease-out">
            <option value="winter">Winter ~65%</option>
            <option value="spring">Spring ~85%</option>
            <option value="summer">Summer 100%</option>
            <option value="fall">Fall ~80%</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dm-text mb-1.5">Weather</label>
          <select value={cfg.cloud || 'typical'} onChange={e => h('cloud', e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 dm-border rounded-lg bg-white dm-surface text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow duration-150 ease-out">
            <option value="clear">Clear ~20% loss</option>
            <option value="typical">Typical ~33% loss</option>
            <option value="poor">Poor ~50% loss</option>
          </select>
        </div>
      </div>

      {open && (
        <div className="space-y-4 border-t border-slate-100 dm-border pt-4 animate-fade-up">
          <div className="flex gap-1 border-b border-slate-200 dm-border">
            {['solar', 'battery', 'system'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors duration-150 ease-out ${tab === t ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400 dm-text-muted hover:text-slate-600'}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === 'solar' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dm-text mb-1.5">NOCT (°C)</label>
                  <input type="number" value={cfg.noct || 45} onChange={e => h('noct', +e.target.value || 45)} min={35} max={55}
                    className="w-full px-3 py-2.5 border border-slate-200 dm-border rounded-lg bg-white dm-surface text-sm tabular focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow duration-150 ease-out" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dm-text mb-1.5">Temp Coeff (%/°C)</label>
                  <input type="number" value={((cfg.tc || -0.0038) * 100).toFixed(2)} onChange={e => h('tc', +e.target.value / 100 || -0.0038)} step={0.01}
                    className="w-full px-3 py-2.5 border border-slate-200 dm-border rounded-lg bg-white dm-surface text-sm tabular focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow duration-150 ease-out" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dm-text mb-2">Inverter Eff: {((cfg.invEff || 0.95) * 100).toFixed(0)}%</label>
                <HeatSlider value={(cfg.invEff || 0.95) * 100} min={85} max={98} onChange={e => h('invEff', +e.target.value / 100)} ariaLabel="Inverter efficiency" />
              </div>
            </div>
          )}

          {tab === 'battery' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="up" checked={cfg.usePeukert !== false} onChange={e => h('usePeukert', e.target.checked)} className="h-4 w-4 text-brand-600 rounded border-slate-300 dm-border focus:ring-brand-500" />
                <label htmlFor="up" className="text-sm text-slate-700 dm-text">Peukert's Law (k={((cfg.peukertK) || c.peukert).toFixed(2)})</label>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="ucr" checked={cfg.useCRate !== false} onChange={e => h('useCRate', e.target.checked)} className="h-4 w-4 text-brand-600 rounded border-slate-300 dm-border focus:ring-brand-500" />
                <label htmlFor="ucr" className="text-sm text-slate-700 dm-text">C-Rate Limits ({c.cr}C)</label>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="utd" checked={cfg.useTemp !== false} onChange={e => h('useTemp', e.target.checked)} className="h-4 w-4 text-brand-600 rounded border-slate-300 dm-border focus:ring-brand-500" />
                <label htmlFor="utd" className="text-sm text-slate-700 dm-text">Temperature Derate</label>
              </div>
            </div>
          )}

          {tab === 'system' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <input type="checkbox" id="ua" checked={cfg.useAdv || false} onChange={e => h('useAdv', e.target.checked)} className="h-4 w-4 text-brand-600 rounded border-slate-300 dm-border focus:ring-brand-500" />
                <label htmlFor="ua" className="text-sm text-slate-700 dm-text">Use individual sub-derates</label>
              </div>
              {!cfg.useAdv ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dm-text mb-2">System Derate: {(cfg.sysDerate || 0.86).toFixed(2)}</label>
                  <HeatSlider value={(cfg.sysDerate || 0.86) * 100} min={80} max={90} onChange={e => h('sysDerate', +e.target.value / 100)} ariaLabel="System derate" />
                </div>
              ) : (
                <div className="space-y-3">
                  {[{ k: 'wiring', l: 'Wiring', d: 0.98 }, { k: 'soiling', l: 'Soiling', d: 0.98 }, { k: 'mismatch', l: 'Mismatch', d: 0.98 }, { k: 'availability', l: 'Availability', d: 0.97 }, { k: 'degradation', l: 'Degradation', d: 0.9985 }].map(item => (
                    <div key={item.k}>
                      <label className="block text-sm text-slate-700 dm-text mb-1.5">{item.k}: {((cfg.subDr && cfg.subDr[item.k]) || item.d) * 100}%</label>
                      <HeatSlider value={((cfg.subDr && cfg.subDr[item.k]) || item.d) * 100} min={90} max={100} onChange={e => h('subDr', { ...(cfg.subDr || {}), [item.k]: +e.target.value / 100 })} ariaLabel={item.k + ' sub-derate'} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-3 bg-brand-50 border border-brand-100 rounded-lg text-xs text-brand-700">
            Defaults are based on NREL PVWatts, IEC 61215, and Peukert's Law. Only adjust if you have specific specs.
          </div>
        </div>
      )}
    </div>
  );
}
