import { Monitor, Moon, Sun, Bell, Save, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function SettingsTab() {
  const { state, setSettings } = useApp();

  const updateSetting = (key: keyof typeof state.settings, value: any) => {
    setSettings({
      ...state.settings,
      [key]: value,
    });
  };

  const currencies = [
    { code: 'INR', name: 'Indian Rupee (₹)' },
    { code: 'USD', name: 'US Dollar ($)' },
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'GBP', name: 'British Pound (£)' },
    { code: 'JPY', name: 'Japanese Yen (¥)' },
    { code: 'CAD', name: 'Canadian Dollar (C$)' },
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'zh', name: '中文' },
  ];

  return (
    <div className="space-y-8">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Display Settings
        </h3>
        
        <div className="space-y-6">
          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Theme Preference
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => updateSetting('theme', 'light')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                  state.settings.theme === 'light'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600'
                }`}
              >
                <Sun className="h-4 w-4" />
                <span className="text-sm font-medium">Light</span>
              </button>
              
              <button
                onClick={() => updateSetting('theme', 'dark')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                  state.settings.theme === 'dark'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600'
                }`}
              >
                <Moon className="h-4 w-4" />
                <span className="text-sm font-medium">Dark</span>
              </button>
              
              <button
                onClick={() => updateSetting('theme', 'system')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                  state.settings.theme === 'system'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600'
                }`}
              >
                <Monitor className="h-4 w-4" />
                <span className="text-sm font-medium">System</span>
              </button>
            </div>
          </div>

          {/* Currency Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Currency
            </label>
            <select
              value={state.settings.currency}
              onChange={(e) => updateSetting('currency', e.target.value)}
              className="input-field"
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.name}
                </option>
              ))}
            </select>
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Language
            </label>
            <select
              value={state.settings.language}
              onChange={(e) => updateSetting('language', e.target.value)}
              className="input-field"
            >
              {languages.map(language => (
                <option key={language.code} value={language.code}>
                  {language.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Application Settings
        </h3>
        
        <div className="space-y-6">
          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notifications
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Receive updates about data changes and exports
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={state.settings.notifications}
                onChange={(e) => updateSetting('notifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Auto Save */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Save className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Auto Save
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Automatically save your work and preferences
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={state.settings.autoSave}
                onChange={(e) => updateSetting('autoSave', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Saved Filter Sets
        </h3>
        
        <div className="space-y-4">
          {state.settings.savedFilterSets.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No saved filter sets. Apply some filters and save them for quick access.
            </p>
          ) : (
            <div className="space-y-2">
              {state.settings.savedFilterSets.map((filterSet) => (
                <div
                  key={filterSet.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {filterSet.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Created: {new Date(filterSet.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const updatedSettings = {
                        ...state.settings,
                        savedFilterSets: state.settings.savedFilterSets.filter(
                          set => set.id !== filterSet.id
                        ),
                      };
                      setSettings(updatedSettings);
                    }}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Data Management
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Dataset
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {state.data.length} rows loaded
              </p>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem('dashboard-data');
                sessionStorage.removeItem('dashboard-datasets');
                window.location.reload();
              }}
              className="btn-secondary text-sm"
            >
              Clear Data
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Reset Settings
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Restore all settings to defaults
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('dashboard-settings');
                window.location.reload();
              }}
              className="btn-secondary text-sm"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          About
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p><strong>TruAlt Analytics Dashboard</strong></p>
          <p>Version 1.0.0</p>
          <p>Built with React, TypeScript, and Tailwind CSS</p>
          <p>© 2025 Analytics Dashboard. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}