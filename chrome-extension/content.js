class WebBlurContentScript {
  constructor() {
    this.rules = [];
    this.blurEnabled = true;
    this.blurIntensity = 3;
    this.currentDomain = window.location.hostname;
    this.styleElement = null;
    this.isSelectionMode = false;
    this.selectedElements = [];
    this.init();
  }

  async init() {
    // Load settings and rules
    await this.loadSettings();
    await this.loadRules();

    // Apply blur rules
    this.applyBlurRules();

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Required for async responses
    });

    // Listen for DOM changes
    this.observeDOM();
  }

  async loadSettings() {
    const settings = await chrome.storage.sync.get(['blurEnabled', 'blurIntensity']);
    this.blurEnabled = settings.blurEnabled !== false;
    this.blurIntensity = settings.blurIntensity || 3;
  }

  async loadRules() {
    const result = await chrome.storage.sync.get(['webblur_rules']);
    this.rules = result.webblur_rules || [];
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case 'toggleBlur':
        this.blurEnabled = message.enabled;
        this.applyBlurRules();
        sendResponse({ success: true });
        break;
      case 'updateIntensity':
        this.blurIntensity = message.intensity;
        this.applyBlurRules();
        sendResponse({ success: true });
        break;
      case 'updateRules':
        this.rules = message.rules;
        this.applyBlurRules();
        sendResponse({ success: true });
        break;
      case 'reapplyRules':
        this.applyBlurRules();
        sendResponse({ success: true });
        break;
      case 'storageChanged':
        this.loadRules().then(() => {
          this.applyBlurRules();
          sendResponse({ success: true });
        });
        break;
      case 'startElementSelection':
        this.startSelectionMode();
        sendResponse({ success: true });
        break;
      case 'stopElementSelection':
        this.stopSelectionMode();
        sendResponse({ success: true });
        break;
      case 'getSelectedElements':
        sendResponse({ elements: this.selectedElements });
        break;
      case 'addBlurRule':
        this.addBlurRule(message.rule).then(() => {
          sendResponse({ success: true });
        });
        break;
    }
  }

  getMatchingRules() {
    return this.rules.filter(rule => {
      if (!rule.enabled) return false;
      if (rule.urlPattern === '*') return true;
      const pattern = rule.urlPattern.replace(/\*/g, '.*');
      const regex = new RegExp(pattern, 'i');
      return regex.test(this.currentDomain);
    });
  }

  applyBlurRules() {
    // Remove existing styles
    if (this.styleElement) {
      this.styleElement.remove();
    }

    if (!this.blurEnabled) return;

    const matchingRules = this.getMatchingRules();
    if (matchingRules.length === 0) return;

    // Create new style element
    this.styleElement = document.createElement('style');
    this.styleElement.setAttribute('data-webblur', 'true');
    let css = '';

    matchingRules.forEach(rule => {
      if (rule.elements) {
        rule.elements.forEach(element => {
          const blurAmount = this.blurIntensity * 2;
          css += `
            ${element.selector} {
              filter: blur(${blurAmount}px) !important;
              transition: filter 0.3s ease !important;
            }
            ${element.selector}:hover {
              filter: blur(${blurAmount * 0.5}px) !important;
            }
          `;
        });
      }
    });

    this.styleElement.textContent = css;
    document.head.appendChild(this.styleElement);

    // Update rule usage count
    this.updateRuleUsage(matchingRules);
  }

  async updateRuleUsage(usedRules) {
    const updatedRules = this.rules.map(rule => {
      const usedRule = usedRules.find(ur => ur.id === rule.id);
      if (usedRule) {
        return {
          ...rule,
          timesUsed: (rule.timesUsed || 0) + 1,
          lastUsed: new Date().toISOString()
        };
      }
      return rule;
    });

    await chrome.storage.sync.set({ webblur_rules: updatedRules });
    this.rules = updatedRules;
  }

  async addBlurRule(rule) {
    if (!rule.id) {
      rule.id = this.generateUUID();
    }
    
    if (!rule.createdAt) {
      rule.createdAt = new Date().toISOString();
    }
    
    rule.enabled = rule.enabled !== false;
    rule.urlPattern = rule.urlPattern || this.currentDomain;
    rule.domain = this.currentDomain;
    
    const updatedRules = [...this.rules, rule];
    await chrome.storage.sync.set({ webblur_rules: updatedRules });
    this.rules = updatedRules;
    this.applyBlurRules();
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  startSelectionMode() {
    this.isSelectionMode = true;
    this.selectedElements = [];
    
    // Add selection mode class to body
    document.body.classList.add('webblur-selection-mode');
    
    // Create overlay for selection mode
    this.createSelectionOverlay();
    
    // Add event listeners
    this.addSelectionEventListeners();
  }

  createSelectionOverlay() {
    // Remove existing overlay if present
    this.removeSelectionOverlay();
    
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'webblur-selector-overlay';
    document.body.appendChild(this.overlay);
    
    // Create floating control panel
    this.controlPanel = document.createElement('div');
    this.controlPanel.style.position = 'fixed';
    this.controlPanel.style.bottom = '20px';
    this.controlPanel.style.right = '20px';
    this.controlPanel.style.backgroundColor = 'white';
    this.controlPanel.style.padding = '10px';
    this.controlPanel.style.borderRadius = '8px';
    this.controlPanel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    this.controlPanel.style.zIndex = '9999999';
    this.controlPanel.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 10px;">Selection Mode</div>
      <div style="margin-bottom: 10px;">Click on elements to blur them</div>
      <div style="display: flex; gap: 8px;">
        <button id="webblur-save-btn" style="padding: 8px 12px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Save</button>
        <button id="webblur-cancel-btn" style="padding: 8px 12px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
      </div>
    `;
    document.body.appendChild(this.controlPanel);
    
    // Add event listeners to buttons
    document.getElementById('webblur-save-btn').addEventListener('click', () => {
      this.saveSelection();
    });
    
    document.getElementById('webblur-cancel-btn').addEventListener('click', () => {
      this.stopSelectionMode();
    });
  }

  removeSelectionOverlay() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    
    if (this.controlPanel) {
      this.controlPanel.remove();
      this.controlPanel = null;
    }
  }

  addSelectionEventListeners() {
    this.handleMouseMove = (e) => {
      if (!this.isSelectionMode) return;
      
      const element = e.target;
      if (element && element !== document.body && element !== document.documentElement && 
          element !== this.overlay && !this.controlPanel.contains(element)) {
        // Remove previous highlights
        document.querySelectorAll('.webblur-highlight').forEach(el => {
          el.classList.remove('webblur-highlight');
        });
        
        // Add highlight to current element
        element.classList.add('webblur-highlight');
      }
    };
    
    this.handleClick = (e) => {
      if (!this.isSelectionMode) return;
      
      const element = e.target;
      if (element && element !== document.body && element !== document.documentElement && 
          element !== this.overlay && !this.controlPanel.contains(element)) {
        e.preventDefault();
        e.stopPropagation();
        
        // Generate selector for the element
        const selector = this.generateSelector(element);
        
        // Add to selected elements if not already selected
        if (!this.selectedElements.some(el => el.selector === selector)) {
          this.selectedElements.push({
            selector: selector,
            tagName: element.tagName.toLowerCase(),
            textContent: element.textContent?.substring(0, 50) || ''
          });
          
          // Add selected class
          element.classList.add('webblur-selected');
          
          // Show temporary feedback
          this.showSelectionFeedback(element);
        }
      }
    };
    
    this.handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        this.stopSelectionMode();
      }
    };
    
    // Add event listeners
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  showSelectionFeedback(element) {
    const feedback = document.createElement('div');
    feedback.textContent = 'Element selected!';
    feedback.style.position = 'fixed';
    feedback.style.top = '20px';
    feedback.style.left = '50%';
    feedback.style.transform = 'translateX(-50%)';
    feedback.style.backgroundColor = '#4CAF50';
    feedback.style.color = 'white';
    feedback.style.padding = '10px 20px';
    feedback.style.borderRadius = '4px';
    feedback.style.zIndex = '9999999';
    feedback.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
      feedback.remove();
    }, 2000);
  }

  stopSelectionMode() {
    this.isSelectionMode = false;
    
    // Remove selection mode class from body
    document.body.classList.remove('webblur-selection-mode');
    
    // Remove overlay
    this.removeSelectionOverlay();
    
    // Remove event listeners
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('keydown', this.handleKeyDown);
    
    // Remove all highlights
    document.querySelectorAll('.webblur-highlight, .webblur-selected').forEach(el => {
      el.classList.remove('webblur-highlight', 'webblur-selected');
    });
  }

  saveSelection() {
    if (this.selectedElements.length === 0) {
      alert('No elements selected. Please select at least one element to blur.');
      return;
    }
    
    // Create a new rule
    const ruleName = prompt('Enter a name for this blur rule:', `Blur rule for ${this.currentDomain}`);
    if (!ruleName) return;
    
    const rule = {
      name: ruleName,
      domain: this.currentDomain,
      urlPattern: this.currentDomain,
      enabled: true,
      elements: this.selectedElements,
      createdAt: new Date().toISOString()
    };
    
    // Add the rule
    this.addBlurRule(rule).then(() => {
      alert('Blur rule saved successfully!');
      this.stopSelectionMode();
    });
  }

  generateSelector(element) {
    if (!element) return '';
    
    try {
      // Try ID first
      if (element.id) {
        return `#${element.id}`;
      }
      
      // Try with classes
      if (element.className && typeof element.className === 'string') {
        const classes = element.className.split(' ')
          .filter(cls => cls.length > 0 && !cls.includes(':'))
          .filter(cls => !/^\d/.test(cls));
        
        if (classes.length > 0) {
          const classSelector = `.${classes.join('.')}`;
          // Verify this selector is specific enough (shouldn't select more than 5 elements)
          if (document.querySelectorAll(classSelector).length <= 5) {
            return classSelector;
          }
        }
      }
      
      // Try with tag name and attributes
      const tagName = element.tagName.toLowerCase();
      
      // For images, try with alt or src
      if (tagName === 'img' && element.alt) {
        return `img[alt="${element.alt}"]`;
      }
      
      if (tagName === 'img' && element.src) {
        // Use just the filename part of the src
        const srcParts = element.src.split('/');
        const filename = srcParts[srcParts.length - 1].split('?')[0];
        return `img[src*="${filename}"]`;
      }
      
      // For links, try with href
      if (tagName === 'a' && element.href) {
        const hrefParts = element.href.split('/');
        const lastPart = hrefParts[hrefParts.length - 1].split('?')[0];
        if (lastPart.length > 0) {
          return `a[href*="${lastPart}"]`;
        }
      }
      
      // Try with parent relationship
      const parent = element.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(element) + 1;
        const parentTag = parent.tagName.toLowerCase();
        
        return `${parentTag} > ${tagName}:nth-child(${index})`;
      }
      
      // Fallback to simple tag
      return tagName;
    } catch (error) {
      console.error('Error generating selector:', error);
      return element.tagName ? element.tagName.toLowerCase() : 'div';
    }
  }

  observeDOM() {
    const observer = new MutationObserver((mutations) => {
      let shouldReapply = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldReapply = true;
        }
      });

      if (shouldReapply) {
        // Debounce reapplication
        clearTimeout(this.reapplyTimeout);
        this.reapplyTimeout = setTimeout(() => {
          this.applyBlurRules();
        }, 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new WebBlurContentScript();
  });
} else {
  new WebBlurContentScript();
}