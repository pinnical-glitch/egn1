/**
 * Energy Resilience Engine - Main Export - Matching all.html
 */

import { calculateTotalConnectedLoad, calculatePeakLoad, calculateDailyEnergyDemand, calculateEnergyDemandByPriority, calculateLoadBreakdownByCategory } from './loads.js';
import { calculateTempDerate, calculateCellTemperature, getTiltOrientationDerate, calculateEffectiveArrayPower, calculateEffectiveArrayPowerLegacy, calculateDailySolarEnergy, generateHourlySolarCurve, applySeasonalMultiplier, applyCloudAttenuation, getSeasonalDaylightHours, SEASONAL_MULTIPLIERS, CLOUD_SCENARIOS, DEFAULT_SUB_DERATES } from './solar.js';
import { getBatteryChemistry, calculateUsableCapacity, simulateSOC, calculateDegradation, calculatePeukertAdjustedCapacity, calculateCRateLimit, calculateBatteryTempDerate, calculateCalendarAging, calculateCombinedDegradation } from './battery.js';
import { CLIMATE_ZONES, getClimateZone, getDefaultClimateZone } from './climateZones.js';
import { DEFAULT_APPLIANCES, PRIORITIES, CATEGORIES, createAppliance } from './appliances.js';

export {
  calculateTotalConnectedLoad, calculatePeakLoad, calculateDailyEnergyDemand,
  calculateEnergyDemandByPriority, calculateLoadBreakdownByCategory,
  calculateTempDerate, calculateCellTemperature, getTiltOrientationDerate,
  calculateEffectiveArrayPower, calculateEffectiveArrayPowerLegacy, calculateDailySolarEnergy,
  generateHourlySolarCurve, applySeasonalMultiplier, applyCloudAttenuation,
  getSeasonalDaylightHours, SEASONAL_MULTIPLIERS, CLOUD_SCENARIOS, DEFAULT_SUB_DERATES,
  getBatteryChemistry, calculateUsableCapacity, simulateSOC, calculateDegradation,
  calculatePeukertAdjustedCapacity, calculateCRateLimit, calculateBatteryTempDerate,
  calculateCalendarAging, calculateCombinedDegradation,
  DEFAULT_APPLIANCES, PRIORITIES, CATEGORIES, createAppliance,
  CLIMATE_ZONES, getClimateZone, getDefaultClimateZone,
};

export function calcCost(panels, pw, batKwh, cfg = {}) {
  const sCost = cfg.solarPerW || 27.5;
  const bCost = cfg.batPerKwh || 4000;
  const bos = cfg.bosPct || 17.5;
  const solar = panels * pw * sCost;
  const battery = batKwh * bCost;
  const sub = solar + battery;
  return { solar, battery, bos: sub * bos / 100, total: sub + sub * bos / 100 };
}

export function estSurvival(panels, pw, batKwh, cfg = {}) {
  const avgW = cfg.avgLoad || 500;
  const solarWh = panels * pw * 4.5 * 0.86;
  const batH = (batKwh * 1000) / avgW;
  const solH = solarWh / avgW;
  return Math.min(batH + solH * 0.3, 200);
}

