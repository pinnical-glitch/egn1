# Home Energy Resilience Planner

A comprehensive home energy resilience planning tool that simulates solar + battery backup systems during blackout scenarios. Built with React, Vite, and Tailwind CSS.

## Features

### Phase 1 (Original)
- 5-step wizard: Home → Loads → Solar → Battery → Results
- Appliance library with 25+ common household devices
- 6 US climate zones with representative solar/temperature data
- Hour-by-hour state-of-charge simulation
- Basic derating: PVWatts 0.86 system derate, temperature, tilt/orientation
- Scorecards and charts for visualization

### Phase 2 (Enhanced Physics)
- **Advanced Solar Modeling**: NOCT-based cell temperature, seasonal PSH adjustment, stochastic cloud cover, inverter efficiency, named sub-derates
- **Advanced Battery Physics**: Peukert's Law for rate-dependent capacity, C-rate charge/discharge limits, temperature derating, calendar aging
- **Cost-vs-Resilience Dashboard**: Interactive comparison of system sizes with cost analysis
- **Expanded Methodology Panel**: Complete documentation of all formulas and constants

## Getting Started

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## Project Structure

```
src/
├── App.jsx                    # Main application component
├── engine/                    # Physics engine (UI-agnostic)
│   ├── index.js              # Main exports and runSimulation()
│   ├── solar.js              # Solar irradiance & derating
│   ├── battery.js            # Battery SOC & degradation
│   ├── loads.js              # Load calculations
│   ├── appliances.js         # Appliance library
│   └── climateZones.js       # Climate zone presets
├── components/
│   ├── forms/                # Wizard step forms
│   │   ├── HomeForm.jsx
│   │   ├── LoadsForm.jsx
│   │   ├── SolarForm.jsx
│   │   ├── BatteryForm.jsx
│   │   └── AdvancedPhysicsForm.jsx  # Phase 2: Advanced options
│   └── dashboard/            # Results visualization
│       ├── ScorecardRow.jsx
│       ├── SocChart.jsx
│       ├── EnergyBalanceChart.jsx
│       ├── SolarCurveChart.jsx
│       ├── LoadBreakdownChart.jsx
│       ├── CostVsResilience.jsx     # Phase 2: Cost analysis
│       └── AssumptionsPanel.jsx     # Phase 2: Methodology docs
└── theme/
    └── tokens.js             # Design system tokens
```

## Physics Engine

### Solar Model (Phase 2 Enhanced)
- **Cell Temperature**: NOCT-based model: `T_cell = T_ambient + (NOCT - 20) / 800 × Irradiance`
- **Temperature Derate**: `P = P_STC × [1 + temp_coeff × (T_cell - 25)]`
- **Seasonal Adjustment**: PSH multiplied by seasonal factor (0.65-1.0)
- **Cloud Attenuation**: Stochastic Beta distribution per climate zone
- **Sub-Derates**: Wiring (2%), Soiling (2%), Mismatch (2%), Availability (3%), Degradation (0.15%/yr)

### Battery Model (Phase 2 Enhanced)
- **Peukert's Law**: `C_actual = C_rated × (I_rated / I_actual)^(k-1)`
  - LFP: k=1.05 (near-ideal)
  - Lead-Acid: k=1.25 (significant rate loss)
- **C-Rate Limits**: Max charge/discharge rate (0.5C for LFP, 0.2C for lead-acid)
- **Temperature Derate**: Linear capacity loss below 25°C
- **Calendar Aging**: 2%/year (LFP), 5%/year (lead-acid)

### Degradation Model
- Cycle-based degradation from actual simulated cycles
- Calendar aging (capacity fade over time)
- Year-by-year capacity projection
- Year at 80% and 50% capacity estimates

## Design System

- **Style**: Minimalism with technical precision
- **Colors**: Cool blues/grays with functional accents (solar=amber, battery=blue, load=red)
- **Typography**: Inter (body), JetBrains Mono (data/numbers)
- **Spacing**: 8dp base unit

## Testing

The project includes unit tests for the physics engine:
- Solar calculations (tilt/orientation, temperature derate, solar curve)
- Battery calculations (chemistry, capacity, SOC simulation, degradation)
- Load calculations (total load, peak load, daily demand)

Run tests with: `npm run test`

## License

Estimates for planning only. Consult a certified installer for actual system design.