import { useState, useEffect } from 'react';
import { getClimateZone, calcCost } from '../../engine/index.js';

const INSIGHT_ICONS = {
  battery: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21M4.5 10.5H18V15a2.25 2.25 0 01-2.25 2.25h-9A2.25 2.25 0 014.5 15v-4.5zM3.75 18h15A2.25 2.25 0 0021 15.75v-6a2.25 2.25 0 00-2.25-2.25h-15A2.25 2.25 0 001.5 9.75v6A2.25 2.25 0 003.75 18z" />
    </svg>
  ),
  solar: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  ),
  efficiency: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  cost: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  schedule: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  tip: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  critical: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  )
};

const SEVERITY_STYLES = {
  critical: { bg: 'bg-gradient-to-r from-red-50 to-orange-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', icon: 'text-red-500' },
  warning: { bg: 'bg-gradient-to-r from-amber-50 to-yellow-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', icon: 'text-amber-500' },
  info: { bg: 'bg-gradient-to-r from-blue-50 to-cyan-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', icon: 'text-blue-500' },
  success: { bg: 'bg-gradient-to-r from-emerald-50 to-green-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', icon: 'text-emerald-500' }
};

const EFFORT_LABELS = { low: { text: 'Easy', color: 'bg-emerald-100 text-emerald-700' }, medium: { text: 'Moderate', color: 'bg-amber-100 text-amber-700' }, high: { text: 'Complex', color: 'bg-red-100 text-red-700' } };