export function generateRecommendations(res) {
  const recs = [];
  if (!res || !res.cfg || !res.cfg.apps || !res.cfg.apps.length) return recs;
  const rCfg = res.cfg;
  const hrs = rCfg.hrs || 72;
  const apps = rCfg.apps;
  const dD = res.dD;
  const ds = res.ds;
  if (dD <= 0 || hrs <= 0) return recs;
  const loadH = new Array(24).fill(dD / 24);
  const costCfg = { solarPerW: 27.5, batPerKwh: 4000, bosPct: 17.5 };
  const deficitByH = loadH.map((l, h) => Math.max(0, l - (res.sc[h] || 0)));
  const overnightHours = [];
  for (let h = 0; h < 24; h++) { if ((res.sc[h] || 0) < 5) overnightHours.push(h); }

  if (res.al.dep < hrs) {
    const depH = res.al.dep;
    const deficitHrs = hrs - depH;
    const avgDeficitW = deficitByH.reduce((a, v) => a + v, 0) / 24;
    const neededKwh = Math.max(0.5, Math.ceil((deficitHrs * avgDeficitW / 1000) * 2) / 2);
    let projectedAllDep = depH;
    try {
      const ch = getBatteryChemistry(rCfg.battery.chem);
      const biggerCap = rCfg.battery.cap + neededKwh;
      const biggerUs = biggerCap * rCfg.battery.dod;
      const socCfg = { cap: biggerUs, nameplate: biggerCap, dod: rCfg.battery.dod, rte: rCfg.battery.rte, solar: res.sc, load: loadH, hrs: hrs, peukertK: ch.peukert, crCh: ch.cr, crDis: ch.cr, ambTemp: rCfg.zone ? rCfg.zone.tmp : 25, tempSlope: ch.tempSlope, usePeukert: true, useCRate: true, useTemp: true };
      projectedAllDep = simulateSOC(socCfg).hoursUntilDepletion;
    } catch (e) { /* fallback */ }
    const batCost = calcCost(0, 0, neededKwh, costCfg);
    const appContrib = apps.map(a => ({ ...a, overnightWh: a.w * (a.h / 24) * overnightHours.length })).sort((a, b) => b.overnightWh - a.overnightWh);
    const topApp = appContrib[0];
    recs.push({
      id: 'increase-battery', severity: 'critical', category: 'battery',
      title: 'Battery depletes before blackout ends',
      diagnosis: `Your battery reaches minimum SOC after ${depH.toFixed(1)} hours — ${deficitHrs.toFixed(1)} hours short of your ${hrs}-hour blackout. Overnight deficit averages ~${Math.round(avgDeficitW)}W when solar drops to zero.${topApp ? ', with ' + topApp.name + ' being the largest overnight draw at ' + topApp.overnightWh.toFixed(0) + ' Wh.' : ''}`,
      actions: [
        { label: `Add ${neededKwh.toFixed(1)} kWh of battery capacity`, projectedImpact: `Extends all-load survival to ~${projectedAllDep.toFixed(0)}h (from ${depH.toFixed(0)}h)`, effort: 'high', costEstimate: batCost.total, _before: depH, _after: projectedAllDep },
        { label: 'Shed non-critical loads overnight', projectedImpact: `Critical-only loads survive ${res.cl.dep.toFixed(0)}h${res.cl.dep >= hrs ? ' — enough for full blackout' : ' — still ' + (hrs - res.cl.dep).toFixed(0) + 'h short'}`, effort: 'low', costEstimate: 0, _before: depH, _after: res.cl.dep }
      ],
      affectedMetric: 'Depletion (All)'
    });
  }

  if (ds < dD) {
    const gapWh = dD - ds;
    const panelW = rCfg.solar ? rCfg.solar.w : 400;
    const adjPSH = res.adjPSH || 4.5;
    const additionalPanels = Math.ceil(gapWh / (panelW * adjPSH * 0.86));
    if (additionalPanels > 0 && additionalPanels < 50) {
      let projectedDep = res.al.dep;
      try {
        const ch = getBatteryChemistry(rCfg.battery.chem);
        let newSc;
        if (ds > 0) { const scale = (ds + additionalPanels * panelW * adjPSH * 0.86) / ds; newSc = res.sc.map(w => w * scale); }
        else { const newDs = additionalPanels * panelW * adjPSH * 0.86; const dl = getSeasonalDaylightHours(40, res.season || 'summer'); newSc = generateHourlySolarCurve(newDs, dl.sunrise, dl.sunset).map(w => w * 0.95); }
        const socCfg = { cap: res.us, nameplate: rCfg.battery.cap, dod: rCfg.battery.dod, rte: rCfg.battery.rte, solar: newSc, load: loadH, hrs: hrs, peukertK: ch.peukert, crCh: ch.cr, crDis: ch.cr, ambTemp: rCfg.zone ? rCfg.zone.tmp : 25, tempSlope: ch.tempSlope, usePeukert: true, useCRate: true, useTemp: true };
        projectedDep = simulateSOC(socCfg).hoursUntilDepletion;
      } catch (e) { /* fallback */ }
      const solCost = calcCost(additionalPanels, panelW, 0, costCfg);
      recs.push({ id: 'increase-solar', severity: ds < dD * 0.5 ? 'critical' : 'warning', category: 'solar', title: 'Daily solar production is below demand', diagnosis: `Your panels produce ${ds.toFixed(0)} Wh/day against ${dD.toFixed(0)} Wh/day demand — a ${gapWh.toFixed(0)} Wh daily shortfall that drains the battery each cycle.`, actions: [{ label: `Add ${additionalPanels} panel${additionalPanels > 1 ? 's' : ''} (${(additionalPanels * panelW / 1000).toFixed(1)} kW)`, projectedImpact: `Closes the ${gapWh.toFixed(0)} Wh/day gap, extends survival to ~${projectedDep.toFixed(0)}h`, effort: 'high', costEstimate: solCost.total, _before: res.al.dep, _after: projectedDep }], affectedMetric: 'Daily Solar' });
    }
  }

  if (res.od < 0.92) {
    const bestD = getTiltOrientationDerate('S', 30);
    const lostPct = ((1 - res.od / bestD) * 100).toFixed(0);
    recs.push({ id: 'optimize-orientation', severity: 'info', category: 'solar', title: 'Panel orientation is suboptimal', diagnosis: `Your ${rCfg.solar ? rCfg.solar.ori : '?'}/${rCfg.solar ? rCfg.solar.tilt : '?'} setup achieves ${(res.od * 100).toFixed(0)}% orientation derate. South-facing at 30° would achieve ${(bestD * 100).toFixed(0)}%.`, actions: [{ label: 'Adjust tilt to ~30° and face panels south', projectedImpact: `Could recover ~${lostPct}% of orientation loss`, effort: 'medium', costEstimate: null }], affectedMetric: 'Solar Output Curve' });
  }

  if (res.al.dep < hrs) {
    const schedulable = apps.filter(a => a.p !== 'Critical' && !a.m && a.w * a.h > 50).sort((a, b) => (b.w * b.h) - (a.w * a.h));
    if (schedulable.length > 0) {
      const top = schedulable[0];
      const dayl = getSeasonalDaylightHours(40, res.season || 'summer');
      const shiftWh = top.w * top.h;
      let projectedDep = res.al.dep;
      try {
        const ch = getBatteryChemistry(rCfg.battery.chem);
        const shiftLoad = new Array(24).fill(0);
        const baseHourly = dD / 24;
        const appHourly = top.w * (top.h / 24);
        for (let h = 0; h < 24; h++) { shiftLoad[h] = (h >= dayl.sunrise && h <= dayl.sunset) ? baseHourly : Math.max(0, baseHourly - appHourly); }
        const socCfg = { cap: res.us, nameplate: rCfg.battery.cap, dod: rCfg.battery.dod, rte: rCfg.battery.rte, solar: res.sc, load: shiftLoad, hrs: hrs, peukertK: ch.peukert, crCh: ch.cr, crDis: ch.cr, ambTemp: rCfg.zone ? rCfg.zone.tmp : 25, tempSlope: ch.tempSlope, usePeukert: true, useCRate: true, useTemp: true };
        projectedDep = simulateSOC(socCfg).hoursUntilDepletion;
      } catch (e) { /* fallback */ }
      const improvement = Math.max(0, projectedDep - res.al.dep);
      recs.push({ id: 'load-shift-' + top.id, severity: improvement > 2 ? 'warning' : 'info', category: 'scheduling', title: 'Shift ' + top.name + ' to daylight hours', diagnosis: `${top.name} uses ${shiftWh.toFixed(0)} Wh/day across ${top.h}h. Moving its runtime to ${dayl.sunrise}:00–${dayl.sunset}:00 reduces overnight battery draw by ~${(shiftWh * 0.5).toFixed(0)} Wh.`, actions: [{ label: `Run ${top.name} between ${dayl.sunrise}:00 and ${dayl.sunset}:00`, projectedImpact: improvement > 0.5 ? `Extends survival by ~${improvement.toFixed(0)}h (to ~${projectedDep.toFixed(0)}h)` : `Modest improvement (~${improvement.toFixed(1)}h)`, effort: 'low', costEstimate: 0, _before: res.al.dep, _after: projectedDep }], affectedMetric: 'Depletion (All)' });
    }
  }

  if (dD > 0 && res.al.dep < hrs) {
    const highLoad = apps.filter(a => (a.w * a.h) / dD > 0.25).sort((a, b) => (b.w * b.h) - (a.w * a.h));
    highLoad.forEach(a => {
      const pct = ((a.w * a.h / dD) * 100).toFixed(0);
      recs.push({ id: 'reduce-' + a.id, severity: 'warning', category: 'appliance', title: a.name + ' uses ' + pct + '% of daily energy', diagnosis: `${a.name} consumes ${(a.w * a.h).toFixed(0)} Wh/day out of ${dD.toFixed(0)} Wh total. This single appliance accounts for over a quarter of your energy budget.`, actions: [{ label: `Replace with efficient model or reduce to ${Math.ceil(a.h * 0.7)}h/day`, projectedImpact: `Could save ~${(a.w * a.h * 0.3).toFixed(0)} Wh/day`, effort: 'medium', costEstimate: null }], affectedMetric: 'Load Breakdown' });
    });
  }

  if (res.cl.dep >= hrs && res.al.dep < hrs) {
    const hasBatteryRec = recs.some(r => r.id === 'increase-battery');
    if (!hasBatteryRec) {
      recs.push({ id: 'critical-load-fallback', severity: 'info', category: 'scheduling', title: 'Critical loads alone survive the blackout', diagnosis: `Running only critical loads extends survival to ${res.cl.dep.toFixed(0)}h — enough for your ${hrs}h blackout. This requires no hardware investment, just a load-shedding plan.`, actions: [{ label: 'Create a load-shedding plan for non-critical appliances', projectedImpact: `Survives full ${hrs}h blackout at zero cost`, effort: 'low', costEstimate: 0, _before: res.al.dep, _after: res.cl.dep }], affectedMetric: 'Depletion (Crit)' });
    }
  }

  const sevOrder = { critical: 0, warning: 1, info: 2 };
  recs.sort((a, b) => (sevOrder[a.severity] || 2) - (sevOrder[b.severity] || 2));
  return recs.slice(0, 6);
}

