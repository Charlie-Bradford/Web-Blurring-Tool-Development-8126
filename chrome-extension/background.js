// Background script for WebBlur extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('WebBlur extension installed');
  
  // Initialize default settings
  chrome.storage.sync.set({
    blurEnabled: true,
    blurIntensity: 3,
    showNotifications: true,
    webblur_rules: []
  });
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  // Open popup (this is handled automatically by manifest)
});

// Listen for tab updates to reapply blur rules
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      // Send message to content script to reapply rules
      await chrome.tabs.sendMessage(tabId, {
        action: 'reapplyRules'
      });
    } catch (error) {
      // Tab might not have content script loaded yet
      console.log('Could not send message to tab:', error);
    }
  }
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    // Notify all tabs about rule changes
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'storageChanged',
            changes: changes
          }).catch(() => {
            // Ignore errors for tabs without content script
          });
        }
      });
    });
  }
});

// Context menu for quick access
chrome.contextMenus.create({
  id: 'webblur-toggle',
  title: 'Toggle WebBlur Protection',
  contexts: ['page']
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'webblur-toggle') {
    const settings = await chrome.storage.sync.get(['blurEnabled']);
    const newState = !settings.blurEnabled;
    
    await chrome.storage.sync.set({ blurEnabled: newState });
    
    chrome.tabs.sendMessage(tab.id, {
      action: 'toggleBlur',
      enabled: newState
    });
  }
});