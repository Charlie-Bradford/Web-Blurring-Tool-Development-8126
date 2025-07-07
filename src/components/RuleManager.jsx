import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import { useBlur } from '../context/BlurContext';
import { 
  FiEdit, 
  FiTrash2, 
  FiToggleLeft, 
  FiToggleRight, 
  FiGlobe, 
  FiEye, 
  FiClock, 
  FiSearch, 
  FiFilter 
} from 'react-icons/fi';

const RuleManager = () => {
  const { blurRules, updateBlurRule, deleteBlurRule } = useBlur();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEnabled, setFilterEnabled] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');

  const filteredRules = blurRules
    .filter(rule => {
      const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           rule.domain.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterEnabled === 'all' ||
                           (filterEnabled === 'enabled' && rule.enabled !== false) ||
                           (filterEnabled === 'disabled' && rule.enabled === false);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'domain':
          return a.domain.localeCompare(b.domain);
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'timesUsed':
          return (b.timesUsed || 0) - (a.timesUsed || 0);
        default:
          return 0;
      }
    });

  const handleToggleRule = (ruleId) => {
    const rule = blurRules.find(r => r.id === ruleId);
    updateBlurRule(ruleId, { enabled: !rule.enabled });
  };

  const handleDeleteRule = (ruleId) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      deleteBlurRule(ruleId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Blur Rules</h1>
        <p className="text-gray-600">Manage your website blur rules and privacy settings</p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-lg shadow-md p-6 mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search rules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterEnabled}
              onChange={(e) => setFilterEnabled(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Rules</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiFilter} className="text-gray-400 w-5 h-5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="createdAt">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="domain">Sort by Domain</option>
              <option value="timesUsed">Sort by Usage</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Rules List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredRules.map((rule, index) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${rule.enabled !== false ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <SafeIcon icon={FiGlobe} className="w-4 h-4" />
                        <span>{rule.domain}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <SafeIcon icon={FiEye} className="w-4 h-4" />
                        <span>{rule.elements?.length || 0} elements</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <SafeIcon icon={FiClock} className="w-4 h-4" />
                        <span>{new Date(rule.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-500">
                    Used {rule.timesUsed || 0} times
                  </div>
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      rule.enabled !== false 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    title={rule.enabled !== false ? 'Disable rule' : 'Enable rule'}
                  >
                    <SafeIcon 
                      icon={rule.enabled !== false ? FiToggleRight : FiToggleLeft} 
                      className="text-xl w-6 h-6" 
                    />
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete rule"
                  >
                    <SafeIcon icon={FiTrash2} className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {rule.elements && rule.elements.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Blurred Elements:</h4>
                  <div className="space-y-1">
                    {rule.elements.slice(0, 3).map((element, idx) => (
                      <div key={idx} className="text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">
                        {element.selector}
                      </div>
                    ))}
                    {rule.elements.length > 3 && (
                      <div className="text-sm text-gray-500">
                        +{rule.elements.length - 3} more elements
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredRules.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <SafeIcon icon={FiEye} className="text-6xl text-gray-300 mb-4 mx-auto w-24 h-24" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No rules found</h3>
          <p className="text-gray-500">
            {searchTerm || filterEnabled !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'Create your first blur rule to get started'}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default RuleManager;