export function runSimulation(cfg) {
  const { apps, solar: s, battery: b, zone: z, hrs, bpy, adv } = cfg;
  const tL = calculateTotalConnectedLoad(apps);
  const pL = calculatePeakLoad(apps);
  const dD = calculateDailyEnergyDemand(apps);
  const bP = calculateEnergyDemandByPriority(apps);
  const bC = calculateLoadBreakdownByCategory(apps);
  const season = adv.season || 'summer';
  const cloud = adv.cloud || 'typical';
  const noct = adv.noct || 45;
  const tc = adv.tc || -0.0038;
  const invEff = adv.invEff || 0.95;
  const useAdv = adv.useAdv || false;
  const subDr = adv.subDr || null;
  const td = calculateTempDerate(z.tmp, 800, noct, tc);
  const od = getTiltOrientationDerate(s.ori, s.tilt);
  let ap;
  if (useAdv && subDr) ap = calculateEffectiveArrayPower(s.cnt, s.w, td, od, subDr);
  else ap = calculateEffectiveArrayPowerLegacy(s.cnt, s.w, td, od);
  const adjPSH = applySeasonalMultiplier(z.psh, season);
  let ds = calculateDailySolarEnergy(ap, adjPSH);
  ds = applyCloudAttenuation(ds, cloud);
  const dl = getSeasonalDaylightHours(30, season);
  let sc = generateHourlySolarCurve(ds, dl.sunrise, dl.sunset);
  sc = sc.map(w => w * invEff);
  const ch = getBatteryChemistry(b.chem);
  const us = b.cap * b.dod;
  const lp = new Array(24).fill(dD / 24);
  const socCfg = {
    usableCapacityKwh: us, nameplateCapacityKwh: b.cap, maxDoD: b.dod, roundTripEfficiency: b.rte,
    hourlySolarOutput: sc, hourlyLoadDemand: lp, blackoutHours: hrs,
    nominalVoltageV: 48, peukertExponent: ch.peukert, chargeRateLimit: ch.cr, dischargeRateLimit: ch.cr,
    ambientTempC: z.tmp, tempDerateSlope: ch.tempSlope,
    applyPeukert: adv.usePeukert !== false, applyCRateLimits: adv.useCRate !== false, applyTempDerate: adv.useTemp !== false
  };
  const al = simulateSOC(socCfg);
  const ca = apps.filter(a => a.p === 'Critical');
  const cd = calculateDailyEnergyDemand(ca);
  const cl2 = new Array(24).fill(cd / 24);
  const cl = simulateSOC({ ...socCfg, hourlyLoadDemand: cl2 });
  const dg = calculateDegradation({ totalEnergyDischargedWh: al.totalEnergyDischargedWh, usableCapacityKwh: us, chemistryId: b.chem, maxDoD: b.dod, blackoutsPerYear: bpy });

  return {
    tL, pL, dD, bP, bC, ap, ds, sc, td, od, us, ch,
    al: { ...al, dep: al.hoursUntilDepletion, soc: al.hourlySoc, physics: al.physics },
    cl: { ...cl, dep: cl.hoursUntilDepletion, soc: cl.hourlySoc },
    dg: { ...dg, y80: dg.yearAt80Capacity, y50: dg.yearAt50Capacity, life: dg.estimatedCycleLife },
    cfg: { apps, solar: s, battery: b, zone: z, hrs, bpy },
    season, cloud, adjPSH
  };
}

