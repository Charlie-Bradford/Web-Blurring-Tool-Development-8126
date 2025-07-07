import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import { useBlur } from '../context/BlurContext';
import { 
  FiEye, 
  FiShield, 
  FiLayers, 
  FiTrendingUp, 
  FiClock, 
  FiGlobe, 
  FiPlus, 
  FiArrowRight 
} from 'react-icons/fi';

const Dashboard = () => {
  const { blurRules } = useBlur();
  const [stats, setStats] = useState({
    totalRules: 0,
    activeRules: 0,
    sitesProtected: 0,
    elementsBlurred: 0
  });

  useEffect(() => {
    const totalRules = blurRules.length;
    const activeRules = blurRules.filter(rule => rule.enabled !== false).length;
    const sitesProtected = new Set(blurRules.map(rule => rule.domain)).size;
    const elementsBlurred = blurRules.reduce((sum, rule) => sum + (rule.timesUsed || 0), 0);

    setStats({
      totalRules,
      activeRules,
      sitesProtected,
      elementsBlurred
    });
  }, [blurRules]);

  const statsCards = [
    {
      title: 'Total Rules',
      value: stats.totalRules,
      icon: FiLayers,
      color: 'blue',
      description: 'Blur rules created'
    },
    {
      title: 'Active Rules',
      value: stats.activeRules,
      icon: FiShield,
      color: 'green',
      description: 'Currently protecting'
    },
    {
      title: 'Sites Protected',
      value: stats.sitesProtected,
      icon: FiGlobe,
      color: 'purple',
      description: 'Domains with rules'
    },
    {
      title: 'Elements Blurred',
      value: stats.elementsBlurred,
      icon: FiTrendingUp,
      color: 'orange',
      description: 'Total blur applications'
    }
  ];

  const quickActions = [
    {
      title: 'Create New Rule',
      description: 'Add a new blur rule for a website',
      icon: FiPlus,
      link: '/viewer',
      color: 'blue'
    },
    {
      title: 'Manage Rules',
      description: 'View and edit existing blur rules',
      icon: FiLayers,
      link: '/rules',
      color: 'purple'
    },
    {
      title: 'Browse Safely',
      description: 'Open web viewer with blur protection',
      icon: FiEye,
      link: '/viewer',
      color: 'green'
    }
  ];

  const recentRules = blurRules
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Monitor your privacy protection and manage blur rules</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <SafeIcon icon={card.icon} className="text-xl text-blue-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                <div className="text-sm text-gray-500">{card.description}</div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="space-y-4">
            {quickActions.map((action, index) => (
              <Link
                key={action.title}
                to={action.link}
                className="block p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <SafeIcon icon={action.icon} className="text-lg text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{action.title}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </div>
                  <SafeIcon icon={FiArrowRight} className="text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent Rules */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Rules</h2>
            <Link
              to="/rules"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All
            </Link>
          </div>
          
          {recentRules.length > 0 ? (
            <div className="space-y-3">
              {recentRules.map((rule) => (
                <div key={rule.id} className="p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <h4 className="font-medium text-gray-900">{rule.name}</h4>
                        <p className="text-sm text-gray-600">{rule.domain}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        <SafeIcon icon={FiClock} className="inline mr-1 w-4 h-4" />
                        {new Date(rule.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <SafeIcon icon={FiLayers} className="text-4xl text-gray-300 mb-4 mx-auto w-16 h-16" />
              <p className="text-gray-500">No blur rules created yet</p>
              <Link
                to="/viewer"
                className="inline-block mt-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Create your first rule
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;