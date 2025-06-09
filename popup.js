// Popup script for URL Prefix Redirector extension
class PopupManager {
  constructor() {
    this.rules = []
    this.editingRuleId = null
    this.init()
  }

  async init() {
    await this.loadRules()
    this.bindEvents()
    this.renderRules()
  }

  bindEvents() {
    // Add rule button
    document.getElementById('addRuleBtn').addEventListener('click', () => {
      showDebug('Add rule button clicked')
      this.showModal()
    })

    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', () => {
      this.showSettingsModal()
    })

    // Close modal events
    document.getElementById('closeModal').addEventListener('click', () => {
      this.hideModal()
    })

    document.getElementById('cancelBtn').addEventListener('click', () => {
      this.hideModal()
    })

    // Settings modal events
    document.getElementById('closeSettingsModal').addEventListener('click', () => {
      this.hideSettingsModal()
    })

    document.getElementById('cancelSettingsBtn').addEventListener('click', () => {
      this.hideSettingsModal()
    })

    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
      this.saveSettings()
    })

    document.getElementById('clearCooldownBtn').addEventListener('click', () => {
      this.clearCooldown()
    })

    // Form submission
    document.getElementById('ruleForm').addEventListener('submit', (e) => {
      e.preventDefault()
      this.saveRule()
    })

    // Add parameter button
    document.getElementById('addParamBtn').addEventListener('click', () => {
      this.addParameterRow()
    })

    // Add query match button
    document.getElementById('addQueryMatchBtn').addEventListener('click', () => {
      this.addQueryMatchRow()
    })

    // Auto close tab checkbox
    document.getElementById('autoCloseTab').addEventListener('change', (e) => {
      const closeUrlGroup = document.getElementById('closeUrlGroup')
      closeUrlGroup.style.display = e.target.checked ? 'block' : 'none'
    })

    // Close modal when clicking outside
    document.getElementById('ruleModal').addEventListener('click', (e) => {
      if (e.target.id === 'ruleModal') {
        this.hideModal()
      }
    })

    // Handle rule action buttons
    document.getElementById('rulesList').addEventListener('click', (e) => {
      const button = e.target.closest('[data-action]')
      if (!button) return

      const action = button.getAttribute('data-action')
      const ruleId = button.getAttribute('data-rule-id')
      
      showDebug(`Button clicked: ${action} for rule ${ruleId}`)

      switch (action) {
        case 'edit':
          this.editRule(ruleId)
          break
        case 'toggle':
          this.toggleRule(ruleId)
          break
        case 'delete':
          this.deleteRule(ruleId)
          break
      }
    })

    // Handle remove buttons in forms (using event delegation)
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('query-remove')) {
        e.target.parentElement.remove()
      } else if (e.target.classList.contains('param-remove')) {
        e.target.parentElement.remove()
      } else if (e.target.id === 'closeDebug') {
        document.getElementById('debugInfo').style.display = 'none'
      }
    })
  }

  async loadRules() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getRules' })
      if (response.success) {
        this.rules = response.rules || []
      } else {
        console.error('Failed to load rules:', response.error)
      }
    } catch (error) {
      console.error('Error loading rules:', error)
    }
  }

  renderRules() {
    const container = document.getElementById('rulesList')
    
    if (this.rules.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>还没有重定向规则</h3>
          <p>点击上方的"添加规则"按钮来创建您的第一个URL前缀重定向规则。</p>
        </div>
      `
      return
    }

         container.innerHTML = this.rules.map(rule => {
       const additionalParams = rule.additionalParams 
         ? Object.entries(rule.additionalParams).map(([k, v]) => `${k}=${v}`).join(', ')
         : ''
       
       const queryMatches = rule.queryParamMatches && rule.queryParamMatches.length > 0
         ? rule.queryParamMatches.map(match => {
             const matchTypeLabel = this.getMatchTypeLabel(match.matchType)
             return `${match.key} ${matchTypeLabel} ${match.value || ''}`
           }).join(', ')
         : ''
       
       return `
         <div class="rule-item ${!rule.enabled ? 'disabled' : ''}">
           <div class="rule-header">
             <span class="rule-name">${this.escapeHtml(rule.name)}</span>
             <span class="rule-status ${!rule.enabled ? 'disabled' : ''}">${rule.enabled ? '启用' : '禁用'}</span>
           </div>
           <div class="rule-details">
             <div class="rule-detail-item">
               <span class="rule-detail-label">源前缀:</span> ${this.escapeHtml(rule.sourcePrefix)}
             </div>
             <div class="rule-detail-item">
               <span class="rule-detail-label">目标URL:</span> ${this.escapeHtml(rule.targetUrl)}
             </div>
             ${queryMatches ? `<div class="rule-detail-item"><span class="rule-detail-label">查询参数匹配:</span> ${this.escapeHtml(queryMatches)}</div>` : ''}
             ${rule.preserveQueryParams ? '<div class="rule-detail-item">✓ 保留查询参数</div>' : ''}
             ${rule.preservePath ? '<div class="rule-detail-item">✓ 保留路径</div>' : ''}
             ${rule.autoCloseTab ? `<div class="rule-detail-item">🗙 自动关闭: ${this.escapeHtml(rule.closeUrl || '')}</div>` : ''}
             ${additionalParams ? `<div class="rule-detail-item"><span class="rule-detail-label">额外参数:</span> ${this.escapeHtml(additionalParams)}</div>` : ''}
           </div>
           <div class="rule-actions">
             <button class="btn btn-secondary" data-action="edit" data-rule-id="${rule.id}">编辑</button>
             <button class="btn btn-secondary" data-action="toggle" data-rule-id="${rule.id}">${rule.enabled ? '禁用' : '启用'}</button>
             <button class="btn btn-danger" data-action="delete" data-rule-id="${rule.id}">删除</button>
           </div>
         </div>
       `
     }).join('')
  }

  showModal(rule = null) {
    showDebug(`showModal called for rule: ${rule ? rule.id : 'new'}`)
    this.editingRuleId = rule ? rule.id : null
    const modal = document.getElementById('ruleModal')
    const form = document.getElementById('ruleForm')
    const title = document.getElementById('modalTitle')
    
    if (!modal || !form || !title) {
      showDebug('Error: Modal elements not found')
      return
    }
    
    // Reset form
    form.reset()
    
    // Clear parameters container
    const container = document.getElementById('additionalParamsContainer')
    container.innerHTML = this.createParameterRow()
    
    // Clear query match container
    const queryContainer = document.getElementById('queryMatchContainer')
    queryContainer.innerHTML = this.createQueryMatchRow()
    
    if (rule) {
      // Edit mode
      title.textContent = '编辑重定向规则'
      document.getElementById('ruleName').value = rule.name
      document.getElementById('sourcePrefix').value = rule.sourcePrefix
      document.getElementById('targetUrl').value = rule.targetUrl
      document.getElementById('preserveQueryParams').checked = rule.preserveQueryParams || false
      document.getElementById('preservePath').checked = rule.preservePath || false
      document.getElementById('autoCloseTab').checked = rule.autoCloseTab || false
      document.getElementById('closeUrl').value = rule.closeUrl || ''
      document.getElementById('ruleEnabled').checked = rule.enabled !== false
      
      // Show/hide close URL group
      const closeUrlGroup = document.getElementById('closeUrlGroup')
      closeUrlGroup.style.display = rule.autoCloseTab ? 'block' : 'none'
      
      // Populate parameters
      if (rule.additionalParams) {
        container.innerHTML = ''
        Object.entries(rule.additionalParams).forEach(([key, value]) => {
          const row = this.createParameterRowElement(key, value)
          container.appendChild(row)
        })
        
        if (Object.keys(rule.additionalParams).length === 0) {
          container.innerHTML = this.createParameterRow()
        }
      }
      
      // Populate query matches
      if (rule.queryParamMatches) {
        const queryContainer = document.getElementById('queryMatchContainer')
        queryContainer.innerHTML = ''
        rule.queryParamMatches.forEach(match => {
          const row = this.createQueryMatchRowElement(match.key, match.matchType, match.value)
          queryContainer.appendChild(row)
        })
        
        if (rule.queryParamMatches.length === 0) {
          queryContainer.innerHTML = this.createQueryMatchRow()
        }
      }
    } else {
      // Add mode
      title.textContent = '添加重定向规则'
      document.getElementById('preserveQueryParams').checked = true
      document.getElementById('ruleEnabled').checked = true
    }
    
    modal.style.display = 'block'
  }

  hideModal() {
    document.getElementById('ruleModal').style.display = 'none'
    this.editingRuleId = null
    // Reset close URL group visibility
    document.getElementById('closeUrlGroup').style.display = 'none'
  }

  createParameterRow(key = '', value = '') {
    return `
      <div class="param-row">
        <input type="text" placeholder="参数名" class="param-key" value="${this.escapeHtml(key)}">
        <input type="text" placeholder="参数值" class="param-value" value="${this.escapeHtml(value)}">
        <button type="button" class="btn-remove param-remove">×</button>
      </div>
    `
  }

  createParameterRowElement(key = '', value = '') {
    const div = document.createElement('div')
    div.className = 'param-row'
    div.innerHTML = `
      <input type="text" placeholder="参数名" class="param-key" value="${this.escapeHtml(key)}">
      <input type="text" placeholder="参数值" class="param-value" value="${this.escapeHtml(value)}">
      <button type="button" class="btn-remove param-remove">×</button>
    `
    return div
  }

  addParameterRow() {
    const container = document.getElementById('additionalParamsContainer')
    const row = this.createParameterRowElement()
    container.appendChild(row)
  }

  createQueryMatchRow(key = '', matchType = 'exact', value = '') {
    return `
      <div class="query-match-row">
        <input type="text" placeholder="参数名" class="query-key" value="${this.escapeHtml(key)}">
        <select class="query-match-type">
          <option value="exact" ${matchType === 'exact' ? 'selected' : ''}>完全匹配</option>
          <option value="contains" ${matchType === 'contains' ? 'selected' : ''}>包含</option>
          <option value="startsWith" ${matchType === 'startsWith' ? 'selected' : ''}>开头匹配</option>
          <option value="endsWith" ${matchType === 'endsWith' ? 'selected' : ''}>结尾匹配</option>
          <option value="exists" ${matchType === 'exists' ? 'selected' : ''}>存在即可</option>
          <option value="notExists" ${matchType === 'notExists' ? 'selected' : ''}>不存在</option>
        </select>
        <input type="text" placeholder="参数值" class="query-value" value="${this.escapeHtml(value)}">
        <button type="button" class="btn-remove query-remove">×</button>
      </div>
    `
  }

  createQueryMatchRowElement(key = '', matchType = 'exact', value = '') {
    const div = document.createElement('div')
    div.className = 'query-match-row'
    div.innerHTML = `
      <input type="text" placeholder="参数名" class="query-key" value="${this.escapeHtml(key)}">
      <select class="query-match-type">
        <option value="exact" ${matchType === 'exact' ? 'selected' : ''}>完全匹配</option>
        <option value="contains" ${matchType === 'contains' ? 'selected' : ''}>包含</option>
        <option value="startsWith" ${matchType === 'startsWith' ? 'selected' : ''}>开头匹配</option>
        <option value="endsWith" ${matchType === 'endsWith' ? 'selected' : ''}>结尾匹配</option>
        <option value="exists" ${matchType === 'exists' ? 'selected' : ''}>存在即可</option>
        <option value="notExists" ${matchType === 'notExists' ? 'selected' : ''}>不存在</option>
      </select>
      <input type="text" placeholder="参数值" class="query-value" value="${this.escapeHtml(value)}">
      <button type="button" class="btn-remove query-remove">×</button>
    `
    return div
  }

  addQueryMatchRow() {
    const container = document.getElementById('queryMatchContainer')
    const row = this.createQueryMatchRowElement()
    container.appendChild(row)
  }

  getMatchTypeLabel(matchType) {
    const labels = {
      'exact': '=',
      'contains': '包含',
      'startsWith': '开头是',
      'endsWith': '结尾是',
      'exists': '存在',
      'notExists': '不存在'
    }
    return labels[matchType] || '='
  }

  async saveRule() {
    const name = document.getElementById('ruleName').value.trim()
    const sourcePrefix = document.getElementById('sourcePrefix').value.trim()
    const targetUrl = document.getElementById('targetUrl').value.trim()
    const preserveQueryParams = document.getElementById('preserveQueryParams').checked
    const preservePath = document.getElementById('preservePath').checked
    const autoCloseTab = document.getElementById('autoCloseTab').checked
    const closeUrl = document.getElementById('closeUrl').value.trim()
    const enabled = document.getElementById('ruleEnabled').checked

    // Validation
    if (!name || !sourcePrefix || !targetUrl) {
      alert('请填写规则名称、源URL前缀和目标URL')
      return
    }

    if (autoCloseTab && !closeUrl) {
      alert('启用自动关闭标签页时必须填写关闭触发URL')
      return
    }

    try {
      new URL(sourcePrefix)
      new URL(targetUrl)
      if (autoCloseTab && closeUrl) {
        new URL(closeUrl)
      }
    } catch (error) {
      alert('请输入有效的URL格式')
      return
    }

    // Collect additional parameters
    const additionalParams = {}
    document.querySelectorAll('#additionalParamsContainer .param-row').forEach(row => {
      const key = row.querySelector('.param-key').value.trim()
      const value = row.querySelector('.param-value').value.trim()
      if (key && value) {
        additionalParams[key] = value
      }
    })

    // Collect query parameter matches
    const queryParamMatches = []
    document.querySelectorAll('#queryMatchContainer .query-match-row').forEach(row => {
      const key = row.querySelector('.query-key').value.trim()
      const matchType = row.querySelector('.query-match-type').value
      const value = row.querySelector('.query-value').value.trim()
      
      if (key && (matchType === 'exists' || matchType === 'notExists' || value)) {
        queryParamMatches.push({
          key,
          matchType,
          value: (matchType === 'exists' || matchType === 'notExists') ? '' : value
        })
      }
    })

    const ruleData = {
      name,
      sourcePrefix,
      targetUrl,
      preserveQueryParams,
      preservePath,
      autoCloseTab,
      closeUrl: autoCloseTab ? closeUrl : null,
      enabled,
      additionalParams: Object.keys(additionalParams).length > 0 ? additionalParams : null,
      queryParamMatches: queryParamMatches.length > 0 ? queryParamMatches : null
    }

    try {
      let response
      if (this.editingRuleId) {
        // Update existing rule
        response = await chrome.runtime.sendMessage({
          action: 'updateRule',
          id: this.editingRuleId,
          rule: ruleData
        })
      } else {
        // Add new rule
        response = await chrome.runtime.sendMessage({
          action: 'addRule',
          rule: ruleData
        })
      }

      if (response.success) {
        this.hideModal()
        await this.loadRules()
        this.renderRules()
      } else {
        alert('保存规则失败: ' + (response.error || '未知错误'))
      }
    } catch (error) {
      console.error('Error saving rule:', error)
      alert('保存规则失败')
    }
  }

  editRule(ruleId) {
    const rule = this.rules.find(r => r.id === ruleId)
    if (rule) {
      this.showModal(rule)
    }
  }

  async toggleRule(ruleId) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'toggleRule',
        id: ruleId
      })

      if (response.success) {
        await this.loadRules()
        this.renderRules()
      } else {
        alert('切换规则状态失败: ' + (response.error || '未知错误'))
      }
    } catch (error) {
      console.error('Error toggling rule:', error)
      alert('切换规则状态失败')
    }
  }

  async deleteRule(ruleId) {
    if (!confirm('确定要删除这个规则吗？')) {
      return
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'deleteRule',
        id: ruleId
      })

      if (response.success) {
        await this.loadRules()
        this.renderRules()
      } else {
        alert('删除规则失败: ' + (response.error || '未知错误'))
      }
    } catch (error) {
      console.error('Error deleting rule:', error)
      alert('删除规则失败')
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  async showSettingsModal() {
    // Load current settings
    const response = await chrome.runtime.sendMessage({ action: 'getSettings' })
    if (response.success) {
      document.getElementById('cooldownPeriod').value = response.settings.cooldownPeriod / 1000
    }
    
    document.getElementById('settingsModal').style.display = 'block'
  }

  hideSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none'
  }

  async saveSettings() {
    const cooldownPeriod = parseInt(document.getElementById('cooldownPeriod').value) * 1000
    
    const response = await chrome.runtime.sendMessage({ 
      action: 'saveSettings', 
      settings: { cooldownPeriod }
    })
    
    if (response.success) {
      this.hideSettingsModal()
      showDebug('设置已保存')
    } else {
      showDebug('保存设置失败: ' + response.error)
    }
  }

  async clearCooldown() {
    const response = await chrome.runtime.sendMessage({ action: 'clearCooldown' })
    
    if (response.success) {
      showDebug('冷却记录已清除')
    } else {
      showDebug('清除冷却记录失败: ' + response.error)
    }
  }
}

// Debug helper
function showDebug(message) {
  const debugInfo = document.getElementById('debugInfo')
  const debugMessages = document.getElementById('debugMessages')
  if (debugInfo && debugMessages) {
    debugInfo.style.display = 'block'
    debugMessages.innerHTML += '<div>' + new Date().toLocaleTimeString() + ': ' + message + '</div>'
  }
  console.log(message)
}

// Initialize popup manager when DOM is loaded
function initializePopup() {
  showDebug('Initializing popup manager')
  try {
    const popupManager = new PopupManager()
    // Make it globally available for onclick handlers
    window.popupManager = popupManager
    showDebug('Popup manager initialized successfully')
  } catch (error) {
    showDebug('Error initializing popup manager: ' + error.message)
    console.error('Error initializing popup manager:', error)
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePopup)
} else {
  // DOM is already loaded
  initializePopup()
} 