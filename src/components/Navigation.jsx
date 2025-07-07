import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import { FiHome, FiEye, FiSettings, FiShield, FiLayers } from 'react-icons/fi';

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: FiHome, label: 'Dashboard' },
    { path: '/viewer', icon: FiEye, label: 'Web Viewer' },
    { path: '/rules', icon: FiLayers, label: 'Blur Rules' },
    { path: '/settings', icon: FiSettings, label: 'Settings' }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiShield} className="text-2xl text-blue-600 w-8 h-8" />
            <h1 className="text-xl font-bold text-blue-600">WebBlur</h1>
          </div>
          
          <div className="flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="relative px-4 py-2 rounded-lg transition-all duration-200 hover:bg-gray-100"
              >
                <div className="flex items-center space-x-2">
                  <SafeIcon 
                    icon={item.icon} 
                    className={`text-lg w-5 h-5 ${
                      location.pathname === item.path 
                        ? 'text-blue-600' 
                        : 'text-gray-600'
                    }`} 
                  />
                  <span className={`text-sm font-medium ${
                    location.pathname === item.path 
                      ? 'text-blue-600' 
                      : 'text-gray-600'
                  }`}>
                    {item.label}
                  </span>
                </div>
                {location.pathname === item.path && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-blue-50 rounded-lg -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;