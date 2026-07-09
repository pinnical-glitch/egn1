const STORAGE_KEY = 'eng1_saved_configs';
const AUTO_SAVE_KEY = 'eng1_auto_save';

export function getSavedConfigs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveConfig(name, config) {
  const configs = getSavedConfigs();
  configs.push({ name, config, savedAt: Date.now() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

export function deleteConfig(index) {
  const configs = getSavedConfigs();
  configs.splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

export function loadConfig(index) {
  const configs = getSavedConfigs();
  return configs[index]?.config || null;
}

export function autoSave(config) {
  try { localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(config)); } catch {}
}

export function loadAutoSave() {
  try {
    const raw = localStorage.getItem(AUTO_SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function exportConfigJSON(config) {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'energy-resilience-config.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importConfigJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);
        if (config && typeof config === 'object') resolve(config);
        else reject(new Error('Invalid config format'));
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function configToURL(config) {
  const encoded = btoa(encodeURIComponent(JSON.stringify(config)));
  const url = new URL(window.location.href);
  url.searchParams.set('cfg', encoded);
  return url.toString();
}

export function configFromURL() {
  const url = new URL(window.location.href);
  const cfg = url.searchParams.get('cfg');
  if (!cfg) return null;
  try {
    return JSON.parse(decodeURIComponent(atob(cfg)));
  } catch { return null; }
}

export function shareConfig(config) {
  const url = configToURL(config);
  navigator.clipboard.writeText(url).catch(() => {});
  return url;
}