export const ORIS = ['S', 'SE', 'SW', 'E', 'W', 'N'];
export const CHEMS = ['lfp', 'lead'];

export function dominates(a, b) {
  let dominated = false;
  for (let i = 0; i < a.obj.length; i++) {
    if (a.obj[i] > b.obj[i]) return false;
    if (a.obj[i] < b.obj[i]) dominated = true;
  }
  return dominated;
}

export function fastNonDominatedSort(pop) {
  const n = pop.length;
  const S = Array.from({ length: n }, () => []);
  const nDom = new Array(n).fill(0);
  const fronts = [[]];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      if (dominates(pop[i], pop[j])) S[i].push(j);
      else if (dominates(pop[j], pop[i])) nDom[i]++;
    }
    if (nDom[i] === 0) { pop[i].rank = 0; fronts[0].push(i); }
  }
  let fi = 0;
  while (fronts[fi].length > 0) {
    const Q = [];
    for (const i of fronts[fi]) {
      for (const j of S[i]) {
        nDom[j]--;
        if (nDom[j] === 0) { pop[j].rank = fi + 1; Q.push(j); }
      }
    }
    fi++;
    fronts.push(Q);
  }
  return fronts.filter(f => f.length > 0);
}

export function crowdingDistance(pop, front) {
  const n = front.length;
  if (n <= 2) { front.forEach(i => { pop[i].cd = Infinity; }); return; }
  front.forEach(i => { pop[i].cd = 0; });
  const nObj = pop[front[0]].obj.length;
  for (let m = 0; m < nObj; m++) {
    const sorted = [...front].sort((a, b) => pop[a].obj[m] - pop[b].obj[m]);
    pop[sorted[0]].cd = Infinity;
    pop[sorted[n - 1]].cd = Infinity;
    const minV = pop[sorted[0]].obj[m];
    const maxV = pop[sorted[n - 1]].obj[m];
    const range = maxV - minV || 1;
    for (let i = 1; i < n - 1; i++) {
      pop[sorted[i]].cd += (pop[sorted[i + 1]].obj[m] - pop[sorted[i - 1]].obj[m]) / range;
    }
  }
}

