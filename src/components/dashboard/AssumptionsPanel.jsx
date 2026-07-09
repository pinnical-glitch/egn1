import { useState } from 'react';

const AssumptionsPanel = ({ results }) => {
  const [open, setOpen] = useState(false);
  const [sec, setSec] = useState({});
  if (!results) return null;

  const toggle = s => setSec(p => ({ ...p, [s]: !p[s] }));

  const sections = [
    {
      id: 'solar', title: 'Solar Irradiance & Derating', items: [
        { n: 'Cell Temp (NOCT)', f: 'T_cell = T_ambient + (NOCT-20)/800 × Irradiance', d: 'NOCT defaults to 45°C for standard panels.' },
        { n: 'Temp Derate', f: 'P = P_STC × [1 + temp_coeff × (T_cell - 25)]', d: 'temp_coeff defaults to -0.0038/°C for monocrystalline.' },
        { n: 'Seasonal PSH', f: 'PSH_adj = PSH_base × seasonal_multiplier', d: 'Winter 0.65, Spring 0.85, Summer 1.0, Fall 0.80.' },
        { n: 'Cloud Attenuation', f: 'Irr = I_clear × (1 - Beta(α,β))', d: 'Clear α=2/β=8, Typical α=3/β=6, Poor α=3/β=3.' },
        { n: 'Inverter Efficiency', f: 'P_AC = P_DC × η_inv', d: 'Defaults 95%. Range 85-98%.' },
        { n: 'Sub-Derates', f: 'P_eff = P_STC × T_d × Tilt_d × ∏(sub)', d: 'Wiring 98%, Soiling 98%, Mismatch 98%, Availability 97%, Degradation 99.85%/yr = ~0.86 total.' },
      ],
    },
    {
      id: 'battery', title: 'Battery Physics', items: [
        { n: "Peukert's Law", f: 'C_actual = C_rated × (I_rated/I_actual)^(k-1)', d: 'LFP k=1.05 (near-ideal), Lead-acid k=1.25 (significant rate loss).' },
        { n: 'C-Rate Limits', f: 'P_max = C_rate × Capacity_kWh × 1000', d: 'LFP 0.5C, Lead-acid 0.2C.' },
        { n: 'Temp Derate', f: 'C = C_25°C × [1 - slope × max(0, 25-T)]', d: 'LFP 0.8%/°C, Lead-acid 1.2%/°C.' },
        { n: 'Calendar Aging', f: 'Retention = 1 - (fade_rate × years)', d: 'LFP 2%/yr, Lead-acid 5%/yr.' },
        { n: 'Combined', f: 'Ret = (1-cycle_fade) × (1-calendar_fade)', d: 'Multiplicative model.' },
      ],
    },
    {
      id: 'degrad', title: 'Degradation Model', items: [
        { n: 'Cycle Life', f: 'Life = f(DoD) interpolated 50%-80%', d: 'LFP 4500@80% / 6000@50%, Lead-acid 200@80% / 400@50%.' },
        { n: 'Yearly Projection', f: 'Cap_y = Cap_y-1 × (1-cycle) × (1-calendar)', d: 'Combined cycle + calendar aging.' },
      ],
    },
  ];

  return (
    <div className="bg-white dm-surface rounded-xl shadow-card border border-slate-100 dm-border overflow-hidden animate-fade-up">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors duration-150"
        aria-expanded={open}
      >
        <div>
          <h3 className="font-bold text-slate-900 dm-text">Assumptions & Methodology</h3>
          <p className="text-xs text-slate-500 dm-text-muted mt-0.5">Formulas, constants, and sources.</p>
        </div>
        <span className="text-slate-400 transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} aria-hidden="true">▼</span>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4 text-sm border-t border-slate-100 dm-border">
          <div className="p-3 bg-brand-50 border border-brand-100 rounded-lg text-xs grid grid-cols-2 gap-2">
            <span className="text-brand-700"><b>Season: </b>{results.season}</span>
            <span className="text-brand-700"><b>Weather: </b>{results.cloud}</span>
            <span className="text-brand-700"><b>PSH: </b>{results.adjPSH?.toFixed(1)}</span>
            <span className="text-brand-700"><b>Battery: </b>{results.ch?.name}</span>
          </div>
          {sections.map(s => (
            <div key={s.id} className="border border-slate-100 dm-border rounded-xl overflow-hidden">
              <button
                onClick={() => toggle(s.id)}
                className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 dm-surface-2 text-left hover:bg-slate-100 transition-colors duration-150"
              >
                <span className="font-semibold text-slate-800 dm-text text-sm">{s.title}</span>
                <span className="text-slate-400 text-xs transition-transform duration-200" style={{ transform: sec[s.id] ? 'rotate(180deg)' : 'rotate(0deg)' }} aria-hidden="true">▼</span>
              </button>
              {sec[s.id] && (
                <div className="px-4 py-3 space-y-2 bg-white dm-surface">
                  {s.items.map((it, i) => (
                    <div key={i} className="bg-slate-50 dm-surface-2 border border-slate-100 dm-border rounded-lg p-3">
                      <div className="font-semibold text-slate-800 dm-text text-xs">{it.n}</div>
                      <div className="font-mono text-xs bg-white dm-surface border border-slate-100 dm-border rounded-md p-2 my-1.5 text-slate-700 dm-text">{it.f}</div>
                      <div className="text-xs text-slate-500 dm-text-muted">{it.d}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {results.dg && (
            <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg text-xs">
              <b className="text-purple-800">Battery Life: </b>
              Year at 80%: {results.dg.y80} · Year at 50%: {results.dg.y50} · Cycle life: {results.dg.life?.toLocaleString()}
            </div>
          )}
          <div className="p-3 bg-imp-50 border border-imp-100 rounded-lg text-imp-700 text-xs">
            <b>Note: </b>Estimates for planning only. Consult a certified installer.
          </div>
        </div>
      )}
    </div>
  );
};

export default AssumptionsPanel;
