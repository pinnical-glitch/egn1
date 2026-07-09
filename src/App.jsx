import { useState, useEffect, useRef } from 'react';
import { HomeForm, LoadsForm, SolarForm, BatteryForm, AdvancedPhysicsForm } from './components/forms';
import { ScorecardRow, SocChart, EnergyBalanceChart, SolarCurveChart, LoadBreakdownChart, AssumptionsPanel, CostVsResilience } from './components/dashboard';
import { OptimizeSetup, OptimizationProgress, ParetoExplorer, ParetoTable, OptimizationMethodology } from './components/dashboard/Optimize';
import { SettingsPanel } from './components/dashboard/SettingsPanel';
import { AIInsightsPanel } from './components/dashboard/AIInsightsPanel';
import { runSimulation, initPopulation, evaluateIndividual, buildObjective, fastNonDominatedSort, crowdingDistance, tournamentSelect, sbx, polyMut, calcCost, ORIS, CHEMS, getClimateZone } from './engine/index.js';
import { DEFAULT_APPLIANCES } from './engine/appliances.js';
import { configFromURL, autoSave, loadAutoSave } from './utils/configManager.js';

const DEFAULT_CFG_STATIC = {
  home: { cz: 'egypt_cairo', ht: 'sf', hrs: 72, bpm: 4 },
  loads: { apps: DEFAULT_APPLIANCES.slice(0, 8) },
  solar: { cnt: 10, w: 400, tilt: 30, ori: 'S' },
  battery: { cap: 10, chem: 'lfp', dod: 0.92, rte: 0.95 },
  advanced: { season: 'summer', cloud: 'typical' }
};

const STEPS = [
  { id: 'home', label: 'Home', description: 'Climate' },
  { id: 'loads', label: 'Loads', description: 'Appliances' },
  { id: 'solar', label: 'Solar', description: 'Panels' },
  { id: 'battery', label: 'Battery', description: 'Storage' },
  { id: 'advanced', label: 'Physics', description: 'Advanced', optional: true },
  { id: 'results', label: 'Results', description: 'Output' },
  { id: 'optimize', label: 'Optimize', description: 'Multi-Objective', optional: true },
];

const STEP_ICONS = {
  home: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>),
  loads: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>),
  solar: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>),
  battery: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21M4.5 10.5H18V15a2.25 2.25 0 01-2.25 2.25h-9A2.25 2.25 0 014.5 15v-4.5zM3.75 18h15A2.25 2.25 0 0021 15.75v-6a2.25 2.25 0 00-2.25-2.25h-15A2.25 2.25 0 001.5 9.75v6A2.25 2.25 0 003.75 18z" /></svg>),
  advanced: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>),
  results: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>),
  optimize: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.223z" /></svg>),
};

