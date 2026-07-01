/**
 * Design System - Home Energy Resilience Planner
 * 
 * Based on ui-ux-pro-max recommendations for:
 * "energy dashboard, technical, trustworthy, data-dense, engineering tool aesthetic"
 * 
 * Style: Minimalism with technical precision
 * Color Palette: Cool blues and grays with functional accent colors
 * Typography: Inter for body, JetBrains Mono for data/numbers
 */

export const theme = {
  // Color System - Technical/Trustworthy palette
  colors: {
    // Primary - Deep blue for trust/technical feel
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    
    // Neutral - Cool grays
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
    
    // Semantic Colors
    success: '#10b981', // Green for positive/surplus
    warning: '#f59e0b', // Amber for caution
    danger: '#ef4444',  // Red for critical/depletion
    info: '#06b6d4',    // Cyan for informational
    
    // Chart Colors - Accessible palette (WCAG compliant)
    chart: {
      solar: '#fbbf24',      // Yellow for solar
      battery: '#3b82f6',    // Blue for battery
      load: '#ef4444',       // Red for load/consumption
      critical: '#dc2626',   // Dark red for critical
      important: '#f59e0b',  // Amber for important
      optional: '#6b7280',   // Gray for optional
      surplus: '#10b981',    // Green for surplus
      deficit: '#ef4444',    // Red for deficit
    },
    
    // Surface colors
    surface: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      elevated: '#ffffff',
    },
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  
  // Spacing Scale (8dp base)
  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
  },
  
  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    '2xl': '1rem',   // 16px
    full: '9999px',
  },
  
  // Shadows (Elevation system)
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  // Breakpoints (Mobile-first)
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Z-Index Scale
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modal: 40,
    popover: 50,
    tooltip: 60,
  },
  
  // Animation
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    easing: {
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};

// Chart configuration for Recharts
export const chartConfig = {
  // SOC Chart
  soc: {
    colors: {
      allLoads: theme.colors.chart.load,
      criticalLoads: theme.colors.chart.critical,
      dodFloor: theme.colors.danger,
      solar: theme.colors.chart.solar,
    },
    strokeWidth: 2,
    dotRadius: 0,
    activeDotRadius: 4,
  },
  
  // Energy Balance Chart
  energyBalance: {
    colors: {
      solar: theme.colors.chart.solar,
      load: theme.colors.chart.load,
      surplus: theme.colors.chart.surplus,
      deficit: theme.colors.chart.deficit,
    },
  },
  
  // Solar Curve
  solarCurve: {
    colors: {
      output: theme.colors.chart.solar,
      fill: '#fef3c7', // Light yellow fill
    },
  },
  
  // Load Breakdown
  loadBreakdown: {
    colors: {
      critical: theme.colors.chart.critical,
      important: theme.colors.chart.important,
      optional: theme.colors.chart.optional,
    },
  },
};

// Component variants
export const components = {
  // Card variants
  card: {
    primary: 'bg-white rounded-xl shadow-md border border-gray-100',
    elevated: 'bg-white rounded-xl shadow-lg border border-gray-50',
    flat: 'bg-gray-50 rounded-xl border border-gray-200',
  },
  
  // Button variants
  button: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-150',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors duration-150',
    danger: 'bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-150',
    ghost: 'hover:bg-gray-100 text-gray-600 font-medium px-4 py-2 rounded-lg transition-colors duration-150',
  },
  
  // Input variants
  input: {
    primary: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150',
    error: 'w-full px-3 py-2 border border-red-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-150',
  },
  
  // Badge variants
  badge: {
    critical: 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium',
    important: 'bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium',
    optional: 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium',
    success: 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium',
  },
};

export default theme;
