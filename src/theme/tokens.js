export const theme = {
  colors: {
    primary: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
    },
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    solar: { 50:'#fffbeb',100:'#fef3c7',200:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706' },
    bat: { 50:'#ecfdf5',100:'#d1fae5',200:'#a7f3d0',300:'#6ee7b7',400:'#34d399',500:'#10b981',600:'#059669' },
    crit: { 50:'#fff1f2',100:'#ffe4e6',200:'#fecdd3',400:'#fb7185',500:'#f43f5e',600:'#e11d48',700:'#be123c' },
    imp: { 50:'#fffbeb',100:'#fef3c7',400:'#fbbf24',500:'#f59e0b',600:'#d97706' },
    chart: {
      solar: '#fbbf24',
      load: '#f43f5e',
      critical: '#e11d48',
      important: '#f59e0b',
      optional: '#64748b',
      surplus: '#10b981',
      deficit: '#f43f5e',
    },
    surface: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      elevated: '#ffffff',
    },
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
    },
  },
  shadows: {
    card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
    'card-hover': '0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
    elevated: '0 8px 24px -4px rgb(0 0 0 / 0.08), 0 4px 8px -4px rgb(0 0 0 / 0.04)',
  },
  animation: {
    duration: { fast: '150ms', normal: '200ms', slow: '300ms' },
    easing: {
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};

export const chartConfig = {
  soc: { colors: { allLoads: '#f43f5e', criticalLoads: '#e11d48', dodFloor: '#f43f5e', solar: '#fbbf24' } },
  energyBalance: { colors: { solar: '#fbbf24', load: '#f43f5e' } },
  solarCurve: { colors: { output: '#fbbf24' } },
  loadBreakdown: { colors: { critical: '#e11d48', important: '#f59e0b', optional: '#64748b' } },
};

export default theme;
