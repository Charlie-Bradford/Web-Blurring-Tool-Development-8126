class WebBlurContentScript {
  constructor() {
    this.rules = [];
    this.blurEnabled = true;
    this.blurIntensity = 3;
    this.currentDomain = window.location.hostname;
    this.styleElement = null;
    
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
        break;
      case 'updateIntensity':
        this.blurIntensity = message.intensity;
        this.applyBlurRules();
        break;
      case 'updateRules':
        this.rules = message.rules;
        this.applyBlurRules();
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