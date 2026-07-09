import { useState } from 'react';

export function OptimizeSetup({ config, r, onRun }) {
  const zone = config?.home?.cz || 'egypt_cairo';
  const fixedVars = [
    { l: 'Climate Zone', v: zone },
    { l: 'Blackout Duration', v: (config?.home?.hrs || 72) + 'h' },
    { l: 'Blackouts/Year', v: config?.home?.bpm || 4 },
    { l: 'Panel Wattage', v: (config?.solar?.w || 400) + 'W (fixed SKU)' },
    { l: 'Appliances', v: (config?.loads?.apps?.length || 0) + ' selected' },
  ];
  const searchVars = [
    { l: 'Panel Count', v: '0–40' },
    { l: 'Battery Capacity', v: '0–40 kWh' },
    { l: 'Battery Chemistry', v: 'LFP or Lead-Acid' },
    { l: 'Tilt Angle', v: '0°–90°' },
    { l: 'Orientation', v: 'S/SE/SW/E/W/N' },
  ];
  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h3 className="text-xl font-bold text-slate-900 dm-text">Multi-Objective Optimization</h3>
        <p className="text-sm text-slate-500 dm-text-muted mt-1 leading-relaxed">
          The optimizer searches thousands of hardware configurations to find the best trade-offs between cost, reliability, carbon impact, and blackout survival. It uses NSGA-II (Deb et al. 2002), a standard evolutionary algorithm that discovers the Pareto front — the set of solutions where no objective can improve without worsening another.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-bat-50 border border-bat-200 rounded-xl p-4">
          <h4 className="text-sm font-bold text-bat-800 mb-2">Fixed (Your Configuration)</h4>
          {fixedVars.map((v, i) => (
            <div key={i} className="flex justify-between text-xs py-1">
              <span className="text-bat-600">{v.l}</span>
              <span className="font-semibold text-bat-800 tabular">{v.v}</span>
            </div>
          ))}
        </div>
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
          <h4 className="text-sm font-bold text-brand-800 mb-2">Searched by Optimizer</h4>
          {searchVars.map((v, i) => (
            <div key={i} className="flex justify-between text-xs py-1">
              <span className="text-brand-600">{v.l}</span>
              <span className="font-semibold text-brand-800 tabular">{v.v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-slate-50 dm-surface-2 border border-slate-100 dm-border rounded-xl p-4">
        <h4 className="text-sm font-bold text-slate-900 dm-text mb-2">Four Objectives</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-start gap-2"><span className="w-2 h-2 rounded-full bg-brand-500 mt-1 flex-shrink-0" /><span><b>Minimize Cost</b> — Total system cost in EGP</span></div>
          <div className="flex items-start gap-2"><span className="w-2 h-2 rounded-full bg-bat-500 mt-1 flex-shrink-0" /><span><b>Maximize Reliability</b> — Fraction of randomized blackout scenarios survived</span></div>
          <div className="flex items-start gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" /><span><b>Minimize Carbon</b> — Net 10-year carbon impact (manufacturing minus avoided grid CO2)</span></div>
          <div className="flex items-start gap-2"><span className="w-2 h-2 rounded-full bg-imp-500 mt-1 flex-shrink-0" /><span><b>Maximize Survival</b> — All-load depletion hours, capped at 1.5× blackout duration</span></div>
        </div>
      </div>
      <button onClick={onRun} className="w-full px-5 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-all duration-200 shadow-card hover:shadow-elevated">
        Run NSGA-II Optimization
      </button>
      <p className="text-xs text-slate-400 dm-text-muted text-center">
        Population: 60 · Generations: up to 40 · Monte Carlo runs: 20 per candidate · Estimated time: 15–30s
      </p>
    </div>
  );
}

export function OptimizationProgress({ state, onCancel }) {
  const { gen, maxGen, frontSize, bestCost, bestReliability, bestCarbon, bestSurvival, evaluations, maxEvals, stopped } = state;
  const pct = maxGen > 0 ? (gen / maxGen) * 100 : 0;
  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dm-text">Running NSGA-II Optimizer</h3>
        <button onClick={onCancel} className="px-3 py-1.5 text-sm font-semibold text-crit-600 bg-crit-50 rounded-lg hover:bg-crit-100 transition-colors duration-150">Cancel</button>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dm-text">Generation</span>
          <span className="font-mono font-semibold tabular dm-text">{gen} / {maxGen}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div className="h-full bg-brand-500 rounded-full transition-all duration-300 ease-out" style={{ width: pct + '%' }} />
        </div>
        <div className="flex justify-between text-xs text-slate-500 dm-text-muted">
          <span className="tabular">{evaluations} / {maxEvals} evaluations</span>
          <span className="tabular">Front 1 size: {frontSize}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-brand-50 border border-brand-100 rounded-xl p-3">
          <div className="text-[10px] text-brand-600 uppercase tracking-wide font-semibold">Best Cost</div>
          <div className="text-sm font-mono font-bold text-brand-900 tabular">{bestCost != null ? 'EGP ' + bestCost.toLocaleString() : '—'}</div>
        </div>
        <div className="bg-bat-50 border border-bat-100 rounded-xl p-3">
          <div className="text-[10px] text-bat-600 uppercase tracking-wide font-semibold">Best Reliability</div>
          <div className="text-sm font-mono font-bold text-bat-900 tabular">{bestReliability != null ? (bestReliability * 100).toFixed(0) + '%' : '—'}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
          <div className="text-[10px] text-emerald-600 uppercase tracking-wide font-semibold">Best Carbon</div>
          <div className="text-sm font-mono font-bold text-emerald-900 tabular">{bestCarbon != null ? bestCarbon.toFixed(0) + ' kg' : '—'}</div>
        </div>
        <div className="bg-imp-50 border border-imp-100 rounded-xl p-3">
          <div className="text-[10px] text-imp-600 uppercase tracking-wide font-semibold">Best Survival</div>
          <div className="text-sm font-mono font-bold text-imp-900 tabular">{bestSurvival != null ? bestSurvival.toFixed(1) + 'h' : '—'}</div>
        </div>
      </div>
      {stopped && <div className="p-3 bg-imp-50 border border-imp-100 rounded-xl text-sm text-imp-700 font-medium">Optimization stopped early. Showing best front found so far.</div>}
    </div>
  );
}

export function ParetoExplorer({ front, cfg, res, selected, onSelect, onApply }) {
  const [axisX, setAxisX] = useState('cost');
  const [axisY, setAxisY] = useState('survival');
  const [sizeObj, setSizeObj] = useState('reliability');
  const [colorObj, setColorObj] = useState('carbon');
  const objKeys = ['cost', 'reliability', 'carbon', 'survival'];
  const objLabels = { cost: 'Cost (EGP)', reliability: 'Reliability', carbon: 'Carbon (kg CO₂)', survival: 'Survival (hrs)' };

  const w = 560, h = 360;
  const pad = { t: 30, r: 30, b: 50, l: 65 };
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
  const getX = v => v[axisX], getY = v => v[axisY];
  const getSize = v => v[sizeObj], getColor = v => v[colorObj];
  const xVals = front.map(getX), yVals = front.map(getY);
  const sVals = front.map(getSize), cVals = front.map(getColor);
  const xMin = Math.min(...xVals), xMax = Math.max(...xVals) || 1;
  const yMin = Math.min(...yVals), yMax = Math.max(...yVals) || 1;
  const sMin = Math.min(...sVals), sMax = Math.max(...sVals) || 1;
  const cMin = Math.min(...cVals), cMax = Math.max(...cVals) || 1;
  const sx = v => pad.l + ((v - xMin) / (xMax - xMin || 1)) * cw;
  const sy = v => pad.t + ch - ((v - yMin) / (yMax - yMin || 1)) * ch;
  const ss = v => 4 + ((v - sMin) / (sMax - sMin || 1)) * 10;
  const colorScale = v => {
    const t = (v - cMin) / (cMax - cMin || 1);
    const r = Math.round(30 + t * 200), g = Math.round(120 - t * 80), b = Math.round(80 + t * 100);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  };

  const currentCfg = cfg?.solar && cfg?.battery && res ? {
    cost: (() => {
      const sCost = 27.5, bCost = 4000, bos = 17.5;
      const solar = (cfg.solar.cnt || 0) * (cfg.solar.w || 400) * sCost;
      const battery = (cfg.battery.cap || 0) * bCost;
      const sub = solar + battery;
      return sub + sub * bos / 100;
    })(),
    survival: res.al ? res.al.dep : 0,
  } : null;

  const formatAxis = (key, val) => {
    if (key === 'cost') return 'EGP ' + Math.round(val).toLocaleString();
    if (key === 'reliability') return (val * 100).toFixed(0) + '%';
    if (key === 'survival') return val.toFixed(1) + 'h';
    return val.toFixed(0) + 'kg';
  };

  const AxisSelect = ({ value, onChange, label }) => (
    <div className="flex items-center gap-2">
      <label className="text-xs text-slate-600 dm-text-muted font-semibold">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="px-2.5 py-1.5 text-xs border border-slate-200 dm-border rounded-lg bg-white dm-surface focus:ring-1 focus:ring-brand-500 focus:border-brand-500">
        {objKeys.map(k => <option key={k} value={k}>{objLabels[k]}</option>)}
      </select>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-center gap-3">
        <AxisSelect value={axisX} onChange={setAxisX} label="X Axis:" />
        <AxisSelect value={axisY} onChange={setAxisY} label="Y Axis:" />
        <AxisSelect value={sizeObj} onChange={setSizeObj} label="Size:" />
        <AxisSelect value={colorObj} onChange={setColorObj} label="Color:" />
      </div>
      <div className="border border-slate-100 dm-border rounded-xl overflow-hidden bg-white dm-surface shadow-card">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="Pareto front scatter plot">
          {[0, 0.25, 0.5, 0.75, 1].map(pct => <line key={'gx' + pct} x1={pad.l} y1={pad.t + pct * ch} x2={pad.l + cw} y2={pad.t + pct * ch} stroke="#e2e8f0" strokeWidth={1} />)}
          {[0, 0.25, 0.5, 0.75, 1].map(pct => <line key={'gy' + pct} x1={pad.l + pct * cw} y1={pad.t} x2={pad.l + pct * cw} y2={pad.t + ch} stroke="#e2e8f0" strokeWidth={1} />)}
          <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + ch} stroke="#94a3b8" strokeWidth={1} />
          <line x1={pad.l} y1={pad.t + ch} x2={pad.l + cw} y2={pad.t + ch} stroke="#94a3b8" strokeWidth={1} />
          <text x={pad.l + cw / 2} y={h - 8} fontSize={11} fill="#475569" textAnchor="middle" fontFamily="Inter" fontWeight="500">{objLabels[axisX]}</text>
          <text x={12} y={pad.t + ch / 2} fontSize={11} fill="#475569" textAnchor="middle" transform={`rotate(-90,12,${pad.t + ch / 2})`} fontFamily="Inter" fontWeight="500">{objLabels[axisY]}</text>
          {[0, 0.5, 1].map(pct => {
            const val = xMin + pct * (xMax - xMin);
            return <text key={'xt' + pct} x={pad.l + pct * cw} y={pad.t + ch + 18} fontSize={9} fill="#64748b" textAnchor="middle" fontFamily="JetBrains Mono">{formatAxis(axisX, val)}</text>;
          })}
          {[0, 0.5, 1].map(pct => {
            const val = yMin + pct * (yMax - yMin);
            return <text key={'yt' + pct} x={pad.l - 8} y={pad.t + ch - pct * ch + 4} fontSize={9} fill="#64748b" textAnchor="end" fontFamily="JetBrains Mono">{formatAxis(axisY, val)}</text>;
          })}
          {front.map((ind, i) => {
            const cx = sx(getX(ind)), cy = sy(getY(ind)), r = ss(getSize(ind)), col = colorScale(getColor(ind));
            const isSelected = selected === i;
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={r} fill={col} stroke={isSelected ? '#0d9488' : 'white'} strokeWidth={isSelected ? 3 : 1.5} opacity={0.85}
                  style={{ cursor: 'pointer', transition: 'stroke-width 120ms cubic-bezier(0.23, 1, 0.32, 1)' }}
                  onClick={() => onSelect(i)} tabIndex={0} role="button" aria-label={'Pareto solution ' + (i + 1)} aria-pressed={isSelected}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(i); } }} />
              </g>
            );
          })}
          {currentCfg && (
            <g>
              <rect x={sx(currentCfg.cost) - 6} y={sy(currentCfg.survival) - 6} width={12} height={12} fill="#0d9488" stroke="white" strokeWidth={2} transform={`rotate(45,${sx(currentCfg.cost)},${sy(currentCfg.survival)})`} />
              <text x={sx(currentCfg.cost)} y={sy(currentCfg.survival) - 14} fontSize={9} fill="#0f766e" textAnchor="middle" fontWeight="bold" fontFamily="Inter">Your Config</text>
            </g>
          )}
          <g transform={`translate(${w - 140},${pad.t})`}>
            <rect x={0} y={0} width={135} height={52} fill="white" stroke="#e2e8f0" rx={8} />
            <text x={8} y={14} fontSize={9} fill="#475569" fontWeight="bold" fontFamily="Inter">Size: {objLabels[sizeObj]}</text>
            <text x={8} y={28} fontSize={9} fill="#475569" fontWeight="bold" fontFamily="Inter">Color: {objLabels[colorObj]}</text>
            <text x={8} y={42} fontSize={8} fill="#94a3b8" fontFamily="Inter">◆ = Your current config</text>
          </g>
        </svg>
      </div>
      {selected != null && front[selected] && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 space-y-3 animate-scale-in">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-brand-900">Selected Solution</h4>
            <button onClick={() => onApply?.(front[selected])} className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors duration-150 shadow-card">Apply This Configuration</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div><div className="text-xs text-brand-600 font-semibold">Panels</div><div className="font-mono font-bold text-brand-900 tabular">{front[selected].panelCount}</div></div>
            <div><div className="text-xs text-brand-600 font-semibold">Battery</div><div className="font-mono font-bold text-brand-900 tabular">{front[selected].batteryKwh} kWh {front[selected].batteryChem?.toUpperCase()}</div></div>
            <div><div className="text-xs text-brand-600 font-semibold">Tilt / Orient</div><div className="font-mono font-bold text-brand-900 tabular">{front[selected].tilt}° / {front[selected].orientation}</div></div>
            <div><div className="text-xs text-brand-600 font-semibold">Cost</div><div className="font-mono font-bold text-brand-900 tabular">EGP {front[selected].cost?.toLocaleString()}</div></div>
            <div><div className="text-xs text-brand-600 font-semibold">Survival</div><div className="font-mono font-bold text-brand-900 tabular">{front[selected].survival?.toFixed(1)}h</div></div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-xs text-brand-600 font-semibold">Reliability</div><div className="font-mono font-bold text-brand-900 tabular">{(front[selected].reliability * 100).toFixed(0)}% of scenarios survived</div></div>
            <div><div className="text-xs text-brand-600 font-semibold">Net 10yr Carbon</div><div className="font-mono font-bold text-brand-900 tabular">{front[selected].carbon?.toFixed(0)} kg CO₂</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ParetoTable({ front, selected, onSelect }) {
  const [sortKey, setSortKey] = useState('cost');
  const [sortAsc, setSortAsc] = useState(true);
  const columns = [
    { key: 'panelCount', label: 'Panels', fmt: v => v },
    { key: 'batteryKwh', label: 'Battery', fmt: v => v + ' kWh' },
    { key: 'batteryChem', label: 'Chem', fmt: v => v?.toUpperCase() },
    { key: 'tilt', label: 'Tilt', fmt: v => v + '°' },
    { key: 'orientation', label: 'Orient', fmt: v => v },
    { key: 'cost', label: 'Cost', fmt: v => 'EGP ' + v.toLocaleString() },
    { key: 'reliability', label: 'Reliability', fmt: v => (v * 100).toFixed(0) + '%' },
    { key: 'carbon', label: 'Carbon', fmt: v => v.toFixed(0) + ' kg' },
    { key: 'survival', label: 'Survival', fmt: v => v.toFixed(1) + 'h' },
  ];
  const sorted = [...front].sort((a, b) => {
    const va = a[sortKey], vb = b[sortKey];
    const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
    return sortAsc ? cmp : -cmp;
  });
  const toggleSort = key => { if (sortKey === key) setSortAsc(!sortAsc); else { setSortKey(key); setSortAsc(true); } };
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 dm-border shadow-card">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-100 dm-border bg-slate-50 dm-surface-2">
            {columns.map(c => (
              <th key={c.key} onClick={() => toggleSort(c.key)} className="px-3 py-2 text-left font-semibold text-slate-600 dm-text-muted cursor-pointer hover:text-slate-900 select-none whitespace-nowrap transition-colors duration-150">
                {c.label}{sortKey === c.key ? (sortAsc ? ' ▲' : ' ▼') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((ind, i) => {
            const origIdx = front.indexOf(ind);
            return (
              <tr key={i} onClick={() => onSelect(origIdx)} className={`border-b border-slate-50 dm-border hover:bg-brand-50 cursor-pointer transition-colors duration-100 stagger-row ${selected === origIdx ? 'bg-brand-50' : ''}`}>
                {columns.map(c => <td key={c.key} className="px-3 py-2 font-mono whitespace-nowrap tabular dm-text">{c.fmt(ind[c.key])}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function OptimizationMethodology() {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white dm-surface rounded-xl shadow-card border border-slate-100 dm-border overflow-hidden animate-fade-up">
      <button onClick={() => setOpen(!open)} className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors duration-150" aria-expanded={open}>
        <div>
          <h3 className="font-bold text-slate-900 dm-text">Optimization Methodology</h3>
          <p className="text-xs text-slate-500 dm-text-muted mt-0.5">NSGA-II algorithm details and objective definitions.</p>
        </div>
        <span className="text-slate-400 transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} aria-hidden="true">▼</span>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3 text-sm border-t border-slate-100 dm-border">
          <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg">
            <b className="text-purple-800">Algorithm: </b>NSGA-II (Non-dominated Sorting Genetic Algorithm II) — Deb, Pratap, Agarwal & Meyarivan, 2002
            <div className="text-xs text-purple-700 mt-1">Standard multi-objective evolutionary algorithm. Finds the Pareto front: the set of solutions where no objective can improve without degrading another.</div>
            <div className="text-xs text-purple-700 mt-1">Population: 60 · Max generations: 40 · Crossover: SBX (η=20) + uniform for categoricals · Mutation: polynomial (η=20) + random-reset · Elitism: NSGA-II survival selection.</div>
            <div className="text-xs text-purple-700 mt-1">Early stopping: halts if Pareto front quality (crowding sum) hasn't improved in 8 generations. Hard cap: 3000 total evaluations.</div>
            <div className="text-xs text-purple-700 mt-1">Grid carbon intensities: Approximate regional grid mix based on IEA data (kg CO₂/kWh). Manufacturing carbon: ~40 kg/panel, ~75 kg/kWh battery.</div>
          </div>
        </div>
      )}
    </div>
  );
}
