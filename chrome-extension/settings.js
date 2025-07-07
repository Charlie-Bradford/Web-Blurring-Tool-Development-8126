document.addEventListener('DOMContentLoaded', async () => {
  // Get elements
  const blurEnabledToggle = document.getElementById('blurEnabledToggle');
  const blurIntensitySlider = document.getElementById('blurIntensitySlider');
  const intensityValue = document.getElementById('intensityValue');
  const autoApplyToggle = document.getElementById('autoApplyToggle');
  const showNotificationsToggle = document.getElementById('showNotificationsToggle');
  const exportBtn = document.getElementById('exportBtn');
  const importFile = document.getElementById('importFile');
  const clearDataBtn = document.getElementById('clearDataBtn');
  const saveBtn = document.getElementById('saveBtn');
  const backBtn = document.getElementById('backBtn');
  const notification = document.getElementById('notification');

  // Load current settings
  const settings = await chrome.storage.sync.get([
    'blurEnabled',
    'blurIntensity',
    'autoApply',
    'showNotifications'
  ]);

  // Set initial values
  blurEnabledToggle.classList.toggle('active', settings.blurEnabled !== false);
  blurIntensitySlider.value = settings.blurIntensity || 3;
  intensityValue.textContent = blurIntensitySlider.value;
  autoApplyToggle.classList.toggle('active', settings.autoApply !== false);
  showNotificationsToggle.classList.toggle('active', settings.showNotifications !== false);

  // Event listeners
  blurEnabledToggle.addEventListener('click', () => {
    blurEnabledToggle.classList.toggle('active');
  });

  blurIntensitySlider.addEventListener('input', () => {
    intensityValue.textContent = blurIntensitySlider.value;
  });

  autoApplyToggle.addEventListener('click', () => {
    autoApplyToggle.classList.toggle('active');
  });

  showNotificationsToggle.addEventListener('click', () => {
    showNotificationsToggle.classList.toggle('active');
  });

  // Save settings
  saveBtn.addEventListener('click', async () => {
    const newSettings = {
      blurEnabled: blurEnabledToggle.classList.contains('active'),
      blurIntensity: parseInt(blurIntensitySlider.value),
      autoApply: autoApplyToggle.classList.contains('active'),
      showNotifications: showNotificationsToggle.classList.contains('active')
    };

    await chrome.storage.sync.set(newSettings);
    
    // Show notification
    notification.classList.add('show');
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  });

  // Export rules
  exportBtn.addEventListener('click', async () => {
    const result = await chrome.storage.sync.get(['webblur_rules']);
    const rules = result.webblur_rules || [];
    
    const exportData = {
      rules: rules,
      settings: {
        blurEnabled: blurEnabledToggle.classList.contains('active'),
        blurIntensity: parseInt(blurIntensitySlider.value),
        autoApply: autoApplyToggle.classList.contains('active'),
        showNotifications: showNotificationsToggle.classList.contains('active')
      },
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `webblur-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  // Import rules
  importFile.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      if (!importData.rules || !Array.isArray(importData.rules)) {
        alert('Invalid file format. Please select a valid WebBlur export file.');
        return;
      }

      const confirmImport = confirm(
        `This will import ${importData.rules.length} rules and overwrite your current settings. Continue?`
      );

      if (confirmImport) {
        // Import rules
        await chrome.storage.sync.set({ webblur_rules: importData.rules });
        
        // Import settings if available
        if (importData.settings) {
          await chrome.storage.sync.set(importData.settings);
          
          // Update UI
          blurEnabledToggle.classList.toggle('active', importData.settings.blurEnabled !== false);
          blurIntensitySlider.value = importData.settings.blurIntensity || 3;
          intensityValue.textContent = blurIntensitySlider.value;
          autoApplyToggle.classList.toggle('active', importData.settings.autoApply !== false);
          showNotificationsToggle.classList.toggle('active', importData.settings.showNotifications !== false);
        }

        notification.textContent = 'Import successful!';
        notification.classList.add('show');
        setTimeout(() => {
          notification.classList.remove('show');
        }, 3000);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Error importing file. Please check the file format and try again.');
    }

    // Reset file input
    event.target.value = '';
  });

  // Clear all data
  clearDataBtn.addEventListener('click', () => {
    const confirmed = confirm('Are you sure you want to delete ALL rules and reset settings? This action cannot be undone.');
    
    if (confirmed) {
      chrome.storage.sync.clear(() => {
        notification.textContent = 'All data has been cleared!';
        notification.classList.add('show');
        
        // Reset UI
        blurEnabledToggle.classList.add('active');
        blurIntensitySlider.value = 3;
        intensityValue.textContent = '3';
        autoApplyToggle.classList.add('active');
        showNotificationsToggle.classList.add('active');
        
        setTimeout(() => {
          notification.classList.remove('show');
        }, 3000);
      });
    }
  });

  // Back button
  backBtn.addEventListener('click', () => {
    window.history.back();
  });
});