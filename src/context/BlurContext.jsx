import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const BlurContext = createContext();

export const useBlur = () => {
  const context = useContext(BlurContext);
  if (!context) {
    throw new Error('useBlur must be used within a BlurProvider');
  }
  return context;
};

export const BlurProvider = ({ children }) => {
  const [blurRules, setBlurRules] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [settings, setSettings] = useState({
    blurIntensity: 3,
    autoBlur: true,
    rememberStructure: true,
    showNotifications: true
  });

  useEffect(() => {
    loadBlurRules();
    loadSettings();
  }, []);

  const loadBlurRules = () => {
    try {
      const stored = localStorage.getItem('webblur_rules');
      if (stored) {
        const parsed = JSON.parse(stored);
        setBlurRules(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading blur rules:', error);
      setBlurRules([]);
    }
  };

  const saveBlurRules = (rules) => {
    try {
      localStorage.setItem('webblur_rules', JSON.stringify(rules));
      setBlurRules(rules);
    } catch (error) {
      console.error('Error saving blur rules:', error);
    }
  };

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem('webblur_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...settings, ...parsed });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = (newSettings) => {
    try {
      localStorage.setItem('webblur_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const addBlurRule = (rule) => {
    try {
      if (!rule.id) {
        rule.id = uuidv4();
      }
      
      if (!rule.createdAt) {
        rule.createdAt = new Date().toISOString();
      }
      
      rule.timesUsed = rule.timesUsed || 0;
      
      const updatedRules = [...blurRules, rule];
      saveBlurRules(updatedRules);
      return rule;
    } catch (error) {
      console.error('Error adding blur rule:', error);
      return null;
    }
  };

  const updateBlurRule = (id, updates) => {
    try {
      const updatedRules = blurRules.map(rule => 
        rule.id === id ? { ...rule, ...updates } : rule
      );
      saveBlurRules(updatedRules);
    } catch (error) {
      console.error('Error updating blur rule:', error);
    }
  };

  const deleteBlurRule = (id) => {
    try {
      const updatedRules = blurRules.filter(rule => rule.id !== id);
      saveBlurRules(updatedRules);
    } catch (error) {
      console.error('Error deleting blur rule:', error);
    }
  };

  const getMatchingRules = (url) => {
    if (!url) return [];
    
    try {
      let domain;
      try {
        domain = new URL(url).hostname;
      } catch (e) {
        domain = url;
      }
      
      return blurRules.filter(rule => {
        if (!rule.urlPattern) return false;
        
        if (rule.urlPattern === '*') return true;
        
        const pattern = rule.urlPattern
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*');
          
        try {
          const regex = new RegExp(pattern, 'i');
          return regex.test(domain);
        } catch (e) {
          return domain.includes(rule.urlPattern);
        }
      });
    } catch (error) {
      console.error('Error matching rules:', error);
      return [];
    }
  };

  const generateElementSelector = (element) => {
    if (!element) return '';
    
    try {
      const selectors = [];
      
      if (element.id) {
        selectors.push(`#${element.id}`);
      }
      
      if (element.className && typeof element.className === 'string') {
        const classes = element.className.split(' ')
          .filter(cls => cls.length > 0 && !cls.includes(':'))
          .filter(cls => !/^\d/.test(cls));
          
        if (classes.length > 0) {
          selectors.push(`.${classes.join('.')}`);
        }
      }
      
      const parent = element.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(element) + 1;
        selectors.push(`${element.tagName.toLowerCase()}:nth-child(${index})`);
      }
      
      selectors.push(element.tagName.toLowerCase());
      
      return selectors[0] || element.tagName.toLowerCase();
    } catch (error) {
      console.error('Error generating selector:', error);
      return element.tagName ? element.tagName.toLowerCase() : 'div';
    }
  };

  const extractElementStructure = (element) => {
    if (!element) return {};
    
    try {
      return {
        tagName: element.tagName.toLowerCase(),
        className: element.className || '',
        id: element.id || '',
        textContent: element.textContent?.substring(0, 100) || ''
      };
    } catch (error) {
      console.error('Error extracting element structure:', error);
      return { tagName: 'div' };
    }
  };

  const value = {
    blurRules,
    isSelectionMode,
    setIsSelectionMode,
    currentUrl,
    setCurrentUrl,
    settings,
    saveSettings,
    addBlurRule,
    updateBlurRule,
    deleteBlurRule,
    getMatchingRules,
    generateElementSelector,
    extractElementStructure
  };

  return (
    <BlurContext.Provider value={value}>
      {children}
    </BlurContext.Provider>
  );
};