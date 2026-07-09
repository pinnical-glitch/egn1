import { useState } from 'react';
import { DEFAULT_APPLIANCES } from '../../engine/appliances.js';

function PrioBadge({ p }) {
  if (p === 'Critical') return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-crit-100 text-crit-700 font-semibold">Critical</span>;
  if (p === 'Important') return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-imp-100 text-imp-600 font-semibold">Important</span>;
  return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dm-surface-2 text-slate-500 dm-text-muted font-medium">Optional</span>;
}

export default function LoadsForm({ cfg, set }) {
  const [showA, setShowA] = useState(false);
  const [nw, setNw] = useState({ n: '', w: '', s: '', h: '', p: 'Optional', c: 'Other' });
  const sel = cfg.apps;

  const tog = id => {
    const a = DEFAULT_APPLIANCES.find(x => x.id === id);
    set({ ...cfg, apps: sel.some(x => x.id === id) ? sel.filter(x => x.id !== id) : [...sel, a] });
  };
  const rm = id => set({ ...cfg, apps: sel.filter(x => x.id !== id) });
  const add = () => {
    if (!nw.n || !nw.w || !nw.h) return;
    set({ ...cfg, apps: [...sel, { id: 'c' + Date.now(), name: nw.n, w: +nw.w, s: +nw.s || +nw.w, h: +nw.h, p: nw.p, cat: nw.c, m: (+nw.s || 0) > +nw.w * 1.5 }] });
    setNw({ n: '', w: '', s: '', h: '', p: 'Optional', c: 'Other' });
    setShowA(false);
  };
  const grp = DEFAULT_APPLIANCES.reduce((a, x) => { (a[x.cat] = a[x.cat] || []).push(x); return a; }, {});

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h3 className="text-xl font-bold text-slate-900 dm-text">Electrical Loads</h3>
        <p className="text-sm text-slate-500 dm-text-muted mt-1">Select appliances for simulation.</p>
      </div>
      <div className="p-3 bg-slate-50 dm-surface-2 border border-slate-100 dm-border rounded-xl">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-slate-700 dm-text">Selected: {sel.length}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sel.length === 0 && <span className="text-xs text-slate-400 dm-text-muted">None</span>}
          {sel.map(a => (
            <span key={a.id} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 ${a.p === 'Critical' ? 'bg-crit-100 text-crit-700' : a.p === 'Important' ? 'bg-imp-100 text-imp-600' : 'bg-slate-100 dm-surface-2 text-slate-600 dm-text-muted'}`}>
              {a.name}
              <button onClick={() => rm(a.id)} className="ml-0.5 hover:text-crit-500 transition-colors duration-100" aria-label={`Remove ${a.name}`}>×</button>
            </span>
          ))}
        </div>
      </div>
      {Object.entries(grp).map(([cat, apps]) => (
        <div key={cat}>
          <h4 className="text-xs font-bold text-slate-400 dm-text-muted uppercase tracking-wider mb-2">{cat}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {apps.map(a => {
              const on = sel.some(x => x.id === a.id);
              return (
                <label key={a.id} className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-150 ${on ? 'border-brand-400 bg-brand-50 shadow-card' : 'border-slate-100 dm-border bg-white dm-surface hover:border-slate-200 hover:shadow-card'}`}>
                  <input type="checkbox" checked={on} onChange={() => tog(a.id)} className="h-4 w-4 text-brand-600 rounded border-slate-300 dm-border focus:ring-brand-500 mr-3" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm text-slate-900 dm-text truncate">{a.name}</span>
                      <PrioBadge p={a.p} />
                    </div>
                    <div className="text-[11px] text-slate-500 dm-text-muted mt-0.5 tabular">{a.w}W · {a.s}W surge · {a.h}h/day</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      ))}
      <div className="border-t border-slate-100 dm-border pt-4">
        {!showA ? (
          <button onClick={() => setShowA(true)} className="text-brand-600 text-sm font-semibold hover:text-brand-700 transition-colors duration-150">+ Add Custom</button>
        ) : (
          <div className="p-4 bg-slate-50 dm-surface-2 border border-slate-100 dm-border rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-600 dm-text-muted">Name</label>
                <input type="text" value={nw.n} onChange={e => setNw({ ...nw, n: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 dm-border rounded-lg bg-white dm-surface focus:ring-2 focus:ring-brand-500 focus:border-brand-500" placeholder="Device name" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dm-text-muted">Watts</label>
                <input type="number" value={nw.w} onChange={e => setNw({ ...nw, w: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 dm-border rounded-lg bg-white dm-surface focus:ring-2 focus:ring-brand-500 focus:border-brand-500" min={1} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dm-text-muted">Surge</label>
                <input type="number" value={nw.s} onChange={e => setNw({ ...nw, s: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 dm-border rounded-lg bg-white dm-surface focus:ring-2 focus:ring-brand-500 focus:border-brand-500" placeholder="Same" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dm-text-muted">Hrs/day</label>
                <input type="number" value={nw.h} onChange={e => setNw({ ...nw, h: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 dm-border rounded-lg bg-white dm-surface focus:ring-2 focus:ring-brand-500 focus:border-brand-500" min={0} max={24} step={0.5} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dm-text-muted">Priority</label>
                <select value={nw.p} onChange={e => setNw({ ...nw, p: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 dm-border rounded-lg bg-white dm-surface focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                  <option>Critical</option><option>Important</option><option>Optional</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={add} className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors duration-150">Add</button>
              <button onClick={() => setShowA(false)} className="px-4 py-2 bg-slate-200 dm-surface-2 text-slate-700 dm-text text-sm font-medium rounded-lg hover:bg-slate-300 transition-colors duration-150">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