function ScoreRing({ score, size = 48 }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth="4" />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

function InsightCard({ insight, index }) {
  const [expanded, setExpanded] = useState(false);
  const style = SEVERITY_STYLES[insight.severity] || SEVERITY_STYLES.info;
  const icon = INSIGHT_ICONS[insight.category] || INSIGHT_ICONS.tip;

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} overflow-hidden transition-all duration-200 hover:shadow-md`} style={{ animationDelay: `${index * 60}ms` }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full px-4 py-3 flex items-start gap-3 text-left">
        <div className={`mt-0.5 ${style.icon}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${style.badge}`}>{insight.severity}</span>
            {insight.impact && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{insight.impact}</span>}
          </div>
          <h4 className="font-semibold text-slate-900 text-sm leading-tight">{insight.title}</h4>
          {!expanded && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{insight.summary}</p>}
        </div>
        <svg className={`w-4 h-4 text-slate-400 mt-1 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/50">
          <p className="text-xs text-slate-600 leading-relaxed mt-3">{insight.description}</p>
          {insight.actions && insight.actions.length > 0 && (
            <div className="space-y-2">
              {insight.actions.map((action, i) => (
                <div key={i} className="bg-white/70 rounded-lg p-3 border border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-800">{action.label}</p>
                      {action.projectedImpact && <p className="text-[11px] text-slate-500 mt-0.5">{action.projectedImpact}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {action.effort && <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${EFFORT_LABELS[action.effort]?.color || ''}`}>{EFFORT_LABELS[action.effort]?.text}</span>}
                      {action.costEstimate != null && action.costEstimate > 0 && <span className="text-[10px] font-mono text-slate-600">EGP {Math.round(action.costEstimate).toLocaleString()}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AIInsightsPanel({ results, config, onClose }) {
  const [insights, setInsights] = useState([]);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!results) return;
    setLoading(true);
    setTimeout(() => {
      const generated = generateInsights(results, config);
      setInsights(generated.insights);
      setScore(generated.score);
      setLoading(false);
    }, 300);
  }, [results, config]);

  const criticalCount = insights.filter(i => i.severity === 'critical').length;
  const warningCount = insights.filter(i => i.severity === 'warning').length;
  const infoCount = insights.filter(i => i.severity === 'info' || i.severity === 'success').length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl overflow-hidden animate-slide-in-right flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-brand-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-600 rounded-xl text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.223z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-slate-900">AI Insights</h2>
              <p className="text-xs text-slate-500">Smart recommendations for your system</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-4">
            <ScoreRing score={score} size={56} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900">System Health Score</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {score >= 80 ? 'Your system is well-configured!' : score >= 60 ? 'Good, but room for improvement.' : 'Several issues need attention.'}
              </p>
              <div className="flex gap-3 mt-2">
                {criticalCount > 0 && <span className="text-[10px] font-bold text-red-600">{criticalCount} critical</span>}
                {warningCount > 0 && <span className="text-[10px] font-bold text-amber-600">{warningCount} warnings</span>}
                {infoCount > 0 && <span className="text-[10px] font-bold text-blue-600">{infoCount} tips</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center py-12">
              <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
              <p className="text-sm text-slate-500 mt-3">Analyzing your system...</p>
            </div>
          ) : insights.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">All Clear!</h3>
              <p className="text-sm text-slate-500 text-center mt-1">Your system is optimized. No issues found.</p>
            </div>
          ) : (
            insights.map((insight, i) => <InsightCard key={insight.id || i} insight={insight} index={i} />)
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-[10px] text-slate-400 text-center">Powered by physics-based simulation engine</p>
        </div>
      </div>
    </div>
  );
}

function generateInsights(res, config) {
  const insights = [];
  let score = 100;

  if (!res || !res.cfg || !res.cfg.apps || !res.cfg.apps.length) {
    return { insights: [], score: 50 };
  }

  const rCfg = res.cfg;
  const hrs = rCfg.hrs || 72;
  const apps = rCfg.apps;
  const dD = res.dD;
  const ds = res.ds;

  // Battery depletion insight
  if (res.al.dep < hrs) {
    const depH = res.al.dep;
    const deficitHrs = hrs - depH;
    score -= 20;
    
    const loadH = new Array(24).fill(dD / 24);
    const costCfg = { solarPerW: 27.5, batPerKwh: 4000, bosPct: 17.5 };
    const overnightHours = [];
    for (let h = 0; h < 24; h++) { if ((res.sc[h] || 0) < 5) overnightHours.push(h); }
    const deficitByH = loadH.map((l, h) => Math.max(0, l - (res.sc[h] || 0)));
    const avgDeficitW = deficitByH.reduce((a, v) => a + v, 0) / 24;
    const neededKwh = Math.max(0.5, Math.ceil((deficitHrs * avgDeficitW / 1000) * 2) / 2);
    
    const appContrib = apps.map(a => ({ ...a, overnightWh: a.w * (a.h / 24) * overnightHours.length })).sort((a, b) => b.overnightWh - a.overnightWh);
    const topApp = appContrib[0];
    
    let projectedAllDep = depH;
    try {
      const ch = getClimateZone ? null : null;
      const batCost = calcCost(0, 0, neededKwh, costCfg);
      insights.push({
        id: 'battery-depletion',
        severity: 'critical',
        category: 'battery',
        title: 'Battery won\'t last the full blackout',
        summary: `Battery depletes after ${depH.toFixed(0)} hours — ${deficitHrs.toFixed(0)} hours short of your ${hrs}h target.`,
        description: `Your battery reaches minimum state of charge after ${depH.toFixed(1)} hours, leaving a ${deficitHrs.toFixed(1)}-hour gap. The overnight energy deficit averages ~${Math.round(avgDeficitW)}W when solar production drops to zero.${topApp ? ' Your biggest overnight drain is ' + topApp.name + ' at ' + topApp.overnightWh.toFixed(0) + ' Wh.' : ''}`,
        impact: `-${deficitHrs.toFixed(0)}h`,
        actions: [
          { label: `Add ${neededKwh.toFixed(1)} kWh battery capacity`, projectedImpact: `Extends survival to ~${projectedAllDep.toFixed(0)}h`, effort: 'high', costEstimate: batCost.total },
          { label: 'Shed non-critical loads overnight', projectedImpact: `Critical-only loads survive ${res.cl.dep.toFixed(0)}h`, effort: 'low', costEstimate: 0 }
        ]
      });
    } catch (e) {}
  }

  // Solar production insight
  if (ds < dD) {
    const gapWh = dD - ds;
    const panelW = rCfg.solar ? rCfg.solar.w : 400;
    const adjPSH = res.adjPSH || 4.5;
    const additionalPanels = Math.ceil(gapWh / (panelW * adjPSH * 0.86));
    score -= 15;
    
    if (additionalPanels > 0 && additionalPanels < 50) {
      const solCost = calcCost(additionalPanels, panelW, 0, { solarPerW: 27.5, batPerKwh: 4000, bosPct: 17.5 });
      insights.push({
        id: 'solar-shortfall',
        severity: ds < dD * 0.5 ? 'critical' : 'warning',
        category: 'solar',
        title: 'Solar production falls short of demand',
        summary: `${(ds/1000).toFixed(1)} kWh/day production vs ${(dD/1000).toFixed(1)} kWh/day demand.`,
        description: `Your panels produce ${ds.toFixed(0)} Wh/day against a daily demand of ${dD.toFixed(0)} Wh — a ${gapWh.toFixed(0)} Wh shortfall that drains the battery each cycle. This creates a cumulative energy deficit that limits blackout endurance.`,
        impact: `-${(gapWh/1000).toFixed(1)} kWh/day`,
        actions: [
          { label: `Add ${additionalPanels} panel${additionalPanels > 1 ? 's' : ''} (${(additionalPanels * panelW / 1000).toFixed(1)} kW)`, projectedImpact: `Closes the daily gap, extends survival`, effort: 'high', costEstimate: solCost.total }
        ]
      });
    }
  }

  // Orientation insight
  if (res.od < 0.92) {
    score -= 5;
    const bestD = 1.0;
    const lostPct = ((1 - res.od / bestD) * 100).toFixed(0);
    insights.push({
      id: 'orientation',
      severity: 'info',
      category: 'solar',
      title: 'Panel orientation could be optimized',
      summary: `Currently at ${(res.od * 100).toFixed(0)}% efficiency. South-facing at 30° achieves 100%.`,
      description: `Your ${rCfg.solar ? rCfg.solar.ori : '?'}/${rCfg.solar ? rCfg.solar.tilt : '?'} setup achieves ${(res.od * 100).toFixed(0)}% orientation derate. Adjusting to south-facing at 30° tilt would recover ~${lostPct}% of orientation losses — a free performance boost.`,
      impact: `+${lostPct}% output`,
      actions: [
        { label: 'Adjust tilt to ~30° and face panels south', projectedImpact: `Recovers ~${lostPct}% of orientation loss`, effort: 'medium', costEstimate: null }
      ]
    });
  }

  // High consumption appliance insight
  if (dD > 0) {
    const highLoad = apps.filter(a => (a.w * a.h) / dD > 0.25).sort((a, b) => (b.w * b.h) - (a.w * a.h));
    highLoad.forEach(a => {
      const pct = ((a.w * a.h / dD) * 100).toFixed(0);
      score -= 5;
      insights.push({
        id: 'high-consumption-' + a.id,
        severity: 'warning',
        category: 'efficiency',
        title: `${a.name} dominates your energy budget`,
        summary: `Uses ${pct}% of daily energy (${(a.w * a.h / 1000).toFixed(1)} kWh/day).`,
        description: `${a.name} consumes ${(a.w * a.h).toFixed(0)} Wh/day out of ${dD.toFixed(0)} Wh total — that's ${pct}% of your entire energy budget. This single appliance significantly impacts your blackout endurance.`,
        impact: `${pct}% of load`,
        actions: [
          { label: `Replace with efficient model or reduce to ${Math.ceil(a.h * 0.7)}h/day`, projectedImpact: `Could save ~${(a.w * a.h * 0.3).toFixed(0)} Wh/day`, effort: 'medium', costEstimate: null }
        ]
      });
    });
  }

  // Load shifting opportunity
  if (res.al.dep < hrs) {
    const schedulable = apps.filter(a => a.p !== 'Critical' && !a.m && a.w * a.h > 50).sort((a, b) => (b.w * b.h) - (a.w * a.h));
    if (schedulable.length > 0) {
      const top = schedulable[0];
      const dayl = { sunrise: 6, sunset: 20 };
      const shiftWh = top.w * top.h;
      score += 3;
      insights.push({
        id: 'load-shift-' + top.id,
        severity: 'info',
        category: 'schedule',
        title: `Shift ${top.name} to daylight hours`,
        summary: `Running ${top.name} during solar hours saves ~${(shiftWh * 0.3).toFixed(0)} Wh battery drain.`,
        description: `${top.name} uses ${shiftWh.toFixed(0)} Wh/day. Moving its runtime to ${dayl.sunrise}:00–${dayl.sunset}:00 when solar is available reduces overnight battery draw by ~${(shiftWh * 0.5).toFixed(0)} Wh, extending your blackout endurance.`,
        impact: `Free`,
        actions: [
          { label: `Run ${top.name} between ${dayl.sunrise}:00 and ${dayl.sunset}:00`, projectedImpact: `Reduces overnight battery drain by ~${(shiftWh * 0.5).toFixed(0)} Wh`, effort: 'low', costEstimate: 0 }
        ]
      });
    }
  }

  // Critical load fallback insight
  if (res.cl.dep >= hrs && res.al.dep < hrs) {
    score += 5;
    insights.push({
      id: 'critical-only',
      severity: 'success',
      category: 'tip',
      title: 'Critical loads alone survive the full blackout',
      summary: `Running only critical loads extends survival to ${res.cl.dep.toFixed(0)}h — enough for your ${hrs}h target.`,
      description: `Your critical loads alone consume only ${(res.cl.dep > 0 ? (res.us * 1000 / res.cl.dep).toFixed(0) : 0)}W average, which your battery and solar can sustain for ${res.cl.dep.toFixed(0)} hours. With a load-shedding plan, you can survive the full ${hrs}-hour blackout without any hardware investment.`,
      impact: `$0 cost`,
      actions: [
        { label: 'Create a load-shedding priority list', projectedImpact: `Survives full ${hrs}h blackout at zero cost`, effort: 'low', costEstimate: 0 }
      ]
    });
  }

  // System is healthy
  if (insights.length === 0) {
    score = 95;
    insights.push({
      id: 'system-good',
      severity: 'success',
      category: 'check',
      title: 'System is well-sized for your blackout scenario',
      summary: `Your ${rCfg.solar.cnt}-panel, ${rCfg.battery.cap}-kWh system covers the ${hrs}h blackout.`,
      description: `Your solar array and battery are well-matched to your load profile. The system survives the full ${hrs}-hour blackout with margin. Keep an eye on battery degradation over time — consider re-running this analysis annually.`,
      impact: 'Optimal',
      actions: []
    });
  }

  // Sort by severity
  const sevOrder = { critical: 0, warning: 1, info: 2, success: 3 };
  insights.sort((a, b) => (sevOrder[a.severity] || 2) - (sevOrder[b.severity] || 2));

  return { insights: insights.slice(0, 8), score: Math.max(0, Math.min(100, score)) };
}

export default AIInsightsPanel;
