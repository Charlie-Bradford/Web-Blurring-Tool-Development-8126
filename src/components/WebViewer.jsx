import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import { useBlur } from '../context/BlurContext';
import { 
  FiGlobe, 
  FiEye, 
  FiEyeOff, 
  FiRefreshCw, 
  FiPlus, 
  FiMaximize2, 
  FiSettings 
} from 'react-icons/fi';

const WebViewer = () => {
  const [url, setUrl] = useState('https://example.com');
  const [isLoading, setIsLoading] = useState(false);
  const { getMatchingRules } = useBlur();

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validate URL
    try {
      new URL(url);
      // Open in new tab
      window.open(url, '_blank');
    } catch (error) {
      alert('Please enter a valid URL (including https://)');
    }
    
    setIsLoading(false);
  };

  const matchingRules = getMatchingRules(url);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Web Viewer</h1>
        <p className="text-gray-600">Browse websites with intelligent blur protection</p>
      </motion.div>

      {/* URL Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-lg shadow-md p-6 mb-6"
      >
        <form onSubmit={handleUrlSubmit} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <SafeIcon icon={FiGlobe} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL (e.g., https://example.com)"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <SafeIcon icon={FiRefreshCw} className="animate-spin w-5 h-5" />
              ) : (
                <SafeIcon icon={FiEye} className="w-5 h-5" />
              )}
              <span>Open in New Tab</span>
            </button>
          </div>
        </form>
      </motion.div>

      {/* CORS Warning */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-amber-500"
      >
        <div className="flex items-start space-x-4">
          <SafeIcon icon={FiSettings} className="text-2xl text-amber-500 mt-1 w-8 h-8" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Important Note About Website Access</h3>
            <p className="text-gray-600 mb-2">
              Due to browser security restrictions (CORS), some websites may not allow direct access when embedded in an iframe.
              If you encounter issues:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
              <li>Use the "Open in New Tab" option for better compatibility</li>
              <li>Use the Chrome extension for better integration with websites</li>
              <li>Some sites may never allow embedding for security reasons</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-lg shadow-md p-6 mb-6"
      >
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <SafeIcon icon={FiEye} className="text-2xl text-blue-600 w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">How to Create Blur Rules</h3>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Enter a website URL above</li>
              <li>2. Click "Open in New Tab" to visit the site</li>
              <li>3. Install the Chrome extension for advanced features</li>
              <li>4. Use the extension to select elements to blur</li>
              <li>5. Create and save your blur rules</li>
            </ol>
          </div>
        </div>
      </motion.div>

      {/* Current Rules */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Active Rules for {(() => {
            try {
              return new URL(url).hostname;
            } catch (e) {
              return 'this domain';
            }
          })()}
        </h3>
        
        {matchingRules.length > 0 ? (
          <div className="space-y-3">
            {matchingRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{rule.name}</h4>
                  <p className="text-sm text-gray-600">{rule.elements?.length || 0} elements blurred</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${rule.enabled !== false ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <SafeIcon icon={FiEye} className="text-4xl text-gray-300 mb-2 mx-auto w-16 h-16" />
            <p>No blur rules found for this domain</p>
            <p className="text-sm">Create your first rule using the Chrome extension</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default WebViewer;