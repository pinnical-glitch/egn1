const SocChart = ({ results }) => {
  if (!results?.al?.soc) return null;
  const soc = results.al.soc;
  const capacity = results.us || 0;
  const critSoc = results.cl?.soc || [];
  if (capacity === 0 || soc.length === 0) return null;

  const hrs = Math.min(results.cfg?.hrs || soc.length, 72);
  const socAll = Array.from({ length: hrs }, (_, h) => soc[h % 24] || 0);
  const socCrit = Array.from({ length: hrs }, (_, h) => critSoc[h % 24] || 0);
  const maxSoc = Math.max(...socAll);
  const minSoc = Math.min(...socAll);
  const physics = results.al.physics;

  return (
    <div className="bg-white dm-surface rounded-xl shadow-card border border-slate-100 dm-border p-4 animate-fade-up">
      <h3 className="font-bold text-slate-900 dm-text mb-1">Battery State of Charge</h3>
      <p className="text-xs text-slate-500 dm-text-muted mb-3">SOC over {hrs}h. Peukert-adjusted capacity shown.</p>
      <div className="h-36 relative">
        <svg viewBox="0 0 600 140" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="soc-all-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          {socAll.map((v, i) => {
            const x = (i / (hrs - 1)) * 580 + 10;
            const h = (v / capacity) * 120;
            const critH = socCrit[i] ? (socCrit[i] / capacity) * 120 : 0;
            return (
              <g key={i}>
                <rect x={x - 2} y={130 - h} width={Math.max(1, 580 / hrs - 1)} height={h} fill="#f43f5e" opacity={0.3 + (v / capacity) * 0.7} rx={1} />
                {critH > 0 && (
                  <rect x={x - 2} y={130 - critH} width={Math.max(1, 580 / hrs - 1)} height={critH} fill="#e11d48" opacity={0.4} rx={1} />
                )}
              </g>
            );
          })}
          <line x1={10} y1={130} x2={590} y2={130} stroke="#e2e8f0" strokeWidth={1} />
        </svg>
      </div>
      <div className="flex justify-between text-[10px] text-slate-500 dm-text-muted mt-2 tabular">
        <span>Min: {minSoc.toFixed(1)} kWh</span>
        <span>Max: {maxSoc.toFixed(1)} kWh</span>
      </div>
      <div className="flex gap-4 text-[10px] text-slate-500 dm-text-muted mt-1">
        <span><span className="inline-block w-2 h-2 bg-crit-500 rounded mr-1" />All Loads</span>
        <span><span className="inline-block w-2 h-2 rounded mr-1" style={{ backgroundColor: '#e11d48' }} />Critical Only</span>
      </div>
      {physics && (
        <div className="text-[10px] text-slate-400 dm-text-muted mt-1 tabular">
          Temp derate: {(physics.tempD * 100).toFixed(1)}% · Max charge: {(physics.maxCh || 0).toFixed(0)}W · Max discharge: {(physics.maxDis || 0).toFixed(0)}W
        </div>
      )}
    </div>
  );
};

export default SocChart;
