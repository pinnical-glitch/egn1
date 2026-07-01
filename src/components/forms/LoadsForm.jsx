import { useState } from 'react';
import { DEFAULT_APPLIANCES, createAppliance, PRIORITIES, CATEGORIES } from '../../engine/appliances.js';

export default function LoadsForm({ config, onChange }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAppliance, setNewAppliance] = useState({
    name: '',
    ratedWatts: '',
    surgeWatts: '',
    defaultHoursPerDay: '',
    priority: PRIORITIES.OPTIONAL,
    category: CATEGORIES.OTHER,
  });
  const [errors, setErrors] = useState({});

  const selectedAppliances = config.appliances || [];

  const handleToggleAppliance = (applianceId) => {
    const appliance = DEFAULT_APPLIANCES.find(a => a.id === applianceId);
    if (!appliance) return;

    const isSelected = selectedAppliances.some(a => a.id === applianceId);
    let newSelection;
    
    if (isSelected) {
      newSelection = selectedAppliances.filter(a => a.id !== applianceId);
    } else {
      newSelection = [...selectedAppliances, appliance];
    }
    
    onChange({ ...config, appliances: newSelection });
  };

  const handleUpdateAppliance = (applianceId, field, value) => {
    const newSelection = selectedAppliances.map(a => {
      if (a.id === applianceId) {
        return { ...a, [field]: value };
      }
      return a;
    });
    onChange({ ...config, appliances: newSelection });
  };

  const handleAddCustomAppliance = () => {
    // Validate
    const newErrors = {};
    if (!newAppliance.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!newAppliance.ratedWatts || parseInt(newAppliance.ratedWatts) <= 0) {
      newErrors.ratedWatts = 'Watts must be > 0';
    }
    if (!newAppliance.defaultHoursPerDay || parseFloat(newAppliance.defaultHoursPerDay) < 0 || parseFloat(newAppliance.defaultHoursPerDay) > 24) {
      newErrors.defaultHoursPerDay = 'Hours must be 0-24';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const customAppliance = createAppliance({
      name: newAppliance.name,
      ratedWatts: parseInt(newAppliance.ratedWatts),
      surgeWatts: newAppliance.surgeWatts ? parseInt(newAppliance.surgeWatts) : undefined,
      hoursPerDay: parseFloat(newAppliance.defaultHoursPerDay),
      priority: newAppliance.priority,
      category: newAppliance.category,
    });

    onChange({
      ...config,
      appliances: [...selectedAppliances, customAppliance],
    });

    // Reset form
    setNewAppliance({
      name: '',
      ratedWatts: '',
      surgeWatts: '',
      defaultHoursPerDay: '',
      priority: PRIORITIES.OPTIONAL,
      category: CATEGORIES.OTHER,
    });
    setErrors({});
    setShowAddForm(false);
  };

  const handleRemoveAppliance = (applianceId) => {
    onChange({
      ...config,
      appliances: selectedAppliances.filter(a => a.id !== applianceId),
    });
  };

  // Group appliances by category
  const groupedAppliances = DEFAULT_APPLIANCES.reduce((acc, appliance) => {
    const category = appliance.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(appliance);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Electrical Loads</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select appliances to include in the simulation. Each appliance shows its typical 
          power consumption and daily runtime. Toggle appliances on/off and adjust as needed.
        </p>
      </div>

      {/* Selected Loads Summary */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Selected Loads</span>
          <span className="text-sm text-gray-500">
            {selectedAppliances.length} appliance{selectedAppliances.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedAppliances.length === 0 ? (
            <span className="text-sm text-gray-500 italic">No appliances selected</span>
          ) : (
            selectedAppliances.map(appliance => (
              <span
                key={appliance.id}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  appliance.priority === 'Critical'
                    ? 'bg-red-100 text-red-800'
                    : appliance.priority === 'Important'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {appliance.name}
                <button
                  type="button"
                  onClick={() => handleRemoveAppliance(appliance.id)}
                  className="ml-1 hover:text-gray-900"
                  aria-label={`Remove ${appliance.name}`}
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Appliance Library */}
      <div className="space-y-4">
        {Object.entries(groupedAppliances).map(([category, appliances]) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {appliances.map(appliance => {
                const isSelected = selectedAppliances.some(a => a.id === appliance.id);
                return (
                  <label
                    key={appliance.id}
                    className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors duration-150 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleAppliance(appliance.id)}
                      className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{appliance.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          appliance.priority === 'Critical'
                            ? 'bg-red-100 text-red-800'
                            : appliance.priority === 'Important'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {appliance.priority}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {appliance.ratedWatts}W running · {appliance.surgeWatts}W surge · {appliance.defaultHoursPerDay}h/day
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Appliance */}
      <div className="border-t pt-4">
        {!showAddForm ? (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            + Add Custom Appliance
          </button>
        ) : (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700">Add Custom Appliance</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label htmlFor="custom-name" className="block text-xs text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  id="custom-name"
                  value={newAppliance.name}
                  onChange={(e) => setNewAppliance({ ...newAppliance, name: e.target.value })}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Medical Device"
                />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <label htmlFor="custom-watts" className="block text-xs text-gray-600 mb-1">Running Watts</label>
                <input
                  type="number"
                  id="custom-watts"
                  value={newAppliance.ratedWatts}
                  onChange={(e) => setNewAppliance({ ...newAppliance, ratedWatts: e.target.value })}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.ratedWatts ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="100"
                  min="1"
                />
                {errors.ratedWatts && <p className="text-xs text-red-600 mt-1">{errors.ratedWatts}</p>}
              </div>
              
              <div>
                <label htmlFor="custom-surge" className="block text-xs text-gray-600 mb-1">Surge Watts (optional)</label>
                <input
                  type="number"
                  id="custom-surge"
                  value={newAppliance.surgeWatts}
                  onChange={(e) => setNewAppliance({ ...newAppliance, surgeWatts: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Same as running"
                  min="1"
                />
              </div>
              
              <div>
                <label htmlFor="custom-hours" className="block text-xs text-gray-600 mb-1">Hours/Day</label>
                <input
                  type="number"
                  id="custom-hours"
                  value={newAppliance.defaultHoursPerDay}
                  onChange={(e) => setNewAppliance({ ...newAppliance, defaultHoursPerDay: e.target.value })}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.defaultHoursPerDay ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="8"
                  min="0"
                  max="24"
                  step="0.5"
                />
                {errors.defaultHoursPerDay && <p className="text-xs text-red-600 mt-1">{errors.defaultHoursPerDay}</p>}
              </div>
              
              <div>
                <label htmlFor="custom-priority" className="block text-xs text-gray-600 mb-1">Priority</label>
                <select
                  id="custom-priority"
                  value={newAppliance.priority}
                  onChange={(e) => setNewAppliance({ ...newAppliance, priority: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.values(PRIORITIES).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddCustomAppliance}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-150"
              >
                Add Appliance
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setErrors({});
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors duration-150"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
