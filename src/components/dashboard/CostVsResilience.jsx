import { useState } from 'react';

const calcCost = (panels, pw, batKwh, cfg = {}) => {
  const sCost = cfg.solarPerW || 27.5;
  const bCost = cfg.batPerKwh || 4000;
  const bos = cfg.bosPct || 17.5;
  const solar = panels * pw * sCost;
  const battery = batKwh * bCost;
  const sub = solar + battery;
  return { solar, battery, bos: sub * bos / 100, total: sub + sub * bos / 100 };
};

const estSurvival = (panels, pw, batKwh, cfg = {}) => {
  const avgW = cfg.avgLoad || 500;
  const solarWh = panels * pw * 4.5 * 0.86;
  const batH = (batKwh * 1000) / avgW;
  const solH = solarWh / avgW;
  return Math.min(batH + solH * 0.3, 200);
};

function CostScatter({ data, w, h }) {
  if (!data || !data.length) return null;
  const pad = { t: 30, r: 30, b: 45, l: 65 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const maxC = Math.max(...data.map(d => d.cost || 0)) * 1.1 || 1;
  const maxH = Math.max(...data.map(d => d.hours || 0)) * 1.1 || 1;
  const sx = c => pad.l + (c / maxC) * cw;
  const sy = hrs => pad.t + ch - (hrs / maxH) * ch;
  const labelYs = data.map(d => sy(d.hours || 0));
  for (let i = 1; i < labelYs.length; i++) {
    if (Math.abs(labelYs[i] - labelYs[i - 1]) < 28) labelYs[i] = labelYs[i - 1] - 28;
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" style={{ overflow: 'visible' }}>
      <rect x={pad.l + cw / 2} y={pad.t} width={cw / 2} height={ch / 2} fill="#ecfdf5" opacity={0.6} rx={4} />
      <rect x={pad.l} y={pad.t} width={cw / 2} height={ch / 2} fill="#fff1f2" opacity={0.4} rx={4} />
      {[0, 0.25, 0.5, 0.75, 1].map(pct => (
        <line key={pct} x1={pad.l} y1={pad.t + pct * ch} x2={pad.l + cw} y2={pad.t + pct * ch} stroke="#e2e8f0" strokeDasharray="4 4" />
      ))}
      <text x={pad.l + cw / 2} y={h - 8} fontSize={10} fill="#64748b" textAnchor="middle" fontFamily="Inter" fontWeight="500">Cost (EGP)</text>
      <text x={14} y={pad.t + ch / 2} fontSize={10} fill="#64748b" textAnchor="middle" transform={`rotate(-90,14,${pad.t + ch / 2})`} fontFamily="Inter" fontWeight="500">Survival (hrs)</text>
      {data.map((p, i) => {
        const cx = sx(p.cost || 0);
        const cy = sy(p.hours || 0);
        const ly = labelYs[i];
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={p.custom ? 8 : 5} fill={p.color} stroke="white" strokeWidth={2.5} opacity={0.9} />
            <rect x={cx - 50} y={ly - 20} width={100} height={14} fill="white" rx={3} opacity={0.85} />
            <text x={cx} y={ly - 10} fontSize={9} fill="#1e293b" textAnchor="middle" fontWeight={p.custom ? 'bold' : '500'} fontFamily="Inter">{p.name}</text>
            <rect x={cx - 50} y={ly + 2} width={100} height={12} fill="white" rx={3} opacity={0.85} />
            <text x={cx} y={ly + 11} fontSize={8} fill="#64748b" textAnchor="middle" fontFamily="JetBrains Mono">{(p.cost / 1000).toFixed(1)}k · {p.hours.toFixed(0)}h</text>
          </g>
        );
      })}
    </svg>
  );
}

