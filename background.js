// Background service worker for URL prefix redirection using declarativeNetRequest
class URLPrefixRedirector {
  constructor() {
    this.redirectRules = []
    this.ruleIdCounter = 1
    this.recentRedirects = new Map() // 记录最近的重定向 {ruleId: {url: string, timestamp: number}}
    this.cooldownPeriod = 10000 // 10秒冷却期
    this.pendingCloses = new Map() // 记录等待关闭的标签页 {tabId: {ruleId: string, closeUrl: string, timestamp: number}}
    this.init()
  }

  async init() {
    // Load saved redirect rules and settings from storage
    const data = await chrome.storage.sync.get(['redirectRules', 'cooldownPeriod'])
    this.redirectRules = data.redirectRules || []
    this.cooldownPeriod = data.cooldownPeriod || 10000
    
    console.log('🚀 Initializing URL Prefix Redirector with', this.redirectRules.length, 'rules')
    console.log('📋 Rules:', this.redirectRules)
    
    // Note: We're using webNavigation for all redirects to support cooldown
    // await this.updateDeclarativeRules()
    
    // Listen for navigation events to handle all redirects with cooldown
    chrome.webNavigation.onBeforeNavigate.addListener((details) => {
      if (details.frameId === 0) {
        this.handleRedirectWithCooldown(details.url, details.tabId)
      }
    })

    // Listen for navigation completion to handle tab closing
    chrome.webNavigation.onCompleted.addListener((details) => {
      if (details.frameId === 0) {
        this.handleNavigationCompleted(details.url, details.tabId)
      }
    })
    
    // Listen for storage changes to update rules
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && changes.redirectRules) {
        console.log('📝 Rules updated, reloading...')
        this.redirectRules = changes.redirectRules.newValue || []
        // this.updateDeclarativeRules() // Disabled for cooldown support
      }
    })

    console.log('✅ URL Prefix Redirector initialized successfully')
  }

  async updateDeclarativeRules() {
    try {
      // Clear existing rules
      const existingRules = await chrome.declarativeNetRequest.getDynamicRules()
      const ruleIdsToRemove = existingRules.map(rule => rule.id)
      
      if (ruleIdsToRemove.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: ruleIdsToRemove
        })
      }

      // Convert our rules to declarative format
      const declarativeRules = []
      this.ruleIdCounter = 1

      for (const rule of this.redirectRules) {
        if (!rule.enabled) continue

        try {
          const declarativeRule = this.convertToDeclarativeRule(rule)
          if (declarativeRule) {
            declarativeRules.push(declarativeRule)
          }
        } catch (error) {
          console.error(`Error converting rule "${rule.name}":`, error)
        }
      }

      // Add new rules
      if (declarativeRules.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          addRules: declarativeRules
        })
        console.log(`✅ Updated ${declarativeRules.length} declarative rules`)
      } else {
        console.log('ℹ️ No enabled rules to apply')
      }

    } catch (error) {
      console.error('Error updating declarative rules:', error)
    }
  }

  handleRedirectWithCooldown(url, tabId) {
    if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
      return
    }

    console.log(`🔍 Checking for redirect with cooldown: ${url}`)

    for (const rule of this.redirectRules) {
      if (!rule.enabled) continue
      
      if (this.matchesRule(url, rule)) {
        // Check cooldown period
        if (this.isInCooldown(rule.id, url)) {
          console.log(`❄️ Rule "${rule.name}" is in cooldown period, skipping redirect`)
          continue
        }

        console.log(`✅ Redirect match for rule: ${rule.name}`)
        
        // Check if this rule needs complex processing
        const needsComplexProcessing = rule.preserveQueryParams || 
                                     rule.preservePath || 
                                     (rule.additionalParams && Object.keys(rule.additionalParams).length > 0)
        
        let redirectUrl
        if (needsComplexProcessing) {
          redirectUrl = this.buildComplexRedirectUrl(url, rule)
          console.log(`🚀 Complex redirecting to: ${redirectUrl}`)
        } else {
          redirectUrl = rule.targetUrl
          console.log(`🚀 Simple redirecting to: ${redirectUrl}`)
        }
        
        // Record this redirect
        this.recordRedirect(rule.id, url)
        
        // If this rule has auto-close enabled, record it for later
        if (rule.autoCloseTab && rule.closeUrl) {
          this.pendingCloses.set(tabId, {
            ruleId: rule.id,
            closeUrl: rule.closeUrl,
            timestamp: Date.now()
          })
          console.log(`📌 Scheduled tab close for ${rule.closeUrl}`)
        }
        
        // Use tabs API for redirects
        chrome.tabs.update(tabId, { url: redirectUrl })
        return // Only apply first matching rule
      }
    }
  }

  handleNavigationCompleted(url, tabId) {
    const pendingClose = this.pendingCloses.get(tabId)
    if (!pendingClose) {
      return
    }

    console.log(`🔍 Checking completed navigation: ${url}`)
    console.log(`📋 Pending close for: ${pendingClose.closeUrl}`)

    // Check if current URL matches the close URL
    if (this.matchesCloseUrl(url, pendingClose.closeUrl)) {
      console.log(`✅ URL matches close trigger, closing tab ${tabId}`)
      
      // Close the tab after a short delay to ensure page is fully loaded
      setTimeout(() => {
        chrome.tabs.remove(tabId, () => {
          if (chrome.runtime.lastError) {
            console.error('Error closing tab:', chrome.runtime.lastError)
          } else {
            console.log(`🗙 Tab ${tabId} closed successfully`)
          }
        })
      }, 1000) // 1 second delay
      
      // Remove from pending closes
      this.pendingCloses.delete(tabId)
    } else {
      // Check if this pending close is too old (5 minutes)
      const age = Date.now() - pendingClose.timestamp
      if (age > 300000) { // 5 minutes
        console.log(`⏰ Pending close for tab ${tabId} expired, removing`)
        this.pendingCloses.delete(tabId)
      }
    }
  }

  matchesCloseUrl(currentUrl, closeUrl) {
    try {
      const current = new URL(currentUrl)
      const close = new URL(closeUrl)
      
      // Simple exact match for now
      // Could be enhanced to support patterns
      return current.href === close.href
    } catch (error) {
      console.error('Error matching close URL:', error)
      return false
    }
  }

  matchesRule(url, rule) {
    try {
      // Check prefix match
      if (!this.matchesPrefix(url, rule.sourcePrefix)) {
        return false
      }
      
      // Check query parameter matches if specified
      if (rule.queryParamMatches && rule.queryParamMatches.length > 0) {
        return this.matchesQueryParams(url, rule.queryParamMatches)
      }
      
      return true
    } catch (error) {
      console.error('Error matching rule:', error)
      return false
    }
  }

  matchesPrefix(url, prefix) {
    try {
      const urlObj = new URL(url)
      const prefixObj = new URL(prefix)
      
      // Build base URL without query parameters and hash
      const baseUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? ':' + urlObj.port : ''}${urlObj.pathname}`
      const basePrefix = `${prefixObj.protocol}//${prefixObj.hostname}${prefixObj.port ? ':' + prefixObj.port : ''}${prefixObj.pathname}`
      
      console.log(`🔍 Prefix matching: ${baseUrl} starts with ${basePrefix}`)
      
      return baseUrl.startsWith(basePrefix)
    } catch (error) {
      console.error('Error parsing URL:', error)
      return false
    }
  }

  matchesQueryParams(url, queryParamMatches) {
    try {
      const urlObj = new URL(url)
      
      for (const match of queryParamMatches) {
        const actualValue = urlObj.searchParams.get(match.key)
        
        if (!this.matchesQueryParam(actualValue, match)) {
          return false
        }
      }
      
      return true
    } catch (error) {
      console.error('Error matching query parameters:', error)
      return false
    }
  }

  matchesQueryParam(actualValue, matchConfig) {
    const { key, value, matchType } = matchConfig
    
    switch (matchType) {
      case 'exists':
        return actualValue !== null
      case 'exact':
        return actualValue === value
      case 'contains':
        return actualValue && actualValue.includes(value)
      case 'startsWith':
        return actualValue && actualValue.startsWith(value)
      case 'endsWith':
        return actualValue && actualValue.endsWith(value)
      case 'notExists':
        return actualValue === null
      default:
        return actualValue === value
    }
  }

  buildComplexRedirectUrl(originalUrl, rule) {
    try {
      const originalUrlObj = new URL(originalUrl)
      const targetUrlObj = new URL(rule.targetUrl)
      
      // Preserve original query parameters
      if (rule.preserveQueryParams) {
        originalUrlObj.searchParams.forEach((value, key) => {
          targetUrlObj.searchParams.set(key, value)
        })
      }
      
      // Add additional query parameters
      if (rule.additionalParams) {
        for (const [key, value] of Object.entries(rule.additionalParams)) {
          targetUrlObj.searchParams.set(key, value)
        }
      }
      
      // Add original path if specified
      if (rule.preservePath) {
        const originalPath = originalUrlObj.pathname
        if (originalPath && originalPath !== '/') {
          targetUrlObj.pathname = targetUrlObj.pathname.replace(/\/$/, '') + originalPath
        }
      }
      
      return targetUrlObj.toString()
      
    } catch (error) {
      console.error('Error building complex redirect URL:', error)
      return rule.targetUrl
    }
  }

  isInCooldown(ruleId, url) {
    const recent = this.recentRedirects.get(ruleId)
    if (!recent) {
      return false
    }
    
    const now = Date.now()
    const timeDiff = now - recent.timestamp
    
    // 如果超过冷却期，清除记录
    if (timeDiff > this.cooldownPeriod) {
      this.recentRedirects.delete(ruleId)
      return false
    }
    
    // 检查是否是相同的URL（避免不同URL触发相同规则时被误拦截）
    const recentBaseUrl = this.getBaseUrl(recent.url)
    const currentBaseUrl = this.getBaseUrl(url)
    
    return recentBaseUrl === currentBaseUrl
  }

  recordRedirect(ruleId, url) {
    this.recentRedirects.set(ruleId, {
      url: url,
      timestamp: Date.now()
    })
    
    console.log(`📝 Recorded redirect for rule ${ruleId}, cooldown until ${new Date(Date.now() + this.cooldownPeriod).toLocaleTimeString()}`)
  }

  getBaseUrl(url) {
    try {
      const urlObj = new URL(url)
      return `${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? ':' + urlObj.port : ''}${urlObj.pathname}`
    } catch (error) {
      return url
    }
  }

  convertToDeclarativeRule(rule) {
    try {
      // Check if this rule needs complex processing
      const needsComplexProcessing = rule.preserveQueryParams || 
                                   rule.preservePath || 
                                   (rule.additionalParams && Object.keys(rule.additionalParams).length > 0) ||
                                   (rule.queryParamMatches && rule.queryParamMatches.length > 0)
      
      // Skip declarative rules for complex cases, let webNavigation handle them
      if (needsComplexProcessing) {
        console.log(`📝 Skipping declarative rule for complex case: "${rule.name}"`)
        return null
      }

      const sourceUrl = new URL(rule.sourcePrefix)
      
      // Build URL filter
      let urlFilter = `${sourceUrl.protocol}//${sourceUrl.hostname}`
      if (sourceUrl.port) {
        urlFilter += `:${sourceUrl.port}`
      }
      if (sourceUrl.pathname && sourceUrl.pathname !== '/') {
        urlFilter += sourceUrl.pathname
      }
      
      // Simple redirect rule for basic cases
      const declarativeRule = {
        id: this.ruleIdCounter++,
        priority: 1,
        action: {
          type: 'redirect',
          redirect: {
            url: rule.targetUrl
          }
        },
        condition: {
          urlFilter: urlFilter,
          resourceTypes: ['main_frame']
        }
      }

      console.log(`📝 Created declarative rule for "${rule.name}":`, declarativeRule)
      return declarativeRule

    } catch (error) {
      console.error(`Error creating declarative rule for "${rule.name}":`, error)
      return null
    }
  }



  // Legacy methods for compatibility with popup interface
  async addRule(rule) {
    // Validate rule
    if (!rule.name || !rule.sourcePrefix || !rule.targetUrl) {
      throw new Error('Rule must have name, sourcePrefix, and targetUrl')
    }
    
    // Validate URLs
    try {
      new URL(rule.sourcePrefix)
      new URL(rule.targetUrl)
    } catch (error) {
      throw new Error('Invalid URL format')
    }
    
    this.redirectRules.push({
      id: Date.now().toString(),
      ...rule,
      enabled: rule.enabled !== false
    })
    
    await this.saveRules()
    await this.updateDeclarativeRules()
  }

  async updateRule(id, updatedRule) {
    const index = this.redirectRules.findIndex(rule => rule.id === id)
    if (index === -1) {
      throw new Error('Rule not found')
    }
    
    this.redirectRules[index] = { ...this.redirectRules[index], ...updatedRule }
    await this.saveRules()
    await this.updateDeclarativeRules()
  }

  async deleteRule(id) {
    const index = this.redirectRules.findIndex(rule => rule.id === id)
    if (index === -1) {
      throw new Error('Rule not found')
    }
    
    this.redirectRules.splice(index, 1)
    await this.saveRules()
    await this.updateDeclarativeRules()
  }

  async toggleRule(id) {
    const rule = this.redirectRules.find(rule => rule.id === id)
    if (!rule) {
      throw new Error('Rule not found')
    }
    
    rule.enabled = !rule.enabled
    await this.saveRules()
    await this.updateDeclarativeRules()
  }

  async saveRules() {
    await chrome.storage.sync.set({ redirectRules: this.redirectRules })
  }

  getRules() {
    return this.redirectRules
  }
}