export function tournamentSelect(pop) {
  const a = Math.floor(Math.random() * pop.length);
  let b = Math.floor(Math.random() * pop.length);
  while (b === a) b = Math.floor(Math.random() * pop.length);
  const pa = pop[a], pb = pop[b];
  if (pa.rank < pb.rank) return a;
  if (pb.rank < pa.rank) return b;
  return pa.cd >= pb.cd ? a : b;
}

export function sbx(a, b, eta = 20) {
  if (Math.abs(a - b) < 1e-10) return a;
  const u = Math.random();
  let beta;
  if (u <= 0.5) beta = Math.pow(2 * u, 1 / (eta + 1));
  else beta = Math.pow(1 / (2 * (1 - u)), 1 / (eta + 1));
  return 0.5 * ((1 + beta) * a + (1 - beta) * b);
}

export function polyMut(val, lb, ub, eta = 20) {
  const u = Math.random();
  if (u < 1 / (ub - lb + 1)) {
    const delta = Math.min(val - lb, ub - val) / (ub - lb);
    const r = Math.random();
    const d = Math.pow(r, eta + 1);
    if (r < 0.5) return val - (ub - lb) * d * delta;
    return val + (ub - lb) * d * delta;
  }
  return val;
}

export function initPopulation(popSize) {
  const pop = [];
  for (let i = 0; i < popSize; i++) {
    pop.push({
      panelCount: Math.floor(Math.random() * 41),
      batteryKwh: Math.round(Math.random() * 80) / 2,
      batteryChem: CHEMS[Math.floor(Math.random() * 2)],
      tilt: Math.floor(Math.random() * 91),
      orientation: ORIS[Math.floor(Math.random() * 6)]
    });
  }
  return pop;
}

