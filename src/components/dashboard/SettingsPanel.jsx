import { useEffect, useRef, useState } from 'react';
import { getSavedConfigs, saveConfig, deleteConfig, exportConfigJSON, importConfigJSON, shareConfig } from '../../utils/configManager.js';

export function SettingsPanel({ open, onClose, settings, setSettings, config, onReset, onLoadConfig }) {
  const panelRef = useRef(null);
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [saveName, setSaveName] = useState('');
  const [showSave, setShowSave] = useState(false);
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) setSavedConfigs(getSavedConfigs());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevFocus = document.activeElement;
    panelRef.current?.querySelector('button,input,select')?.focus();
    return () => { document.removeEventListener('keydown', onKey); prevFocus?.focus?.(); };
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = () => {
    if (!saveName.trim()) return;
    saveConfig(saveName.trim(), config);
    setSavedConfigs(getSavedConfigs());
    setSaveName('');
    setShowSave(false);
  };

  const handleLoad = (index) => {
    const loaded = savedConfigs[index]?.config;
    if (loaded && onLoadConfig) {
      onLoadConfig(loaded);
      onClose();
    }
  };

  const handleDelete = (index) => {
    if (confirm('Delete this saved configuration?')) {
      deleteConfig(index);
      setSavedConfigs(getSavedConfigs());
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    try {
      const imported = await importConfigJSON(file);
      if (onLoadConfig) {
        onLoadConfig(imported);
        onClose();
      }
    } catch (err) {
      setImportError('Failed to import: ' + err.message);
    }
    e.target.value = '';
  };

  const handleShare = () => {
    shareConfig(config);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const Row = ({ title, desc, children }) => (
    <div className="py-3.5 border-b border-slate-100 dm-border last:border-0">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-800 dm-text">{title}</div>
          {desc && <div className="text-xs text-slate-500 dm-text-muted mt-0.5">{desc}</div>}
        </div>
        <div className="flex-shrink-0">{children}</div>
      </div>
    </div>
  );

  const Toggle = ({ on, onChange, label }) => (
    <button onClick={() => onChange(!on)} role="switch" aria-checked={on} aria-label={label}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${on ? 'bg-brand-600' : 'bg-slate-300'}`}>
      <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200" style={{ transform: on ? 'translateX(20px)' : 'translateX(0)' }} />
    </button>
  );

  const themeOpts = [{ id: 'light', l: 'Light' }, { id: 'dark', l: 'Dark' }, { id: 'auto', l: 'Auto' }];

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-40 settings-backdrop" onClick={onClose} aria-hidden="true" />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Settings"
        className="fixed top-0 right-0 h-full w-full max-w-sm bg-white dm-surface z-50 shadow-elevated settings-panel overflow-y-auto">
        <div className="px-5 py-4 border-b border-slate-100 dm-border flex items-center justify-between sticky top-0 bg-white dm-surface z-10">
          <h2 className="font-bold text-slate-900 dm-text text-lg">Settings</h2>
          <button onClick={onClose} aria-label="Close settings" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-150">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5">
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-400 dm-text-muted uppercase tracking-wider pt-3 pb-1">Appearance</h3>
            <Row title="Theme" desc="Auto follows your system setting">
              <div className="flex gap-1 bg-slate-100 dm-surface-2 rounded-lg p-1">
                {themeOpts.map(o => (
                  <button key={o.id} onClick={() => setSettings(s => ({ ...s, theme: o.id }))}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors duration-150 ${settings.theme === o.id ? 'bg-white dm-surface text-brand-700 shadow-sm' : 'text-slate-500 dm-text-muted'}`}>{o.l}</button>
                ))}
              </div>
            </Row>
            <Row title="Reduce motion" desc="Turns off the drifting background and animations">
              <Toggle on={settings.reduceMotion} onChange={v => setSettings(s => ({ ...s, reduceMotion: v }))} label="Reduce motion" />
            </Row>
          </div>
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-400 dm-text-muted uppercase tracking-wider pt-3 pb-1">Units & Display</h3>
            <Row title="Compact numbers" desc="Show 1.2k instead of 1,200 in scorecards">
              <Toggle on={settings.compactNumbers} onChange={v => setSettings(s => ({ ...s, compactNumbers: v }))} label="Compact numbers" />
            </Row>
          </div>
          <div className="pt-2 pb-6">
            <h3 className="text-xs font-bold text-slate-400 dm-text-muted uppercase tracking-wider pt-3 pb-1">Saved Configurations</h3>
            {showSave ? (
              <div className="py-3 border-b border-slate-100 dm-border">
                <div className="flex gap-2">
                  <input type="text" value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Config name..."
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 dm-border rounded-lg bg-white dm-surface focus:outline-none focus:ring-2 focus:ring-brand-500"
                    onKeyDown={e => e.key === 'Enter' && handleSave()} />
                  <button onClick={handleSave} className="px-3 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700">Save</button>
                  <button onClick={() => { setShowSave(false); setSaveName(''); }} className="px-3 py-2 bg-slate-100 dm-surface-2 text-slate-600 dm-text text-sm font-semibold rounded-lg hover:bg-slate-200">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="py-3 border-b border-slate-100 dm-border">
                <button onClick={() => setShowSave(true)} className="w-full flex items-center justify-between px-3.5 py-2.5 bg-brand-50 hover:bg-brand-100 rounded-xl text-sm font-semibold text-brand-700 transition-colors duration-150">
                  <span>Save current configuration</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </button>
              </div>
            )}
            {savedConfigs.length > 0 && (
              <div className="py-2 space-y-1.5">
                {savedConfigs.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 dm-surface-2 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-700 dm-text truncate">{c.name}</div>
                      <div className="text-[10px] text-slate-400 dm-text-muted">{new Date(c.savedAt).toLocaleDateString()}</div>
                    </div>
                    <button onClick={() => handleLoad(i)} className="px-2 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50 rounded">Load</button>
                    <button onClick={() => handleDelete(i)} className="px-2 py-1 text-xs font-semibold text-crit-600 hover:bg-crit-50 rounded">Delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pt-2 pb-6">
            <h3 className="text-xs font-bold text-slate-400 dm-text-muted uppercase tracking-wider pt-3 pb-1">Import / Export</h3>
            <div className="py-3.5 border-b border-slate-100 dm-border">
              <button onClick={() => exportConfigJSON(config)} className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 dm-surface-2 hover:bg-slate-100 rounded-xl text-sm font-semibold text-slate-700 dm-text transition-colors duration-150">
                <span>Export as JSON</span>
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              </button>
            </div>
            <div className="py-3.5 border-b border-slate-100 dm-border">
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 dm-surface-2 hover:bg-slate-100 rounded-xl text-sm font-semibold text-slate-700 dm-text transition-colors duration-150">
                <span>Import from JSON</span>
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              </button>
              {importError && <p className="text-xs text-crit-600 mt-1.5 px-1">{importError}</p>}
            </div>
            <div className="py-3.5 border-b border-slate-100 dm-border">
              <button onClick={handleShare} className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 dm-surface-2 hover:bg-slate-100 rounded-xl text-sm font-semibold text-slate-700 dm-text transition-colors duration-150">
                <span>{copied ? 'Link copied!' : 'Copy shareable link'}</span>
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-4.253a4.5 4.5 0 00-6.364 0l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
              </button>
              <p className="text-[11px] text-slate-400 dm-text-muted mt-1.5 px-1">Share your config via URL. Anyone with the link can load your setup.</p>
            </div>
            <div className="pt-3.5">
              <button onClick={() => { if (confirm('Reset all inputs to defaults?')) { onReset(); onClose(); } }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-crit-50 hover:bg-crit-100 rounded-xl text-sm font-semibold text-crit-700 transition-colors duration-150">
                <span>Reset to defaults</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