const CostVsResilience = ({ r, cfg }) => {
  const [costCfg, setCostCfg] = useState({ solarPerW: 27.5, batPerKwh: 4000, bosPct: 17.5 });
  if (!r || !cfg) return null;

  const avgW = cfg.loads?.apps ? cfg.loads.apps.reduce((s, a) => s + (a.w || 0), 0) / 24 : 500;
  const presets = [
    { id: 'min', name: 'Critical Minimal', panels: 5, bat: 5, color: '#f43f5e' },
    { id: 'bal', name: 'Balanced', panels: 10, bat: 10, color: '#f59e0b' },
    { id: 'full', name: 'Full Home', panels: 20, bat: 20, color: '#10b981' },
  ];

  const myCost = calcCost(cfg.solar?.cnt || 0, cfg.solar?.w || 400, cfg.battery?.cap || 0, costCfg);
  const myHours = r.al?.dep || 0;

  const chartData = presets.map(p => ({
    ...p,
    ...calcCost(p.panels, cfg.solar?.w || 400, p.bat, costCfg),
    hours: estSurvival(p.panels, cfg.solar?.w || 400, p.bat, { ...costCfg, avgW }),
    custom: false,
  }));
  chartData.push({ id: 'custom', name: 'Your Config', cost: myCost.total, hours: myHours, color: '#0d9488', custom: true });

  return (
    <div className="bg-white dm-surface rounded-xl shadow-card border border-slate-100 dm-border p-5 space-y-4 animate-fade-up">
      <h3 className="font-bold text-slate-900 dm-text">Cost vs Resilience</h3>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-600 dm-text-muted">Solar EGP/W</label>
          <input type="number" value={costCfg.solarPerW} onChange={e => setCostCfg({ ...costCfg, solarPerW: +e.target.value || 27.5 })} step={0.25}
            className="w-full px-2.5 py-1.5 text-sm border border-slate-200 dm-border rounded-lg bg-white dm-surface tabular focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 dm-text-muted">Battery EGP/kWh</label>
          <input type="number" value={costCfg.batPerKwh} onChange={e => setCostCfg({ ...costCfg, batPerKwh: +e.target.value || 4000 })} step={50}
            className="w-full px-2.5 py-1.5 text-sm border border-slate-200 dm-border rounded-lg bg-white dm-surface tabular focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 dm-text-muted">BOS %</label>
          <input type="number" value={costCfg.bosPct} onChange={e => setCostCfg({ ...costCfg, bosPct: +e.target.value || 17.5 })} step={2.5}
            className="w-full px-2.5 py-1.5 text-sm border border-slate-200 dm-border rounded-lg bg-white dm-surface tabular focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>
      <div className="border border-slate-100 dm-border rounded-xl p-3 bg-white dm-surface">
        <CostScatter data={chartData} w={500} h={280} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="bg-brand-50 border border-brand-100 rounded-xl p-3">
          <div className="font-semibold text-brand-800">Your Config</div>
          <div className="font-mono font-bold text-brand-700 tabular">EGP {Math.round(myCost.total).toLocaleString()}</div>
          <div className="text-xs text-brand-600 tabular">{myHours.toFixed(1)}h survival</div>
        </div>
        {presets.map(p => {
          const cost = calcCost(p.panels, cfg.solar?.w || 400, p.bat, costCfg);
          return (
            <div key={p.id} className="bg-slate-50 dm-surface-2 border border-slate-100 dm-border rounded-xl p-3">
              <div className="font-semibold text-slate-900 dm-text">{p.name}</div>
              <div className="font-mono font-bold text-slate-700 dm-text tabular">EGP {Math.round(cost.total).toLocaleString()}</div>
              <div className="text-xs text-slate-500 dm-text-muted tabular">{p.panels} panels · {p.bat} kWh</div>
            </div>
          );
        })}
      </div>
      <div className="p-3 bg-imp-50 border border-imp-100 rounded-lg text-xs text-imp-700">
        Costs are market averages for Egypt. Consult certified installers for quotes.
      </div>
    </div>
  );
};

export default CostVsResilience;