export function evaluateIndividual(ind, fixedCfg) {
  const { panelCount, batteryKwh, batteryChem, tilt, orientation } = ind;
  const { apps, zone, hrs, bpy, adv, costCfg, panelWatts } = fixedCfg;
  const dod = batteryChem === 'lfp' ? 0.92 : 0.50;
  const rte = batteryChem === 'lfp' ? 0.95 : 0.82;
  const solarCfg = { cnt: panelCount, w: panelWatts, tilt, ori: orientation };
  const batteryCfg = { cap: batteryKwh, chem: batteryChem, dod, rte };
  try {
    const simCfg = { apps, solar: solarCfg, battery: batteryCfg, zone, hrs, bpy, adv };
    const simRes = runSimulation(simCfg);
    const cost = calcCost(panelCount, panelWatts, batteryKwh, costCfg || { solarPerW: 27.5, batPerKwh: 4000, bosPct: 17.5 }).total;
    const survival = Math.min(simRes.al.dep, hrs * 1.5);
    const N = 20;
    let survived = 0;
    const ca = apps.filter(a => a.p === 'Critical');
    const critDaily = ca.reduce((s, a) => s + a.w * a.h, 0);
    const critLoad = new Array(24).fill(critDaily / 24);
    for (let i = 0; i < N; i++) {
      try {
        const randStart = Math.floor(Math.random() * 24);
        const rotated = new Array(24).fill(0);
        for (let h = 0; h < 24; h++) rotated[h] = simRes.sc[(h + randStart) % 24];
        const ch = getBatteryChemistry(batteryChem);
        const socCfg = { usableCapacityKwh: batteryKwh * dod, nameplateCapacityKwh: batteryKwh, maxDoD: dod, roundTripEfficiency: rte, hourlySolarOutput: rotated, hourlyLoadDemand: critLoad, blackoutHours: hrs, nominalVoltageV: 48, peukertExponent: ch.peukert, chargeRateLimit: ch.cr, dischargeRateLimit: ch.cr, ambientTempC: zone.tmp, tempDerateSlope: ch.tempSlope, applyPeukert: true, applyCRateLimits: true, applyTempDerate: true };
        if (simulateSOC(socCfg).hoursUntilDepletion >= hrs) survived++;
      } catch (e) { /* skip */ }
    }
    const dailySolarKwh = simRes.ds / 1000;
    const annualCarbonAvoided = dailySolarKwh * 365 * zone.gridCarbon;
    const mfgCarbon = panelCount * 40 + batteryKwh * 75;
    const carbon = mfgCarbon - annualCarbonAvoided * 10;
    return { cost, reliability: survived / N, carbon, survival };
  } catch (e) {
    return { cost: 1e9, reliability: 0, carbon: 1e9, survival: 0 };
  }
}

export function buildObjective(ev) {
  return [ev.cost, -ev.reliability, ev.carbon, -ev.survival];
}
