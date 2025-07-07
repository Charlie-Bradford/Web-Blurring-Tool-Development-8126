let allRules = [];
let filteredRules = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadRules();
  setupEventListeners();
  updateStats();
  renderRules();
});

async function loadRules() {
  const result = await chrome.storage.sync.get(['webblur_rules']);
  allRules = result.webblur_rules || [];
  filteredRules = [...allRules];
}

function setupEventListeners() {
  const searchBox = document.getElementById('searchBox');
  searchBox.addEventListener('input', handleSearch);
}

function handleSearch(event) {
  const searchTerm = event.target.value.toLowerCase();
  filteredRules = allRules.filter(rule => 
    rule.name.toLowerCase().includes(searchTerm) ||
    rule.domain.toLowerCase().includes(searchTerm)
  );
  renderRules();
}

function updateStats() {
  const totalRules = allRules.length;
  const activeRules = allRules.filter(rule => rule.enabled !== false).length;
  const sitesProtected = new Set(allRules.map(rule => rule.domain)).size;
  const totalUsage = allRules.reduce((sum, rule) => sum + (rule.timesUsed || 0), 0);

  document.getElementById('totalRules').textContent = totalRules;
  document.getElementById('activeRules').textContent = activeRules;
  document.getElementById('sitesProtected').textContent = sitesProtected;
  document.getElementById('totalUsage').textContent = totalUsage;
}

function renderRules() {
  const rulesGrid = document.getElementById('rulesGrid');
  
  if (filteredRules.length === 0) {
    rulesGrid.innerHTML = `
      <div class="empty-state">
        <h3>No rules found</h3>
        <p>Create your first blur rule using the WebBlur web app</p>
        <a href="#" class="button button-primary" onclick="openWebApp()">Open Web App</a>
      </div>
    `;
    return;
  }

  rulesGrid.innerHTML = filteredRules.map(rule => `
    <div class="rule-card">
      <div class="rule-header">
        <div>
          <h3 class="rule-title">${rule.name}</h3>
          <div class="rule-domain">🌐 ${rule.domain}</div>
          <div class="rule-meta">
            <span>📅 ${new Date(rule.createdAt).toLocaleDateString()}</span>
            <span>🔢 Used ${rule.timesUsed || 0} times</span>
            <span>📝 ${rule.elements?.length || 0} elements</span>
          </div>
        </div>
        <div class="toggle-switch ${rule.enabled !== false ? 'active' : ''}" 
             onclick="toggleRule('${rule.id}')"></div>
      </div>
      
      ${rule.elements && rule.elements.length > 0 ? `
        <div class="rule-elements">
          <h4>Blurred Elements:</h4>
          <div class="element-list">
            ${rule.elements.slice(0, 5).map(element => `
              <span class="element-tag">${element.selector}</span>
            `).join('')}
            ${rule.elements.length > 5 ? `
              <span class="element-tag">+${rule.elements.length - 5} more</span>
            ` : ''}
          </div>
        </div>
      ` : ''}
      
      <div class="rule-actions">
        <button class="button button-secondary" onclick="editRule('${rule.id}')">✏️ Edit</button>
        <button class="button button-danger" onclick="deleteRule('${rule.id}')">🗑️ Delete</button>
      </div>
    </div>
  `).join('');
}

async function toggleRule(ruleId) {
  const rule = allRules.find(r => r.id === ruleId);
  if (!rule) return;

  rule.enabled = !rule.enabled;
  await chrome.storage.sync.set({ webblur_rules: allRules });
  
  updateStats();
  renderRules();
  
  // Notify all tabs about the change
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateRules',
        rules: allRules
      }).catch(() => {});
    }
  });
}

async function deleteRule(ruleId) {
  if (!confirm('Are you sure you want to delete this rule?')) return;

  allRules = allRules.filter(rule => rule.id !== ruleId);
  filteredRules = filteredRules.filter(rule => rule.id !== ruleId);
  
  await chrome.storage.sync.set({ webblur_rules: allRules });
  
  updateStats();
  renderRules();
}

function editRule(ruleId) {
  // For now, just show an alert. In a full implementation, 
  // you'd open an edit dialog or navigate to an edit page
  alert('Edit functionality would be implemented here. For now, you can delete and recreate the rule.');
}

function exportRules() {
  const exportData = {
    rules: allRules,
    exportDate: new Date().toISOString(),
    version: '1.0.0'
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `webblur-rules-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importRules(event) {
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
      `This will import ${importData.rules.length} rules. Existing rules with the same name will be overwritten. Continue?`
    );
    
    if (!confirmImport) return;

    // Merge rules (replace duplicates by name)
    const importedRules = importData.rules;
    const existingRuleNames = new Set(allRules.map(r => r.name));
    
    importedRules.forEach(importedRule => {
      if (existingRuleNames.has(importedRule.name)) {
        // Replace existing rule
        const index = allRules.findIndex(r => r.name === importedRule.name);
        allRules[index] = importedRule;
      } else {
        // Add new rule
        allRules.push(importedRule);
      }
    });

    await chrome.storage.sync.set({ webblur_rules: allRules });
    
    filteredRules = [...allRules];
    updateStats();
    renderRules();
    
    alert(`Successfully imported ${importedRules.length} rules!`);
  } catch (error) {
    alert('Error importing file. Please check the file format and try again.');
    console.error('Import error:', error);
  }
  
  // Reset file input
  event.target.value = '';
}

async function clearAllRules() {
  const confirmClear = confirm(
    'Are you sure you want to delete ALL rules? This action cannot be undone.'
  );
  
  if (!confirmClear) return;

  allRules = [];
  filteredRules = [];
  
  await chrome.storage.sync.set({ webblur_rules: [] });
  
  updateStats();
  renderRules();
  
  alert('All rules have been cleared.');
}

function openWebApp() {
  // In a real implementation, this would open your web app
  // For now, it could open a local HTML file or a hosted version
  chrome.tabs.create({ url: 'index.html' });
}