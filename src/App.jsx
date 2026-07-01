import { useState, useEffect } from 'react';
import { HomeForm, LoadsForm, SolarForm, BatteryForm, AdvancedPhysicsForm } from './components/forms';
import { ScorecardRow, SocChart, EnergyBalanceChart, SolarCurveChart, LoadBreakdownChart, AssumptionsPanel } from './components/dashboard';
import { runSimulation } from './engine/index.js';
import { getDefaultClimateZone, getClimateZone } from './engine/climateZones.js';
import { DEFAULT_APPLIANCES } from './engine/appliances.js';

const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin h-12 w-12 mb-4 text-blue-600" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const STEPS = [
  { id: 'home', label: 'Home', description: 'Climate & location' },
  { id: 'loads', label: 'Loads', description: 'Electrical appliances' },
  { id: 'solar', label: 'Solar', description: 'Panel configuration' },
  { id: 'battery', label: 'Battery', description: 'Storage system' },
  { id: 'advanced', label: 'Physics', description: 'Advanced (optional)', optional: true },
  { id: 'results', label: 'Results', description: 'Simulation output' },
];

function App() {
  const [currentStep, setCurrentStep] = useState('home');
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  const [config, setConfig] = useState({
    home: {
      climateZone: getDefaultClimateZone().id,
      houseType: 'single_family',
      blackoutHours: 72,
      blackoutsPerYear: 4,
    },
    loads: {
      appliances: DEFAULT_APPLIANCES.slice(0, 5),
    },
    solar: {
      panelCount: 10,
      panelWattageSTC: 400,
      tiltDegrees: 30,
      orientation: 'S',
    },
    battery: {
      capacityKwh: 10,
      chemistry: 'lfp',
      maxDoD: 0.92,
      roundTripEfficiency: 0.95,
    },
    advanced: {
      season: 'summer',
      cloudScenario: 'typical',
      useAdvancedMode: false,
      noct: 45,
      tempCoeff: -0.0038,
      inverterEfficiency: 0.95,
      systemDerate: 0.86,
    },
  });

  useEffect(() => {
    if (currentStep === 'results') {
      runSimulationAsync();
    }
  }, [currentStep]);

  const runSimulationAsync = async () => {
    setIsSimulating(true);
    setErrors({});
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const simulationConfig = {
        appliances: config.loads.appliances,
        solar: config.solar,
        battery: config.battery,
        climateZone: getClimateZone(config.home.climateZone),
        blackoutHours: config.home.blackoutHours,
        blackoutsPerYear: config.home.blackoutsPerYear,
        advancedPhysics: config.advanced,
      };
      const simResults = runSimulation(simulationConfig);
      setResults(simResults);
    } catch (err) {
      console.error('Simulation error:', err);
      setErrors({ simulation: 'Failed to run simulation. Please check your inputs.' });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleConfigChange = (section, newConfig) => {
    setConfig(prev => ({ ...prev, [section]: newConfig }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 'home') {
      if (!config.home.climateZone) newErrors.climateZone = 'Climate zone is required';
      if (!config.home.houseType) newErrors.houseType = 'House type is required';
    }
    if (step === 'loads') {
      if (config.loads.appliances.length === 0) newErrors.appliances = 'At least one appliance must be selected';
    }
    if (step === 'solar') {
      if (!config.solar.panelCount || config.solar.panelCount <= 0) newErrors.panelCount = 'Panel count must be greater than 0';
      if (!config.solar.panelWattageSTC || config.solar.panelWattageSTC <= 0) newErrors.panelWattageSTC = 'Panel wattage must be greater than 0';
      if (!config.solar.orientation) newErrors.orientation = 'Orientation is required';
    }
    if (step === 'battery') {
      if (!config.battery.capacityKwh || config.battery.capacityKwh <= 0) newErrors.capacityKwh = 'Battery capacity must be greater than 0';
      if (!config.battery.chemistry) newErrors.chemistry = 'Battery chemistry is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const stepIndex = STEPS.findIndex(s => s.id === currentStep);

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1 && validateStep(currentStep)) {
      setCurrentStep(STEPS[stepIndex + 1].id);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) setCurrentStep(STEPS[stepIndex - 1].id);
  };

  const handleRunSimulation = () => {
    if (validateStep(currentStep)) setCurrentStep('results');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'home':
        return <HomeForm config={config.home} onChange={(c) => handleConfigChange('home', c)} />;
      case 'loads':
        return <LoadsForm config={config.loads} onChange={(c) => handleConfigChange('loads', c)} />;
      case 'solar':
        return <SolarForm config={config.solar} onChange={(c) => handleConfigChange('solar', c)} />;
      case 'battery':
        return <BatteryForm config={config.battery} onChange={(c) => handleConfigChange('battery', c)} />;
      case 'advanced':
        return <AdvancedPhysicsForm config={config.advanced} onChange={(c) => handleConfigChange('advanced', c)} />;
      case 'results':
        return (
          <div className="space-y-6" aria-live="polite">
            {isSimulating ? (
              <div className="flex flex-col items-center justify-center py-12">
                <SpinnerIcon />
                <p className="text-gray-600">Running simulation...</p>
              </div>
            ) : errors.simulation ? (
              <div className="p-4 bg-red-50 rounded-lg text-red-800" role="alert">{errors.simulation}</div>
            ) : results ? (
              <>
                <ScorecardRow results={results} />
                <SocChart results={results} />
                <EnergyBalanceChart results={results} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SolarCurveChart results={results} />
                  <LoadBreakdownChart results={results} />
                </div>
                <AssumptionsPanel results={results} />
              </>
            ) : null}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:z-50 focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Home Energy Resilience Planner</h1>
              <p className="text-sm text-gray-600">Phase 2: Real Physics Engine</p>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200" aria-label="Progress">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto py-2 gap-2">
            {STEPS.map((step, index) => {
              const isCurrent = currentStep === step.id;
              const isCompleted = stepIndex > index;
              const isClickable = index <= stepIndex + 1;

              return (
                <button
                  key={step.id}
                  onClick={() => isClickable && setCurrentStep(step.id)}
                  disabled={!isClickable}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    isCurrent
                      ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                      : isCompleted
                      ? 'bg-green-50 text-green-700'
                      : isClickable
                      ? 'hover:bg-gray-100 text-gray-600'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                    isCurrent ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isCompleted ? <CheckIcon className="w-4 h-4" /> : index + 1}
                  </span>
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 animate-fade-in">
          {renderStep()}
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={handleBack}
            disabled={currentStep === 'home'}
            aria-label="Go back"
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              currentStep === 'home'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ← Back
          </button>

          {currentStep === 'advanced' || currentStep === 'battery' ? (
            <button
              onClick={handleRunSimulation}
              aria-label="Run simulation"
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm"
            >
              Run Simulation →
            </button>
          ) : currentStep === 'results' ? (
            <button
              onClick={() => { setCurrentStep('home'); setResults(null); }}
              aria-label="Start over"
              className="px-6 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-all duration-200 text-sm"
            >
              Start Over
            </button>
          ) : (
            <button
              onClick={handleNext}
              aria-label="Next step"
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm"
            >
              Next →
            </button>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center">
          <p className="text-xs text-gray-500">
            Estimates for planning only. Consult a certified installer for actual system design.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