// Initialize the redirector
const redirector = new URLPrefixRedirector()

// Expose methods for popup communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.action) {
        case 'getRules':
          sendResponse({ success: true, rules: redirector.getRules() })
          break
        case 'addRule':
          await redirector.addRule(message.rule)
          sendResponse({ success: true })
          break
        case 'updateRule':
          await redirector.updateRule(message.id, message.rule)
          sendResponse({ success: true })
          break
        case 'deleteRule':
          await redirector.deleteRule(message.id)
          sendResponse({ success: true })
          break
        case 'toggleRule':
          await redirector.toggleRule(message.id)
          sendResponse({ success: true })
          break
        case 'getSettings':
          sendResponse({ success: true, settings: { cooldownPeriod: redirector.cooldownPeriod } })
          break
        case 'saveSettings':
          redirector.cooldownPeriod = message.settings.cooldownPeriod
          await chrome.storage.sync.set({ cooldownPeriod: message.settings.cooldownPeriod })
          sendResponse({ success: true })
          break
        case 'clearCooldown':
          redirector.recentRedirects.clear()
          redirector.pendingCloses.clear()
          sendResponse({ success: true })
          break
        default:
          sendResponse({ success: false, error: 'Unknown action' })
      }
    } catch (error) {
      console.error('Error handling message:', error)
      sendResponse({ success: false, error: error.message })
    }
  })()
  
  return true // Keep message channel open for async response
}) 