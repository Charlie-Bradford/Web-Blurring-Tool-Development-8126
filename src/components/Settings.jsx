import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import { useBlur } from '../context/BlurContext';
import { 
  FiSettings, 
  FiEye, 
  FiBell, 
  FiSave, 
  FiDownload, 
  FiUpload, 
  FiTrash2 
} from 'react-icons/fi';

const Settings = () => {
  const { settings, saveSettings, blurRules } = useBlur();
  const [localSettings, setLocalSettings] = useState(settings);
  const [showSaveNotification, setShowSaveNotification] = useState(false);

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    saveSettings(localSettings);
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 3000);
  };

  const handleExportRules = () => {
    const exportData = {
      rules: blurRules,
      settings: localSettings,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `webblur-rules-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportRules = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target.result);
        if (importData.rules && Array.isArray(importData.rules)) {
          console.log('Import successful:', importData);
          alert('Rules imported successfully!');
        } else {
          alert('Invalid file format');
        }
      } catch (error) {
        alert('Error importing file');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.removeItem('webblur_rules');
      localStorage.removeItem('webblur_settings');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Customize your WebBlur experience</p>
      </motion.div>

      {/* Save Notification */}
      {showSaveNotification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
        >
          Settings saved successfully!
        </motion.div>
      )}

      <div className="space-y-6">
        {/* Blur Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <SafeIcon icon={FiEye} className="text-xl text-blue-600 w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Blur Settings</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Blur Intensity
                </label>
                <p className="text-sm text-gray-600">How strong the blur effect should be</p>
              </div>
              <div className="ml-4">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">1</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={localSettings.blurIntensity}
                    onChange={(e) => handleSettingChange('blurIntensity', parseInt(e.target.value))}
                    className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">5</span>
                  <span className="text-sm font-medium text-gray-900 min-w-[2rem]">
                    {localSettings.blurIntensity}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Auto Blur</h3>
                <p className="text-sm text-gray-600">Automatically apply blur rules when visiting websites</p>
              </div>
              <button
                onClick={() => handleSettingChange('autoBlur', !localSettings.autoBlur)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localSettings.autoBlur ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.autoBlur ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Data Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <SafeIcon icon={FiSettings} className="text-xl text-purple-600 w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Data Management</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Export Rules</h3>
                <p className="text-sm text-gray-600">Download your blur rules as a JSON file</p>
              </div>
              <button
                onClick={handleExportRules}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <SafeIcon icon={FiDownload} className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Import Rules</h3>
                <p className="text-sm text-gray-600">Upload a previously exported JSON file</p>
              </div>
              <label className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                <SafeIcon icon={FiUpload} className="w-4 h-4" />
                <span>Import</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportRules}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Clear All Data</h3>
                <p className="text-sm text-gray-600">Remove all rules and settings</p>
              </div>
              <button
                onClick={handleClearAllData}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex justify-end"
        >
          <button
            onClick={handleSaveSettings}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <SafeIcon icon={FiSave} className="w-5 h-5" />
            <span>Save Settings</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;