const GearIcon = ({ className }) => (
  <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PrinterIcon = ({ className }) => (
  <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.25 7.034l.008.002" />
  </svg>
);

export default function App() {
  const [step, setStep] = useState('home');
  const [sim, setSim] = useState(false);
  const [res, setRes] = useState(null);
  const [cfg, setCfg] = useState(() => {
    const urlCfg = configFromURL();
    if (urlCfg) return urlCfg;
    const autoSaved = loadAutoSave();
    if (autoSaved) return autoSaved;
    return DEFAULT_CFG_STATIC;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [settings, setSettings] = useState({ theme: 'auto', reduceMotion: false, compactNumbers: false });
  const [optState, setOptState] = useState({ running: false, gen: 0, maxGen: 40, frontSize: 0, bestCost: null, bestReliability: null, bestCarbon: null, bestSurvival: null, evaluations: 0, maxEvals: 3000, stopped: false, front: [], selected: null });
  const optTimerRef = useRef(null);
  const optCancelRef = useRef(false);
  const optCacheRef = useRef(new Map());

  const resetAll = () => {
    setCfg(DEFAULT_CFG_STATIC);
    setRes(null);
    setStep('home');
    setOptState(p => ({ ...p, running: false, front: [], selected: null, gen: 0, frontSize: 0, bestCost: null, bestReliability: null, bestCarbon: null, bestSurvival: null, evaluations: 0, stopped: false }));
  };

  const handleLoadConfig = (newCfg) => {
    setCfg(newCfg);
    setRes(null);
    setStep('home');
  };

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = settings.theme === 'dark' || (settings.theme === 'auto' && prefersDark);
      root.classList.toggle('dark', isDark);
    };
    applyTheme();
    if (settings.theme === 'auto' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const l = () => applyTheme();
      if (mq.addEventListener) { mq.addEventListener('change', l); return () => mq.removeEventListener('change', l); }
      else { mq.addListener(l); return () => mq.removeListener(l); }
    }
  }, [settings.theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('force-static-bg', settings.reduceMotion);
  }, [settings.reduceMotion]);

  useEffect(() => {
    autoSave(cfg);
  }, [cfg]);

  useEffect(() => {
    if (step === 'results') {
      setSim(true);
      setTimeout(() => {
        const z = getClimateZone(cfg.home.cz);
        try {
          const r = runSimulation({ apps: cfg.loads.apps, solar: cfg.solar, battery: cfg.battery, zone: z, hrs: cfg.home.hrs, bpy: cfg.home.bpm, adv: cfg.advanced });
          setRes(r);
        } catch (e) { console.error(e); }
        setSim(false);
      }, 400);
    }
  }, [step]);

  const generatePDFReport = () => {
    if (!res) return;
    const z = getClimateZone(cfg.home.cz);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups for this site to generate PDF.');
      return;
    }
    const costEstimate = calcCost(cfg.solar.cnt, cfg.solar.w, cfg.battery.cap, { solarPerW: 27.5, batPerKwh: 4000, bosPct: 17.5 });
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Energy Resilience Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b; padding: 40px; line-height: 1.6; }
    h1 { font-size: 28px; margin-bottom: 4px; color: #0f172a; }
    h2 { font-size: 18px; margin: 24px 0 12px; color: #1e40af; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
    .subtitle { color: #64748b; font-size: 13px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .card h3 { font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 8px; }
    .card .value { font-size: 28px; font-weight: 700; color: #0f172a; }
    .card .unit { font-size: 14px; color: #64748b; margin-left: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { font-weight: 600; color: #64748b; font-size: 11px; text-transform: uppercase; }
    .rec { border-left: 3px solid #3b82f6; padding: 10px 14px; margin: 8px 0; background: #f8fafc; border-radius: 0 6px 6px 0; }
    .rec.critical { border-left-color: #ef4444; }
    .rec.warning { border-left-color: #f59e0b; }
    .rec-title { font-weight: 600; font-size: 13px; }
    .rec-desc { font-size: 12px; color: #64748b; margin-top: 4px; }
    .footer { margin-top: 30px; padding-top: 16px; border-top: 2px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>Home Energy Resilience Report</h1>
  <p class="subtitle">Generated ${new Date().toLocaleDateString('en-EG', { year: 'numeric', month: 'long', day: 'numeric' })} | ${z.name || cfg.home.cz} | ${cfg.home.hrs}-hour blackout scenario</p>

  <h2>System Summary</h2>
  <div class="grid">
    <div class="card"><h3>Solar Array</h3><div class="value">${cfg.solar.cnt}<span class="unit">panels × ${cfg.solar.w}W</span></div></div>
    <div class="card"><h3>Battery Storage</h3><div class="value">${cfg.battery.cap}<span class="unit">kWh (${cfg.battery.chem.toUpperCase()})</span></div></div>
    <div class="card"><h3>Daily Solar Production</h3><div class="value">${(res.ds / 1000).toFixed(1)}<span class="unit">kWh/day</span></div></div>
    <div class="card"><h3>Daily Energy Demand</h3><div class="value">${(res.dD / 1000).toFixed(1)}<span class="unit">kWh/day</span></div></div>
    <div class="card"><h3>Blackout Survival (All Loads)</h3><div class="value">${res.al.dep.toFixed(1)}<span class="unit">hours</span></div></div>
    <div class="card"><h3>Estimated System Cost</h3><div class="value">EGP ${Math.round(costEstimate.total).toLocaleString()}</div></div>
  </div>

  <h2>Appliance Load Profile</h2>
  <table>
    <tr><th>Appliance</th><th>Power</th><th>Hours/Day</th><th>Daily Energy</th><th>Priority</th></tr>
    ${cfg.loads.apps.map(a => `<tr><td>${a.name}</td><td>${a.w}W</td><td>${a.h}h</td><td>${(a.w * a.h / 1000).toFixed(2)} kWh</td><td>${a.p}</td></tr>`).join('\n    ')}
  </table>

  <h2>Performance Metrics</h2>
  <div class="grid">
    <div class="card"><h3>Peak Load</h3><div class="value">${res.pL}<span class="unit">W</span></div></div>
    <div class="card"><h3>Total Connected Load</h3><div class="value">${res.tL}<span class="unit">W</span></div></div>
    <div class="card"><h3>Usable Battery Capacity</h3><div class="value">${res.us.toFixed(1)}<span class="unit">kWh</span></div></div>
    <div class="card"><h3>Orientation Derate</h3><div class="value">${(res.od * 100).toFixed(0)}<span class="unit">%</span></div></div>
    <div class="card"><h3>Battery Year at 80% Capacity</h3><div class="value">${res.dg.y80}<span class="unit">years</span></div></div>
    <div class="card"><h3>Battery Year at 50% Capacity</h3><div class="value">${res.dg.y50}<span class="unit">years</span></div></div>
  </div>

  <h2>Configuration Details</h2>
  <div class="grid">
    <div class="card"><h3>Climate Zone</h3><div style="font-size:14px">${z.name || cfg.home.cz}</div></div>
    <div class="card"><h3>Panel Tilt / Orientation</h3><div style="font-size:14px">${cfg.solar.tilt}° / ${cfg.solar.ori}</div></div>
    <div class="card"><h3>Battery DoD / RTE</h3><div style="font-size:14px">${(cfg.battery.dod * 100).toFixed(0)}% / ${(cfg.battery.rte * 100).toFixed(0)}%</div></div>
    <div class="card"><h3>Blackouts per Year</h3><div style="font-size:14px">${cfg.home.bpm}</div></div>
  </div>

  <div class="footer">
    Home Energy Resilience Planner | Estimates for planning only. Consult a certified installer for actual system design.
  </div>
</body>
</html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const runOptimizer = () => {
    optCancelRef.current = false;
    optCacheRef.current = new Map();
    const z = getClimateZone(cfg.home.cz);
    const costCfg = { solarPerW: 27.5, batPerKwh: 4000, bosPct: 17.5 };
    const fixedCfg = { apps: cfg.loads.apps, zone: z, hrs: cfg.home.hrs, bpy: cfg.home.bpm, adv: cfg.advanced, costCfg, panelWatts: cfg.solar.w };
    const popSize = 60;
    const maxGen = 40;
    const maxEvals = 3000;
    let population = initPopulation(popSize);
    let gen = 0;
    let evalCount = 0;
    let lastHvImprove = 0;

    const evaluateWithCache = (ind) => {
      const key = ind.panelCount + '_' + ind.batteryKwh.toFixed(1) + '_' + ind.batteryChem + '_' + ind.tilt + '_' + ind.orientation;
      if (optCacheRef.current.has(key)) return optCacheRef.current.get(key);
      const ev = evaluateIndividual(ind, fixedCfg);
      ev.obj = buildObjective(ev);
      optCacheRef.current.set(key, ev);
      evalCount++;
      return ev;
    };

    population.forEach(ind => { ind.ev = evaluateWithCache(ind); ind.obj = ind.ev.obj; });

    const runGeneration = () => {
      if (optCancelRef.current || gen >= maxGen || evalCount >= maxEvals) {
        const fronts = fastNonDominatedSort(population);
        const front1 = fronts[0] || [];
        const bestFront = front1.map(i => ({ ...population[i], ...population[i].ev }));
        const deduped = [];
        for (const ind of bestFront) {
          if (!deduped.some(d => { const dist = Math.sqrt(d.obj.reduce((s, v, i) => s + Math.pow(v - ind.obj[i], 2), 0) / 4); return dist < 0.02; })) {
            deduped.push(ind);
          }
        }
        setOptState(p => ({ ...p, running: false, gen, maxGen, frontSize: deduped.length, front: deduped, stopped: optCancelRef.current || evalCount >= maxEvals }));
        return;
      }
      const offspring = [];
      for (let i = 0; i < popSize; i++) {
        const p1 = tournamentSelect(population), p2 = tournamentSelect(population);
        const child = { ...JSON.parse(JSON.stringify(population[p1])) };
        if (Math.random() < 0.9) {
          child.panelCount = Math.round(sbx(child.panelCount, population[p2].panelCount));
          child.batteryKwh = Math.round(sbx(child.batteryKwh, population[p2].batteryKwh) * 2) / 2;
          child.tilt = Math.round(sbx(child.tilt, population[p2].tilt));
          if (Math.random() < 0.5) child.batteryChem = population[p2].batteryChem;
          if (Math.random() < 0.5) child.orientation = population[p2].orientation;
        }
        const mutRate = 1 / 5;
        if (Math.random() < mutRate) child.panelCount = Math.max(0, Math.min(40, Math.round(polyMut(child.panelCount, 0, 40))));
        if (Math.random() < mutRate) child.batteryKwh = Math.max(0, Math.min(40, Math.round(polyMut(child.batteryKwh, 0, 40) * 2) / 2));
        if (Math.random() < mutRate) child.tilt = Math.max(0, Math.min(90, Math.round(polyMut(child.tilt, 0, 90))));
        if (Math.random() < mutRate) child.batteryChem = CHEMS[Math.floor(Math.random() * 2)];
        if (Math.random() < mutRate) child.orientation = ORIS[Math.floor(Math.random() * 6)];
        child.ev = evaluateWithCache(child);
        child.obj = child.ev.obj;
        offspring.push(child);
      }
      const combined = [...population, ...offspring];
      const fronts = fastNonDominatedSort(combined);
      const newPop = [];
      for (const front of fronts) {
        if (newPop.length + front.length <= popSize) {
          crowdingDistance(combined, front);
          front.forEach(i => newPop.push(combined[i]));
        } else {
          crowdingDistance(combined, front);
          const remaining = popSize - newPop.length;
          const sorted = [...front].sort((a, b) => combined[b].cd - combined[a].cd);
          for (let i = 0; i < remaining; i++) newPop.push(combined[sorted[i]]);
          break;
        }
      }
      population = newPop;
      gen++;
      const f1 = fronts[0] || [];
      const hvSum = f1.reduce((s, i) => s + (combined[i].cd || 0), 0);
      if (hvSum > lastHvImprove + 0.001) { lastHvImprove = hvSum; lastHvImprove = gen; }
      if (gen - lastHvImprove >= 8) optCancelRef.current = true;
      const bestCost = Math.min(...population.map(p => p.ev.cost));
      const bestReliability = Math.max(...population.map(p => p.ev.reliability));
      const bestCarbon = Math.min(...population.map(p => p.ev.carbon));
      const bestSurvival = Math.max(...population.map(p => p.ev.survival));
      setOptState(p => ({ ...p, gen, maxGen, frontSize: f1.length, bestCost, bestReliability, bestCarbon, bestSurvival, evaluations: evalCount, maxEvals, running: true }));
      optTimerRef.current = setTimeout(runGeneration, 0);
    };
    setOptState(p => ({ ...p, running: true, gen: 0, maxGen, frontSize: 0, bestCost: null, bestReliability: null, bestCarbon: null, bestSurvival: null, evaluations: 0, maxEvals, stopped: false, front: [], selected: null }));
    optTimerRef.current = setTimeout(runGeneration, 0);
  };

  const cancelOptimizer = () => {
    optCancelRef.current = true;
    if (optTimerRef.current) clearTimeout(optTimerRef.current);
  };

  const applyOptimized = (ind) => {
    const newSolar = { cnt: ind.panelCount, w: cfg.solar.w, tilt: ind.tilt, ori: ind.orientation };
    const newBattery = { cap: ind.batteryKwh, chem: ind.batteryChem, dod: ind.batteryChem === 'lfp' ? 0.92 : 0.50, rte: ind.batteryChem === 'lfp' ? 0.95 : 0.82 };
    setCfg(p => ({ ...p, solar: newSolar, battery: newBattery }));
    setStep('results');
  };

  const u = (s, v) => setCfg(p => ({ ...p, [s]: v }));
  const idx = STEPS.findIndex(x => x.id === step);
  const nxt = () => { if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id); };
  const prv = () => { if (idx > 0) setStep(STEPS[idx - 1].id); };

  let content = null;
  if (step === 'home') content = <HomeForm cfg={cfg.home} set={v => u('home', v)} />;
  else if (step === 'loads') content = <LoadsForm cfg={cfg.loads} set={v => u('loads', v)} />;
  else if (step === 'solar') content = <SolarForm cfg={cfg.solar} set={v => u('solar', v)} />;
  else if (step === 'battery') content = <BatteryForm cfg={cfg.battery} set={v => u('battery', v)} />;
  else if (step === 'advanced') content = <AdvancedPhysicsForm cfg={cfg.advanced} set={v => u('advanced', v)} chem={cfg.battery.chem} />;
  else if (step === 'results') {
    if (sim) {
      content = (
        <div className="flex flex-col items-center py-16 animate-fade-up">
          <div className="w-12 h-12 mb-4 border-4 border-brand-200 border-t-brand-600 rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
          <p className="text-slate-600 dm-text font-medium">Running simulation...</p>
        </div>
      );
    } else if (res) {
      content = (
        <div className="space-y-5" aria-live="polite">
          <ScorecardRow results={res} compact={settings.compactNumbers ? false : true} />
          <SocChart results={res} />
          <EnergyBalanceChart results={res} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SolarCurveChart results={res} />
            <LoadBreakdownChart results={res} />
          </div>
          <CostVsResilience r={res} cfg={cfg} />
          <AssumptionsPanel results={res} />
        </div>
      );
    }
  } else if (step === 'optimize') {
    content = (
      <div className="space-y-5">
        {!optState.running && optState.front.length === 0 && <OptimizeSetup config={cfg} r={res} onRun={runOptimizer} />}
        {optState.running && <OptimizationProgress state={optState} onCancel={cancelOptimizer} />}
        {optState.front.length > 0 && (
          <div className="space-y-5">
            <ParetoExplorer front={optState.front} cfg={cfg} res={res} selected={optState.selected} onSelect={i => setOptState(p => ({ ...p, selected: i }))} onApply={applyOptimized} />
            <ParetoTable front={optState.front} selected={optState.selected} onSelect={i => setOptState(p => ({ ...p, selected: i }))} />
          </div>
        )}
        <OptimizationMethodology />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col relative z-10">
      {settingsOpen && <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} setSettings={setSettings} config={cfg} onReset={resetAll} onLoadConfig={handleLoadConfig} />}
      {insightsOpen && <AIInsightsPanel results={res} config={cfg} onClose={() => setInsightsOpen(false)} />}
      <header className="bg-white/90 dm-surface backdrop-blur-sm border-b border-slate-100 dm-border shadow-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2.5 bg-brand-600 rounded-xl text-white shadow-card">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-900 dm-text truncate">Home Energy Resilience Planner</h1>
            <p className="text-xs text-slate-500 dm-text-muted">Phase 5: Multi-Objective Optimization</p>
          </div>
          <button onClick={() => setInsightsOpen(true)} aria-label="Open AI insights" className={`p-2.5 rounded-xl transition-colors duration-150 flex-shrink-0 ${res ? 'text-brand-600 hover:text-brand-700 hover:bg-brand-50 dm-surface-2' : 'text-slate-400 cursor-not-allowed'}`} disabled={!res}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.223z" />
            </svg>
          </button>
          <button onClick={() => setSettingsOpen(true)} aria-label="Open settings" className="p-2.5 rounded-xl text-slate-500 dm-text-muted hover:text-brand-700 hover:bg-slate-100 dm-surface-2 transition-colors duration-150 flex-shrink-0">
            <GearIcon />
          </button>
        </div>
      </header>
      <nav className="bg-white/90 dm-surface backdrop-blur-sm border-b border-slate-100 dm-border sticky top-[73px] z-10" aria-label="Progress">
        <div className="max-w-6xl mx-auto px-4 py-2 flex overflow-x-auto gap-1.5">
          {STEPS.map((s, i) => {
            const cur = step === s.id;
            const done = idx > i;
            const ok = i <= idx + 1;
            const cls = cur ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200" : done ? "bg-bat-50 text-bat-700" : ok ? "hover:bg-slate-100 text-slate-600" : "text-slate-300 cursor-not-allowed";
            const nc = cur ? "bg-brand-600 text-white" : done ? "bg-bat-500 text-white" : "bg-slate-200 text-slate-500";
            return (
              <button key={s.id} onClick={() => ok && setStep(s.id)} disabled={!ok} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${cls}`}>
                <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold ${nc}`}>
                  {done ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> : STEP_ICONS[s.id] || (i + 1)}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
                {s.optional && <span className="text-[9px] px-1 py-0.5 rounded bg-slate-200 dm-surface-2 text-slate-500 dm-text-muted font-medium">opt</span>}
              </button>
            );
          })}
        </div>
      </nav>
      <main id="main-content" className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full">
        <div key={step} className="bg-white dm-surface rounded-2xl shadow-elevated border border-slate-100 dm-border p-6 animate-fade-up">
          {content}
        </div>
        <div className="flex justify-between mt-5">
          <button onClick={prv} disabled={step === 'home'} className={`px-4 py-2.5 rounded-xl font-semibold text-sm ${step === 'home' ? 'bg-slate-100 dm-surface-2 text-slate-400 cursor-not-allowed' : 'bg-slate-100 dm-surface-2 text-slate-700 dm-text hover:bg-slate-200 transition-colors duration-150'}`}>← Back</button>
          {(step === 'battery' || step === 'advanced') ? (
            <button onClick={() => setStep('results')} className="px-5 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 text-sm shadow-card hover:shadow-elevated transition-all duration-200">Run Simulation →</button>
          ) : step === 'results' ? (
            <div className="flex gap-2">
              <button onClick={generatePDFReport} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 text-sm shadow-card hover:shadow-elevated transition-all duration-200"><PrinterIcon /> Print Report</button>
              <button onClick={() => setStep('optimize')} className="px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 text-sm shadow-card hover:shadow-elevated transition-all duration-200">Optimize →</button>
              <button onClick={resetAll} className="px-5 py-2.5 bg-slate-600 text-white font-semibold rounded-xl hover:bg-slate-700 text-sm transition-colors duration-150">Start Over</button>
            </div>
          ) : step === 'optimize' ? (
            <div className="flex gap-2">
              <button onClick={() => setStep('results')} className="px-5 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 text-sm shadow-card hover:shadow-elevated transition-all duration-200">← Back to Results</button>
              <button onClick={resetAll} className="px-5 py-2.5 bg-slate-600 text-white font-semibold rounded-xl hover:bg-slate-700 text-sm transition-colors duration-150">Start Over</button>
            </div>
          ) : (
            <button onClick={nxt} className="px-5 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 text-sm shadow-card hover:shadow-elevated transition-all duration-200">Next →</button>
          )}
        </div>
      </main>
      <footer className="bg-white/90 dm-surface backdrop-blur-sm border-t border-slate-100 dm-border text-center py-3 text-xs text-slate-400 dm-text-muted">
        Estimates for planning. Consult a certified installer.
      </footer>
    </div>
  );
}
