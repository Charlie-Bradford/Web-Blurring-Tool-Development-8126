document.addEventListener('DOMContentLoaded', async () => {
  const mainToggle = document.getElementById('mainToggle');
  const statusText = document.getElementById('statusText');
  const rulesList = document.getElementById('rulesList');
  const intensitySlider = document.getElementById('intensitySlider');
  const openManagerBtn = document.getElementById('openManager');
  const selectElementsBtn = document.getElementById('selectElements');
  const openSettingsBtn = document.getElementById('openSettings');

  let currentTab = null;
  let currentDomain = null;
  let blurEnabled = true;
  let blurIntensity = 3;

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
  
  if (currentTab?.url) {
    try {
      const url = new URL(currentTab.url);
      currentDomain = url.hostname;
    } catch (error) {
      console.log('Invalid URL:', error);
    }
  }

  // Load settings
  const settings = await chrome.storage.sync.get(['blurEnabled', 'blurIntensity']);
  blurEnabled = settings.blurEnabled !== false;
  blurIntensity = settings.blurIntensity || 3;

  // Update UI
  updateToggleState();
  updateIntensitySlider();
  await loadRules();

  // Event listeners
  mainToggle.addEventListener('click', toggleBlur);
  intensitySlider.addEventListener('input', updateIntensity);
  openManagerBtn.addEventListener('click', openRuleManager);
  selectElementsBtn.addEventListener('click', startElementSelection);
  openSettingsBtn.addEventListener('click', openSettings);

  function updateToggleState() {
    mainToggle.classList.toggle('active', blurEnabled);
    statusText.textContent = blurEnabled 
      ? `Blur protection is ON for ${currentDomain || 'this page'}`
      : 'Blur protection is OFF';
  }

  function updateIntensitySlider() {
    intensitySlider.value = blurIntensity;
  }

  async function toggleBlur() {
    blurEnabled = !blurEnabled;
    await chrome.storage.sync.set({ blurEnabled });
    updateToggleState();

    // Send message to content script
    if (currentTab?.id) {
      chrome.tabs.sendMessage(currentTab.id, {
        action: 'toggleBlur',
        enabled: blurEnabled
      });
    }
  }

  async function updateIntensity() {
    blurIntensity = parseInt(intensitySlider.value);
    await chrome.storage.sync.set({ blurIntensity });

    // Send message to content script
    if (currentTab?.id) {
      chrome.tabs.sendMessage(currentTab.id, {
        action: 'updateIntensity',
        intensity: blurIntensity
      });
    }
  }

  async function loadRules() {
    if (!currentDomain) {
      rulesList.innerHTML = '<div class="empty-state">Cannot detect current domain</div>';
      return;
    }

    const result = await chrome.storage.sync.get(['webblur_rules']);
    const rules = result.webblur_rules || [];
    
    const matchingRules = rules.filter(rule => {
      if (rule.urlPattern === '*') return true;
      const pattern = rule.urlPattern.replace(/\*/g, '.*');
      const regex = new RegExp(pattern, 'i');
      return regex.test(currentDomain);
    });

    if (matchingRules.length === 0) {
      rulesList.innerHTML = '<div class="empty-state">No rules found for this page</div>';
      return;
    }

    rulesList.innerHTML = matchingRules.map(rule => `
      <div class="rule-item">
        <div>
          <div class="rule-name">${rule.name}</div>
          <div class="rule-domain">${rule.domain}</div>
        </div>
        <div class="rule-toggle ${rule.enabled !== false ? 'active' : ''}" data-rule-id="${rule.id}"></div>
      </div>
    `).join('');

    // Add event listeners for rule toggles
    rulesList.querySelectorAll('.rule-toggle').forEach(toggle => {
      toggle.addEventListener('click', async (e) => {
        const ruleId = e.target.dataset.ruleId;
        const rule = matchingRules.find(r => r.id === ruleId);
        
        if (rule) {
          rule.enabled = !rule.enabled;
          e.target.classList.toggle('active', rule.enabled);
          
          // Update storage
          const updatedRules = rules.map(r => r.id === ruleId ? rule : r);
          await chrome.storage.sync.set({ webblur_rules: updatedRules });
          
          // Send message to content script
          if (currentTab?.id) {
            chrome.tabs.sendMessage(currentTab.id, {
              action: 'updateRules',
              rules: updatedRules
            });
          }
        }
      });
    });
  }

  function startElementSelection() {
    if (currentTab?.id) {
      chrome.tabs.sendMessage(currentTab.id, { action: 'startElementSelection' });
      window.close(); // Close popup to see the page fully
    }
  }

  function openRuleManager() {
    chrome.tabs.create({ url: chrome.runtime.getURL('manager.html') });
  }
  
  function openSettings() {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  }
});